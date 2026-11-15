import { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";

export function createGetTimeTool(): AgentTool<{}> {
    return {
        name: "get_time",
        label: "get both UTC and local time with timezone.",
        description: "",
        parameters: Type.Object({}),

        async execute() {
            const now = Temporal.Now;
            // `fractionalSecondDigits: 3` for compatibility with TypeBox and SQLite
            const utcISO = now.instant().toString({ fractionalSecondDigits: 3 });
            const localZonedISO = now.zonedDateTimeISO().toString({
                fractionalSecondDigits: 3
            });

            return {
                content: [
                    {
                        type: "text",
                        text: `Current UTC date & time: ${utcISO}\nCurrent local date & time: ${localZonedISO}.`
                    }
                ],
                details: null
            };
        }
    };
}
