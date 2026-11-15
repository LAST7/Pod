import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type Database from "better-sqlite3";

import { logger } from "#utils/logger.js";

interface Migration {
    version: number;
    filename: string;
    sql: string;
}

const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../migrations");
const migrationFilenamePattern = /^(\d+)-[a-z0-9-]+\.sql$/;

function loadMigrations(): Migration[] {
    const filenames = readdirSync(migrationsDirectory)
        .filter((filename) => filename.endsWith(".sql"))
        .sort();
    const migrations = filenames.map((filename) => {
        const match = migrationFilenamePattern.exec(filename);
        if (!match)
            throw new Error(
                `Invalid migration filename '${filename}'. Expected '<version>-<name>.sql'.`
            );

        return {
            version: Number(match[1]),
            filename,
            sql: readFileSync(resolve(migrationsDirectory, filename), "utf8")
        };
    });

    for (let index = 0; index < migrations.length; index++) {
        const expectedVersion = index + 1;
        const migration = migrations[index]!;
        if (migration.version !== expectedVersion)
            throw new Error(
                `Migration sequence is incomplete: expected version ${expectedVersion}, found ${migration.filename}.`
            );
    }

    return migrations;
}

export function migrateDatabase(db: Database.Database): void {
    const migrations = loadMigrations();
    const currentVersion = db.pragma("user_version", {
        simple: true
    }) as number;
    const latestVersion = migrations.at(-1)?.version ?? 0;

    if (currentVersion > latestVersion)
        throw new Error(
            `Database schema version ${currentVersion} is newer than this application supports (${latestVersion}).`
        );

    logger.debug(
        `Database is at schema version ${currentVersion}; latest version is ${latestVersion}.`
    );

    for (const migration of migrations) {
        if (migration.version <= currentVersion) continue;

        db.transaction(() => {
            db.exec(migration.sql);
            db.pragma(`user_version = ${migration.version}`);
        })();
        logger.info(`Applied database migration ${migration.filename}.`);
    }

    logger.debug("Database migration complete.");
}
