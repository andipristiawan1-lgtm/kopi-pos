import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [waNumber, setWaNumber] = useState("");

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

    // 2. Ambil nomor WA Admin dari database (Pengaturan Toko)
    const settingsUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    fetch(settingsUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.wa_admin) {
          setWaNumber(data.data.wa_admin);
        }
      })
      .catch((err) => console.error(err));
  }, [orderNumber]);

  const sendToWhatsApp = () => {
    if (!orderData || !waNumber) return;

    // Buat pesan terstruktur
    let message = `*PESANAN BARU - WARUNG KOPI*\n\n`;
    message += `No. Pesanan: *${orderData.order_number}*\n`;
    message += `Nama: ${orderData.customer_name}\n`;
    message += `Tipe: ${orderData.order_type === "dine_in" ? `Dine-in (Meja ${orderData.table_number})` : "Take-away"}\n\n`;
    message += `*Rincian Pesanan:*\n`;

    orderData.items.forEach((item: any) => {
      message += `- ${item.quantity}x ${item.name}\n`;
    });

    message += `\n*Total: Rp ${orderData.total_amount.toLocaleString("id-ID")}*\n`;
    message += `\nMohon konfirmasi pesanan saya. Terima kasih!`;

    // Encode pesan ke format URL
    const encodedMessage = encodeURIComponent(message);

    // Buka WhatsApp
    window.open(`https://wa.me/${waNumber}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full border-t-4 border-green-500">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-coffee-900 mb-2">
          Pesanan Berhasil!
        </h1>
        <p className="text-gray-600 mb-6">
          Pesanan Anda sedang diproses oleh kasir kami.
        </p>

        <div className="bg-coffee-50 p-4 rounded-lg mb-8">
          <p className="text-sm text-coffee-700 mb-1">Nomor Pesanan Anda:</p>
          <p className="text-xl font-mono font-bold text-coffee-900">
            {orderNumber}
          </p>
        </div>

        <div className="space-y-4">
          {/* Tombol Kirim ke WA */}
          <button
            onClick={sendToWhatsApp}
            disabled={!orderData || !waNumber}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <span>💬</span> Kirim Rincian ke WA Admin
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
