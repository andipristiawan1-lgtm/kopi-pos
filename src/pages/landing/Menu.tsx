import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
};

export default function Menu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Semua");

  useEffect(() => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/menu"
      : "/api/menu";
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat menu");
        return res.json();
      })
      .then((data) => {
        setMenu(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coffee-500 mx-auto mb-4"></div>
        <p className="text-coffee-500">Memuat menu lezat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  // Dapatkan daftar kategori unik
  const categories = [
    "Semua",
    ...Array.from(new Set(menu.map((item) => item.category))),
  ];

  // Filter menu berdasarkan kategori yang dipilih
  const filteredMenu =
    activeCategory === "Semua"
      ? menu
      : menu.filter((item) => item.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header Katalog */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-coffee-900 mb-3">
          Menu Spesial Kami
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Pilih dari berbagai racikan kopi premium dan camilan lezat yang siap
          menemani hari Anda.
        </p>
      </div>

      {/* Filter Kategori */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all duration-200 ${
              activeCategory === cat
                ? "bg-coffee-700 text-white shadow-lg scale-105 ring-2 ring-coffee-300"
                : "bg-white text-gray-600 border border-gray-200 hover:border-coffee-500 hover:text-coffee-600"
            }`}
          >
            {cat.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Grid Menu */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group"
          >
            {/* Gambar Menu */}
            <div className="h-48 bg-coffee-100 relative overflow-hidden">
              <img
                src={
                  item.imageUrl ||
                  "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=500&auto=format&fit=crop"
                }
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-coffee-800 shadow-sm capitalize">
                {item.category.replace("-", " ")}
              </div>
            </div>

            {/* Detail Menu */}
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-coffee-900 mb-2">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2">
                {item.description ||
                  "Dibuat dengan bahan pilihan terbaik untuk Anda."}
              </p>
              <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-4">
                <span className="text-lg font-bold text-coffee-700">
                  Rp {item.price.toLocaleString("id-ID")}
                </span>
                <Link
                  to="/order"
                  className="text-xs font-bold bg-coffee-50 text-coffee-600 px-4 py-2 rounded-full hover:bg-coffee-500 hover:text-white transition"
                >
                  + Pesan
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          Belum ada menu untuk kategori ini.
        </div>
      )}

      {/* CTA di Bawah */}
      <div className="text-center mt-16 bg-coffee-50 p-8 rounded-2xl border border-coffee-100">
        <h3 className="text-xl font-bold text-coffee-900 mb-2">
          Tertarik memesan sekarang?
        </h3>
        <p className="text-gray-600 mb-6">
          Anda bisa memesan online dan memilih meja tanpa perlu menunggu.
        </p>
        <Link
          to="/order"
          className="inline-block text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition shadow-lg"
          style={{ backgroundColor: "#5c3a21" }} // <-- Paksa warna cokelat tua (coffee-700)
        >
          Pesan Online Sekarang
        </Link>
      </div>
    </div>
  );
}
