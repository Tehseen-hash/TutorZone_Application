import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { reviewService } from "@/services/reviewService";
import { bookingService, Booking } from "@/services/bookingService";
import { userService, TutorProfile } from "@/services/userService";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function ReviewScreen() {
  const router = useRouter();
  const { bookingId, tutorId } = useLocalSearchParams<{ bookingId: string; tutorId: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (bookingId && tutorId) {
      loadData();
    }
  }, [bookingId, tutorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if already reviewed
      const reviewed = await reviewService.hasReviewedBooking(bookingId!);
      setHasReviewed(reviewed);
      
      if (reviewed) {
        Alert.alert("Already Reviewed", "You have already reviewed this session.");
        router.back();
        return;
      }

      const bookingData = await bookingService.getBooking(bookingId!);
      if (bookingData) {
        setBooking(bookingData);
      }

      const tutorData = await userService.getTutorProfile(tutorId!);
      if (tutorData) {
        setTutor(tutorData);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert("Error", "Please write a comment");
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createReview({
        tutorId: tutorId!,
        bookingId: bookingId!,
        rating,
        comment: comment.trim(),
      });

      Alert.alert(
        "Success",
        "Thank you for your review!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Write a Review</Text>
      </View>

      {tutor && (
        <Card style={styles.section}>
          <Text style={styles.tutorName}>Review for {tutor.name}</Text>
          {booking && (
            <Text style={styles.bookingInfo}>
              Session on {booking.date.toLocaleDateString()}
            </Text>
          )}
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Rating</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Text style={[styles.star, star <= rating && styles.starFilled]}>
                ⭐
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>
          {rating === 5
            ? "Excellent"
            : rating === 4
            ? "Very Good"
            : rating === 3
            ? "Good"
            : rating === 2
            ? "Fair"
            : "Poor"}
        </Text>
      </Card>

      <Card style={styles.section}>
        <Input
          label="Your Review"
          placeholder="Share your experience with this tutor..."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={6}
        />
        <Text style={styles.hint}>
          {comment.length}/500 characters
        </Text>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title="Submit Review"
          onPress={handleSubmit}
          loading={submitting}
          size="large"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  bookingInfo: {
    fontSize: 14,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
    opacity: 0.3,
  },
  starFilled: {
    opacity: 1,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
  },
});





