import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Tipe data sesuai response API
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

  useEffect(() => {
    // Fetch data dari endpoint yang baru kita buat
    fetch("/api/menu")
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
      <div className="text-center py-20 text-coffee-500">Memuat menu...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p>{error}</p>
        <p className="text-sm mt-2">
          Pastikan server API (wrangler pages dev) sedang berjalan.
        </p>
      </div>
    );
  }

  // Kelompokkan menu berdasarkan kategori
  const groupedMenu = menu.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-coffee-900 mb-4">Menu Kami</h1>
        <p className="text-coffee-500">
          Pilihan kopi dan camilan terbaik untuk menemani harimu.
        </p>
      </div>

      {Object.entries(groupedMenu).map(([category, items]) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold text-coffee-700 capitalize border-b border-coffee-100 pb-2 mb-6">
            {category.replace("-", " ")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-coffee-50 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-coffee-900">
                    {item.name}
                  </h3>
                  <span className="font-bold text-coffee-600">
                    Rp {item.price.toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center mt-12 pt-8 border-t border-coffee-100">
        <p className="text-coffee-700 mb-4">Tertarik memesan?</p>
        <Link
          to="/order"
          className="bg-coffee-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-coffee-700 transition"
        >
          Pesan Online Sekarang
        </Link>
      </div>
    </div>
  );
}
