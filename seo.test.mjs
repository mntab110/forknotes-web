// Static-site regression guards. Run: node --test *.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const home = read('index.html');
const support = read('support.html');
const publicPages = ['index.html', 'support.html', 'privacy.html', 'terms.html'];
const utilityPages = ['reset-password.html', 'email-confirmed.html', 'accept-invite.html', 'open.html'];
const plain = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const faq = question => {
  const blocks = Array.from(support.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g), m => m[1]);
  const block = blocks.find(block => block.match(/<summary>(.*?)<\/summary>/s)?.[1] === question);
  assert.ok(block, `Missing FAQ: ${question}`);
  return plain(block);
};

test('homepage description is a concise, factual product summary', () => {
  const description = home.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(description.length >= 120 && description.length <= 170, `Description length: ${description.length}`);
  assert.match(description, /ForkSmart/);
  assert.match(description, /private dining journal/);
  assert.match(description, /iPhone/);
  assert.match(home, /<title>ForkSmart — Your Private Dining Journal/);
});

test('application structured data identifies the actual publisher website', () => {
  const blocks = Array.from(home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), m => JSON.parse(m[1]));
  const app = blocks.find(block => block['@type'] === 'SoftwareApplication');
  assert.ok(app, 'Missing application structured data');
  assert.equal(app.name, 'ForkSmart');
  assert.equal(app.url, 'https://forksmart.app/');
  assert.equal(app.publisher.name, 'AppSimple LLC');
  assert.equal(app.publisher.url, 'https://appsimple.com/');
  assert.ok(!app.aggregateRating && !app.review, 'Do not invent app ratings or reviews');
});

test('account deletion FAQ uses the current subscription-screen route and both deletion timings', () => {
  const answer = faq('How do I delete my account?');
  assert.match(answer, /Settings → Subscriptions → Delete Account/);
  assert.doesNotMatch(answer, /Settings → Account → Delete Account/);
  assert.match(answer, /signs you out immediately/);
  assert.match(answer, /prevents further sign-in/);
  assert.match(answer, /24 hours/);
  assert.match(answer, /cannot be undone/);
  assert.match(answer, /scheduled deletion/i);
  assert.match(answer, /optional/);
});

test('export FAQ states eligibility and the real Settings label', () => {
  const answer = faq('How do I export my information?');
  assert.match(answer, /Plus and Pro/);
  assert.match(answer, /Settings → Export My Data/);
  assert.match(answer, /Free/);
  assert.match(answer, /upgrade/i);
});

test('free FAQ defines experiences as visits and reflects the 10-experience allowance', () => {
  const answer = faq('Is ForkSmart free?');
  assert.match(answer, /up to 10 dining experiences/);
  assert.match(answer, /up to 5 photos per experience/);
  assert.match(answer, /visit/);
  assert.match(answer, /same restaurant/);
  assert.doesNotMatch(answer, /20 (?:visits|experiences)/);
  assert.match(plain(home), /Start free with up to 10 dining experiences/);
  assert.match(home, /href="\/support#plans"/);
  assert.match(support, /id="plans"/);
});

test('paid-plan FAQ explains actual Plus and Pro capabilities without fixed prices', () => {
  const answer = faq('Which features require Plus or Pro?');
  assert.match(answer, /Plus/);
  assert.match(answer, /unlimited dining experiences/);
  assert.match(answer, /up to 20 photos per experience/);
  assert.match(answer, /data export/);
  assert.match(answer, /Pro/);
  assert.match(answer, /partnership/i);
  assert.match(answer, /two accounts/);
  assert.match(answer, /up to two shared members/);
  assert.match(answer, /meal expense reports/i);
  assert.doesNotMatch(answer, /\$\d/);
});

test('plan comparison anchor clears the sticky navigation', () => {
  assert.ok(support.includes('details#plans { scroll-margin-top: 90px; }'), 'Plan link must not hide the FAQ heading behind the sticky navigation');
});

test('homepage does not imply export is included on Free', () => {
  assert.doesNotMatch(home, /Export and save your data at any time — it’s yours/);
  assert.match(plain(home), /On Plus and Pro, export and save your data/);
});

