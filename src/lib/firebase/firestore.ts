import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  serverTimestamp,
  writeBatch,
  limit as firestoreLimit,
  runTransaction,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';
import {
  PaginationOptions,
  PaginatedResult,
  normalizePaginationOptions,
  createPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/pagination';
import { format } from 'date-fns';
import { db } from './config';
import { logger } from '@/lib/logger';
import type { User, UserProfile } from '@/types/user';
import type { Workout } from '@/types/workout';
import type { WorkoutPlan, PlanStatus } from '@/types/plan';
import type {
  LibraryExercise,
  NewExercise,
  ExerciseUpdate,
  ExerciseFilters,
  MuscleGroup,
  EquipmentType,
  DifficultyLevel,
} from '@/types/exercise';
import type { ChatSession, ChatMessage, NewChatMessage } from '@/types/chat';

// User operations
export async function getUser(userId: string): Promise<User | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      uid: userId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as User;
  }
  return null;
}

export async function createUser(userId: string, userData: Partial<User>): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, {
    ...userData,
    createdAt: serverTimestamp(),
    onboardingComplete: false,
  });
}

export async function updateUserProfile(
  userId: string,
  profile: UserProfile
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    profile,
    onboardingComplete: true,
  });
}

export async function updateUserProfileField(
  userId: string,
  field: keyof UserProfile,
  value: UserProfile[keyof UserProfile]
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    [`profile.${field}`]: value,
  });
}

// Workout operations
export async function getWorkouts(
  userId: string,
  limitCount: number = 30
): Promise<Workout[]> {
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  // Use Firestore's limit() instead of client-side slicing for efficiency
  const q = query(workoutsRef, orderBy('date', 'desc'), firestoreLimit(limitCount));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    // Defensive date conversion - handle Timestamp, Date, or string
    let workoutDate: Date;
    if (data.date?.toDate) {
      workoutDate = data.date.toDate();
    } else if (data.date instanceof Date) {
      workoutDate = data.date;
    } else if (data.date) {
      workoutDate = new Date(data.date);
    } else {
      workoutDate = new Date();
    }

    return {
      id: docSnap.id,
      userId,
      ...data,
      date: workoutDate,
    } as Workout;
  });
}

// Helper to convert doc to Workout with defensive date handling
function docToWorkout(
  docSnap: { id: string; data: () => Record<string, unknown> },
  userId: string
): Workout {
  const data = docSnap.data();
  // Defensive date conversion - handle Timestamp, Date, or string
  let workoutDate: Date;
  const dateValue = data.date as Timestamp | Date | string | undefined;
  if ((dateValue as Timestamp)?.toDate) {
    workoutDate = (dateValue as Timestamp).toDate();
  } else if (dateValue instanceof Date) {
    workoutDate = dateValue;
  } else if (dateValue) {
    workoutDate = new Date(dateValue as string);
  } else {
    workoutDate = new Date();
  }

  return {
    id: docSnap.id,
    userId,
    ...data,
    date: workoutDate,
  } as Workout;
}

// Get workouts with pagination
export async function getWorkoutsPagedAsync(
  userId: string,
  options?: Partial<PaginationOptions>,
  includeCount = false
): Promise<PaginatedResult<Workout>> {
  const { pageSize, cursor } = normalizePaginationOptions(options);
  const workoutsRef = collection(db, 'users', userId, 'workouts');

  // Build base query
  let q = query(
    workoutsRef,
    orderBy('date', 'desc'),
    firestoreLimit(pageSize + 1)
  );

  // If cursor provided, start after that document
  if (cursor) {
    const cursorDoc = await getDoc(doc(workoutsRef, cursor));
    if (cursorDoc.exists()) {
      q = query(
        workoutsRef,
        orderBy('date', 'desc'),
        startAfter(cursorDoc),
        firestoreLimit(pageSize + 1)
      );
    }
  }

  const querySnapshot = await getDocs(q);
  const workouts = querySnapshot.docs.map((docSnap) => docToWorkout(docSnap, userId));

  // Get total count if requested
  let totalCount: number | undefined;
  if (includeCount) {
    const countSnapshot = await getCountFromServer(query(workoutsRef));
    totalCount = countSnapshot.data().count;
  }

  return createPaginatedResult(workouts, pageSize, (workout) => workout.id, totalCount);
}

