export type ToolCallLogger = (
    sessionId: string,
    toolCallId: string,
    name: string,
    args: Record<string, string>
) => void;
