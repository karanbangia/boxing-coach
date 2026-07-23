import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const fontDir = path.resolve(dir, '../../apps/mobile/assets/fonts');
const embeddedFonts = {
  anton: fs.readFileSync(path.join(fontDir, 'Anton-Regular.ttf')).toString('base64'),
  archivo: fs.readFileSync(path.join(fontDir, 'ArchivoNarrow-Regular.ttf')).toString('base64'),
  archivoBold: fs.readFileSync(path.join(fontDir, 'ArchivoNarrow-Bold.ttf')).toString('base64'),
  barlow: fs.readFileSync(path.join(fontDir, 'BarlowSemiCondensed-Regular.ttf')).toString('base64'),
  barlowSemiBold: fs.readFileSync(path.join(fontDir, 'BarlowSemiCondensed-SemiBold.ttf')).toString('base64')
};

const C = {
  canvas: '#090909', bg: '#131313', surface: '#1A1A1A', muted: '#202020',
  border: '#333333', text: '#F5F0EF', textMuted: '#D1CFCF', peach: '#F9BDAD',
  red: '#FF1414', green: '#22C55E', disabled: '#AAA6A6', black: '#070707'
};

const esc = (v) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, value, size = 16, family = 'Archivo Narrow', weight = 400, fill = C.text, anchor = 'start', spacing = 0) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${esc(value)}</text>`;
const lines = (x, y, values, size, family, weight, fill, gap, anchor = 'start', spacing = 0) =>
  values.map((v, i) => text(x, y + i * gap, v, size, family, weight, fill, anchor, spacing)).join('');
const rect = (x, y, w, h, fill, stroke = 'none', sw = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const circle = (cx, cy, r, fill, stroke = 'none', sw = 0) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line = (x1, y1, x2, y2, stroke = C.border, sw = 1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"/>`;
const backControl = () =>
  circle(36, 67, 16, C.surface, C.border, 1)
  + `<path d="M39 59L31 67L39 75" fill="none" stroke="${C.text}" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"/>`;
const rightTriangle = (x, y, size = 8, fill = C.text) =>
  `<path d="M${x} ${y - size}L${x + size + 3} ${y}L${x} ${y + size}Z" fill="${fill}"/>`;

const status = () => `${text(22, 30, '9:41', 12, 'Barlow Semi Condensed', 600)}${text(322, 30, '•••  ◒  ▰', 10, 'Barlow Semi Condensed', 600)}`;

const progressHeader = (step, title, { skip = true, back = true, total = 8 } = {}) => {
  const segments = Array.from({ length: total }, (_, i) => rect(20 + i * 44, 146, 38, 3, i < step ? C.red : C.border)).join('');
  return status()
    + (back ? backControl() : '')
    + text(back ? 64 : 20, 72, 'GETTING STARTED', 12, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.5)
    + text(370, 72, `STEP ${step} OF ${total}`, 11, 'Barlow Semi Condensed', 600, C.textMuted, 'end', 1.3)
    + text(20, 124, title, 42, 'Anton', 400, C.text)
    + segments
    + (skip ? text(370, 176, 'SKIP', 11, 'Barlow Semi Condensed', 600, C.textMuted, 'end', 1.2) : '');
};

const sectionLabel = (y, value) => text(20, y, value, 13, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.3);
const primary = (label, y = 730) =>
  rect(20, y, 350, 58, C.red)
  + rightTriangle(142, y + 29, 7)
  + text(207, y + 36, label, 15, 'Barlow Semi Condensed', 600, C.text, 'middle', 1.1);
const secondary = (label, y = 730) => rect(20, y, 350, 50, 'none', C.border, 1) + text(195, y + 32, label, 14, 'Barlow Semi Condensed', 600, C.textMuted, 'middle', 1.1);

const choice = (x, y, w, h, title, subtitle = '', selected = false) =>
  rect(x, y, w, h, selected ? '#211B1B' : C.surface, selected ? C.red : C.border, selected ? 2 : 1)
  + text(x + 16, y + 34, title, 22, 'Anton', 400, selected ? C.peach : C.textMuted, 'start', 0.35)
  + (subtitle ? text(x + 16, y + 61, subtitle, 14, 'Archivo Narrow', 400, C.textMuted) : '')
  + (selected ? `<path d="M${x+w-29} ${y+21}l5 5 9-12" fill="none" stroke="${C.red}" stroke-width="2.5" stroke-linecap="square"/>` : '');

