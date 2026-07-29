// Hook do React para trabalhar com estados e executar código quando a página carrega
import { useEffect, useState } from "react";

// Instância do Axios configurada em services/api.js
import api from "../services/api";

// CSS da página
import "../styles/dashboard.css";

// Componentes da tela
import Header from "../components/Header/Header";
import AIInsights from "../components/AIInsights/AIInsights";
import StatCard from "../components/StatCard/StatCard";
import GraphView from "../components/GraphView/GraphView";
import MetricsPanel from "../components/MetricsPanel/MetricsPanel";

function Dashboard() {

    // ==========================================
    // ESTADOS
    // ==========================================

    const [dados, setDados] = useState(null);
    const [carregandoIA, setCarregandoIA] = useState(false);

    // ==========================================
    // CARREGA OS DADOS DA API
    // ==========================================

    useEffect(() => {

        async function carregarDados() {

            try {

                const resposta = await api.get("/grafo");

                console.log("DADOS RECEBIDOS DO BACKEND:", resposta.data);

                setDados(resposta.data);

            } catch (erro) {

                console.error("Erro ao buscar dados:", erro);

            }

        }

        carregarDados();

    }, []);


    // ==========================================
    // GERA O RELATÓRIO DA IA
    // ==========================================

    async function gerarRelatorioIA() {

        console.log("DADOS ENVIADOS PARA /relatorio:", dados);

        setCarregandoIA(true);

        try {

            const resposta = await api.post("/relatorio", dados);

            setDados((anterior) => ({
                ...anterior,
                relatorio: resposta.data.relatorio,
            }));

        } catch (erro) {

            console.error("Erro completo:", erro);

            setDados((anterior) => ({
                ...anterior,
                relatorio:
                    "Não foi possível gerar o relatório da IA no momento.",
            }));

        } finally {

            setCarregandoIA(false);

        }

    }


    // ==========================================
    // INTERFACE
    // ==========================================

    return (

        <div className="nexuslens-app">

            <Header />

            <main className="nexuslens-main">

                <AIInsights
                    relatorio={dados?.relatorio}
                    onGerar={gerarRelatorioIA}
                    carregando={carregandoIA}
                />

                <section className="stat-cards-row">

                    <StatCard
                        icon="⚠️"
                        label="Score de Risco"
                        value={dados?.score_risco}
                        color="red"
                    />

                    <StatCard
                        icon="🏷️"
                        label="Classificação"
                        value={dados?.classificacao}
                        color="yellow"
                    />

                    <StatCard
                        icon="👥"
                        label="Conexões"
                        value={dados?.metricas?.quantidade_conexoes}
                        color="blue"
                    />

                </section>

                <section className="graph-section">

                    <GraphView
                        nos={dados?.nos}
                        arestas={dados?.arestas}
                    />

                </section>

                <section className="metrics-section">

                    <MetricsPanel
                        dados={dados}
                    />

                </section>

            </main>

        </div>

    );

}

export default Dashboard;