import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/api";
import "../styles/auth.css";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();

        setErro("");
        setSucesso("");

        try {
            await register(email, password);

            setSucesso("Usuário cadastrado com sucesso!");

            setTimeout(() => {
                navigate("/");
            }, 1000);

        } catch (error) {
            setErro(error.message || "Erro ao criar usuário.");
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">

                <div className="auth-brand">
                    <h1>
                        Nexus<span>Lens</span>
                    </h1>

                    <p className="auth-subtitle">
                        Inteligência para análise de dados
                    </p>
                </div>

                <h2>Criar conta</h2>

                <form className="auth-form" onSubmit={handleSubmit}>

                    <div className="auth-field">
                        <label htmlFor="email">E-mail</label>

                        <input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">Senha</label>

                        <input
                            id="password"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    {erro && (
                        <p className="auth-error">
                            {erro}
                        </p>
                    )}

                    {sucesso && (
                        <p style={{
                            color: "var(--green-light)",
                            fontSize: "12px"
                        }}>
                            {sucesso}
                        </p>
                    )}

                    <button
                        className="auth-button"
                        type="submit"
                    >
                        Criar conta
                    </button>

                </form>

                <div className="auth-footer">
                    Já possui uma conta?

                    <button
                        type="button"
                        className="auth-link"
                        onClick={() => navigate("/")}
                    >
                        Entrar
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Register;