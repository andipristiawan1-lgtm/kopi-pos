import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function BookingSettings() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [timeLimit, setTimeLimit] = useState(60);
  const [warningMinutes, setWarningMinutes] = useState(15);
  const [tables, setTables] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isSavingToggle, setIsSavingToggle] = useState(false);

  const fetchData = () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/booking/status"
      : "/api/booking/status";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.isEnabled !== undefined) {
          setIsEnabled(data.isEnabled);
          setTimeLimit(data.timeLimit);
          setWarningMinutes(data.warningMinutes);
        }
      });

    const apiTables = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/tables"
      : "/api/admin/tables";
    fetch(apiTables)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTables(data.data);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi Toggle Utama (Simpan Otomatis)
  const toggleMainStatus = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue); // Ubah UI dulu agar responsif
    setIsSavingToggle(true);
    setMessage("");

    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_booking_enabled: newValue ? "1" : "0" }),
      });

      if (res.ok) {
        setMessage(
          newValue ? "Fitur booking diaktifkan." : "Fitur booking dimatikan.",
        );
      } else {
        setIsEnabled(!newValue); // Kembalikan jika gagal
        setMessage("Gagal menyimpan pengaturan.");
      }
    } catch (error) {
      setIsEnabled(!newValue);
      setMessage("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingToggle(false);
    }
  };

  // Fungsi Simpan Batas Waktu
  const saveTimeSettings = async () => {
    setMessage("");
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_time_limit: timeLimit.toString(),
        booking_warning_minutes: warningMinutes.toString(),
      }),
    });
    if (res.ok) setMessage("Batas waktu berhasil disimpan!");
    else setMessage("Gagal menyimpan batas waktu.");
  };

  // Fungsi Toggle Meja
  const toggleTableBookable = async (id: number, currentStatus: any) => {
    const isCurrentlyBookable = Number(currentStatus) === 1;
    const newStatus = !isCurrentlyBookable;

    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/tables"
      : "/api/admin/tables";
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_bookable: newStatus }),
    });
    fetchData(); // Refresh data dari database
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/admin"
        className="text-coffee-600 hover:underline text-sm mb-6 block"
      >
        ← Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-coffee-100 mb-6">
        <h1 className="text-2xl font-bold text-coffee-900 mb-6">
          Pengaturan Booking
        </h1>

        {/* Notifikasi */}
        {message && (
          <div
            className={`p-3 rounded mb-4 text-sm ${message.includes("Gagal") || message.includes("kesalahan") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
          >
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Sakelar Utama */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <h3 className="font-bold text-gray-800">
                Aktifkan Fitur Booking
              </h3>
              <p className="text-sm text-gray-500">
                Pelanggan dapat melakukan booking meja.
              </p>
            </div>
            <button
              onClick={toggleMainStatus}
              disabled={isSavingToggle}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${isEnabled ? "bg-green-500" : "bg-gray-300"} ${isSavingToggle ? "opacity-50" : ""}`}
            >
              <span
                className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${isEnabled ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* Batas Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Batas Waktu Booking (Menit)
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Peringatan Sebelum Habis (Menit)
              </label>
              <input
                type="number"
                value={warningMinutes}
                onChange={(e) => setWarningMinutes(parseInt(e.target.value))}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>

          <button
            onClick={saveTimeSettings}
            className="bg-coffee-600 text-white px-6 py-2 rounded font-bold hover:bg-coffee-700"
          >
            Simpan Batas Waktu
          </button>
        </div>
      </div>

      {/* Daftar Meja */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-coffee-100">
        <h2 className="text-xl font-bold text-coffee-900 mb-4">
          Meja yang Bisa Dibooking
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-4 rounded-lg border flex justify-between items-center ${Number(table.is_bookable) === 1 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
            >
              <span className="font-bold text-gray-800">
                Meja {table.table_number}
              </span>
              <button
                onClick={() => toggleTableBookable(table.id, table.is_bookable)}
                className={`text-xs px-3 py-1 rounded font-bold ${Number(table.is_bookable) === 1 ? "bg-green-200 text-green-800" : "bg-gray-300 text-gray-600"}`}
              >
                {Number(table.is_bookable) === 1 ? "Aktif" : "Mati"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
