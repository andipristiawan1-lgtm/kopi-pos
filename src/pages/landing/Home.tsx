import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-coffee-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Ngopi Lebih Nikmat</h1>
          <p className="text-xl text-coffee-100 mb-8">
            Kopi pilihan, suasana hangat, dan pesanan yang cepat. Langsung dari
            kedai kami ke cangkir Anda.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/order"
              className="bg-white text-coffee-700 px-8 py-3 rounded-lg font-bold hover:bg-coffee-50 transition"
            >
              Pesan Sekarang
            </Link>
            <Link
              to="/menu"
              className="border border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-coffee-700 transition"
            >
              Lihat Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="text-4xl mb-4">☕</div>
          <h3 className="text-xl font-bold text-coffee-900 mb-2">
            Biji Kopi Pilihan
          </h3>
          <p className="text-gray-600">
            Robusta dan Arabika terbaik dari petani lokal.
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold text-coffee-900 mb-2">
            Pesan Cepat
          </h3>
          <p className="text-gray-600">
            Pesan online, pilih meja, dan pesanan langsung diproses.
          </p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-sm">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-xl font-bold text-coffee-900 mb-2">
            Suasana Nyaman
          </h3>
          <p className="text-gray-600">
            Tempat yang cocok untuk bekerja, santai, atau bertemu teman.
          </p>
        </div>
      </section>
    </div>
  );
}
