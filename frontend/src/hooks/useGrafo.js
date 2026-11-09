import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { IBM_AML, validateIbmGraph } from '../utils/datasets';

/** Single-source graph loader. Never fetches or substitutes the legacy demo graph. */
export default function useGrafo() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [indisponivel, setIndisponivel] = useState(false);
  const [situacao, setSituacao] = useState('nao_importado');
  const [versao, setVersao] = useState(0);
  const recarregar = useCallback(() => setVersao((anterior) => anterior + 1), []);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setDados(null);
      setErro('');
      setIndisponivel(false);
      try {
        const resposta = await api.get(IBM_AML.graph);
        if (!ativo) return;
        const resultado = validateIbmGraph(resposta.data);
        if (resultado.unavailable) {
          setSituacao(resultado.status);
          setIndisponivel(true);
          return;
        }
        if (!resultado.ok) throw new Error('Resposta da API IBM inválida');
        setDados(resposta.data);
      } catch (error) {
        if (!ativo) return;
        console.error('Falha ao consultar a rede IBM:', error);
        setErro('Não foi possível consultar o IBM AML-Data. Verifique se a API foi publicada no Render e tente novamente.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [versao]);

  return { dados, setDados, carregando, erro, indisponivel, situacao, recarregar };
}
