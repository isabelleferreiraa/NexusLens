import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";

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
                relatorio:
                    "Não foi possível gerar o relatório da IA no momento.",
            }));

        } finally {

            setCarregandoIA(false);

        }

    }

    return (
        <div className="dashboard">

            <header className="header">
                <h1>NexusLens</h1>
                <p>Plataforma Inteligente de Análise Financeira</p>
            </header>

            <main>

                <section className="cards">

                    <div className="card">
                        <h2>Score de Risco</h2>
                        <h3>{dados?.score_risco ?? "--"}</h3>
                    </div>

                    <div className="card">
                        <h2>Classificação</h2>
                        <h3>{dados?.classificacao ?? "--"}</h3>
                    </div>

                </section>

                <section className="card">

                    <h2>Recomendação</h2>

                    <p>
                        {dados?.recomendacao ?? "Carregando..."}
                    </p>

                </section>

                <section className="card">

                    <h2>Métricas</h2>

                    <p><strong>Influência:</strong> {dados?.metricas?.nivel_influencia ?? "--"}</p>

                    <p><strong>Conexões:</strong> {dados?.metricas?.quantidade_conexoes ?? "--"}</p>

                    <p><strong>Papel:</strong> {dados?.metricas?.papel_na_rede ?? "--"}</p>

                </section>

                <section className="card">

                    <h2>Relatório da IA</h2>

                    <p>
                        {dados?.relatorio ?? "Clique no botão abaixo para gerar o relatório."}
                    </p>

                    <button
                        onClick={gerarRelatorioIA}
                        disabled={carregandoIA}
                    >
                        {carregandoIA
                            ? "Gerando..."
                            : "🧠 Gerar Relatório"}
                    </button>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;