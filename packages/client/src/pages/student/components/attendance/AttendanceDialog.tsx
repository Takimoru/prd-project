import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface AttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: "present" | "permission", excuse?: string, proofUrl?: string) => Promise<void>;
}

export function AttendanceDialog({ isOpen, onClose, onSubmit }: AttendanceDialogProps) {
  const [status, setStatus] = useState<"present" | "permission" | null>(null);
  const [excuse, setExcuse] = useState("");
  const [proofUrl, setProofUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/single", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setProofUrl(data.url);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!status) {
      toast.error("Silakan pilih status kehadiran");
      return;
    }

    if (status === "permission" && !excuse.trim()) {
      toast.error("Silakan berikan alasan izin");
      return;
    }

    if (status === "permission" && !proofUrl) {
      toast.error("Silakan unggah bukti izin (misal: surat sakit)");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        status, 
        status === "permission" ? excuse : undefined,
        status === "permission" ? proofUrl : undefined
      );
      onClose();
      setStatus(null);
      setExcuse("");
      setProofUrl(undefined);
    } catch (error) {
      console.error("Failed to submit attendance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Absensi Harian</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Silakan konfirmasi kehadiran Anda untuk hari ini.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStatus("present")}
              className={`p-4 border rounded-lg text-center transition-colors ${
                status === "present"
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <span className="block font-semibold">Hadir</span>
              <span className="text-sm text-gray-500">Saya hadir bekerja</span>
            </button>
            <button
              onClick={() => setStatus("permission")}
              className={`p-4 border rounded-lg text-center transition-colors ${
                status === "permission"
                  ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <span className="block font-semibold">Izin</span>
              <span className="text-sm text-gray-500">Saya tidak bisa hadir</span>
            </button>
          </div>

          {status === "permission" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan izin
                </label>
                <textarea
                  value={excuse}
                  onChange={(e) => setExcuse(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Jelaskan mengapa Anda tidak bisa hadir hari ini..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bukti izin (Foto/PDF)
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label
                    htmlFor="proof-upload"
                    className={`cursor-pointer px-4 py-2 border rounded-lg text-sm font-medium ${
                      proofUrl 
                        ? "bg-green-50 border-green-500 text-green-700" 
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {uploading ? "Mengunggah..." : proofUrl ? "Berhasil diunggah" : "Pilih File"}
                  </label>
                  {proofUrl && (
                    <span className="ml-3 text-xs text-gray-500 truncate max-w-[150px]">
                      {proofUrl.split('/').pop()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              disabled={isSubmitting || uploading}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={!status || isSubmitting || uploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Absensi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
