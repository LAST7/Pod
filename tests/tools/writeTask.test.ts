import { describe, expect, it, vi } from "vitest";

import { createWriteTaskTool } from "#tools/writeTask.js";
import { TaskStatus, TimeScope } from "#types/task.js";
import { SourceType } from "#types/capture.js";
import type { PodStore } from "#types/store.js";

const UTC_MILLIS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

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

describe("write_task tool", () => {
    it("validates input and creates a pending task linked to an original capture", async () => {
        const store = createStore();
        const tool = createWriteTaskTool(store);

        const result = await tool.execute("call-1", {
            rawContent: "  I should file the report.  ",
            title: "File the report",
            description: "Prepare and file the report"
        });

        expect(store.writeTaskWithCapture).toHaveBeenCalledOnce();
        const [capture, task] = vi.mocked(store.writeTaskWithCapture).mock.calls[0]!;
        expect(capture).toMatchObject({
            raw_content: "I should file the report.",
            source_type: SourceType.Text,
            created_at: expect.stringMatching(UTC_MILLIS)
        });
        expect(capture.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(task).toMatchObject({
            title: "File the report",
            description: "Prepare and file the report",
            status: TaskStatus.Pending,
            time_scope: TimeScope.Day,
            start_date: null,
            due_date: null,
            created_at: capture.created_at
        });
        expect(task.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(result.isError).not.toBe(true);
    });

    it("rejects malformed input without calling the store", async () => {
        const store = createStore();
        const tool = createWriteTaskTool(store);

        const result = await tool.execute("call-1", { rawContent: "missing task fields" });

        expect(result.isError).toBe(true);
        expect(store.writeTaskWithCapture).not.toHaveBeenCalled();
    });

    it("rejects whitespace-only capture and task titles", async () => {
        const store = createStore();
        const tool = createWriteTaskTool(store);
        const valid = { rawContent: "content", title: "title", description: "description" };

        await expect(tool.execute("call-1", { ...valid, rawContent: "   " })).rejects.toThrow(
            /raw content/i
        );
        await expect(tool.execute("call-2", { ...valid, title: "   " })).rejects.toThrow(/title/i);
        expect(store.writeTaskWithCapture).not.toHaveBeenCalled();
    });

    it("rethrows store write failures", async () => {
        const store = createStore();
        vi.mocked(store.writeTaskWithCapture).mockImplementation(() => {
            throw new Error("write failed");
        });
        const tool = createWriteTaskTool(store);

        await expect(
            tool.execute("call-1", {
                rawContent: "content",
                title: "task",
                description: "details"
            })
        ).rejects.toThrow("write failed");
    });
});
