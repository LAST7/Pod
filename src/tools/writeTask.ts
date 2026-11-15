import { randomUUID, UUID } from "node:crypto";

import { Type } from "typebox";
import { Value } from "typebox/value";
import { TextContent } from "@earendil-works/pi-ai";
import type { AgentTool } from "@earendil-works/pi-agent-core";

import { logger } from "#utils/logger.js";
import { makeTypeErrToolResult } from "#utils/toolArgParser.js";

import { TaskStatus, TimeScope } from "#types/task.js";
import { SourceType } from "#types/capture.js";
import type { PodStore } from "#types/store.js";

const WriteTaskSchema = Type.Object({
    rawContent: Type.String({
        minLength: 1,
        description: "The user's original text. Preserve it without rewriting."
    }),
    sourceType: Type.Optional(
        Type.Enum(SourceType, { minLength: 1, description: "Capture source, defaults to text." })
    ),
    title: Type.String({
        minLength: 1,
        description: "LLM-summarized task title."
    }),
    description: Type.Optional(
        Type.String({
            minLength: 1,
            description: "LLM-summarized task description. Must originate from the user's input."
        })
    ),
    timeScope: Type.Optional(
        Type.Enum(TimeScope, {
            default: TimeScope.Day,
            description: "Time scope of the task. Defaults to 'day'."
        })
    ),
    // FIXME: there's something wrong with this implementation
    startDate: Type.Optional(
        Type.String({
            format: "date-time",
            description: "Date & Time when the task starts. Can be empty."
        })
    ),
    dueDate: Type.Optional(
        Type.String({
            format: "date-time",
            description: "Date & Time when the task dues. Can be empty."
        })
    )
});

export function createWriteTaskTool(store: PodStore): AgentTool<typeof WriteTaskSchema> {
    return {
        name: "write_task",
        label: "write task along with the capture to database.",
        description:
            "Save a task originates from the user's input to the database, along with its raw input content as a capture. Noted that calling this tool will write both a capture and a pending task.",
        parameters: WriteTaskSchema,

        async execute(_toolCallId, params: unknown) {
            if (!Value.Check(WriteTaskSchema, params)) {
                const errResult = makeTypeErrToolResult(WriteTaskSchema, params);
                logger.error(
                    `<writeTask> tool called with invalid parameter(s): ${(errResult.content[0] as TextContent).text}`
                );
                return errResult;
            }

            const title = params.title?.trim();
            if (!title) throw new Error("A non-empty title is required for task captures.");

            const rawContent = params.rawContent.trim();
            if (!rawContent)
                throw new Error(
                    "Raw content cannot be empty or whitespace for storing capture as a task."
                );
            const sourceType = params.sourceType ?? SourceType.Text;

            const captureId: UUID = randomUUID();
            const taskId: UUID = randomUUID();

            const description = params.description ? params.description.trim() : "";
            const timeScope = params.timeScope ?? TimeScope.Day;

            // QUESTION: Do we accept passed date as start/due date?
            const { startDate, dueDate } = params;
            const createdAt = Temporal.Now.instant().toString({ fractionalSecondDigits: 3 });

            logger.info(
                `[Toolcall Execution] <writeTask> starts with title=${title}, captureId=${captureId}, taskId=${taskId}, sourceType=${sourceType}`
            );

            try {
                store.writeTaskWithCapture(
                    {
                        id: captureId,
                        raw_content: rawContent,
                        source_type: sourceType,
                        created_at: createdAt
                    },
                    {
                        id: taskId,
                        title,
                        description,
                        status: TaskStatus.Pending,
                        time_scope: timeScope,
                        start_date: startDate ?? null,
                        due_date: dueDate ?? null,
                        created_at: createdAt
                    }
                );

                return {
                    content: [
                        {
                            type: "text" as const,
                            text: `Capture and task saved. Capture ID: ${captureId}; task ID: ${taskId}, task title: ${title}`
                        }
                    ],
                    details: { captureId, taskId, rawContent, title, sourceType }
                };
            } catch (error: unknown) {
                logger.error((error as Error).message);
                throw error;
            }
        }
    };
}
