import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { EstimateDetails } from './EstimateDetails';

interface Estimate {
  id: number;
  total: number;
  client: {
    name: string;
    phone: string;
  };
}

export const DetalhesOrcamento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const response = await api.get(`/estimates/${id}`);
        setEstimate(response.data);
      } catch (err) {
        setError('Orçamento não encontrado.');
      } finally {
        setLoading(false);
      }
    };
    fetchEstimate();
  }, [id]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;
  if (!estimate) return <div>Orçamento não encontrado.</div>;

  return <EstimateDetails estimate={estimate} />;
};