// Guard: the "Open ForkSmart" button must deep-link to the confirmation path so
// the app can drop the stale "Check your email" state and show Log In.
// Run:  node email-confirmed.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./email-confirmed.html", import.meta.url), "utf8");

console.log("email-confirmed.html:");
assert.match(
  html,
  /href="forknotes:\/\/email-confirmed"/,
  '"Open ForkSmart" must link to forknotes://email-confirmed',
);
console.log("  ✔ Open ForkSmart → forknotes://email-confirmed");
// No bare forknotes:// that would open the app without the reset signal.
assert.doesNotMatch(html, /href="forknotes:\/\/"/, "bare forknotes:// must be gone");
console.log("  ✔ no bare forknotes:// link");
console.log("\n2 checks passed.");
