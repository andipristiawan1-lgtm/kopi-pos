import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layouts/PublicLayout";
import Home from "./pages/landing/Home";
import Menu from "./pages/landing/Menu"; 

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
        </Route>

        {/* Nanti kita tambahkan rute /login, /pos, dan /admin di sini */}
      </Routes>
    </BrowserRouter>
  );
}
