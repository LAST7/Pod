import Database from "better-sqlite3";

import { migrateDatabase } from "#db/migrations.js";
import { getDatabasePath } from "#db/path.js";
import { logger } from "#utils/logger.js";

export function openDatabase() {
    const db_filename = getDatabasePath();
    const db = new Database(db_filename);

    logger.debug(`Connected to database: ${db_filename}`);

    try {
        db.pragma("foreign_keys = ON");
        db.pragma("journal_mode = WAL");
        db.pragma("busy_timeout = 5000");
        migrateDatabase(db);

        return db;
    } catch (error: unknown) {
        db.close();
        logger.error((error as Error).message);
        throw error;
    }
}
