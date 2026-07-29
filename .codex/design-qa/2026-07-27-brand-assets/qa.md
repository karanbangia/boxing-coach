# Native launch-brand QA

- Device: iPhone 16e simulator, iOS 26.5
- Replaced the inconsistent cartoon icon with an original black, red, and cream
  boxing-glove mark that remains recognizable at Home Screen size
- Replaced the watermarked splash artwork with the glove and `BOXING COACH`
  wordmark
- Added matching Android adaptive foreground and monochrome sources
- App Store icon is 1024 × 1024, 8-bit RGB, with no alpha channel
- Android adaptive assets are 1024 × 1024 RGBA and stay inside the safe zone
- `expo prebuild --platform ios` copied the source assets into the ignored
  native catalog byte-for-byte
- `expo run:ios --no-build-cache` completed with zero errors
- Native Home Screen screenshot confirmed the packaged icon
- Native launch capture confirmed the new splash with no clipping or watermark
- The simulator's app-specific SplashBoard cache had to be cleared before it
  stopped showing the historical launch image
- A clean simulator reinstall reset only the simulator's local app data; repo
  configuration remained in normal mode

Source and output files:

- `apps/mobile/assets/icon-source.svg`
- `apps/mobile/assets/splash-source.svg`
- `apps/mobile/assets/android-icon-foreground-source.svg`
- `apps/mobile/assets/android-icon-monochrome-source.svg`
- `apps/mobile/assets/icon.png`
- `apps/mobile/assets/splash-icon.png`
- `apps/mobile/assets/android-icon-foreground.png`
- `apps/mobile/assets/android-icon-monochrome.png`
