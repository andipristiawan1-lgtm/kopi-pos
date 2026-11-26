import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layouts/PublicLayout";
import Home from "./pages/landing/Home";
import Menu from "./pages/landing/Menu";
import Order from "./pages/landing/Order";
import OrderSuccess from "./pages/landing/OrderSuccess";
import PosDashboard from "./pages/pos/PosDashboard";
import Login from "./pages/auth/Login";
import RequireAuth from "./components/RequireAuth";
import MenuManager from "./pages/admin/MenuManager";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StoreProfile from "./pages/admin/StoreProfile";
import OrderHistory from "./pages/pos/OrderHistory";
import TableManager from "./pages/admin/TableManager";
import Booking from "./pages/landing/Booking";
import BookingSettings from "./pages/admin/BookingSettings";
import UserManager from "./pages/admin/UserManager";
import InventoryManager from "./pages/admin/InventoryManager";
import KitchenDisplay from "./pages/pos/KitchenDisplay";
import PaymentLogs from "./pages/admin/PaymentLogs";
import CustomerOrderHistory from "./pages/landing/CustomerOrderHistory";
import CategoryManager from "./pages/admin/CategoryManager"; // <-- Tambahkan ini

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================================
            RUTE PUBLIK (Dengan Navbar & Footer)
        ========================================= */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
          <Route
            path="/order/success/:orderNumber"
            element={<OrderSuccess />}
          />
          <Route path="/order/history" element={<CustomerOrderHistory />} />
          <Route path="/booking" element={<Booking />} />
        </Route>

        {/* =========================================
            RUTE AUTH
        ========================================= */}
        <Route path="/login" element={<Login />} />

        {/* =========================================
            RUTE KASIR (POS) - Wajib Login
        ========================================= */}
        <Route
          path="/pos"
          element={
            <RequireAuth>
              <PosDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/pos/history"
          element={
            <RequireAuth>
              <OrderHistory />
            </RequireAuth>
          }
        />
        <Route
          path="/pos/kitchen-display"
          element={
            <RequireAuth>
              <KitchenDisplay />
            </RequireAuth>
          }
        />
        <Route
          path="/kitchen"
          element={
            <RequireAuth>
              <KitchenDisplay />
            </RequireAuth>
          }
        />

        {/* =========================================
            RUTE ADMIN/OWNER - Wajib Login
        ========================================= */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <RequireAuth>
              <MenuManager />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <RequireAuth>
              <StoreProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <RequireAuth>
              <TableManager />
            </RequireAuth>
          }
        />
        
        <Route
          path="/admin/booking"
          element={
            <RequireAuth>
              <BookingSettings />
            </RequireAuth>
          }
        />
        {/* RUTE BARU: Manajemen Akun Kasir */}
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <UserManager />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <RequireAuth>
              <InventoryManager />
            </RequireAuth>
          }
        />
        <Route 
  path="/admin/categories" 
  element={
    <RequireAuth>
      <CategoryManager />
    </RequireAuth>
  } 
/>
        <Route
          path="/admin/payment-logs"
          element={
            <RequireAuth>
              <PaymentLogs />
            </RequireAuth>
          }
          
        />
      </Routes>
    </BrowserRouter>
  );
}