export async function createWorkout(
  userId: string,
  workout: Omit<Workout, 'id' | 'userId'>
): Promise<string> {
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const docRef = await addDoc(workoutsRef, {
    ...workout,
    date: Timestamp.fromDate(workout.date),
  });
  return docRef.id;
}

// Get existing workout for today (if any) to prevent duplicate creation
export async function getTodayWorkout(
  userId: string,
  planId: string
): Promise<Workout | null> {
  const workoutsRef = collection(db, 'users', userId, 'workouts');

  // Get today's date range (start and end of day)
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const q = query(
    workoutsRef,
    where('planId', '==', planId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('date', 'desc'),
    firestoreLimit(1)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const docSnap = querySnapshot.docs[0];
  return docToWorkout(docSnap, userId);
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  updates: Partial<Workout>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'workouts', workoutId);
  await updateDoc(docRef, updates);
}

// Plan operations
// Helper to compute status for legacy plans
function computePlanStatus(data: Record<string, unknown>): PlanStatus {
  if (data.status) return data.status as PlanStatus;
  if (data.active) return 'active';
  const validUntil = (data.validUntil as Timestamp)?.toDate?.() || new Date();
  return validUntil < new Date() ? 'expired' : 'archived';
}

// Helper to generate default plan name
function getDefaultPlanName(generatedAt: Date): string {
  return `Program - ${format(generatedAt, 'MMM d, yyyy')}`;
}

// Helper to convert Firestore doc to WorkoutPlan with backward compatibility
function docToWorkoutPlan(docSnap: { id: string; data: () => Record<string, unknown> }, userId: string): WorkoutPlan {
  const data = docSnap.data();
  const generatedAt = (data.generatedAt as Timestamp)?.toDate?.() || new Date();

  return {
    id: docSnap.id,
    userId,
    ...data,
    generatedAt,
    validUntil: (data.validUntil as Timestamp)?.toDate?.() || new Date(),
    name: (data.name as string) || getDefaultPlanName(generatedAt),
    status: computePlanStatus(data),
    startedAt: (data.startedAt as Timestamp)?.toDate?.() || generatedAt,
    pausedAt: (data.pausedAt as Timestamp)?.toDate?.() || undefined,
    resumedAt: (data.resumedAt as Timestamp)?.toDate?.() || undefined,
    archivedAt: (data.archivedAt as Timestamp)?.toDate?.() || undefined,
    extendedAt: (data.extendedAt as Timestamp)?.toDate?.() || undefined,
    originalValidUntil: (data.originalValidUntil as Timestamp)?.toDate?.() || undefined,
  } as WorkoutPlan;
}

export async function getActivePlan(userId: string): Promise<WorkoutPlan | null> {
  const plansRef = collection(db, 'users', userId, 'plans');
  const q = query(plansRef, where('active', '==', true));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const docSnap = querySnapshot.docs[0];
  return docToWorkoutPlan(docSnap, userId);
}

export async function createPlan(
  userId: string,
  plan: Omit<WorkoutPlan, 'id' | 'userId'>
): Promise<string> {
  const plansRef = collection(db, 'users', userId, 'plans');

  // Use transaction to ensure atomicity - prevents race conditions
  // when multiple createPlan calls happen simultaneously
  return await runTransaction(db, async (transaction) => {
    // Query for active plans
    const activeQuery = query(plansRef, where('active', '==', true));
    const activePlans = await getDocs(activeQuery);

    // Deactivate all existing active plans in the transaction
    for (const docSnap of activePlans.docs) {
      transaction.update(docSnap.ref, {
        active: false,
        status: 'paused',
        pausedAt: serverTimestamp(),
      });
    }

    // Create new plan document reference
    const newPlanRef = doc(plansRef);

    // Set the new plan in the transaction
    transaction.set(newPlanRef, {
      ...plan,
      generatedAt: Timestamp.fromDate(plan.generatedAt),
      validUntil: Timestamp.fromDate(plan.validUntil),
      startedAt: serverTimestamp(),
      status: 'active',
      name: plan.name || getDefaultPlanName(plan.generatedAt),
    });

    return newPlanRef.id;
  });
}

export async function updateDayInPlan(
  userId: string,
  planId: string,
  dayOfWeek: string,
  updates: Partial<{
    workoutType: string;
    workoutName: string;
    exercises: { id: string; name: string; sets: number; reps: number; notes?: string }[];
  }>
): Promise<void> {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  const planSnap = await getDoc(planRef);

  if (!planSnap.exists()) {
    throw new Error('Plan not found');
  }

  const plan = planSnap.data();
  const updatedSchedule = plan.workoutSchedule.map(
    (day: { dayOfWeek: string }) =>
      day.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
        ? { ...day, ...updates }
        : day
  );

  await updateDoc(planRef, { workoutSchedule: updatedSchedule });
}

export async function updateExerciseInPlan(
  userId: string,
  planId: string,
  dayOfWeek: string,
  exerciseId: string,
  updates: Partial<{ name: string; sets: number; reps: number; notes: string }>
): Promise<void> {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  const planSnap = await getDoc(planRef);

  if (!planSnap.exists()) {
    throw new Error('Plan not found');
  }

  const plan = planSnap.data();
  const updatedSchedule = plan.workoutSchedule.map(
    (day: {
      dayOfWeek: string;
      exercises: { id: string; name: string; sets: number; reps: number; notes?: string }[];
    }) => {
      if (day.dayOfWeek.toLowerCase() !== dayOfWeek.toLowerCase()) {
        return day;
      }
      return {
        ...day,
        exercises: day.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, ...updates } : ex
        ),
      };
    }
  );

  await updateDoc(planRef, { workoutSchedule: updatedSchedule });
}

