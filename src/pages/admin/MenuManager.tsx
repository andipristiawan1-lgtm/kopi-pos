import { useState, useEffect } from "react";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: number;
  image_url: string | null; // Pastikan API mengirim image_url
};

type Category = {
  id: number;
  name: string;
};

export default function MenuManager() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // <-- State Baru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    image_url: "",
  });

  const fetchMenus = () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/menu"
      : "/api/admin/menu";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setMenus(data.data);
      });
  };

  const fetchCategories = () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/categories"
      : "/api/admin/categories";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setCategories(data.data);
          // Set kategori default ke yang pertama jika form kosong
          if (data.data.length > 0 && !formData.category) {
            setFormData(prev => ({ ...prev, category: data.data[0].name }));
          }
        }
      });
  };

  useEffect(() => {
    fetchMenus();
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    
    const apiUrl = import.meta.env.DEV
      ? editingItem
        ? `http://127.0.0.1:8788/api/admin/menu/${editingItem.id}`
        : "http://127.0.0.1:8788/api/admin/menu"
      : editingItem
        ? `/api/admin/menu/${editingItem.id}`
        : "/api/admin/menu";

    const res = await fetch(apiUrl, {
      method: editingItem ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, is_available: true }),
    });

    const result = await res.json();

    setIsSaving(false);
    if (res.ok) {
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: "", description: "", price: 0, category: categories[0]?.name || "", image_url: "" });
      fetchMenus();
      setMessage("Menu berhasil disimpan.");
    } else {
      setMessage(result.error || "Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus menu ini?")) return;
    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/admin/menu/${id}`
      : `/api/admin/menu/${id}`;
    await fetch(apiUrl, { method: "DELETE" });
    fetchMenus();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
         <Link to="/admin" className="text-coffee-600 hover:underline text-sm mb-6 block">← Kembali ke Dashboard</Link>
             
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-coffee-900">Manajemen Menu </h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({
              name: "",
              description: "",
              price: 0,
              category: categories[0]?.name || "", // Set default dari daftar kategori
              image_url: "",
            });
            setIsModalOpen(true);
          }}
          className="bg-coffee-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-coffee-700"
        >
          + Tambah Menu
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${message.includes("berhasil") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-coffee-50 text-coffee-900 border-b">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Harga</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-coffee-100 flex items-center justify-center text-coffee-500">☕</div>
                    )}
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="p-4 capitalize">{item.category.replace("-", " ")}</td>
                <td className="p-4">Rp {item.price.toLocaleString("id-ID")}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${item.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {item.is_available ? "Tersedia" : "Habis"}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-500 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Edit Menu" : "Tambah Menu"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nama Menu</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Kategori</label>
                {/* DROPDOWN DINAMIS */}
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border p-2 rounded"
                  required
                >
                  {categories.length === 0 ? (
                    <option value="">Memuat kategori...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name.replace("-", " ").toUpperCase()}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Deskripsi (Opsional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">URL Gambar Menu</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full border p-2 rounded"
                  placeholder="https://...jpg"
                />
                {formData.image_url && (
                  <div className="mt-3 h-36 rounded-lg overflow-hidden border bg-gray-100">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-coffee-500 text-white rounded font-bold">
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}