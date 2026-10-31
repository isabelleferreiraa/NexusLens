import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export default function useGrafo() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await api.get('/grafo');
      if (!resposta.data || !Array.isArray(resposta.data.nos) || !Array.isArray(resposta.data.arestas)) {
        throw new Error('Formato de rede inválido');
      }
      setDados(resposta.data);
    } catch (error) {
      console.error('Falha ao carregar rede:', error);
      setErro('Não foi possível carregar os dados da rede. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);
  return { dados, setDados, carregando, erro, recarregar };
}
