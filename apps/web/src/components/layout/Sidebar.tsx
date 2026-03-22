export default function Sidebar() {
  return (
    <div className="w-64 bg-black border-r border-blue-500 text-white h-screen p-6">

      <h1 className="text-2xl text-blue-400 font-bold mb-10">
        MecPro
      </h1>

      <nav className="flex flex-col gap-6">

        <button className="text-left hover:text-blue-400">
          🏠 Home
        </button>

        <button className="text-left hover:text-blue-400">
          👥 Clientes
        </button>

        <button className="text-left hover:text-blue-400">
          🧾 Orçamentos
        </button>

        <button className="text-left hover:text-blue-400">
          💳 Faturas
        </button>

        <button className="text-left hover:text-blue-400">
          ⚙️ Configurações
        </button>

      </nav>

    </div>
  )
}