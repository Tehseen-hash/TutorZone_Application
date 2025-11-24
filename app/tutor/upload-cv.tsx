import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { userService } from "@/services/userService";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function UploadCVScreen() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      // For now, we'll use a text input approach or image picker
      // In production, install expo-document-picker: npx expo install expo-document-picker
      Alert.alert(
        "CV Upload",
        "Please enter the URL of your CV/Resume (uploaded to a file sharing service) or we'll add file picker support soon.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enter URL",
            onPress: () => {
              Alert.prompt(
                "CV URL",
                "Enter the URL of your CV/Resume:",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Submit",
                    onPress: async (url) => {
                      if (url && url.trim()) {
                        await uploadCV(url.trim());
                      }
                    },
                  },
                ],
                "plain-text"
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadCV = async (cvUrlInput: string) => {
    if (!auth.currentUser) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      setUploading(true);
      setFileName("CV Document");

      // Update user profile with CV URL
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        cvUrl: cvUrlInput,
        applicationStatus: "pending", // Set to pending for admin review
      });

      setCvUrl(cvUrlInput);
      Alert.alert(
        "Success",
        "CV URL saved successfully! Waiting for admin approval."
      );
    } catch (error: any) {
      console.error("Error uploading CV:", error);
      Alert.alert("Error", error.message || "Failed to save CV URL");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upload CV</Text>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>CV Upload</Text>
        <Text style={styles.description}>
          Upload your CV/Resume for admin review. Accepted formats: PDF, DOC, DOCX
        </Text>

        {fileName && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>📄 {fileName}</Text>
            {cvUrl && (
              <Text style={styles.uploadStatus}>✅ Uploaded successfully</Text>
            )}
          </View>
        )}

        <Button
          title={uploading ? "Uploading..." : cvUrl ? "Upload New CV" : "Select CV File"}
          onPress={pickDocument}
          loading={uploading}
          disabled={uploading}
          size="large"
          style={styles.uploadButton}
        />

        {cvUrl && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Status: Pending Review</Text>
            <Text style={styles.statusText}>
              Your CV has been submitted and is awaiting admin approval. You will be notified once it's reviewed.
            </Text>
          </View>
        )}
      </Card>
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
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  fileInfo: {
    backgroundColor: "#f5f7fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  fileName: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  uploadStatus: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
  uploadButton: {
    marginTop: 8,
  },
  statusCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f0f0ff",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

