import { UUID } from "node:crypto";

import { Capture, QueryCaptureOptions } from "#types/capture.js";
import { QueryTaskOptions, Task, TaskPeriodOptions } from "#types/task.js";

export interface PodStore {
    queryTasks(options: QueryTaskOptions): Array<Task>;
    queryTaskById(id: UUID): Array<Task>;
    queryTasksInPeriod(options: TaskPeriodOptions): Array<Task>;
    queryCaptures(options: QueryCaptureOptions): Array<Capture>;
    queryCaptureById(id: UUID): Array<Capture>;
    writeCapture(capture: Capture): void;
    writeTaskWithCapture(capture: Capture, task: Task): void;
    // TODO:
    // logToolCall(entry): void;
}

export interface TaskStore {
    queryTasks(options: QueryTaskOptions): Array<Task>;
    queryTaskById(id: UUID): Array<Task>;
    queryTasksInPeriod(options: TaskPeriodOptions): Array<Task>;
    writeTaskWithCapture(capture: Capture, task: Task): void;
}

export interface CaptureStore {
    queryCaptureById(id: UUID): Array<Capture>;
    queryCaptures(options: QueryCaptureOptions): Array<Capture>;
    writeCapture(capture: Capture): void;
}

// TODO:
// export interface ToolCallStore {
//     logToolCall(entry: ToolCallLogEntry): void;
// }
