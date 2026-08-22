import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import "../styles/Login.css";


export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");

        try {
            const response = await api.post("/token/", {
                username,
                password,
            });

            // salva token
            localStorage.setItem("access_token", response.data.access);
            localStorage.setItem("refresh_token", response.data.refresh);

            // redireciona
            navigate("/");
        } catch (err) {
            setErro("Usuário ou senha inválidos");
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2 className="login-title">Login</h2>

                <form
                    onSubmit={handleSubmit}
                    className="login-form"
                >
                    <input
                        type="text"
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {erro && (
                        <p className="login-error">
                            {erro}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
}