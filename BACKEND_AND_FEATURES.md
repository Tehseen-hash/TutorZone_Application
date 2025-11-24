# Backend Services & Features Documentation

## Overview
This document outlines the backend services and features implemented for the Smart Tutor Connect app.

## Backend Services

### 1. User Service (`services/userService.ts`)
Handles all user-related operations:
- **getCurrentUserProfile()**: Get current authenticated user's profile
- **getUserProfile(uid)**: Get any user's profile by ID
- **updateUserProfile(updates)**: Update current user's profile
- **getTutorProfile(uid)**: Get tutor-specific profile with extended information
- **getAllTutors()**: Fetch all tutors from the database
- **searchTutorsBySubject(subjectId)**: Search tutors by subject
- **updateTutorProfile(updates)**: Update tutor profile with bio, rates, experience, etc.

**Data Models:**
- `UserProfile`: Base user profile with role, email, name, etc.
- `TutorProfile`: Extended profile with bio, hourly rate, subjects, ratings, availability
- `StudentProfile`: Extended profile with grade, learning goals, etc.

### 2. Booking Service (`services/bookingService.ts`)
Manages session bookings:
- **createBooking(bookingData)**: Create a new booking request
- **getBooking(bookingId)**: Get booking details by ID
- **getStudentBookings()**: Get all bookings for current student
- **getTutorBookings()**: Get all bookings for current tutor
- **updateBookingStatus(bookingId, status)**: Update booking status
- **cancelBooking(bookingId)**: Cancel a booking
- **confirmBooking(bookingId)**: Confirm a pending booking
- **completeBooking(bookingId)**: Mark booking as completed
- **deleteBooking(bookingId)**: Delete a booking

**Booking Status Flow:**
- `pending` → `confirmed` → `completed`
- Can be `cancelled` at any time

### 3. Review Service (`services/reviewService.ts`)
Handles reviews and ratings:
- **createReview(reviewData)**: Create a review for a completed session
- **getTutorReviews(tutorId)**: Get all reviews for a tutor
- **updateTutorRating(tutorId)**: Automatically update tutor's average rating
- **hasReviewedBooking(bookingId)**: Check if student already reviewed a booking

**Features:**
- Rating system (1-5 stars)
- Automatic rating calculation
- Review comments
- Prevents duplicate reviews

### 4. Message Service (`services/messageService.ts`)
Manages messaging between users:
- **sendMessage(receiverId, content, type)**: Send a message
- **getMessages(otherUserId)**: Get conversation messages
- **subscribeToMessages(otherUserId, callback)**: Real-time message subscription
- **markMessagesAsRead(otherUserId)**: Mark messages as read
- **getConversations()**: Get all conversations for current user
- **updateConversation()**: Update conversation metadata

**Features:**
- Real-time messaging
- Unread message counts
- Conversation management
- Message types: text, image, file

## UI Components

### Reusable Components (`components/ui/`)
1. **Button.tsx**: Styled button with variants (primary, secondary, outline, danger)
2. **Card.tsx**: Card container with shadow and padding
3. **Input.tsx**: Form input with label and error handling

## Features Implemented

### 1. Tutor Profile Management
- **Screen**: `app/tutor/profile.tsx`
- Tutors can edit:
  - Bio (minimum 20 characters)
  - Hourly rate
  - Experience and qualifications
  - Subjects they teach
  - Availability (structure ready)

### 2. Tutor Discovery & Profiles
- **Screen**: `app/student/tutor-profile.tsx`
- Students can view:
  - Tutor information and bio
  - Ratings and reviews
  - Subjects taught
  - Hourly rate
  - Experience
- Direct booking from profile

### 3. Booking System
- **Screen**: `app/student/book-session.tsx`
- Features:
  - Subject selection
  - Date and time selection
  - Duration selection (30, 60, 90, 120 minutes)
  - Automatic price calculation
  - Optional notes
  - Booking confirmation flow

### 4. Session Management
- **Student Sessions**: `app/student/sessions.tsx`
  - View all bookings
  - Filter by status (all, pending, confirmed, completed)
  - Cancel pending sessions
  - Write reviews for completed sessions
  
- **Tutor Sessions**: `app/tutor/sessions.tsx`
  - View all bookings
  - Filter by status
  - Confirm pending bookings
  - Cancel bookings
  - Mark sessions as completed

### 5. Reviews & Ratings
- **Screen**: `app/student/review.tsx`
- Features:
  - Star rating (1-5)
  - Written comments
  - Prevents duplicate reviews
  - Automatic rating calculation for tutors

### 6. Enhanced Dashboards
- **Student Dashboard**: 
  - Real-time statistics (active sessions, total sessions)
  - Quick actions
  - Navigation to all features
  
- **Tutor Dashboard**:
  - Real-time statistics (active sessions, total students)
  - Quick actions
  - Profile management access

### 7. Improved Tutor Browsing
- **Screen**: `app/student/tutors.tsx`
- Enhanced with:
  - Direct navigation to tutor profiles
  - Better UI/UX
  - Subject filtering
  - Search functionality

## Database Structure

### Collections:
1. **users**: User profiles with role-based data
2. **bookings**: Session bookings with status tracking
3. **reviews**: Reviews and ratings for tutors
4. **messages**: Individual messages
5. **conversations**: Conversation metadata and unread counts

## Next Steps / Future Enhancements

### Pending Features:
1. **Messaging UI**: Complete chat interface implementation
2. **Notifications**: Push notifications for bookings, messages
3. **Payment Integration**: Stripe/PayPal integration
4. **Calendar Integration**: Visual calendar for scheduling
5. **Video Calls**: Integration with Zoom/Google Meet
6. **File Sharing**: Share documents and resources
7. **Advanced Search**: Filter by price, rating, availability
8. **Tutor Verification**: Background check and verification badges

## Technical Notes

- All services use Firebase Firestore for data persistence
- Real-time updates available for messages
- Error handling implemented throughout
- TypeScript types for type safety
- Modern React Native patterns (hooks, functional components)
- Responsive UI design with consistent styling

## Usage Examples

### Creating a Booking:
```typescript
import { bookingService } from "@/services/bookingService";

const bookingId = await bookingService.createBooking({
  studentId: "student123",
  tutorId: "tutor456",
  subject: "math",
  date: new Date("2024-01-15"),
  startTime: "14:00",
  endTime: "15:00",
  duration: 60,
  price: 50.00,
  notes: "Need help with algebra"
});
```

### Getting Tutor Reviews:
```typescript
import { reviewService } from "@/services/reviewService";

const reviews = await reviewService.getTutorReviews("tutor456");
```

### Sending a Message:
```typescript
import { messageService } from "@/services/messageService";

await messageService.sendMessage("tutor456", "Hello, I'd like to book a session!");
```





