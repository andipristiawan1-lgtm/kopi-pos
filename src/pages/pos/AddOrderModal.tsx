import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
};

type CartItem = MenuItem & { quantity: number };

export default function AddOrderModal({
  orderId,
  onClose,
  onSuccess,
}: {
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [fallbackImage, setFallbackImage] = useState("");

  useEffect(() => {
    const apiMenu = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/menu"
      : "/api/menu";
    const apiSettings = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";

    Promise.all([fetch(apiMenu), fetch(apiSettings)])
      .then(async ([menuRes, settingsRes]) => {
        if (!menuRes.ok) throw new Error("Gagal memuat menu");
        const menuData = await menuRes.json();
        setMenu(Array.isArray(menuData.data) ? menuData.data : []);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setFallbackImage(settingsData.data?.menu_fallback_image_url || "");
        }
      })
      .catch(() => setError("Gagal memuat pilihan menu."))
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

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const changeQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setError("");

    try {
      const apiUrl = import.meta.env.DEV
        ? `http://127.0.0.1:8788/api/orders/${orderId}/add-items`
        : `/api/orders/${orderId}/add-items`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal menambah menu");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menambah menu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-6xl h-[96vh] sm:h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-16 px-4 md:px-6 border-b flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-coffee-900">
              Tambah Menu
            </h2>
            <p className="text-xs text-slate-500">Pesanan #{orderId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 text-2xl leading-none"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 grid lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Area pilihan menu */}
          <div className="min-h-0 flex flex-col bg-slate-50">
            <div className="p-3 md:p-4 bg-white border-b space-y-3">
              <div className="relative">
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari menu..."
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-coffee-500 focus:ring-2 focus:ring-coffee-100 outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((itemCategory) => (
                  <button
                    key={itemCategory}
                    type="button"
                    onClick={() => setCategory(itemCategory)}
                    className={`shrink-0 px-4 h-10 rounded-full text-sm font-bold capitalize transition ${
                      category === itemCategory
                        ? "bg-coffee-700 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {itemCategory.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-24 lg:pb-4">
              {loading ? (
                <div className="h-40 flex items-center justify-center text-slate-400">
                  Memuat menu...
                </div>
              ) : filteredMenu.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-400">
                  Menu tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {filteredMenu.map((item) => {
                    const cartItem = cart.find(
                      (cartMenu) => cartMenu.id === item.id,
                    );
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                      >
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="text-left flex-1 flex flex-col"
                        >
                          <div className="h-28 sm:h-32 w-full bg-slate-100 overflow-hidden">
                            <img
                              src={item.imageUrl || fallbackImage}
                              alt={item.name}
                              className="w-full h-full object-cover active:scale-95 transition"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <div className="p-3 flex-1 flex flex-col">
                            <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 min-h-10">
                              {item.name}
                            </p>
                            <p className="mt-2 font-extrabold text-coffee-700 text-sm">
                              Rp {item.price.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </button>

                        {cartItem ? (
                          <div className="mx-3 mb-3 h-10 flex items-center justify-between rounded-lg bg-coffee-50 border border-coffee-100">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, -1)}
                              className="w-10 h-full font-bold text-coffee-700"
                              aria-label={`Kurangi ${item.name}`}
                            >
                              −
                            </button>
                            <span className="font-bold text-coffee-900">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, 1)}
                              className="w-10 h-full font-bold text-coffee-700"
                              aria-label={`Tambah ${item.name}`}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="mx-3 mb-3 h-10 rounded-lg bg-coffee-700 text-white text-sm font-bold active:scale-[0.98] transition"
                          >
                            Tambah
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Keranjang desktop */}
          <aside className="hidden lg:flex flex-col border-l bg-white min-h-0">
            <div className="h-14 px-4 border-b flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900">Keranjang</h3>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-coffee-100 text-coffee-700">
                {cartCount} item
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="text-sm">Belum ada menu dipilih</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-2 rounded-xl border border-slate-100"
                  >
                    <img
                      src={item.imageUrl || fallbackImage}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-coffee-700 font-bold mt-1">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-md border text-slate-600"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-md border text-slate-600"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto text-xs text-red-500 font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm text-slate-500">Total tambahan</span>
                <span className="text-xl font-black text-coffee-900">
                  Rp {total.toLocaleString("id-ID")}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
                className="w-full h-12 rounded-xl bg-coffee-700 text-white font-bold shadow-lg shadow-coffee-900/10 disabled:opacity-40"
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : `Tambahkan ${cartCount > 0 ? `(${cartCount})` : ""}`}
              </button>
            </div>
          </aside>
        </div>

        {/* Keranjang mobile/tablet */}
        {cart.length > 0 && (
          <div className="lg:hidden absolute left-3 right-3 bottom-3 z-20 rounded-xl bg-coffee-900 text-white p-3 shadow-2xl flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-coffee-100">{cartCount} item dipilih</p>
              <p className="font-bold">Rp {total.toLocaleString("id-ID")}</p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 px-5 rounded-lg bg-white text-coffee-900 font-bold disabled:opacity-60"
            >
              {isSubmitting ? "..." : "Tambahkan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
