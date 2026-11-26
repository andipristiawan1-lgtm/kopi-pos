import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type PaymentLog = {
  id: number;
  dedup_key: string;
  source_app: string | null;
  app_name: string | null;
  notification_title: string | null;
  raw_message: string;
  extracted_amount: number | null;
  notification_time: number | null;
  status: "pending" | "matched" | "ignored" | "manual" | "duplicate" | "expired";
  matched_order_id: number | null;
  received_at: number;
  processed_at: number | null;
};

const statusStyle: Record<string, string> = {
  matched: "bg-green-100 text-green-700",
  manual: "bg-amber-100 text-amber-700",
  ignored: "bg-slate-100 text-slate-600",
  pending: "bg-blue-100 text-blue-700",
  duplicate: "bg-purple-100 text-purple-700",
  expired: "bg-red-100 text-red-700",
};

export default function PaymentLogs() {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [orderId, setOrderId] = useState("");

  const apiUrl = import.meta.env.DEV
    ? "http://127.0.0.1:8788/api/admin/payments"
    : "/api/admin/payments";

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await fetch(`${apiUrl}${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal memuat log");
      setLogs(Array.isArray(data.data) ? data.data : []);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Gagal memuat log pembayaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [statusFilter]);

  const processLog = async (action: "match" | "ignore", targetOrderId = "") => {
    setMessage("");
    try {
      const body: any = { logId: selectedLog?.id, action };
      if (action === "match") body.orderId = Number(targetOrderId);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal memproses log");

      setMessage(action === "ignore" ? "Log pembayaran diabaikan." : `Pesanan ${data.orderNumber} ditandai lunas.`);
      setSelectedLog(null);
      setOrderId("");
      await fetchLogs();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Gagal memproses log pembayaran");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/admin" className="text-coffee-600 hover:underline text-sm mb-6 block">
        ← Kembali ke Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900">Log Pembayaran</h1>
          <p className="text-gray-500">Notifikasi pembayaran masuk dari MacroDroid.</p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 px-3 border rounded-lg bg-white text-sm"
        >
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="matched">Matched</option>
          <option value="manual">Manual</option>
          <option value="ignored">Ignored</option>
          <option value="duplicate">Duplicate</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-coffee-50 border border-coffee-100 text-coffee-800 text-sm">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500">Matched Otomatis</p>
          <p className="text-2xl font-black text-green-700">{logs.filter((log) => log.status === "matched").length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500">Perlu Verifikasi</p>
          <p className="text-2xl font-black text-amber-700">{logs.filter((log) => log.status === "manual").length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500">Pesan Masuk</p>
          <p className="text-2xl font-black text-coffee-900">{logs.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-coffee-50 border-b">
            <tr>
              <th className="p-4">Waktu</th>
              <th className="p-4">Aplikasi</th>
              <th className="p-4">Nominal</th>
              <th className="p-4">Pesan</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Memuat log pembayaran...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada notifikasi pembayaran.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-slate-50 align-top">
                <td className="p-4 whitespace-nowrap text-sm">{new Date(log.received_at * 1000).toLocaleString("id-ID")}</td>
                <td className="p-4"><p className="font-bold text-sm">{log.app_name || "-"}</p><p className="text-xs text-gray-400">{log.source_app || "-"}</p></td>
                <td className="p-4 font-bold text-coffee-800">{log.extracted_amount ? `Rp ${log.extracted_amount.toLocaleString("id-ID")}` : "Tidak terbaca"}</td>
                <td className="p-4 max-w-xs"><p className="text-xs text-slate-600 line-clamp-3">{log.raw_message}</p></td>
                <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyle[log.status] || "bg-slate-100 text-slate-600"}`}>{log.status}</span></td>
                <td className="p-4 text-right">
                  {(log.status === "manual" || log.status === "pending" || log.status === "ignored") && (
                    <button type="button" onClick={() => { setSelectedLog(log); setOrderId(""); }} className="text-blue-600 text-xs font-bold">Verifikasi</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div><h2 className="text-xl font-bold text-coffee-900">Verifikasi Pembayaran</h2><p className="text-xs text-gray-500 mt-1">{selectedLog.app_name || "Notifikasi"}</p></div>
              <button type="button" onClick={() => setSelectedLog(null)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-xl">×</button>
            </div>
            <div className="bg-slate-50 border rounded-xl p-3 mb-4"><p className="text-sm text-slate-700 break-words">{selectedLog.raw_message}</p></div>
            <label className="block text-sm font-bold mb-2">ID Pesanan</label>
            <input type="number" min="1" value={orderId} onChange={(event) => setOrderId(event.target.value)} className="w-full h-11 px-3 border rounded-lg mb-4" placeholder="Masukkan ID pesanan" />
            <p className="text-xs text-amber-700 mb-4">Pencocokan manual hanya berlaku untuk pesanan yang dibuat maksimal 24 jam terakhir.</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => processLog("ignore")} className="h-12 rounded-xl border border-slate-300 text-slate-700 font-bold">Abaikan</button>
              <button type="button" onClick={() => processLog("match", orderId)} disabled={!orderId} className="h-12 rounded-xl bg-coffee-700 text-white font-bold disabled:opacity-40">Tandai Lunas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
