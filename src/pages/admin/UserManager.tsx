import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

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

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus kasir ini?")) return;
    const apiUrl = import.meta.env.DEV
      ? `http://127.0.0.1:8788/api/admin/users?id=${id}`
      : `/api/admin/users?id=${id}`;
    await fetch(apiUrl, { method: "DELETE" });
    fetchUsers();
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
                  {user.role !== "owner" && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 text-xs font-bold hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
