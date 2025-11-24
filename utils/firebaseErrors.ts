// Firebase error code to user-friendly message mapping
export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error?.code || "";
  const errorMessage = error?.message || "";

  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please use a different email or try logging in.";
    case "auth/invalid-email":
      return "Invalid email address. Please check your email and try again.";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled. Please contact support.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email. Please check your email or register.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again or reset your password.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/internal-error":
      return "An internal error occurred. Please try again later.";
    case "auth/configuration-not-found":
      return "Firebase Authentication is not configured. Please enable Email/Password authentication in Firebase Console under Authentication > Sign-in method.";
    case "auth/api-key-not-valid":
      return "Invalid Firebase API key. Please check your Firebase configuration.";
    case "auth/app-not-authorized":
      return "This app is not authorized to use Firebase Authentication. Please check your Firebase configuration.";
    default:
      // Handle timeout and connection errors
      if (errorMessage?.includes("timeout") || errorMessage?.includes("Connection timeout")) {
        return "Connection timeout. Please check your internet connection and try again.";
      }
      // Log the actual error for debugging
      console.error("Firebase Error:", errorCode, errorMessage);
      return errorMessage || "An unexpected error occurred. Please try again.";
  }
};

