import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { GET_PROGRAMS } from "@/graphql/admin";
import { SUBMIT_REGISTRATION } from "@/graphql/registration";
import toast from "react-hot-toast";
import { FileUp, CheckCircle2 } from "lucide-react";

type RegistrationForm = {
  programId: string;
  fullName: string;
  studentId: string;
  phone: string;
  email: string;
  paymentFile: File | null;
};

const INITIAL_FORM: RegistrationForm = {
  programId: "",
  fullName: "",
  studentId: "",
  phone: "",
  email: "",
  paymentFile: null,
};

export function RegistrationPage() {
  const { data: programsData, loading: programsLoading } = useQuery(GET_PROGRAMS, {
    variables: { includeArchived: false },
  });
  const programs = programsData?.programs || [];
  
  const [submitRegistrationMutation] = useMutation(SUBMIT_REGISTRATION);

  const [formData, setFormData] = useState<RegistrationForm>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const allowedDomains = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  const validateEmailDomain = (email: string) => {
    if (allowedDomains.length === 0) return true;
    const domain = email.split("@")[1]?.toLowerCase();
    return allowedDomains.includes(domain);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, paymentFile: null }));
      return;
    }
    const maxSizeMb = 5;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Payment proof must be a PDF or image file (JPG/PNG).");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File must be smaller than ${maxSizeMb} MB.`);
      return;
    }
    setFormData((prev) => ({ ...prev, paymentFile: file }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!formData.programId) {
      toast.error("Please select a program.");
      return;
    }
    if (!validateEmailDomain(formData.email)) {
      toast.error("Please use your university email address.");
      return;
    }
    if (!formData.paymentFile) {
      toast.error("Payment proof is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file to new backend
      const formDataToUpload = new FormData();
      formDataToUpload.append("file", formData.paymentFile);
      formDataToUpload.append("targetType", "registration");
      formDataToUpload.append("targetId", formData.programId);

      const uploadResponse = await fetch("http://localhost:4000/api/upload/single", {
        method: "POST",
        body: formDataToUpload,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload payment proof.");
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error("Failed to upload payment proof.");
      }

      // Get full URL (backend returns relative path)
      const paymentProofUrl = uploadResult.url.startsWith('http') 
        ? uploadResult.url 
        : `http://localhost:4000${uploadResult.url}`;

      // Submit registration via GraphQL
      await submitRegistrationMutation({
        variables: {
          input: {
            programId: formData.programId,
            fullName: formData.fullName.trim(),
            studentId: formData.studentId.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim().toLowerCase(),
            paymentProofUrl: paymentProofUrl,
          },
        },
      });

      setIsSuccess(true);
      setFormData(INITIAL_FORM);
      toast.success("Registration submitted! Please wait for admin verification.");
    } catch (error: any) {
      console.error("Registration submission failed:", error);
      toast.error(error.message || "Failed to submit registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full mb-4">
              <FileUp className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Field Study Registration
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Submit your data and payment proof. Admin will verify before you can log in.
            </p>
          </div>

          {isSuccess && (
            <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">
                  Registration received!
                </p>
                <p className="text-sm text-green-800 mt-1">
                  We&apos;ll notify you once the admin verifies your data and payment.
                  After approval, sign in with Google using the same email address.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Program
              </label>
              <select
                value={formData.programId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, programId: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Choose a program</option>
                {programsLoading ? (
                  <option value="">Loading programs...</option>
                ) : (
                  programs.map((program: any) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, studentId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the same email you will use to sign in with Google.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Proof (PDF / JPG / PNG)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="w-full"
                required
              />
              {formData.paymentFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.paymentFile.name}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already approved?{" "}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Sign in with Google
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

