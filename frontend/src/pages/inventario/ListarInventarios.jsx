import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import "../../styles/listarInventario.css";


export default function ListarInventarios() {
    const [inventarios, setInventarios] = useState([]);

    useEffect(() => {
        carregar();
    }, []);

    function carregar() {
        api.get("/inventarios/")
            .then(res => setInventarios(res.data))
            .catch(() => setInventarios([]));
    }

    async function excluirInventario(id) {
        const confirmado = window.confirm(
            "Tem certeza que deseja excluir este inventário?"
        );

        if (!confirmado) return;

        try {
            await api.delete(`/inventarios/${id}/`);
            setInventarios(prev =>
                prev.filter(inv => inv.id !== id)
            );
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir inventário");
        }
    }

    return (
        <div className="page-container listar-inventarios-container">
            <h1>Inventários</h1>

            {inventarios.length === 0 ? (
                <p>Nenhum inventário criado.</p>
            ) : (
                <div className="inventarios-grid">
                    {inventarios.map(inv => (
                        <div key={inv.id} className="inventario-card">
                            <h3>{inv.nome}</h3>

                            <p>
                                Criado em:{" "}
                                {new Date(inv.criado_em).toLocaleDateString()}
                            </p>

                            <div className="inventario-actions">
                                <Link
                                    to={`/inventario/${inv.id}/relatorio`}
                                    className="btn btn-primary"
                                >
                                    Ver relatório
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => excluirInventario(inv.id)}
                                    className="btn btn-danger"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
