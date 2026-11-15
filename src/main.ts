import { argv } from "node:process";

import { createAgent } from "#agent/agent.js";
import { openDatabase } from "#db/client.js";

import { createTools } from "#tools/index.js";
import { createSqlitePodStore } from "#db/store/store.js";
import { createToolCallLogger } from "#utils/toolCallLogger.js";
import { logger } from "#utils/logger.js";

import type { ToolCallLogger } from "#types/tools.js";
import { runDevChat } from "#agent/devChat.js";

async function main(): Promise<void> {
    argv.forEach((val, index) => {
        console.log(`${index}: ${val}`);
    });
    const db = openDatabase();
    const dbStore = createSqlitePodStore(db);
    const tools = createTools(dbStore);
    const toolCallLogger: ToolCallLogger = createToolCallLogger(db);

    try {
        const agent = createAgent(tools);

        agent.subscribe((event) => {
            if (event.type === "tool_execution_start") {
                if (!agent.sessionId) logger.error("Session id is not set.");
                toolCallLogger(
                    agent.sessionId ?? "<not_set>",
                    event.toolCallId,
                    event.toolName,
                    event.args
                );
                logger.debug(`Running tool call ${event.toolCallId}: ${event.toolName}`);
            } else if (event.type === "tool_execution_end") {
                logger.debug(`Finished tool call ${event.toolCallId}: ${event.toolName}`);
            }
        });

        if (process.env.APP_ENV === "development") await runDevChat(agent);
        // TODO: GUI
    } catch (error: unknown) {
        logger.error(error);
    } finally {
        db.close();
    }
}

main().catch((error: unknown) => {
    logger.error(error);
    process.exit(1);
});