// Program management operations

// Get ALL plans for a user (for program history) - legacy non-paginated version
export async function getAllPlans(userId: string): Promise<WorkoutPlan[]> {
  const plansRef = collection(db, 'users', userId, 'plans');
  const q = query(plansRef, orderBy('generatedAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => docToWorkoutPlan(docSnap, userId));
}

// Get plans with pagination
export async function getPlansPagedAsync(
  userId: string,
  options?: Partial<PaginationOptions>,
  includeCount = false
): Promise<PaginatedResult<WorkoutPlan>> {
  const { pageSize, cursor } = normalizePaginationOptions(options);
  const plansRef = collection(db, 'users', userId, 'plans');

  // Build base query
  let q = query(
    plansRef,
    orderBy('generatedAt', 'desc'),
    firestoreLimit(pageSize + 1) // Fetch one extra to detect hasMore
  );

  // If cursor provided, start after that document
  if (cursor) {
    const cursorDoc = await getDoc(doc(plansRef, cursor));
    if (cursorDoc.exists()) {
      q = query(
        plansRef,
        orderBy('generatedAt', 'desc'),
        startAfter(cursorDoc),
        firestoreLimit(pageSize + 1)
      );
    }
  }

  const querySnapshot = await getDocs(q);
  const plans = querySnapshot.docs.map((docSnap) => docToWorkoutPlan(docSnap, userId));

  // Get total count if requested
  let totalCount: number | undefined;
  if (includeCount) {
    const countSnapshot = await getCountFromServer(query(plansRef));
    totalCount = countSnapshot.data().count;
  }

  return createPaginatedResult(plans, pageSize, (plan) => plan.id, totalCount);
}

// Rename a plan
export async function renamePlan(
  userId: string,
  planId: string,
  name: string
): Promise<void> {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  await updateDoc(planRef, { name });
}

// Pause a plan
export async function pausePlan(userId: string, planId: string): Promise<void> {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  await updateDoc(planRef, {
    status: 'paused',
    active: false,
    pausedAt: serverTimestamp(),
  });
}

// Resume a paused plan
export async function resumePlan(userId: string, planId: string): Promise<void> {
  const plansRef = collection(db, 'users', userId, 'plans');
  const planRef = doc(db, 'users', userId, 'plans', planId);

  // Query for potentially active plans BEFORE the transaction
  // We'll verify their state inside the transaction
  const activeQuery = query(plansRef, where('active', '==', true));
  const potentiallyActivePlans = await getDocs(activeQuery);
  const activePlanRefs = potentiallyActivePlans.docs
    .filter((docSnap) => docSnap.id !== planId)
    .map((docSnap) => docSnap.ref);

  // Use transaction to ensure atomicity
  await runTransaction(db, async (transaction) => {
    // Get the target plan first
    const planSnap = await transaction.get(planRef);

    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }

    // Re-read each potentially active plan inside the transaction to verify state
    // This ensures we only deactivate plans that are still active
    for (const ref of activePlanRefs) {
      const activeSnap = await transaction.get(ref);
      if (activeSnap.exists() && activeSnap.data().active === true) {
        transaction.update(ref, {
          status: 'paused',
          active: false,
          pausedAt: serverTimestamp(),
        });
      }
    }

    const planData = planSnap.data();
    const validUntil = (planData.validUntil as Timestamp)?.toDate?.() || new Date();

    // If plan is expired, auto-extend by 1 week
    const updates: Record<string, unknown> = {
      status: 'active',
      active: true,
      resumedAt: serverTimestamp(),
      pausedAt: null,
    };

    if (validUntil < new Date()) {
      const newValidUntil = new Date();
      newValidUntil.setDate(newValidUntil.getDate() + 7);
      updates.validUntil = Timestamp.fromDate(newValidUntil);
      updates.extendedAt = serverTimestamp();
      if (!planData.originalValidUntil) {
        updates.originalValidUntil = planData.validUntil;
      }
    }

    transaction.update(planRef, updates);
  });
}

// Archive a plan
export async function archivePlan(userId: string, planId: string): Promise<void> {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  await updateDoc(planRef, {
    status: 'archived',
    active: false,
    archivedAt: serverTimestamp(),
  });
}

// Extend a plan by N weeks
export async function extendPlan(
  userId: string,
  planId: string,
  weeks: number = 1
): Promise<void> {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  const planSnap = await getDoc(planRef);

  if (!planSnap.exists()) {
    throw new Error('Plan not found');
  }

  const plan = planSnap.data();
  const currentValidUntil = (plan.validUntil as Timestamp)?.toDate?.() || new Date();
  const newValidUntil = new Date(currentValidUntil);
  newValidUntil.setDate(newValidUntil.getDate() + weeks * 7);

  await updateDoc(planRef, {
    validUntil: Timestamp.fromDate(newValidUntil),
    extendedAt: serverTimestamp(),
    originalValidUntil: plan.originalValidUntil || plan.validUntil,
  });
}

// Delete a plan permanently
export async function deletePlan(userId: string, planId: string): Promise<void> {
  const planRef = doc(db, 'users', userId, 'plans', planId);
  await deleteDoc(planRef);
}

// ============================================
// Exercise Library Operations
// ============================================

// Helper to convert Firestore doc to LibraryExercise
function docToLibraryExercise(
  docSnap: { id: string; data: () => Record<string, unknown> }
): LibraryExercise {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name as string,
    primaryMuscles: data.primaryMuscles as MuscleGroup[],
    secondaryMuscles: data.secondaryMuscles as MuscleGroup[] | undefined,
    equipmentRequired: data.equipmentRequired as EquipmentType[],
    difficulty: data.difficulty as DifficultyLevel,
    instructions: data.instructions as string[],
    tips: data.tips as string[] | undefined,
    imageUrl: data.imageUrl as string | undefined,
    videoUrl: data.videoUrl as string | undefined,
    isCustom: data.isCustom as boolean,
    isDefault: data.isDefault as boolean,
    createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || undefined,
  };
}

