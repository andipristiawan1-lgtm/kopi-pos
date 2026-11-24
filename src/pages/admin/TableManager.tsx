import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function TableManager() {
  const [tables, setTables] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const fetchTables = () => {
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/tables"
      : "/api/admin/tables";
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTables(data.data);
      });
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSave = async (id: number, price: number) => {
    setMessage("");
    const apiUrl = import.meta.env.DEV
      ? "http://127.0.0.1:8788/api/admin/tables"
      : "/api/admin/tables";
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, booking_price: price }),
    });
    setMessage("Harga booking berhasil disimpan!");
    fetchTables();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/admin"
        className="text-coffee-600 hover:underline text-sm mb-6 block"
      >
        ← Kembali ke Dashboard
      </Link>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-coffee-100">
        <h1 className="text-2xl font-bold text-coffee-900 mb-6">
          Manajemen Meja & Booking
        </h1>
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded mb-4">
            {message}
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 text-sm font-bold text-gray-600">Meja</th>
              <th className="p-3 text-sm font-bold text-gray-600">
                Harga DP (Booking)
              </th>
              <th className="p-3 text-sm font-bold text-gray-600">
                Status Saat Ini
              </th>
              <th className="p-3 text-sm font-bold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.id} className="border-b">
                <td className="p-3 font-bold">Meja {table.table_number}</td>
                <td className="p-3">
                  <input
                    type="number"
                    defaultValue={table.booking_price}
                    onBlur={(e) =>
                      handleSave(table.id, parseInt(e.target.value) || 0)
                    }
                    className="border border-gray-300 rounded p-1 w-32 text-sm"
                  />
                </td>
                <td className="p-3 text-sm uppercase font-medium">
                  {table.status}
                </td>
                <td className="p-3 text-xs text-gray-400">
                  Auto-save saat klik di luar
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
