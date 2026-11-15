import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";

import { createSqliteTaskStore } from "#db/store/sqlite/tasks.js";
import { TaskStatus, TimeScope, type Task } from "#types/task.js";
import type { Capture } from "#types/capture.js";
import { createTestDatabase } from "../../helpers/database.js";

const capture: Capture = {
    id: "capture-1",
    raw_content: "Original task request",
    source_type: "text",
    created_at: null
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
        created_at: null,
        ...overrides
    };
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

    it("returns an empty list for an unknown task id", () => {
        expect(createSqliteTaskStore(db).queryTaskById("missing")).toEqual([]);
    });

    it("filters tasks by status and title and applies the limit", () => {
        const store = createSqliteTaskStore(db);
        for (const [id, title] of [
            ["task-1", "Write tests"],
            ["task-2", "Review tests"],
            ["task-3", "Write docs"]
        ] as const) {
            store.writeTaskWithCapture(
                { ...capture, id: `capture-${id}`, raw_content: title },
                makeTask({ id, title })
            );
        }

        expect(store.queryTasks({ title: "Write tests", limit: 1 })).toMatchObject([
            { id: "task-1", title: "Write tests" }
        ]);
        expect(store.queryTasks({ title: "Review tests" })).toMatchObject([
            { id: "task-2", title: "Review tests" }
        ]);
    });

    it("rejects an invalid time range", () => {
        const store = createSqliteTaskStore(db);
        expect(() =>
            store.queryTasks({
                after: "2026-01-02T00:00:00.000Z",
                before: "2026-01-01T00:00:00.000Z"
            })
        ).toThrow(/after must be earlier than before/i);
    });
});
