type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};

const configuredLevel = process.env.LOG_LEVEL?.toLowerCase();

const minLevel: number =
    configuredLevel && configuredLevel in levels
        ? levels[configuredLevel as LogLevel]
        : process.env.NODE_ENV === "production"
          ? levels.info
          : levels.debug;

const useColor = Boolean(process.stderr.isTTY);

const colors: Record<LogLevel, string> = {
    debug: "\x1b[90m",
    info: "\x1b[36m",
    warn: "\x1b[33m",
    error: "\x1b[31m"
};

const reset = "\x1b[0m";

function log(level: LogLevel, ...args: unknown[]): void {
    if (levels[level] < minLevel) return;

    const timestamp = new Date().toISOString();
    const label = `[${timestamp}] [${level.toUpperCase()}]`;
    const prefix = useColor ? `${colors[level]}${label}${reset}` : label;

    console.error("\n", prefix, ...args);
}

export const logger = {
    debug: (...args: unknown[]) => log("debug", ...args),
    info: (...args: unknown[]) => log("info", ...args),
    warn: (...args: unknown[]) => log("warn", ...args),
    error: (...args: unknown[]) => log("error", ...args)
};
