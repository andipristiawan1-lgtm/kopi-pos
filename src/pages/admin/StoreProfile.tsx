import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function StoreProfile() {
  const [formData, setFormData] = useState({
    store_name: "",
    store_address: "",
    store_hours: "",
    wa_admin: "",
    logo_url: "",
    hero_image_1: "",
    hero_image_2: "",
    hero_image_3: "",
    footer_image_url: "",
    menu_fallback_image_url: "",
    bank_name: "",
    bank_account: "",
    bank_owner: "",
    ewallet_name: "",
    ewallet_number: "",
    qris_url: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setFormData((prev) => ({ ...prev, ...data.data }));
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) setMessage("Pengaturan berhasil disimpan!");
      else throw new Error();
    } catch (err) {
      setMessage("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/admin"
        className="text-coffee-600 hover:underline text-sm mb-6 block"
      >
        ← Kembali ke Dashboard
      </Link>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-coffee-100">
        <h1 className="text-2xl font-bold text-coffee-900 mb-6">
          Profil & Pembayaran
        </h1>

        {message && (
          <div
            className={`p-3 rounded mb-4 ${message.includes("berhasil") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* PROFIL TOKO */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-lg mb-4 text-coffee-800">Profil Toko</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Nama Toko</label>
                <input
                  type="text"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  placeholder="Warung Kopi"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Jam Buka</label>
                <input
                  type="text"
                  name="store_hours"
                  value={formData.store_hours}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  placeholder="08.00 - 22.00"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm mb-1">Alamat Toko</label>
              <input
                type="text"
                name="store_address"
                value={formData.store_address}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Jl. Contoh No. 123"
              />
            </div>
          </div>

          {/* GAMBAR WEBSITE */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-lg mb-4 text-coffee-800">Gambar Website</h2>
            <p className="text-xs text-gray-500 mb-3">
              Masukkan tautan langsung gambar dari Imgur, Blogger, Google Drive, atau hosting lain. Gunakan gambar berformat JPG, PNG, atau WebP.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/*
                ["logo_url", "URL Logo Navbar"],
                ["hero_image_1", "URL Gambar Hero 1"],
                ["hero_image_2", "URL Gambar Hero 2"],
                ["hero_image_3", "URL Gambar Hero 3"],
                ["footer_image_url", "URL Gambar/Footer"],
                ["menu_fallback_image_url", "URL Gambar Menu Default"],
              */}
              {["logo_url", "hero_image_1", "hero_image_2", "hero_image_3", "footer_image_url", "menu_fallback_image_url"].map((name, index) => (
                <div key={index}>
                  <label className="block text-sm mb-1">
                    {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </label>
                  <input
                    type="url"
                    name={name}
                    value={formData[name as keyof typeof formData]}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* TRANSFER BANK */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-lg mb-4 text-coffee-800">
              Transfer Bank
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  Nama Bank (Cth: BCA)
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  name="bank_account"
                  value={formData.bank_account}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm mb-1">Atas Nama</label>
              <input
                type="text"
                name="bank_owner"
                value={formData.bank_owner}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          {/* E-WALLET */}
          <div className="border-b pb-4">
            <h2 className="font-bold text-lg mb-4 text-coffee-800">E-Wallet</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">
                  Nama E-Wallet (Cth: GoPay)
                </label>
                <input
                  type="text"
                  name="ewallet_name"
                  value={formData.ewallet_name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Nomor HP E-Wallet</label>
                <input
                  type="text"
                  name="ewallet_number"
                  value={formData.ewallet_number}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
          </div>

          {/* QRIS */}
          <div>
            <h2 className="font-bold text-lg mb-4 text-coffee-800">QRIS</h2>
            <label className="block text-sm mb-1">
              URL Gambar QRIS (Upload ke Imgur/Drive, paste link-nya)
            </label>
            <input
              type="text"
              name="qris_url"
              value={formData.qris_url}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-coffee-500 text-white py-3 rounded font-bold hover:bg-coffee-700"
          >
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </form>
      </div>
    </div>
  );
}
