import { describe, it, expect } from "vitest";
import { StorySessionAbortError } from "../src/core/session.js";
import { parseStorySource } from "../src/core/parser.js";
import { fromParsed } from "../src/core/story.js";

// ---------------------------------------------------------------------------
// StorySessionAbortError
// ---------------------------------------------------------------------------

describe("StorySessionAbortError", () => {
  it("has the correct name", () => {
    const err = new StorySessionAbortError();
    expect(err.name).toBe("StorySessionAbortError");
  });

  it("is an instance of Error", () => {
    const err = new StorySessionAbortError();
    expect(err).toBeInstanceOf(Error);
  });

  it("exposes the reason property", () => {
    const err = new StorySessionAbortError("restart");
    expect(err.reason).toBe("restart");
  });

  it("reason defaults to undefined", () => {
    const err = new StorySessionAbortError();
    expect(err.reason).toBeUndefined();
  });

  it("accepts a custom message", () => {
    const err = new StorySessionAbortError("restart", "player requested restart");
    expect(err.message).toBe("player requested restart");
  });
});

// ---------------------------------------------------------------------------
// Session save / restore
// ---------------------------------------------------------------------------

async function makeStory(src: string) {
  const parsed = await parseStorySource(src, { base: "/test/story.md" });
  return fromParsed(parsed);
}

const SCRIPT = "<script>\nexport default {};\n</script>";

describe("StorySession save / restore", () => {
  it("save() returns JSON-stringifiable data", async () => {
    const story = await makeStory(`\
# Start
${SCRIPT}

Some content.
`);
    const session = story.session();

    // Advance the session to initialise scopes
    const prompt = async () => ({ type: "end" as const });
    await session.play(prompt, { adapter: "markdown" });

    const saved = session.save();
    const json = JSON.stringify(saved);
    const parsed = JSON.parse(json);

    // Should have scope structure
    expect(parsed.scopes).toBeDefined();
    expect(typeof parsed.currentPath).toBe("string");
  });

  it("session(savedData) restores scope state", async () => {
    const story = await makeStory(`\
# Start
${SCRIPT}

Some content.
`);
    // First session: set some scope state
    const session1 = story.session();
    const prompt1 = async () => ({ type: "end" as const });
    await session1.play(prompt1, { adapter: "markdown" });

    const saved = session1.save();

    // Second session: restore from saved data
    const session2 = story.session(saved);
    const saved2 = session2.save();

    expect(saved2.scopes).toEqual(saved.scopes);
    expect(saved2.currentPath).toBe(saved.currentPath);
  });
});
