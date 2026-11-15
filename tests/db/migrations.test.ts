import { afterEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";

import { migrateDatabase } from "#db/migrations.js";

describe("database migrations", () => {
    let db: Database.Database | undefined;

    afterEach(() => {
        db?.close();
        db = undefined;
    });

    it("applies SQL migrations and records the version with user_version", () => {
        db = new Database(":memory:");
        migrateDatabase(db);

        expect(db.pragma("user_version", { simple: true })).toBe(1);
        expect(
            db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all()
        ).toEqual([
            { name: "captures" },
            { name: "log_toolcall" },
            { name: "task_dependencies" },
            { name: "tasks" }
        ]);
        expect(
            db
                .prepare(
                    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'"
                )
                .get()
        ).toBeUndefined();
    });

    it("is a no-op when the database is already current", () => {
        db = new Database(":memory:");
        migrateDatabase(db);
        db.exec("CREATE TABLE user_data (value TEXT NOT NULL)");
        db.prepare("INSERT INTO user_data VALUES (?)").run("preserve me");

        migrateDatabase(db);

        expect(db.prepare("SELECT value FROM user_data").get()).toEqual({ value: "preserve me" });
        expect(db.pragma("user_version", { simple: true })).toBe(1);
    });

    it("refuses a database schema newer than the available migrations", () => {
        db = new Database(":memory:");
        db.pragma("user_version = 99");

        expect(() => migrateDatabase(db!)).toThrow(/newer than this application supports/i);
        expect(db.pragma("user_version", { simple: true })).toBe(99);
    });
});
