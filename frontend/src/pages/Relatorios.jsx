import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import "../styles/Relatorios.css";


export default function Relatorios() {
    const [anos, setAnos] = useState([]);

    useEffect(() => {
        api.get("relatorios/tombamentos/")
            .then(res => setAnos(res.data))
            .catch(() => setAnos([]));
    }, []);

    return (
        <div className="relatorios-container">
            <h1 className="relatorios-title">Relatórios de Tombamento</h1>
            <p className="relatorios-subtitle">
                Selecione o ano para visualizar ou exportar o relatório
            </p>

            {anos.length === 0 ? (
                <p>Nenhum relatório disponível.</p>
            ) : (
                <div className="relatorios-grid">
                    {anos.map(ano => (
                        <div key={ano} className="relatorio-card">
                            <Link to={`/relatorios/tombamento/${ano}`}>
                                <h3>{ano}</h3>
                                <p>Visualizar relatório anual</p>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
