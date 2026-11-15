import { UUID } from "node:crypto";

export enum TaskStatus {
    Pending = "pending",
    Done = "done",
    WIP = "wip",
    Suspend = "suspend",
    Defer = "defer",
    Abandon = "abandon"
}

export enum TimeScope {
    Day = "day",
    Week = "week",
    Month = "month"
}

export interface Task {
    id: UUID;
    title: string;
    description: string;
    status: TaskStatus;
    time_scope: TimeScope;
    start_date: string | null;
    due_date: string | null;
    created_at: string | null;
}

export interface QueryTaskOptions {
    title?: string;
    status?: string;
    before?: string;
    after?: string;
    limit?: number;
}
