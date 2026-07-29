# Boxing Coach brand assets

The SVG files are the editable sources. The PNG files are generated artifacts
consumed by Expo.

## Visual rules

- App Store icon: black field, red glove, cream keyline, red corner cut.
- Splash: the same glove plus the `BOXING COACH` wordmark on black.
- Never round the source icon; iOS applies the platform mask.
- `icon.png` must be 1024 × 1024, RGB, and contain no alpha channel.
- Android foreground and monochrome images must retain transparency and keep
  the full mark inside the adaptive-icon safe zone.
- Do not add generated-image watermarks or third-party marks.

## Regenerate

Requires ImageMagick and the bundled Anton font:

```sh
magick -background '#0a0a0a' assets/icon-source.svg \
  -flatten -alpha off -depth 8 PNG24:assets/icon.png
magick -background '#0a0a0a' assets/icon-source.svg \
  -flatten -alpha off -depth 8 PNG24:assets/favicon.png
magick -font assets/fonts/Anton-Regular.ttf -background '#0a0a0a' \
  assets/splash-source.svg -flatten -alpha off -depth 8 \
  PNG24:assets/splash-icon.png
magick -background none assets/android-icon-foreground-source.svg \
  -depth 8 PNG32:assets/android-icon-foreground.png
magick -background none assets/android-icon-monochrome-source.svg \
  -depth 8 PNG32:assets/android-icon-monochrome.png
```

Run these commands from `apps/mobile`.

## Validate on native iOS

Expo's ignored native directory can retain old assets. Regenerate and rebuild
before judging the launch screen:

```sh
pnpm --dir apps/mobile exec expo prebuild --platform ios
pnpm --dir apps/mobile exec expo run:ios --no-build-cache
```

The simulator can also retain an old launch snapshot after a clean build. A
stale snapshot is a simulator cache problem only when the generated Xcode
catalog and built app contain the new files. Clear the app-specific SplashBoard
snapshot before taking final QA evidence.
