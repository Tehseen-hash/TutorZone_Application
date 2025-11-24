import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "student" | "tutor" | "parent";
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  isProfileComplete: boolean;
}

export interface TutorProfile extends UserProfile {
  bio?: string;
  subjects: string[];
  hourlyRate?: number;
  education?: string[];
  experience?: string;
  qualifications?: string[]; // Degrees, certifications, etc.
  rating?: number;
  totalSessions?: number;
  totalReviews?: number;
  availability?: {
    [key: string]: { start: string; end: string }[];
  };
  verified?: boolean;
  applicationStatus?: "pending" | "approved" | "rejected";
  cvUrl?: string;
  parentId?: string; // For students linked to parents
}

export interface StudentProfile extends UserProfile {
  grade?: string;
  learningGoals?: string[];
  preferredSubjects?: string[];
}

export const userService = {
  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    if (!auth.currentUser) return null;
    
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        return { uid: auth.currentUser.uid, ...userDoc.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  // Get user profile by ID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return { uid, ...userDoc.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  // Get tutor profile
  async getTutorProfile(uid: string): Promise<TutorProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role === "tutor") {
          return { uid, ...data } as TutorProfile;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching tutor profile:", error);
      throw error;
    }
  },

  // Get all tutors (with caching for performance)
  async getAllTutors(useCache: boolean = true): Promise<TutorProfile[]> {
    // Check cache first
    if (useCache) {
      const { cacheService } = await import("./cacheService");
      const cached = await cacheService.get<TutorProfile[]>("all_tutors");
      if (cached) {
        return cached;
      }
    }

    try {
      const tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor"),
        where("applicationStatus", "==", "approved") // Only show approved tutors
      );
      const querySnapshot = await getDocs(tutorsQuery);
      const tutors: TutorProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        tutors.push({ uid: doc.id, ...doc.data() } as TutorProfile);
      });
      
      // Cache the results
      if (useCache) {
        const { cacheService } = await import("./cacheService");
        await cacheService.set("all_tutors", tutors);
      }
      
      return tutors;
    } catch (error) {
      console.error("Error fetching tutors:", error);
      throw error;
    }
  },

  // Search tutors by subject
  async searchTutorsBySubject(subjectId: string): Promise<TutorProfile[]> {
    try {
      const tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor"),
        where("subjects", "array-contains", subjectId)
      );
      const querySnapshot = await getDocs(tutorsQuery);
      const tutors: TutorProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        tutors.push({ uid: doc.id, ...doc.data() } as TutorProfile);
      });
      
      return tutors;
    } catch (error) {
      console.error("Error searching tutors:", error);
      throw error;
    }
  },

  // Update tutor profile
  async updateTutorProfile(updates: Partial<TutorProfile>): Promise<void> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists() || userDoc.data().role !== "tutor") {
        throw new Error("User is not a tutor");
      }
      
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date(),
        isProfileComplete: true,
      });
    } catch (error) {
      console.error("Error updating tutor profile:", error);
      throw error;
    }
  },
};

