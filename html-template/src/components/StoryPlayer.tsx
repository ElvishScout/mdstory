import { Story, StoryPrompt } from "../../../";
import { memo, SyntheticEvent, KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import parse, { domToReact, DOMNode, HTMLReactParserOptions, Element as ParserElement } from "html-react-parser";
import { produce } from "immer";

import FcInput from "./FcInput";

const useParserOptions = (enabled: boolean): HTMLReactParserOptions => ({
  replace(node) {
    if (node.type === "tag") {
      node = node as ParserElement;
      if (node.tagName === "input") {
        const { type, name, value, checked } = node.attribs;
        return (
          <FcInput
            className="
              mx-1 [&.fc-input-text]:border-b-2 [&.fc-input-text]:border-red-700
              [&_.fc-circle]:border-2 [&_.fc-circle]:border-red-700 [&_.fc-circle]:rounded-full
              [&.fc-input-text]:has-disabled:bg-red-100
            "
            type={type}
            name={name}
            defaultValue={value}
            defaultChecked={checked !== undefined}
            disabled={!enabled}
          />
        );
      } else if (node.tagName === "button") {
        const { type, name, value } = node.attribs;
        return (
          <button
            className="mx-0.5 text-red-600 hover:text-red-400 active:text-red-300 disabled:text-red-600 underline cursor-pointer"
            type={type as "button" | "submit" | "reset" | undefined}
            name={name}
            value={value}
            disabled={!enabled}
          >
            {domToReact(node.childNodes as DOMNode[], useParserOptions(enabled))}
          </button>
        );
      }
    }
  },
});

const FormBody = memo(({ html, enabled }: { html: string; enabled: boolean }) => {
  return parse(html, useParserOptions(enabled));
});

type SceneLog = {
  html: string;
};

export default function StoryPlayer({ story }: { story: Story }) {
  const [stage, setStage] = useState<"ready" | "started" | "ended">("ready");
  const [scenes, setScenes] = useState<SceneLog[]>([]);

  const sceneRef = useRef<HTMLDivElement>(null);
  const sceneCoverRef = useRef<HTMLDivElement>(null);
  const resolveRef = useRef<(formData: FormData) => void>(null);

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const cover = sceneCoverRef.current;
    if (scene) {
      scene.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (cover) {
      const animation = cover.animate([{ top: "-100%" }, { top: "100%" }], { duration: 1000 });
      animation.play();
    }
  }, [scenes]);

  const prompt: StoryPrompt = async ({ text }) => {
    setScenes(
      produce((draft) => {
        draft.push({ html: text });
      }),
    );
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleCoverClick = () => {
    story.play(prompt, { renderer: "html" }).then(() => setStage("ended"));
    setStage("started");
  };

  const handleFormKeyDown = (ev: KeyboardEvent<HTMLFormElement>) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
    }
  };

  const handleFormSubmit = (ev: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    ev.preventDefault();
    if (resolveRef.current) {
      const formData = new FormData(ev.currentTarget, ev.nativeEvent.submitter);
      resolveRef.current(formData);
      resolveRef.current = null;
    }
  };

  return (
    <div className="px-2 md:px-12">
      <div>
        {scenes.map(({ html }, i) => {
          const enabled = stage === "started" && i === scenes.length - 1;
          return (
            <div
              key={i}
              ref={enabled ? sceneRef : undefined}
              className={`relative px-2 pt-8 first:pt-4 md:first:pt-8 pb-8 last:pb-[33vh] first:mt-0 border-b-2 border-red-700 last:border-none overflow-hidden ${
                !enabled ? "opacity-50" : ""
              }`}
            >
              <form
                className="chapter-form"
                onKeyDown={handleFormKeyDown}
                onSubmit={enabled ? handleFormSubmit : (ev) => ev.preventDefault()}
              >
                <FormBody html={html} enabled={enabled} />
              </form>
              {enabled && (
                <div
                  ref={sceneCoverRef}
                  className="absolute left-0 right-0 top-[100%] h-[200%] bg-linear-[to_bottom,transparent_0%,#ffffff_50%,#ffffff_100%] z-10"
                ></div>
              )}
            </div>
          );
        })}
      </div>
      {stage === "ready" && (
        <div
          className="fixed inset-0 flex flex-col justify-center items-center text-4xl leading-0 select-none backdrop-blur-xs z-10 after:content-[''] after:h-16"
          onClick={handleCoverClick}
        >
          Click to start
        </div>
      )}
    </div>
  );
}
