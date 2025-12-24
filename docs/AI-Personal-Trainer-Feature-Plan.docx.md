# **AI Personal Trainer**

## *Feature Plan & Development Roadmap*

---

# **Phase 1 Implementation Status**

> **Last Updated:** December 24, 2024
> **Status:** Phase 1 MVP Complete

## **What Was Built**

| Feature | Status | Notes |
| ----- | ----- | ----- |
| User Authentication | ✅ Complete | Google Sign-In only (simplified from email + Google) |
| Onboarding Flow | ✅ Complete | 5-step wizard instead of AI conversation |
| AI Workout Generation | ✅ Complete | Claude API via Next.js API routes |
| Workout Logging | ✅ Complete | Stepper + weight chips as designed |
| Workout History | ✅ Complete | Calendar view with monthly stats |
| AI Coach Chat | ✅ Complete | Full chat interface with quick actions |
| Dashboard | ✅ Complete | Today's workout, weekly calendar, stats |
| Profile Screen | ✅ Complete | Goals, limitations, preferences display |

## **Technical Changes from Original Plan**

| Original Plan | Actual Implementation | Reason |
| ----- | ----- | ----- |
| Firebase Cloud Functions | Next.js API Routes | Simpler deployment, same security |
| Email + Google Auth | Google Sign-In only | User preference, faster onboarding |
| AI-powered onboarding chat | 5-step form wizard | More predictable, easier for 60+ users |
| Firebase Hosting | Vercel-ready (or Firebase) | Next.js native deployment options |

## **Project Structure**

```
ai-personal-trainer/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Landing/Login
│   │   ├── (protected)/       # Auth-required pages
│   │   │   ├── dashboard/     # Home screen
│   │   │   ├── workout/       # Active workout logging
│   │   │   ├── history/       # Calendar + history
│   │   │   ├── coach/         # AI chat
│   │   │   ├── profile/       # User settings
│   │   │   └── onboarding/    # Setup wizard
│   │   └── api/
│   │       ├── chat/          # Claude chat endpoint
│   │       └── generate-plan/ # Workout generation
│   ├── components/
│   │   ├── ui/               # Stepper, WeightChips
│   │   ├── auth/             # GoogleSignInButton
│   │   └── layout/           # Sidebar, MobileNav
│   ├── lib/firebase/         # Config, auth, firestore helpers
│   ├── context/              # AuthContext
│   └── types/                # TypeScript definitions
├── .env.local                # API keys (configured)
└── docs/                     # Wireframes + this plan
```

---

# **Executive Summary**

This document outlines the feature plan for an AI-powered personal training platform designed specifically for users aged 40 and above. The platform combines Anthropic's Claude AI with Google Firebase to deliver personalized workout plans that adapt to individual goals, including physiotherapy and rehabilitation needs.

**Core Philosophy:** Simplicity wins. Users will only consistently log what's effortless. Every feature must pass the 'gym floor test'—can someone use it between sets without breaking focus?

## **Guiding Principles**

1. **Minimal Input, Maximum Value:** Capture only reps, weight/duration, and optional effort rating
2. **AI Does the Heavy Lifting:** The AI analyzes patterns—users just train
3. **40+ First Design:** Large touch targets, high contrast, clear typography, no clutter
4. **Progressive Disclosure:** Simple by default, depth available for those who want it

# **Target Audience: 60+**

Understanding our users is critical to avoiding feature bloat. This demographic has specific needs that differ from younger fitness app users.

| Characteristic | Design Implication |
| ----- | ----- |
| Time-poor professionals | One-tap workout logging, no lengthy forms |
| Joint/mobility concerns | Physiotherapy integration, movement modifications built-in |
| Recovery matters more | AI factors in rest days and adapts intensity automatically |
| Prefer substance over flash | No gamification gimmicks—just clear progress tracking |
| Vision considerations | 16px+ fonts, high contrast, clean layouts |

# **Solving the Data Overload Problem**

Most fitness apps fail because they ask users to track too much. Here's our approach to keeping it simple while still giving the AI what it needs:

## **What Users Actually Log (The 'Must-Haves')**

| Data Point | Input Method | Status |
| ----- | ----- | ----- |
| Reps completed | Stepper (+/-) | ✅ Implemented |
| Weight used | Quick-select chips | ✅ Implemented |
| Duration (cardio) | Built-in timer | ⏳ Phase 2 |
| Completed (yes/no) | Checkbox | ✅ Implemented |

## **Optional 'Nice-to-Have' Data**

These are available but never forced. The AI can work without them:

* **Effort rating (1-5 or simple emoji):** Only shown post-workout in a summary screen
* **Quick note:** Voice-to-text option for 'knee felt tight' type feedback
* **Skip reason:** If exercise skipped, one-tap reason (pain, fatigue, time)

## **What We DON'T Ask For**

Explicitly avoiding these common 'feature traps':

* Mood tracking before workouts
* Sleep quality input
* Nutrition logging
* Heart rate input (unless wearable integration later)
* Form quality self-assessment
* Perceived exertion scales (RPE)

# **Development Roadmap**

## **Phase 1: MVP ✅ COMPLETE**

