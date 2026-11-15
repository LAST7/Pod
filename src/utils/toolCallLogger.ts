import { randomUUID, UUID } from "node:crypto";

import { Database } from "better-sqlite3";

import { logger } from "#utils/logger.js";

import type { ToolCallLogger } from "#types/tools.js";

// TODO: this is incomplete
export function createToolCallLogger(db: Database): ToolCallLogger {
    return (sessionId: string, toolCallId: string, name: string, args: Record<string, string>) => {
        const log_id: UUID = randomUUID();
        // TODO: is this even possible? Might require LLM summary? Or just record the full conversation?
        const raw_human_command = "";
        // TODO: undo payload
        // const undo_payload = "";
        const executed_at = new Date().toISOString();

        try {
            const insert = db.prepare(
                "INSERT INTO log_toolcall (id, session_id, toolcall_id, raw_human_command, tool_name, input_args, executed_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
            );

            const result = insert.run(
                log_id,
                sessionId,
                toolCallId,
                raw_human_command,
                name,
                JSON.stringify(args),
                executed_at
            );

            logger.info(`ToolCall recorded to table log_toolcall, result: ${result.changes}`);
        } catch (error: unknown) {
            logger.error((error as Error).message);
            throw error;
        }
    };
}
