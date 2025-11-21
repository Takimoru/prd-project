import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
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
  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  const generateUploadUrl = useMutation(
    api.registrations.generatePaymentUploadUrl
  );
  const submitRegistration = useMutation(api.registrations.submitRegistration);

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
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": formData.paymentFile.type,
        },
        body: formData.paymentFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload payment proof.");
      }

      const { storageId } = await uploadResponse.json();

      await submitRegistration({
        programId: formData.programId as any,
        fullName: formData.fullName.trim(),
        studentId: formData.studentId.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        paymentProofStorageId: storageId,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <FileUp className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Field Study Registration
            </h1>
            <p className="text-gray-600 mt-2">
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
                {programs?.map((program) => (
                  <option key={program._id} value={program._id}>
                    {program.title}
                  </option>
                ))}
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

