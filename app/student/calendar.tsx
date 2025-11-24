import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { bookingService, Booking } from "@/services/bookingService";
import { SUBJECTS } from "@/constants/subjects";
import Card from "@/components/ui/Card";

export default function CalendarScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const studentBookings = await bookingService.getStudentBookings();
      setBookings(studentBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentMonth);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (day === null) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasBookings = (day: number | null) => {
    if (day === null) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return getBookingsForDate(date).length > 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const selectedDateBookings = getBookingsForDate(selectedDate);
  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <Card style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth("prev")}
          >
            <Text style={styles.monthNavText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthName}>{monthName}</Text>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => navigateMonth("next")}
          >
            <Text style={styles.monthNavText}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Text key={day} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day === null && styles.dayCellEmpty,
                isToday(day) && styles.dayCellToday,
                isSelected(day) && styles.dayCellSelected,
                hasBookings(day) && styles.dayCellHasBookings,
              ]}
              onPress={() => {
                if (day !== null) {
                  setSelectedDate(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day
                    )
                  );
                }
              }}
              disabled={day === null}
            >
              {day !== null && (
                <>
                  <Text
                    style={[
                      styles.dayText,
                      isToday(day) && styles.dayTextToday,
                      isSelected(day) && styles.dayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasBookings(day) && (
                    <View style={styles.bookingDot} />
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.bookingsCard}>
        <Text style={styles.sectionTitle}>
          Sessions on {selectedDate.toLocaleDateString()}
        </Text>
        {selectedDateBookings.length === 0 ? (
          <Text style={styles.noBookings}>No sessions scheduled</Text>
        ) : (
          selectedDateBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingItem}
              onPress={() => router.push("/student/sessions")}
            >
              <View style={styles.bookingTime}>
                <Text style={styles.bookingTimeText}>
                  {booking.startTime} - {booking.endTime}
                </Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingSubject}>
                  {SUBJECTS.find((s) => s.id === booking.subject)?.name ||
                    booking.subject}
                </Text>
                <Text style={styles.bookingStatus}>
                  {booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>
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
  calendarCard: {
    margin: 16,
    marginTop: 0,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthNavText: {
    fontSize: 20,
    color: "#6366f1",
    fontWeight: "bold",
  },
  monthName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
  },
  dayCellEmpty: {
    borderWidth: 0,
  },
  dayCellToday: {
    backgroundColor: "#f0f0ff",
  },
  dayCellSelected: {
    backgroundColor: "#6366f1",
  },
  dayCellHasBookings: {
    borderColor: "#10b981",
  },
  dayText: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  dayTextToday: {
    fontWeight: "bold",
    color: "#6366f1",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  bookingDot: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10b981",
  },
  bookingsCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  noBookings: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  bookingItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f5f7fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  bookingTime: {
    width: 100,
  },
  bookingTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
  bookingInfo: {
    flex: 1,
  },
  bookingSubject: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  bookingStatus: {
    fontSize: 12,
    color: "#666",
  },
});





