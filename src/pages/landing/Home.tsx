import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
};

export default function Home() {
  const [featuredMenus, setFeaturedMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImages, setHeroImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop",
  ]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [storeName, setStoreName] = useState("Warung Kopi");
  const [menuFallbackImage, setMenuFallbackImage] = useState(
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=500&auto=format&fit=crop",
  );

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
        if (data && Array.isArray(data.data)) {
          setFeaturedMenus(data.data.slice(0, 6));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    const settingsUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";
    fetch(settingsUrl)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data?.data) return;
        const configured = [
          data.data.hero_image_1,
          data.data.hero_image_2,
          data.data.hero_image_3,
        ].filter((url: unknown): url is string =>
          typeof url === "string" && url.trim().length > 0
        );
        setHeroImages(configured.length > 0 ? configured : [
          "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop",
        ]);
        if (data.data.store_name) setStoreName(data.data.store_name);
        if (data.data.menu_fallback_image_url) {
          setMenuFallbackImage(data.data.menu_fallback_image_url);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (heroImages.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroImages]);

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative bg-coffee-900 text-white overflow-hidden min-h-[520px] flex items-center">
        {heroImages.map((imageUrl, index) => (
          <div
            key={imageUrl}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === heroIndex ? "opacity-50" : "opacity-0"}`}
            style={{ backgroundImage: `url('${imageUrl}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-coffee-900/75" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center z-10 w-full">
          <span className="bg-coffee-500/30 text-coffee-100 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-sm border border-coffee-500/50">
            Selamat Datang di {storeName}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Nikmati Kopi Terbaik,
            <br />
            <span className="text-coffee-400">Tanpa Perlu Antre.</span>
          </h1>
          <p className="text-lg md:text-xl text-coffee-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Pesan menu favorit Anda secara online, atau amankan meja Anda untuk
            acara spesial bersama teman dan keluarga.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/order"
              className="bg-white text-coffee-900 px-8 py-3.5 rounded-full font-bold hover:bg-gray-100 transition shadow-lg text-center"
            >
              Pesan Menu Sekarang
            </Link>
            <Link
              to="/booking"
              className="bg-coffee-600 text-white px-8 py-3.5 rounded-full font-bold hover:bg-coffee-500 transition shadow-lg border border-coffee-500 text-center"
            >
              Booking Meja (DP)
            </Link>
          </div>
          {heroImages.length > 1 && (
            <div className="flex gap-2 mt-8" aria-label="Pilihan gambar hero">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Tampilkan gambar hero ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === heroIndex ? "w-8 bg-white" : "w-2.5 bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CAROUSEL MENU */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-coffee-900 mb-2">
              Menu Andalan Kami
            </h2>
            <p className="text-gray-500">
              Beberapa menu yang paling sering dipesan pelanggan.
            </p>
          </div>
          <Link
            to="/menu"
            className="hidden md:block text-coffee-600 font-bold hover:underline"
          >
            Lihat Semua Menu &rarr;
          </Link>
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
            {loading ? (
              <div className="w-full text-center py-10 text-gray-400">
                Memuat menu...
              </div>
            ) : featuredMenus.length === 0 ? (
              <div className="w-full text-center py-10 text-gray-400">
                Belum ada menu tersedia.
              </div>
            ) : (
              featuredMenus.map((item) => (
                <Link
                  key={item.id}
                  to="/order"
                  className="snap-center shrink-0 w-64 md:w-72 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition"
                >
                  <div className="h-48 overflow-hidden relative bg-gray-100">
                    <img
                      src={item.imageUrl || menuFallbackImage}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-coffee-800 capitalize">
                      {item.category.replace("-", " ")}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-coffee-900 text-lg mb-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-coffee-600 font-bold">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="text-center mt-4 md:hidden">
            <Link
              to="/menu"
              className="inline-block bg-coffee-100 text-coffee-700 px-6 py-2 rounded-full font-bold text-sm hover:bg-coffee-200 transition"
            >
              Lihat Semua Menu
            </Link>
          </div>
        </div>
      </section>

      {/* FITUR UNGGULAN */}
      <section className="py-20 px-4 bg-coffee-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-coffee-900 mb-4">
              Kenapa Memilih Kami?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Kami memberikan pengalaman ngopi yang lebih modern, cepat, dan
              nyaman.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-coffee-100 hover:shadow-md transition text-center">
              <div className="w-16 h-16 bg-coffee-100 text-coffee-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
                ☕
              </div>
              <h3 className="text-xl font-bold text-coffee-900 mb-3">
                Biji Kopi Premium
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Kami hanya menggunakan biji kopi pilihan dari petani lokal
                terbaik untuk menjaga cita rasa.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-coffee-100 hover:shadow-md transition text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-coffee-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                Populer
              </div>
              <div className="w-16 h-16 bg-coffee-100 text-coffee-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
                🪑
              </div>
              <h3 className="text-xl font-bold text-coffee-900 mb-3">
                Booking Meja Mudah
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ingin mengadakan acara? Booking meja Anda langsung dari HP dan
                bayar DP dengan aman.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-coffee-100 hover:shadow-md transition text-center">
              <div className="w-16 h-16 bg-coffee-100 text-coffee-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-coffee-900 mb-3">
                Pesan Cepat & Akurat
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Pesan online, pilih meja, dan pesanan Anda akan langsung
                diproses oleh kasir kami tanpa antre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA PENUTUP (Dipaksa Kontras) */}
      <section className="py-20 px-4 bg-white">
        <div
          className="max-w-5xl mx-auto rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden"
          style={{ backgroundColor: "#3e2723" }} // <-- Warna cokelat tua solid (paksa)
        >
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Siap Menikmati Kopi Anda?
            </h2>
            <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Jangan biarkan rasa penasaran menunda momen ngopi Anda. Pesan
              sekarang, atau booking meja untuk pengalaman yang lebih privat.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/order"
                className="bg-white text-gray-900 px-8 py-3.5 rounded-full font-bold hover:bg-gray-100 transition shadow-lg"
              >
                Pesan Online
              </Link>
              <Link
                to="/booking"
                className="bg-transparent border-2 border-white text-white px-8 py-3.5 rounded-full font-bold hover:bg-white/10 transition"
              >
                Booking Meja
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
