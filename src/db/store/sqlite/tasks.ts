import { UUID } from "node:crypto";

import { Database } from "better-sqlite3";
import Format from "typebox/format";

import type { TaskStore } from "#types/store.js";
import type { Capture } from "#types/capture.js";
import type { QueryTaskOptions, Task } from "#types/task.js";

export function createSqliteTaskStore(db: Database): TaskStore {
    return {
        queryTaskById(id: UUID) {
            return db
                .prepare(`
                    SELECT * FROM Tasks
                    WHERE id = @id
                `)
                .all({ id }) as Array<Task>;
        },
        queryTasks(options: QueryTaskOptions) {
            const { title, status, before, after, limit = 20 } = options;

            const beforeISODate = before && Format.IsDateTime(before) ? before : null;
            const afterISODate = after && Format.IsDateTime(after) ? after : null;

            if (beforeISODate && afterISODate && beforeISODate < afterISODate)
                throw new Error(
                    "Invalid time period for toolcall: after must be earlier than before"
                );

            const conditions: Array<string> = [];
            const params: Record<string, unknown> = { limit };

            if (title) {
                conditions.push("title = @title");
                params.title = title;
            }
            if (status) {
                conditions.push("status = @status");
                params.status = status;
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
                        SELECT * FROM Tasks
                        ${whereClause}
                        ORDER BY created_at DESC
                        LIMIT @limit
                    `)
                .all(params) as Array<Task>;
        },

        writeTaskWithCapture(capture: Capture, task: Task) {
            const saveCaptureAndTask = db.transaction(() => {
                db.prepare(
                    "INSERT INTO captures (id, raw_content, source_type) VALUES (?, ?, ?)"
                ).run(capture.id, capture.raw_content, capture.source_type);

                db.prepare(
                    "INSERT INTO tasks (id, capture_id, title, description, time_scope, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)"
                ).run(
                    task.id,
                    capture.id,
                    task.title,
                    task.description,
                    task.time_scope,
                    task.start_date,
                    task.due_date
                );
            });

            saveCaptureAndTask();
        }
    };
}
