import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { TutorProfile } from "./userService";

export interface TutorApplication {
  tutorId: string;
  tutor: TutorProfile;
  cvUrl?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  submittedAt: Date;
}

export const adminService = {
  // Check if user is admin
  async isAdmin(): Promise<boolean> {
    if (!auth.currentUser) return false;

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        return userDoc.data().role === "admin";
      }
      return false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  },

  // Get all pending tutor applications
  async getPendingApplications(): Promise<TutorApplication[]> {
    if (!(await this.isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor"),
        where("applicationStatus", "==", "pending")
      );

      const querySnapshot = await getDocs(tutorsQuery);
      const applications: TutorApplication[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const tutor = {
          uid: docSnapshot.id,
          ...data,
        } as TutorProfile;

        applications.push({
          tutorId: docSnapshot.id,
          tutor,
          cvUrl: data.cvUrl,
          status: data.applicationStatus || "pending",
          submittedAt: data.createdAt?.toDate() || new Date(),
        });
      }

      return applications;
    } catch (error) {
      console.error("Error fetching pending applications:", error);
      throw error;
    }
  },

  // Get all tutor applications
  async getAllApplications(): Promise<TutorApplication[]> {
    if (!(await this.isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor")
      );

      const querySnapshot = await getDocs(tutorsQuery);
      const applications: TutorApplication[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const tutor = {
          uid: docSnapshot.id,
          ...data,
        } as TutorProfile;

        applications.push({
          tutorId: docSnapshot.id,
          tutor,
          cvUrl: data.cvUrl,
          status: data.applicationStatus || "pending",
          reviewedBy: data.reviewedBy,
          reviewedAt: data.reviewedAt?.toDate(),
          reviewNotes: data.reviewNotes,
          submittedAt: data.createdAt?.toDate() || new Date(),
        });
      }

      return applications.sort(
        (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
      );
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }
  },

  // Approve tutor application
  async approveApplication(
    tutorId: string,
    notes?: string
  ): Promise<void> {
    if (!auth.currentUser || !(await this.isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const tutorRef = doc(db, "users", tutorId);
      await updateDoc(tutorRef, {
        applicationStatus: "approved",
        verified: true,
        reviewedBy: auth.currentUser.uid,
        reviewedAt: Timestamp.now(),
        reviewNotes: notes || "",
      });
    } catch (error) {
      console.error("Error approving application:", error);
      throw error;
    }
  },

  // Reject tutor application
  async rejectApplication(
    tutorId: string,
    notes: string
  ): Promise<void> {
    if (!auth.currentUser || !(await this.isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const tutorRef = doc(db, "users", tutorId);
      await updateDoc(tutorRef, {
        applicationStatus: "rejected",
        reviewedBy: auth.currentUser.uid,
        reviewedAt: Timestamp.now(),
        reviewNotes: notes,
      });
    } catch (error) {
      console.error("Error rejecting application:", error);
      throw error;
    }
  },

  // Get tutor application details
  async getApplication(tutorId: string): Promise<TutorApplication | null> {
    if (!(await this.isAdmin())) {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const tutorDoc = await getDoc(doc(db, "users", tutorId));
      if (!tutorDoc.exists()) {
        return null;
      }

      const data = tutorDoc.data();
      const tutor = {
        uid: tutorDoc.id,
        ...data,
      } as TutorProfile;

      return {
        tutorId: tutorDoc.id,
        tutor,
        cvUrl: data.cvUrl,
        status: data.applicationStatus || "pending",
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt?.toDate(),
        reviewNotes: data.reviewNotes,
        submittedAt: data.createdAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error("Error fetching application:", error);
      throw error;
    }
  },
};





