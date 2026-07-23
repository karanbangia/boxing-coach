import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const heroPath = path.join(dir, 'editorial-boxer-hero.png');
const hero = fs.readFileSync(heroPath).toString('base64');

const C = {
  canvas: '#090909', bg: '#131313', surface: '#1A1A1A', muted: '#202020',
  border: '#333333', text: '#F5F0EF', textMuted: '#D1CFCF', peach: '#F9BDAD',
  red: '#FF1414', redGlow: '#FF5A4F', green: '#22C55E', white: '#FFFFFF', black: '#070707'
};

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, size = 16, family = 'Archivo Narrow', weight = 400, fill = C.text, anchor = 'start', spacing = 0) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${esc(value)}</text>`;
const lines = (x, y, values, size, family, weight, fill, gap, anchor = 'start', spacing = 0) =>
  values.map((v, i) => text(x, y + i * gap, v, size, family, weight, fill, anchor, spacing)).join('');
const rect = (x, y, w, h, r, fill, stroke = 'none', sw = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const circle = (cx, cy, r, fill, stroke = 'none', sw = 0) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const check = (x, y, selected = true) => selected
  ? `${circle(x, y, 11, C.red)}<path d="M${x-5} ${y}l3.5 3.5 7-8" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
  : circle(x, y, 10, 'none', '#555555', 2);
const statusBar = () => `${text(24, 31, '9:41', 12, 'Barlow Semi Condensed', 600)}${text(326, 31, '●  ◒  ▰', 10, 'Barlow Semi Condensed', 600, C.text)}`;
const header = (step, total = 7, skip = true) => {
  const pct = 342 * (step / total);
  return `${circle(34, 70, 18, C.muted, C.border, 1)}<path d="M39 70H29m0 0 5-5m-5 5 5 5" fill="none" stroke="${C.text}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    + (skip ? text(356, 75, 'SKIP', 12, 'Barlow Semi Condensed', 600, C.textMuted, 'end', 1) : '')
    + rect(24, 101, 342, 4, 2, '#292929') + rect(24, 101, pct, 4, 2, C.red)
    + text(24, 128, `${step} / ${total}`, 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4);
};
const button = (label, y = 728, variant = 'primary') => {
  const primary = variant === 'primary';
  return rect(24, y, 342, 56, 18, primary ? C.red : C.surface, primary ? C.red : C.border, 1)
    + text(195, y + 35, label, 15, 'Barlow Semi Condensed', 600, primary ? C.white : C.text, 'middle', 1.2)
    + (primary ? `<path d="M330 ${y+28}h11m0 0-4-4m4 4-4 4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : '');
};
const card = (y, title, subtitle, selected = false, badge = '', x = 24, w = 342, h = 78) =>
  rect(x, y, w, h, 18, selected ? '#26191A' : C.surface, selected ? C.red : C.border, selected ? 2 : 1)
  + circle(x + 34, y + h / 2, 17, selected ? C.red : C.muted)
  + text(x + 34, y + h / 2 + 5, badge, 13, 'Barlow Semi Condensed', 600, selected ? C.white : C.peach, 'middle')
  + text(x + 62, y + 30, title, 17, 'Archivo Narrow', 700)
  + text(x + 62, y + 53, subtitle, 12, 'Archivo Narrow', 400, C.textMuted)
  + check(x + w - 27, y + h / 2, selected);
const screenTitle = (titleLines, subtitleLines) => lines(24, 174, titleLines, 31, 'Anton', 400, C.text, 35, 'start', 0.5)
  + lines(24, 231 + (titleLines.length - 1) * 35, subtitleLines, 14, 'Archivo Narrow', 400, C.textMuted, 20);

const screens = [];

screens.push(statusBar()
  + `<image href="data:image/png;base64,${hero}" x="0" y="0" width="390" height="548" preserveAspectRatio="xMidYMid slice"/>`
  + `<rect x="0" y="0" width="390" height="548" fill="url(#heroTint)"/>`
  + `<path d="M0 394C95 358 173 427 273 392c43-15 81-13 117-2v252H0z" fill="url(#heroFade)"/>`
  + rect(24, 437, 108, 28, 14, C.red) + text(78, 456, 'BOXING COACH', 11, 'Barlow Semi Condensed', 600, C.white, 'middle', 1.6)
  + lines(24, 516, ['YOUR CORNER', 'STARTS HERE'], 42, 'Anton', 400, C.text, 47, 'start', 0.8)
  + lines(24, 624, ['Build a fighter profile and get training that', 'feels made for your level, goal, and routine.'], 15, 'Archivo Narrow', 400, C.textMuted, 22)
  + button('BUILD MY FIGHTER', 704)
  + text(195, 794, 'SKIP FOR NOW', 12, 'Barlow Semi Condensed', 600, C.textMuted, 'middle', 1.3)
  + text(195, 824, 'Already have an account?  SIGN IN', 12, 'Archivo Narrow', 600, C.peach, 'middle'));

