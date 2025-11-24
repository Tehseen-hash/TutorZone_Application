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
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { adminService, TutorApplication } from "@/services/adminService";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<TutorApplication[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    checkAdminAccess();
    loadApplications();
  }, [filter]);
  

  const checkAdminAccess = async () => {
    const isAdmin = await adminService.isAdmin();
    if (!isAdmin) {
      Alert.alert("Access Denied", "Admin access required", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const allApps = await adminService.getAllApplications();
      
      let filtered = allApps;
      if (filter !== "all") {
        filtered = allApps.filter((app) => app.status === filter);
      }
      
      setApplications(filtered);
    } catch (error) {
      Alert.alert("Error", "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tutorId: string) => {
    Alert.prompt(
      "Approve Application",
      "Add notes (optional):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async (notes) => {
            try {
              await adminService.approveApplication(tutorId, notes || undefined);
              Alert.alert("Success", "Application approved");
              loadApplications();
            } catch (error) {
              Alert.alert("Error", "Failed to approve application");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleReject = async (tutorId: string) => {
    Alert.prompt(
      "Reject Application",
      "Reason for rejection:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          onPress: async (notes) => {
            if (!notes || notes.trim().length === 0) {
              Alert.alert("Error", "Please provide a reason for rejection");
              return;
            }
            try {
              await adminService.rejectApplication(tutorId, notes);
              Alert.alert("Success", "Application rejected");
              loadApplications();
            } catch (error) {
              Alert.alert("Error", "Failed to reject application");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
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
          <Text style={styles.title}>Admin Dashboard</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Tutor Applications ({applications.length})
        </Text>

        {applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No applications found</Text>
          </View>
        ) : (
          applications.map((application) => (
            <Card key={application.tutorId} style={styles.applicationCard}>
              <View style={styles.applicationHeader}>
                <View style={styles.applicationInfo}>
                  <Text style={styles.tutorName}>{application.tutor.name}</Text>
                  <Text style={styles.tutorEmail}>{application.tutor.email}</Text>
                  <Text style={styles.submittedDate}>
                    Submitted: {application.submittedAt.toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        application.status === "approved"
                          ? "#10b981"
                          : application.status === "rejected"
                          ? "#ef4444"
                          : "#f59e0b",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {application.status.charAt(0).toUpperCase() +
                      application.status.slice(1)}
                  </Text>
                </View>
              </View>

              {application.tutor.bio && (
                <Text style={styles.bio} numberOfLines={3}>
                  {application.tutor.bio}
                </Text>
              )}

              {application.tutor.qualifications &&
                application.tutor.qualifications.length > 0 && (
                  <View style={styles.qualificationsSection}>
                    <Text style={styles.qualificationsLabel}>Qualifications:</Text>
                    {application.tutor.qualifications.map((qual, index) => (
                      <Text key={index} style={styles.qualification}>
                        • {qual}
                      </Text>
                    ))}
                  </View>
                )}

              {application.cvUrl && (
                <TouchableOpacity
                  style={styles.cvButton}
                  onPress={() => {
                    // Open CV URL
                    Alert.alert("CV", `CV URL: ${application.cvUrl}`);
                  }}
                >
                  <Text style={styles.cvButtonText}>📄 View CV</Text>
                </TouchableOpacity>
              )}

              {application.status === "pending" && (
                <View style={styles.actions}>
                  <Button
                    title="Approve"
                    onPress={() => handleApprove(application.tutorId)}
                    size="small"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Reject"
                    onPress={() => handleReject(application.tutorId)}
                    variant="danger"
                    size="small"
                    style={styles.actionButton}
                  />
                </View>
              )}

              {application.reviewNotes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Review Notes:</Text>
                  <Text style={styles.notesText}>{application.reviewNotes}</Text>
                </View>
              )}
            </Card>
          ))
        )}
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  filterSection: {
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
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  applicationCard: {
    marginBottom: 16,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  tutorEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  submittedDate: {
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
  bio: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  qualificationsSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  qualificationsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  qualification: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  cvButton: {
    backgroundColor: "#f0f0ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  cvButtonText: {
    color: "#6366f1",
    fontSize: 14,
    fontWeight: "600",
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
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    fontStyle: "italic",
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
  },
});





