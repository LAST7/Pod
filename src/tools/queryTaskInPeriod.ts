import { AgentTool } from "@earendil-works/pi-agent-core";
import { TextContent } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import { Value } from "typebox/value";

import { makeTypeErrToolResult } from "#utils/toolArgParser.js";
import { logger } from "#utils/logger.js";

import type { PodStore } from "#types/store.js";
import type { Task } from "#types/task.js";

const QuerySchema = Type.Object({
    limit: Type.Optional(
        Type.Integer({
            minimum: 1,
            maximum: 500,
            default: 100,
            description: "Maximum return results, default to 100, maximum 500."
        })
    ),
    start: Type.String({
        format: "date-time",
        description:
            "The starting point of the period where the required tasks are still active(not dued)."
    }),
    end: Type.String({
        format: "date-time",
        description: "The ending point of the period where the required tasks are started already."
    })
});

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

export function createQueryTaskInPeriodTool(store: PodStore): AgentTool<typeof QuerySchema> {
    return {
        name: "query_task_in_period",
        label: "query database for tasks",
        description:
            "Inspect stored tasks, using predefined read-only queries. You cannot provide SQL. This tool finds the tasks that dues after the `start` and starts before the `end`. It provides two queries to include tasks that have a `null` start/due date. Noted that at least one of the period boundaries(`start` and `end`) should be provided.",
        parameters: QuerySchema,

        async execute(_toolCallId, params: unknown) {
            if (!Value.Check(QuerySchema, params)) {
                const errResult = makeTypeErrToolResult(QuerySchema, params);
                logger.error(
                    `<queryTaskInPeriod> tool called with invalid parameter(s): ${(errResult.content[0] as TextContent).text}`
                );
                return errResult;
            }

            const limit = params.limit ?? 100;
            const start = params.start;
            const end = params.end;

            logger.info(
                `[Toolcall Execution] <queryTaskInPeriod> starts with start=${start}, end=${end}, limit=${limit}.`
            );

            try {
                const tasks = store.queryTasksInPeriod({ start, end, limit });
                return {
                    content: [
                        { type: "text", text: `Found ${tasks.length} task(s):` },
                        ...tasks.map(formatTask)
                    ],
                    details: { start, end, limit }
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
