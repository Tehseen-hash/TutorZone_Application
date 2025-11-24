import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy 
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { userService } from "./userService";

export interface Review {
  id?: string;
  tutorId: string;
  studentId: string;
  bookingId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  studentName?: string;
}

export const reviewService = {
  // Create a review
  async createReview(reviewData: Omit<Review, "id" | "createdAt" | "studentName">): Promise<string> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    // Validate rating
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    try {
      // Get student name
      const studentProfile = await userService.getUserProfile(auth.currentUser.uid);
      
      const reviewRef = await addDoc(collection(db, "reviews"), {
        ...reviewData,
        studentId: auth.currentUser.uid,
        studentName: studentProfile?.name || "Anonymous",
        createdAt: Timestamp.now(),
      });
      
      // Update tutor's average rating
      await this.updateTutorRating(reviewData.tutorId);
      
      return reviewRef.id;
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  },

  // Get reviews for a tutor
  async getTutorReviews(tutorId: string): Promise<Review[]> {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("tutorId", "==", tutorId)
      );
      const querySnapshot = await getDocs(reviewsQuery);
      const reviews: Review[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Review);
      });
      
      // Sort by date descending (newest first) client-side
      return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw error;
    }
  },

  // Update tutor's average rating
  async updateTutorRating(tutorId: string): Promise<void> {
    try {
      const reviews = await this.getTutorReviews(tutorId);
      
      if (reviews.length === 0) return;
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const tutorRef = doc(db, "users", tutorId);
      await updateDoc(tutorRef, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: reviews.length,
      });
    } catch (error) {
      console.error("Error updating tutor rating:", error);
      throw error;
    }
  },

  // Check if student has already reviewed a booking
  async hasReviewedBooking(bookingId: string): Promise<boolean> {
    if (!auth.currentUser) return false;
    
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("bookingId", "==", bookingId),
        where("studentId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(reviewsQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking review:", error);
      return false;
    }
  },
};

