import { htmlAdapter, type Asset, type RenderAdapter } from "../../../../src";
import { createElementHtml, type HtmlAttrs } from "../../../../src/utils";

export const customAdapter: RenderAdapter = {
  format: "html",
  helpers: {
    ...htmlAdapter.helpers,
    embed({
      args: [asset],
      options,
    }: {
      args: [Asset?, ...any[]];
      options: { width?: string | number; height?: string | number; label?: string };
    }) {
      if (!asset) {
        return "";
      }
      const attrs: HtmlAttrs = {
        width: options.width,
        height: options.height,
        type: asset.mime,
        data: asset.url,
      };
      const html = createElementHtml("object", attrs);
      if (options.label !== undefined) {
        return `<figure>${html}<figcaption>${options.label}</figcaption></figure>`;
      }
      return html;
    },
  },
};
