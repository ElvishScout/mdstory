declare module "markdown-it-mark" {
  import type MarkdownIt from "markdown-it";

  function plugin(md: MarkdownIt): void;
  export default plugin;
}
