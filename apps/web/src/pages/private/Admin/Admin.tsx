import { useState } from "react"

export default function Admin() {
  const [users, setUsers] = useState([
    { id: 1, name: "Admin A", email: "admina@mecpro.com" },
    { id: 2, name: "Admin B", email: "adminb@mecpro.com" }
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold text-neonBlue mb-4">Administração</h1>
      <div className="overflow-x-auto bg-gray800 p-4 rounded-2xl shadow-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400">
              <th className="py-2 px-4">Nome</th>
              <th className="py-2 px-4">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray700 hover:bg-gray700 transition">
                <td className="py-2 px-4">{u.name}</td>
                <td className="py-2 px-4">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}