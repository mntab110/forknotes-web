import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const appStoreUrl = 'https://apps.apple.com/app/id6782392550';
const home = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const open = readFileSync(new URL('./open.html', import.meta.url), 'utf8');
const invite = readFileSync(new URL('./accept-invite.html', import.meta.url), 'utf8');

test('launch CTAs and QR point to the ForkSmart listing', () => {
  assert.equal(home.includes('Coming Soon'), false);
  assert.equal(home.includes('Coming to the App Store'), false);
  assert.equal((home.match(/href="https:\/\/apps\.apple\.com\/app\/id6782392550"/g) || []).length, 4);
  assert.equal((home.match(/src="\/Assets\/app-store-qr\.svg"/g) || []).length, 2);
  assert.ok(existsSync(new URL('./Assets/app-store-qr.svg', import.meta.url)));
  assert.ok(home.includes('apple-itunes-app" content="app-id=6782392550"'));
});

test('install fallbacks do not retain coming-soon copy or dead links', () => {
  assert.ok(open.includes(appStoreUrl));
  assert.ok(invite.includes(appStoreUrl));
  assert.equal(open.includes('coming to the App Store'), false);
  assert.equal(invite.includes('id="storeBtn" href="#"'), false);
});
