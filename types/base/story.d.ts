import { StoryHooks, Scope, Metadata, ChapterHooks } from "./definitions.js";
import { Chapter, RenderOptions, RenderResult } from "./chapter.js";
export type StoryPrompt = (props: {
    chapter: Chapter;
} & RenderResult) => Promise<{
    target: string | null;
    updates: Scope;
} | FormData>;
type ChapterBody = {
    title: string;
    template: string;
    hooks: ChapterHooks;
};
type StoryBody = {
    metadata: Metadata;
    chapters: Record<string, ChapterBody>;
    entry: string | null;
    hooks: StoryHooks;
    stylesheet: string;
};
export declare const parseStoryContent: (content: string) => StoryBody;
export declare class StoryBase {
    metadata: Metadata;
    globals: Scope;
    chapters: Record<string, Chapter>;
    entry: Chapter | null;
    hooks: StoryHooks;
    stylesheet: string;
    constructor({ metadata, chapters, entry, hooks, stylesheet }: StoryBody);
    play(prompt: StoryPrompt, options: RenderOptions): Promise<void>;
}
export {};
