import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type CustomerOrder = {
  id: number;
  order_number: string;
  order_type: string;
  table_number: string | null;
  customer_name: string | null;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  total_amount: number;
  payment_method: string;
  is_paid: number;
  created_at: number;
};

const statusLabels: Record<CustomerOrder["status"], string> = {
  pending: "Pesanan Diterima",
  preparing: "Sedang Diproses",
  ready: "Pesanan Siap",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default function CustomerOrderHistory() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem("warung_customer_phone");
      if (savedPhone) setPhone(savedPhone);
    } catch {
      // Browser dapat menolak localStorage pada mode tertentu.
    }
  }, []);

  const searchHistory = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalizedPhone = phone.replace(/\D/g, "");

    if (normalizedPhone.length < 8 || normalizedPhone.length > 15) {
      setMessage("Masukkan nomor WhatsApp yang valid.");
      setOrders([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      localStorage.setItem("warung_customer_phone", normalizedPhone);
      const apiUrl = import.meta.env.DEV
        ? `http://127.0.0.1:8788/api/orders/customer-history?phone=${encodeURIComponent(normalizedPhone)}`
        : `/api/orders/customer-history?phone=${encodeURIComponent(normalizedPhone)}`;

      const res = await fetch(apiUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat riwayat");

      setOrders(Array.isArray(data.data) ? data.data : []);
      if (data.data?.length === 0) setMessage("Belum ada pesanan untuk nomor WhatsApp ini.");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Gagal memuat riwayat pesanan");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-coffee-900">Riwayat Pesanan</h1>
        <p className="text-gray-500 mt-1">Masukkan nomor WhatsApp yang digunakan saat memesan.</p>
      </div>

      <form onSubmit={searchHistory} className="bg-white border rounded-2xl p-4 md:p-5 shadow-sm mb-6">
        <label className="block text-sm font-bold text-coffee-900 mb-2">Nomor WhatsApp</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            required
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="flex-1 h-12 px-3 border border-slate-300 rounded-xl text-sm"
            placeholder="Contoh: 081234567890"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-coffee-700 text-white font-bold disabled:opacity-50"
          >
            {loading ? "Mencari..." : "Cari Pesanan"}
          </button>
        </div>
      </form>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-coffee-50 border border-coffee-100 text-coffee-800 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/order/success/${order.order_number}`}
            className="block bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <p className="font-mono font-bold text-coffee-900">{order.order_number}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.created_at * 1000).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-black text-coffee-900">Rp {order.total_amount.toLocaleString("id-ID")}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {order.is_paid ? "Lunas" : order.payment_method === "cash" ? "Belum dibayar" : "Menunggu pembayaran"}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold text-coffee-800">
                {order.order_type === "dine_in" && order.table_number
                  ? `Dine-in Meja ${order.table_number}`
                  : order.order_type === "take_away"
                    ? "Take-away"
                    : order.order_type === "booking"
                      ? `Booking Meja ${order.table_number || "-"}`
                      : "Pesanan Online"}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-coffee-100 text-coffee-700">
                {statusLabels[order.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
