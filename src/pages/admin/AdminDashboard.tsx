import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/dashboard"
      : "/api/admin/dashboard";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStats(data);
      });
  }, []);

  const handleLogout = async () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/auth/logout"
      : "/api/auth/logout";
    await fetch(apiUrl, { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900">
            Dashboard Owner
          </h1>
          <p className="text-gray-500">Ringkasan performa warung hari ini.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full font-bold hover:bg-gray-200 transition"
          >
            Lihat Toko
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium underline"
          >
            Logout
          </button>
        </div>
      </div>
      {/* Kartu Statistik */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-sm mb-1">Omzet Hari Ini (Selesai)</p>
          <h2 className="text-3xl font-bold text-coffee-900">
            Rp {stats.totalRevenue.toLocaleString("id-ID")}
          </h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm mb-1">Pesanan Selesai</p>
          <h2 className="text-3xl font-bold text-coffee-900">
            {stats.totalOrders}{" "}
            <span className="text-lg font-normal text-gray-500">Transaksi</span>
          </h2>
        </div>
      </div>
      {/* Menu Navigasi Cepat */}
      <h2 className="text-xl font-bold text-coffee-900 mb-4">Menu Cepat</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/admin/profile"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 border border-coffee-100"
        >
          <div className="bg-coffee-100 p-3 rounded-full text-2xl">⚙️</div>
          <div>
            <h3 className="font-bold text-coffee-900">Profil Toko</h3>
            <p className="text-xs text-gray-500">Atur nomor WA & info toko</p>
          </div>
        </Link>
         <Link
          to="/pos"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 border border-coffee-100"
        >
          <div className="bg-coffee-100 p-3 rounded-full text-2xl">🧑‍🍳</div>
          <div>
            <h3 className="font-bold text-coffee-900">Buka Kasir (POS)</h3>
            <p className="text-xs text-gray-500">Lihat antrean & pesanan</p>
          </div>
        </Link>
        {/* Link Manajemen Meja (BARU) */}
        <Link
          to="/admin/tables"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 border border-coffee-100"
        >
          <div className="bg-coffee-100 p-3 rounded-full text-2xl">🪑</div>
          <div>
            <h3 className="font-bold text-coffee-900">Manajemen Meja</h3>
            <p className="text-xs text-gray-500">Atur harga DP booking</p>
          </div>
        </Link>
        <Link
          to="/admin/booking"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 border border-coffee-100"
        >
          <div className="bg-coffee-100 p-3 rounded-full text-2xl">⏱️</div>
          <div>
            <h3 className="font-bold text-coffee-900">Pengaturan Booking</h3>
            <p className="text-xs text-gray-500">Atur waktu & meja booking</p>
          </div>
        </Link>

       
        {/* TAMBAHKAN LINK MANAJEMEN KASIR INI */}
        <Link
          to="/admin/users"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 border border-coffee-100"
        >
          <div className="bg-coffee-100 p-3 rounded-full text-2xl">👥</div>
          <div>
            <h3 className="font-bold text-coffee-900">Manajemen Kasir</h3>
            <p className="text-xs text-gray-500">Tambah & hapus akun kasir</p>
          </div>
        </Link>

        <Link
          to="/admin/menu"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 border border-coffee-100"
        >
          <div className="bg-coffee-100 p-3 rounded-full text-2xl">📝</div>
          <div>
            <h3 className="font-bold text-coffee-900">Kelola Menu</h3>
            <p className="text-xs text-gray-500">Tambah/Edit harga & stok</p>
          </div>
        </Link>

        <Link
          to="/admin/inventory"
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 border border-coffee-100"
        >
          <div className="bg-coffee-100 p-3 rounded-full text-2xl">📦</div>
          <div>
            <h3 className="font-bold text-coffee-900">Kelola Stok & Belanja</h3>
            <p className="text-xs text-gray-500">Barang, stok, dan pembelian</p>
          </div>
        </Link>

        {/* Placeholder untuk fitur mendatang */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-gray-300 flex items-center gap-4 opacity-50 cursor-not-allowed">
          <div className="bg-gray-100 p-3 rounded-full text-2xl">📊</div>
          <div>
            <h3 className="font-bold text-gray-500">Laporan Detail</h3>
            <p className="text-xs text-gray-400">Segera hadir</p>
          </div>
        </div>
      </div>
    </div>
  );
}
