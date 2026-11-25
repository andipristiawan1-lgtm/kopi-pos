import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function BookingSettings() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [timeLimit, setTimeLimit] = useState(60);
  const [warningMinutes, setWarningMinutes] = useState(15);
  const [tables, setTables] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const fetchData = () => {
    // Fetch Status Booking
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

    // Fetch Meja
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

  const handleSaveSettings = async () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_booking_enabled: isEnabled ? "1" : "0",
        booking_time_limit: timeLimit.toString(),
        booking_warning_minutes: warningMinutes.toString(),
      }),
    });

    if (res.ok) setMessage("Pengaturan booking berhasil disimpan!");
    else setMessage("Gagal menyimpan pengaturan.");
  };

  const toggleTableBookable = async (id: number, currentStatus: boolean) => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/tables"
      : "/api/admin/tables";
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_bookable: !currentStatus }),
    });
    fetchData(); // Refresh data
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
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded mb-4">
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <h3 className="font-bold text-gray-800">
                Aktifkan Fitur Booking
              </h3>
              <p className="text-sm text-gray-500">
                Pelanggan dapat melakukan booking meja.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            onClick={handleSaveSettings}
            className="bg-coffee-600 text-white px-6 py-2 rounded font-bold hover:bg-coffee-700"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-coffee-100">
        <h2 className="text-xl font-bold text-coffee-900 mb-4">
          Meja yang Bisa Dibooking
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-4 rounded-lg border flex justify-between items-center ${table.is_bookable ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
            >
              <span className="font-bold text-gray-800">
                Meja {table.table_number}
              </span>
              <button
                onClick={() => toggleTableBookable(table.id, table.is_bookable)}
                className={`text-xs px-3 py-1 rounded font-bold ${table.is_bookable ? "bg-green-200 text-green-800" : "bg-gray-300 text-gray-600"}`}
              >
                {table.is_bookable ? "Aktif" : "Mati"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
