import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";

import { createSqliteTaskStore } from "#db/store/sqlite/tasks.js";
import { TaskStatus, TimeScope, type Task } from "#types/task.js";
import type { Capture } from "#types/capture.js";
import type { TaskStore } from "#types/store.js";
import { createTestDatabase } from "../../helpers/database.js";

const capture: Capture = {
    id: "capture-1",
    raw_content: "Original task request",
    source_type: "text",
    created_at: "2026-01-01T00:00:00.000Z"
};

function makeTask(overrides: Partial<Task> = {}): Task {
    return {
        id: "task-1",
        title: "Write tests",
        description: "Cover the task store",
        status: TaskStatus.Pending,
        time_scope: TimeScope.Day,
        start_date: null,
        due_date: null,
        created_at: "2026-01-01T00:00:00.000Z",
        ...overrides
    };
}

function writeTask(store: TaskStore, id: string, overrides: Partial<Task> = {}) {
    store.writeTaskWithCapture(
        { ...capture, id: `capture-${id}`, raw_content: `raw ${id}` },
        makeTask({ id, ...overrides })
    );
}

describe("SQLite TaskStore", () => {
    let db: Database.Database;

    beforeEach(() => {
        db = createTestDatabase();
    });

    afterEach(() => db.close());

    it("writes capture and task atomically with the capture foreign key", () => {
        const store = createSqliteTaskStore(db);
        store.writeTaskWithCapture(capture, makeTask());

        expect(store.queryTaskById("task-1")).toMatchObject([
            { id: "task-1", title: "Write tests", status: "pending", capture_id: "capture-1" }
        ]);
        expect(
            db.prepare("SELECT raw_content FROM captures WHERE id = ?").get("capture-1")
        ).toEqual({ raw_content: "Original task request" });
    });

    it("rolls back the capture when task insertion violates a constraint", () => {
        const store = createSqliteTaskStore(db);
        store.writeTaskWithCapture(capture, makeTask());

        expect(() =>
            store.writeTaskWithCapture(
                { ...capture, id: "capture-2", raw_content: "Should roll back" },
                makeTask({ id: "task-1" })
            )
        ).toThrow();

        expect(db.prepare("SELECT id FROM captures WHERE id = ?").get("capture-2")).toBeUndefined();
    });

    it("persists the status it was given", () => {
        const store = createSqliteTaskStore(db);
        writeTask(store, "task-1", { status: TaskStatus.Done });

        expect(store.queryTaskById("task-1")).toMatchObject([{ id: "task-1", status: "done" }]);
    });

    it("returns an empty list for an unknown task id", () => {
        expect(createSqliteTaskStore(db).queryTaskById("missing")).toEqual([]);
    });

    it("filters tasks by title and applies the limit", () => {
        const store = createSqliteTaskStore(db);
        writeTask(store, "task-1", { title: "Write tests" });
        writeTask(store, "task-2", { title: "Review tests" });
        writeTask(store, "task-3", { title: "Write docs" });

        expect(store.queryTasks({ title: "Write tests", limit: 1 })).toMatchObject([
            { id: "task-1", title: "Write tests" }
        ]);
        expect(store.queryTasks({ title: "Review tests" })).toMatchObject([
            { id: "task-2", title: "Review tests" }
        ]);
    });

    describe("queryTasksInPeriod", () => {
        const period = {
            start: "2026-01-08T00:00:00.000Z",
            end: "2026-01-12T00:00:00.000Z",
            limit: 50
        };

        it("returns tasks whose date span overlaps the period, inclusive at both boundaries", () => {
            const store = createSqliteTaskStore(db);
            writeTask(store, "overlap", {
                start_date: "2026-01-05T00:00:00.000Z",
                due_date: "2026-01-10T00:00:00.000Z"
            });
            writeTask(store, "spanning", {
                start_date: "2026-01-01T00:00:00.000Z",
                due_date: "2026-01-20T00:00:00.000Z"
            });
            writeTask(store, "starts-at-end", {
                start_date: "2026-01-12T00:00:00.000Z",
                due_date: null
            });
            writeTask(store, "due-at-start", {
                start_date: null,
                due_date: "2026-01-08T00:00:00.000Z"
            });

            const ids = store.queryTasksInPeriod(period).map((task) => task.id);
            expect(ids.sort()).toEqual(["due-at-start", "overlap", "spanning", "starts-at-end"]);
        });

        it("excludes tasks that finish before or start after the period", () => {
            const store = createSqliteTaskStore(db);
            writeTask(store, "before", {
                start_date: "2026-01-01T00:00:00.000Z",
                due_date: "2026-01-03T00:00:00.000Z"
            });
            writeTask(store, "after", {
                start_date: "2026-01-13T00:00:00.000Z",
                due_date: "2026-01-20T00:00:00.000Z"
            });

            expect(store.queryTasksInPeriod(period)).toEqual([]);
        });

        it("orders by created_at descending and applies the limit", () => {
            const store = createSqliteTaskStore(db);
            const overlapping = {
                start_date: "2026-01-09T00:00:00.000Z",
                due_date: "2026-01-10T00:00:00.000Z"
            };
            writeTask(store, "a", { ...overlapping, created_at: "2026-01-01T00:00:00.000Z" });
            writeTask(store, "b", { ...overlapping, created_at: "2026-01-02T00:00:00.000Z" });
            writeTask(store, "c", { ...overlapping, created_at: "2026-01-03T00:00:00.000Z" });

            expect(
                store.queryTasksInPeriod({ ...period, limit: 2 }).map((task) => task.id)
            ).toEqual(["c", "b"]);
        });

        it("accepts options without an explicit limit", () => {
            const store = createSqliteTaskStore(db);
            writeTask(store, "overlap", {
                start_date: "2026-01-09T00:00:00.000Z",
                due_date: "2026-01-10T00:00:00.000Z"
            });

            expect(
                store.queryTasksInPeriod({ start: period.start, end: period.end }).map((t) => t.id)
            ).toEqual(["overlap"]);
        });
    });
});