test('sharing section shows the complete finished postcard, not the generation screen', () => {
  const section = home.match(/<section\b[^>]*aria-labelledby="share-h"[^>]*>([\s\S]*?)<\/section>/)[1];
  assert.match(section, /class="shot postcard"/);
  assert.match(section, /src="\/Assets\/opt\/07-forksmart-postcard-800\.jpg"/);
  assert.match(section, /srcset="\/Assets\/opt\/07-forksmart-postcard-480\.jpg 480w, \/Assets\/opt\/07-forksmart-postcard-800\.jpg 800w"/);
  assert.match(section, /width="800" height="1066"/);
  assert.match(section, /alt="Finished ForkSmart postcard/);
  assert.doesNotMatch(section, /07-share-the-memory/);
  assert.ok(home.includes('.shot.postcard { border-radius: 0; }'), 'Do not clip the postcard’s own border with screenshot corner styling');
});

for (const file of publicPages) {
  test(`${file} stays indexable with one canonical URL`, () => {
    const html = read(file);
    const robots = Array.from(html.matchAll(/<meta name="robots" content="([^"]+)"/g), m => m[1]);
    assert.deepEqual(robots, ['index, follow']);
    const canonicals = Array.from(html.matchAll(/<link rel="canonical" href="([^"]+)"/g), m => m[1]);
    assert.deepEqual(canonicals, [`https://forksmart.app/${file === 'index.html' ? '' : file.replace('.html', '')}`]);
    assert.doesNotMatch(html, /ForkNotes/);
  });
}

for (const file of utilityPages) {
  test(`${file} opts out of indexing but remains crawlable`, () => {
    const robots = Array.from(read(file).matchAll(/<meta name="robots" content="([^"]+)"/g), m => m[1]);
    assert.deepEqual(robots, ['noindex, follow']);
    assert.doesNotMatch(read('sitemap.xml'), new RegExp(file.replace('.html', '')));
  });
}

test('crawler policy and canonical-domain redirects are preserved', () => {
  assert.match(read('robots.txt'), /User-agent: \*\s+Allow: \//);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/forksmart\.app\/sitemap\.xml/);
  assert.match(read('_redirects'), /https:\/\/forknotes\.com\/\*\s+https:\/\/forksmart\.app\/:splat\s+301!/);
});

test('homepage still routes authentication hashes before rendering', () => {
  assert.match(home, /type === 'email_change' \|\| type === 'signup'/);
  assert.match(home, /window\.location\.replace\('\/email-confirmed' \+ window\.location\.hash\)/);
  assert.match(home, /window\.location\.replace\('\/reset-password' \+ window\.location\.hash\)/);
});

test('all pages use the smaller local logo without changing displayed dimensions', () => {
  for (const file of [...publicPages, ...utilityPages]) {
    const html = read(file);
    assert.doesNotMatch(html, /supabase\.co\/storage\/v1\/object\/public\/assets\/email\/logo-icon\.png/);
    if (file !== 'open.html') assert.match(html, /src="\/Assets\/opt\/logo-icon\.png"/);
  }
  assert.match(home, /href="\/Assets\/opt\/apple-touch-icon\.png"/);
  assert.match(home, /src="\/Assets\/opt\/logo-icon\.png" alt="" width="34" height="34"/);
  for (const [name, width] of [['logo-icon.png', 128], ['apple-touch-icon.png', 180]]) {
    const url = new URL(`Assets/opt/${name}`, import.meta.url);
    assert.ok(existsSync(url), `Missing asset: ${name}`);
    const png = readFileSync(url);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), width);
    assert.ok(statSync(url).size < 35000, `Oversized icon: ${name}`);
  }
});

test('referenced local images and video exist', () => {
  const paths = [...new Set(Array.from(home.matchAll(/\/Assets\/[A-Za-z0-9._/-]+/g), m => m[0]))];
  assert.ok(paths.length > 10, 'Asset check must cover the actual homepage');
  for (const path of paths) assert.ok(existsSync(new URL(path.slice(1), import.meta.url)), `Missing asset: ${path}`);
});
