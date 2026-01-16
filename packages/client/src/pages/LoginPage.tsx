import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GraduationCap, Building2 } from "lucide-react";

export function LoginPage() {
  const { user, login, isLoading, mockLogin, mockLoginEnabled } = useAuth();
  const navigate = useNavigate();
  const [mockEmail, setMockEmail] = useState("");
  const [mockName, setMockName] = useState("");

  useEffect(() => {
    if (user) {
      if (user.role === "supervisor") {
        navigate("/supervisor");
      } else if (user.role === "admin") {
        navigate("/admin/approvals");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Panel - Branding */}
      <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden flex flex-col justify-center items-center p-8 md:p-12 text-center">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-lg">
          <div className="bg-white/20 p-4 rounded-full mb-8 backdrop-blur-sm">
            <GraduationCap className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Sistem Informasi KKN
          </h1>
          
          <p className="text-blue-100 text-lg md:text-xl font-light mb-12">
            login Dengan Akun Google Anda
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/30 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-100" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium text-sm">University Access Only</p>
                <p className="text-blue-200 text-xs mt-0.5">
                  Restricted to registered students
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile-only Branding Header */}
          <div className="md:hidden text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
          </div>

          <div className="space-y-6">
            <button
              onClick={() => login()}
              className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 text-gray-700 rounded-xl px-6 py-4 transition-all duration-200 group shadow-sm hover:shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-semibold text-lg">Sign in with Google</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400">or</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-500 text-sm">
                Only university email addresses are allowed
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Haven't submitted your documents yet? </span>
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                  Complete registration first
                </Link>
              </p>
            </div>
          </div>

          {mockLoginEnabled && (
            <div className="mt-12 bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Dev-only mock login
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Email (must match submitted registration)
                  </label>
                  <input
                    type="email"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="student@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Display name (optional)
                  </label>
                  <input
                    type="text"
                    value={mockName}
                    onChange={(e) => setMockName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Mock Student"
                  />
                </div>
                <button
                  onClick={() => mockLogin?.(mockEmail, mockName)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow active:transform active:scale-[0.98]"
                >
                  Sign in with mock account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