const compactChoice = (x, y, w, h, label, selected = false) =>
  rect(x, y, w, h, selected ? C.red : C.surface, selected ? C.red : C.border, selected ? 2 : 1)
  + text(x + w / 2, y + h / 2 + 7, label, 18, 'Anton', 400, selected ? C.text : C.textMuted, 'middle', 0.3);

const personVector = (cx, cy, female = false) => {
  const hair = female
    ? `<path d="M${cx - 37} ${cy - 23}C${cx - 35} ${cy - 66} ${cx + 35} ${cy - 66} ${cx + 37} ${cy - 23}L${cx + 29} ${cy + 33}H${cx - 29}Z" fill="#090909" stroke="${C.red}" stroke-width="2"/>`
    : `<path d="M${cx - 28} ${cy - 45}Q${cx} ${cy - 70} ${cx + 29} ${cy - 43}L${cx + 22} ${cy - 30}Q${cx} ${cy - 45} ${cx - 22} ${cy - 30}Z" fill="#090909" stroke="${C.red}" stroke-width="2"/>`;
  const shoulders = female
    ? `<path d="M${cx - 70} ${cy + 79}Q${cx - 52} ${cy + 31} ${cx - 20} ${cy + 27}L${cx} ${cy + 52}L${cx + 20} ${cy + 27}Q${cx + 52} ${cy + 31} ${cx + 70} ${cy + 79}Z" fill="#211B1B" stroke="${C.red}" stroke-width="2"/>`
    : `<path d="M${cx - 72} ${cy + 79}Q${cx - 56} ${cy + 31} ${cx - 22} ${cy + 25}H${cx + 22}Q${cx + 56} ${cy + 31} ${cx + 72} ${cy + 79}Z" fill="#211B1B" stroke="${C.red}" stroke-width="2"/>`;
  return shoulders + hair
    + circle(cx, cy - 20, 31, C.peach, C.text, 1.5)
    + `<path d="M${cx - 12} ${cy - 20}h5M${cx + 7} ${cy - 20}h5M${cx - 7} ${cy - 2}Q${cx} ${cy + 3} ${cx + 7} ${cy - 2}" fill="none" stroke="${C.bg}" stroke-width="2" stroke-linecap="square"/>`
    + `<path d="M${cx - 14} ${cy + 17}V${cy + 34}M${cx + 14} ${cy + 17}V${cy + 34}" stroke="${C.peach}" stroke-width="8"/>`;
};

const genderCard = (x, y, label, female = false, selected = false) =>
  rect(x, y, 173, 274, selected ? '#211B1B' : C.surface, selected ? C.red : C.border, selected ? 2 : 1)
  + (selected ? circle(x + 145, y + 24, 9, C.red) + `<path d="M${x + 140} ${y + 24}l4 4 7-10" fill="none" stroke="${C.text}" stroke-width="2"/>` : '')
  + personVector(x + 86.5, y + 111, female)
  + line(x + 20, y + 212, x + 153, y + 212, selected ? C.red : C.border, 1)
  + text(x + 86.5, y + 249, label, 23, 'Anton', 400, selected ? C.peach : C.text, 'middle', 0.5);

const unitToggle = (y, left, right, selectedLeft = true) =>
  rect(20, y, 350, 56, C.surface, C.border, 1)
  + rect(20, y, 175, 56, selectedLeft ? C.red : C.surface)
  + rect(195, y, 175, 56, selectedLeft ? C.surface : C.red)
  + text(107.5, y + 35, left, 17, 'Barlow Semi Condensed', 600, selectedLeft ? C.text : C.textMuted, 'middle', 1.1)
  + text(282.5, y + 35, right, 17, 'Barlow Semi Condensed', 600, selectedLeft ? C.textMuted : C.text, 'middle', 1.1);

