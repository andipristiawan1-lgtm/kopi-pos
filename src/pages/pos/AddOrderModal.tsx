import { useState, useEffect } from "react";

export default function AddOrderModal({
  orderId,
  onClose,
  onSuccess,
}: {
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [menu, setMenu] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/menu"
      : "/api/menu";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setMenu(data.data);
      });
  }, []);

  const addToCart = (item: any) => {
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

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/orders/${orderId}/add-items`
      : `/api/orders/${orderId}/add-items`;
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
      }),
    });
    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-coffee-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-coffee-900">
            Tambah Menu ke Pesanan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 font-bold text-xl"
          >
            &times;
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-sm text-gray-500 mb-2">Pilih Menu</h3>
            <div className="space-y-2">
              {menu.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-coffee-100 text-coffee-700 w-8 h-8 rounded-full font-bold hover:bg-coffee-500 hover:text-white"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg h-fit sticky top-0">
            <h3 className="font-bold text-sm text-gray-500 mb-2">
              Item Tambahan
            </h3>
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada item.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-coffee-500 text-white py-2 rounded font-bold hover:bg-coffee-700 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Tambahkan ke Pesanan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
