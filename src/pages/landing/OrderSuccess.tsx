import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [waNumber, setWaNumber] = useState("");
  const [copiedText, setCopiedText] = useState("");

  useEffect(() => {
    if (!orderNumber) return;

    try {
      const stored = JSON.parse(
        localStorage.getItem("warung_order_history") || "[]",
      );
      const nextHistory = [orderNumber, ...(Array.isArray(stored) ? stored : [])]
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 20);
      localStorage.setItem("warung_order_history", JSON.stringify(nextHistory));
    } catch {
      localStorage.setItem("warung_order_history", JSON.stringify([orderNumber]));
    }

    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/orders/${orderNumber}`
      : `/api/orders/${orderNumber}`;
    const fetchOrder = () => {
      fetch(apiUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Pesanan tidak ditemukan");
          return res.json();
        })
        .then((data) => {
          if (data.data) setOrderData(data.data);
        })
        .catch((err) => console.error(err));
    };

    fetchOrder();
    const interval = window.setInterval(fetchOrder, 5000);

    return () => clearInterval(interval);
  }, [orderNumber]);

  useEffect(() => {
    const settingsUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    fetch(settingsUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setSettings(data.data);
          if (data.data.wa_admin) setWaNumber(data.data.wa_admin);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(type);
      setTimeout(() => setCopiedText(""), 2000);
    });
  };

  const sendToWhatsApp = () => {
    if (!waNumber) return alert("Nomor WA Admin belum diatur.");
    let message = `*PESANAN BARU - WARUNG KOPI*\n\nNo. Pesanan: *${orderNumber}*\n`;
    if (orderData) {
      message += `Nama: ${orderData.customer_name}\nTipe: ${
        orderData.order_type === "dine_in"
          ? `Dine-in (Meja ${orderData.table_number})`
          : "Take-away"
      }\nMetode Bayar: ${orderData.payment_method.toUpperCase()}\n\n`;
      message += `*Rincian Pesanan:*\n`;
      orderData.items.forEach((item: any) => {
        message += `- ${item.quantity}x ${item.name}\n`;
      });
      message += `\n*Total: Rp ${orderData.total_amount.toLocaleString("id-ID")}*\n`;
      if (orderData.payment_method !== "cash" && orderData.unique_code > 0) {
        message += `_(Termasuk kode unik: ${orderData.unique_code})_\n`;
      }
    } else {
      message += `\n(Mohon cek dashboard kasir untuk rincian lengkap)\n`;
    }
    message += `\nMohon konfirmasi pesanan saya. Terima kasih!`;
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  if (!orderData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        Memuat rincian pesanan...
      </div>
    );
  }

  const store = settings || {
    bank_name: "Memuat...",
    bank_account: "-",
    bank_owner: "-",
    ewallet_name: "Memuat...",
    ewallet_number: "-",
    qris_url: "",
  };
  const totalTagihan = orderData.total_amount;
  const statusLabels: Record<string, string> = {
    pending: "Pesanan Diterima",
    preparing: "Sedang Diproses",
    ready: "Pesanan Siap",
    completed: "Pesanan Selesai",
    cancelled: "Pesanan Dibatalkan",
  };
  const statusLabel = statusLabels[orderData.status] || orderData.status;

  const paymentLabel = orderData.is_paid
    ? "Pembayaran Lunas"
    : orderData.payment_method === "cash"
      ? "Belum Dibayar - Bayar di Kasir"
      : "Menunggu Pembayaran";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 py-12 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header Status */}
        <div className="bg-green-500 p-6 text-center text-white">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-1">Pesanan Berhasil!</h1>
          <p className="text-green-100 text-sm">
            Terima kasih, pesanan Anda telah kami terima.
          </p>
        </div>

        <div className="p-6">
          {/* Nomor Pesanan */}
          <div className="bg-gray-100 rounded-lg p-4 text-center mb-6 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Nomor Pesanan</p>
            <p className="text-xl font-mono font-bold text-gray-800 tracking-wider">
              {orderNumber}
            </p>
          </div>

          {/* DETAIL PEMBAYARAN (Modern & Ringkas) */}
          {orderData.payment_method !== "cash" ? (
            <div className="border border-yellow-300 rounded-xl overflow-hidden mb-6">
              <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200 flex justify-between items-center">
                <div>
                  <p className="text-xs text-yellow-700 font-medium">
                    Total Tagihan
                  </p>
                  <p className="text-xl font-bold text-yellow-900">
                    Rp {totalTagihan.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-yellow-600 mt-1">
                    Termasuk kode unik{" "}
                    <span className="font-bold">{orderData.unique_code}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(totalTagihan.toString(), "nominal")}
                  className="bg-white text-yellow-800 text-xs px-3 py-1.5 rounded-md border border-yellow-300 font-bold hover:bg-yellow-100 transition"
                >
                  {copiedText === "nominal" ? "✓ Tersalin" : "Copy"}
                </button>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Tujuan{" "}
                  {orderData.payment_method === "transfer"
                    ? "Transfer"
                    : orderData.payment_method === "ewallet"
                      ? "E-Wallet"
                      : "QRIS"}
                </p>

                {orderData.payment_method === "transfer" && (
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">{store.bank_name}</p>
                      <p className="text-base font-bold text-gray-800 font-mono">
                        {store.bank_account}
                      </p>
                      <p className="text-xs text-gray-500">
                        A/N {store.bank_owner}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(store.bank_account, "rekening")}
                      className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-md font-bold hover:bg-gray-300 transition"
                    >
                      {copiedText === "rekening" ? "✓ Tersalin" : "Copy"}
                    </button>
                  </div>
                )}

                {orderData.payment_method === "ewallet" && (
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">
                        {store.ewallet_name}
                      </p>
                      <p className="text-base font-bold text-gray-800 font-mono">
                        {store.ewallet_number}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(store.ewallet_number, "ewallet")
                      }
                      className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-md font-bold hover:bg-gray-300 transition"
                    >
                      {copiedText === "ewallet" ? "✓ Tersalin" : "Copy"}
                    </button>
                  </div>
                )}

                {orderData.payment_method === "qris" && store.qris_url && (
                  <div className="text-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <img
                      src={store.qris_url}
                      alt="QRIS"
                      className="w-40 h-40 object-contain mx-auto border rounded-lg bg-white p-2"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-blue-700 mb-1">Pembayaran Tunai</p>
              <p className="text-xl font-bold text-blue-900">
                Rp {totalTagihan.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Silakan bayar langsung di kasir.
              </p>
            </div>
          )}

          {/* Status Live */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl border border-green-200 bg-green-50 p-3">
              <p className="text-xs text-green-700 font-medium">Status Pembayaran</p>
              <p className="text-sm font-bold text-green-900 mt-1">{paymentLabel}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-700 font-medium">Status Pesanan</p>
              <p className="text-sm font-bold text-blue-900 mt-1">{statusLabel}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={sendToWhatsApp}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition flex justify-center items-center gap-2 shadow-sm"
            >
              <span>💬</span> Konfirmasi ke WhatsApp Admin
            </button>
            <Link
              to="/menu"
              className="block w-full text-center text-gray-500 hover:text-gray-800 text-sm font-medium py-2"
            >
              Pesan Lagi
            </Link>
            <Link
              to="/order/history"
              className="block w-full text-center text-coffee-600 hover:text-coffee-900 text-sm font-bold py-2"
            >
              Lihat Riwayat Pesanan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
