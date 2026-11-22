import { Outlet, Link } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-coffee-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-coffee-700 flex items-center gap-2"
          >
            ☕ Warung Kopi
          </Link>
          <nav className="flex gap-6 text-sm font-medium text-coffee-900">
            <Link to="/" className="hover:text-coffee-500">
              Beranda
            </Link>
            <Link to="/menu" className="hover:text-coffee-500">
              Menu
            </Link>
            <Link to="/order" className="hover:text-coffee-500">
              Pesan Online
            </Link>
            <Link
              to="/login"
              className="bg-coffee-500 text-white px-4 py-2 rounded-lg hover:bg-coffee-700 transition"
            >
              Login Kasir
            </Link>
          </nav>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-coffee-900 text-coffee-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>
            © {new Date().getFullYear()} Warung Kopi. Dibuat dengan ❤️ untuk
            ngopi yang lebih baik.
          </p>
        </div>
      </footer>
    </div>
  );
}
