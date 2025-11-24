import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import { userService, TutorProfile } from "@/services/userService";
import { searchService } from "@/services/searchService";
import { SUBJECTS } from "@/constants/subjects";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function SearchTutorsScreen() {
  const router = useRouter();
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTutors();
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many calls
    const timer = setTimeout(() => {
      filterTutors();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSubject, minRating, maxPrice]);

  const loadTutors = async () => {
    try {
      setLoading(true);
      const tutorsList = await userService.getAllTutors();
      setTutors(tutorsList);
      setFilteredTutors(tutorsList);
    } catch (error) {
      Alert.alert("Error", "Failed to load tutors");
    } finally {
      setLoading(false);
    }
  };

  const filterTutors = async () => {
    try {
      setLoading(true);
      
      // If no filters and no search, show all tutors
      if (!searchQuery.trim() && !selectedSubject && minRating === null && maxPrice === null) {
        setFilteredTutors(tutors);
        setLoading(false);
        return;
      }

      // Use search service for better results
      const results = await searchService.searchTutors({
        query: searchQuery.trim() || undefined,
        subjectId: selectedSubject || undefined,
        minRating: minRating || undefined,
        maxPrice: maxPrice || undefined,
      });

      // Sort by relevance if there's a search query
      const sorted = searchService.sortByRelevance(
        results,
        searchQuery.trim() || undefined
      );
      setFilteredTutors(sorted);
    } catch (error) {
      console.error("Error filtering tutors:", error);
      // Fallback to client-side filtering
      let filtered = [...tutors];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((tutor) => {
          const nameMatch = tutor.name?.toLowerCase().includes(query);
          const emailMatch = tutor.email.toLowerCase().includes(query);
          const bioMatch = tutor.bio?.toLowerCase().includes(query);
          const qualificationMatch = tutor.qualifications?.some((qual) =>
            qual.toLowerCase().includes(query)
          );
          const subjectMatch = tutor.subjects.some((subj) => {
            const subject = SUBJECTS.find((s) => s.id === subj);
            return subject?.name.toLowerCase().includes(query);
          });
          return nameMatch || emailMatch || bioMatch || qualificationMatch || subjectMatch;
        });
      }

      if (selectedSubject) {
        filtered = filtered.filter((tutor) =>
          tutor.subjects.includes(selectedSubject)
        );
      }

      if (minRating !== null && minRating > 0) {
        filtered = filtered.filter(
          (tutor) => (tutor.rating || 0) >= minRating
        );
      }

      if (maxPrice !== null && maxPrice > 0) {
        filtered = filtered.filter(
          (tutor) => !tutor.hourlyRate || tutor.hourlyRate <= maxPrice
        );
      }

      setFilteredTutors(filtered);
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search Tutors</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, subject, qualifications..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Subject:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    All
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
                        selectedSubject === subject.id &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {subject.icon} {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.resultsCount}>
          {filteredTutors.length} tutor{filteredTutors.length !== 1 ? "s" : ""} found
        </Text>
        {filteredTutors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍🏫</Text>
            <Text style={styles.emptyText}>No tutors found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filteredTutors.map((tutor) => (
            <Card key={tutor.uid} style={styles.tutorCard}>
              <View style={styles.tutorHeader}>
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{tutor.name}</Text>
                  {tutor.rating && (
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingText}>
                        ⭐ {tutor.rating.toFixed(1)}
                      </Text>
                      {tutor.totalReviews && (
                        <Text style={styles.reviewCount}>
                          ({tutor.totalReviews} reviews)
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

              {tutor.bio && (
                <Text style={styles.bio} numberOfLines={2}>
                  {tutor.bio}
                </Text>
              )}

              {tutor.qualifications && tutor.qualifications.length > 0 && (
                <View style={styles.qualificationsContainer}>
                  <Text style={styles.qualificationsLabel}>Qualifications:</Text>
                  <Text style={styles.qualificationsText} numberOfLines={2}>
                    {tutor.qualifications.join(", ")}
                  </Text>
                </View>
              )}

              {tutor.subjects && tutor.subjects.length > 0 && (
                <View style={styles.subjectsContainer}>
                  <Text style={styles.subjectsLabel}>Subjects:</Text>
                  <Text style={styles.subjectsText}>
                    {getSubjectNames(tutor.subjects)}
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  title="View Profile"
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
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 20,
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
  filterChip: {
    paddingHorizontal: 12,
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
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    fontWeight: "600",
  },
  tutorCard: {
    marginBottom: 16,
  },
  tutorHeader: {
    marginBottom: 12,
  },
  tutorInfo: {
    marginBottom: 8,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#f59e0b",
    fontWeight: "600",
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 12,
    color: "#666",
  },
  rateText: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  qualificationsContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  qualificationsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  qualificationsText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

