import { describe, expect, it, vi } from "vitest";

import { createQueryTaskInPeriodTool } from "#tools/queryTaskInPeriod.js";
import type { PodStore } from "#types/store.js";
import { TaskStatus, TimeScope } from "#types/task.js";

function createStore(): PodStore {
    return {
        queryTasks: vi.fn(() => []),
        queryTaskById: vi.fn(() => []),
        queryTasksInPeriod: vi.fn(() => []),
        queryCaptures: vi.fn(() => []),
        queryCaptureById: vi.fn(() => []),
        writeCapture: vi.fn(),
        writeTaskWithCapture: vi.fn()
    };
}

const period = {
    start: "2026-01-08T00:00:00.000Z",
    end: "2026-01-12T00:00:00.000Z"
};

const task = {
    id: "task-1",
    title: "Review tests",
    description: "Review unit tests",
    status: TaskStatus.Pending,
    time_scope: TimeScope.Day,
    start_date: "2026-01-09T00:00:00.000Z",
    due_date: "2026-01-10T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z"
};

describe("query_task_in_period tool", () => {
    it("passes the period and limit to the store and reports the match count", async () => {
        const store = createStore();
        vi.mocked(store.queryTasksInPeriod).mockReturnValue([task]);

        const result = await createQueryTaskInPeriodTool(store).execute("call-1", {
            ...period,
            limit: 5
        });

        expect(store.queryTasksInPeriod).toHaveBeenCalledWith({ ...period, limit: 5 });
        expect(result.isError).not.toBe(true);
        expect(result.content[0]?.text).toBe("Found 1 task(s):");
        expect(result.content.map((item) => item.text).join("\n")).toContain("Title: Review tests");
    });

    it("reports zero matches without error", async () => {
        const store = createStore();
        const result = await createQueryTaskInPeriodTool(store).execute("call-1", {
            ...period,
            limit: 5
        });

        expect(result.isError).not.toBe(true);
        expect(result.content[0]?.text).toBe("Found 0 task(s):");
    });

    it("requires both period boundaries and does not query when one is missing", async () => {
        const store = createStore();
        const tool = createQueryTaskInPeriodTool(store);

        const missingEnd = await tool.execute("call-1", { start: period.start });
        const missingStart = await tool.execute("call-2", { end: period.end });

        expect(missingEnd.isError).toBe(true);
        expect(missingStart.isError).toBe(true);
        expect(store.queryTasksInPeriod).not.toHaveBeenCalled();
    });

    it.each([0, 501])("rejects limit %i outside 1..500 without querying", async (limit) => {
        const store = createStore();
        const result = await createQueryTaskInPeriodTool(store).execute("call-1", {
            ...period,
            limit
        });

        expect(result.isError).toBe(true);
        expect(store.queryTasksInPeriod).not.toHaveBeenCalled();
    });

    it("returns store failures as tool errors", async () => {
        const store = createStore();
        vi.mocked(store.queryTasksInPeriod).mockImplementation(() => {
            throw new Error("database is closed");
        });

        const result = await createQueryTaskInPeriodTool(store).execute("call-1", period);

        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("database is closed");
    });
});
