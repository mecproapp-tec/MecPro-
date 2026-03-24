import { useState } from "react"

export default function Invoices() {
  const [invoices, setInvoices] = useState([
    { id: 1, client: "Oficina A", total: 350, paid: true },
    { id: 2, client: "Oficina B", total: 1200, paid: false }
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold text-neonBlue mb-4">Faturas</h1>
      <div className="overflow-x-auto bg-gray800 p-4 rounded-2xl shadow-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400">
              <th className="py-2 px-4">Cliente</th>
              <th className="py-2 px-4">Valor</th>
              <th className="py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} className="border-b border-gray700 hover:bg-gray700 transition">
                <td className="py-2 px-4">{i.client}</td>
                <td className="py-2 px-4">R$ {i.total}</td>
                <td className={`py-2 px-4 ${i.paid ? "text-neonGreen" : "text-neonBlue"}`}>{i.paid ? "Pago" : "Pendente"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}