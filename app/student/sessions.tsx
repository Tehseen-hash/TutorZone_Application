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
import { bookingService, Booking } from "@/services/bookingService";
import { userService } from "@/services/userService";
import { SUBJECTS } from "@/constants/subjects";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function SessionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed">("all");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const studentBookings = await bookingService.getStudentBookings();
      setBookings(studentBookings);
    } catch (error) {
      Alert.alert("Error", "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    Alert.alert(
      "Cancel Session",
      "Are you sure you want to cancel this session?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await bookingService.cancelBooking(bookingId);
              loadBookings();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel session");
            }
          },
        },
      ]
    );
  };

  const getSubjectName = (subjectId: string) => {
    return SUBJECTS.find((s) => s.id === subjectId)?.name || subjectId;
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "completed":
        return "#6366f1";
      case "cancelled":
        return "#ef4444";
      default:
        return "#666";
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

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
        <Text style={styles.title}>My Sessions</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(["all", "pending", "confirmed", "completed"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>
              {bookings.length === 0
                ? "No sessions booked yet"
                : `No ${filter} sessions`}
            </Text>
            {bookings.length === 0 && (
              <Button
                title="Find Tutors"
                onPress={() => router.push("/student/tutors")}
                style={styles.emptyButton}
              />
            )}
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.subjectName}>
                    {getSubjectName(booking.subject)}
                  </Text>
                  <Text style={styles.bookingDate}>
                    {booking.date.toLocaleDateString()} at {booking.startTime}
                  </Text>
                  <Text style={styles.bookingDuration}>
                    Duration: {booking.duration} minutes
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <Text style={styles.price}>${booking.price.toFixed(2)}</Text>
                {booking.notes && (
                  <Text style={styles.notes}>{booking.notes}</Text>
                )}
              </View>

              {booking.status === "pending" && (
                <View style={styles.actions}>
                  <Button
                    title="Cancel"
                    onPress={() => handleCancel(booking.id!)}
                    variant="outline"
                    size="small"
                  />
                </View>
              )}

              {booking.status === "confirmed" && (
                <View style={styles.actions}>
                  <Text style={styles.confirmedText}>
                    ✅ Session confirmed! See you soon.
                  </Text>
                </View>
              )}

              {booking.status === "completed" && (
                <View style={styles.actions}>
                  <Button
                    title="Write Review"
                    onPress={() => {
                      router.push({
                        pathname: "/student/review",
                        params: {
                          bookingId: booking.id!,
                          tutorId: booking.tutorId,
                        },
                      });
                    }}
                    size="small"
                  />
                </View>
              )}
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
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f7fa",
    marginLeft: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  bookingCard: {
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  bookingDuration: {
    fontSize: 12,
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bookingDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  actions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  confirmedText: {
    fontSize: 14,
    color: "#10b981",
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
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});

