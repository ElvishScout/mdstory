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
      args: [(Asset | string)?, ...unknown[]];
      options: { url?: string; mime?: string; width?: string | number; height?: string | number; label?: string };
    }) {
      if (typeof asset === "string") {
        asset = { url: asset };
      }
      const attrs: HtmlAttrs = {
        width: options.width,
        height: options.height,
        data: options.url ?? asset?.url,
        type: options.mime ?? asset?.mime,
      };
      const html = createElementHtml("object", attrs);
      if (options.label !== undefined) {
        return `<figure>${html}<figcaption>${options.label}</figcaption></figure>`;
      }
      return html;
    },
  },
};
