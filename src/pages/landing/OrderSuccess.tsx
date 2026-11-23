import { useParams, Link } from "react-router-dom";

export default function OrderSuccess() {
  const { orderNumber } = useParams();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full border-t-4 border-green-500">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-coffee-900 mb-2">
          Pesanan Berhasil!
        </h1>
        <p className="text-gray-600 mb-6">
          Pesanan Anda sedang diproses oleh kasir kami.
        </p>

        <div className="bg-coffee-50 p-4 rounded-lg mb-8">
          <p className="text-sm text-coffee-700 mb-1">Nomor Pesanan Anda:</p>
          <p className="text-xl font-mono font-bold text-coffee-900">
            {orderNumber}
          </p>
        </div>

        <Link
          to="/menu"
          className="text-coffee-600 hover:text-coffee-900 font-medium underline"
        >
          Pesan Lagi
        </Link>
      </div>
    </div>
  );
}
