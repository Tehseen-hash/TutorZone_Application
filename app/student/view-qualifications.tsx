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
import { useRouter } from "expo-router";
import { userService, TutorProfile } from "@/services/userService";
import { searchService } from "@/services/searchService";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function ViewQualificationsScreen() {
  const router = useRouter();
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);

  useEffect(() => {
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      setLoading(true);
      // Use search service to get tutors with qualifications
      const tutorsWithQuals = await searchService.getTutorsWithQualifications();
      setTutors(tutorsWithQuals);
    } catch (error) {
      console.error("Error loading tutors:", error);
      // Fallback to userService
      try {
        const tutorsList = await userService.getAllTutors();
        const filtered = tutorsList.filter(
          (tutor) => tutor.qualifications && tutor.qualifications.length > 0
        );
        setTutors(filtered);
      } catch (fallbackError) {
        Alert.alert("Error", "Failed to load tutors");
      }
    } finally {
      setLoading(false);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tutor Qualifications</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {tutors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyText}>No tutors with qualifications yet</Text>
          </View>
        ) : (
          tutors.map((tutor) => (
            <Card key={tutor.uid} style={styles.tutorCard}>
              <View style={styles.tutorHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {tutor.name?.[0]?.toUpperCase() || "👨‍🏫"}
                  </Text>
                </View>
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{tutor.name}</Text>
                  {tutor.rating && (
                    <Text style={styles.rating}>
                      ⭐ {tutor.rating.toFixed(1)}
                    </Text>
                  )}
                  {tutor.hourlyRate && (
                    <Text style={styles.rate}>${tutor.hourlyRate}/hour</Text>
                  )}
                </View>
              </View>

              <View style={styles.qualificationsSection}>
                <Text style={styles.sectionTitle}>Qualifications</Text>
                {tutor.qualifications?.map((qual, index) => (
                  <View key={index} style={styles.qualificationItem}>
                    <Text style={styles.qualificationIcon}>🎓</Text>
                    <Text style={styles.qualificationText}>{qual}</Text>
                  </View>
                ))}
              </View>

              {tutor.experience && (
                <View style={styles.experienceSection}>
                  <Text style={styles.sectionTitle}>Experience</Text>
                  <Text style={styles.experienceText}>{tutor.experience}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  title="View Full Profile"
                  onPress={() => {
                    router.push({
                      pathname: "/student/tutor-profile",
                      params: { tutorId: tutor.uid },
                    });
                  }}
                  size="small"
                  style={styles.actionButton}
                />
                <Button
                  title="Chat"
                  onPress={() => {
                    router.push({
                      pathname: "/student/chat",
                      params: { userId: tutor.uid },
                    });
                  }}
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
              </View>
            </Card>
          ))
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    color: "#333",
  },
  tutorCard: {
    marginBottom: 16,
  },
  tutorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
  },
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
    marginBottom: 4,
  },
  rate: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
  qualificationsSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
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
  experienceSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  experienceText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flex: 1,
  },
});