screens.push(statusBar() + header(1)
  + screenTitle(['WHAT SHOULD', 'COACH CALL YOU?'], ['Your name or ring nickname. You can change it anytime.'])
  + text(24, 314, 'FIGHTER NAME', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4)
  + rect(24, 330, 342, 68, 18, C.surface, C.red, 2)
  + text(45, 372, 'Karan', 20, 'Archivo Narrow', 600)
  + rect(24, 420, 342, 92, 18, C.muted, C.border, 1)
  + circle(52, 450, 14, '#351B1B') + text(52, 455, 'i', 14, 'Archivo Narrow', 700, C.peach, 'middle')
  + lines(76, 448, ['This stays private on your fighter profile.', 'If you skip onboarding, we won’t ask for a name.'], 13, 'Archivo Narrow', 400, C.textMuted, 21)
  + button('CONTINUE', 728));

screens.push(statusBar() + header(2)
  + screenTitle(['HOW EXPERIENCED', 'ARE YOU?'], ['This personalizes coaching language, not workout access.'])
  + card(290, 'Beginner', 'Learning stance, guard, and basic punches', true, '01')
  + card(382, 'Intermediate', 'Comfortable with combinations and defense', false, '02')
  + card(474, 'Advanced', 'Training with purpose and higher intensity', false, '03')
  + card(566, 'Professional', 'Competition-focused training and refinement', false, '04')
  + button('CONTINUE', 744));

screens.push(statusBar() + header(3)
  + screenTitle(["WHAT'S YOUR", 'MAIN GOAL?'], ['Pick the result you want coaching to prioritize.'])
  + card(290, 'Learn fundamentals', 'Build technique from the ground up', false, 'A')
  + card(382, 'Improve fitness', 'Cardio, coordination, and consistency', true, 'B')
  + card(474, 'Heavy-bag conditioning', 'Sharper rounds with focused intensity', false, 'C')
  + card(566, 'Prepare to compete', 'Structured work for serious athletes', false, 'D')
  + button('CONTINUE', 744));

const miniCard = (x, y, title, iconLabel, selected = false) => rect(x, y, 164, 106, 18, selected ? '#26191A' : C.surface, selected ? C.red : C.border, selected ? 2 : 1)
  + circle(x + 28, y + 30, 15, selected ? C.red : C.muted)
  + text(x + 28, y + 35, iconLabel, 12, 'Barlow Semi Condensed', 600, selected ? C.white : C.peach, 'middle')
  + text(x + 16, y + 80, title, 15, 'Archivo Narrow', 600)
  + check(x + 139, y + 29, selected);

screens.push(statusBar() + header(4)
  + screenTitle(['SET UP YOUR', 'BOXING STYLE'], ['Tell us your stance and what you train with most.'])
  + text(24, 294, 'STANCE', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4)
  + rect(24, 310, 342, 52, 16, C.surface, C.border, 1)
  + rect(28, 314, 104, 44, 13, C.red) + text(80, 342, 'ORTHODOX', 12, 'Barlow Semi Condensed', 600, C.white, 'middle', 1)
  + text(195, 342, 'SOUTHPAW', 12, 'Barlow Semi Condensed', 600, C.textMuted, 'middle', 1)
  + text(310, 342, 'NOT SURE', 12, 'Barlow Semi Condensed', 600, C.textMuted, 'middle', 1)
  + text(24, 407, 'EQUIPMENT', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4)
  + miniCard(24, 424, 'No equipment', '—') + miniCard(202, 424, 'Heavy bag', '●', true)
  + miniCard(24, 544, 'Gloves', 'G', true) + miniCard(202, 544, 'Hand wraps', 'W')
  + button('CONTINUE', 728));

const chip = (x, y, label, selected = false, w = 58) => rect(x, y, w, 48, 15, selected ? C.red : C.surface, selected ? C.red : C.border, 1)
  + text(x + w / 2, y + 30, label, 14, 'Barlow Semi Condensed', 600, selected ? C.white : C.textMuted, 'middle');

