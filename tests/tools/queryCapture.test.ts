import { describe, expect, it, vi } from "vitest";

import { createQueryCaptureTool } from "#tools/queryCapture.js";
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

describe("query_capture tool", () => {
    it("routes a valid UUID to exact lookup", async () => {
        const store = createStore();
        await createQueryCaptureTool(store).execute("call-1", {
            id: "123e4567-e89b-12d3-a456-426614174000"
        });
        expect(store.queryCaptureById).toHaveBeenCalledWith("123e4567-e89b-12d3-a456-426614174000");
        expect(store.queryCaptures).not.toHaveBeenCalled();
    });

    it("passes filters through to the store", async () => {
        const store = createStore();
        await createQueryCaptureTool(store).execute("call-1", { sourceType: "chat", limit: 5 });
        expect(store.queryCaptures).toHaveBeenCalledWith(
            expect.objectContaining({
                source_type: "chat",
                limit: 5
            })
        );
    });

    it("returns an error for invalid parameters without querying", async () => {
        const store = createStore();
        const result = await createQueryCaptureTool(store).execute("call-1", { limit: 0 });
        expect(result.isError).toBe(true);
        expect(store.queryCaptures).not.toHaveBeenCalled();
        expect(store.queryCaptureById).not.toHaveBeenCalled();
    });
});
