import { UUID } from "node:crypto";

import { Type } from "typebox";
import { Value } from "typebox/value";
import { AgentTool } from "@earendil-works/pi-agent-core";
import { TextContent } from "@earendil-works/pi-ai";

import { logger } from "#utils/logger.js";
import { makeTypeErrToolResult } from "#utils/toolArgParser.js";

import type { PodStore } from "#types/store.js";
import { type Capture, SourceType } from "#types/capture.js";

const QuerySchema = Type.Object(
    {
        id: Type.Optional(
            Type.String({
                format: "uuid",
                description:
                    "The exact uuid of the target capture. Fallback to parameter query if provided malformed capture id."
            })
        ),
        before: Type.Optional(
            Type.String({
                format: "date-time",
                description: "The latest date time of target captures. Inclusive. Can be empty."
            })
        ),
        after: Type.Optional(
            Type.String({
                format: "date-time",
                description: "The earliest date time of target captures. Inclusive. Can be empty."
            })
        ),
        sourceType: Type.Optional(
            Type.Enum(SourceType, {
                minLength: 1,
                description: "Capture source, leave empty for all types."
            })
        ),
        limit: Type.Optional(
            Type.Integer({
                minimum: 1,
                maximum: 100,
                default: 20,
                description: "Maximum return results, default to 20, maximum 100."
            })
        )
    },
    {
        additionalProperties: false
    }
);

function formatCapture(capture: Capture): { type: "text"; text: string } {
    return {
        type: "text" as const,
        text: [
            `ID: ${capture.id}`,
            `Raw Content: ${capture.raw_content}`,
            `Source Type: ${capture.source_type}`,
            `Created at: ${capture.created_at}`
        ].join("\n")
    };
}

export function createQueryCaptureTool(store: PodStore): AgentTool<typeof QuerySchema> {
    return {
        name: "query_capture",
        label: "query database for captures",
        description:
            "Inspect stored captures using predefined read-only queries. You cannot provide SQL",
        parameters: QuerySchema,

        async execute(_toolCallId, params: unknown) {
            if (!Value.Check(QuerySchema, params)) {
                const errResult = makeTypeErrToolResult(QuerySchema, params);
                logger.error(
                    `<queryCapture> called with invalid parameter(s): ${(errResult.content[0] as TextContent).text}`
                );
                return errResult;
            }

            const id = params.id;
            const limit = params.limit ?? 20;
            const before = params.before;
            const after = params.after;
            const source_type = params.sourceType;

            logger.info(
                `[Toolcall Execution] <queryCapture> starts with id=${id}, limit=${limit}, before=${before}, after=${after}, source_type=${source_type}`
            );

            try {
                // NOTE: id is validated as uuid by typebox
                const captures: Array<Capture> = id
                    ? store.queryCaptureById(id as UUID)
                    : store.queryCaptures({
                          source_type,
                          before,
                          after,
                          limit
                      });

                return {
                    content: [
                        { type: "text", text: `Found ${captures.length} capture(s):` },
                        ...captures.map(formatCapture)
                    ],
                    details: { before, after, limit }
                };
            } catch (error: unknown) {
                logger.error(error);
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: String(error)
                        }
                    ],
                    details: { before, after, limit }
                };
            }
        }
    };
}
