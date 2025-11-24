import { 
  collection, 
  addDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy,
  onSnapshot,
  limit 
} from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "image" | "file";
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount?: number;
}

export const messageService = {
  // Get or create conversation ID between two users
  getConversationId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `conversation_${sortedIds[0]}_${sortedIds[1]}`;
  },

  // Send a message
  async sendMessage(
    receiverId: string,
    content: string,
    type: Message["type"] = "text"
  ): Promise<string> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const conversationId = this.getConversationId(auth.currentUser.uid, receiverId);
      
      const messageRef = await addDoc(collection(db, "messages"), {
        conversationId,
        senderId: auth.currentUser.uid,
        receiverId,
        content,
        type,
        read: false,
        createdAt: Timestamp.now(),
      });
      
      // Update conversation
      await this.updateConversation(conversationId, auth.currentUser.uid, receiverId, content);
      
      return messageRef.id;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Update conversation metadata
  async updateConversation(
    conversationId: string,
    senderId: string,
    receiverId: string,
    lastMessage: string
  ): Promise<void> {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationDoc = await conversationRef.get();
      
      if (!conversationDoc.exists()) {
        // Create new conversation
        await conversationRef.set({
          participants: [senderId, receiverId],
          lastMessage,
          lastMessageAt: Timestamp.now(),
          [`unreadCount_${receiverId}`]: 1,
        });
      } else {
        // Update existing conversation
        await conversationRef.update({
          lastMessage,
          lastMessageAt: Timestamp.now(),
          [`unreadCount_${receiverId}`]: (conversationDoc.data()?.[`unreadCount_${receiverId}`] || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Error updating conversation:", error);
      throw error;
    }
  },

  // Get messages for a conversation
  async getMessages(otherUserId: string): Promise<Message[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const conversationId = this.getConversationId(auth.currentUser.uid, otherUserId);
      
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        limit(50)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      const messages: Message[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Message);
      });
      
      // Sort by date ascending (oldest first) client-side
      return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  },

  // Subscribe to messages in real-time
  subscribeToMessages(
    otherUserId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }
    
    const conversationId = this.getConversationId(auth.currentUser.uid, otherUserId);
    
    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      limit(50)
    );
    
    return onSnapshot(messagesQuery, (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Message);
      });
      // Sort by date ascending (oldest first) client-side
      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      callback(messages);
    });
  },

  // Mark messages as read
  async markMessagesAsRead(otherUserId: string): Promise<void> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const conversationId = this.getConversationId(auth.currentUser.uid, otherUserId);
      
      const messagesQuery = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("receiverId", "==", auth.currentUser.uid),
        where("read", "==", false)
      );
      
      const querySnapshot = await getDocs(messagesQuery);
      const updatePromises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
      
      // Reset unread count
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount_${auth.currentUser.uid}`]: 0,
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    try {
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(conversationsQuery);
      const conversations: Conversation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          ...data,
          lastMessageAt: data.lastMessageAt?.toDate(),
          unreadCount: data[`unreadCount_${auth.currentUser!.uid}`] || 0,
        } as Conversation);
      });
      
      // Sort by lastMessageAt descending (most recent first) client-side
      return conversations.sort((a, b) => {
        const timeA = a.lastMessageAt?.getTime() || 0;
        const timeB = b.lastMessageAt?.getTime() || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },
};

