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
import { bookingService, Booking } from "@/services/bookingService";
import { paymentService } from "@/services/paymentService";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const bookingData = await bookingService.getBooking(bookingId!);
      if (bookingData) {
        setBooking(bookingData);
      } else {
        Alert.alert("Error", "Booking not found", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !bookingId) return;

    Alert.alert(
      "Confirm Payment",
      `Pay $${booking.price.toFixed(2)} for this session?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: async () => {
            try {
              setProcessing(true);
              const result = await paymentService.processPayment(
                bookingId,
                booking.price,
                paymentMethod
              );

              if (result.success) {
                Alert.alert(
                  "Payment Successful",
                  `Transaction ID: ${result.transactionId}`,
                  [
                    {
                      text: "OK",
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert("Payment Failed", result.error || "Please try again");
              }
            } catch (error) {
              Alert.alert("Error", "Payment processing failed");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {booking.date.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>
            {booking.startTime} - {booking.endTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{booking.duration} minutes</Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity
          style={[
            styles.paymentMethod,
            paymentMethod === "stripe" && styles.paymentMethodSelected,
          ]}
          onPress={() => setPaymentMethod("stripe")}
        >
          <Text style={styles.paymentMethodIcon}>💳</Text>
          <Text style={styles.paymentMethodText}>Credit/Debit Card (Stripe)</Text>
          {paymentMethod === "stripe" && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.paymentMethod,
            paymentMethod === "paypal" && styles.paymentMethodSelected,
          ]}
          onPress={() => setPaymentMethod("paypal")}
        >
          <Text style={styles.paymentMethodIcon}>🅿️</Text>
          <Text style={styles.paymentMethodText}>PayPal</Text>
          {paymentMethod === "paypal" && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      </Card>

      <Card style={styles.section}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${booking.price.toFixed(2)}</Text>
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title={processing ? "Processing..." : "Pay Now"}
          onPress={handlePayment}
          loading={processing}
          size="large"
          disabled={processing}
        />
      </View>

      <Text style={styles.securityNote}>
        🔒 Your payment information is secure and encrypted
      </Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  paymentMethodSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#f0f0ff",
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  checkmark: {
    fontSize: 20,
    color: "#6366f1",
    fontWeight: "bold",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366f1",
  },
  buttonContainer: {
    padding: 16,
  },
  securityNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    paddingHorizontal: 16,
  },
});