// Get all exercises in user's library
export async function getExerciseLibrary(userId: string): Promise<LibraryExercise[]> {
  try {
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    // Don't use orderBy to avoid index requirements - sort client-side instead
    const querySnapshot = await getDocs(exercisesRef);

    const exercises = querySnapshot.docs.map((docSnap) => docToLibraryExercise(docSnap));
    // Sort by name client-side
    return exercises.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    logger.error('Error fetching exercise library:', error);
    return [];
  }
}

// Get exercises with pagination
export async function getExercisesPagedAsync(
  userId: string,
  options?: Partial<PaginationOptions>,
  includeCount = false
): Promise<PaginatedResult<LibraryExercise>> {
  const { pageSize, cursor } = normalizePaginationOptions(options);
  const exercisesRef = collection(db, 'users', userId, 'exercises');

  try {
    // Build base query - order by name for consistent pagination
    let q = query(
      exercisesRef,
      orderBy('name'),
      firestoreLimit(pageSize + 1)
    );

    // If cursor provided, start after that document
    if (cursor) {
      const cursorDoc = await getDoc(doc(exercisesRef, cursor));
      if (cursorDoc.exists()) {
        q = query(
          exercisesRef,
          orderBy('name'),
          startAfter(cursorDoc),
          firestoreLimit(pageSize + 1)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const exercises = querySnapshot.docs.map((docSnap) => docToLibraryExercise(docSnap));

    // Get total count if requested
    let totalCount: number | undefined;
    if (includeCount) {
      const countSnapshot = await getCountFromServer(query(exercisesRef));
      totalCount = countSnapshot.data().count;
    }

    return createPaginatedResult(exercises, pageSize, (ex) => ex.id, totalCount);
  } catch (error) {
    logger.error('Error fetching paginated exercise library:', error);
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
    };
  }
}

// Get a single exercise by ID
export async function getExerciseById(
  userId: string,
  exerciseId: string
): Promise<LibraryExercise | null> {
  const docRef = doc(db, 'users', userId, 'exercises', exerciseId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docToLibraryExercise(docSnap);
}

// Create a new exercise
export async function createExercise(
  userId: string,
  exercise: NewExercise
): Promise<string> {
  const exercisesRef = collection(db, 'users', userId, 'exercises');
  const docRef = await addDoc(exercisesRef, {
    ...exercise,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Update an existing exercise
export async function updateExercise(
  userId: string,
  exerciseId: string,
  updates: ExerciseUpdate
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'exercises', exerciseId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Delete an exercise
export async function deleteExercise(
  userId: string,
  exerciseId: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'exercises', exerciseId);
  await deleteDoc(docRef);
}

// Search/filter exercises
export async function searchExercises(
  userId: string,
  filters: ExerciseFilters
): Promise<LibraryExercise[]> {
  // Get all exercises and filter client-side
  // Firestore doesn't support OR queries or full-text search well
  const allExercises = await getExerciseLibrary(userId);

  return allExercises.filter((exercise) => {
    // Filter by muscle group
    if (filters.muscleGroup) {
      const hasMuscle =
        exercise.primaryMuscles.includes(filters.muscleGroup) ||
        exercise.secondaryMuscles?.includes(filters.muscleGroup);
      if (!hasMuscle) return false;
    }

    // Filter by equipment
    if (filters.equipment) {
      if (!exercise.equipmentRequired.includes(filters.equipment)) return false;
    }

    // Filter by difficulty
    if (filters.difficulty) {
      if (exercise.difficulty !== filters.difficulty) return false;
    }

    // Filter by search term (name)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      if (!exercise.name.toLowerCase().includes(term)) return false;
    }

    return true;
  });
}

// Check if user has an exercise library initialized
export async function hasExerciseLibrary(userId: string): Promise<boolean> {
  try {
    const exercisesRef = collection(db, 'users', userId, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    return !snapshot.empty;
  } catch (error) {
    logger.error('Error checking exercise library:', error);
    return false;
  }
}

// Initialize exercise library with default exercises
export async function initializeExerciseLibrary(userId: string): Promise<void> {
  try {
    // Check if library already exists
    const alreadyExists = await hasExerciseLibrary(userId);
    if (alreadyExists) return;

    // Import seed data dynamically to avoid bundling in every page
    const { DEFAULT_EXERCISES } = await import('@/data/defaultExercises');

    const exercisesRef = collection(db, 'users', userId, 'exercises');

    // Use Firestore batch writes for efficiency (max 500 operations per batch)
    const batchSize = 500;
    for (let i = 0; i < DEFAULT_EXERCISES.length; i += batchSize) {
      const batch = writeBatch(db);
      const exercises = DEFAULT_EXERCISES.slice(i, i + batchSize);

      for (const exercise of exercises) {
        const docRef = doc(exercisesRef);
        batch.set(docRef, {
          ...exercise,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }
  } catch (error) {
    logger.error('Error initializing exercise library:', error);
    throw error;
  }
}

// Get exercise by name (fuzzy match for AI)
export async function getExerciseByName(
  userId: string,
  name: string
): Promise<LibraryExercise | null> {
  const allExercises = await getExerciseLibrary(userId);
  const lowerName = name.toLowerCase();

  // First try exact match
  let match = allExercises.find(
    (ex) => ex.name.toLowerCase() === lowerName
  );

  // If no exact match, try partial match
  if (!match) {
    match = allExercises.find((ex) =>
      ex.name.toLowerCase().includes(lowerName)
    );
  }

  return match || null;
}

// ============================================
// Chat Session Operations
// ============================================

// Helper to convert Firestore doc to ChatSession
function docToChatSession(
  docSnap: { id: string; data: () => Record<string, unknown> },
  userId: string
): ChatSession {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId,
    title: data.title as string,
    createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || new Date(),
    messageCount: (data.messageCount as number) || 0,
    lastMessage: (data.lastMessage as string) || '',
    isActive: (data.isActive as boolean) || false,
  };
}

// Helper to convert Firestore doc to ChatMessage
function docToChatMessage(
  docSnap: { id: string; data: () => Record<string, unknown> }
): ChatMessage {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    role: data.role as 'user' | 'assistant',
    content: data.content as string,
    createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
    planUpdated: data.planUpdated as boolean | undefined,
  };
}

// Get the currently active chat session
export async function getActiveChatSession(userId: string): Promise<ChatSession | null> {
  const sessionsRef = collection(db, 'users', userId, 'chatSessions');
  const q = query(sessionsRef, where('isActive', '==', true), firestoreLimit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  return docToChatSession(querySnapshot.docs[0], userId);
}

// Get all chat sessions for a user, ordered by most recent
export async function getChatSessions(
  userId: string,
  limitCount: number = 20
): Promise<ChatSession[]> {
  const sessionsRef = collection(db, 'users', userId, 'chatSessions');
  const q = query(
    sessionsRef,
    orderBy('updatedAt', 'desc'),
    firestoreLimit(limitCount)
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => docToChatSession(docSnap, userId));
}

// Create a new chat session
export async function createChatSession(
  userId: string,
  title: string
): Promise<string> {
  const sessionsRef = collection(db, 'users', userId, 'chatSessions');

  // Use transaction to ensure only one active session
  return await runTransaction(db, async (transaction) => {
    // Deactivate any existing active sessions
    const activeQuery = query(sessionsRef, where('isActive', '==', true));
    const activeSessions = await getDocs(activeQuery);

    for (const docSnap of activeSessions.docs) {
      transaction.update(docSnap.ref, { isActive: false });
    }

    // Create new session
    const newSessionRef = doc(sessionsRef);
    transaction.set(newSessionRef, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 0,
      lastMessage: '',
      isActive: true,
    });

    return newSessionRef.id;
  });
}

// Update chat session metadata
export async function updateChatSession(
  userId: string,
  sessionId: string,
  updates: Partial<Pick<ChatSession, 'title' | 'lastMessage' | 'messageCount'>>
): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Set a session as active (deactivates others)
export async function setActiveChatSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const sessionsRef = collection(db, 'users', userId, 'chatSessions');
  const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);

  await runTransaction(db, async (transaction) => {
    // Deactivate all active sessions
    const activeQuery = query(sessionsRef, where('isActive', '==', true));
    const activeSessions = await getDocs(activeQuery);

    for (const docSnap of activeSessions.docs) {
      transaction.update(docSnap.ref, { isActive: false });
    }

    // Activate the target session
    transaction.update(sessionRef, { isActive: true });
  });
}

// Deactivate a session (used when starting new chat)
export async function deactivateChatSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
  await updateDoc(sessionRef, { isActive: false });
}

// Delete a chat session and all its messages
export async function deleteChatSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
  const messagesRef = collection(db, 'users', userId, 'chatSessions', sessionId, 'messages');

  // Delete all messages first (Firestore doesn't cascade deletes)
  const messagesSnapshot = await getDocs(messagesRef);
  const batch = writeBatch(db);

  for (const msgDoc of messagesSnapshot.docs) {
    batch.delete(msgDoc.ref);
  }

  // Delete the session document
  batch.delete(sessionRef);

  await batch.commit();
}

// Get all messages for a chat session (legacy - use paginated version for large histories)
export async function getChatMessages(
  userId: string,
  sessionId: string
): Promise<ChatMessage[]> {
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chatSessions',
    sessionId,
    'messages'
  );
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((docSnap) => docToChatMessage(docSnap));
}

// Get messages with pagination - for long chat histories
export async function getChatMessagesPagedAsync(
  userId: string,
  sessionId: string,
  options?: Partial<PaginationOptions>,
  includeCount = false
): Promise<PaginatedResult<ChatMessage>> {
  const { pageSize, cursor } = normalizePaginationOptions(options);
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chatSessions',
    sessionId,
    'messages'
  );

  // Build base query - order by createdAt ascending for chronological order
  let q = query(
    messagesRef,
    orderBy('createdAt', 'asc'),
    firestoreLimit(pageSize + 1)
  );

  // If cursor provided, start after that document
  if (cursor) {
    const cursorDoc = await getDoc(doc(messagesRef, cursor));
    if (cursorDoc.exists()) {
      q = query(
        messagesRef,
        orderBy('createdAt', 'asc'),
        startAfter(cursorDoc),
        firestoreLimit(pageSize + 1)
      );
    }
  }

  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map((docSnap) => docToChatMessage(docSnap));

  // Get total count if requested
  let totalCount: number | undefined;
  if (includeCount) {
    const countSnapshot = await getCountFromServer(query(messagesRef));
    totalCount = countSnapshot.data().count;
  }

  return createPaginatedResult(messages, pageSize, (msg) => msg.id, totalCount);
}

// Get the most recent N messages for a chat session (for initial load)
export async function getRecentChatMessages(
  userId: string,
  sessionId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chatSessions',
    sessionId,
    'messages'
  );

  // Get the most recent messages in descending order
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );
  const querySnapshot = await getDocs(q);

  // Reverse to get chronological order
  return querySnapshot.docs
    .map((docSnap) => docToChatMessage(docSnap))
    .reverse();
}

// Add a message to a chat session and update session metadata
// Uses transaction to prevent race condition on message count
export async function addChatMessage(
  userId: string,
  sessionId: string,
  message: NewChatMessage
): Promise<string> {
  const sessionRef = doc(db, 'users', userId, 'chatSessions', sessionId);
  const messagesRef = collection(
    db,
    'users',
    userId,
    'chatSessions',
    sessionId,
    'messages'
  );

  // Generate message document reference before transaction
  const messageRef = doc(messagesRef);

  // Calculate last message preview
  const lastMessagePreview =
    message.content.length > 100
      ? message.content.substring(0, 100) + '...'
      : message.content;

  // Use transaction to atomically add message and update count
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    const currentCount = sessionSnap.exists()
      ? ((sessionSnap.data().messageCount as number) || 0)
      : 0;

    // Add the message
    transaction.set(messageRef, {
      ...message,
      createdAt: serverTimestamp(),
    });

    // Update session metadata atomically
    transaction.update(sessionRef, {
      messageCount: currentCount + 1,
      lastMessage: lastMessagePreview,
      updatedAt: serverTimestamp(),
    });
  });

  return messageRef.id;
}

export { db };
