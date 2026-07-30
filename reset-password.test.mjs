// Regression guard for the web password-reset screen's show/hide controls.
// No framework in this static repo — run directly:  node reset-password.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./reset-password.html", import.meta.url), "utf8");
let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log("  ✔", name);
};

console.log("reset-password.html password visibility:");

check("both password fields start hidden (type=password)", () => {
  assert.match(html, /id="newPassword"[^>]*type="password"|type="password"[^>]*id="newPassword"/);
  assert.match(html, /id="confirmPassword"[^>]*type="password"|type="password"[^>]*id="confirmPassword"/);
});

check("each field has its OWN toggle button (independent)", () => {
  assert.match(html, /toggleVisibility\('newPassword', this\)/);
  assert.match(html, /toggleVisibility\('confirmPassword', this\)/);
});

check("toggle preserves the value (flips input.type only, no value reset)", () => {
  assert.match(html, /input\.type = isText \? 'password' : 'text'/);
  assert.doesNotMatch(html, /\.value\s*=\s*['"]{2}/); // never clears the value on toggle
});

check("accessible Show/Hide password labels (static default + dynamic)", () => {
  // Both buttons default to "Show password" while hidden.
  const showCount = (html.match(/aria-label="Show password"/g) || []).length;
  assert.ok(showCount >= 2, `expected 2 default "Show password" labels, got ${showCount}`);
  // Toggling swaps the label.
  assert.match(html, /setAttribute\('aria-label', isText \? 'Show password' : 'Hide password'\)/);
});

console.log(`\n${passed} checks passed.`);
