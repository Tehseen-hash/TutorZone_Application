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
import { userService, TutorProfile } from "@/services/userService";
import { bookingService } from "@/services/bookingService";
import { auth } from "@/firebaseConfig";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { SUBJECTS } from "@/constants/subjects";

export default function BookSessionScreen() {
  const router = useRouter();
  const { tutorId } = useLocalSearchParams<{ tutorId: string }>();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (tutorId) {
      loadTutor();
    }
  }, [tutorId]);

  const loadTutor = async () => {
    try {
      setLoading(true);
      const tutorProfile = await userService.getTutorProfile(tutorId!);
      if (tutorProfile) {
        setTutor(tutorProfile);
        if (tutorProfile.subjects.length > 0) {
          setSelectedSubject(tutorProfile.subjects[0]);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load tutor information");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!auth.currentUser || !tutor) return;

    if (!selectedSubject) {
      Alert.alert("Error", "Please select a subject");
      return;
    }

    if (!date) {
      Alert.alert("Error", "Please select a date");
      return;
    }

    if (!startTime) {
      Alert.alert("Error", "Please select a start time");
      return;
    }

    // Calculate end time
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

    // Calculate price
    const price = ((tutor.hourlyRate || 0) * duration) / 60;

    try {
      setBooking(true);
      await bookingService.createBooking({
        studentId: auth.currentUser.uid,
        tutorId: tutor.uid,
        subject: selectedSubject,
        date: startDate,
        startTime,
        endTime,
        duration,
        price,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        "Success",
        "Session booked successfully! The tutor will confirm your booking.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to book session. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const getSubjectName = (subjectId: string) => {
    return SUBJECTS.find((s) => s.id === subjectId)?.name || subjectId;
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
        <Text style={styles.title}>Book Session</Text>
      </View>

      <Card style={styles.section}>
        <View style={styles.tutorInfoHeader}>
          <View style={styles.tutorInfoText}>
            <Text style={styles.tutorName}>With {tutor.name}</Text>
            {tutor.hourlyRate && (
              <Text style={styles.rate}>${tutor.hourlyRate}/hour</Text>
            )}
          </View>
          <Button
            title="💬 Chat First"
            onPress={() => {
              router.push({
                pathname: "/student/chat",
                params: { userId: tutor.uid },
              });
            }}
            variant="outline"
            size="small"
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Subject</Text>
        <View style={styles.subjectsContainer}>
          {tutor.subjects.map((subjectId) => (
            <TouchableOpacity
              key={subjectId}
              style={[
                styles.subjectChip,
                selectedSubject === subjectId && styles.subjectChipSelected,
              ]}
              onPress={() => setSelectedSubject(subjectId)}
            >
              <Text
                style={[
                  styles.subjectText,
                  selectedSubject === subjectId && styles.subjectTextSelected,
                ]}
              >
                {getSubjectName(subjectId)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />
        <Input
          label="Start Time"
          placeholder="HH:MM (24-hour format)"
          value={startTime}
          onChangeText={setStartTime}
        />
        <View style={styles.durationContainer}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <View style={styles.durationButtons}>
            {[30, 60, 90, 120].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationButton,
                  duration === mins && styles.durationButtonSelected,
                ]}
                onPress={() => setDuration(mins)}
              >
                <Text
                  style={[
                    styles.durationText,
                    duration === mins && styles.durationTextSelected,
                  ]}
                >
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {tutor.hourlyRate && duration && (
          <Text style={styles.priceText}>
            Total: ${((tutor.hourlyRate * duration) / 60).toFixed(2)}
          </Text>
        )}
      </Card>

      <Card style={styles.section}>
        <Input
          label="Notes (Optional)"
          placeholder="Any special requests or topics to cover..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title="Book Session"
          onPress={handleBook}
          loading={booking}
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
  tutorInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tutorInfoText: {
    flex: 1,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  rate: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  subjectsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectChip: {
    backgroundColor: "#f5f7fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subjectChipSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  subjectText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  subjectTextSelected: {
    color: "#fff",
  },
  durationContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  durationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  durationButton: {
    backgroundColor: "#f5f7fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  durationButtonSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  durationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  durationTextSelected: {
    color: "#fff",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6366f1",
    marginTop: 16,
  },
  buttonContainer: {
    padding: 16,
  },
});

