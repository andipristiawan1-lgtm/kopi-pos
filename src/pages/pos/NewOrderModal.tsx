import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
};

type CartItem = MenuItem & { quantity: number };

type Table = {
  id: number;
  table_number: string;
  status: string;
  is_bookable: number;
};

export default function NewOrderModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fallbackImage, setFallbackImage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [orderType, setOrderType] = useState<"dine_in" | "take_away">("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [payNow, setPayNow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const apiMenu = import.meta.env.DEV ? "http://127.0.0.1:8788/api/menu" : "/api/menu";
    const apiTables = import.meta.env.DEV ? "http://127.0.0.1:8788/api/tables" : "/api/tables";
    const apiSettings = import.meta.env.DEV ? "http://127.0.0.1:8788/api/settings" : "/api/settings";

    Promise.all([fetch(apiMenu), fetch(apiTables), fetch(apiSettings)])
      .then(async ([menuRes, tablesRes, settingsRes]) => {
        const menuData = await menuRes.json();
        const tablesData = await tablesRes.json();
        setMenu(Array.isArray(menuData.data) ? menuData.data : []);
        setTables(Array.isArray(tablesData.data) ? tablesData.data : []);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setFallbackImage(settingsData.data?.menu_fallback_image_url || "");
        }
      })
      .catch(() => setError("Gagal memuat data POS."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(menu.map((item) => item.category)))],
    [menu],
  );

  const filteredMenu = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return menu.filter((item) => {
      const matchesCategory = category === "Semua" || item.category === category;
      const matchesSearch = !keyword || item.name.toLowerCase().includes(keyword);
      return matchesCategory && matchesSearch;
    });
  }, [menu, search, category]);

  const addItem = (item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((entry) => entry.id === item.id);
      if (found) {
        return prev.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const changeQuantity = (id: number, delta: number) => {
    setCart((prev) => prev
      .map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
      .filter((item) => item.quantity > 0));
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((item) => item.id !== id));

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const submitOrder = async () => {
    setError("");
    if (orderType === "dine_in" && !tableNumber) {
      setError("Pilih nomor meja terlebih dahulu.");
      return;
    }
    if (cart.length === 0) {
      setError("Pilih minimal satu menu.");
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = import.meta.env.DEV
        ? "http://127.0.0.1:8788/api/orders"
        : "/api/orders";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          tableNumber: orderType === "dine_in" ? tableNumber : null,
          customerName: customerName.trim() || "Pelanggan",
          paymentMethod,
          isPaid: payNow,
          items: cart.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal membuat pesanan");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat pesanan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/55 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-slate-50 w-full sm:max-w-7xl h-[98vh] sm:h-[94vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="h-16 px-4 md:px-6 bg-white border-b flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-coffee-900">Pesanan Baru</h2>
            <p className="text-xs text-slate-500">Input pesanan langsung kasir</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 text-2xl" aria-label="Tutup">×</button>
        </div>

        {error && <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm shrink-0">{error}</div>}

        <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-h-0 flex flex-col">
            <div className="bg-white border-b p-3 md:p-4 space-y-3">
              <div className="lg:hidden grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setOrderType("dine_in")} className={`h-10 rounded-lg text-sm font-bold ${orderType === "dine_in" ? "bg-coffee-700 text-white" : "bg-slate-100 text-slate-600"}`}>Dine-in</button>
                <button type="button" onClick={() => { setOrderType("take_away"); setTableNumber(""); }} className={`h-10 rounded-lg text-sm font-bold ${orderType === "take_away" ? "bg-coffee-700 text-white" : "bg-slate-100 text-slate-600"}`}>Take-away</button>
              </div>
              {orderType === "dine_in" && (
                <select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="lg:hidden w-full h-10 px-3 rounded-lg border border-slate-200 text-sm">
                  <option value="">Pilih meja tersedia</option>
                  {tables.map((table) => <option key={table.id} value={table.table_number} disabled={table.status !== "available"}>{`Meja ${table.table_number}${table.status !== "available" ? " (Tidak tersedia)" : ""}`}</option>)}
                </select>
              )}
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pelanggan (opsional)" className="lg:hidden w-full h-10 px-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama menu..." className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-coffee-500 outline-none" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((itemCategory) => (
                <button key={itemCategory} type="button" onClick={() => setCategory(itemCategory)} className={`shrink-0 px-4 h-10 rounded-full text-sm font-bold capitalize ${category === itemCategory ? "bg-coffee-700 text-white" : "bg-slate-100 text-slate-600"}`}>{itemCategory.replace("-", " ")}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-28 lg:pb-4">
              {loading ? (
                <div className="h-40 flex items-center justify-center text-slate-400">Memuat menu...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {filteredMenu.map((item) => {
                    const cartItem = cart.find((entry) => entry.id === item.id);
                    return (
                      <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                        <button type="button" onClick={() => addItem(item)} className="text-left flex-1 flex flex-col">
                          <div className="h-28 sm:h-32 w-full bg-slate-100 overflow-hidden">
                            <img src={item.imageUrl || fallbackImage} alt={item.name} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                          </div>
                          <div className="p-3 flex-1">
                            <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 min-h-10">{item.name}</p>
                            <p className="mt-2 font-extrabold text-coffee-700 text-sm">Rp {item.price.toLocaleString("id-ID")}</p>
                          </div>
                        </button>
                        {cartItem ? (
                          <div className="mx-3 mb-3 h-10 flex items-center justify-between rounded-lg bg-coffee-50 border border-coffee-100">
                            <button type="button" onClick={() => changeQuantity(item.id, -1)} className="w-10 h-full font-bold text-coffee-700">−</button>
                            <span className="font-bold">{cartItem.quantity}</span>
                            <button type="button" onClick={() => changeQuantity(item.id, 1)} className="w-10 h-full font-bold text-coffee-700">+</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => addItem(item)} className="mx-3 mb-3 h-10 rounded-lg bg-coffee-700 text-white text-sm font-bold">Tambah</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="hidden lg:flex flex-col border-l bg-white min-h-0">
            <div className="p-4 border-b space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setOrderType("dine_in")} className={`h-11 rounded-lg text-sm font-bold ${orderType === "dine_in" ? "bg-coffee-700 text-white" : "bg-slate-100 text-slate-600"}`}>Dine-in</button>
                <button type="button" onClick={() => { setOrderType("take_away"); setTableNumber(""); }} className={`h-11 rounded-lg text-sm font-bold ${orderType === "take_away" ? "bg-coffee-700 text-white" : "bg-slate-100 text-slate-600"}`}>Take-away</button>
              </div>

              {orderType === "dine_in" && (
                <select value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm">
                  <option value="">Pilih meja tersedia</option>
                  {tables.map((table) => <option key={table.id} value={table.table_number} disabled={table.status !== "available"}>{`Meja ${table.table_number}${table.status !== "available" ? " (Tidak tersedia)" : ""}`}</option>)}
                </select>
              )}

              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pelanggan (opsional)" className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm" />

              <div className="grid grid-cols-3 gap-2">
                {["cash", "transfer", "ewallet"].map((method) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`h-9 rounded-lg text-xs font-bold capitalize ${paymentMethod === method ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-600"}`}>{method === "ewallet" ? "E-Wallet" : method}</button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={payNow} onChange={(e) => setPayNow(e.target.checked)} className="w-4 h-4" />
                Tandai sudah dibayar
              </label>
            </div>

            <div className="px-4 py-3 border-b flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-900">Pesanan</h3>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-coffee-100 text-coffee-700">{cartCount} item</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400"><div className="text-4xl mb-2">🛒</div><p className="text-sm">Belum ada menu dipilih</p></div>
              ) : cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-2 rounded-xl border border-slate-100">
                  <img src={item.imageUrl || fallbackImage} alt="" className="w-14 h-14 rounded-lg object-cover bg-slate-100" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-coffee-700 font-bold mt-1">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" onClick={() => changeQuantity(item.id, -1)} className="w-7 h-7 rounded-md border">−</button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => changeQuantity(item.id, 1)} className="w-7 h-7 rounded-md border">+</button>
                      <button type="button" onClick={() => removeItem(item.id)} className="ml-auto text-xs text-red-500 font-bold">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex justify-between items-end mb-3"><span className="text-sm text-slate-500">Total</span><span className="text-xl font-black text-coffee-900">Rp {subtotal.toLocaleString("id-ID")}</span></div>
              <button type="button" onClick={submitOrder} disabled={submitting || cart.length === 0} className="w-full h-12 rounded-xl bg-coffee-700 text-white font-bold disabled:opacity-40">{submitting ? "Menyimpan..." : "Simpan Pesanan"}</button>
            </div>
          </aside>
        </div>

        {cart.length > 0 && (
          <div className="lg:hidden absolute left-3 right-3 bottom-3 z-20 rounded-xl bg-coffee-900 text-white p-3 shadow-2xl flex items-center gap-3">
            <div className="flex-1"><p className="text-xs text-coffee-100">{cartCount} item</p><p className="font-bold">Rp {subtotal.toLocaleString("id-ID")}</p></div>
            <button type="button" onClick={submitOrder} disabled={submitting} className="h-11 px-5 rounded-lg bg-white text-coffee-900 font-bold">{submitting ? "..." : "Simpan"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
