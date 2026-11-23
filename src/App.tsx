import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layouts/PublicLayout";
import Home from "./pages/landing/Home";
import Menu from "./pages/landing/Menu"; 
import Order from "./pages/landing/Order";
import OrderSuccess from "./pages/landing/OrderSuccess";

// Placeholder untuk halaman yang belum dibuat
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-20 text-center text-2xl text-coffee-700">
    {title} (Coming Soon)
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Placeholder title="Pesan Online" />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order/success/:orderNumber" element={<OrderSuccess />} />
        </Route>

        {/* Nanti kita tambahkan rute /login, /pos, dan /admin di sini */}
      </Routes>
    </BrowserRouter>
  );
}
