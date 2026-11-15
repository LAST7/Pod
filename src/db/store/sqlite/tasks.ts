import { UUID } from "node:crypto";

import { Database } from "better-sqlite3";

import type { TaskStore } from "#types/store.js";
import type { Capture } from "#types/capture.js";
import type { QueryTaskOptions, Task, TaskPeriodOptions } from "#types/task.js";

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
            const { title, status, limit = 20 } = options;

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
        queryTasksInPeriod(options: TaskPeriodOptions) {
            // INFO: use COALESCE for tasks that has a open boundary
            // for example tasks with a `start_date` but without a `due_date`
            if (!options.limit) options.limit = 100;

            return db
                .prepare(`
                    SELECT * FROM Tasks
                    WHERE COALESCE(start_date, due_date) <= @end
                    AND COALESCE(due_date, start_date) >= @start
                    ORDER BY created_at DESC
                    LIMIT @limit
                `)
                .all(options) as Array<Task>;
        },

        writeTaskWithCapture(capture: Capture, task: Task) {
            const saveCaptureAndTask = db.transaction(() => {
                db.prepare(
                    "INSERT INTO captures (id, raw_content, source_type, created_at) VALUES (?, ?, ?, ?)"
                ).run(capture.id, capture.raw_content, capture.source_type, capture.created_at);

                db.prepare(
                    "INSERT INTO tasks (id, capture_id, title, description, status, time_scope, start_date, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
                ).run(
                    task.id,
                    capture.id,
                    task.title,
                    task.description,
                    task.status,
                    task.time_scope,
                    task.start_date,
                    task.due_date,
                    task.created_at
                );
            });

            saveCaptureAndTask();
        }
    };
}
