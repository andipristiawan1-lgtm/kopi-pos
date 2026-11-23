import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function StoreProfile() {
  const [waAdmin, setWaAdmin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Ambil data pengaturan saat ini
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.wa_admin) {
          setWaAdmin(data.data.wa_admin);
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    // Format nomor: hapus spasi, pastikan diawali 62
    let formattedNumber = waAdmin.replace(/\D/g, "");
    if (formattedNumber.startsWith("0")) {
      formattedNumber = "62" + formattedNumber.slice(1);
    }

    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wa_admin: formattedNumber }),
      });

      if (res.ok) {
        setMessage("Pengaturan berhasil disimpan!");
        setWaAdmin(formattedNumber); // Update tampilan dengan format baru
      } else {
        throw new Error("Gagal menyimpan");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-coffee-600 hover:underline text-sm">
          ← Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-coffee-100">
        <h1 className="text-2xl font-bold text-coffee-900 mb-2">Profil Toko</h1>
        <p className="text-gray-500 mb-6">
          Atur informasi kontak yang akan digunakan pelanggan.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2">
              Nomor WhatsApp Admin
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                +62
              </span>
              <input
                type="text"
                value={waAdmin.replace(/^62/, "")}
                onChange={(e) => setWaAdmin(e.target.value)}
                placeholder="81234567890"
                className="flex-1 border border-gray-300 rounded-r-lg p-2 focus:ring-coffee-500 focus:border-coffee-500"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Nomor ini akan muncul di halaman sukses pesanan pelanggan.
            </p>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${message.includes("berhasil") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-coffee-500 text-white py-3 rounded-lg font-bold hover:bg-coffee-700 disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </form>
      </div>
    </div>
  );
}
