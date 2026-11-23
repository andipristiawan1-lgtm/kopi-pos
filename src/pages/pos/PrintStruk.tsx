// (Ini adalah komponen sederhana yang bisa dipanggil nanti)
export default function PrintStruk({ order }: { order: any }) {
  if (!order) return null;

  return (
    <div className="hidden print:block p-4 text-sm font-mono w-[300px]">
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg">WARUNG KOPI</h2>
        <p>Jl. Raya No. 123, Kota</p>
        <p>========================</p>
      </div>

      <div className="mb-2">
        <p>No: {order.order_number}</p>
        <p>Tgl: {new Date(order.created_at * 1000).toLocaleString("id-ID")}</p>
        <p>
          Tipe:{" "}
          {order.order_type === "dine_in"
            ? `Meja ${order.table_number}`
            : "Take-away"}
        </p>
        <p>========================</p>
      </div>

      <div className="mb-4">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span>{/* Hitung subtotal */}</span>
          </div>
        ))}
      </div>

      <p>========================</p>
      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
      </div>
      <p className="text-center mt-4">Terima Kasih!</p>
    </div>
  );
}
