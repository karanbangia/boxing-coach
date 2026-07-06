# Boxing Coach

A web and mobile app that guides you through boxing combo workouts with round-based timing, difficulty levels, and audio cues.

## Features

- **Round-based workouts** — Configurable round length and rest
- **Combo coaching** — Punch combinations (1–6) with beginner, intermediate, and advanced profiles
- **Movement & defense** — Built-in movement and defense prompts mixed into rounds
- **Audio cues** — Round start and rest period sounds
- **Tuning** — Adjust intervals, movement/defense frequency, and freestyle mode

## Tech Stack

- **Monorepo** — [Turborepo](https://turbo.build/) with pnpm workspaces
- **Web app** — React 19, Vite 6, Tailwind CSS 4
- **Mobile app** — Expo / React Native for iOS and Android
- **Core** — TypeScript engine for combos, rounds, and timer logic

## Project Structure

```
boxing-coach/
├── apps/
│   ├── mobile/       # Expo app for iOS and Android
│   └── web/          # React + Vite frontend
├── packages/
│   └── core/         # Combo engine, round manager, timer, types
├── netlify.toml      # Netlify build config
└── turbo.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

### Install & run web

```bash
pnpm install
pnpm web
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Run the iOS app

```bash
pnpm install
pnpm ios
```

This builds `@boxing-coach/core`, starts Expo in `apps/mobile`, and opens the iOS simulator if Xcode is installed. You can also run `pnpm mobile` and scan the QR code with Expo Go on an iPhone.

### Build

```bash
pnpm build
```

This is the monorepo build, not a Play Store/App Store release build.

- Web output is in `apps/web/dist`
- Mobile `pnpm --filter @boxing-coach/mobile build` currently exports an iOS bundle to `apps/mobile/dist`

If you only want the web build:

```bash
pnpm web:build
```

### Android release builds

Android store builds use Expo EAS from `apps/mobile`.

```bash
pnpm android:build:preview
pnpm android:build:production
```

- `preview` creates an installable APK for device/emulator testing
- `production` creates the Android App Bundle (`.aab`) you submit to Google Play
- `pnpm android:submit` submits a finished Android build through EAS Submit

Before the first production release, log in to Expo (`eas login`) and set up your Google Play Developer account.

### iOS release builds

iOS builds also use Expo EAS from `apps/mobile`.

```bash
pnpm ios:build:simulator
pnpm ios:build:production
```

- `ios:build:simulator` creates a Simulator build you can install on macOS
- `ios:build:production` creates the signed production iOS build for TestFlight/App Store Connect
- `pnpm ios:submit` submits a finished iOS build through EAS Submit

Before the first production release, log in to Expo (`eas login`), make sure your Apple Developer membership is active, and set up App Store Connect for the app.

### Other commands

- `pnpm lint` — Lint all packages  
- `pnpm clean` — Remove build artifacts and Turbo cache  
- `pnpm core:build` — Build only the shared core package
- `pnpm web` — Start only the web dev server
- `pnpm web:build` — Build only the web app
- `pnpm web:preview` — Preview the built web app
- `pnpm mobile` — Start the Expo mobile app
- `pnpm mobile:build` — Run the current local mobile export build
- `pnpm ios` — Launch the Expo mobile app for iOS
- `pnpm android` — Launch the Expo mobile app for Android
- `pnpm android:build:preview` — Build a preview APK with EAS
- `pnpm android:build:production` — Build a production Android App Bundle with EAS
- `pnpm android:submit` — Submit an Android build to Google Play with EAS
- `pnpm ios:build:simulator` — Build an iOS Simulator app with EAS
- `pnpm ios:build:production` — Build a production iOS release with EAS
- `pnpm ios:submit` — Submit an iOS build to App Store Connect with EAS

## Docs

- [Deployment](./DEPLOY.md) — Web deploy on Netlify and Android release workflow
- [Plan](./docs/plan.md) — Original app plan: architecture, engine design, difficulty profiles, data flow

## License

Private.
