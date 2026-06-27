import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

window.PLACEHOLDER_STORY = __PLACEHOLDER_STORY__;

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
