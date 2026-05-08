# Fairway: cross-platform handicap tracker (iOS-first)

What this is: A handicap tracking app for golfers, built iOS-first using Expo and React Native. The app calculates World Handicap System indexes transparently and surfaces deterministic, rules-based recommendations based on the user's scoring patterns. No AI, no LLM calls, no machine learning.

Tech stack (do not deviate without asking):
- Expo SDK 51+ with managed workflow
- React Native, TypeScript strict mode
- Expo Router for navigation (file-based)
- NativeWind v4 for styling
- expo-sqlite for local persistence
- @tanstack/react-query for API state
- Zustand for client state
- Vitest for unit tests on pure logic
- Jest + React Native Testing Library for component tests

Architecture:
- Feature-based folder structure under /src
- /src/core/handicap is pure TypeScript with zero React imports
- /src/features for UI features
- /src/services for API clients and database

Code style: TypeScript strict mode, explicit return types on exports, functional components only, Prettier defaults.

Testing: Every function in /src/core/handicap must have a unit test with WHS calculations tested against published USGA worked examples.

Workflow rules: One PR per task, conventional commit messages, surface test failures rather than silently fixing them.
