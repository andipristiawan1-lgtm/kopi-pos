import { useState, useEffect } from "react";
import PrintStruk from "./PrintStruk";
import AddOrderModal from "./AddOrderModal";
import NewOrderModal from "./NewOrderModal";
import { Link } from "react-router-dom";

type Order = {
  id: number;
  order_number: string;
  order_type: string;
  table_number: string;
  customer_name: string;
  status: string;
  total_amount: number;
  payment_method: string;
  is_paid: boolean;
  created_at: number;
  items: {
    name: string;
    quantity: number;
    price_at_time: number;
    subtotal: number;
  }[];
};

export default function PosDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [addMenuOrderId, setAddMenuOrderId] = useState<number | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

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

  const markAsPaid = async (id: number) => {
    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/orders/${id}/pay`
      : `/api/orders/${id}/pay`;
    await fetch(apiUrl, { method: "PATCH" });
    fetchOrders();
  };

  if (loading) return <div className="p-10 text-center">Memuat antrean...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-coffee-900">
          Dashboard Kasir (POS)
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewOrderOpen(true)}
            className="text-sm bg-coffee-700 text-white px-4 py-2 rounded-full font-bold hover:bg-coffee-900 transition shadow-md"
          >
            + Pesanan Baru
          </button>
          <div className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>{" "}
            Live Antrean
          </div>
          <Link
            to="/admin"
            className="text-sm bg-coffee-50 text-coffee-700 px-4 py-1.5 rounded-full font-bold hover:bg-coffee-100 transition border border-coffee-200"
          >
            Admin
          </Link>
          <Link
            to="/pos/history"
            className="text-sm bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full font-bold hover:bg-blue-100 transition border border-blue-200"
          >
            Riwayat
          </Link>
          <Link
            to="/kitchen"
            className="text-sm bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full font-bold hover:bg-amber-100 transition border border-amber-200"
          >
            Dapur
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-bold hover:bg-red-100 transition border border-red-200"
          >
            Logout
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm text-gray-500">
          Belum ada pesanan masuk hari ini.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-xl shadow-md border-t-4 p-5 flex flex-col ${order.status === "pending" ? "border-red-500" : "border-yellow-500"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-mono font-bold text-lg text-coffee-900">
                    {order.order_number}
                  </span>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at * 1000).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded uppercase ${order.status === "pending" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="bg-coffee-50 p-3 rounded-lg mb-4 text-sm my-2 flex-grow">
                <p className="font-bold text-coffee-900 mb-1">
                  {order.order_type === "dine_in" &&
                    `Dine-in (Meja ${order.table_number})`}
                  {order.order_type === "take_away" && "Take-away"}
                  {order.order_type === "booking" &&
                    `Booking Meja ${order.table_number}`}
                </p>
                <p className="text-gray-600 mb-2">
                  Oleh: {order.customer_name}
                </p>

                {/* DAFTAR ITEM DENGAN HARGA */}
                <ul className="space-y-1 mb-3">
                  {order.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between text-coffee-800 text-xs"
                    >
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-500">
                        {item.quantity > 1 &&
                          `@${item.price_at_time.toLocaleString("id-ID")}`}
                        <span className="font-medium text-coffee-900 ml-2">
                          {item.subtotal.toLocaleString("id-ID")}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-coffee-200 pt-2 flex justify-between text-xs">
                  <span className="text-gray-500">Metode:</span>
                  <span className="font-bold uppercase text-coffee-700">
                    {order.payment_method}
                  </span>
                </div>
              </div>

              <div className="flex flex-col border-t pt-4 mt-auto gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-coffee-900">
                    Rp {order.total_amount.toLocaleString("id-ID")}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${order.is_paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {order.is_paid ? "✓ Lunas" : "Belum Bayar"}
                  </span>
                </div>
                <div className="flex gap-2 w-full mt-1">
                  <button
                    onClick={() => setAddMenuOrderId(order.id)}
                    className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded text-sm font-bold hover:bg-indigo-100 flex-1"
                  >
                    + Menu
                  </button>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-bold hover:bg-gray-200 flex-1"
                  >
                    Struk
                  </button>
                  {!order.is_paid && (
                    <button
                      onClick={() => markAsPaid(order.id)}
                      className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-bold hover:bg-blue-600 flex-1"
                    >
                      Bayar
                    </button>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  {order.status === "pending" ? (
                    <button
                      onClick={() => updateStatus(order.id, "preparing")}
                      className="bg-red-500 text-white w-full py-2 rounded text-sm font-bold hover:bg-red-600"
                    >
                      Proses
                    </button>
                  ) : order.status === "preparing" ? (
                    <button
                      onClick={() => updateStatus(order.id, "ready")}
                      className="bg-amber-500 text-slate-950 w-full py-2 rounded text-sm font-bold hover:bg-amber-600"
                    >
                      Pesanan Siap
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(order.id, "completed")}
                      className="bg-green-500 text-white w-full py-2 rounded text-sm font-bold hover:bg-green-600"
                    >
                      Selesai / Antar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <PrintStruk
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {addMenuOrderId && (
        <AddOrderModal
          orderId={addMenuOrderId}
          onClose={() => setAddMenuOrderId(null)}
          onSuccess={fetchOrders}
        />
      )}

      {isNewOrderOpen && (
        <NewOrderModal
          onClose={() => setIsNewOrderOpen(false)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
