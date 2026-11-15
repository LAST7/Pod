import { randomUUID, UUID } from "node:crypto";

import { Type } from "typebox";
import { Value } from "typebox/value";
import { TextContent } from "@earendil-works/pi-ai";
import type { AgentTool } from "@earendil-works/pi-agent-core";

import { logger } from "#utils/logger.js";
import { makeTypeErrToolResult } from "#utils/toolArgParser.js";

import type { PodStore } from "#types/store.js";
import { SourceType } from "#types/capture.js";

const WriteCaptureSchema = Type.Object({
    rawContent: Type.String({
        minLength: 1,
        description: "The user's original text. Preserve it without rewriting."
    }),
    sourceType: Type.Optional(
        Type.Enum(SourceType, { minLength: 1, description: "Capture source, defaults to text." })
    )
});

export function createWriteCaptureTool(store: PodStore): AgentTool<typeof WriteCaptureSchema> {
    return {
        name: "write_capture",
        label: "write a single capture to database",
        description: "Save a capture originates from user's input to the database.",
        parameters: WriteCaptureSchema,

        async execute(_toolCallId, params: unknown) {
            if (!Value.Check(WriteCaptureSchema, params)) {
                const errResult = makeTypeErrToolResult(WriteCaptureSchema, params);
                logger.error(
                    `Write tool called for 'Captures' with invalid parameter(s): ${(errResult.content[0] as TextContent).text}`
                );
                return errResult;
            }

            const captureId: UUID = randomUUID();
            const rawContent = params.rawContent.trim();
            if (!rawContent) throw new Error("Raw content cannot be empty or whitespace.");
            const sourceType = params.sourceType ?? SourceType.Text;

            logger.info(
                `WriteCapture tool called: captureId: ${captureId}, sourceType: ${sourceType}`
            );

            try {
                store.writeCapture({
                    id: captureId,
                    raw_content: rawContent,
                    source_type: sourceType,
                    // Q: maybe bad decision?
                    created_at: null // Handled by SQLite
                });

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Capture saved. Capture ID: ${captureId}`
                        }
                    ],
                    details: { captureId, rawContent, sourceType }
                };
            } catch (error: unknown) {
                logger.error(error);
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: error instanceof Error ? error.message : String(error)
                        }
                    ],
                    details: { captureId, rawContent, sourceType }
                };
            }
        }
    };
}
