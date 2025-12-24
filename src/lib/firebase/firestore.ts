import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { User, UserProfile } from '@/types/user';
import type { Workout } from '@/types/workout';
import type { WorkoutPlan } from '@/types/plan';

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

// Workout operations
export async function getWorkouts(
  userId: string,
  limit: number = 30
): Promise<Workout[]> {
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const q = query(workoutsRef, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.slice(0, limit).map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId,
      ...data,
      date: data.date?.toDate() || new Date(),
    } as Workout;
  });
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

export async function updateWorkout(
  userId: string,
  workoutId: string,
  updates: Partial<Workout>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'workouts', workoutId);
  await updateDoc(docRef, updates);
}

// Plan operations
export async function getActivePlan(userId: string): Promise<WorkoutPlan | null> {
  const plansRef = collection(db, 'users', userId, 'plans');
  const q = query(plansRef, where('active', '==', true));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    userId,
    ...data,
    generatedAt: data.generatedAt?.toDate() || new Date(),
    validUntil: data.validUntil?.toDate() || new Date(),
  } as WorkoutPlan;
}

export async function createPlan(
  userId: string,
  plan: Omit<WorkoutPlan, 'id' | 'userId'>
): Promise<string> {
  // Deactivate existing plans
  const plansRef = collection(db, 'users', userId, 'plans');
  const activeQuery = query(plansRef, where('active', '==', true));
  const activePlans = await getDocs(activeQuery);

  for (const doc of activePlans.docs) {
    await updateDoc(doc.ref, { active: false });
  }

  // Create new plan
  const docRef = await addDoc(plansRef, {
    ...plan,
    generatedAt: Timestamp.fromDate(plan.generatedAt),
    validUntil: Timestamp.fromDate(plan.validUntil),
  });

  return docRef.id;
}

export { db };
