import { UUID } from "node:crypto";

import { Type } from "typebox";
import { Value } from "typebox/value";
import { Task, TaskStatus } from "#types/task.js";
import { TextContent } from "@earendil-works/pi-ai";

import { logger } from "#utils/logger.js";
import { makeTypeErrToolResult } from "#utils/toolArgParser.js";

import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { PodStore } from "#types/store.js";

const QuerySchema = Type.Object(
    {
        id: Type.Optional(
            Type.String({
                format: "uuid",
                description:
                    "The exact uuid of the target task. Optional. Fallback to parameter query if not provided."
            })
        ),
        title: Type.Optional(
            Type.String({
                // TODO: fuzzy find by task title
                description: "The exact title of a task. Fuzzy finding not supported yet."
            })
        ),
        status: Type.Optional(
            Type.Enum(TaskStatus, {
                description: "Status of the target task, leave it empty for any status."
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

export const queryToolSystemPromptContribution = {
    snippet: "Inspect stored task data.",
    guidelines: [
        "Use the query tool to inspect stored captures and tasks. ",
        "The query tool only supports predefined read-only queries."
    ]
};

function formatTask(task: Task): { type: "text"; text: string } {
    return {
        type: "text" as const,
        text: [
            `ID: ${task.id}`,
            `Title: ${task.title}`,
            `Status: ${task.status}`,
            `Description: ${task.description}`,
            `Time Scope: ${task.time_scope}`,
            `Start Date: ${task.start_date}`,
            `Due Date: ${task.due_date}`,
            `Created at: ${task.created_at}`
        ].join("\n")
    };
}

export function createQueryTaskTool(store: PodStore): AgentTool<typeof QuerySchema> {
    return {
        name: "query_task",
        label: "query database for tasks",
        description:
            "Inspect general stored tasks, or task dependencies using predefined read-only queries. You cannot provide SQL.",
        parameters: QuerySchema,

        async execute(_toolCallId, params: unknown) {
            if (!Value.Check(QuerySchema, params)) {
                const errResult = makeTypeErrToolResult(QuerySchema, params);
                logger.error(
                    `<queryTask/queryTaskById> tool called with invalid parameter(s): ${(errResult.content[0] as TextContent).text}`
                );
                return errResult;
            }

            const id = params.id;
            const title = params.title;
            const limit = params.limit ?? 20;
            const status = params.status;

            logger.info(
                `[Toolcall Execution] <${id ? "queryTaskById" : "queryTask"}> starts with id=${id}, title=${title}, limit=${limit}, status=${status}`
            );

            try {
                // NOTE: id is validated as uuid by typebox
                const tasks = id
                    ? store.queryTaskById(id as UUID)
                    : store.queryTasks({
                          title,
                          status,
                          limit
                      });
                return {
                    content: [
                        { type: "text", text: `Found ${tasks.length} task(s):` },
                        ...tasks.map(formatTask)
                    ],
                    details: { status, limit }
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
                    details: null
                };
            }
        }
    };
}
