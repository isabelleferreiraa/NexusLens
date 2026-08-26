import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "../styles/auth.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState("");

    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        setErro("");

        try {
            const data = await login(email, password);

            localStorage.setItem("access_token", data.access_token);

            navigate("/dashboard");
        } catch (error) {
            setErro(error.message || "E-mail ou senha inválidos.");
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

                <h2>Entrar</h2>

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

                    <button
                        className="auth-button"
                        type="submit"
                    >
                        Entrar
                    </button>

                </form>

                <div className="auth-footer">
                    Ainda não possui uma conta?

                    <button
                        type="button"
                        className="auth-link"
                        onClick={() => navigate("/register")}
                    >
                        Criar conta
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Login;