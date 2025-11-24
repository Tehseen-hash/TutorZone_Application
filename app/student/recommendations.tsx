import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { SUBJECTS } from "@/constants/subjects";

interface Tutor {
  id: string;
  email: string;
  subjects: string[];
  rating?: number;
  totalSessions?: number;
  matchScore?: number;
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const [recommendedTutors, setRecommendedTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      
      // Get current user's preferences/interests (simulated AI logic)
      // In a real app, this would analyze user's past sessions, performance, etc.
      const userInterests = await getUserInterests();
      
      // Fetch all tutors
      const tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor")
      );
      const querySnapshot = await getDocs(tutorsQuery);
      const tutors: Tutor[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tutor: Tutor = {
          id: doc.id,
          email: data.email || "",
          subjects: data.subjects || [],
          rating: data.rating || 0,
          totalSessions: data.totalSessions || 0,
        };
        
        // AI-based matching algorithm
        tutor.matchScore = calculateMatchScore(tutor, userInterests);
        tutors.push(tutor);
      });
      
      // Sort by match score and rating
      tutors.sort((a, b) => {
        const scoreA = (a.matchScore || 0) * 0.7 + (a.rating || 0) * 0.3;
        const scoreB = (b.matchScore || 0) * 0.7 + (b.rating || 0) * 0.3;
        return scoreB - scoreA;
      });
      
      // Get top 5 recommendations
      setRecommendedTutors(tutors.slice(0, 5));
    } catch (error) {
      console.error("Error generating recommendations:", error);
      Alert.alert("Error", "Failed to generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getUserInterests = async (): Promise<string[]> => {
    // Simulated: In real app, analyze user's past sessions, performance, preferences
    // For now, return some default interests
    if (auth.currentUser) {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // In real implementation, analyze user's past sessions, performance, etc.
          return data.interests || ["math", "physics", "computer-science"];
        }
        return ["math", "physics", "computer-science"];
      } catch {
        return ["math", "physics", "computer-science"];
      }
    }
    return ["math", "physics", "computer-science"];
  };

  const calculateMatchScore = (tutor: Tutor, userInterests: string[]): number => {
    let score = 0;
    
    // Subject match (60% weight)
    const matchingSubjects = tutor.subjects.filter((s) =>
      userInterests.includes(s)
    );
    score += (matchingSubjects.length / Math.max(userInterests.length, 1)) * 60;
    
    // Rating boost (20% weight)
    score += (tutor.rating || 0) * 2;
    
    // Experience boost (20% weight)
    score += Math.min((tutor.totalSessions || 0) / 10, 20);
    
    return Math.min(score, 100); // Cap at 100
  };

  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds
      .map((id) => SUBJECTS.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Analyzing your preferences...</Text>
        <Text style={styles.loadingSubtext}>Finding the perfect tutors for you</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Recommendations</Text>
        <Text style={styles.subtitle}>
          Personalized tutor suggestions just for you
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {recommendedTutors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyText}>
              No recommendations available yet
            </Text>
            <Text style={styles.emptySubtext}>
              Complete your profile to get personalized suggestions
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>✨</Text>
              <Text style={styles.infoText}>
                These tutors are recommended based on your learning preferences,
                subject interests, and performance history.
              </Text>
            </View>

            {recommendedTutors.map((tutor, index) => (
              <View key={tutor.id} style={styles.recommendationCard}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    #{index + 1} Match
                  </Text>
                  <Text style={styles.matchScore}>
                    {Math.round(tutor.matchScore || 0)}% Match
                  </Text>
                </View>

                <View style={styles.tutorInfo}>
                  <View style={styles.tutorAvatar}>
                    <Text style={styles.tutorAvatarText}>👨‍🏫</Text>
                  </View>
                  <View style={styles.tutorDetails}>
                    <Text style={styles.tutorEmail}>{tutor.email}</Text>
                    {tutor.rating > 0 && (
                      <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>
                          ⭐ {tutor.rating.toFixed(1)}
                        </Text>
                        {tutor.totalSessions > 0 && (
                          <Text style={styles.sessionsText}>
                            • {tutor.totalSessions} sessions
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {tutor.subjects.length > 0 && (
                  <View style={styles.subjectsRow}>
                    <Text style={styles.subjectsLabel}>Teaches:</Text>
                    <Text style={styles.subjectsText}>
                      {getSubjectNames(tutor.subjects)}
                      {tutor.subjects.length > 3 && " +more"}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => {
                    Alert.alert(
                      "Book Session",
                      `Book a session with ${tutor.email}?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Book Now",
                          onPress: () => {
                            Alert.alert("Coming Soon", "Booking feature coming soon!");
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.bookButtonText}>Book Session</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#856404",
    lineHeight: 18,
  },
  recommendationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
    textTransform: "uppercase",
  },
  matchScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10b981",
  },
  tutorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tutorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tutorAvatarText: {
    fontSize: 24,
  },
  tutorDetails: {
    flex: 1,
  },
  tutorEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
  },
  sessionsText: {
    fontSize: 12,
    color: "#666",
  },
  subjectsRow: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  subjectsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  subjectsText: {
    fontSize: 14,
    color: "#333",
  },
  bookButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

