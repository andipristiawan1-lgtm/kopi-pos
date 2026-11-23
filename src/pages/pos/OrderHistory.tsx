import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

type OrderItem = { name: string; quantity: number };
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
  items: OrderItem[];
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // State Filter & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      status: status,
      search: search,
    });

    if (startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }

    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/orders/history?${params}`
      : `/api/orders/history?${params}`;

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setOrders(data.data);
          setTotalPages(data.meta.totalPages);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [page, status, startDate, endDate]);

  // Handle Pencarian (Enter)
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1); // Reset ke halaman 1 setiap kali mencari
      fetchHistory();
    }
  };

  const handleStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-red-100 text-red-700",
      preparing: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[status] || styles.cancelled}`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">
            Riwayat Pesanan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Lacak semua transaksi warung Anda.
          </p>
        </div>
        <Link
          to="/pos"
          className="bg-coffee-100 text-coffee-700 px-4 py-2 rounded-lg font-bold hover:bg-coffee-200 transition text-sm"
        >
          ← Kembali ke POS
        </Link>
      </div>

      {/* Area Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-coffee-100 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Cari No. Pesanan / Nama
          </label>
          <input
            type="text"
            placeholder="Ketik lalu Enter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-coffee-500 focus:border-coffee-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg p-2 text-sm"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Diproses</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Batal</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm"
          />
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl shadow-sm border border-coffee-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-coffee-50 text-coffee-900 text-sm border-b border-coffee-100">
              <tr>
                <th className="p-4 font-bold">No. Pesanan</th>
                <th className="p-4 font-bold">Waktu</th>
                <th className="p-4 font-bold">Pelanggan</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Bayar</th>
                <th className="p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Tidak ada riwayat pesanan yang cocok.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <>
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="p-4 font-mono text-sm font-medium">
                        {order.order_number}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="p-4 text-sm">
                        <p className="font-medium text-gray-900">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.order_type === "dine_in"
                            ? `Meja ${order.table_number}`
                            : "Take-away"}
                        </p>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900">
                        Rp {order.total_amount.toLocaleString("id-ID")}
                      </td>
                      <td className="p-4">{handleStatusBadge(order.status)}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-bold ${order.is_paid ? "text-green-600" : "text-red-600"}`}
                        >
                          {order.is_paid ? "✓ Lunas" : "Belum"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === order.id ? null : order.id,
                            )
                          }
                          className="text-blue-500 hover:underline text-sm font-medium"
                        >
                          {expandedRow === order.id ? "Tutup" : "Detail"}
                        </button>
                      </td>
                    </tr>
                    {/* Baris Detail (Expand) */}
                    {expandedRow === order.id && (
                      <tr className="bg-blue-50/50">
                        <td
                          colSpan={7}
                          className="p-4 border-b border-blue-100"
                        >
                          <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm inline-block min-w-[300px]">
                            <h4 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">
                              Rincian Menu:
                            </h4>
                            <ul className="space-y-1">
                              {order.items.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-gray-600 flex justify-between gap-8"
                                >
                                  <span>
                                    {item.quantity}x {item.name}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                              Metode Pembayaran:{" "}
                              <span className="uppercase font-bold text-gray-700">
                                {order.payment_method}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 p-4 border-t border-coffee-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Halaman {page} dari {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
