type PrintStrukProps = {
  order: any;
  onClose: () => void;
};

export default function PrintStruk({ order, onClose }: PrintStrukProps) {
  if (!order) return null;

  // Fungsi untuk mencetak via Bluetooth Print App
  const handlePrintBluetooth = () => {
    // Format teks sesuai instruksi aplikasi Bluetooth Print
    // <1> = Bold, <0> = Normal, <11> = Center, <10> = Left
    let str = "";
    
    // Header
    str += "<11><1>HOTEL BELITANG<0>\n";
    str += "<11>Jl. Raya Belitang No. 123\n";
    str += "<11>Telp: 0812-3456-7890\n";
    str += "<11>--------------------------------\n";

    // Info Pesanan
    str += `<10>No. Pesanan: ${order.order_number}\n`;
    str += `<10>Waktu: ${new Date(order.created_at * 1000).toLocaleString("id-ID")}\n`;
    
    // Tipe Pesanan
    let tipe = "";
    if (order.order_type === "hotel") tipe = "Reservasi Kamar";
    else if (order.order_type === "booking") tipe = `Booking Aula ${order.table_number}`;
    else if (order.order_type === "dine_in") tipe = `Dine-in (Meja ${order.table_number})`;
    else tipe = "Take-away";
    str += `<10>Tipe: ${tipe}\n`;
    
    // Info Kamar / Aula (Jika ada)
    if (order.order_type === "hotel") {
      str += `<10>Check-in: ${order.check_in || "-"}\n`;
      str += `<10>Check-out: ${order.check_out || "-"}\n`;
      str += `<10>Tamu: ${order.adults} Dewasa, ${order.children} Anak\n`;
    } else if (order.order_type === "booking") {
      str += `<10>Tanggal Acara: ${order.booking_date || "-"}\n`;
      str += `<10>Jam Mulai: ${order.booking_time || "-"}\n`;
    }

    str += `<10>Pelanggan: ${order.customer_name}\n`;
    str += `<10>Status: ${order.is_paid ? "LUNAS" : "BELUM BAYAR"}\n`;
    str += "<11>--------------------------------\n";

    // Daftar Item
    order.items.forEach((item: any) => {
      str += `<10>${item.quantity}x ${item.name}\n`;
      str += `<12>    Rp ${item.subtotal.toLocaleString("id-ID")}\n`;
    });

    str += "<11>--------------------------------\n";
    
    // Total
    str += `<10><1>TOTAL: Rp ${order.total_amount.toLocaleString("id-ID")}<0>\n`;
    
    // Catatan
    str += "<11>Terima Kasih\n";
    str += "<11>Atas Kunjungan Anda\n\n\n\n";

    // Kirim via Intent Android
    // Format URL: intent:send?text=... (Aplikasi Bluetooth Print menggunakan scheme ini)
    const encodedStr = encodeURIComponent(str);
    
    // Coba buka via intent scheme
    const intentUrl = `intent:send?text=${encodedStr}#Intent;package=mate.bluetoothprint;end`;
    
    // Alternatif fallback jika intent gagal (menggunakan URL scheme standar)
    const fallbackUrl = `bluetoothprint://print?text=${encodedStr}`;

    // Eksekusi
    try {
      // Coba intent pertama
      window.location.href = intentUrl;
      
      // Fallback setelah 1 detik jika intent tidak berhasil
      setTimeout(() => {
        window.location.href = fallbackUrl;
      }, 1000);
      
    } catch (e) {
      alert("Gagal membuka aplikasi Bluetooth Print. Pastikan aplikasi sudah terinstall.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      {/* Area Struk (yang akan dicetak) */}
      <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl">
        <div id="struk-area" className="font-mono text-sm text-black">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg uppercase">HOTEL BELITANG</h2>
            <p className="text-xs">Jl. Raya Belitang No. 123</p>
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
              <span>{new Date(order.created_at * 1000).toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between">
              <span>Tipe:</span>
              <span className="font-bold">
                {order.order_type === "hotel" && "Reservasi Kamar"}
                {order.order_type === "booking" && `Booking Aula ${order.table_number}`}
                {order.order_type === "dine_in" && `Dine-in (Meja ${order.table_number})`}
                {order.order_type === "take_away" && "Take-away"}
              </span>
            </div>

            {/* Info Tambahan Hotel/Aula */}
            {order.order_type === "hotel" && (
              <>
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{order.check_in || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{order.check_out || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tamu:</span>
                  <span>{order.adults} Dewasa, {order.children} Anak</span>
                </div>
              </>
            )}
            {order.order_type === "booking" && (
              <>
                <div className="flex justify-between">
                  <span>Tanggal Acara:</span>
                  <span>{order.booking_date || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jam Mulai:</span>
                  <span>{order.booking_time || "-"}</span>
                </div>
              </>
            )}

            <div className="flex justify-between font-bold pt-2 border-t mt-2">
              <span>Status:</span>
              <span className={order.is_paid ? "text-green-700" : "text-red-600"}>
                {order.is_paid ? "LUNAS" : "BELUM BAYAR"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span>{order.customer_name}</span>
            </div>
          </div>

          <p className="text-xs mb-2">--------------------------------</p>

          <div className="mb-4 text-xs space-y-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{item.subtotal.toLocaleString("id-ID")}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs mb-2">--------------------------------</p>

          <div className="flex justify-between font-bold text-base mb-4">
            <span>TOTAL</span>
            <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
          </div>

          <p className="text-center text-xs mt-6">Terima Kasih Atas Kunjungan Anda..</p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-2 mt-6 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded font-bold hover:bg-gray-200"
          >
            Tutup
          </button>
          <button
            onClick={handlePrintBluetooth}
            className="flex-1 px-4 py-2 text-white bg-coffee-500 rounded font-bold hover:bg-coffee-700 flex items-center justify-center gap-2"
          >
            <span>🖨️</span> Cetak Bluetooth
          </button>
        </div>
      </div>
    </div>
  );
}