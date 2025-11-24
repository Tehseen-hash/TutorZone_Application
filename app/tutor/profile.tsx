import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { userService, TutorProfile } from "@/services/userService";
import { SUBJECTS } from "@/constants/subjects";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function TutorProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<TutorProfile>>({
    bio: "",
    hourlyRate: 0,
    education: [],
    experience: "",
    qualifications: [],
    subjects: [],
    availability: {},
  });
  const [newQualification, setNewQualification] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const currentProfile = await userService.getCurrentUserProfile();
      if (currentProfile && currentProfile.role === "tutor") {
        const tutorProfile = await userService.getTutorProfile(currentProfile.uid);
        if (tutorProfile) {
          setProfile({
            bio: tutorProfile.bio || "",
            hourlyRate: tutorProfile.hourlyRate || 0,
            education: tutorProfile.education || [],
            experience: tutorProfile.experience || "",
            qualifications: tutorProfile.qualifications || [],
            subjects: tutorProfile.subjects || [],
            availability: tutorProfile.availability || {},
          });
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.bio || profile.bio.trim().length < 20) {
      Alert.alert("Error", "Please write a bio (at least 20 characters)");
      return;
    }

    if (!profile.hourlyRate || profile.hourlyRate <= 0) {
      Alert.alert("Error", "Please set an hourly rate");
      return;
    }

    if (profile.subjects?.length === 0) {
      Alert.alert("Error", "Please select at least one subject");
      return;
    }

    try {
      setSaving(true);
      await userService.updateTutorProfile(profile);
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    const currentSubjects = profile.subjects || [];
    if (currentSubjects.includes(subjectId)) {
      setProfile({
        ...profile,
        subjects: currentSubjects.filter((id) => id !== subjectId),
      });
    } else {
      setProfile({
        ...profile,
        subjects: [...currentSubjects, subjectId],
      });
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          placeholder="Tell students about yourself, your teaching style, and experience..."
          placeholderTextColor="#999"
          value={profile.bio}
          onChangeText={(text) => setProfile({ ...profile, bio: text })}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          {profile.bio?.length || 0}/500 characters
        </Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Hourly Rate ($)</Text>
        <Input
          placeholder="Enter your hourly rate"
          keyboardType="numeric"
          value={profile.hourlyRate?.toString() || ""}
          onChangeText={(text) =>
            setProfile({ ...profile, hourlyRate: parseFloat(text) || 0 })
          }
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <TextInput
          style={styles.bioInput}
          placeholder="Describe your teaching experience and achievements..."
          placeholderTextColor="#999"
          value={profile.experience}
          onChangeText={(text) => setProfile({ ...profile, experience: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Qualifications</Text>
        <Text style={styles.hint}>
          Add your degrees, certifications, and credentials
        </Text>
        <View style={styles.qualificationInputContainer}>
          <TextInput
            style={styles.qualificationInput}
            placeholder="e.g., Bachelor's in Mathematics, Teaching Certificate..."
            placeholderTextColor="#999"
            value={newQualification}
            onChangeText={setNewQualification}
            onSubmitEditing={() => {
              if (newQualification.trim()) {
                setProfile({
                  ...profile,
                  qualifications: [
                    ...(profile.qualifications || []),
                    newQualification.trim(),
                  ],
                });
                setNewQualification("");
              }
            }}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (newQualification.trim()) {
                setProfile({
                  ...profile,
                  qualifications: [
                    ...(profile.qualifications || []),
                    newQualification.trim(),
                  ],
                });
                setNewQualification("");
              }
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        {profile.qualifications && profile.qualifications.length > 0 && (
          <View style={styles.qualificationsList}>
            {profile.qualifications.map((qual, index) => (
              <View key={index} style={styles.qualificationItem}>
                <Text style={styles.qualificationText}>{qual}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setProfile({
                      ...profile,
                      qualifications: profile.qualifications?.filter(
                        (_, i) => i !== index
                      ),
                    });
                  }}
                >
                  <Text style={styles.removeButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <Text style={styles.hint}>Select subjects you can tutor</Text>
        <View style={styles.subjectsGrid}>
          {SUBJECTS.map((subject) => {
            const isSelected = profile.subjects?.includes(subject.id);
            return (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectChip,
                  isSelected && styles.subjectChipSelected,
                ]}
                onPress={() => toggleSubject(subject.id)}
              >
                <Text style={styles.subjectIcon}>{subject.icon}</Text>
                <Text
                  style={[
                    styles.subjectName,
                    isSelected && styles.subjectNameSelected,
                  ]}
                >
                  {subject.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title="Save Profile"
          onPress={handleSave}
          loading={saving}
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
    backgroundColor: "#10b981",
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
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  bioInput: {
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  subjectsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectChipSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  subjectIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  subjectName: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  subjectNameSelected: {
    color: "#fff",
  },
  buttonContainer: {
    padding: 16,
    marginTop: 8,
  },
  qualificationInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  qualificationInput: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addButton: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  qualificationsList: {
    marginTop: 12,
    gap: 8,
  },
  qualificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    padding: 12,
    borderRadius: 8,
  },
  qualificationText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  removeButton: {
    fontSize: 24,
    color: "#ef4444",
    fontWeight: "bold",
    paddingHorizontal: 8,
  },
});