screens.push(statusBar() + header(5)
  + screenTitle(['MAKE IT FIT', 'YOUR WEEK'], ['Choose a realistic rhythm. This never changes workout setup.'])
  + text(24, 302, 'DAYS PER WEEK', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4)
  + chip(24, 320, '2') + chip(94, 320, '3', true) + chip(164, 320, '4') + chip(234, 320, '5') + chip(304, 320, '6+')
  + text(24, 410, 'PREFERRED SESSION', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4)
  + rect(24, 428, 342, 136, 20, C.surface, C.border, 1)
  + text(48, 473, 'Quick round', 16, 'Archivo Narrow', 600) + text(340, 473, '10 MIN', 13, 'Barlow Semi Condensed', 600, C.textMuted, 'end')
  + `<line x1="48" y1="495" x2="342" y2="495" stroke="${C.border}"/>`
  + text(48, 535, 'Focused session', 16, 'Archivo Narrow', 700) + text(340, 535, '20 MIN', 13, 'Barlow Semi Condensed', 600, C.red, 'end')
  + rect(24, 584, 342, 74, 18, '#26191A', C.red, 1)
  + lines(44, 615, ['3 days × 20 minutes', 'A strong starting rhythm you can sustain.'], 14, 'Archivo Narrow', 600, C.text, 21)
  + button('CONTINUE', 728));

const ruler = (x, y, width) => Array.from({ length: 19 }, (_, i) => {
  const xx = x + i * (width / 18); const h = i % 3 === 0 ? 16 : 8;
  return `<line x1="${xx}" y1="${y}" x2="${xx}" y2="${y+h}" stroke="${i === 9 ? C.red : '#696969'}" stroke-width="${i === 9 ? 2 : 1}"/>`;
}).join('');

screens.push(statusBar() + header(6)
  + screenTitle(['BODY METRICS', '(OPTIONAL)'], ['Used only for profile and progress context. Skip freely.'])
  + rect(232, 274, 134, 42, 14, C.surface, C.border, 1) + rect(235, 277, 64, 36, 12, C.red)
  + text(267, 300, 'METRIC', 11, 'Barlow Semi Condensed', 600, C.white, 'middle') + text(332, 300, 'IMPERIAL', 11, 'Barlow Semi Condensed', 600, C.textMuted, 'middle')
  + rect(24, 340, 342, 150, 20, C.surface, C.border, 1)
  + text(44, 373, 'HEIGHT', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.3)
  + text(195, 431, '175', 44, 'Anton', 400, C.text, 'middle') + text(238, 431, 'cm', 14, 'Archivo Narrow', 600, C.textMuted)
  + ruler(46, 453, 298)
  + rect(24, 510, 342, 150, 20, C.surface, C.border, 1)
  + text(44, 543, 'WEIGHT', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.3)
  + text(195, 601, '72', 44, 'Anton', 400, C.text, 'middle') + text(230, 601, 'kg', 14, 'Archivo Narrow', 600, C.textMuted)
  + ruler(46, 623, 298)
  + button('SAVE METRICS', 704)
  + text(195, 798, 'SKIP METRICS', 12, 'Barlow Semi Condensed', 600, C.textMuted, 'middle', 1.3));

screens.push(statusBar() + header(7, 7, false)
  + `<path d="M195 181l17 34 38 6-28 27 7 38-34-18-34 18 7-38-28-27 38-6z" fill="${C.red}"/>`
  + circle(195, 233, 70, 'none', '#3A1D1D', 2)
  + lines(195, 342, ['WELCOME TO YOUR', 'CORNER, KARAN'], 35, 'Anton', 400, C.text, 41, 'middle', 0.6)
  + lines(195, 436, ['Your fighter profile is ready.', 'Nothing here changes your workout settings.'], 14, 'Archivo Narrow', 400, C.textMuted, 21, 'middle')
  + rect(24, 494, 342, 156, 20, C.surface, C.border, 1)
  + text(44, 528, 'YOUR STARTING PROFILE', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4)
  + text(44, 568, 'LEVEL', 11, 'Barlow Semi Condensed', 600, C.textMuted, 'start', 1) + text(342, 568, 'BEGINNER', 13, 'Barlow Semi Condensed', 600, C.text, 'end', 1)
  + text(44, 600, 'GOAL', 11, 'Barlow Semi Condensed', 600, C.textMuted, 'start', 1) + text(342, 600, 'IMPROVE FITNESS', 13, 'Barlow Semi Condensed', 600, C.text, 'end', 1)
  + text(44, 632, 'ROUTINE', 11, 'Barlow Semi Condensed', 600, C.textMuted, 'start', 1) + text(342, 632, '3 DAYS · 20 MIN', 13, 'Barlow Semi Condensed', 600, C.text, 'end', 1)
  + button('CONTINUE', 728));

