import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative bg-coffee-900 text-white overflow-hidden">
        {/* Background Overlay (Bisa diganti gambar asli nanti) */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center z-10">
          <span className="bg-coffee-500/30 text-coffee-100 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-sm border border-coffee-500/50">
            Selamat Datang di Warung Kopi
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
            {/* Card 1 */}
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
            {/* Card 2 */}
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
            {/* Card 3 */}
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

      {/* CALL TO ACTION */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto bg-coffee-800 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Siap Menikmati Kopi Anda?
            </h2>
            <p className="text-coffee-200 mb-8 max-w-xl mx-auto">
              Pesan sekarang atau booking meja untuk pengalaman ngopi yang tak
              terlupakan.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/menu"
                className="bg-white text-coffee-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition"
              >
                Lihat Menu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
