import { UUID } from "node:crypto";

export enum SourceType {
    Text = "text",
    Image = "image",
    Chat = "chat"
}

export interface Capture {
    id: UUID;
    raw_content: string;
    // Q: maybe this could be constrained to a limited type?
    source_type: string;
    // Q: maybe bad decision?
    created_at: string | null;
}

export interface QueryCaptureOptions {
    source_type?: string;
    before?: string;
    after?: string;
    limit?: number;
}
