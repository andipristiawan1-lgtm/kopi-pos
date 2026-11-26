import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchUsers = () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/users"
      : "/api/admin/users";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setUsers(data.data);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/users"
      : "/api/admin/users";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("Kasir berhasil ditambahkan!");
      setForm({ name: "", email: "", password: "" });
      fetchUsers();
    } else {
      setMessage("Gagal menambahkan kasir.");
    }
  };

  const toggleStatus = async (user: any) => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/users"
      : "/api/admin/users";

    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, isActive: !Boolean(user.is_active) }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok) {
      setMessage(user.is_active ? "Kasir berhasil dinonaktifkan." : "Kasir berhasil diaktifkan.");
      fetchUsers();
    } else {
      setMessage(data?.error || "Gagal mengubah status kasir.");
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetUser) return;

    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/users"
      : "/api/admin/users";

    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: resetUser.id, password: newPassword }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok) {
      setMessage("Password kasir berhasil direset.");
      setResetUser(null);
      setNewPassword("");
    } else {
      setMessage(data?.error || "Gagal mereset password.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/admin"
        className="text-coffee-600 hover:underline text-sm mb-6 block"
      >
        ← Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-coffee-100 mb-6">
        <h1 className="text-2xl font-bold text-coffee-900 mb-4">
          Manajemen Akun Kasir
        </h1>
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="block text-xs mb-1">Nama</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border p-2 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border p-2 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border p-2 rounded text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-coffee-600 text-white py-2 rounded font-bold text-sm hover:bg-coffee-700"
          >
            Tambah Kasir
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-sm">Nama</th>
              <th className="p-4 text-sm">Email</th>
              <th className="p-4 text-sm">Role</th>
              <th className="p-4 text-sm">Status</th>
              <th className="p-4 text-sm">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4 font-medium">{user.name}</td>
                <td className="p-4 text-gray-600">{user.email}</td>
                <td className="p-4 uppercase text-xs font-bold text-coffee-600">
                  {user.role}
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-bold py-1 px-3 rounded-full ${
                      user.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.is_active ? "Aktif" : "Tidak Aktif"}
                  </span>
                </td>
                <td className="p-4">
                  {user.role !== "owner" && (
                    <>
                      <button
                        onClick={() => toggleStatus(user)}
                        className="text-blue-500 text-xs font-bold hover:underline mr-2"
                      >
                        {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => setResetUser(user)}
                        className="text-green-500 text-xs font-bold hover:underline"
                      >
                        Reset Password
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetUser !== null && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setResetUser(null);
          }}
        >
          <form
            onSubmit={handleResetPassword}
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-white/60 p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 id="reset-password-title" className="text-xl font-bold text-coffee-900">
                  Reset Password
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Untuk akun <strong className="text-gray-700">{resetUser.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 text-2xl leading-none"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <label className="block text-sm font-bold text-coffee-900 mb-2">
              Password Baru
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-12 border border-slate-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-coffee-500"
              placeholder="Minimal 6 karakter"
            />

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="h-12 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-12 rounded-xl bg-coffee-700 text-white font-bold shadow-md hover:bg-coffee-900"
              >
                Simpan Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
