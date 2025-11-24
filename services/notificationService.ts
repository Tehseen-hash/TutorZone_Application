import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy,
  onSnapshot 
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

export interface Notification {
  id?: string;
  userId: string;
  type: "booking" | "message" | "review" | "system";
  title: string;
  message: string;
  data?: any; // Additional data (bookingId, userId, etc.)
  read: boolean;
  createdAt: Date;
}

export const notificationService = {
  // Create a notification
  async createNotification(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
    data?: any
  ): Promise<string> {
    try {
      const notificationRef = await addDoc(collection(db, "notifications"), {
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: Timestamp.now(),
      });
      
      return notificationRef.id;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  // Get notifications for current user
  async getNotifications(): Promise<Notification[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      // Query without orderBy to avoid index requirement, sort client-side
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      const notifications: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Notification);
      });
      
      // Sort client-side: unread first, then by date descending
      return notifications.sort((a, b) => {
        // Unread notifications first
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        // Then by date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Subscribe to notifications in real-time
  subscribeToNotifications(
    callback: (notifications: Notification[]) => void
  ): () => void {
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid)
    );
    
    return onSnapshot(notificationsQuery, (querySnapshot) => {
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Notification);
      });
      // Sort client-side: unread first, then by date descending
      notifications.sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      callback(notifications);
    });
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const notifications = await this.getNotifications();
      const unread = notifications.filter((n) => !n.read);
      
      await Promise.all(
        unread.map((n) => this.markAsRead(n.id!))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
      throw error;
    }
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    if (!auth.currentUser) return 0;
    
    try {
      const notifications = await this.getNotifications();
      return notifications.filter((n) => !n.read).length;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  },

  // Create booking notification
  async notifyBookingCreated(
    userId: string,
    bookingId: string,
    tutorName: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      "booking",
      "New Booking Request",
      `${tutorName} has a new booking request`,
      { bookingId }
    );
  },

  // Create message notification
  async notifyNewMessage(
    userId: string,
    senderName: string,
    message: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      "message",
      "New Message",
      `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
      { type: "message" }
    );
  },
};

