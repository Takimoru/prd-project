import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { 
  GET_PENDING_REGISTRATIONS, 
  GET_APPROVED_REGISTRATIONS,
  APPROVE_REGISTRATION,
  REJECT_REGISTRATION 
} from "../../../graphql/admin";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { RegistrationTab } from "../types/student";

export function useStudentApprovals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RegistrationTab>("pending");

  const { data: pendingData, refetch: refetchPending } = useQuery(GET_PENDING_REGISTRATIONS, {
    skip: !user,
  });
  
  const { data: approvedData, refetch: refetchApproved } = useQuery(GET_APPROVED_REGISTRATIONS, {
    skip: !user,
  });

  const [approveRegistration] = useMutation(APPROVE_REGISTRATION);
  const [rejectRegistration] = useMutation(REJECT_REGISTRATION);

  const handleApproveRegistration = async (registrationId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await approveRegistration({
        variables: { id: registrationId },
      });
      toast.success("Registration approved!");
      refetchPending();
      refetchApproved();
    } catch (error: any) {
      console.error("Failed to approve:", error);
      toast.error(error.message || "Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (confirm("Are you sure you want to reject this registration?")) {
      try {
        await rejectRegistration({
          variables: { id: registrationId },
        });
        toast.success("Registration rejected");
        refetchPending();
        refetchApproved();
      } catch (error: any) {
        console.error("Failed to reject:", error);
        toast.error(error.message || "Failed to reject registration");
      }
    }
  };

  return {
    activeTab,
    setActiveTab,
    pendingRegistrations: pendingData?.pendingRegistrations,
    approvedRegistrations: approvedData?.approvedRegistrations,
    handleApproveRegistration,
    handleRejectRegistration,
  };
}
