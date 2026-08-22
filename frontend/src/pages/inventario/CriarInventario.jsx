import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../api/api";
import "../../styles/criarInventario.css";


export default function CriarInventario() {
    const [nome, setNome] = useState("");
    const [inventarios, setInventarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    async function carregarInventarios() {
        try {
            const res = await api.get("/inventarios/");
            setInventarios(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarInventarios();
    }, []);

    async function criar() {
        if (!nome.trim()) {
            alert("Informe o nome do inventário");
            return;
        }

        try {
            const res = await api.post("/inventarios/", { nome });
            navigate(`/inventario/${res.data.id}`);
        } catch (err) {
            alert("Erro ao criar inventário");
            console.error(err);
        }
    }

    return (
        <div className="selecionar-container">
            <h1>Inventário Patrimonial</h1>
            <p className="selecionar-subtitle">
                Crie um novo inventário ou continue um já existente
            </p>

            {/* CRIAR */}
            <div className="card">
                <label>Nome do inventário</label>

                <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Inventário Abril 2025"
                />

                <button
                    className="btn btn-primary"
                    onClick={criar}
                >
                    Criar Inventário
                </button>
            </div>

            {/* LISTA */}
            <h3>Inventários existentes</h3>

            {loading ? (
                <p>Carregando inventários...</p>
            ) : inventarios.length === 0 ? (
                <p>Nenhum inventário criado.</p>
            ) : (
                <div className="relatorios-grid">
                    {inventarios.map(inv => (
                        <div key={inv.id} className="relatorio-card">
                            <h4>{inv.nome}</h4>
                            <p>
                                Criado em{" "}
                                {new Date(inv.criado_em).toLocaleDateString()}
                            </p>

                            <div>
                                <button
                                    className="btn"
                                    onClick={() =>
                                        navigate(`/inventario/${inv.id}`)
                                    }
                                >
                                    Continuar
                                </button>

                                <Link
                                    to={`/inventario/${inv.id}/relatorio`}
                                    className="btn btn-secondary"
                                >
                                    Ver relatório
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
