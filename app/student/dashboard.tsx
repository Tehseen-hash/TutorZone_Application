import { auth, db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { bookingService } from "@/services/bookingService";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function StudentDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [activeSessions, setActiveSessions] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserEmail(userDoc.data().email || auth.currentUser.email || "");
          } else {
            setUserEmail(auth.currentUser.email || "");
          }

          // Fetch booking statistics
          const bookings = await bookingService.getStudentBookings();
          setTotalSessions(bookings.length);
          const active = bookings.filter(
            (b) => b.status === "pending" || b.status === "confirmed"
          ).length;
          setActiveSessions(active);
        } catch (error) {
          setUserEmail(auth.currentUser.email || "");
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut(auth);
            router.replace("/login");
          } catch (error: any) {
            Alert.alert("Error", "Failed to logout. Please try again.");
            setSigningOut(false);
          }
        },
      },
    ]);
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
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🎓</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.email}>{userEmail}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search & Find Tutors</Text>
        <View style={styles.searchCard}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push("/student/search-tutors")}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <View style={styles.searchTextContainer}>
              <Text style={styles.searchTitle}>Search Tutors</Text>
              <Text style={styles.searchDescription}>
                Find tutors by name, subject, qualifications, or keywords
              </Text>
            </View>
            <Text style={styles.searchArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.cardGrid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/student/tutors")}
          >
            <Text style={styles.cardIcon}>👨‍🏫</Text>
            <Text style={styles.cardTitle}>Browse Tutors</Text>
            <Text style={styles.cardDescription}>
              View all available tutors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/student/view-qualifications")}
          >
            <Text style={styles.cardIcon}>🎓</Text>
            <Text style={styles.cardTitle}>Qualifications</Text>
            <Text style={styles.cardDescription}>
              View tutor qualifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push("/student/sessions")}
          >
            <Text style={styles.cardIcon}>📅</Text>
            <Text style={styles.cardTitle}>My Sessions</Text>
            <Text style={styles.cardDescription}>
              View your booked sessions
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeSessions}</Text>
            <Text style={styles.statLabel}>Active Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push("/student/library")}
          >
            <Text style={styles.quickAccessIcon}>📚</Text>
            <Text style={styles.quickAccessText}>E-Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push("/student/map")}
          >
            <Text style={styles.quickAccessIcon}>🗺️</Text>
            <Text style={styles.quickAccessText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push("/student/calendar")}
          >
            <Text style={styles.quickAccessIcon}>📅</Text>
            <Text style={styles.quickAccessText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push("/student/messages")}
          >
            <Text style={styles.quickAccessIcon}>💬</Text>
            <Text style={styles.quickAccessText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => router.push("/student/recommendations")}
          >
            <Text style={styles.quickAccessIcon}>🤖</Text>
            <Text style={styles.quickAccessText}>AI Recommendations</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  cardGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  quickAccessGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickAccessIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
  },
  searchCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  searchDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  searchArrow: {
    fontSize: 24,
    color: "#6366f1",
    marginLeft: 8,
  },
});
