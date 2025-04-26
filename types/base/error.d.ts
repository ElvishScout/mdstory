export declare class InvalidMetadataError extends Error {
    content: string;
    constructor(content: string, message?: string);
}
export declare class DuplicateIdError extends Error {
    id: string;
    constructor(id: string, message?: string);
}
export declare class EmptyChapterIdError extends Error {
    constructor(message?: string);
}
export declare class ChapterNotFoundError extends Error {
    target: string | null;
    constructor(target: string | null, message?: string);
}
export declare class InvalidInputError extends Error {
    name: string;
    input: string | null;
    constructor(name: string, input: string | null, message?: string);
}
