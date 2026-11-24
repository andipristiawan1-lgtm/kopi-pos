import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Booking() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);
  const [form, setForm] = useState({
    tableNumber: "",
    customerName: "",
    customerPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Ambil SEMUA meja (termasuk yang booking) untuk ditampilkan
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/tables"
      : "/api/tables";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTables(data.data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://127.0.0.1:8788/api/booking"
        : "/api/booking";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate(`/order/success/${data.orderNumber}`); // Arahkan ke halaman sukses
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-coffee-500">
        <h1 className="text-2xl font-bold text-coffee-900 mb-2 text-center">
          Booking Meja
        </h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Amankan meja Anda untuk acara spesial.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Meja</label>
            <select
              required
              value={form.tableNumber}
              onChange={(e) =>
                setForm({ ...form, tableNumber: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
            >
              <option value="">-- Pilih Meja --</option>
              {tables.map((t) => (
                <option
                  key={t.id}
                  value={t.table_number}
                  disabled={t.status !== "available"}
                >
                  Meja {t.table_number}{" "}
                  {t.status !== "available"
                    ? "(Tidak Tersedia)"
                    : `- DP: Rp ${t.booking_price.toLocaleString("id-ID")}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama Anda</label>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              No. WhatsApp
            </label>
            <input
              type="tel"
              required
              value={form.customerPhone}
              onChange={(e) =>
                setForm({ ...form, customerPhone: e.target.value })
              }
              className="w-full border p-2 rounded-lg"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coffee-500 text-white py-3 rounded-lg font-bold hover:bg-coffee-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Booking Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
