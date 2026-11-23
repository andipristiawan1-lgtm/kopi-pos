import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [waNumber, setWaNumber] = useState("");
  const [copiedText, setCopiedText] = useState("");

  useEffect(() => {
    // 1. Ambil detail order
    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/orders/${orderNumber}`
      : `/api/orders/${orderNumber}`;
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setOrderData(data.data);
      })
      .catch((err) => console.error(err));

    // 2. Ambil pengaturan toko
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
  }, [orderNumber]);

  // Fungsi copy ke clipboard
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(type);
      setTimeout(() => setCopiedText(""), 2000);
    });
  };

  const sendToWhatsApp = () => {
    if (!waNumber) return alert("Nomor WA Admin belum diatur.");

    let message = `*PESANAN BARU - WARUNG KOPI*\n\n`;
    message += `No. Pesanan: *${orderNumber}*\n`;

    if (orderData) {
      message += `Nama: ${orderData.customer_name}\n`;
      message += `Tipe: ${orderData.order_type === "dine_in" ? `Dine-in (Meja ${orderData.table_number})` : "Take-away"}\n`;
      message += `Metode Bayar: ${orderData.payment_method.toUpperCase()}\n\n`;

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

  // HANYA TUNGGU orderData. Ini kunci perbaikannya.
  if (!orderData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        Memuat rincian pesanan...
      </div>
    );
  }

  // Fallback untuk settings
  const store = settings || {
    bank_name: "Memuat...",
    bank_account: "-",
    bank_owner: "-",
    ewallet_name: "Memuat...",
    ewallet_number: "-",
    qris_url: "",
  };

  const totalTagihan = orderData.total_amount;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full border-t-4 border-green-500">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-coffee-900 mb-2">
          Pesanan Berhasil!
        </h1>
        <p className="text-gray-600 mb-6">
          Silakan selesaikan pembayaran Anda.
        </p>

        <div className="bg-coffee-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-coffee-700 mb-1">Nomor Pesanan:</p>
          <p className="text-xl font-mono font-bold text-coffee-900">
            {orderNumber}
          </p>
        </div>

        {/* DETAIL PEMBAYARAN */}
        {orderData.payment_method !== "cash" ? (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 mb-6 text-left overflow-hidden">
            <div className="bg-yellow-100 p-3 border-b border-yellow-200">
              <p className="text-xs text-yellow-800 font-medium">
                Total yang harus dibayar:
              </p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-2xl font-bold text-yellow-900">
                  Rp {totalTagihan.toLocaleString("id-ID")}
                </p>
                <button
                  onClick={() => handleCopy(totalTagihan.toString(), "nominal")}
                  className="text-xs bg-white text-yellow-800 px-2 py-1 rounded border border-yellow-300 font-bold hover:bg-yellow-50"
                >
                  {copiedText === "nominal" ? "✓ Tersalin" : "Copy Nominal"}
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                *Termasuk kode unik <strong>{orderData.unique_code}</strong>
              </p>
            </div>

            <div className="p-4">
              <p className="text-sm font-bold text-gray-800 mb-2">
                Tujuan{" "}
                {orderData.payment_method === "transfer"
                  ? "Transfer"
                  : orderData.payment_method === "ewallet"
                    ? "E-Wallet"
                    : "QRIS"}
                :
              </p>

              {orderData.payment_method === "transfer" && (
                <div>
                  <p className="text-sm">
                    Bank: <strong>{store.bank_name}</strong>
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-lg font-mono font-bold text-gray-900">
                      {store.bank_account}
                    </p>
                    <button
                      onClick={() => handleCopy(store.bank_account, "rekening")}
                      className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded font-bold hover:bg-gray-300"
                    >
                      {copiedText === "rekening"
                        ? "✓ Tersalin"
                        : "Copy No. Rek"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A/N: {store.bank_owner}
                  </p>
                </div>
              )}

              {orderData.payment_method === "ewallet" && (
                <div>
                  <p className="text-sm">
                    E-Wallet: <strong>{store.ewallet_name}</strong>
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-lg font-mono font-bold text-gray-900">
                      {store.ewallet_number}
                    </p>
                    <button
                      onClick={() =>
                        handleCopy(store.ewallet_number, "ewallet")
                      }
                      className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded font-bold hover:bg-gray-300"
                    >
                      {copiedText === "ewallet" ? "✓ Tersalin" : "Copy No. HP"}
                    </button>
                  </div>
                </div>
              )}

              {orderData.payment_method === "qris" && store.qris_url && (
                <div className="text-center mt-2">
                  <img
                    src={store.qris_url}
                    alt="QRIS"
                    className="w-48 h-48 object-contain mx-auto border rounded bg-white p-2"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <p className="text-blue-800 text-sm font-medium">
              Silakan bayar langsung di kasir sebesar <br />
              <strong className="text-xl">
                Rp {totalTagihan.toLocaleString("id-ID")}
              </strong>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={sendToWhatsApp}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition flex justify-center items-center gap-2"
          >
            <span>💬</span> Konfirmasi ke WhatsApp Admin
          </button>

          <Link
            to="/menu"
            className="block w-full text-coffee-600 hover:text-coffee-900 font-medium underline py-2"
          >
            Pesan Lagi
          </Link>
        </div>
      </div>
    </div>
  );
}
