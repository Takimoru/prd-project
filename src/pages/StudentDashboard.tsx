import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export function StudentDashboard() {
  const { user } = useAuth();
  const programs = useQuery(api.programs.getAllPrograms, {
    includeArchived: false,
  });
  const userRegistrations = user
    ? useQuery(api.registrations.getUserRegistrations, {
        userId: user._id,
      })
    : null;
  const registerForProgram = useMutation(api.registrations.registerForProgram);

  const today = format(new Date(), "yyyy-MM-dd");

  const handleRegister = async (programId: string) => {
    if (!user) {
      toast.error("You must be logged in to register");
      return;
    }

    try {
      await registerForProgram({
        programId: programId as any,
        userId: user._id,
      });
      toast.success("Registration submitted! Waiting for admin approval.");
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(error.message || "Failed to register. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Date</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {format(new Date(), "MMM dd, yyyy")}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Programs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {programs?.length || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Registrations</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {userRegistrations?.filter((r) => r.status === "approved")
                  .length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Available Programs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Programs
          </h2>
        </div>
        <div className="p-6">
          {programs && programs.length > 0 ? (
            <div className="space-y-4">
              {programs.map((program) => {
                const registration = userRegistrations?.find(
                  (r) => r.programId === program._id
                );
                return (
                  <div
                    key={program._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {program.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {program.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>
                            Start:{" "}
                            {format(
                              new Date(program.startDate),
                              "MMM dd, yyyy"
                            )}
                          </span>
                          <span>
                            End:{" "}
                            {format(new Date(program.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {registration ? (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              registration.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : registration.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            {registration.status}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRegister(program._id)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Register
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No programs available at the moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
