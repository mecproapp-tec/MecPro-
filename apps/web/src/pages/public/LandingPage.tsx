import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">Bem-vindo ao MecPro</h1>
      <div className="space-x-4">
        <Link
          to="/login"
          className="px-6 py-2 bg-cyan-400 text-black font-bold rounded hover:bg-cyan-500 transition"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="px-6 py-2 bg-green-500 text-black font-bold rounded hover:bg-green-600 transition"
        >
          Cadastrar
        </Link>
      </div>
    </div>
  )
}