import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const storeDirectory = resolve(scriptDirectory, '../store/ios');
const localizationDirectory = resolve(storeDirectory, 'en-US');

async function read(relativePath) {
  return (await readFile(resolve(localizationDirectory, relativePath), 'utf8')).trim();
}

const name = await read('name.txt');
const subtitle = await read('subtitle.txt');
const promotionalText = await read('promotional_text.txt');
const keywords = await read('keywords.txt');
const description = await read('description.txt');

assert.ok([...name].length >= 2 && [...name].length <= 30, 'name must be 2–30 characters');
assert.ok([...subtitle].length <= 30, 'subtitle must be at most 30 characters');
assert.ok([...promotionalText].length <= 170, 'promotional text must be at most 170 characters');
assert.ok(Buffer.byteLength(keywords, 'utf8') <= 100, 'keywords must be at most 100 UTF-8 bytes');
assert.ok(
  keywords.split(',').every(keyword => [...keyword.trim()].length > 2),
  'every keyword must be longer than two characters',
);
assert.ok([...description].length <= 4000, 'description must be at most 4,000 characters');

for (const file of ['support_url.txt', 'marketing_url.txt']) {
  const value = await read(file);
  assert.equal(new URL(value).protocol, 'https:', `${file} must use HTTPS`);
}

const privacyUrl = (
  await readFile(resolve(storeDirectory, 'privacy_policy_url.txt'), 'utf8')
).trim();
assert.equal(new URL(privacyUrl).protocol, 'https:', 'privacy policy URL must use HTTPS');

console.log(
  `Validated iOS metadata: name ${[...name].length}/30, subtitle ${[...subtitle].length}/30, `
  + `promotional text ${[...promotionalText].length}/170, keywords `
  + `${Buffer.byteLength(keywords, 'utf8')}/100 bytes, description ${[...description].length}/4000.`,
);
