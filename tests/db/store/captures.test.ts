import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";

import { createSqliteCaptureStore } from "#db/store/sqlite/captures.js";
import { createTestDatabase } from "../../helpers/database.js";

function insertCapture(
    db: Database.Database,
    id: string,
    content: string,
    source = "text",
    createdAt = "2026-01-01 12:00:00"
) {
    db.prepare(
        "INSERT INTO captures (id, raw_content, source_type, created_at) VALUES (?, ?, ?, ?)"
    ).run(id, content, source, createdAt);
}

describe("SQLite CaptureStore", () => {
    let db: Database.Database;

    beforeEach(() => {
        db = createTestDatabase();
    });

    afterEach(() => db.close());

    it("writes and retrieves a capture by id", () => {
        const store = createSqliteCaptureStore(db);
        store.writeCapture({
            id: "capture-1",
            raw_content: "Keep this note",
            source_type: "text",
            created_at: null
        });

        expect(store.queryCaptureById("capture-1")).toMatchObject([
            { id: "capture-1", raw_content: "Keep this note", source_type: "text" }
        ]);
        expect(store.queryCaptureById("missing")).toEqual([]);
    });

    it("filters by source and inclusive date bounds", () => {
        insertCapture(db, "old", "old", "text", "2026-01-01T00:00:00.000Z");
        insertCapture(db, "middle", "middle", "chat", "2026-01-02T00:00:00.000Z");
        insertCapture(db, "new", "new", "text", "2026-01-03T00:00:00.000Z");

        const result = createSqliteCaptureStore(db).queryCaptures({
            source_type: "text",
            after: "2026-01-01T00:00:00.000Z",
            before: "2026-01-03T00:00:00.000Z",
            limit: 10
        });
        expect(result.map((capture) => capture.id)).toEqual(["new", "old"]);
    });

    it("rejects invalid or reversed date ranges", () => {
        const store = createSqliteCaptureStore(db);
        expect(() => store.queryCaptures({ after: "not-a-date" })).toThrow();
        expect(() =>
            store.queryCaptures({
                after: "2026-01-03T00:00:00.000Z",
                before: "2026-01-01T00:00:00.000Z"
            })
        ).toThrow(/after must be earlier than before/i);
    });
});
