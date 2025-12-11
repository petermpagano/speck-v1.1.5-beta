import { h, render } from "preact";
import App from "./.compiled/App.jsx";
import { SpeckAgent } from "./lib/agent-runtime.js";

// Make SpeckAgent available globally
window.SpeckAgent = SpeckAgent;

render(h(App, {}), document.getElementById("app"));
