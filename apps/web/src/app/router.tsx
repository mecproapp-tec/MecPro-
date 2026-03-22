import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// Páginas públicas
import Login from "../pages/public/Login/Login"
import Register from "../pages/public/Register/Register"

// Páginas privadas
import Dashboard from "../pages/private/Dashboard/Dashboard"
import Clients from "../pages/private/Clients/Clients"
import Estimates from "../pages/private/Estimates/Estimates"
import Invoices from "../pages/private/Invoices/Invoices"
import Admin from "../pages/private/Admin/Admin"

// Layout e Guard
import AppLayout from "../layouts/AppLayout"
import PrivateRoute from "../routes/PrivateRoute"

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas privadas */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* Redirect padrão */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}