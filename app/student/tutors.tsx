import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { SUBJECTS } from "@/constants/subjects";
import { userService, TutorProfile } from "@/services/userService";

interface Tutor {
  id: string;
  email: string;
  name?: string;
  subjects: string[];
  rating?: number;
  totalSessions?: number;
  hourlyRate?: number;
  bio?: string;
}

export default function TutorsScreen() {
  const router = useRouter();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTutors();
  }, []);

  useEffect(() => {
    filterTutors();
  }, [searchQuery, selectedSubject, minRating, maxPrice, tutors]);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const tutorsList = await userService.getAllTutors();
      const formattedTutors: Tutor[] = tutorsList.map((tutor) => ({
        id: tutor.uid,
        email: tutor.email,
        name: tutor.name,
        subjects: tutor.subjects || [],
        rating: tutor.rating || 0,
        totalSessions: tutor.totalSessions || 0,
        hourlyRate: tutor.hourlyRate,
        bio: tutor.bio,
      }));
      setTutors(formattedTutors);
      setFilteredTutors(formattedTutors);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      Alert.alert("Error", "Failed to load tutors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterTutors = () => {
    let filtered = [...tutors];

    // Filter by search query (name, email, bio, subjects)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tutor) => {
        const nameMatch = tutor.name?.toLowerCase().includes(query);
        const emailMatch = tutor.email.toLowerCase().includes(query);
        const bioMatch = tutor.bio?.toLowerCase().includes(query);
        const subjectMatch = tutor.subjects.some((subj) => {
          const subject = SUBJECTS.find((s) => s.id === subj);
          return subject?.name.toLowerCase().includes(query);
        });
        return nameMatch || emailMatch || bioMatch || subjectMatch;
      });
    }

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter((tutor) =>
        tutor.subjects.includes(selectedSubject)
      );
    }

    // Filter by minimum rating
    if (minRating !== null && minRating > 0) {
      filtered = filtered.filter(
        (tutor) => (tutor.rating || 0) >= minRating
      );
    }

    // Filter by maximum price
    if (maxPrice !== null && maxPrice > 0) {
      filtered = filtered.filter(
        (tutor) => !tutor.hourlyRate || tutor.hourlyRate <= maxPrice
      );
    }

    setFilteredTutors(filtered);
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
        <Text style={styles.loadingText}>Loading tutors...</Text>
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
        <Text style={styles.title}>Find Tutors</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, subject, or keywords..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonText}>🔍 Filters</Text>
          </TouchableOpacity>
        </View>
        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Min Rating:</Text>
              <View style={styles.ratingButtons}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      minRating === rating && styles.ratingButtonActive,
                    ]}
                    onPress={() =>
                      setMinRating(minRating === rating ? null : rating)
                    }
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        minRating === rating && styles.ratingButtonTextActive,
                      ]}
                    >
                      {rating === 0 ? "Any" : `⭐ ${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Max Price/Hour:</Text>
              <View style={styles.priceButtons}>
                {[0, 25, 50, 100].map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.priceButton,
                      maxPrice === price && styles.priceButtonActive,
                    ]}
                    onPress={() =>
                      setMaxPrice(maxPrice === price ? null : price)
                    }
                  >
                    <Text
                      style={[
                        styles.priceButtonText,
                        maxPrice === price && styles.priceButtonTextActive,
                      ]}
                    >
                      {price === 0 ? "Any" : `$${price}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectFilter}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !selectedSubject && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSubject(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                !selectedSubject && styles.filterChipTextActive,
              ]}
            >
              All Subjects
            </Text>
          </TouchableOpacity>
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.filterChip,
                selectedSubject === subject.id && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedSubject(
                  selectedSubject === subject.id ? null : subject.id
                )
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSubject === subject.id && styles.filterChipTextActive,
                ]}
              >
                {subject.icon} {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.tutorsList} contentContainerStyle={styles.tutorsContent}>
        {filteredTutors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍🏫</Text>
            <Text style={styles.emptyText}>
              {tutors.length === 0
                ? "No tutors available yet"
                : "No tutors match your search"}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredTutors.length} tutor{filteredTutors.length !== 1 ? "s" : ""} found
            </Text>
            {filteredTutors.map((tutor) => (
              <TouchableOpacity
                key={tutor.id}
                style={styles.tutorCard}
                onPress={() => {
                  router.push({
                    pathname: "/student/tutor-profile",
                    params: { tutorId: tutor.id },
                  });
                }}
              >
                <View style={styles.tutorHeader}>
                  <View style={styles.tutorAvatar}>
                    <Text style={styles.tutorAvatarText}>👨‍🏫</Text>
                  </View>
                  <View style={styles.tutorInfo}>
                    <Text style={styles.tutorName}>
                      {tutor.name || tutor.email}
                    </Text>
                    {tutor.rating > 0 && (
                      <View style={styles.ratingContainer}>
                        <Text style={styles.ratingText}>⭐ {tutor.rating.toFixed(1)}</Text>
                        {tutor.totalSessions > 0 && (
                          <Text style={styles.sessionsText}>
                            ({tutor.totalSessions} sessions)
                          </Text>
                        )}
                      </View>
                    )}
                    {tutor.hourlyRate && (
                      <Text style={styles.rateText}>
                        ${tutor.hourlyRate}/hour
                      </Text>
                    )}
                  </View>
                </View>
                {tutor.subjects.length > 0 && (
                  <View style={styles.subjectsContainer}>
                    <Text style={styles.subjectsLabel}>Subjects:</Text>
                    <Text style={styles.subjectsText}>
                      {getSubjectNames(tutor.subjects)}
                    </Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.bookButton}
                  onPress={() => {
                    router.push({
                      pathname: "/student/tutor-profile",
                      params: { tutorId: tutor.id },
                    });
                  }}
                >
                  <Text style={styles.bookButtonText}>View Profile</Text>
                </TouchableOpacity>
              </TouchableOpacity>
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
    marginTop: 12,
    fontSize: 16,
    color: "#666",
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
  },
  searchSection: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
  },
  filterButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  filtersPanel: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  ratingButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f7fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  ratingButtonActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  ratingButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  ratingButtonTextActive: {
    color: "#fff",
  },
  priceButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  priceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f7fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  priceButtonActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  priceButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  priceButtonTextActive: {
    color: "#fff",
  },
  filterSection: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subjectFilter: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f7fa",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  filterChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  tutorsList: {
    flex: 1,
  },
  tutorsContent: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    fontWeight: "600",
  },
  tutorCard: {
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
  tutorHeader: {
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
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  rateText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
    marginTop: 4,
  },
  ratingContainer: {
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
  subjectsContainer: {
    marginBottom: 12,
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
    paddingVertical: 12,
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
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});



