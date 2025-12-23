# **AI Personal Trainer**

## *Feature Plan & Development Roadmap*

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

| Data Point | Input Method | Why It Matters |
| ----- | ----- | ----- |
| Reps completed | Stepper (+/-) | Core progression metric |
| Weight used | Quick-select chips | Strength progression tracking |
| Duration (cardio) | Built-in timer | Endurance tracking |
| Completed (yes/no) | Checkbox | Minimum viable data point |

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

## **Phase 1: MVP (Weeks 1-6)**

**Goal:** Launch a working product that one person can use to train and see AI-generated plans adapt over time.

### **Core Features**

1. **User Authentication:** Firebase Auth (email/password, Google sign-in)  
2. **Onboarding Conversation:** AI chat that collects goals, limitations, experience level, equipment access  
3. **AI Workout Generation:** Claude generates first workout plan based on onboarding  
4. **Workout Logging (Minimal):** Check off exercises, log reps/weight with stepper/chips  
5. **Workout History:** Simple list view of past sessions  
6. **Plan Adaptation:** AI reviews past workouts and adjusts next plan

### **Data Model (Firestore)**

users/{userId}: profile, goals, limitations, onboardingComplete

users/{userId}/workouts/{workoutId}: date, exercises\[\], completed, notes

users/{userId}/plans/{planId}: generatedAt, workoutSchedule\[\], active

## **Phase 2: Refinement (Weeks 7-12)**

**Goal:** Improve the AI's intelligence and add features users actually request after MVP testing.

### **Features**

1. **Smart Rest Timer:** AI-suggested rest based on exercise type and user history  
2. **Exercise Substitutions:** 'Can't do this? Here are alternatives' with one-tap swap  
3. **Progress Visualization:** Simple charts showing weight progression per exercise  
4. **AI Coach Chat:** Ask questions anytime ('should I push through knee pain?')  
5. **Physio Mode:** Specific onboarding path for rehabilitation goals  
6. **Quick-log Presets:** Remember user's common weights per exercise

## **Phase 3: Scale (Weeks 13-20)**

**Goal:** Features that support growth and retention.

### **Features**

1. **Weekly AI Summary:** Email/notification with progress insights  
2. **Goal Milestones:** Celebrate achievements without gamification overload  
3. **Offline Mode:** Log workouts without connection, sync later  
4. **Export Data:** Share progress with a physiotherapist or doctor

# **Technical Architecture**

## **Stack Overview**

| Layer | Technology |
| ----- | ----- |
| Frontend | React/Next.js (PWA for mobile-like experience) |
| Backend | Firebase Cloud Functions (Node.js) |
| Database | Firestore (real-time sync, offline support) |
| Authentication | Firebase Auth |
| AI Engine | Anthropic Claude API (via Cloud Functions) |
| Hosting | Firebase Hosting |

## **AI Integration Points**

1. **Onboarding Analysis:** Claude processes conversation to extract structured user profile  
2. **Plan Generation:** Claude creates workout plans with context from user profile \+ exercise database  
3. **Adaptation Engine:** Claude reviews workout logs and adjusts future plans  
4. **Coach Chat:** Claude answers questions with full context of user's history and goals

# **UI/UX Guidelines**

## **Accessibility First (40+ Design)**

* **Typography:** Minimum 16px body text, 20px+ for action items  
* **Touch Targets:** Minimum 48x48px for all interactive elements  
* **Contrast:** WCAG AA minimum (4.5:1 for text)  
* **Spacing:** Generous whitespace, no cramped layouts  
* **Loading States:** Clear feedback when AI is processing

## **Screen Hierarchy**

| Screen | Purpose & Content |
| ----- | ----- |
| Home/Dashboard | Today's workout at a glance, one-tap to start |
| Active Workout | Exercise list, current exercise prominent, logging controls |
| History | Calendar view of completed workouts |
| AI Coach | Chat interface for questions and plan adjustments |
| Profile | Goals, limitations, preferences (editable) |

# **Success Metrics**

How we'll know if we're getting the balance right:

* **Logging Completion Rate:** Target 80%+ of exercises have reps/weight logged  
* **Time to Log:** Average \<30 seconds per exercise  
* **Weekly Active Users:** Users completing 2+ workouts per week  
* **AI Relevance:** % of AI suggestions accepted vs modified  
* **Optional Data Capture:** Monitor if users voluntarily add notes/ratings

# **Recommended Next Steps**

* Finalize exercise database structure and initial content (100-150 exercises)  
* Design the onboarding conversation flow for Claude  
* Create wireframes for core screens (Home, Active Workout, AI Coach)  
* Set up Firebase project and basic authentication  
* Prototype the AI workout generation prompt engineering

*— End of Feature Plan —*