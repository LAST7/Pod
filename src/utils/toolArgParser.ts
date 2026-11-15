import { AgentToolResult } from "@earendil-works/pi-agent-core";
import { TSchema } from "typebox/type";
import { Value } from "typebox/value";

export function makeTypeErrToolResult<T extends TSchema>(
    schema: T,
    value: unknown
): AgentToolResult {
    const errors = [...Value.Errors(schema, value)];

    const errorMessage = errors
        .map((error) => {
            const path = error.instancePath || "/";
            return `${path}: ${error.message}`;
        })
        .join("\n");

    return {
        isError: true,
        content: [
            {
                type: "text",
                text: `Invalid params detected before execution: ${errorMessage}`
            }
        ],
        details: null
    };
}
