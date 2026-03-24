const log = (...args: unknown[]) => {
  console.log('[coach-audio:unlock]', ...args);
};

/**
 * Chromium/Safari often block HTMLAudioElement.play() when it runs outside a user gesture
 * (e.g. from timers or useEffect). Playing a silent clip synchronously inside a click
 * handler marks the page as allowed to play media so later coach clips can play.
 */
export function unlockHtmlAudioForCoach(): void {
  log('unlock requested (user gesture)');
  try {
    const a = new Audio();
    a.volume = 0;
    // Minimal silent WAV (widely decodable)
    a.src =
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAE=';
    const p = a.play();
    if (p !== undefined) {
      void p
        .then(() => {
          log('silent clip play OK — HTML audio should be allowed');
          a.pause();
          a.removeAttribute('src');
          a.load();
        })
        .catch((e) => {
          log('silent clip play FAILED (unlock may not stick)', e);
        });
    }
  } catch (e) {
    log('unlock threw', e);
  }
}