const rulerScale = (y, value, unit, labels) => {
  const x0 = 42;
  const width = 306;
  const ticks = Array.from({ length: 31 }, (_, i) => {
    const x = x0 + i * (width / 30);
    const major = i % 5 === 0;
    const center = i === 15;
    return line(x, y + 170, x, y + 170 + (center ? 38 : major ? 25 : 13), center ? C.red : major ? C.text : '#696666', center ? 3 : 1);
  }).join('');
  return rect(20, y, 350, 266, C.surface, C.border, 1)
    + text(195, y + 78, value, 72, 'Anton', 400, C.red, 'middle')
    + text(195, y + 106, unit, 12, 'Barlow Semi Condensed', 600, C.peach, 'middle', 1.2)
    + labels.map((label, i) => text(x0 + i * (width / (labels.length - 1)), y + 147, label, 14, 'Archivo Narrow', 400, C.textMuted, 'middle')).join('')
    + line(x0, y + 170, x0 + width, y + 170, C.border, 1)
    + ticks
    + text(195, y + 238, 'DRAG THE SCALE TO ADJUST', 10, 'Barlow Semi Condensed', 600, C.textMuted, 'middle', 1.1);
};

const body = (y, values) => lines(20, y, values, 16, 'Archivo Narrow', 400, C.textMuted, 23);
const screens = [];

// 01 Introduction.
screens.push(progressHeader(1, 'INTRODUCE YOURSELF', { back: false })
  + body(205, ['Tell us how you identify so coaching can feel', 'more personal. You can change this later.'])
  + sectionLabel(271, 'SELECT ONE')
  + genderCard(20, 290, 'MALE', false, true)
  + genderCard(197, 290, 'FEMALE', true, false)
  + rect(20, 586, 350, 72, '#221E1D')
  + text(38, 616, 'PRIVATE BY DEFAULT', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1)
  + text(38, 642, 'Used only to personalize your Boxing Coach profile.', 14, 'Archivo Narrow', 400, C.textMuted)
  + primary('NEXT', 730));

// 02 Name.
screens.push(progressHeader(2, 'YOUR NAME')
  + sectionLabel(220, 'DISPLAY NAME OR BOXING NICKNAME')
  + rect(20, 238, 350, 58, C.surface, C.red, 2)
  + text(36, 274, 'Karan', 19, 'Archivo Narrow', 400, C.text)
  + rect(20, 318, 350, 86, '#221E1D')
  + text(38, 350, 'WHY WE ASK', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1)
  + text(38, 378, 'We use your name in coaching cues and progress.', 14, 'Archivo Narrow', 400, C.textMuted)
  + rect(20, 426, 350, 72, C.surface, C.border, 1)
  + text(38, 456, 'YOUR ANSWERS STAY ON THIS DEVICE', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1)
  + text(38, 482, 'Sign in later only if you want cloud recovery.', 14, 'Archivo Narrow', 400, C.textMuted)
  + primary('NEXT', 730));

// 03 Experience.
screens.push(progressHeader(3, 'YOUR EXPERIENCE')
  + body(205, ['Choose the coaching level that sounds like you.'])
  + sectionLabel(263, 'EXPERIENCE')
  + choice(20, 282, 173, 112, 'BEGINNER', 'Learning the basics', true)
  + choice(197, 282, 173, 112, 'INTERMEDIATE', 'Comfortable with combos')
  + choice(20, 398, 173, 112, 'ADVANCED', 'Training with intent')
  + choice(197, 398, 173, 112, 'PRO', 'Competition focused')
  + rect(20, 536, 350, 84, C.surface, C.border, 1)
  + text(36, 568, 'PROFILE ONLY', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.1)
  + text(36, 594, 'This does not change workout difficulty or access.', 14, 'Archivo Narrow', 400, C.textMuted)
  + primary('NEXT', 730));

// 04 Goal.
screens.push(progressHeader(4, 'YOUR TRAINING')
  + body(205, ['Pick the result you want coaching to prioritize.'])
  + sectionLabel(263, 'PRIMARY GOAL')
  + choice(20, 282, 173, 112, 'FUNDAMENTALS', 'Technique first')
  + choice(197, 282, 173, 112, 'FITNESS', 'Conditioning + rhythm', true)
  + choice(20, 398, 173, 112, 'HEAVY BAG', 'Sharper work rounds')
  + choice(197, 398, 173, 112, 'COMPETE', 'Train with purpose')
  + primary('NEXT', 730));

