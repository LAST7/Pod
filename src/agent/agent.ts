import { randomUUID } from "crypto";

import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";
import { streamSimple } from "@earendil-works/pi-ai/compat";
import { getBuiltinModel } from "@earendil-works/pi-ai/providers/all";

import { loadSystemPrompt, type SystemPromptProfile } from "#agent/systemPrompt.js";
import { logger } from "#utils/logger.js";

import type { ToolCallLogger } from "#types/tools.js";

export async function startAgentLoop(
    tools: Array<AgentTool>,
    toolCallLogger: ToolCallLogger,
    profile?: SystemPromptProfile
) {
    logger.info("Starting agent loop...");

    const agent = new Agent({
        initialState: {
            systemPrompt: loadSystemPrompt(profile),
            model: getBuiltinModel("deepseek", "deepseek-flash"),
            thinkingLevel: "off",
            tools,
            messages: []
        },
        sessionId: randomUUID(),
        streamFn: (model, context, options) => streamSimple(model, context, options)
    });

    agent.subscribe((event) => {
        if (event.type === "message_update") {
            const update = event.assistantMessageEvent;
            if (update.type === "text_delta") process.stdout.write(update.delta);
        } else if (event.type === "tool_execution_start") {
            if (!agent.sessionId) logger.error("Session id is not set.");

            toolCallLogger(
                agent.sessionId ?? "<unknown>",
                event.toolCallId,
                event.toolName,
                event.args
            );
            logger.info(`Running tool call ${event.toolCallId}: ${event.toolName}`);
        } else if (event.type === "tool_execution_end") {
            logger.info(`Finished tool call ${event.toolCallId}: ${event.toolName}`);
        } else if (event.type === "agent_end") {
            console.log("\n");
        }
    });

    // TODO: interactive cli conversation
}
