import { afterEach, describe, expect, it } from "vitest";

import { loadSystemPrompt } from "#agent/systemPrompt.js";

describe("system prompt profiles", () => {
    const originalProfile = process.env.POD_PROFILE;

    afterEach(() => {
        if (originalProfile === undefined) delete process.env.POD_PROFILE;
        else process.env.POD_PROFILE = originalProfile;
    });

    it("defaults to production", () => {
        delete process.env.POD_PROFILE;
        const prompt = loadSystemPrompt();
        expect(prompt).toContain("You are Pod, a personal AI steward.");
        expect(prompt).toContain("You are running in the production profile.");
        expect(prompt).not.toContain("You are running in the development profile.");
    });

    it("loads development prompt when explicitly selected", () => {
        const prompt = loadSystemPrompt("development");
        expect(prompt).toContain("You are Pod, a personal AI steward.");
        expect(prompt).toContain("You are running in the development profile.");
    });

    it("rejects unknown profiles", () => {
        expect(() => loadSystemPrompt("staging")).toThrow(/Invalid POD_PROFILE/);
    });

    it("rejects an invalid environment-selected profile", () => {
        process.env.POD_PROFILE = "staging";
        expect(() => loadSystemPrompt()).toThrow(/Invalid POD_PROFILE/);
    });
});