// 05 Boxing setup.
screens.push(progressHeader(5, 'YOUR BOXING')
  + sectionLabel(218, 'STANCE')
  + compactChoice(20, 236, 110, 58, 'ORTHODOX', true)
  + compactChoice(140, 236, 110, 58, 'SOUTHPAW')
  + compactChoice(260, 236, 110, 58, 'NOT SURE')
  + sectionLabel(340, 'AVAILABLE EQUIPMENT')
  + text(20, 363, 'Select everything you can train with.', 14, 'Archivo Narrow', 400, C.textMuted)
  + choice(20, 386, 173, 82, 'NONE', '', false)
  + choice(20, 472, 173, 82, 'GLOVES', '', true)
  + choice(197, 472, 173, 82, 'WRAPS', '', false)
  + primary('NEXT', 730));

// 06 Routine.
screens.push(progressHeader(6, 'YOUR ROUTINE')
  + body(205, ['Choose the days you want to train.', 'We will use them for workout reminders.'])
  + sectionLabel(281, 'TRAINING DAYS')
  + ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => compactChoice(20 + i * 59, 300, 52, 50, day, [0, 2, 4].includes(i))).join('')
  + rect(20, 369, 350, 58, '#211B1B', C.red, 1)
  + text(36, 393, 'REMINDERS', 11, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.1)
  + text(36, 414, 'We will ask permission before sending notifications.', 13, 'Archivo Narrow', 400, C.textMuted)
  + sectionLabel(467, 'PREFERRED WORKOUT DURATION')
  + [10, 20, 30, 45, 60].map((value, i) => {
      const x = 20 + i * 70; const selected = value === 20;
      return rect(x, 486, 62, 76, C.surface, selected ? C.red : C.border, selected ? 2 : 1)
        + text(x + 31, 523, value, 23, 'Anton', 400, selected ? C.red : C.text, 'middle')
        + text(x + 31, 547, 'MIN', 9, 'Barlow Semi Condensed', 600, selected ? C.peach : C.textMuted, 'middle', 1);
    }).join('')
  + rect(20, 588, 350, 72, '#211B1B', C.red, 1)
  + text(36, 618, 'MON · WED · FRI  /  20 MIN', 18, 'Anton', 400, C.text)
  + text(36, 644, 'Your reminder schedule can be changed later.', 13, 'Archivo Narrow', 400, C.textMuted)
  + primary('NEXT', 730));

// 07 Weight.
screens.push(progressHeader(7, 'YOUR WEIGHT')
  + body(205, ['Choose kilograms or pounds, then drag the ruler.', 'This can be changed any time in your profile.'])
  + sectionLabel(271, 'UNIT')
  + unitToggle(286, 'KG', 'LBS', true)
  + rulerScale(364, '72', 'KG', ['57', '62', '67', '72', '77', '82', '87'])
  + primary('NEXT', 730));

// 08 Height.
screens.push(progressHeader(8, 'YOUR HEIGHT')
  + body(205, ['Choose centimetres or inches, then drag the ruler.', 'This can be changed any time in your profile.'])
  + sectionLabel(271, 'UNIT')
  + unitToggle(286, 'CM', 'INCHES', true)
  + rulerScale(364, '175', 'CM', ['160', '165', '170', '175', '180', '185', '190'])
  + primary('SAVE & CONTINUE', 730));

// 09 Optional account, matched to the current Profile login screen.
screens.push(status()
  + backControl()
  + text(64, 72, 'YOUR CORNER. EVERYWHERE.', 12, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.5)
  + text(20, 159, 'SAVE YOUR', 56, 'Anton', 400, C.peach)
  + text(20, 214, 'TRAINING', 56, 'Anton', 400, C.red)
  + body(273, ['Protect your profile, sync your progress,', 'and recover everything after reinstalling.'])
  + rect(20, 410, 350, 60, C.text)
  + text(195, 447, '●   CONTINUE WITH APPLE', 15, 'Barlow Semi Condensed', 600, C.black, 'middle', 0.35)
  + rect(20, 486, 350, 60, C.surface, C.border, 1)
  + text(195, 523, 'G   CONTINUE WITH GOOGLE', 15, 'Barlow Semi Condensed', 600, C.text, 'middle', 0.35)
  + secondary('NOT NOW — GO TO DASHBOARD', 594)
  + lines(195, 742, ['Sign in to sync across devices.', 'Continue as guest to keep answers on this device.'], 13, 'Archivo Narrow', 400, C.textMuted, 20, 'middle')
  + text(195, 814, 'TERMS OF SERVICE  ·  PRIVACY POLICY', 10, 'Barlow Semi Condensed', 600, '#8B8989', 'middle', 0.7));

