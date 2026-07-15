import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {

    const [dados, setDados] = useState(null);

    useEffect(() => {

        async function carregarDados() {

            try {

                const resposta = await api.get("/grafo");

                setDados(resposta.data);

            } catch (erro) {

                console.error("Erro ao buscar dados da API:", erro);

            }

        }

        carregarDados();

    }, []);

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

                    <p>
                        <strong>Influência:</strong>{" "}
                        {dados?.metricas?.nivel_influencia ?? "--"}
                    </p>

                    <p>
                        <strong>Conexões:</strong>{" "}
                        {dados?.metricas?.quantidade_conexoes ?? "--"}
                    </p>

                    <p>
                        <strong>Papel:</strong>{" "}
                        {dados?.metricas?.papel_na_rede ?? "--"}
                    </p>

                </section>

                <section className="card">

                    <h2>Relatório da IA</h2>

                    <p>
                        {dados?.relatorio ?? "Carregando relatório..."}
                    </p>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;