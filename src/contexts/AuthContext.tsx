import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useGoogleLogin } from "@react-oauth/google";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "admin" | "supervisor" | "student";
  studentId?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isAllowedDomain: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    // Get email from localStorage on mount
    return localStorage.getItem("userEmail");
  });

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    userEmail ? { email: userEmail } : "skip"
  );
  const createOrUpdateUser = useMutation(api.auth.createOrUpdateUser);

  const [allowedDomains] = useState<string[]>(() => {
    const envDomains = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS;
    return envDomains ? envDomains.split(",").map((d) => d.trim()) : [];
  });

  useEffect(() => {
    setIsLoading(false);
    // Debug: Log current user data
    console.log("AuthContext - Current user from query:", currentUser);
    console.log("AuthContext - User email from localStorage:", userEmail);
  }, [currentUser, userEmail]);

  const isAllowedDomain = (email: string): boolean => {
    if (allowedDomains.length === 0) {
      console.log("No allowed domains configured, allowing all emails");
      return true;
    }
    const emailDomain = email.split("@")[1];
    const isAllowed = allowedDomains.includes(emailDomain);
    console.log("Domain check:", {
      email,
      emailDomain,
      allowedDomains,
      isAllowed,
    });
    return isAllowed;
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Get user info from Google
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credentialResponse.access_token}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const userInfo = await response.json();

      if (!isAllowedDomain(userInfo.email)) {
        alert("Only university email addresses are allowed");
        return;
      }

      // Store email in localStorage for session persistence
      localStorage.setItem("userEmail", userInfo.email);
      setUserEmail(userInfo.email);

      // Create or update user in database
      const userId = await createOrUpdateUser({
        name: userInfo.name,
        email: userInfo.email,
        googleId: userInfo.sub,
        picture: userInfo.picture,
      });

      console.log("User created/updated:", userId);
      console.log("User email:", userInfo.email);

      // Force refresh user data after a short delay
      setTimeout(() => {
        console.log("Refreshing user data...");
        // Trigger a re-query by updating the email state
        setUserEmail(userInfo.email);
      }, 1000);
    } catch (error) {
      console.error("Error during Google login:", error);
      alert("Failed to sign in. Please try again.");
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      alert("Failed to sign in with Google");
    },
  });

  const logout = () => {
    // Clear localStorage and redirect
    localStorage.removeItem("userEmail");
    setUserEmail(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser as User | null | undefined,
        isLoading,
        login,
        logout,
        isAllowedDomain,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
