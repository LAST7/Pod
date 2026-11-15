import { randomUUID } from "crypto";

import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";
import { streamSimple } from "@earendil-works/pi-ai/compat";
import { getBuiltinModel } from "@earendil-works/pi-ai/providers/all";

import { loadSystemPrompt, type SystemPromptProfile } from "#agent/systemPrompt.js";
import { logger } from "#utils/logger.js";

export function createAgent(tools: Array<AgentTool>, profile?: SystemPromptProfile): Agent {
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

    return agent;
}
