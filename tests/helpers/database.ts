import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

const initialMigrationPath = fileURLToPath(
    new URL("../../migrations/001-initial.sql", import.meta.url)
);
const initialMigration = readFileSync(initialMigrationPath, "utf8");

export function createTestDatabase(): Database.Database {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(initialMigration);
    db.pragma("user_version = 1");
    return db;
}
