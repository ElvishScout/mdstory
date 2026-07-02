import { describe, it, expect } from "vitest";
import { parseStorySource } from "../src/core/parser.js";
import { DEFAULT_CHAPTER } from "../src/core/definitions.js";
import type { IncludeResolver } from "../src/core/parser.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an IncludeResolver backed by an in-memory dictionary.
 * Matches by the last path segment (filename) so that tests work regardless
 * of whether `normalizePath` resolves to POSIX or Windows-style paths.
 */
function fakeInclude(files: Record<string, string>): IncludeResolver {
  return (fullPath: string): string => {
    // Try exact match first; fall back to suffix match for portability.
    if (files[fullPath] !== undefined) return files[fullPath];
    for (const [key, content] of Object.entries(files)) {
      if (fullPath.endsWith(key) || fullPath.replace(/\\/g, "/").endsWith(key)) {
        return content;
      }
    }
    throw new Error(`File not found: ${fullPath}`);
  };
}

/** Parse with a controlled `base` so paths are predictable. */
async function parse(src: string, includes?: Record<string, string>) {
  return parseStorySource(src, {
    base: "/test/story.md",
    resolveInclude: includes ? fakeInclude(includes) : undefined,
  });
}

// Tiny valid scripts that export hook objects so the Zod schemas pass.
const SCRIPT_STORY = "<script>\nexport default { onStart() {} };\n</script>";
const SCRIPT_CHAPTER = "<script>\nexport default { onEnter() {} };\n</script>";
const SCRIPT_SCENE = "<script>\nexport default { onEnter() {} };\n</script>";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseStorySource", () => {
  // -- empty / minimal -------------------------------------------------------
  describe("basic parsing", () => {
    it("parses empty source", async () => {
      const r = await parse("");
      expect(r.metadata).toEqual({});
      expect(r.title).toBe("");
      expect(r.template).toBe("");
      expect(r.chapters).toEqual([]);
      expect(r.stylesheet).toBe("");
      expect(r.scripts).toEqual([]);
    });

    it("parses source with only body text (no headings)", async () => {
      const r = await parse("Just some prose.\nNo headings here.");
      expect(r.title).toBe("");
      expect(r.template).toBe("");
      expect(r.chapters).toEqual([]);
    });

    it("parses story with only h1 title — no template because there is no h2/h3 to bound it", async () => {
      const r = await parse("# My Story");
      expect(r.title).toBe("My Story");
      // When there are no h2 or h3 headings the story-template span is unbounded,
      // so the parser returns an empty template.
      expect(r.template).toBe("");
      expect(r.chapters).toEqual([]);
      expect(r.scripts).toEqual([]);
      expect(r.stylesheet).toBe("");
    });

    it("parses h1 with explicit id via attrs", async () => {
      const r = await parse("# My Story {#my-story}");
      expect(r.title).toBe("My Story");
    });

    it("parses h1 where attrs stripping leaves an empty title", async () => {
      const r = await parse("# {#fallback-id}");
      // title is "" after stripping attrs — the id from attrs becomes the heading id
      expect(r.title).toBe("");
    });
  });

  // -- handshake / metadata --------------------------------------------------
  describe("handshake metadata", () => {
    it("parses YAML handshake with title and author", async () => {
      const src = ["---", "title: The Adventure", 'author: "Jane Doe"', "---", "# The Adventure"].join("\n");
      const r = await parse(src);
      expect(r.metadata).toMatchObject({ title: "The Adventure", author: "Jane Doe" });
    });

    it("parses handshake with email", async () => {
      const src = ["---", "title: Test", "email: a@b.com", "---", "# Test"].join("\n");
      const r = await parse(src);
      expect(r.metadata.email).toBe("a@b.com");
    });

    it("parses handshake with globals", async () => {
      const src = ["---", "title: G", "globals:", "  score: 0", "  name: hero", "---", "# G"].join("\n");
      const r = await parse(src);
      expect(r.metadata.globals).toEqual({ score: 0, name: "hero" });
    });

    it("parses handshake with assets (string form)", async () => {
      const src = ["---", "title: A", "assets:", "  bg: https://example.com/bg.png", "---", "# A"].join("\n");
      const r = await parse(src);
      expect(r.metadata.assets).toEqual({
        bg: { url: "https://example.com/bg.png", mime: "image/png" },
      });
    });

    it("parses handshake with assets (object form)", async () => {
      const src = [
        "---",
        "title: A",
        "assets:",
        "  bg:",
        "    url: https://example.com/bg.png",
        "    mime: image/png",
        "    alt: background",
        "---",
        "# A",
      ].join("\n");
      const r = await parse(src);
      expect(r.metadata.assets).toEqual({
        bg: { url: "https://example.com/bg.png", mime: "image/png", alt: "background" },
      });
    });

    it("leaves metadata as empty object when no handshake present", async () => {
      const r = await parse("# Just a title");
      expect(r.metadata).toEqual({});
    });

    it("handshake title flows into metadata; h1 heading becomes story title", async () => {
      const src = ["---", "title: YAML Title", "---", "# H1 Title"].join("\n");
      const r = await parse(src);
      // Front-matter is parsed first via Object.assign, so metadata picks it up.
      // The parser does not overwrite metadata.title from the h1 heading.
      expect(r.metadata.title).toBe("YAML Title");
      expect(r.title).toBe("H1 Title");
    });

    it("filters YAML handshake from story template (no h1)", async () => {
      // Regression: frontmatter lines leaked into the story template because
      // they were never added to the ignored-lines set.
      const src = [
        "---",
        "title: Test",
        "globals:",
        "  score: 0",
        "---",
        "",
        "### Scene 1 {#s1}",
        "Scene body.",
      ].join("\n");
      const r = await parse(src);
      expect(r.template).toBe("");
      expect(r.metadata.title).toBe("Test");
      expect(r.metadata.globals).toEqual({ score: 0 });
      expect(r.chapters[0].scenes[0].template).toContain("Scene body.");
    });

    it("filters YAML handshake from story template with h3 only", async () => {
      // Similar to html-template/placeholder.md: frontmatter then h3, no h1.
      const src = [
        "---",
        "title: MdStory",
        "globals:",
        "  flags: {}",
        "---",
        "",
        "### 📖 MdStory",
        "",
        "<script>",
        "export default { view() { return {}; } };",
        "</script>",
        "",
        "Your story JSON is not yet injected.",
      ].join("\n");
      const r = await parse(src);
      // Template must NOT contain any frontmatter content
      expect(r.template).not.toContain("title:");
      expect(r.template).not.toContain("globals:");
      expect(r.template).not.toContain("flags:");
      expect(r.template).not.toContain("---");
      expect(r.metadata.title).toBe("MdStory");
      expect(r.chapters).toHaveLength(1);
      expect(r.chapters[0].scenes[0].title).toBe("📖 MdStory");
      expect(r.chapters[0].scenes[0].template).toContain("Your story JSON is not yet injected.");
    });
  });

  // -- heading hierarchy -----------------------------------------------------
  describe("heading hierarchy", () => {
    it("parses h1 → h2 full hierarchy (chapters without scenes)", async () => {
      const src = ["# Story", SCRIPT_STORY, "", "## Chapter 1 {#ch1}", SCRIPT_CHAPTER, "", "## Chapter 2 {#ch2}"].join(
        "\n",
      );
      const r = await parse(src);
      expect(r.title).toBe("Story");
      expect(r.scripts).toHaveLength(1);
      expect(r.chapters).toHaveLength(2);
      expect(r.chapters[0].id).toBe("ch1");
      expect(r.chapters[0].title).toBe("Chapter 1");
      expect(r.chapters[0].scenes).toEqual([]);
      expect(r.chapters[0].scripts).toHaveLength(1);
      expect(r.chapters[1].id).toBe("ch2");
      expect(r.chapters[1].title).toBe("Chapter 2");
    });

    it("parses h1 → h2 → h3 full hierarchy", async () => {
      const src = [
        "# Story",
        "Story intro text.",
        SCRIPT_STORY,
        "",
        "## Chapter 1 {#ch1}",
        "Chapter 1 intro.",
        SCRIPT_CHAPTER,
        "",
        "### Scene 1.1 {#s1}",
        "Scene one body.",
        SCRIPT_SCENE,
        "",
        "### Scene 1.2 {#s2}",
        "Scene two body.",
        "",
        "## Chapter 2 {#ch2}",
        "",
        "### Scene 2.1 {#s3}",
        "Another scene.",
      ].join("\n");
      const r = await parse(src);

      expect(r.title).toBe("Story");
      expect(r.template).toContain("Story intro text.");
      expect(r.scripts).toHaveLength(1);

      expect(r.chapters).toHaveLength(2);

      // Chapter 1
      const ch1 = r.chapters[0];
      expect(ch1.id).toBe("ch1");
      expect(ch1.title).toBe("Chapter 1");
      expect(ch1.template).toContain("Chapter 1 intro.");
      expect(ch1.scripts).toHaveLength(1);
      expect(ch1.scenes).toHaveLength(2);

      expect(ch1.scenes[0].id).toBe("s1");
      expect(ch1.scenes[0].title).toBe("Scene 1.1");
      expect(ch1.scenes[0].template).toContain("Scene one body.");
      expect(ch1.scenes[0].scripts).toHaveLength(1);

      expect(ch1.scenes[1].id).toBe("s2");
      expect(ch1.scenes[1].title).toBe("Scene 1.2");
      expect(ch1.scenes[1].template).toContain("Scene two body.");
      expect(ch1.scenes[1].scripts).toEqual([]);

      // Chapter 2
      const ch2 = r.chapters[1];
      expect(ch2.id).toBe("ch2");
      expect(ch2.scenes).toHaveLength(1);
      expect(ch2.scenes[0].id).toBe("s3");
      expect(ch2.scenes[0].template).toContain("Another scene.");
    });

    it("creates default chapter for orphan h3 scenes before first h2", async () => {
      const src = [
        "# Story",
        "",
        "### Orphan A {#oa}",
        "Content A.",
        "",
        "### Orphan B {#ob}",
        "Content B.",
        SCRIPT_SCENE,
        "",
        "## Chapter 1 {#ch1}",
        "Chapter content.",
        "",
        "### Scene 1.1 {#s1}",
        "Scene content.",
      ].join("\n");
      const r = await parse(src);

      expect(r.chapters).toHaveLength(2);

      // Default chapter
      const defCh = r.chapters[0];
      expect(defCh.id).toBe(DEFAULT_CHAPTER);
      expect(defCh.title).toBe("");
      expect(defCh.template).toBe("");
      expect(defCh.scripts).toEqual([]);
      expect(defCh.scenes).toHaveLength(2);
      expect(defCh.scenes[0].id).toBe("oa");
      expect(defCh.scenes[0].template).toContain("Content A.");
      expect(defCh.scenes[1].id).toBe("ob");
      expect(defCh.scenes[1].template).toContain("Content B.");
      expect(defCh.scenes[1].scripts).toHaveLength(1);

      // Real chapter
      const ch1 = r.chapters[1];
      expect(ch1.id).toBe("ch1");
      expect(ch1.scenes).toHaveLength(1);
    });

    it("uses auto-generated id when heading has no explicit id", async () => {
      const r = await parse("# Story\n\n## Chapter Uno\n\n### Scene One");
      expect(typeof r.chapters[0].id).toBe("string");
      expect((r.chapters[0].id as string).length).toBeGreaterThan(0);
      expect(r.chapters[0].id).not.toContain(".");
      expect(r.chapters[0].scenes[0].id.length).toBeGreaterThan(0);
    });

    it("derives chapter id from title when no attrs id", async () => {
      const r = await parse("## Chapter Name");
      expect(r.chapters[0].title).toBe("Chapter Name");
      expect(r.chapters[0].id).toBe("Chapter Name");
    });
  });

  // -- templates -------------------------------------------------------------
  describe("templates", () => {
    it("extracts story template from h1 to first h2", async () => {
      const src = ["# Story", "This is story-level prose.", "It can have multiple lines.", "", "## Chapter 1"].join(
        "\n",
      );
      const r = await parse(src);
      expect(r.template).toContain("# Story");
      expect(r.template).toContain("This is story-level prose.");
    });

    it("story template contains just the h1 line when h1 is immediately followed by h2", async () => {
      const r = await parse("# Story\n\n## Chapter 1");
      expect(r.template).toBe("# Story\n");
    });

    it("extracts chapter template between heading and first scene", async () => {
      const src = [
        "# Story",
        "## Chapter 1 {#ch1}",
        "Chapter preamble.",
        "More preamble.",
        "",
        "### Scene 1 {#s1}",
        "Scene body.",
      ].join("\n");
      const r = await parse(src);
      const ch1 = r.chapters[0];
      expect(ch1.template).toContain("## Chapter 1 {#ch1}");
      expect(ch1.template).toContain("Chapter preamble.");
      expect(ch1.template).toContain("More preamble.");
    });

    it("extracts scene template after scene heading", async () => {
      const src = [
        "## Chapter 1",
        "### Scene 1 {#s1}",
        "Scene line 1.",
        "Scene line 2.",
        "",
        "### Scene 2 {#s2}",
        "Second scene text.",
      ].join("\n");
      const r = await parse(src);
      expect(r.chapters[0].scenes[0].template).toContain("Scene line 1.");
      expect(r.chapters[0].scenes[0].template).toContain("Scene line 2.");
      expect(r.chapters[0].scenes[1].template).toContain("Second scene text.");
    });

    it("filters script and style blocks from templates", async () => {
      const src = [
        "# Story",
        "Visible text.",
        SCRIPT_STORY,
        "Also visible.",
        "<style>",
        "body { margin: 0; }",
        "</style>",
        "More visible.",
        "",
        "## Chapter 1",
      ].join("\n");
      const r = await parse(src);
      expect(r.template).toContain("Visible text.");
      expect(r.template).toContain("Also visible.");
      expect(r.template).toContain("More visible.");
      // Script/style blocks themselves are removed…
      expect(r.template).not.toContain("<script>");
      expect(r.template).not.toContain("</script>");
      expect(r.template).not.toContain("<style>");
      expect(r.template).not.toContain("</style>");
    });

    it("handles scene heading without title text (only attrs id)", async () => {
      const src = ["## Chapter 1", "### {#no-title}", "Body after no-title scene heading."].join("\n");
      const r = await parse(src);
      const scene = r.chapters[0].scenes[0];
      expect(scene.id).toBe("no-title");
      expect(scene.title).toBe("");
      expect(scene.template).toContain("Body after no-title scene heading.");
    });
  });

  // -- scripts ---------------------------------------------------------------
  describe("scripts", () => {
    it("collects story-level scripts", async () => {
      const r = await parse(`# Story\n${SCRIPT_STORY}\n\n## Chapter 1`);
      expect(r.scripts).toHaveLength(1);
    });

    it("collects chapter-level scripts", async () => {
      const src = ["# Story", "## Chapter 1 {#ch1}", SCRIPT_CHAPTER, "### Scene 1 {#s1}", "Body."].join("\n");
      const r = await parse(src);
      expect(r.chapters[0].scripts).toHaveLength(1);
      expect(r.chapters[0].scenes[0].scripts).toEqual([]);
    });

    it("collects scene-level scripts", async () => {
      const src = ["# Story", "## Chapter 1 {#ch1}", "### Scene 1 {#s1}", SCRIPT_SCENE, "Scene body."].join("\n");
      const r = await parse(src);
      expect(r.chapters[0].scenes[0].scripts).toHaveLength(1);
    });

    it("collects multiple scripts at the same level", async () => {
      const src = [
        "# Story",
        SCRIPT_STORY,
        "<script>export default { globals() { return { x: 1 }; } };</script>",
        "## Chapter 1",
      ].join("\n");
      const r = await parse(src);
      expect(r.scripts).toHaveLength(2);
    });

    it("ignores empty script blocks", async () => {
      const r = await parse("# Story\n<script></script>\n\n## Chapter 1");
      expect(r.scripts).toEqual([]);
    });

    it("script scope does not leak — chapter script not in story scripts", async () => {
      const src = ["# Story", SCRIPT_STORY, "## Chapter 1 {#ch1}", SCRIPT_CHAPTER, "### Scene 1 {#s1}"].join("\n");
      const r = await parse(src);
      expect(r.scripts).toHaveLength(1);
      expect(r.chapters[0].scripts).toHaveLength(1);
    });

    it("supports single-line script tag", async () => {
      const r = await parse(`# Story\n<script>export default { onStart() {} };</script>\n\n## Chapter 1`);
      expect(r.scripts).toHaveLength(1);
    });
  });

  // -- stylesheets -----------------------------------------------------------
  describe("stylesheets", () => {
    it("collects and concatenates style blocks", async () => {
      const src = [
        "# Story",
        "<style>",
        "body { background: black; }",
        "</style>",
        "Story text.",
        "<style>",
        "h1 { font-size: 2em; }",
        "</style>",
        "## Chapter 1",
      ].join("\n");
      const r = await parse(src);
      expect(r.stylesheet).toContain("body { background: black; }");
      expect(r.stylesheet).toContain("h1 { font-size: 2em; }");
    });

    it("removes style blocks from templates", async () => {
      const src = ["# Story", "<style>", "body { color: red; }", "</style>", "Visible prose.", "", "## Chapter 1"].join(
        "\n",
      );
      const r = await parse(src);
      expect(r.template).toContain("Visible prose.");
      expect(r.template).not.toContain("body { color: red; }");
    });
  });

  // -- !include() ------------------------------------------------------------
  describe("!include()", () => {
    it("expands includes from other files", async () => {
      const includes: Record<string, string> = {
        "/test/chapter.md": [
          "## Included Chapter {#inc-ch}",
          "Included chapter template.",
          "",
          "### Included Scene {#inc-sc}",
          "Included scene body.",
        ].join("\n"),
      };
      const src = [
        "# Story",
        "Story template.",
        '!include("./chapter.md")',
        "",
        "## Local Chapter {#local}",
        "Local content.",
      ].join("\n");
      const r = await parseStorySource(src, {
        base: "/test/story.md",
        resolveInclude: fakeInclude(includes),
      });

      // Included chapter should appear before Local Chapter
      expect(r.chapters).toHaveLength(2);
      expect(r.chapters[0].id).toBe("inc-ch");
      expect(r.chapters[0].title).toBe("Included Chapter");
      expect(r.chapters[0].scenes[0].id).toBe("inc-sc");
      expect(r.chapters[1].id).toBe("local");
    });

    it("detects circular includes", async () => {
      const includes: Record<string, string> = {
        "/test/a.md": '!include("./b.md")',
        "/test/b.md": '!include("./a.md")',
      };
      const src = '!include("./a.md")';
      await expect(
        parseStorySource(src, {
          base: "/test/story.md",
          resolveInclude: fakeInclude(includes),
        }),
      ).rejects.toThrow(/circular/i);
    });

    it("supports single-quoted paths", async () => {
      const includes: Record<string, string> = {
        "/test/part.md": "## Quoted Chapter\nQuoted content.",
      };
      const src = ["# Story", "!include('./part.md')"].join("\n");
      const r = await parseStorySource(src, {
        base: "/test/story.md",
        resolveInclude: fakeInclude(includes),
      });
      expect(r.chapters[0].title).toBe("Quoted Chapter");
    });

    it("supports double-quoted paths", async () => {
      const includes: Record<string, string> = {
        "/test/part.md": "## DQ Chapter\nDQ content.",
      };
      const src = ["# Story", '!include("./part.md")'].join("\n");
      const r = await parseStorySource(src, {
        base: "/test/story.md",
        resolveInclude: fakeInclude(includes),
      });
      expect(r.chapters[0].title).toBe("DQ Chapter");
    });
  });

  // -- error handling --------------------------------------------------------
  describe("error handling", () => {
    it("throws on duplicate chapter id", async () => {
      const src = ["# Story", "## Chapter 1 {#dup}", "## Chapter 2 {#dup}"].join("\n");
      await expect(parse(src)).rejects.toThrow(/duplicate.*chapter/i);
    });

    it("throws on duplicate scene id (within same chapter)", async () => {
      const src = ["## Chapter 1 {#ch1}", "### Scene A {#dup-sc}", "Body A.", "### Scene B {#dup-sc}", "Body B."].join(
        "\n",
      );
      await expect(parse(src)).rejects.toThrow(/duplicate.*scene/i);
    });

    it("allows same scene id in different chapters (fully qualified by chapter)", async () => {
      // "ch1.dup-sc" ≠ "ch2.dup-sc" — same local id in different chapters is fine.
      const src = ["## Chapter 1 {#ch1}", "### Scene {#dup-sc}", "## Chapter 2 {#ch2}", "### Scene {#dup-sc}"].join(
        "\n",
      );
      const r = await parse(src);
      expect(r.chapters[0].scenes[0].id).toBe("dup-sc");
      expect(r.chapters[1].scenes[0].id).toBe("dup-sc");
    });

    it("throws on chapter id containing '.'", async () => {
      await expect(parse("## Bad.Chapter {#bad.ch}")).rejects.toThrow(/must not contain.*\./i);
    });

    it("throws on scene id containing '.'", async () => {
      await expect(parse("## Ch1\n\n### Bad.Scene {#bad.sc}")).rejects.toThrow(/must not contain.*\./i);
    });

    it("throws when resolveInclude rejects", async () => {
      const src = '!include("./missing.md")';
      await expect(
        parseStorySource(src, {
          base: "/test/story.md",
          resolveInclude: () => {
            throw new Error("File not found: missing.md");
          },
        }),
      ).rejects.toThrow("File not found");
    });
  });

  // -- edge cases ------------------------------------------------------------
  describe("edge cases", () => {
    it("handles CRLF line endings", async () => {
      const src = "# Story\r\n## Chapter 1\r\n### Scene 1 {#s1}\r\nBody text.";
      const r = await parse(src);
      expect(r.title).toBe("Story");
      expect(r.chapters[0].title).toBe("Chapter 1");
      expect(r.chapters[0].scenes[0].id).toBe("s1");
      expect(r.chapters[0].scenes[0].template).toContain("Body text.");
    });

    it("handles story with only scenes and no chapters (all default)", async () => {
      const src = ["# Story", "### Scene 1 {#s1}", "Body 1.", "### Scene 2 {#s2}", "Body 2."].join("\n");
      const r = await parse(src);
      expect(r.chapters).toHaveLength(1);
      expect(r.chapters[0].id).toBe(DEFAULT_CHAPTER);
      expect(r.chapters[0].scenes).toHaveLength(2);
    });

    it("handles story with chapters but no h1 title", async () => {
      const src = ["## Chapter 1 {#ch1}", "Chapter body.", "### Scene 1 {#s1}", "Scene body."].join("\n");
      const r = await parse(src);
      expect(r.title).toBe("");
      expect(r.template).toBe("");
      expect(r.chapters).toHaveLength(1);
      expect(r.chapters[0].id).toBe("ch1");
    });

    it("chapter with template but no scenes", async () => {
      const src = [
        "# Story",
        "## Chapter 1 {#ch1}",
        "Just a chapter with template, no scenes.",
        "",
        "## Chapter 2 {#ch2}",
        "### Scene 2.1 {#s1}",
        "This chapter has a scene.",
      ].join("\n");
      const r = await parse(src);
      expect(r.chapters[0].template).toContain("Just a chapter with template");
      expect(r.chapters[0].scenes).toEqual([]);
      expect(r.chapters[1].scenes).toHaveLength(1);
    });
  });
});
