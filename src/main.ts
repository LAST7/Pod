import { argv } from "node:process";

import { startAgentLoop } from "#agent/agent.js";
import { openDatabase } from "#db/client.js";

import { createTools } from "#tools/index.js";
import { createSqlitePodStore } from "#db/store/store.js";
import { createToolCallLogger } from "#utils/toolCallLogger.js";
import { logger } from "#utils/logger.js";

import type { ToolCallLogger } from "#types/tools.js";

async function main(): Promise<void> {
    argv.forEach((val, index) => {
        console.log(`${index}: ${val}`);
    });
    const db = openDatabase();
    const dbStore = createSqlitePodStore(db);
    const tools = createTools(dbStore);
    const toolCallLogger: ToolCallLogger = createToolCallLogger(db);

    try {
        await startAgentLoop(tools, toolCallLogger);
    } catch (error: unknown) {
        logger.error((error as Error).message);
        throw error;
    } finally {
        db.close();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