const positions = [
  [50, 110], [480, 110], [910, 110],
  [50, 1050], [480, 1050], [910, 1050],
  [50, 1990], [480, 1990], [910, 1990]
];
const labels = ['01 · INTRODUCE YOURSELF', '02 · NAME', '03 · EXPERIENCE', '04 · GOAL', '05 · BOXING SETUP', '06 · ROUTINE', '07 · WEIGHT', '08 · HEIGHT', '09 · OPTIONAL SIGNUP'];

const defs = `<defs>
  <style>
    @font-face { font-family: 'Anton'; src: url(data:font/ttf;base64,${embeddedFonts.anton}) format('truetype'); font-weight: 400; }
    @font-face { font-family: 'Archivo Narrow'; src: url(data:font/ttf;base64,${embeddedFonts.archivo}) format('truetype'); font-weight: 400; }
    @font-face { font-family: 'Archivo Narrow'; src: url(data:font/ttf;base64,${embeddedFonts.archivoBold}) format('truetype'); font-weight: 700; }
    @font-face { font-family: 'Barlow Semi Condensed'; src: url(data:font/ttf;base64,${embeddedFonts.barlow}) format('truetype'); font-weight: 400; }
    @font-face { font-family: 'Barlow Semi Condensed'; src: url(data:font/ttf;base64,${embeddedFonts.barlowSemiBold}) format('truetype'); font-weight: 600; }
  </style>
  ${positions.map((_, i) => `<clipPath id="v2clip${i}"><rect width="390" height="844"/></clipPath>`).join('')}
</defs>`;

const header = text(50, 44, 'BOXING COACH · ONBOARDING V2', 28, 'Anton', 400, C.peach, 'start', 0.6)
  + text(50, 76, 'Matched to the production app · Anton + Archivo Narrow + Barlow Semi Condensed · square fight-poster system', 14, 'Archivo Narrow', 400, C.textMuted)
  + rect(1060, 30, 280, 42, C.red)
  + text(1200, 57, 'APP LANGUAGE MATCH', 12, 'Barlow Semi Condensed', 600, C.text, 'middle', 1.1);

const art = positions.map(([x, y], i) =>
  text(x, y - 20, labels[i], 12, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.2)
  + `<g transform="translate(${x} ${y})">${rect(0, 0, 390, 844, C.bg, '#242424', 1)}</g>`
  + `<g transform="translate(${x} ${y})" clip-path="url(#v2clip${i})">${screens[i]}</g>`
).join('');

const footer = rect(50, 2872, 1250, 92, C.surface, C.border, 1)
  + text(70, 2907, 'LIFECYCLE', 12, 'Barlow Semi Condensed', 600, C.peach, 'start', 1.2)
  + text(70, 2939, 'Reinstall → show Introduce Yourself. Signed-in user → authenticate and restore. Guest → skip or start fresh. Logout → keep onboarding complete. Delete account → clear local + cloud profile.', 14, 'Archivo Narrow', 400, C.textMuted);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="3010" viewBox="0 0 1400 3010">${defs}<rect width="1400" height="3010" fill="${C.canvas}"/>${header}${art}${footer}</svg>`;
const out = path.join(dir, 'boxing-coach-onboarding-app-language-v2.svg');
const figmaDefs = `<defs>${positions.map((_, i) => `<clipPath id="v2clip${i}"><rect width="390" height="844"/></clipPath>`).join('')}</defs>`;
const figmaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="3010" viewBox="0 0 1400 3010">${figmaDefs}<rect width="1400" height="3010" fill="${C.canvas}"/>${header}${art}${footer}</svg>`;
const figmaOut = path.join(dir, 'boxing-coach-onboarding-figma-v2.svg');
fs.writeFileSync(out, svg);
fs.writeFileSync(figmaOut, figmaSvg);
console.log(out);
console.log(figmaOut);

export { figmaSvg, svg };