**Goal:** Launch a working product that one person can use to train and see AI-generated plans adapt over time.

### **Core Features**

| Feature | Status | Implementation |
| ----- | ----- | ----- |
| User Authentication | ✅ | Google Sign-In via Firebase Auth |
| Onboarding | ✅ | 5-step form: goals, limitations, equipment, schedule, units |
| AI Workout Generation | ✅ | Claude generates weekly plans via `/api/generate-plan` |
| Workout Logging | ✅ | Stepper for reps, weight chips, set completion |
| Workout History | ✅ | Calendar view with drill-down to workout details |
| Plan Adaptation | ✅ | AI Coach can modify plans through chat |

### **Data Model (Firestore) - Implemented**

```
users/{userId}
  ├── email, displayName, photoURL
  ├── createdAt, onboardingComplete
  └── profile: { goals[], limitations[], equipment, experienceLevel,
                 workoutDays[], sessionLength, units }

users/{userId}/workouts/{workoutId}
  ├── date, planId, name, completed, duration
  └── exercises[]: { id, name, targetSets, targetReps,
                     completedSets[]: { reps, weight, completed },
                     skipped, skipReason?, notes? }

users/{userId}/plans/{planId}
  ├── generatedAt, generatedBy, active, validUntil
  └── workoutSchedule[]: { dayOfWeek, workoutType, workoutName,
                           exercises[]: { id, name, sets, reps, notes? } }
```

## **Phase 2: Refinement (Next)**

**Goal:** Improve the AI's intelligence and add features users actually request after MVP testing.

### **Features**

| Feature | Priority | Notes |
| ----- | ----- | ----- |
| Smart Rest Timer | High | AI-suggested rest between sets |
| Exercise Substitutions | High | "Can't do this? Here are alternatives" |
| Progress Visualization | Medium | Charts showing weight progression |
| Duration Timer | Medium | For cardio exercises |
| Physio Mode | Medium | Specific path for rehabilitation |
| Quick-log Presets | Low | Remember user's common weights |

## **Phase 3: Scale**

**Goal:** Features that support growth and retention.

### **Features**

1. **Weekly AI Summary:** Email/notification with progress insights
2. **Goal Milestones:** Celebrate achievements without gamification overload
3. **Offline Mode:** Log workouts without connection, sync later
4. **Export Data:** Share progress with a physiotherapist or doctor
5. **PWA Installation:** Full mobile app experience

# **Technical Architecture**

## **Stack Overview - Implemented**

| Layer | Technology | Status |
| ----- | ----- | ----- |
| Frontend | Next.js 14 (App Router) + TypeScript | ✅ |
| Styling | Tailwind CSS | ✅ |
| Database | Firestore | ✅ |
| Authentication | Firebase Auth (Google) | ✅ |
| AI Engine | Anthropic Claude API (claude-sonnet-4-20250514) | ✅ |
| API Routes | Next.js API Routes | ✅ |
| Hosting | Vercel or Firebase Hosting | Ready |

## **AI Integration Points - Implemented**

| Integration | Endpoint | Status |
| ----- | ----- | ----- |
| Plan Generation | `/api/generate-plan` | ✅ |
| Coach Chat | `/api/chat` | ✅ |
| Onboarding Analysis | Form-based (not AI) | Changed |
| Adaptation Engine | Via Coach Chat | ✅ |

# **UI/UX Guidelines**

## **Accessibility First (60+ Design) - Implemented**

* **Typography:** 16px body, 20px+ actions, 32px headers ✅
* **Touch Targets:** 48x48px minimum, 52px for steppers ✅
* **Contrast:** WCAG AA compliant (4.5:1 for text) ✅
* **Spacing:** Generous whitespace, card-based layouts ✅
* **Loading States:** Spinners and "Thinking..." indicators ✅

## **Screen Hierarchy - Implemented**

| Screen | Route | Status |
| ----- | ----- | ----- |
| Landing/Login | `/` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| Active Workout | `/workout` | ✅ |
| History | `/history` | ✅ |
| AI Coach | `/coach` | ✅ |
| Profile | `/profile` | ✅ |
| Onboarding | `/onboarding` | ✅ |

# **Success Metrics**

How we'll know if we're getting the balance right:

* **Logging Completion Rate:** Target 80%+ of exercises have reps/weight logged
* **Time to Log:** Average <30 seconds per exercise
* **Weekly Active Users:** Users completing 2+ workouts per week
* **AI Relevance:** % of AI suggestions accepted vs modified
* **Optional Data Capture:** Monitor if users voluntarily add notes/ratings

# **Next Steps (Post Phase 1)**

1. ~~Finalize exercise database structure~~ → AI generates exercises dynamically
2. ~~Design onboarding conversation flow~~ → Replaced with form wizard
3. ~~Create wireframes~~ → ✅ Complete (in `/docs`)
4. ~~Set up Firebase project~~ → ✅ Complete
5. ~~Prototype AI workout generation~~ → ✅ Complete
6. **User testing with target demographic**
7. **Add smart rest timer**
8. **Implement exercise substitution suggestions**
9. **Deploy to production (Vercel or Firebase Hosting)**

---

*— End of Feature Plan —*

*Phase 1 completed: December 24, 2024*
