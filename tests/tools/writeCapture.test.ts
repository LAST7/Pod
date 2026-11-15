import { describe, expect, it, vi } from "vitest";

import { createWriteCaptureTool } from "#tools/writeCapture.js";
import type { PodStore } from "#types/store.js";

function createStore(): PodStore {
    return {
        queryTasks: vi.fn(() => []),
        queryTaskById: vi.fn(() => []),
        queryCaptures: vi.fn(() => []),
        queryCaptureById: vi.fn(() => []),
        writeCapture: vi.fn(),
        writeTaskWithCapture: vi.fn()
    };
}

describe("write_capture tool", () => {
    it("trims and saves raw capture with default text source", async () => {
        const store = createStore();
        const tool = createWriteCaptureTool(store);

        const result = await tool.execute("call-1", { rawContent: "  Remember this.  " });

        expect(store.writeCapture).toHaveBeenCalledOnce();
        expect(vi.mocked(store.writeCapture).mock.calls[0]![0]).toMatchObject({
            raw_content: "Remember this.",
            source_type: "text",
            created_at: null
        });
        expect(result.isError).not.toBe(true);
    });

    it("returns an error for invalid input without writing", async () => {
        const store = createStore();
        const result = await createWriteCaptureTool(store).execute("call-1", { rawContent: "" });

        expect(result.isError).toBe(true);
        expect(store.writeCapture).not.toHaveBeenCalled();
    });

    it("does not hide store failures", async () => {
        const store = createStore();
        vi.mocked(store.writeCapture).mockImplementation(() => {
            throw new Error("write failed");
        });

        const result = await createWriteCaptureTool(store).execute("call-1", {
            rawContent: "capture"
        });
        expect(result.isError).toBe(true);
        expect(result.content[0]?.text).toContain("write failed");
    });
});
