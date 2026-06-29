import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginTerminal from "markdown-it-terminal";
import pluginMark from "markdown-it-mark";

export function createMarkdownRenderer(): MarkdownIt {
  const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginTerminal).use(pluginMark);

  // fix unsupported tags
  const defaultHtmlInline = md.renderer.rules.html_inline!;
  md.renderer.rules.html_inline = (tokens, idx, ...args) => {
    const tag = tokens[idx].content;
    if (tag === "<u>") {
      return "\x1b[4m";
    }
    if (tag === "</u>") {
      return "\x1b[24m";
    }
    if (tag === "<br>") {
      return "\n";
    }
    return defaultHtmlInline(tokens, idx, ...args);
  };

  const defaultHeadingClose = md.renderer.rules.heading_close;
  md.renderer.rules.heading_close = (...args) => {
    return (defaultHeadingClose?.(...args) ?? "") + "\n";
  };

  md.renderer.rules.mark_open = () => "\x1b[7m";
  md.renderer.rules.mark_close = () => "\x1b[27m";

  // markdown-it-terminal has a bug: blockquote_open/close don't declare (tokens, idx) params
  md.renderer.rules.blockquote_open = () => "";
  md.renderer.rules.blockquote_close = () => "\n";

  return md;
}
