import * as Location from "expo-location";
import { doc, updateDoc, getDoc, setDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/firebaseConfig";

// KPK Province boundaries (approximate)
export const KPK_BOUNDS = {
  north: 36.75,
  south: 31.0,
  east: 74.5,
  west: 69.0,
  center: {
    latitude: 34.0,
    longitude: 71.5,
  },
};

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  address?: string;
}

export interface LocationTracking {
  userId: string;
  location: UserLocation;
  isActive: boolean;
  lastUpdated: Date;
}

export const locationService = {
  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  },

  // Get current location
  async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Location permission not granted");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address from coordinates
      const address = await this.getAddressFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: new Date(),
        address,
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  },

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const parts = [
          addr.street,
          addr.district || addr.city,
          addr.region,
          addr.country,
        ].filter(Boolean);
        return parts.join(", ");
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error("Error getting address:", error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  },

  // Check if location is within KPK bounds
  isLocationInKPK(location: UserLocation): boolean {
    return (
      location.latitude >= KPK_BOUNDS.south &&
      location.latitude <= KPK_BOUNDS.north &&
      location.longitude >= KPK_BOUNDS.west &&
      location.longitude <= KPK_BOUNDS.east
    );
  },

  // Update user location in Firestore
  async updateUserLocation(location: UserLocation): Promise<void> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    // Verify location is in KPK
    if (!this.isLocationInKPK(location)) {
      throw new Error("Location is outside KPK province");
    }

    try {
      const locationRef = doc(db, "userLocations", auth.currentUser.uid);
      await setDoc(
        locationRef,
        {
          userId: auth.currentUser.uid,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address,
          timestamp: Timestamp.now(),
          lastUpdated: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating user location:", error);
      throw error;
    }
  },

  // Start live location tracking
  async startLocationTracking(
    interval: number = 30000 // 30 seconds default
  ): Promise<() => void> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Location permission not granted");
    }

    // Start watching position
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: interval,
        distanceInterval: 50, // Update every 50 meters
      },
      async (location) => {
        const userLocation: UserLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: new Date(),
        };

        // Get address
        userLocation.address = await this.getAddressFromCoordinates(
          userLocation.latitude,
          userLocation.longitude
        );

        // Update in Firestore
        try {
          await this.updateUserLocation(userLocation);
        } catch (error) {
          console.error("Error updating location:", error);
        }
      }
    );

    // Return cleanup function
    return () => {
      subscription.remove();
    };
  },

  // Get user location from Firestore
  async getUserLocation(userId: string): Promise<UserLocation | null> {
    try {
      const locationDoc = await getDoc(doc(db, "userLocations", userId));
      if (locationDoc.exists()) {
        const data = locationDoc.data();
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          timestamp: data.timestamp.toDate(),
          address: data.address,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user location:", error);
      return null;
    }
  },

  // Subscribe to user location updates (for parents tracking students)
  subscribeToUserLocation(
    userId: string,
    callback: (location: UserLocation | null) => void
  ): () => void {
    const locationRef = doc(db, "userLocations", userId);

    return onSnapshot(
      locationRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            timestamp: data.timestamp.toDate(),
            address: data.address,
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error subscribing to location:", error);
        callback(null);
      }
    );
  },

  // Get all tutors in KPK
  async getTutorsInKPK(): Promise<Array<{ tutorId: string; location: UserLocation }>> {
    try {
      const { collection, getDocs, query, where } = await import("firebase/firestore");
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor")
      );
      const usersSnapshot = await getDocs(usersQuery);

      const tutorsWithLocations: Array<{ tutorId: string; location: UserLocation }> = [];

      for (const userDoc of usersSnapshot.docs) {
        const location = await this.getUserLocation(userDoc.id);
        if (location && this.isLocationInKPK(location)) {
          tutorsWithLocations.push({
            tutorId: userDoc.id,
            location,
          });
        }
      }

      return tutorsWithLocations;
    } catch (error) {
      console.error("Error getting tutors in KPK:", error);
      return [];
    }
  },
};





