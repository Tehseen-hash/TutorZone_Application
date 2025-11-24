import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { TutorProfile } from "./userService";
import { SUBJECTS } from "@/constants/subjects";

export interface SearchFilters {
  query?: string;
  subjectId?: string;
  minRating?: number;
  maxPrice?: number;
  hasQualifications?: boolean;
}

export interface SearchResult {
  tutor: TutorProfile;
  relevanceScore?: number;
}

export const searchService = {
  // Advanced search with multiple filters
  async searchTutors(filters: SearchFilters): Promise<TutorProfile[]> {
    try {
      // Start with base query for tutors (only approved)
      let tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor"),
        where("applicationStatus", "==", "approved")
      );

      // Apply subject filter if provided
      if (filters.subjectId) {
        tutorsQuery = query(
          tutorsQuery,
          where("subjects", "array-contains", filters.subjectId)
        );
      }

      const querySnapshot = await getDocs(tutorsQuery);
      const tutors: TutorProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tutors.push({
          uid: doc.id,
          ...data,
        } as TutorProfile);
      });

      // Apply client-side filters
      let filtered = tutors;

      // Filter by search query
      if (filters.query && filters.query.trim()) {
        const query = filters.query.toLowerCase();
        filtered = filtered.filter((tutor) => {
          const nameMatch = tutor.name?.toLowerCase().includes(query);
          const emailMatch = tutor.email.toLowerCase().includes(query);
          const bioMatch = tutor.bio?.toLowerCase().includes(query);
          const qualificationMatch = tutor.qualifications?.some((qual) =>
            qual.toLowerCase().includes(query)
          );
          const subjectMatch = tutor.subjects.some((subj) => {
            const subject = SUBJECTS.find((s) => s.id === subj);
            return subject?.name.toLowerCase().includes(query);
          });
          return nameMatch || emailMatch || bioMatch || qualificationMatch || subjectMatch;
        });
      }

      // Filter by minimum rating
      if (filters.minRating !== undefined && filters.minRating > 0) {
        filtered = filtered.filter(
          (tutor) => (tutor.rating || 0) >= filters.minRating!
        );
      }

      // Filter by maximum price
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
        filtered = filtered.filter(
          (tutor) => !tutor.hourlyRate || tutor.hourlyRate <= filters.maxPrice!
        );
      }

      // Filter by qualifications
      if (filters.hasQualifications) {
        filtered = filtered.filter(
          (tutor) =>
            tutor.qualifications && tutor.qualifications.length > 0
        );
      }

      return filtered;
    } catch (error) {
      console.error("Error searching tutors:", error);
      throw error;
    }
  },

  // Get tutors with qualifications
  async getTutorsWithQualifications(): Promise<TutorProfile[]> {
    try {
      const tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor")
      );

      const querySnapshot = await getDocs(tutorsQuery);
      const tutors: TutorProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.qualifications && data.qualifications.length > 0) {
          tutors.push({
            uid: doc.id,
            ...data,
          } as TutorProfile);
        }
      });

      return tutors;
    } catch (error) {
      console.error("Error fetching tutors with qualifications:", error);
      throw error;
    }
  },

  // Get tutors by subject with qualifications
  async getTutorsBySubjectWithQualifications(
    subjectId: string
  ): Promise<TutorProfile[]> {
    try {
      const tutorsQuery = query(
        collection(db, "users"),
        where("role", "==", "tutor"),
        where("subjects", "array-contains", subjectId)
      );

      const querySnapshot = await getDocs(tutorsQuery);
      const tutors: TutorProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.qualifications && data.qualifications.length > 0) {
          tutors.push({
            uid: doc.id,
            ...data,
          } as TutorProfile);
        }
      });

      return tutors;
    } catch (error) {
      console.error("Error fetching tutors by subject:", error);
      throw error;
    }
  },

  // Calculate relevance score for search results
  calculateRelevanceScore(
    tutor: TutorProfile,
    searchQuery: string
  ): number {
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      let score = 0;

      // Name match (highest weight)
      if (tutor.name?.toLowerCase().includes(query)) {
        score += 10;
      }

      // Subject match
      const subjectMatch = tutor.subjects.some((subj) => {
        const subject = SUBJECTS.find((s) => s.id === subj);
        return subject?.name.toLowerCase().includes(query);
      });
      if (subjectMatch) {
        score += 8;
      }

      // Qualification match
      const qualMatch = tutor.qualifications?.some((qual) =>
        qual.toLowerCase().includes(query)
      );
      if (qualMatch) {
        score += 6;
      }

      // Bio match
      if (tutor.bio?.toLowerCase().includes(query)) {
        score += 4;
      }

      // Email match (lowest weight)
      if (tutor.email.toLowerCase().includes(query)) {
        score += 2;
      }

      return score;
    }

    return 0;
  },

  // Sort tutors by relevance
  sortByRelevance(
    tutors: TutorProfile[],
    searchQuery?: string
  ): TutorProfile[] {
    if (!searchQuery) {
      // Sort by rating if no search query
      return tutors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return tutors.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, searchQuery);
      const scoreB = this.calculateRelevanceScore(b, searchQuery);
      return scoreB - scoreA;
    });
  },
};

