import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { SupervisorForm } from "../types/supervisor";
import { useAuth } from "../../../contexts/AuthContext";
import {
  GET_USERS,
  CREATE_SUPERVISOR,
  UPDATE_SUPERVISOR,
  DELETE_SUPERVISOR,
} from "../../../graphql/admin";

export function useSupervisorManagement() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupervisorForm>({
    email: "",
    name: "",
    nidn: "",
    password: "",
  });

  // GraphQL Query
  const { data: usersData } = useQuery(GET_USERS, {});
  const supervisors =
    usersData?.users?.filter((u: any) => u.role === "supervisor") || [];

  // GraphQL Mutations
  const [createSupervisorMutation] = useMutation(CREATE_SUPERVISOR, {
    refetchQueries: [{ query: GET_USERS }],
  });
  const [updateSupervisorMutation] = useMutation(UPDATE_SUPERVISOR, {
    refetchQueries: [{ query: GET_USERS }],
  });
  const [deleteSupervisorMutation] = useMutation(DELETE_SUPERVISOR, {
    refetchQueries: [{ query: GET_USERS }],
  });

  const resetForm = () => {
    setFormData({ email: "", name: "", nidn: "", password: "" });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[useSupervisorManagement] handleCreateSupervisor triggered", { 
      userId: user?.id, 
      userEmail: user?.email,
      role: user?.role
    });

    if (!user?.id) {
      console.error("[useSupervisorManagement] Creation blocked: No user ID in context");
      toast.error("You must be logged in as admin");
      return;
    }

    try {
      await createSupervisorMutation({
        variables: {
          input: {
            email: formData.email,
            name: formData.name,
            nidn: formData.nidn,
            password: formData.password || "defaultPassword123", // Password field for future use
          },
        },
      });
      toast.success("Supervisor created successfully");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create supervisor");
    }
  };

  const handleUpdateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!user?.id) {
      toast.error("You must be logged in as admin");
      return;
    }

    try {
      const { password, ...updateData } = formData;
      await updateSupervisorMutation({
        variables: {
          id: editingId,
          input: {
            ...updateData,
            ...(password ? { password } : {}),
          },
        },
      });
      toast.success("Supervisor updated successfully");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update supervisor");
    }
  };

  const handleDeleteSupervisor = async (id: string) => {
    if (!user?.id) {
      toast.error("You must be logged in as admin");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this supervisor? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteSupervisorMutation({
        variables: { id },
      });
      toast.success("Supervisor deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete supervisor");
    }
  };

  const startEditing = (supervisor: any) => {
    setEditingId(supervisor.id);
    setFormData({
      email: supervisor.email,
      name: supervisor.name,
      nidn: supervisor.nidn || "",
      password: "",
    });
    setIsCreating(true);
  };

  return {
    isCreating,
    setIsCreating,
    editingId,
    formData,
    setFormData,
    supervisors,
    handleCreateSupervisor,
    handleUpdateSupervisor,
    handleDeleteSupervisor,
    startEditing,
    resetForm,
  };
}
