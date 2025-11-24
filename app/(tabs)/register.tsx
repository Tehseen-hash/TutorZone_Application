import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { auth, db } from "@/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrors";
import { SUBJECTS, SUBJECT_CATEGORIES } from "@/constants/subjects";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // default role
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showSubjects, setShowSubjects] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert("Error", "Please enter a valid name (at least 2 characters)");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    // Validate tutor subjects
    if (role === "tutor" && selectedSubjects.length === 0) {
      Alert.alert("Error", "Please select at least one subject you can tutor");
      return;
    }

    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Authentication service is not initialized. Please restart the app.");
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Store user role in Firestore (don't wait for completion to navigate)
      const userData: any = {
        name: name.trim(),
        email: email.trim(),
        role,
        createdAt: new Date(),
      };

      // Add subjects for tutors
      if (role === "tutor" && selectedSubjects.length > 0) {
        userData.subjects = selectedSubjects;
        userData.isProfileComplete = true;
      }

      const setDocPromise = setDoc(doc(db, "users", user.uid), userData);

      // Navigate immediately - Firestore write will complete in background
      setLoading(false);
      
      // Start navigation while Firestore write happens
      if (role === "student") {
        router.replace("/student/dashboard");
      } else if (role === "tutor") {
        router.replace("/tutor/dashboard");
      } else if (role === "parent") {
        router.replace("/parent/dashboard");
      } else {
        router.replace("/login");
      }

      // Complete Firestore write in background (fire and forget for better UX)
      setDocPromise.catch((error) => {
        console.error("Background Firestore write error:", error);
      });
    } catch (error: any) {
      console.error("Registration error details:", {
        code: error?.code,
        message: error?.message,
        error: error,
      });
      const message = getFirebaseErrorMessage(error);
      Alert.alert("Registration Error", message);
      setLoading(false);
    }
  };

  const roleIcons: { [key: string]: string } = {
    student: "🎓",
    tutor: "👨‍🏫",
    parent: "👨‍👩‍👧",
  };

  const roleDescriptions: { [key: string]: string } = {
    student: "Find tutors and book sessions",
    tutor: "Offer tutoring services",
    parent: "Track your child's progress",
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>📚</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Smart Tutor Connect today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
      />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
                placeholder="Create a password (min. 6 characters)"
                placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
      />
            </View>

            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>I am a:</Text>
      <View style={styles.roleContainer}>
        {["student", "tutor", "parent"].map((r) => (
          <TouchableOpacity
            key={r}
                    style={[
                      styles.roleButton,
                      role === r && styles.selectedRole,
                      loading && styles.roleButtonDisabled,
                    ]}
                    onPress={() => {
                      if (!loading) {
                        setRole(r);
                        if (r === "tutor") {
                          setShowSubjects(true);
                        } else {
                          setShowSubjects(false);
                          setSelectedSubjects([]);
                        }
                      }
                    }}
                    disabled={loading}
          >
                    <Text style={styles.roleIcon}>{roleIcons[r]}</Text>
                    <Text
                      style={[
                        styles.roleText,
                        role === r && styles.selectedRoleText,
                      ]}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                    <Text style={styles.roleDescription}>
                      {roleDescriptions[r]}
                    </Text>
          </TouchableOpacity>
        ))}
              </View>
      </View>

            {/* Subject Selection for Tutors */}
            {role === "tutor" && showSubjects && (
              <View style={styles.subjectsSection}>
                <Text style={styles.subjectsLabel}>
                  Select subjects you can tutor: *
                </Text>
                <Text style={styles.subjectsHint}>
                  {selectedSubjects.length > 0
                    ? `${selectedSubjects.length} subject(s) selected`
                    : "Select at least one subject"}
                </Text>
                <ScrollView
                  style={styles.subjectsScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {SUBJECT_CATEGORIES.map((category) => {
                    const categorySubjects = SUBJECTS.filter(
                      (s) => s.category === category
                    );
                    return (
                      <View key={category} style={styles.categorySection}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <View style={styles.subjectsGrid}>
                          {categorySubjects.map((subject) => {
                            const isSelected = selectedSubjects.includes(
                              subject.id
                            );
                            return (
                              <TouchableOpacity
                                key={subject.id}
                                style={[
                                  styles.subjectChip,
                                  isSelected && styles.subjectChipSelected,
                                ]}
                                onPress={() => {
                                  if (isSelected) {
                                    setSelectedSubjects(
                                      selectedSubjects.filter(
                                        (id) => id !== subject.id
                                      )
                                    );
                                  } else {
                                    setSelectedSubjects([
                                      ...selectedSubjects,
                                      subject.id,
                                    ]);
                                  }
                                }}
                                disabled={loading}
                              >
                                <Text style={styles.subjectIcon}>
                                  {subject.icon}
                                </Text>
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
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
      </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/login")}
              disabled={loading}
              style={styles.linkContainer}
            >
              <Text style={styles.link}>
                Already have an account? <Text style={styles.linkBold}>Login</Text>
              </Text>
      </TouchableOpacity>
    </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleSection: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedRole: {
    borderColor: "#6366f1",
    backgroundColor: "#f0f0ff",
  },
  roleButtonDisabled: {
    opacity: 0.5,
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  selectedRoleText: {
    color: "#6366f1",
  },
  roleDescription: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  subjectsSection: {
    marginBottom: 24,
    maxHeight: 300,
  },
  subjectsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  subjectsHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  subjectsScroll: {
    maxHeight: 250,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  subjectsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
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
  button: {
    backgroundColor: "#6366f1",
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  linkContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  link: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
  },
  linkBold: {
    color: "#6366f1",
    fontWeight: "600",
  },
});
