import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type KitchenItem = {
  name: string;
  quantity: number;
  kitchen_status: "pending" | "preparing" | "ready";
  is_additional: number;
};

type KitchenOrder = {
  id: number;
  order_number: string;
  order_type: string;
  table_number: string | null;
  customer_name: string | null;
  status: "pending" | "preparing" | "ready";
  created_at: number;
  items: KitchenItem[];
};

const statusConfig = {
  pending: {
    title: "Pesanan Baru",
    icon: "🔔",
    header: "bg-red-600",
    card: "border-red-500",
  },
  preparing: {
    title: "Sedang Dibuat",
    icon: "☕",
    header: "bg-amber-500",
    card: "border-amber-500",
  },
  ready: {
    title: "Siap Disajikan",
    icon: "✓",
    header: "bg-green-600",
    card: "border-green-500",
  },
} as const;

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);

  const fetchOrders = async (playNotification = false) => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/orders/list"
      : "/api/orders/list";

    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat pesanan");

      const nextOrders: KitchenOrder[] = Array.isArray(data.data) ? data.data : [];
      const pendingCount = nextOrders.filter((order) => order.status === "pending").length;

      if (playNotification && pendingCount > previousPendingCount) {
        window.dispatchEvent(new CustomEvent("kitchen:new-order"));
        try {
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.frequency.value = 880;
          gain.gain.value = 0.08;
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start();
          setTimeout(() => oscillator.stop(), 180);
        } catch {
          // Browser memerlukan interaksi pertama sebelum audio dapat diputar.
        }
      }

      setPreviousPendingCount(pendingCount);
      setOrders(nextOrders);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders(false);
    const interval = window.setInterval(() => void fetchOrders(true), 5000);
    return () => window.clearInterval(interval);
  }, [previousPendingCount]);

  const updateStatus = async (orderId: number, status: "preparing" | "ready") => {
    setUpdatingId(orderId);
    setError("");

    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/orders/${orderId}/status`
      : `/api/orders/${orderId}/status`;

    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal memperbarui pesanan");
      await fetchOrders(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui pesanan");
    } finally {
      setUpdatingId(null);
    }
  };

  const elapsedMinutes = (createdAt: number) => {
    const elapsed = Math.floor((Date.now() - createdAt * 1000) / 60000);
    return Math.max(0, elapsed);
  };

  const formatOrderSource = (order: KitchenOrder) => {
    if (order.order_type === "dine_in" && order.table_number) return `Meja ${order.table_number}`;
    if (order.order_type === "take_away") return "Take-away";
    if (order.order_type === "booking" && order.table_number) return `Booking Meja ${order.table_number}`;
    if (order.order_type === "online") return "Pesanan Online";
    return "Pesanan";
  };

  const columns = ["pending", "preparing", "ready"] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="h-16 px-4 md:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-700 flex items-center justify-center text-xl">☕</div>
          <div>
            <h1 className="text-lg md:text-xl font-black">Kitchen Display</h1>
            <p className="text-xs text-slate-400">Antrean persiapan pesanan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-2 text-xs text-green-400 font-bold px-3 py-1.5 rounded-full bg-green-950 border border-green-900">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live
          </span>
          <Link to="/pos" className="h-10 px-4 rounded-lg bg-slate-800 text-slate-200 text-sm font-bold flex items-center hover:bg-slate-700">Kasir</Link>
        </div>
      </header>

      {error && <div className="mx-4 mt-4 p-3 rounded-lg bg-red-950 text-red-200 border border-red-900">{error}</div>}

      {loading ? (
        <div className="h-[70vh] flex items-center justify-center text-slate-400">Memuat antrean dapur...</div>
      ) : (
        <main className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-3 md:p-5">
          {columns.map((status) => {
            const config = statusConfig[status];
            const columnOrders = orders.filter((order) => order.status === status);

            return (
              <section key={status} className="min-w-0">
                <div className={`${config.header} h-12 px-4 rounded-t-xl flex items-center justify-between`}>
                  <h2 className="font-black flex items-center gap-2"><span>{config.icon}</span>{config.title}</h2>
                  <span className="min-w-7 h-7 px-2 rounded-full bg-black/20 flex items-center justify-center text-sm font-black">{columnOrders.length}</span>
                </div>

                <div className="bg-slate-900/70 border-x border-b border-slate-800 rounded-b-xl min-h-[calc(100vh-145px)] p-3 space-y-3">
                  {columnOrders.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                      <span className="text-3xl mb-2">☕</span>
                      <p className="text-sm">Belum ada pesanan</p>
                    </div>
                  ) : columnOrders.map((order) => {
                    const minutes = elapsedMinutes(order.created_at);
                    return (
                      <article key={order.id} className={`bg-white text-slate-900 rounded-xl border-t-4 ${config.card} shadow-xl overflow-hidden`}>
                        <div className="p-4">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <p className="font-mono text-xl font-black text-coffee-900">{order.order_number}</p>
                              <p className="text-sm font-bold text-slate-600 mt-1">{formatOrderSource(order)}</p>
                            </div>
                            <div className={`shrink-0 rounded-lg px-2 py-1 text-xs font-black ${minutes >= 15 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                              {minutes} menit
                            </div>
                          </div>

                          {order.customer_name && <p className="mt-2 text-xs text-slate-500">Untuk: <strong>{order.customer_name}</strong></p>}

                          <ul className="mt-4 space-y-2 border-t pt-3">
                            {order.items.map((item, index) => (
                              <li key={index} className={`flex items-start gap-3 p-2 rounded-lg ${item.is_additional ? "bg-red-50 border border-red-200" : ""}`}>
                                <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-black ${item.is_additional ? "bg-red-600 text-white" : "bg-coffee-100 text-coffee-900"}`}>{item.quantity}×</span>
                                <div className="pt-1">
                                  <span className="font-bold leading-5">{item.name}</span>
                                  {item.is_additional === 1 && (
                                    <span className="ml-2 inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">Menu Susulan</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 border-t bg-slate-50">
                          {status === "pending" && (
                            <button type="button" onClick={() => updateStatus(order.id, "preparing")} disabled={updatingId === order.id} className="w-full h-12 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black disabled:opacity-50">
                              {updatingId === order.id ? "Memproses..." : "Mulai Dibuat"}
                            </button>
                          )}
                          {status === "preparing" && (
                            <button type="button" onClick={() => updateStatus(order.id, "ready")} disabled={updatingId === order.id} className="w-full h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black disabled:opacity-50">
                              {updatingId === order.id ? "Memproses..." : "Pesanan Siap"}
                            </button>
                          )}
                          {status === "ready" && (
                            <div className="h-12 rounded-lg bg-green-100 text-green-800 flex items-center justify-center font-black">✓ Menunggu Diambil/Pelayan</div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}
