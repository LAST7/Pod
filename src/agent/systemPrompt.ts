import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type SystemPromptProfile = "development" | "production";

const promptDirectory = fileURLToPath(new URL("../../prompts/", import.meta.url));

function resolveProfile(profile: string | undefined): SystemPromptProfile {
    if (profile === undefined) return "production";
    if (profile === "development" || profile === "production") return profile;
    throw new Error(`Invalid POD_PROFILE '${profile}'. Expected 'development' or 'production'.`);
}

export function loadSystemPrompt(profileValue = process.env.POD_PROFILE): string {
    const profile = resolveProfile(profileValue);
    const base = readFileSync(`${promptDirectory}base.md`, "utf8").trim();
    const profilePrompt = readFileSync(`${promptDirectory}${profile}.md`, "utf8").trim();
    return `${base}\n\n${profilePrompt}`;
}
