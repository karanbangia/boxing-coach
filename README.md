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
pnpm dev
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

Output for the web app is in `apps/web/dist`. For the mobile app, `pnpm --filter @boxing-coach/mobile build` exports an iOS bundle to `apps/mobile/dist`.

### Other commands

- `pnpm lint` — Lint all packages  
- `pnpm clean` — Remove build artifacts and Turbo cache  
- `pnpm mobile` — Start the Expo mobile app
- `pnpm ios` — Launch the Expo mobile app for iOS
- `pnpm android` — Launch the Expo mobile app for Android

## Docs

- [Deployment](./DEPLOY.md) — Push to GitHub and deploy on Netlify
- [Plan](./docs/plan.md) — Original app plan: architecture, engine design, difficulty profiles, data flow

## License

Private.
