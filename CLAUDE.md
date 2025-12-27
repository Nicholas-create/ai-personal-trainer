# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

### Firebase Commands

```bash
firebase deploy --only firestore:rules    # Deploy Firestore security rules
firebase deploy --only hosting            # Deploy to Firebase Hosting
npx tsx scripts/add-secret.ts <NAME> <VALUE>  # Add secret to Firestore
```

## Architecture Overview

This is an AI-powered personal trainer app for users 60+, built with Next.js 16 (App Router), Firebase, and the Claude API.

### Authentication Flow

1. **Client-side**: Firebase Auth with Google Sign-in (`src/lib/firebase/auth.ts`)
2. **Context**: `AuthProvider` in `src/context/AuthContext.tsx` manages auth state
3. **API Protection**: `withAuth` wrapper in `src/lib/auth/verifyAuth.ts` validates Firebase ID tokens on API routes
4. **Client requests**: Use `fetchWithAuth` from `src/lib/api/fetchWithAuth.ts` which automatically attaches the Firebase ID token

### Route Groups

- `src/app/(protected)/` - Authenticated pages (dashboard, coach, workout, profile, programs, history)
- `src/app/api/` - API routes, all protected with `withAuth` wrapper

### Data Model (Firestore)

User data is stored under `/users/{userId}/` with subcollections:
- `plans/` - Workout programs with `workoutSchedule` (7-day array of `DaySchedule`)
- `workouts/` - Completed workout history
- `exercises/` - Personal exercise library (seeded with defaults on first use)

Global collections:
- `secrets/` - API keys (protected by Firestore rules, server-access only)

### AI Chat Integration

The coach page (`src/app/(protected)/coach/page.tsx`) communicates with `/api/chat` which uses Claude with tool use:

**Write tools** (executed client-side via `toolActions`):
- `save_workout_plan` - Create complete 7-day program
- `update_day_schedule` - Modify a single day
- `update_exercise` - Update sets/reps/notes
- `add_exercise_to_library` - Add new exercise

**Query tools** (executed server-side in the API):
- `query_exercise_library` - Search exercises by muscle/equipment/difficulty
- `get_exercise_details` - Get full exercise instructions

The client passes `exerciseLibrary` to the API, which executes query tools server-side and returns real results to Claude.

### Key Patterns

**Lazy API client initialization**: The Anthropic client fetches its API key from Firestore on first use (`src/app/api/chat/route.ts:11-17`)

**Firestore with retry logic**: Use `withRetry` from `src/lib/firebase/firestoreRetry.ts` for operations that may fail transiently

**Plan state machine**: Plans have status (`active`, `paused`, `archived`, `expired`) managed via `createPlan`, `pausePlan`, `resumePlan`, `archivePlan` in `src/lib/firebase/firestore.ts`

### Type Definitions

Core types in `src/types/`:
- `user.ts` - `User`, `UserProfile` (goals, limitations, equipment, experience)
- `plan.ts` - `WorkoutPlan`, `DaySchedule`, `PlanExercise`
- `exercise.ts` - `LibraryExercise`, `MuscleGroup`, `EquipmentType`, `DifficultyLevel`
- `workout.ts` - `Workout`, `ExerciseSet` (completed workout tracking)

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Deployment

Deploys to Firebase Hosting via GitHub Actions on push to main. Secrets are stored in GitHub Secrets and Firestore `/secrets/` collection.
