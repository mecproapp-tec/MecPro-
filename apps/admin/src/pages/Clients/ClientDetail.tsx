import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiHome } from 'react-icons/fi';

interface ClientDetail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: string;
  plate: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/admin/clients/${id}`);
        setClient(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar dados do cliente');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!client) return <div className="p-8 text-center">Cliente não encontrado</div>;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/clients')}
        className="text-neonBlue hover:underline mb-4 inline-flex items-center gap-2"
      >
        <FiArrowLeft /> Voltar
      </button>

      <div className="bg-gray900 rounded-lg border border-gray800 p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-neonBlue/20 rounded-full flex items-center justify-center">
            <FiUser className="text-neonBlue" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <p className="text-gray-400">Cliente desde {new Date(client.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FiPhone className="text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Telefone</p>
                <p className="text-white">{client.phone}</p>
              </div>
            </div>
            {client.email && (
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">E-mail</p>
                  <p className="text-white">{client.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <FiHome className="text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Veículo</p>
                <p className="text-white">{client.vehicle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiMapPin className="text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Placa</p>
                <p className="text-white font-mono">{client.plate}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FiUser className="text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Tenant (Oficina)</p>
                <p className="text-white">{client.tenant.name}</p>
                <p className="text-gray-500 text-xs">{client.tenant.email}</p>
              </div>
            </div>
            {(client.address || client.city || client.state) && (
              <div className="flex items-center gap-3">
                <FiMapPin className="text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Endereço</p>
                  <p className="text-white">
                    {[client.address, client.city, client.state].filter(Boolean).join(', ')}
                  </p>
                  {client.zipCode && <p className="text-gray-500 text-xs">CEP: {client.zipCode}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
