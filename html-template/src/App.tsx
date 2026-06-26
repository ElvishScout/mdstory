import { Story, fromParsed } from "../../";
import { useEffect, useMemo, useState } from "react";

import StoryPlayer from "./components/StoryPlayer";
import { unescapeHtml } from "./utils";

export default function App() {
  const [story, setStory] = useState<Story>();
  const debug = useMemo(() => new URLSearchParams(window.location.search).get("debug") === "1", []);

  useEffect(() => {
    const originalTitle = document.title;

    const sourceScript = document.querySelector<HTMLScriptElement>("#parsed-story")!;
    const parsedStory = JSON.parse(unescapeHtml(sourceScript.textContent!));
    fromParsed(parsedStory).then((story) => {
      document.title = story.title;
      setStory(story);
    });

    return () => {
      document.title = originalTitle;
    };
  }, []);

  return <>{story && <StoryPlayer story={story} debug={debug} />}</>;
}
