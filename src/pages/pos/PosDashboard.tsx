import { useState, useEffect } from "react";
import PrintStruk from "./PrintStruk";
import { Link } from "react-router-dom";

type Order = {
  id: number;
  order_number: string;
  order_type: string;
  table_number: string;
  customer_name: string;
  status: string;
  total_amount: number;
  created_at: number;
  items: { name: string; quantity: number }[];
};

export default function PosDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleLogout = async () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/auth/logout"
      : "/api/auth/logout";
    await fetch(apiUrl, { method: "POST" });
    window.location.href = "/login";
  };

  const fetchOrders = () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/orders/list"
      : "/api/orders/list";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setOrders(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: number, status: string) => {
    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/orders/${id}/status`
      : `/api/orders/${id}/status`;

    await fetch(apiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchOrders();
  };

  if (loading) return <div className="p-10 text-center">Memuat antrean...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* HEADER YANG SUDAH DIRAPIKAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-coffee-900">
          Dashboard Kasir (POS)
        </h1>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Antrean
          </div>

          <Link
            to="/pos/history"
            className="text-sm bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-bold hover:bg-blue-100 transition border border-blue-200"
          >
            Riwayat
          </Link>

          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-bold hover:bg-red-100 transition border border-red-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* KONTEN */}
      {orders.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm text-gray-500">
          Belum ada pesanan masuk hari ini.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-xl shadow-md border-t-4 p-5 flex flex-col ${
                order.status === "pending"
                  ? "border-red-500"
                  : "border-yellow-500"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-mono font-bold text-lg text-coffee-900">
                    {order.order_number}
                  </span>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at * 1000).toLocaleTimeString(
                      "id-ID",
                    )}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                    order.status === "pending"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="bg-coffee-50 p-3 rounded-lg mb-4 text-sm my-2 flex-grow">
                <p className="font-bold text-coffee-900 mb-1">
                  {order.order_type === "dine_in"
                    ? `Dine-in (Meja ${order.table_number})`
                    : "Take-away"}
                </p>
                <p className="text-gray-600 mb-2">
                  Oleh: {order.customer_name}
                </p>
                <ul className="list-disc pl-4 text-coffee-700">
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}x {item.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center border-t pt-4 mt-auto">
                <span className="font-bold text-coffee-900">
                  Rp {order.total_amount.toLocaleString("id-ID")}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-bold hover:bg-gray-200"
                  >
                    Struk
                  </button>

                  {order.status === "pending" ? (
                    <button
                      onClick={() => updateStatus(order.id, "preparing")}
                      className="bg-red-500 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-600"
                    >
                      Proses
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(order.id, "completed")}
                      className="bg-green-500 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-600"
                    >
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Struk */}
      {selectedOrder && (
        <PrintStruk
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
