import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy 
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

export interface Booking {
  id?: string;
  studentId: string;
  tutorId: string;
  subject: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  status: "pending" | "confirmed" | "completed" | "cancelled";
  price: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  meetingLink?: string;
}

export const bookingService = {
  // Create a new booking
  async createBooking(bookingData: Omit<Booking, "id" | "createdAt" | "updatedAt" | "status">): Promise<string> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const bookingRef = await addDoc(collection(db, "bookings"), {
        ...bookingData,
        status: "pending",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      return bookingRef.id;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // Get booking by ID
  async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
      if (bookingDoc.exists()) {
        const data = bookingDoc.data();
        return {
          id: bookingDoc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Booking;
      }
      return null;
    } catch (error) {
      console.error("Error fetching booking:", error);
      throw error;
    }
  },

  // Get bookings for current user (student)
  async getStudentBookings(): Promise<Booking[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      // Query without orderBy to avoid index requirement, sort client-side
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("studentId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(bookingsQuery);
      const bookings: Booking[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Booking);
      });
      
      // Sort by date descending (newest first) client-side
      return bookings.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("Error fetching student bookings:", error);
      throw error;
    }
  },

  // Get bookings for tutor
  async getTutorBookings(): Promise<Booking[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      // Query without orderBy to avoid index requirement, sort client-side
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("tutorId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(bookingsQuery);
      const bookings: Booking[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Booking);
      });
      
      // Sort by date descending (newest first) client-side
      return bookings.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("Error fetching tutor bookings:", error);
      throw error;
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: Booking["status"]): Promise<void> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  },

  // Cancel booking
  async cancelBooking(bookingId: string): Promise<void> {
    await this.updateBookingStatus(bookingId, "cancelled");
  },

  // Confirm booking
  async confirmBooking(bookingId: string): Promise<void> {
    await this.updateBookingStatus(bookingId, "confirmed");
  },

  // Complete booking
  async completeBooking(bookingId: string): Promise<void> {
    await this.updateBookingStatus(bookingId, "completed");
  },

  // Delete booking
  async deleteBooking(bookingId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
    } catch (error) {
      console.error("Error deleting booking:", error);
      throw error;
    }
  },
};

