import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
};

type CartItem = MenuItem & { quantity: number };

export default function Order() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "take_away">(
    "dine_in",
  );
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash"); // State baru
  const [settings, setSettings] = useState<any>(null); // State baru untuk info rekening
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Ambil data menu dan pengaturan
  useEffect(() => {
    const apiUrlMenu = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/menu"
      : "/api/menu";
    const apiUrlSettings = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";

    fetch(apiUrlMenu)
      .then((res) => res.json())
      .then((data) => setMenu(data.data))
      .catch(() => setError("Gagal memuat menu."));

    fetch(apiUrlSettings)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setSettings(data.data);
      })
      .catch((err) => console.error("Gagal memuat info pembayaran", err));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return setError("Keranjang masih kosong.");
    if (orderType === "dine_in" && !tableNumber)
      return setError("Nomor meja wajib diisi.");

    setIsSubmitting(true);
    setError("");

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://127.0.0.1:8788/api/orders"
        : "/api/orders";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableNumber,
          customerName,
          paymentMethod, // Kirim metode pembayaran ke backend
          items: cart.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memesan");

      navigate(`/order/success/${result.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
      {/* Kolom Kiri: Daftar Menu */}
      <div className="md:col-span-2">
        <h1 className="text-3xl font-bold text-coffee-900 mb-6">Pesan Menu</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          {menu.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-coffee-100 flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-coffee-900">{item.name}</h3>
                <p className="text-coffee-500 text-sm">
                  Rp {item.price.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => addToCart(item)}
                className="bg-coffee-100 text-coffee-700 w-10 h-10 rounded-full font-bold hover:bg-coffee-500 hover:text-white transition"
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Kolom Kanan: Keranjang & Form */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-coffee-100 h-fit sticky top-24">
        <h2 className="text-xl font-bold text-coffee-900 mb-4 border-b pb-2">
          Keranjang
        </h2>

        {cart.length === 0 ? (
          <p className="text-gray-400 text-sm mb-4">
            Belum ada item yang dipilih.
          </p>
        ) : (
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-semibold text-coffee-900">{item.name}</p>
                  <p className="text-gray-500">
                    {item.quantity} x Rp {item.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-coffee-900">
              <span>Total</span>
              <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-900 mb-1">
              Tipe Pesanan
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="dine_in">Makan di Tempat (Dine-in)</option>
              <option value="take_away">Bungkus (Take-away)</option>
            </select>
          </div>

          {orderType === "dine_in" && (
            <div>
              <label className="block text-sm font-medium text-coffee-900 mb-1">
                Nomor Meja
              </label>
              <input
                type="text"
                placeholder="Contoh: 05"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-coffee-900 mb-1">
              Nama Anda
            </label>
            <input
              type="text"
              placeholder="Opsional"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>

          {/* METODE PEMBAYARAN */}
          <div>
            <label className="block text-sm font-medium text-coffee-900 mb-2">
              Metode Pembayaran
            </label>
            <div className="space-y-2 text-sm">
              {[
                { id: "cash", label: "Tunai (Bayar di Kasir)" },
                { id: "transfer", label: "Transfer Bank" },
                { id: "ewallet", label: "E-Wallet (GoPay/OVO/Dana)" },
                { id: "qris", label: "QRIS (Scan)" },
              ].map((method) => (
                <label
                  key={method.id}
                  className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* INFORMASI PEMBAYARAN (Hanya tampil jika bukan Cash) */}
          {paymentMethod !== "cash" && settings && (
            <div className="bg-coffee-50 p-4 rounded-lg border border-coffee-200 mt-2">
              <p className="font-bold text-coffee-900 mb-2 text-sm">
                Silakan Bayar Ke:
              </p>

              {paymentMethod === "transfer" && (
                <div className="text-sm">
                  <p>
                    Bank: <strong>{settings.bank_name || "-"}</strong>
                  </p>
                  <p>
                    No. Rek: <strong>{settings.bank_account || "-"}</strong>
                  </p>
                  <p>A/N: {settings.bank_owner || "-"}</p>
                </div>
              )}
              {paymentMethod === "ewallet" && (
                <div className="text-sm">
                  <p>
                    E-Wallet: <strong>{settings.ewallet_name || "-"}</strong>
                  </p>
                  <p>
                    No. HP: <strong>{settings.ewallet_number || "-"}</strong>
                  </p>
                </div>
              )}
              {paymentMethod === "qris" && settings.qris_url && (
                <div className="text-center mt-2">
                  <img
                    src={settings.qris_url}
                    alt="QRIS"
                    className="w-40 h-40 object-contain mx-auto border rounded"
                  />
                </div>
              )}
              <p className="text-red-600 font-bold mt-3 text-xs">
                *Sistem akan menambahkan 3 angka unik pada total akhir untuk
                mempermudah verifikasi.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0}
            className="w-full bg-coffee-500 text-white py-3 rounded-lg font-bold hover:bg-coffee-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Memproses..." : "Buat Pesanan"}
          </button>
        </form>
      </div>
    </div>
  );
}
