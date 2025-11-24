import { auth, db } from "@/firebaseConfig";
import { getFirebaseErrorMessage } from "@/utils/firebaseErrors";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  const handleLogin = async () => {
    // Reset error flag
    setHasShownError(false);

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
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

    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Authentication service is not initialized. Please restart the app.");
      }

      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Get user role from Firestore with shorter timeout (10 seconds)
      let userDoc;
      try {
        userDoc = await Promise.race([
          getDoc(doc(db, "users", user.uid)),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timeout")), 10000)
          ),
        ]) as any;
      } catch {
        // If timeout, try to navigate anyway with default role
        // User can complete profile later
        console.warn("Firestore timeout, navigating with default role");
        setLoading(false);
        router.replace("/student/dashboard");
        return;
      }
      
      if (!userDoc.exists()) {
        if (!hasShownError) {
          setHasShownError(true);
          Alert.alert("Error", "User role not found. Please register again.");
        }
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const role = userData?.role;

      // Navigate immediately - don't wait
      setLoading(false);
      
      // Redirect based on role
      if (role === "student") {
        router.replace("/student/dashboard");
      } else if (role === "tutor") {
        router.replace("/tutor/dashboard");
      } else if (role === "parent") {
        router.replace("/parent/dashboard");
      } else if (role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        // Default to student dashboard if role is invalid
        router.replace("/student/dashboard");
      }
    } catch (error: any) {
      // Only show alert if we haven't shown one already
      if (!hasShownError) {
        setHasShownError(true);
        console.error("Login error details:", {
          code: error?.code,
          message: error?.message,
        });
        const message = getFirebaseErrorMessage(error);
        Alert.alert("Login Error", message);
      }
      setLoading(false);
    }
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
            <Text style={styles.title}>Smart Tutor Connect</Text>
            <Text style={styles.subtitle}>Welcome back! Please login to continue</Text>
          </View>

          <View style={styles.form}>
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
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/register")}
              disabled={loading}
              style={styles.linkContainer}
            >
              <Text style={styles.link}>
                Don&apos;t have an account? <Text style={styles.linkBold}>Register</Text>
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
    marginBottom: 40,
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
