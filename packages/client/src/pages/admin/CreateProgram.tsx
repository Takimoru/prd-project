import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CREATE_PROGRAM, GET_PROGRAMS } from "../../graphql/admin";
import { AdminHeader } from "./components/AdminHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export function CreateProgram() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [createProgram, { loading }] = useMutation(CREATE_PROGRAM, {
    refetchQueries: [{ query: GET_PROGRAMS, variables: { includeArchived: false } }],
    onCompleted: () => {
      toast.success("Periode KKN berhasil dibuat!");
      navigate("/admin/teams");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat periode KKN");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Tanggal mulai dan selesai wajib diisi");
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Format tanggal tidak valid");
      return;
    }

    if (endDate < startDate) {
      toast.error("Tanggal selesai harus setelah tanggal mulai");
      return;
    }

    try {
      await createProgram({
        variables: {
          input: {
            title: formData.title,
            description: formData.description || "",
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        },
      });
    } catch (error: any) {
      // Error is handled by onError callback
      console.error("Error creating program:", error);
    }
  };

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return "";
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    
    if (weeks > 0 && days > 0) {
      return `${weeks} minggu dan ${days} hari`;
    } else if (weeks > 0) {
      return `${weeks} minggu`;
    } else {
      return `${diffDays} hari`;
    }
  };

  return (
    <div className="space-y-6">
        <AdminHeader
        title="Buat Periode KKN Baru"
        description="Buat periode KKN baru dengan judul dan durasi"
      />

      <Card>
        <CardHeader>
          <CardTitle>Detail Periode KKN</CardTitle>
          <CardDescription>
            Isi informasi periode KKN di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Periode KKN *</Label>
              <Input
                id="title"
                placeholder="Contoh: Periode KKN 2024"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Masukkan deskripsi periode KKN..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={formData.startDate}
                  required
                />
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Durasi Periode KKN</p>
                <p className="text-2xl font-bold text-primary">
                  {calculateDuration()}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/teams")}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Membuat..." : "Buat Periode KKN"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

