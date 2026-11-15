import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { PodStore } from "#types/store.js";

import { createQueryTaskTool } from "./queryTask.js";
import { createQueryTaskInPeriodTool } from "./queryTaskInPeriod.js";
import { createQueryCaptureTool } from "./queryCapture.js";

import { createWriteTaskTool } from "./writeTask.js";
import { createWriteCaptureTool } from "./writeCapture.js";
import { createGetTimeTool } from "./getTime.js";

export function createTools(store: PodStore): Array<AgentTool> {
    // BAD: this is exposing the DB interface a bit too much
    const queryTaskTool: AgentTool = createQueryTaskTool(store);
    const queryTaskInPeriodTool: AgentTool = createQueryTaskInPeriodTool(store);
    const queryCaptureTool: AgentTool = createQueryCaptureTool(store);
    const writeTaskTool: AgentTool = createWriteTaskTool(store);
    const writeCaptureTool: AgentTool = createWriteCaptureTool(store);

    const getTimeTool: AgentTool = createGetTimeTool();

    return [
        queryTaskTool,
        queryTaskInPeriodTool,
        queryCaptureTool,
        writeTaskTool,
        writeCaptureTool,
        getTimeTool
    ] satisfies Array<AgentTool>;
}
