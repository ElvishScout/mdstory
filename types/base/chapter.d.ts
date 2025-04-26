import { ValueType, Value, ChapterHooks, Scope } from "./definitions.js";
type MarkdownOptions = {};
type HtmlOptions = {
    tagMap?: Record<string, string>;
};
export type RenderOptions = ({
    format: "markdown";
} & MarkdownOptions) | ({
    format: "html";
} & HtmlOptions);
type Fields = {
    inputs: {
        name: string;
        type: ValueType;
        value: Value;
    }[];
    sets: {
        name: string;
        type: ValueType;
        value: Value;
    }[];
    navs: {
        text: string;
        target: string | null;
    }[];
};
export type RenderResult = {
    text: string;
} & Fields;
export type ChapterOptions = {
    id: string;
    title: string;
    template: string;
    hooks: ChapterHooks;
};
export declare class Chapter {
    id: string;
    title: string;
    template: string;
    hooks: ChapterHooks;
    constructor({ id, title, template, hooks }: ChapterOptions);
    render(scope: Scope, options: RenderOptions): RenderResult;
}
export {};
