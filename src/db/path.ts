import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { logger } from "#utils/logger.js";

export type AppEnvironment = "development" | "production";

function getEnvironment(): AppEnvironment {
    const env = process.env.APP_ENV;
    if (env === undefined) return "production";
    if (env === "development" || env === "production") return env;
    throw new Error(
        `Invalid APP_ENV '${env}'. Use 'development' or 'production'.`
    );
}

export function getDatabasePath(): string {
    const environment = getEnvironment();

    const override = process.env.APP_DB_PATH;
    const path = override
        ? resolve(override)
        : environment === "development"
          ? resolve(".data/dev.sqlite")
          : join(
                process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"),
                "pod",
                "data.sqlite"
            );

    logger.debug(`Using database path: ${path}.`);

    if (environment === "development" && process.env.APP_DB_PATH)
        logger.warn("APP_DB_PATH overrides the development database path.");

    mkdirSync(dirname(path), { recursive: true });

    return path;
}
