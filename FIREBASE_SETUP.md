# Firebase Setup Guide

## 1. Update Your Environment Variables

Edit `.env.local` with your actual Firebase config from the Firebase Console:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 2. Add Firestore Security Rules

Go to Firebase Console > Firestore Database > Rules, and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Workouts subcollection
      match /workouts/{workoutId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Plans subcollection
      match /plans/{planId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Conversations subcollection (for AI chat history)
      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Click **Publish** to save the rules.

## 3. Enable Google Authentication

1. Go to Firebase Console > Authentication > Sign-in method
2. Click on **Google**
3. Toggle **Enable**
4. Set your project public name and support email
5. Click **Save**

## 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login)
│   ├── (protected)/       # Protected pages (require login)
│   │   ├── dashboard/     # Home screen
│   │   ├── workout/       # Active workout
│   │   ├── history/       # Workout history
│   │   ├── coach/         # AI Coach chat
│   │   ├── profile/       # User profile
│   │   └── onboarding/    # Initial setup
│   └── api/               # API routes
│       ├── chat/          # AI chat endpoint
│       └── generate-plan/ # Workout generation
├── components/            # React components
│   ├── ui/               # Reusable UI (Stepper, WeightChips)
│   ├── auth/             # Auth components
│   └── layout/           # Layout components (Sidebar, MobileNav)
├── lib/
│   └── firebase/         # Firebase config and helpers
├── context/              # React context (Auth)
└── types/                # TypeScript types
```

## Features Implemented

1. **Google Sign-In** - One-click authentication
2. **Onboarding Flow** - Collects goals, limitations, equipment, schedule
3. **Dashboard** - Shows today's workout, weekly schedule, stats
4. **AI Coach** - Chat with Claude for workout advice
5. **Active Workout** - Log sets with stepper and weight chips
6. **Workout History** - Calendar view of past workouts
7. **Profile** - View and edit user preferences

## Accessibility Features (60+ Design)

- 16px+ body text, 48px+ touch targets
- High contrast colors (WCAG AA compliant)
- Persistent navigation (no hamburger menus)
- Large stepper buttons (52px)
- Clear visual feedback
