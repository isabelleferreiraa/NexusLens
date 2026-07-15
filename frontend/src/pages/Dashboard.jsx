import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";

import Header from "../components/Header/Header";
import AIInsights from "../components/AIInsights/AIInsights";
import StatCard from "../components/StatCard/StatCard";
import GraphView from "../components/GraphView/GraphView";
import MetricsPanel from "../components/MetricsPanel/MetricsPanel";

function Dashboard() {

    const [dados, setDados] = useState(null);
    const [carregandoIA, setCarregandoIA] = useState(false);

    useEffect(() => {

        async function carregarDados() {
            try {
                const resposta = await api.get("/grafo");
                setDados(resposta.data);
            } catch (erro) {
                console.error("Erro ao buscar dados:", erro);
            }
        }

        carregarDados();

    }, []);

    async function gerarRelatorioIA() {
        setCarregandoIA(true);

        try {
            const resposta = await api.get("/grafo/relatorio");
            setDados((anterior) => ({
                ...anterior,
                relatorio: resposta.data.relatorio,
            }));
        } catch (erro) {
            console.error(erro);
            setDados((anterior) => ({
                ...anterior,
                relatorio: "Não foi possível gerar o relatório da IA no momento.",
            }));
        } finally {
            setCarregandoIA(false);
        }
    }

    return (
        <div className="nexuslens-app">
            
            <Header />

            <main className="nexuslens-main">
                
                {/* 1. Área de Inteligência Artificial (Destaque Máximo) */}
                <AIInsights 
                    relatorio={dados?.relatorio} 
                    onGerar={gerarRelatorioIA} 
                    carregando={carregandoIA} 
                />

                {/* 2. Cards de Resumo */}
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

                {/* 3. Grafo e 4. Métricas */}
                {/* Podemos colocar o grafo em cima e métricas embaixo ou vice-versa, conforme o plano. */}
                <section className="graph-section">
                    <GraphView nos={dados?.nos} arestas={dados?.arestas} />
                </section>

                <section className="metrics-section">
                    <MetricsPanel dados={dados} />
                </section>

            </main>

        </div>
    );
}

export default Dashboard;