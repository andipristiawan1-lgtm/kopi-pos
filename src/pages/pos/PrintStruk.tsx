type PrintStrukProps = {
  order: any;
  onClose: () => void;
};

export default function PrintStruk({ order, onClose }: PrintStrukProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      {/* Area Struk (yang akan dicetak) */}
      <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl">
        <div id="struk-area" className="font-mono text-sm text-black">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg uppercase">Warung Kopi</h2>
            <p className="text-xs">Jl. Kopi Nikmat No. 123</p>
            <p className="text-xs">Telp: 0812-3456-7890</p>
            <p className="mt-2">--------------------------------</p>
          </div>

          <div className="mb-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span>No. Pesanan:</span>
              <span>{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>
                {new Date(order.created_at * 1000).toLocaleString("id-ID")}
              </span>
            </div>

            {/* PERBAIKAN TIPE PESANAN */}
            <div className="flex justify-between">
              <span>Tipe:</span>
              <span className="font-bold">
                {order.order_type === "dine_in" &&
                  `Dine-in (Meja ${order.table_number})`}
                {order.order_type === "take_away" && "Take-away"}
                {order.order_type === "booking" &&
                  `Booking Meja ${order.table_number}`}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Metode:</span>
              <span className="uppercase">{order.payment_method}</span>
            </div>

            {/* STATUS PEMBAYARAN */}
            <div className="flex justify-between font-bold">
              <span>Status:</span>
              <span
                className={order.is_paid ? "text-green-700" : "text-red-600"}
              >
                {order.is_paid ? "LUNAS" : "BELUM BAYAR"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span>{order.customer_name}</span>
            </div>
          </div>

          <p className="text-xs mb-2">--------------------------------</p>

          {/* DAFTAR ITEM DENGAN HARGA */}
          <div className="mb-4 text-xs space-y-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{item.subtotal.toLocaleString("id-ID")}</span>
                </div>
                {/* Tampilkan harga satuan jika lebih dari 1 */}
                {item.quantity > 1 && (
                  <div className="text-[10px] text-gray-600 text-right">
                    @ {item.price_at_time.toLocaleString("id-ID")}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs mb-2">--------------------------------</p>

          <div className="flex justify-between font-bold text-base mb-4">
            <span>TOTAL</span>
            <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
          </div>

          {/* CATATAN KHUSUS UNTUK BOOKING */}
          {order.order_type === "booking" && (
            <div className="text-[10px] text-center mb-4 text-gray-700 italic">
              *Total di atas sudah termasuk DP Booking.
              <br />
              Sisa pelunasan dibayar saat kedatangan.
            </div>
          )}

          <p className="text-center text-xs mt-6">
            Terima Kasih Atas Kunjungan Anda
          </p>
        </div>

        {/* Tombol Aksi (Tidak ikut tercetak) */}
        <div className="flex gap-2 mt-6 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded font-bold hover:bg-gray-200"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 text-white bg-coffee-500 rounded font-bold hover:bg-coffee-700"
          >
            Cetak
          </button>
        </div>
      </div>
    </div>
  );
}