const benefit = (y, title, subtitle) => circle(48, y, 16, '#351B1B')
  + `<path d="M41 ${y}l5 5 9-11" fill="none" stroke="${C.red}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
  + text(76, y - 2, title, 15, 'Archivo Narrow', 700) + text(76, y + 19, subtitle, 12, 'Archivo Narrow', 400, C.textMuted);

screens.push(statusBar()
  + circle(195, 168, 73, '#26191A', '#4A2020', 2)
  + `<path d="M166 170h58v45h-58zM177 170v-13c0-11 8-20 18-20s18 9 18 20v13" fill="none" stroke="${C.red}" stroke-width="8" stroke-linejoin="round"/>`
  + screenTitle(['SAVE YOUR', 'FIGHTER PROFILE'], ['Optional signup keeps progress available after reinstall.'])
  + benefit(350, 'Keep progress backed up', 'Your profile and training history stay connected.')
  + benefit(415, 'Move between devices', 'Sign in with Apple or Google anytime.')
  + benefit(480, 'Recover after reinstall', 'Restore your fighter profile without starting over.')
  + rect(24, 548, 342, 56, 18, C.white, C.white, 1) + text(52, 583, '●', 18, 'Archivo Narrow', 700, C.black, 'middle') + text(195, 583, 'CONTINUE WITH APPLE', 14, 'Barlow Semi Condensed', 600, C.black, 'middle', 1)
  + rect(24, 618, 342, 56, 18, C.surface, C.border, 1) + text(52, 653, 'G', 17, 'Archivo Narrow', 700, C.white, 'middle') + text(195, 653, 'CONTINUE WITH GOOGLE', 14, 'Barlow Semi Condensed', 600, C.text, 'middle', 1)
  + rect(24, 694, 342, 56, 18, '#26191A', C.red, 1) + text(195, 729, 'NOT NOW — CONTINUE AS GUEST', 13, 'Barlow Semi Condensed', 600, C.peach, 'middle', 0.8)
  + lines(195, 782, ['Both choices open your dashboard.', 'Sign in later from Profile without losing answers.'], 12, 'Archivo Narrow', 400, C.textMuted, 19, 'middle'));

const positions = [
  [50, 110], [480, 110], [910, 110],
  [50, 1050], [480, 1050], [910, 1050],
  [50, 1990], [480, 1990], [910, 1990]
];
const labels = ['01 · WELCOME', '02 · NAME', '03 · EXPERIENCE', '04 · GOAL', '05 · BOXING SETUP', '06 · ROUTINE', '07 · BODY METRICS', '08 · CONFIRMATION', '09 · OPTIONAL SIGNUP'];

const defs = `<defs>
  <linearGradient id="heroTint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.04"/><stop offset="1" stop-color="#FF1414" stop-opacity="0.18"/></linearGradient>
  <linearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#131313" stop-opacity="0"/><stop offset="0.56" stop-color="#131313" stop-opacity="0.92"/><stop offset="1" stop-color="#131313"/></linearGradient>
  <filter id="screenShadow" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#000" flood-opacity="0.58"/></filter>
  ${positions.map((_, i) => `<clipPath id="screenClip${i}"><rect width="390" height="844" rx="42"/></clipPath>`).join('')}
</defs>`;

const titleBlock = `${text(50, 48, 'BOXING COACH · ONBOARDING V1', 28, 'Anton', 400, C.text, 'start', 1)}
${text(50, 78, 'Premium dark/red editorial direction · 390 × 844 · 9-screen first-run flow', 14, 'Archivo Narrow', 400, C.textMuted)}
${rect(1034, 32, 306, 48, 16, '#26191A', '#4A2020', 1)}${text(1055, 61, 'OPTIONAL SIGNUP → DASHBOARD', 12, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.2)}`;

const artwork = positions.map(([x, y], i) => `${text(x, y - 22, labels[i], 12, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.3)}
<g transform="translate(${x} ${y})" filter="url(#screenShadow)">${rect(0, 0, 390, 844, 42, C.bg, '#2B2B2B', 1)}</g>
<g transform="translate(${x} ${y})" clip-path="url(#screenClip${i})">${screens[i]}</g>`).join('');

const footer = `${rect(50, 2875, 1250, 86, 20, C.surface, C.border, 1)}
${text(78, 2910, 'HANDOFF NOTES', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.4)}
${text(78, 2938, 'On reinstall: show Welcome again; signed-in users can restore after authentication; guests can skip and continue locally. Account deletion clears local + cloud onboarding data.', 13, 'Archivo Narrow', 400, C.textMuted)}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="3010" viewBox="0 0 1400 3010">
${defs}<rect width="1400" height="3010" fill="${C.canvas}"/>${titleBlock}${artwork}${footer}</svg>`;

const out = path.join(dir, 'boxing-coach-onboarding-v1.svg');
fs.writeFileSync(out, svg);
console.log(out);
