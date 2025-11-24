import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import { bookingService, Booking } from "./bookingService";

export interface Payment {
  id?: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "stripe" | "paypal" | "other";
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const paymentService = {
  // Process payment for a booking
  async processPayment(
    bookingId: string,
    amount: number,
    paymentMethod: Payment["paymentMethod"] = "stripe"
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }

    try {
      // In a real implementation, you would:
      // 1. Create payment intent with Stripe/PayPal
      // 2. Process the payment
      // 3. Update booking status
      // 4. Create payment record

      // For now, we'll simulate payment processing
      const booking = await bookingService.getBooking(bookingId);
      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      if (booking.status === "cancelled") {
        return { success: false, error: "Booking is cancelled" };
      }

      // Simulate payment processing
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update booking with payment info
      await updateDoc(doc(db, "bookings", bookingId), {
        paymentStatus: "paid",
        paymentMethod,
        transactionId,
        updatedAt: Timestamp.now(),
      });

      // Create payment record
      await this.createPaymentRecord({
        bookingId,
        amount,
        currency: "USD",
        status: "completed",
        paymentMethod,
        transactionId,
      });

      return { success: true, transactionId };
    } catch (error: any) {
      console.error("Payment processing error:", error);
      return { success: false, error: error.message || "Payment failed" };
    }
  },

  // Create payment record
  async createPaymentRecord(paymentData: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const { addDoc, collection } = await import("firebase/firestore");
      const paymentRef = await addDoc(collection(db, "payments"), {
        ...paymentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return paymentRef.id;
    } catch (error) {
      console.error("Error creating payment record:", error);
      throw error;
    }
  },

  // Get payment by booking ID
  async getPaymentByBooking(bookingId: string): Promise<Payment | null> {
    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const paymentsQuery = query(
        collection(db, "payments"),
        where("bookingId", "==", bookingId)
      );
      const querySnapshot = await getDocs(paymentsQuery);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Payment;
      }
      return null;
    } catch (error) {
      console.error("Error fetching payment:", error);
      throw error;
    }
  },

  // Refund payment
  async refundPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, process refund with payment provider
      await updateDoc(doc(db, "payments", paymentId), {
        status: "refunded",
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("Refund error:", error);
      return { success: false, error: error.message || "Refund failed" };
    }
  },
};





