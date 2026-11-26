import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");

  const fetchCategories = () => {
    const apiUrl = import.meta.env.DEV ? "http://127.0.0.1:8788/api/admin/categories" : "/api/admin/categories";
    fetch(apiUrl).then(res => res.json()).then(data => { if (data.data) setCategories(data.data); });
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    
    const apiUrl = import.meta.env.DEV ? "http://127.0.0.1:8788/api/admin/categories" : "/api/admin/categories";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });

    if (res.ok) {
      setMessage("Kategori berhasil ditambahkan!");
      setNewCategory("");
      fetchCategories();
    } else {
      const data = await res.json();
      setMessage(data.error || "Gagal menambahkan kategori.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return;
    
    const apiUrl = import.meta.env.DEV ? `http://127.0.0.1:8788/api/admin/categories?id=${id}` : `/api/admin/categories?id=${id}`;
    const res = await fetch(apiUrl, { method: "DELETE" });
    
    if (res.ok) {
      setMessage("Kategori berhasil dihapus.");
      fetchCategories();
    } else {
      const data = await res.json();
      setMessage(data.error || "Gagal menghapus kategori.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/admin" className="text-coffee-600 hover:underline text-sm mb-6 block">← Kembali ke Dashboard</Link>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-coffee-100">
        <h1 className="text-2xl font-bold text-coffee-900 mb-6">Manajemen Kategori</h1>
        
        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.includes("berhasil") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Nama kategori baru (misal: Dessert)" 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
            required
          />
          <button 
  type="submit" 
  className="text-white px-6 py-2 rounded-lg font-bold text-sm transition hover:opacity-90 shadow-md"
  style={{ backgroundColor: "#4e342e" }} // <-- Warna cokelat tua paksa
>
  Tambah
</button>
        </form>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg">
              <span className="font-medium capitalize">{cat.name.replace("-", " ")}</span>
              <button onClick={() => handleDelete(cat.id)} className="text-red-500 text-xs font-bold hover:underline">
                Hapus
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-gray-500 text-sm">Belum ada kategori.</p>}
        </div>
      </div>
    </div>
  );
}