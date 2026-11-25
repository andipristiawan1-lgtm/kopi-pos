import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type InventoryItem = {
  id: number;
  name: string;
  unit: string;
  stock: number;
  minimum_stock: number;
};

type PurchaseItem = {
  item_id: number | null;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type Purchase = {
  id: number;
  purchase_number: string;
  supplier_name: string | null;
  invoice_number: string | null;
  purchase_date: number;
  payment_status: "paid" | "unpaid";
  total_amount: number;
  notes: string | null;
  items: PurchaseItem[];
};

type PurchaseDraftItem = {
  itemId: number;
  itemName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
};

export default function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", unit: "pcs", stock: "0", minimumStock: "0" });
  const [activeTab, setActiveTab] = useState<"stock" | "purchases">("stock");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ supplierName: "", invoiceNumber: "", purchaseDate: new Date().toISOString().slice(0, 10), paymentStatus: "unpaid", notes: "" });
  const [purchaseDraftItems, setPurchaseDraftItems] = useState<PurchaseDraftItem[]>([{ itemId: 0, itemName: "", unit: "pcs", quantity: "1", unitPrice: "0" }]);

  const apiUrl = import.meta.env.DEV
    ? "http://127.0.0.1:8788/api/admin/inventory"
    : "/api/admin/inventory";

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (res.ok) setItems(Array.isArray(data.data) ? data.data : []);
    } catch {
      setMessage("Gagal memuat daftar barang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchItems(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", unit: "pcs", stock: "0", minimumStock: "0" });
    setModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      unit: item.unit,
      stock: String(item.stock),
      minimumStock: String(item.minimum_stock),
    });
    setModal(true);
  };

  const saveItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    const endpoint = editing ? `${apiUrl}/${editing.id}` : apiUrl;
    try {
      const res = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          unit: form.unit,
          stock: Number(form.stock),
          minimumStock: Number(form.minimumStock),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan barang");
      setModal(false);
      setMessage("Barang berhasil disimpan.");
      await fetchItems();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan barang.");
    }
  };

  const deleteItem = async (item: InventoryItem) => {
    if (!confirm(`Hapus barang "${item.name}"?`)) return;
    const res = await fetch(`${apiUrl}/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) setMessage(data?.error || "Gagal menghapus barang.");
    else {
      setMessage("Barang berhasil dihapus.");
      await fetchItems();
    }
  };

  const lowStockCount = items.filter((item) => Number(item.stock) <= Number(item.minimum_stock)).length;

  const purchasesApiUrl = import.meta.env.DEV
    ? "http://127.0.0.1:8788/api/admin/purchases"
    : "/api/admin/purchases";

  const fetchPurchases = async () => {
    setPurchaseLoading(true);
    try {
      const res = await fetch(purchasesApiUrl);
      const data = await res.json();
      if (res.ok) setPurchases(Array.isArray(data.data) ? data.data : []);
    } catch {
      setMessage("Gagal memuat riwayat pembelian.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => { void fetchPurchases(); }, []);

  const openPurchase = () => {
    setPurchaseForm({ supplierName: "", invoiceNumber: "", purchaseDate: new Date().toISOString().slice(0, 10), paymentStatus: "unpaid", notes: "" });
    setPurchaseDraftItems([{ itemId: 0, itemName: "", unit: "pcs", quantity: "1", unitPrice: "0" }]);
    setPurchaseModal(true);
  };

  const updateDraftItem = (index: number, patch: Partial<PurchaseDraftItem>) => {
    setPurchaseDraftItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const selectDraftInventoryItem = (index: number, itemId: number) => {
    const selected = items.find((item) => item.id === itemId);
    updateDraftItem(index, {
      itemId,
      itemName: selected?.name || "",
      unit: selected?.unit || "pcs",
    });
  };

  const savePurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    const normalizedItems = purchaseDraftItems.map((item) => ({
      itemId: item.itemId || undefined,
      itemName: item.itemName,
      unit: item.unit,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));

    if (normalizedItems.some((item) => (!item.itemId && !item.itemName) || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      setMessage("Lengkapi barang, jumlah, dan harga pembelian.");
      return;
    }

    try {
      const purchaseDate = Math.floor(new Date(`${purchaseForm.purchaseDate}T00:00:00`).getTime() / 1000);
      const res = await fetch(purchasesApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...purchaseForm,
          purchaseDate,
          items: normalizedItems,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan pembelian");
      setPurchaseModal(false);
      setMessage("Pembelian berhasil disimpan. Stok barang diperbarui.");
      await Promise.all([fetchItems(), fetchPurchases()]);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Gagal menyimpan pembelian.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/admin" className="text-coffee-600 hover:underline text-sm mb-6 block">← Kembali ke Dashboard</Link>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900">Pengelolaan Stok</h1>
          <p className="text-gray-500">Daftar bahan dan barang operasional warung.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "stock" ? (
            <button type="button" onClick={openAdd} className="h-11 px-5 rounded-xl bg-coffee-700 text-white font-bold shadow-sm">+ Tambah Barang</button>
          ) : (
            <button type="button" onClick={openPurchase} className="h-11 px-5 rounded-xl bg-coffee-700 text-white font-bold shadow-sm">+ Catat Belanja</button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button type="button" onClick={() => setActiveTab("stock")} className={`h-10 px-5 rounded-lg text-sm font-bold ${activeTab === "stock" ? "bg-coffee-700 text-white" : "bg-white border text-slate-600"}`}>Stok Barang</button>
        <button type="button" onClick={() => setActiveTab("purchases")} className={`h-10 px-5 rounded-lg text-sm font-bold ${activeTab === "purchases" ? "bg-coffee-700 text-white" : "bg-white border text-slate-600"}`}>Riwayat Belanja</button>
      </div>

      {activeTab === "stock" && (
        <>
          {message && <div className="mb-4 p-3 rounded-lg bg-coffee-50 border border-coffee-100 text-coffee-800 text-sm">{message}</div>}

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs text-gray-500">Jenis Barang</p><p className="text-2xl font-black text-coffee-900">{items.length}</p></div>
            <div className="bg-white p-5 rounded-xl border shadow-sm"><p className="text-xs text-gray-500">Total Persediaan Rendah</p><p className="text-2xl font-black text-red-600">{lowStockCount}</p></div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left min-w-[680px]">
              <thead className="bg-coffee-50 border-b"><tr><th className="p-4">Nama Barang</th><th className="p-4">Satuan</th><th className="p-4">Stok</th><th className="p-4">Stok Minimum</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Memuat stok...</td></tr> : items.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada barang.</td></tr> : items.map((item) => {
                  const low = Number(item.stock) <= Number(item.minimum_stock);
                  return <tr key={item.id} className="border-b hover:bg-slate-50"><td className="p-4 font-bold text-coffee-900">{item.name}</td><td className="p-4">{item.unit}</td><td className="p-4 font-bold">{item.stock}</td><td className="p-4">{item.minimum_stock}</td><td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${low ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{low ? "Perlu Restok" : "Aman"}</span></td><td className="p-4 text-right space-x-3"><button type="button" onClick={() => openEdit(item)} className="text-blue-600 font-bold">Edit</button><button type="button" onClick={() => deleteItem(item)} className="text-red-600 font-bold">Hapus</button></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-coffee-900 mb-5">{editing ? "Edit Barang" : "Tambah Barang"}</h2>
            <form onSubmit={saveItem} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1">Nama Barang</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full h-11 px-3 border rounded-lg" placeholder="Contoh: Kopi arabika" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-bold mb-1">Satuan</label><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full h-11 px-3 border rounded-lg"><option value="pcs">pcs</option><option value="kg">kg</option><option value="gram">gram</option><option value="liter">liter</option><option value="ml">ml</option><option value="pack">pack</option></select></div><div><label className="block text-sm font-bold mb-1">Stok Awal</label><input type="number" min="0" step="0.01" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full h-11 px-3 border rounded-lg" /></div></div>
              <div><label className="block text-sm font-bold mb-1">Stok Minimum</label><input type="number" min="0" step="0.01" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} className="w-full h-11 px-3 border rounded-lg" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModal(false)} className="h-11 px-5 rounded-lg text-slate-600 font-bold">Batal</button><button type="submit" className="h-11 px-5 rounded-lg bg-coffee-700 text-white font-bold">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "purchases" && (
        <>
          {message && <div className="mb-4 p-3 rounded-lg bg-coffee-50 border border-coffee-100 text-coffee-800 text-sm">{message}</div>}

          <div className="bg-white rounded-xl border shadow-sm overflow-x-auto mb-6">
            <table className="w-full text-left min-w-[680px]">
              <thead className="bg-coffee-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Nomor Pembelian</th><th className="p-4">Supplier</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead>
              <tbody>
                {purchaseLoading ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Memuat riwayat pembelian...</td></tr> : purchases.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada riwayat pembelian.</td></tr> : purchases.map((purchase) => {
                  const date = new Date(purchase.purchase_date * 1000);
                  return <tr key={purchase.id} className="border-b hover:bg-slate-50"><td className="p-4">{date.toLocaleDateString("id-ID")}</td><td className="p-4 font-bold text-coffee-900">{purchase.purchase_number}</td><td className="p-4">{purchase.supplier_name || "-"}</td><td className="p-4 font-bold">{purchase.total_amount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</td><td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${purchase.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{purchase.payment_status === "paid" ? "Dibayar" : "Belum Dibayar"}</span></td><td className="p-4 text-right space-x-3"><button type="button" className="text-blue-600 font-bold">Detail</button></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {purchaseModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-3xl max-h-[94vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-coffee-900">Catat Pembelian</h2>
              <button type="button" onClick={() => setPurchaseModal(false)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-xl">×</button>
            </div>

            <form onSubmit={savePurchase} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Supplier</label>
                  <input value={purchaseForm.supplierName} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })} className="w-full h-11 px-3 border rounded-lg" placeholder="Nama supplier" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Nomor Invoice</label>
                  <input value={purchaseForm.invoiceNumber} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })} className="w-full h-11 px-3 border rounded-lg" placeholder="Opsional" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tanggal Pembelian</label>
                  <input type="date" value={purchaseForm.purchaseDate} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })} className="w-full h-11 px-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Status Pembayaran</label>
                  <select value={purchaseForm.paymentStatus} onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentStatus: e.target.value })} className="w-full h-11 px-3 border rounded-lg">
                    <option value="unpaid">Belum Dibayar</option>
                    <option value="paid">Sudah Dibayar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Catatan</label>
                <textarea value={purchaseForm.notes} onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} className="w-full h-20 px-3 py-2 border rounded-lg resize-none" placeholder="Catatan pembelian" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-coffee-900">Rincian Barang</h3>
                  <button type="button" onClick={() => setPurchaseDraftItems((prev) => [...prev, { itemId: 0, itemName: "", unit: "pcs", quantity: "1", unitPrice: "0" }])} className="h-9 px-3 rounded-lg bg-coffee-100 text-coffee-700 text-sm font-bold">+ Tambah Baris</button>
                </div>

                <div className="space-y-3">
                  {purchaseDraftItems.map((item, index) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <div key={index} className="p-3 border rounded-xl bg-slate-50">
                        <div className="grid md:grid-cols-[minmax(180px,1fr)_100px_140px_130px] gap-3 items-end">
                          <div>
                            <label className="block text-xs font-bold mb-1">Barang</label>
                            <select value={item.itemId} onChange={(e) => selectDraftInventoryItem(index, Number(e.target.value))} className="w-full h-10 px-2 border rounded-lg bg-white">
                              <option value={0}>Pilih barang</option>
                              {items.map((inventoryItem) => <option key={inventoryItem.id} value={inventoryItem.id}>{inventoryItem.name} ({inventoryItem.unit})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1">Jumlah</label>
                            <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateDraftItem(index, { quantity: e.target.value })} className="w-full h-10 px-2 border rounded-lg bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1">Harga Satuan</label>
                            <input type="number" min="0" step="1" value={item.unitPrice} onChange={(e) => updateDraftItem(index, { unitPrice: e.target.value })} className="w-full h-10 px-2 border rounded-lg bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1">Subtotal</label>
                            <div className="h-10 px-2 flex items-center rounded-lg border bg-white font-bold text-coffee-700">Rp {lineTotal.toLocaleString("id-ID")}</div>
                          </div>
                        </div>
                        {purchaseDraftItems.length > 1 && (
                          <button type="button" onClick={() => setPurchaseDraftItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="mt-2 text-xs font-bold text-red-600">Hapus baris</button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex justify-end">
                  <div className="min-w-52 p-3 rounded-xl bg-coffee-900 text-white flex justify-between items-center">
                    <span className="text-sm">Total Belanja</span>
                    <strong>Rp {purchaseDraftItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0).toLocaleString("id-ID")}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPurchaseModal(false)} className="h-11 px-5 rounded-lg text-slate-600 font-bold">Batal</button>
                <button type="submit" className="h-11 px-5 rounded-lg bg-coffee-700 text-white font-bold">Simpan Pembelian</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
