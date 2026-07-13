import { describe, it, expect } from "vitest";
import { parseStorySource } from "../src/core/parser.js";
import type { IncludeResolver } from "../src/core/parser.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeInclude(files: Record<string, string>): IncludeResolver {
  return (fullPath: string): string => {
    if (files[fullPath] !== undefined) {
      return files[fullPath];
    }
    for (const [key, content] of Object.entries(files)) {
      if (fullPath.endsWith(key) || fullPath.replace(/\\/g, "/").endsWith(key)) {
        return content;
      }
    }
    throw new Error(`File not found: ${fullPath}`);
  };
}

async function parse(src: string, includes?: Record<string, string>) {
  return parseStorySource(src, {
    base: "/test/story.md",
    resolveInclude: includes ? fakeInclude(includes) : undefined,
  });
}

const SCRIPT_DEFAULT = "<script>\nexport default { onEnter() {} };\n</script>";
const SCRIPT_SCOPE = "<script>\nexport default { scope() { return { x: 1 }; } };\n</script>";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseStorySource", () => {
  // -- empty / minimal -------------------------------------------------------
  describe("basic parsing", () => {
    it("parses empty source", async () => {
      const r = await parse("");
      expect(r.metadata).toEqual({});
      expect(r.root.id).toMatch(/^id_\d+$/);
      expect(r.root.title).toBe("");
      expect(r.root.template).toBe("");
      expect(r.root.children).toEqual([]);
      expect(r.root.scripts).toEqual([]);
      expect(r.root.stylesheets).toEqual([]);
    });

    it("parses source with only body text (no headings)", async () => {
      const r = await parse("Just some prose.\nNo headings here.");
      expect(r.root.title).toBe("");
      expect(r.root.template).toContain("Just some prose.");
      expect(r.root.children).toEqual([]);
    });

    it("parses root content before first h1 as root template", async () => {
      const r = await parse("Preamble text.\nMore preamble.\n\n# Story Title\n\nSome story content.");
      expect(r.root.title).toBe("");
      expect(r.root.template).toContain("Preamble text.");
      expect(r.root.template).toContain("More preamble.");
    });

    it("parses h1 as root child section", async () => {
      const r = await parse("# My Story\n\nStory content.");
      expect(r.root.children).toHaveLength(1);
      expect(r.root.children[0].id).toBe("My Story");
      expect(r.root.children[0].title).toBe("My Story");
      expect(r.root.children[0].template).toContain("# My Story");
    });

    it("parses h1 with explicit id via attrs", async () => {
      const r = await parse("# My Story {#my-story}");
      expect(r.root.children[0].title).toBe("My Story");
      expect(r.root.children[0].id).toBe("my-story");
    });

    it("parses h1 where attrs stripping leaves an empty title", async () => {
      const r = await parse("# {#fallback-id}");
      expect(r.root.children[0].title).toBe("");
      expect(r.root.children[0].id).toBe("fallback-id");
    });
  });

  // -- handshake / metadata --------------------------------------------------
  describe("handshake metadata", () => {
    it("parses YAML handshake with title and author", async () => {
      const src = ["---", "title: The Adventure", 'author: "Jane Doe"', "---", "# The Adventure"].join("\n");
      const r = await parse(src);
      expect(r.metadata).toMatchObject({ title: "The Adventure", author: "Jane Doe" });
    });

    it("parses handshake with scope", async () => {
      const src = ["---", "title: G", "scope:", "  score: 0", "  name: hero", "---", "# G"].join("\n");
      const r = await parse(src);
      expect(r.metadata.scope).toEqual({ score: 0, name: "hero" });
    });

    it("parses handshake with assets (string form)", async () => {
      const src = ["---", "title: A", "assets:", "  bg: https://example.com/bg.png", "---", "# A"].join("\n");
      const r = await parse(src);
      expect(r.metadata.assets).toEqual({
        bg: { url: "https://example.com/bg.png", mime: "image/png" },
      });
    });

    it("filters YAML handshake from root template", async () => {
      const src = ["---", "title: Test", "scope:", "  score: 0", "---", "", "### Scene 1 {#s1}", "Scene body."].join(
        "\n",
      );
      const r = await parse(src);
      expect(r.root.template).toBe("");
      expect(r.metadata.title).toBe("Test");
      expect(r.root.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -- heading hierarchy -----------------------------------------------------
  describe("heading hierarchy", () => {
    it("parses h1 → h2 full hierarchy", async () => {
      const src = ["Preamble.", "", "# Story", SCRIPT_DEFAULT, "", "## Chapter 1 {#ch1}", SCRIPT_DEFAULT, "", "## Chapter 2 {#ch2}"].join("\n");
      const r = await parse(src);
      expect(r.root.template).toContain("Preamble.");
      expect(r.root.children).toHaveLength(1);

      const story = r.root.children[0];
      expect(story.id).toBe("Story");
      expect(story.title).toBe("Story");
      expect(story.children).toHaveLength(2);
      expect(story.children[0].id).toBe("ch1");
      expect(story.children[0].title).toBe("Chapter 1");
      expect(story.children[1].id).toBe("ch2");
    });

    it("parses h1 → h2 → h3 full hierarchy", async () => {
      const src = [
        "# Story",
        "Story intro.",
        SCRIPT_DEFAULT,
        "",
        "## Chapter 1 {#ch1}",
        "Chapter intro.",
        SCRIPT_DEFAULT,
        "",
        "### Scene 1.1 {#s1}",
        "Scene one body.",
        SCRIPT_DEFAULT,
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

      expect(r.root.children).toHaveLength(1);
      const story = r.root.children[0];
      expect(story.id).toBe("Story");

      // Story template should contain its intro
      expect(story.template).toContain("Story intro.");
      expect(story.scripts).toHaveLength(1);

      // Chapter 1
      const ch1 = story.children[0];
      expect(ch1.id).toBe("ch1");
      expect(ch1.title).toBe("Chapter 1");
      expect(ch1.template).toContain("Chapter intro.");
      expect(ch1.scripts).toHaveLength(1);
      expect(ch1.children).toHaveLength(2);

      expect(ch1.children[0].id).toBe("s1");
      expect(ch1.children[0].title).toBe("Scene 1.1");
      expect(ch1.children[0].template).toContain("Scene one body.");
      expect(ch1.children[0].scripts).toHaveLength(1);

      expect(ch1.children[1].id).toBe("s2");
      expect(ch1.children[1].title).toBe("Scene 1.2");
      expect(ch1.children[1].template).toContain("Scene two body.");
      expect(ch1.children[1].scripts).toEqual([]);

      // Chapter 2
      const ch2 = story.children[1];
      expect(ch2.id).toBe("ch2");
      expect(ch2.children).toHaveLength(1);
      expect(ch2.children[0].id).toBe("s3");
      expect(ch2.children[0].template).toContain("Another scene.");
    });

    it("h3 without preceding h2 become children of root (not auto-grouped)", async () => {
      const src = [
        "# Story",
        "",
        "### Orphan A {#oa}",
        "Content A.",
        "",
        "### Orphan B {#ob}",
        "Content B.",
        SCRIPT_DEFAULT,
      ].join("\n");
      const r = await parse(src);

      const story = r.root.children[0];
      expect(story.children).toHaveLength(2);
      expect(story.children[0].id).toBe("oa");
      expect(story.children[0].template).toContain("Content A.");
      expect(story.children[1].id).toBe("ob");
      expect(story.children[1].template).toContain("Content B.");
      expect(story.children[1].scripts).toHaveLength(1);
    });

    it("supports h4 as great-grandchildren", async () => {
      const src = [
        "# Story",
        "## Chapter 1 {#ch1}",
        "### Scene 1 {#s1}",
        "#### Sub 1 {#sub1}",
        "Deep content.",
        "#### Sub 2 {#sub2}",
        "More deep content.",
      ].join("\n");
      const r = await parse(src);

      const s1 = r.root.children[0].children[0].children[0];
      expect(s1.id).toBe("s1");
      expect(s1.children).toHaveLength(2);
      expect(s1.children[0].id).toBe("sub1");
      expect(s1.children[0].template).toContain("Deep content.");
      expect(s1.children[1].id).toBe("sub2");
    });

    it("handles deep nesting: h1 → h2 → h3 → h4 → h5 → h6", async () => {
      const src = [
        "# L1",
        "## L2 {#l2}",
        "### L3 {#l3}",
        "#### L4 {#l4}",
        "##### L5 {#l5}",
        "###### L6 {#l6}",
        "Deepest content.",
      ].join("\n");
      const r = await parse(src);

      let section = r.root.children[0]; // h1
      for (let i = 2; i <= 6; i++) {
        expect(section.children).toHaveLength(1);
        expect(section.children[0].id).toBe(`l${i}`);
        section = section.children[0];
      }
      expect(section.template).toContain("Deepest content.");
    });

    it("heading at depth N pops back correctly (sibling after deeper nesting)", async () => {
      // h1 → h2 → h4 → h2 (the second h2 is sibling of first h2, NOT child of h4)
      const src = [
        "# Story",
        "## Chapter 1 {#ch1}",
        "#### Deep {#deep}",
        "Deep content.",
        "## Chapter 2 {#ch2}",
        "Chapter 2 content.",
      ].join("\n");
      const r = await parse(src);

      const story = r.root.children[0];
      expect(story.children).toHaveLength(2);
      expect(story.children[0].id).toBe("ch1");
      expect(story.children[1].id).toBe("ch2");

      // Deep is child of ch1
      expect(story.children[0].children).toHaveLength(1);
      expect(story.children[0].children[0].id).toBe("deep");
    });
  });

  // -- id generation ----------------------------------------------------------
  describe("id generation", () => {
    it("generates sequential stable ids for headings with empty titles", async () => {
      const src = ["# Story", "## ", "### ", "### ", "## ", "### "].join("\n");
      const r = await parse(src);
      const children = r.root.children[0].children;
      expect(children[0].id).toBe("id_1");
      expect(children[0].children[0].id).toBe("id_2");
      expect(children[0].children[1].id).toBe("id_3");
      expect(children[1].id).toBe("id_4");
      expect(children[1].children[0].id).toBe("id_5");
    });

    it("skips reserved ids when generating auto ids", async () => {
      const src = ["# Story", "## Reserved {#id_0}", "## ", "### "].join("\n");
      const r = await parse(src);
      const children = r.root.children[0].children;
      expect(children[0].id).toBe("id_0");
      expect(children[1].id).toBe("id_2");
      expect(children[1].children[0].id).toBe("id_3");
    });

    it("generates deterministic ids across multiple parses", async () => {
      const src = "# Story\n\n## \n\n### \n\n## ";
      const r1 = await parse(src);
      const r2 = await parse(src);
      const c1 = r1.root.children[0].children;
      const c2 = r2.root.children[0].children;
      expect(c1[0].id).toBe(c2[0].id);
      expect(c1[0].children[0].id).toBe(c2[0].children[0].id);
      expect(c1[1].id).toBe(c2[1].id);
    });

    it("does not change explicitly provided ids or title-derived ids", async () => {
      const src = [
        "# Story",
        "## Chapter A {#custom-ch}",
        "### Scene A1 {#custom-sc}",
        "## Chapter B",
        "### Scene B1",
        "## ",
        "### ",
      ].join("\n");
      const r = await parse(src);
      const children = r.root.children[0].children;
      expect(children[0].id).toBe("custom-ch");
      expect(children[0].children[0].id).toBe("custom-sc");
      expect(children[1].id).toBe("Chapter B");
      expect(children[1].children[0].id).toBe("Scene B1");
      expect(children[2].id).toBe("id_1");
      expect(children[2].children[0].id).toBe("id_2");
    });
  });

  // -- templates -------------------------------------------------------------
  describe("templates", () => {
    it("extracts root template from start to first h1", async () => {
      const src = ["Root preamble.", "Multi-line root text.", "", "# Story"].join("\n");
      const r = await parse(src);
      expect(r.root.template).toContain("Root preamble.");
      expect(r.root.template).toContain("Multi-line root text.");
    });

    it("section template includes its heading line", async () => {
      const r = await parse("# Story\n\n## Chapter 1");
      expect(r.root.children[0].template).toContain("# Story");
    });

    it("section template ends before first child heading", async () => {
      const src = [
        "## Chapter 1 {#ch1}",
        "Chapter preamble.",
        "",
        "### Scene 1 {#s1}",
        "Scene body.",
      ].join("\n");
      const r = await parse(src);
      const ch1 = r.root.children[0];
      expect(ch1.template).toContain("Chapter preamble.");
      expect(ch1.template).not.toContain("Scene body.");
    });

    it("filters script and style blocks from templates", async () => {
      const src = [
        "# Story",
        "Visible text.",
        SCRIPT_DEFAULT,
        "Also visible.",
        "<style>",
        "body { margin: 0; }",
        "</style>",
        "More visible.",
        "",
        "## Chapter 1",
      ].join("\n");
      const r = await parse(src);
      const story = r.root.children[0];
      expect(story.template).toContain("Visible text.");
      expect(story.template).toContain("Also visible.");
      expect(story.template).toContain("More visible.");
      expect(story.template).not.toContain("<script>");
      expect(story.template).not.toContain("<style>");
    });

    it("handles section heading without title text (only attrs id)", async () => {
      const src = ["## Chapter 1", "### {#no-title}", "Body after no-title heading."].join("\n");
      const r = await parse(src);
      const ch1 = r.root.children[0];
      const scene = ch1.children[0];
      expect(scene.id).toBe("no-title");
      expect(scene.title).toBe("");
      expect(scene.template).toContain("Body after no-title heading.");
    });
  });

  // -- scripts ---------------------------------------------------------------
  describe("scripts", () => {
    it("collects root-level scripts", async () => {
      const r = await parse(`Root text.\n${SCRIPT_DEFAULT}\n\n# Story`);
      expect(r.root.scripts).toHaveLength(1);
    });

    it("collects section-level scripts", async () => {
      const src = ["# Story", "## Chapter 1 {#ch1}", SCRIPT_DEFAULT, "### Scene 1 {#s1}", "Body."].join("\n");
      const r = await parse(src);
      const ch1 = r.root.children[0].children[0];
      expect(ch1.scripts).toHaveLength(1);
      expect(ch1.children[0].scripts).toEqual([]);
    });

    it("collects scene-level scripts", async () => {
      const src = ["# Story", "## Chapter 1 {#ch1}", "### Scene 1 {#s1}", SCRIPT_DEFAULT, "Scene body."].join("\n");
      const r = await parse(src);
      const s1 = r.root.children[0].children[0].children[0];
      expect(s1.scripts).toHaveLength(1);
    });

    it("script scope does not leak between sections", async () => {
      const src = [
        "# Story",
        SCRIPT_DEFAULT,
        "## Chapter 1 {#ch1}",
        SCRIPT_SCOPE,
        "### Scene 1 {#s1}",
      ].join("\n");
      const r = await parse(src);
      const story = r.root.children[0];
      expect(story.scripts).toHaveLength(1);
      expect(story.children[0].scripts).toHaveLength(1);
    });

    it("ignores empty script blocks", async () => {
      const r = await parse("# Story\n<script></script>\n\n## Chapter 1");
      expect(r.root.children[0].scripts).toEqual([]);
    });
  });

  // -- stylesheets -----------------------------------------------------------
  describe("stylesheets", () => {
    it("collects styles per section", async () => {
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
        "<style>",
        ".chapter { color: red; }",
        "</style>",
        "Chapter text.",
      ].join("\n");
      const r = await parse(src);
      const story = r.root.children[0];
      expect(story.stylesheets).toHaveLength(2);
      expect(story.stylesheets[0]).toContain("body { background: black; }");
      expect(story.stylesheets[1]).toContain("h1 { font-size: 2em; }");

      const ch1 = story.children[0];
      expect(ch1.stylesheets).toHaveLength(1);
      expect(ch1.stylesheets[0]).toContain(".chapter { color: red; }");
    });

    it("root section collects styles before first heading", async () => {
      const src = [
        "<style>",
        "root { color: green; }",
        "</style>",
        "Root text.",
        "# Story",
      ].join("\n");
      const r = await parse(src);
      expect(r.root.stylesheets).toHaveLength(1);
      expect(r.root.stylesheets[0]).toContain("root { color: green; }");
    });

    it("removes style blocks from templates", async () => {
      const src = [
        "# Story",
        "<style>",
        "body { color: red; }",
        "</style>",
        "Visible prose.",
        "",
        "## Chapter 1",
      ].join("\n");
      const r = await parse(src);
      const story = r.root.children[0];
      expect(story.template).toContain("Visible prose.");
      expect(story.template).not.toContain("body { color: red; }");
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

      const story = r.root.children[0];
      expect(story.children).toHaveLength(2);
      expect(story.children[0].id).toBe("inc-ch");
      expect(story.children[0].title).toBe("Included Chapter");
      expect(story.children[0].children[0].id).toBe("inc-sc");
      expect(story.children[1].id).toBe("local");
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
  });

  // -- error handling --------------------------------------------------------
  describe("error handling", () => {
    it("throws on duplicate full path (sibling chapters with same id)", async () => {
      const src = ["# Story", "## Chapter 1 {#dup}", "## Chapter 2 {#dup}"].join("\n");
      await expect(parse(src)).rejects.toThrow(/duplicate.*path/i);
    });

    it("allows same section id in different parents (unique full path)", async () => {
      // "ch1.dup-sc" and "ch2.dup-sc" have different full paths — allowed
      const src = [
        "## Chapter 1 {#ch1}",
        "### Scene {#dup-sc}",
        "## Chapter 2 {#ch2}",
        "### Scene {#dup-sc}",
      ].join("\n");
      const r = await parse(src);
      expect(r.root.children[0].children[0].id).toBe("dup-sc");
      expect(r.root.children[1].children[0].id).toBe("dup-sc");
    });

    it("throws on duplicate full path (same id under same parent)", async () => {
      const src = [
        "## Chapter 1 {#ch1}",
        "### Scene A {#dup-sc}",
        "### Scene B {#dup-sc}",
      ].join("\n");
      await expect(parse(src)).rejects.toThrow(/duplicate.*path/i);
    });

    it("throws on section id containing '.'", async () => {
      await expect(parse("## Bad.Section {#bad.s}")).rejects.toThrow(/must not contain.*\./i);
    });
  });

  // -- edge cases ------------------------------------------------------------
  describe("edge cases", () => {
    it("handles CRLF line endings", async () => {
      const src = "# Story\r\n## Chapter 1\r\n### Scene 1 {#s1}\r\nBody text.";
      const r = await parse(src);
      expect(r.root.children[0].title).toBe("Story");
      const ch1 = r.root.children[0].children[0];
      expect(ch1.title).toBe("Chapter 1");
      expect(ch1.children[0].id).toBe("s1");
      expect(ch1.children[0].template).toContain("Body text.");
    });

    it("handles story with only h3 scenes and no h2 (all children of h1)", async () => {
      const src = ["# Story", "### Scene 1 {#s1}", "Body 1.", "### Scene 2 {#s2}", "Body 2."].join("\n");
      const r = await parse(src);
      const story = r.root.children[0];
      // h3 under h1: depth 3, but h1 is depth 1. Since there's no h2, h3 are deeper than h1's children.
      // They become children of root since there's no depth-2 parent.
      // Actually: stack=[root(0), h1(1)], h3 has depth 3. Pop until depth < 3: stack still has depth-1 top.
      // Hmm, this means h3 would nest under h1.
      expect(story.children).toHaveLength(2);
      expect(story.children[0].id).toBe("s1");
      expect(story.children[1].id).toBe("s2");
    });

    it("handles story with no h1", async () => {
      const src = ["## Chapter 1 {#ch1}", "Chapter body.", "### Scene 1 {#s1}", "Scene body."].join("\n");
      const r = await parse(src);
      expect(r.root.title).toBe("");
      expect(r.root.children).toHaveLength(1);
      expect(r.root.children[0].id).toBe("ch1");
    });

    it("section with template but no children", async () => {
      const src = [
        "# Story",
        "## Chapter 1 {#ch1}",
        "Just a chapter, no scenes.",
        "",
        "## Chapter 2 {#ch2}",
        "### Scene 2.1 {#s1}",
        "This chapter has a scene.",
      ].join("\n");
      const r = await parse(src);
      const story = r.root.children[0];
      expect(story.children[0].template).toContain("Just a chapter");
      expect(story.children[0].children).toEqual([]);
      expect(story.children[1].children).toHaveLength(1);
    });

    it("root has auto-generated id", async () => {
      const r = await parse("# Story");
      expect(r.root.id).toMatch(/^id_\d+$/);
    });
  });
});
