// Verifies fine-grained reactivity: signal-backed state drives DOM updates.
import { repoRoot, assert, setupDom, bundleAndImport, tick } from "./helpers.mjs";

export async function run() {
  setupDom();

  const entry = `
    import { h, render } from "preact";
    import Counter from "./src/.compiled/Counter.jsx";
    import SignalsDemo from "./src/.compiled/SignalsDemo.jsx";
    export { Counter, SignalsDemo, h, render };
  `;
  const mod = await bundleAndImport(entry, repoRoot, "reactivity");

  // --- Counter: <state count={0} /> + state.count.value++ ---
  const counterEl = document.createElement("div");
  document.body.appendChild(counterEl);
  mod.render(mod.h(mod.Counter, {}), counterEl);
  await tick();

  assert(
    /Count:\s*0/.test(counterEl.textContent),
    "Counter renders initial signal value (Count: 0)"
  );

  const incrementBtn = [...counterEl.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Increment")
  );
  assert(incrementBtn, "Counter renders the Increment button");

  incrementBtn.click();
  await tick();
  assert(
    /Count:\s*1/.test(counterEl.textContent),
    "clicking Increment updates the DOM (Count: 1)"
  );

  incrementBtn.click();
  incrementBtn.click();
  await tick();
  assert(
    /Count:\s*3/.test(counterEl.textContent),
    "repeated updates propagate (Count: 3)"
  );

  // --- SignalsDemo: conditional <if> blocks react to signal changes ---
  const demoEl = document.createElement("div");
  document.body.appendChild(demoEl);
  mod.render(mod.h(mod.SignalsDemo, {}), demoEl);
  await tick();

  assert(
    demoEl.textContent.includes("Click the button to start counting!"),
    "SignalsDemo shows the count === 0 branch initially"
  );

  const demoIncrement = [...demoEl.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Increment")
  );
  const demoReset = [...demoEl.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Reset")
  );
  assert(demoIncrement && demoReset, "SignalsDemo renders both buttons");

  demoIncrement.click();
  await tick();
  assert(
    demoEl.textContent.includes("Nice! Keep going!"),
    "<if> branch switches when the signal changes (0 < count < 5)"
  );

  for (let i = 0; i < 5; i++) demoIncrement.click();
  await tick();
  assert(
    demoEl.textContent.includes("You are on fire!"),
    "<if> branch switches again at count >= 5"
  );

  demoReset.click();
  await tick();
  assert(
    demoEl.textContent.includes("Click the button to start counting!"),
    "Reset sets the signal back to 0 and the DOM follows"
  );
}
