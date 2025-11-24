import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { userService, TutorProfile } from "@/services/userService";
import { reviewService, Review } from "@/services/reviewService";
import { bookingService } from "@/services/bookingService";
import { SUBJECTS } from "@/constants/subjects";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function TutorProfileScreen() {
  const router = useRouter();
  const { tutorId } = useLocalSearchParams<{ tutorId: string }>();
  const [loading, setLoading] = useState(true);
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    if (tutorId) {
      loadTutorProfile();
    }
  }, [tutorId]);

  const loadTutorProfile = async () => {
    try {
      setLoading(true);
      const tutorProfile = await userService.getTutorProfile(tutorId!);
      if (tutorProfile) {
        setTutor(tutorProfile);
        const tutorReviews = await reviewService.getTutorReviews(tutorId!);
        setReviews(tutorReviews);
      } else {
        Alert.alert("Error", "Tutor not found", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load tutor profile");
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = () => {
    setShowBooking(true);
    router.push({
      pathname: "/student/book-session",
      params: { tutorId: tutorId! },
    });
  };

  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds
      .map((id) => SUBJECTS.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!tutor) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨‍🏫</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{tutor.name}</Text>
            {tutor.rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {tutor.rating.toFixed(1)}</Text>
                {tutor.totalReviews && (
                  <Text style={styles.reviewCount}>
                    ({tutor.totalReviews} reviews)
                  </Text>
                )}
              </View>
            )}
            {tutor.hourlyRate && (
              <Text style={styles.rate}>${tutor.hourlyRate}/hour</Text>
            )}
          </View>
        </View>

        {tutor.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{tutor.bio}</Text>
          </View>
        )}

        {tutor.experience && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <Text style={styles.experience}>{tutor.experience}</Text>
          </View>
        )}

        {tutor.qualifications && tutor.qualifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qualifications</Text>
            {tutor.qualifications.map((qual, index) => (
              <View key={index} style={styles.qualificationItem}>
                <Text style={styles.qualificationIcon}>🎓</Text>
                <Text style={styles.qualificationText}>{qual}</Text>
              </View>
            ))}
          </View>
        )}

        {tutor.subjects && tutor.subjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <Text style={styles.subjects}>{getSubjectNames(tutor.subjects)}</Text>
          </View>
        )}
      </Card>

      {reviews.length > 0 && (
        <Card style={styles.reviewsCard}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>
                  {review.studentName || "Anonymous"}
                </Text>
                <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>
                {review.createdAt.toLocaleDateString()}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Book Session"
          onPress={handleBookSession}
          size="large"
          style={styles.bookButton}
        />
        <Button
          title="Send Message"
          onPress={() => {
            router.push({
              pathname: "/student/chat",
              params: { userId: tutor.uid },
            });
          }}
          variant="outline"
          size="large"
          style={styles.messageButton}
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
  },
  profileCard: {
    margin: 16,
    marginTop: 0,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    color: "#f59e0b",
    fontWeight: "600",
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
  },
  rate: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6366f1",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  experience: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  subjects: {
    fontSize: 16,
    color: "#333",
  },
  reviewsCard: {
    margin: 16,
    marginTop: 0,
  },
  reviewItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  reviewRating: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  bookButton: {
    marginBottom: 0,
  },
  messageButton: {
    marginTop: 0,
  },
  qualificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  qualificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  qualificationText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
});

