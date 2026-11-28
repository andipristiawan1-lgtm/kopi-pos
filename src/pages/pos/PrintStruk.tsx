"use client";

import { useEffect, useState } from "react";

const BRIDGE_URL = "http://localhost:9100";

// ============================================================
// TYPES
// ============================================================
type StoreProfile = {
  name?: string;
  address?: string;
  phone?: string;
};

type HealthResponse = {
  status: string;
  version?: string;
  printer: {
    connected: boolean;
    name?: string;
    address?: string;
    problem?: string | null;
  };
};

type PrintStrukProps = {
  order: any;
  store?: StoreProfile;        // <-- BARU: dari halaman profil
  onClose: () => void;
};

// ============================================================
// DEFAULT (fallback kalau store kosong)
// ============================================================
const DEFAULT_STORE: StoreProfile = {
  name: "STRUK TRANSAKSI",
  address: "Jl. Raya Belitang No. 123",
  phone: "0812-3456-7890",
};

function resolveStore(store?: StoreProfile): Required<StoreProfile> {
  return {
    name: store?.name?.trim() || DEFAULT_STORE.name!,
    address: store?.address?.trim() || DEFAULT_STORE.address!,
    phone: store?.phone?.trim() || DEFAULT_STORE.phone!,
  };
}

// ============================================================
// FORMAT JAM — WAJIB JAKARTA
// ============================================================
function formatJakarta(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// BRIDGE API (sama seperti sebelumnya)
// ============================================================
async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function sendPrint(content: unknown[]): Promise<{ jobId?: string }> {
  const res = await fetch(`${BRIDGE_URL}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cut: true, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e: any = new Error(err.detail || `HTTP ${res.status}`);
    e.errorCode = err.error;
    e.fix = err.fix;
    throw e;
  }
  return await res.json().catch(() => ({}));
}

const ERROR_LABEL: Record<string, string> = {
  bluetooth_permission_missing: "Izin Bluetooth belum diberikan ke Cleanter",
  bluetooth_disabled: "Bluetooth HP mati",
  printer_not_connected: "Belum pilih printer di Cleanter",
  printer_not_paired: "Printer tidak ter-pairing",
  printer_unreachable: "Printer tidak merespon",
};

// ============================================================
// RECEIPT BUILDER — terima `store`
// ============================================================
function buildReceipt(order: any, store: Required<StoreProfile>): unknown[] {
  const b: unknown[] = [];

  // Header — dari store
  b.push({ type: "text", text: store.name.toUpperCase(), align: "center", bold: true, size: "large" });
  b.push({ type: "text", text: store.address, align: "center", size: "small" });
  b.push({ type: "text", text: `Telp: ${store.phone}`, align: "center", size: "small" });
  b.push({ type: "divider" });

  // Info pesanan
  b.push({ type: "row", left: "No. Pesanan", right: order.order_number || "-" });
  b.push({ type: "row", left: "Waktu", right: formatJakarta(order.created_at) });

  let tipe = "Take-away";
  if (order.order_type === "hotel") tipe = "Reservasi Kamar";
  else if (order.order_type === "booking") tipe = `Booking Aula ${order.table_number || "-"}`;
  else if (order.order_type === "dine_in") tipe = `Dine-in (Meja ${order.table_number || "-"})`;
  b.push({ type: "row", left: "Tipe", right: tipe });

  if (order.order_type === "hotel") {
    b.push({ type: "row", left: "Check-in", right: order.check_in || "-" });
    b.push({ type: "row", left: "Check-out", right: order.check_out || "-" });
    b.push({ type: "row", left: "Tamu", right: `${order.adults || 0} Dewasa, ${order.children || 0} Anak` });
  } else if (order.order_type === "booking") {
    b.push({ type: "row", left: "Tanggal", right: order.booking_date || "-" });
    b.push({ type: "row", left: "Jam Mulai", right: order.booking_time || "-" });
  }

  b.push({ type: "row", left: "Pelanggan", right: order.customer_name || "-" });
  b.push({ type: "row", left: "Status", right: order.is_paid ? "LUNAS" : "BELUM BAYAR", bold: true });
  b.push({ type: "divider" });

  (order.items || []).forEach((item: any) => {
    b.push({
      type: "row",
      left: `${item.quantity}x ${item.name}`,
      right: (item.subtotal || 0).toLocaleString("id-ID"),
    });
  });
  b.push({ type: "divider" });

  b.push({
    type: "row",
    left: "TOTAL",
    right: `Rp ${(order.total_amount || 0).toLocaleString("id-ID")}`,
    bold: true,
  });

  b.push({ type: "feed", lines: 1 });
  b.push({ type: "text", text: "Terima Kasih", align: "center", size: "small" });
  b.push({ type: "text", text: "Atas Kunjungan Anda", align: "center", size: "small" });
  b.push({ type: "feed", lines: 3 });

  return b;
}

// ============================================================
// KOMPONEN
// ============================================================
export default function PrintStruk({ order, store, onClose }: PrintStrukProps) {
  const resolved = resolveStore(store);        // <-- resolve sekali
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
    fix?: string;
    code?: string;
  } | null>(null);

  const refresh = async () => {
    setChecking(true);
    setResult(null);
    const h = await getHealth();
    setHealth(h);
    setChecking(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handlePrint = async () => {
    if (!order || printing) return;
    setPrinting(true);
    setResult(null);
    try {
      const content = buildReceipt(order, resolved);
      const res = await sendPrint(content);
      setResult({
        type: "success",
        text: `Struk tercetak${res.jobId ? ` (Job ${res.jobId.slice(0, 8)})` : ""}`,
      });
    } catch (e: any) {
      setResult({
        type: "error",
        text: ERROR_LABEL[e.errorCode] || e.message || "Gagal mencetak",
        fix: e.fix,
        code: e.errorCode,
      });
    } finally {
      setPrinting(false);
    }
  };

  if (!order) return null;

  const bridgeInstalled = !!health;
  const printerReady = !!health?.printer?.connected;
  const canPrint = bridgeInstalled && printerReady && !printing;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-xl max-h-[90vh] flex flex-col">

        {/* STATUS BAR — sama */}
        <div className="p-3 border-b bg-gray-50 text-xs">
          {checking ? (
            <p className="text-gray-500">🔄 Mengecek Cleanter...</p>
          ) : !bridgeInstalled ? (
            <div className="text-red-700">
              <p className="font-bold">❌ Cleanter tidak terdeteksi</p>
              <p className="text-gray-600 mt-1">Install Cleanter di HP Android, lalu buka halaman ini via Chrome.</p>
            </div>
          ) : printerReady ? (
            <p className="text-green-700 font-bold">✅ Siap cetak — {health?.printer.name}</p>
          ) : (
            <div className="text-red-700">
              <p className="font-bold">⚠️ {ERROR_LABEL[health?.printer.problem || ""] || "Printer belum siap"}</p>
              {health?.printer.problem && (
                <p className="text-gray-600 mt-1 font-mono text-[10px]">{health.printer.problem}</p>
              )}
            </div>
          )}
        </div>

        {/* PREVIEW — pakai `resolved` & formatJakarta */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="font-mono text-xs text-black">
            <div className="text-center mb-4">
              <h2 className="font-bold text-lg uppercase">{resolved.name}</h2>
              <p>{resolved.address}</p>
              <p>Telp: {resolved.phone}</p>
              <p className="mt-2">--------------------------------</p>
            </div>

            <div className="mb-2 space-y-1">
              <div className="flex justify-between">
                <span>No. Pesanan</span>
                <span>{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu</span>
                <span>{formatJakarta(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe</span>
                <span className="font-bold">
                  {order.order_type === "hotel" && "Reservasi Kamar"}
                  {order.order_type === "booking" && `Booking Aula ${order.table_number}`}
                  {order.order_type === "dine_in" && `Dine-in (Meja ${order.table_number})`}
                  {order.order_type === "take_away" && "Take-away"}
                </span>
              </div>
              {order.order_type === "hotel" && (
                <>
                  <div className="flex justify-between">
                    <span>Check-in</span>
                    <span>{order.check_in || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-out</span>
                    <span>{order.check_out || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamu</span>
                    <span>{order.adults} Dewasa, {order.children} Anak</span>
                  </div>
                </>
              )}
              {order.order_type === "booking" && (
                <>
                  <div className="flex justify-between">
                    <span>Tanggal</span>
                    <span>{order.booking_date || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jam Mulai</span>
                    <span>{order.booking_time || "-"}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Pelanggan</span>
                <span>{order.customer_name}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t mt-2">
                <span>Status</span>
                <span className={order.is_paid ? "text-green-700" : "text-red-600"}>
                  {order.is_paid ? "LUNAS" : "BELUM BAYAR"}
                </span>
              </div>
            </div>

            <p className="mb-2">--------------------------------</p>

            <div className="mb-3 space-y-1">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{item.subtotal.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>

            <p className="mb-2">--------------------------------</p>

            <div className="flex justify-between font-bold text-base mb-4">
              <span>TOTAL</span>
              <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
            </div>

            <p className="text-center mt-4">Terima Kasih</p>
            <p className="text-center">Atas Kunjungan Anda</p>
          </div>
        </div>

        {result && (
          <div
            className={`mx-4 mb-2 p-3 rounded text-xs ${
              result.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <p className="font-bold">
              {result.type === "success" ? "✅" : "❌"} {result.text}
            </p>
            {result.fix && <p className="mt-1 text-gray-700">💡 {result.fix}</p>}
          </div>
        )}

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded font-bold hover:bg-gray-200"
          >
            Tutup
          </button>
          {!printerReady && bridgeInstalled && (
            <button
              onClick={refresh}
              className="px-4 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600"
            >
              🔄
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={!canPrint}
            className="flex-1 px-4 py-2 text-white bg-coffee-500 rounded font-bold hover:bg-coffee-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {printing ? <>⏳ Mencetak...</> : <>🖨️ Cetak</>}
          </button>
        </div>
      </div>
    </div>
  );
}