import type { PodStore } from "#types/store.js";
import type { Database } from "better-sqlite3";

import { createSqliteTaskStore } from "#db/store/sqlite/tasks.js";
import { createSqliteCaptureStore } from "#db/store/sqlite/captures.js";

export function createSqlitePodStore(db: Database): PodStore {
    const taskStore = createSqliteTaskStore(db);
    const captureStore = createSqliteCaptureStore(db);

    return {
        ...taskStore,
        ...captureStore
    };
}
