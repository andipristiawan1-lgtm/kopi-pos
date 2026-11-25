import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

export default function PublicLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [storeName, setStoreName] = useState("Warung Kopi");
  const [storeAddress, setStoreAddress] = useState(
    "Jl. Kopi Nikmat No. 123, Kota Anda"
  );
  const [storeHours, setStoreHours] = useState("08.00 - 22.00");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerImageUrl, setFooterImageUrl] = useState("");
  const location = useLocation();

  useEffect(() => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/settings"
      : "/api/settings";

    fetch(apiUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const settings = data?.data;
        if (!settings) return;
        if (settings.store_name) setStoreName(settings.store_name);
        if (settings.store_address) setStoreAddress(settings.store_address);
        if (settings.store_hours) setStoreHours(settings.store_hours);
        setLogoUrl(settings.logo_url || "");
        setFooterImageUrl(settings.footer_image_url || "");
      })
      .catch(() => {});
  }, []);

  // Fungsi untuk menutup menu saat link diklik
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { name: "Beranda", path: "/" },
    { name: "Menu", path: "/menu" },
    { name: "Booking Meja", path: "/booking" },
    { name: "Pesan Online", path: "/order" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-coffee-50">
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="text-xl md:text-2xl font-bold text-coffee-700 flex items-center gap-2"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span>☕</span>
            )}
            <span>{storeName}</span>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition ${
                  location.pathname === link.path
                    ? "text-coffee-600 border-b-2 border-coffee-600 pb-1"
                    : "text-gray-600 hover:text-coffee-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/login"
              className="bg-coffee-500 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-coffee-700 transition shadow-md"
            >
              Login Kasir
            </Link>
          </nav>

          {/* Tombol Hamburger (Mobile) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-coffee-700 focus:outline-none"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Mobile (Dropdown) */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
            <div className="flex flex-col px-4 pt-2 pb-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    location.pathname === link.path
                      ? "bg-coffee-50 text-coffee-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={closeMenu}
                className="block text-center bg-coffee-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-coffee-700 transition"
              >
                Login Kasir
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Konten Utama */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative bg-coffee-900 text-coffee-100 py-8 mt-auto overflow-hidden">
        {footerImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.15]"
            style={{ backgroundImage: `url('${footerImageUrl}')` }}
          />
        )}
        <div className="relative max-w-6xl mx-auto px-4 text-center space-y-2">
          <p className="text-lg font-bold text-white mb-2">{storeName}</p>
          <p className="text-sm text-coffee-300">{storeAddress}</p>
          <p className="text-sm text-coffee-300">Buka Setiap Hari: {storeHours}</p>
          <div className="pt-4 mt-4 border-t border-coffee-800 text-xs text-coffee-400">
            © {new Date().getFullYear()} {storeName}. Dibuat dengan ❤️.
          </div>
        </div>
      </footer>
    </div>
  );
}
