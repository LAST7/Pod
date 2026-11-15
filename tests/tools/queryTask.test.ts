import { describe, expect, it, vi } from "vitest";

import { createQueryTaskTool } from "#tools/queryTask.js";
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

const task = {
    id: "task-1",
    title: "Review tests",
    description: "Review unit tests",
    status: TaskStatus.Pending,
    time_scope: TimeScope.Day,
    start_date: null,
    due_date: null,
    created_at: "2026-01-01T00:00:00.000Z"
};

describe("query_task tool", () => {
    it("uses the exact-id lookup for a UUID", async () => {
        const store = createStore();
        vi.mocked(store.queryTaskById).mockReturnValue([task]);

        const result = await createQueryTaskTool(store).execute("call-1", {
            id: "123e4567-e89b-12d3-a456-426614174000"
        });

        expect(store.queryTaskById).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000");
        expect(store.queryTasks).not.toHaveBeenCalled();
        expect(result.content.map((item) => item.text).join("\n")).toContain("Review tests");
    });

    it("returns a tool error for invalid parameters and does not query", async () => {
        const store = createStore();
        const result = await createQueryTaskTool(store).execute("call-1", { limit: -1 });

        expect(result.isError).toBe(true);
        expect(store.queryTasks).not.toHaveBeenCalled();
        expect(store.queryTaskById).not.toHaveBeenCalled();
    });

    it("rejects the removed before/after parameters without querying", async () => {
        const store = createStore();
        const result = await createQueryTaskTool(store).execute("call-1", {
            before: "2026-01-01T00:00:00.000Z"
        });

        expect(result.isError).toBe(true);
        expect(store.queryTasks).not.toHaveBeenCalled();
    });
});
