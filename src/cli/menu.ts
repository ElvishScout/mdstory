import fs from "node:fs";
import { select, input } from "@inquirer/prompts";

// ── types ───────────────────────────────────────────────────────────

/** Sentinel returned by {@link GameMenu.prompt} when the user navigates back. */
export const BACK = "__back__";

/**
 * A single node in the menu tree.
 *
 * Leaf items have a `value` (the action string dispatched to
 * {@link GameMenu.handle}).  Branch items additionally carry `children`
 * — selecting one opens that submenu.
 */
export interface MenuItem {
  label: string;
  value: string;
  children?: MenuItem[];
}

// ── helpers ─────────────────────────────────────────────────────────

/** Build an inquirer choice list from a flat array of menu items. */
function toChoices(items: MenuItem[]): { name: string; value: string }[] {
  const choices: { name: string; value: string }[] = [];
  for (const item of items) {
    choices.push({ name: item.label, value: item.value });
  }
  choices.push({ name: "← Back", value: BACK });
  return choices;
}

// ── GameMenu ────────────────────────────────────────────────────────

/** Session operations the menu delegates to its owner (the play loop). */
export interface GameMenuActions {
  /** Returns the active session's wrapped save data. */
  save(): any | Promise<any>;
  /** Prepares a replacement session from loaded save data. */
  load(data: any): void | Promise<void>;
}

/**
 * In-game menu shown when the player presses Escape.
 *
 * Built around a tree of {@link MenuItem} nodes so that multi-level menus
 * can be added later without changing the navigation or dispatch logic.
 * Owns only UI and dispatch — session lifecycle stays with the caller,
 * behind {@link GameMenuActions}.
 *
 * Default items: **Save** / **Load** / **Return**.
 */
export class GameMenu {
  private actions: GameMenuActions;
  private items: MenuItem[];

  constructor(actions: GameMenuActions, items?: MenuItem[]) {
    this.actions = actions;
    this.items = items ?? GameMenu.defaultItems();
  }

  /** The default top-level menu. */
  static defaultItems(): MenuItem[] {
    return [
      { label: "Save", value: "save" },
      { label: "Load", value: "load" },
    ];
  }

  // ── navigation ──────────────────────────────────────────────────

  /**
   * Walk the menu tree interactively.
   *
   * Shows inquirer lists for the current level; descends into submenus
   * and handles "← Back" navigation automatically.
   *
   * @returns The action string of the leaf item the user ultimately chose.
   */
  async prompt(): Promise<string> {
    let current = this.items;
    const stack: MenuItem[][] = [];

    while (true) {
      const choices = toChoices(current);

      const value = await select({ message: "Menu", choices });

      if (value === BACK) {
        if (stack.length > 0) {
          current = stack.pop()!;
          continue;
        }
        return BACK;
      }

      const selected = current.find((i) => i.value === value);
      if (selected?.children) {
        stack.push(current);
        current = selected.children;
        continue;
      }

      return value;
    }
  }

  // ── dispatch ─────────────────────────────────────────────────────

  /**
   * Execute the action returned by {@link prompt}.
   *
   * @returns `true` if the session should be restarted (after a load),
   *          `false` otherwise.
   */
  async handle(action: string): Promise<boolean> {
    switch (action) {
      case "save":
        return await this.doSave();
      case "load":
        return await this.doLoad();
      default:
        return false;
    }
  }

  // ── private helpers ──────────────────────────────────────────────

  private async doSave(): Promise<boolean> {
    const path = await input({ message: "Save to:", default: "save.json" });
    if (!path) {
      return false;
    }
    const data = await this.actions.save();
    fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
    console.log("Progress saved.");
    return false;
  }

  private async doLoad(): Promise<boolean> {
    const path = await input({ message: "Load from:", default: "save.json" });
    if (!path) {
      return false;
    }
    if (!fs.existsSync(path)) {
      console.log("No save file found.");
      return false;
    }
    try {
      const raw = fs.readFileSync(path, "utf-8");
      const data = JSON.parse(raw);
      await this.actions.load(data);
      console.log("Progress loaded.");
      return true;
    } catch {
      console.log("Failed to load save.");
      return false;
    }
  }
}
