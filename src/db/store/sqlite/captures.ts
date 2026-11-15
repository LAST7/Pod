import { UUID } from "node:crypto";

import Format from "typebox/format";

import type { Capture, QueryCaptureOptions } from "#types/capture.js";
import type { CaptureStore } from "#types/store.js";
import type { Database } from "better-sqlite3";

export function createSqliteCaptureStore(db: Database): CaptureStore {
    return {
        queryCaptureById(id: UUID) {
            return db
                .prepare(`
                    SELECT * FROM Captures
                    WHERE id = @id
                `)
                .all({ id }) as Array<Capture>;
        },
        queryCaptures(options: QueryCaptureOptions) {
            const { source_type, before, after, limit } = options;

            const beforeISODate = before && Format.IsDateTime(before) ? before : null;
            const afterISODate = after && Format.IsDateTime(after) ? after : null;

            if (beforeISODate && afterISODate && beforeISODate < afterISODate)
                throw new Error(
                    "Invalid time period for toolcall: after must be earlier than before"
                );

            const conditions: Array<string> = [];
            const params: Record<string, unknown> = { limit };

            if (source_type) {
                conditions.push("source_type = @source_type");
                params.source_type = source_type;
            }
            if (beforeISODate) {
                conditions.push("created_at <= @before");
                params.before = beforeISODate;
            }
            if (afterISODate) {
                conditions.push("created_at >= @after");
                params.after = afterISODate;
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

            return db
                .prepare(`
                    SELECT * FROM Captures
                    ${whereClause}
                    ORDER BY created_at DESC
                    LIMIT @limit
                `)
                .all(params) as Array<Capture>;
        },

        writeCapture(capture: Capture) {
            db.prepare(
                "INSERT INTO captures (id, raw_content, source_type, created_at) VALUES (?, ?, ?, ?)"
            ).run(capture.id, capture.raw_content, capture.source_type, capture.created_at);
        }
    };
}
