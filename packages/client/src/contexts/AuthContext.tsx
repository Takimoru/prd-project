import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useGoogleLogin } from "@react-oauth/google";
import { gql } from "../gql"; // This is how client-preset works
// import { api } from "@/convex/_generated/api";
// import type { Id } from "@/convex/_generated/dataModel";

// We define operations here with gql tag from codegen to get typed results
const ME_QUERY = gql(`
  query Me {
    me {
      id
      email
      name
      role
      studentId
      picture
    }
  }
`);

const SYNC_USER_MUTATION = gql(`
  mutation SyncUser($email: String!, $name: String!, $googleId: String!, $picture: String) {
    syncUser(email: $email, name: $name, googleId: $googleId, picture: $picture) {
      id
      email
      name
      role
    }
  }
`);

interface User {
  id: string; 
  _id: string; // Compatibility alias
  name?: string | null;
  email: string;
  role?: string | null;
  studentId?: string | null;
  picture?: string | null;
}

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isAllowedDomain: (email: string) => boolean;
  mockLogin?: (email: string, name?: string) => Promise<void>;
  mockLoginEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem("userEmail");
  });

  // Apollo Query
  const { data, loading, refetch } = useQuery(ME_QUERY, {
    skip: !userEmail,
    // Ensure we send some auth header if we rely on it, currently apollo.ts reads token from localStorage 'token' or we might need to rely on 'userEmail' for now if no token system yet.
    // Migration Note: We might not have a real token yet if we just used email in Convex.
    // For Phase 2b validation: We will assume we can fetch 'me' if we have some auth.
    // If our Resolver 'me' returns null without token, we need to handle that.
    // For now, let's just try to fetch.
  });

  // Apollo Mutation
  const [syncUser] = useMutation(SYNC_USER_MUTATION);

  const [allowedDomains] = useState<string[]>(() => {
    const envDomains = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS;
    return envDomains ? envDomains.split(",").map((d) => d.trim()) : [];
  });
  const mockLoginEnabled =
    import.meta.env.VITE_ENABLE_MOCK_LOGIN === "true" ||
    import.meta.env.VITE_ENABLE_MOCK_LOGIN === "1";

  // Effect to sync email change
  useEffect(() => {
    if (userEmail) {
        // refetch(); // Apollo auto-refetches if variables change, but here query has no vars, it relies on context.
        // We might need to restart client or just trigger refetch.
        refetch();
    }
  }, [userEmail, refetch]);

  const currentUser = data?.me ? { ...data.me, _id: data.me.id } : null;

  useEffect(() => {
    // Debug: Log current user data
    console.log("AuthContext - Current user from query:", currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === "pending" && userEmail) {
      sessionStorage.setItem("pendingApprovalEmail", currentUser.email);
       // Logic to logout pending users? Convex logic was confusing here.
       // It removed userEmail but loop might occur.
       // Keeping logically similar:
      localStorage.removeItem("userEmail");
      setUserEmail(null);
    }
  }, [currentUser, userEmail]);

  const isAllowedDomain = (email: string): boolean => {
    if (allowedDomains.length === 0) {
      return true;
    }
    const emailDomain = email.split("@")[1];
    return allowedDomains.includes(emailDomain);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credentialResponse.access_token}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const userInfo = await response.json();
      console.log("AuthContext - Google user info fetched:", userInfo);

      if (!isAllowedDomain(userInfo.email)) {
        alert("Only university email addresses are allowed");
        return;
      }

      // Store email
      localStorage.setItem("userEmail", userInfo.email);
      // Store token if needed for Apollo Link
      // localStorage.setItem("token", credentialResponse.access_token); // Or custom token from backend
      
      setUserEmail(userInfo.email);

      // Mutation to sync user
      console.log("AuthContext - Syncing user with email:", userInfo.email);
      const { data: mutationData } = await syncUser({
        variables: {
            name: userInfo.name,
            email: userInfo.email,
            googleId: userInfo.sub,
            picture: userInfo.picture,
        }
      });

      console.log("AuthContext - User synced result:", mutationData);

      // Force refresh
      refetch();
      
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

  const mockLogin = async (email: string, name?: string) => {
    if (!mockLoginEnabled) {
      alert("Mock login is disabled.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      alert("Please provide an email address.");
      return;
    }

    try {
      localStorage.setItem("userEmail", normalizedEmail);
      setUserEmail(normalizedEmail);
      
      await syncUser({
        variables: {
            name: name?.trim() || "Mock User",
            email: normalizedEmail,
            googleId: `mock-${normalizedEmail}`,
        }
      });
      
      refetch();

    } catch (error) {
      console.error("Mock login failed:", error);
      alert("Failed to mock login.");
    }
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    // localStorage.removeItem("token");
    setUserEmail(null);
    window.location.href = "/login";
  };

  const effectiveUser =
    currentUser && currentUser.role === "pending"
      ? null
      : currentUser;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        isLoading: loading,
        login,
        logout,
        isAllowedDomain,
        mockLoginEnabled,
        mockLogin: mockLoginEnabled ? mockLogin : undefined,
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
