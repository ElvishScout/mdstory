export class InvalidMetadataError extends Error {
  content: string;
  constructor(content: string, message?: string) {
    super(message ?? `Invalid metadata:\n\`\`\`\n${content}\n\`\`\``);
    this.content = content;
  }
}

export class DuplicateIdError extends Error {
  id: string;
  constructor(id: string, message?: string) {
    super(message ?? `Two chapters with the same id \`${id}\`.`);
    this.id = id;
  }
}

export class EmptyChapterIdError extends Error {
  constructor(message?: string) {
    super(message ?? `Chapter id cannot be empty, either use an non-empty chapter title or explicitly specify an id.`);
  }
}

export class ChapterNotFoundError extends Error {
  target: string | null;
  constructor(target: string | null, message?: string) {
    super(message ?? `Chapter \`${target}\` not found.`);
    this.target = target;
  }
}

export class InvalidInputError extends Error {
  name: string;
  input: string | null;
  constructor(name: string, input: string | null, message?: string) {
    super(message ?? `Invalid input \`${input}\` for variable \`${name}\`.`);
    this.name = name;
    this.input = input;
  }
}
