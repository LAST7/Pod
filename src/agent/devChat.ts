import { Editor, ProcessTerminal, Text, TuiMainScreen, matchesKey } from "@earendil-works/pi-tui";
import type { Agent } from "@earendil-works/pi-agent-core";

import { setLogSink } from "#utils/logger.js";

const editorTheme = {
    borderColor: (text: string) => text,
    selectList: {
        selectedPrefix: (text: string) => text,
        selectedText: (text: string) => text,
        description: (text: string) => text,
        scrollInfo: (text: string) => text,
        noMatch: (text: string) => text
    }
};

export async function runDevChat(agent: Agent): Promise<void> {
    const tui = new TuiMainScreen(new ProcessTerminal());
    const transcript = new Text("Pod · development chat\nType /exit or Ctrl+C to quit.\n");
    const editor = new Editor(tui, editorTheme);
    let transcriptText = "Pod · development chat\nType /exit or Ctrl+C to quit.\n";
    let running = false;
    const stopped = Promise.withResolvers<void>();

    const append = (text: string) => {
        transcriptText += text;
        transcript.setText(transcriptText);
        tui.requestRender();
    };

    setLogSink((line) => append(`\n${line}\n`));

    const stop = () => {
        agent.abort();
        setLogSink(undefined);
        tui.stop();
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
        stopped.resolve();
    };

    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);

    agent.subscribe((event) => {
        if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
            transcriptText += event.assistantMessageEvent.delta;
            transcript.setText(transcriptText);

            tui.requestRender();
        } else if (event.type === "tool_execution_start") {
            append(`\n[tool] ${event.toolName}\n`);
        } else if (event.type === "agent_end") {
            append("\n\n");

            running = false;
            editor.disableSubmit = false;

            tui.setFocus(editor);
            tui.requestRender();
        }
    });

    editor.onSubmit = (input) => {
        const message = input.trim();
        if (!message || running) return;

        editor.setText("");
        editor.addToHistory(message);

        if (message === "/exit") {
            stop();
            return;
        }

        append(`\nYou: ${message}\nPod: `);
        running = true;
        editor.disableSubmit = true;

        void agent.prompt(message).catch((error: unknown) => {
            const detail = error instanceof Error ? error.message : String(error);
            append(`\n[error] ${detail}\n\n`);
            running = false;
            editor.disableSubmit = false;
            tui.setFocus(editor);
        });
    };

    tui.addChild(transcript);
    tui.addChild(editor);
    tui.setFocus(editor);
    tui.addInputListener((data) => {
        if (matchesKey(data, "ctrl+c")) {
            stop();
            return { consume: true };
        }
        return undefined;
    });

    tui.start();
    await stopped.promise;

    setLogSink(undefined);
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    await agent.waitForIdle();
}
