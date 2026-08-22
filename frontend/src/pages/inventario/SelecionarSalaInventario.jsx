import { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../../styles/selecionarSalaInventario.css";

export default function SelecionarSalaInventario({
    onSelecionar,
    titulo = "Selecione a sala para inventário"
}) {
    const [ambientes, setAmbientes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function carregar() {
            try {
                const res = await api.get("/ambientes/");
                setAmbientes(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, []);

    if (loading) {
        return <p>Carregando ambientes...</p>;
    }

    return (
        <div className="page-container selecionar-sala-container">
            <h1>{titulo}</h1>

            {ambientes.map((ambiente) => (
                <div key={ambiente.id} className="ambiente-bloco">
                    <h2 className="ambiente-titulo">
                        {ambiente.nome}
                    </h2>

                    <div className="salas-grid">
                        {(ambiente.salas || []).map((sala) => (
                            <div
                                key={sala.id}
                                className="sala-card"
                                onClick={() => onSelecionar(sala)}
                            >
                                <h3>{sala.nome}</h3>
                                {sala.descricao && (
                                    <p>{sala.descricao}</p>
                                )}
                            </div>
                        ))}

                        {(!ambiente.salas || ambiente.salas.length === 0) && (
                            <p className="sem-salas">
                                Nenhuma sala cadastrada
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
