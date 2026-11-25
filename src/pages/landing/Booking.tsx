import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

type MenuItem = { id: number; name: string; price: number };
type CartItem = MenuItem & { quantity: number };

export default function Booking() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookingInfo, setBookingInfo] = useState<any>(null);

  const [form, setForm] = useState({
    tableNumber: "",
    customerName: "",
    customerPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Fetch Status Booking (Aktif/Mati & Batas Waktu)
    const apiStatus = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/booking/status"
      : "/api/booking/status";
    fetch(apiStatus)
      .then((res) => res.json())
      .then((data) => setBookingInfo(data));

    // 2. Fetch Meja
    const apiUrlTables = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/tables"
      : "/api/tables";
    fetch(apiUrlTables)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTables(data.data);
      });

    // 3. Fetch Menu
    const apiUrlMenu = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/menu"
      : "/api/menu";
    fetch(apiUrlMenu)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setMenu(data.data);
      });
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing)
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const totalMenu = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tableNumber) return setError("Pilih meja terlebih dahulu.");

    setLoading(true);
    setError("");
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://127.0.0.1:8788/api/booking"
        : "/api/booking";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate(`/order/success/${data.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // TAMPILKAN PESAN JIKA FITUR BOOKING DIMATIKAN
  if (bookingInfo && !bookingInfo.isEnabled) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Booking Sedang Ditutup
        </h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Mohon maaf, pemilik warung sedang menonaktifkan fitur booking untuk
          sementara waktu. Silakan pesan langsung di tempat.
        </p>
        <Link
          to="/order"
          className="bg-coffee-600 text-white px-8 py-3 rounded-full font-bold hover:bg-coffee-700 transition"
        >
          Pesan Online
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
      {/* KIRI: PILIH MENU (OPSIONAL) */}
      <div>
        <h2 className="text-xl font-bold text-coffee-900 mb-4">
          Pesan Menu (Opsional)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Anda bisa memesan menu sekarang agar saat datang tidak perlu antre
          pesan lagi.
        </p>
        <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
          {menu.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3 rounded-xl shadow-sm border border-coffee-100 flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-coffee-900 text-sm">
                  {item.name}
                </h3>
                <p className="text-coffee-500 text-xs">
                  Rp {item.price.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => addToCart(item)}
                className="bg-coffee-100 text-coffee-700 w-8 h-8 rounded-full font-bold hover:bg-coffee-500 hover:text-white transition"
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* KANAN: FORM BOOKING & KERANJANG */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-coffee-500 h-fit sticky top-24">
        <h1 className="text-2xl font-bold text-coffee-900 mb-2 text-center">
          Form Booking
        </h1>

        {/* Info Batas Waktu */}
        {bookingInfo && (
          <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-xs text-blue-800 mb-4 text-center">
            ⏱️ Batas waktu booking:{" "}
            <strong>{bookingInfo.timeLimit} menit</strong>.
          </div>
        )}

        {cart.length > 0 && (
          <div className="mb-6 bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-sm text-gray-700 mb-2">
              Pesanan Menu:
            </h3>
            <ul className="space-y-2 mb-2">
              {cart.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between text-xs text-gray-600"
                >
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t pt-2 flex justify-between font-bold text-sm">
              <span>Subtotal Menu:</span>
              <span>Rp {totalMenu.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Meja</label>
            <select
              required
              value={form.tableNumber}
              onChange={(e) =>
                setForm({ ...form, tableNumber: e.target.value })
              }
              className="w-full border p-2 rounded-lg text-sm"
            >
              <option value="">-- Pilih Meja --</option>
              {tables.map((t) => (
                <option
                  key={t.id}
                  value={t.table_number}
                  disabled={t.status !== "available" || !t.is_bookable}
                >
                  Meja {t.table_number}{" "}
                  {t.status !== "available"
                    ? "(Sudah Dibooking)"
                    : !t.is_bookable
                      ? "(Tidak Bisa Booking)"
                      : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama Anda</label>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
              className="w-full border p-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              No. WhatsApp
            </label>
            <input
              type="tel"
              required
              value={form.customerPhone}
              onChange={(e) =>
                setForm({ ...form, customerPhone: e.target.value })
              }
              className="w-full border p-2 rounded-lg text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coffee-500 text-white py-3 rounded-lg font-bold hover:bg-coffee-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Booking & Bayar DP"}
          </button>
        </form>
      </div>
    </div>
  );
}
