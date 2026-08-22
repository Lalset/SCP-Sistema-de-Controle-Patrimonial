import { useParams } from "react-router-dom";
import { useState } from "react";
import LeitorQRInventario from "../../components/LeitorQRInventario";
import SelecionarSalaInventario from "./SelecionarSalaInventario";
import "../../styles/scannerInventario.css";

export default function ScannerInventario() {
    const { id } = useParams();
    const [sala, setSala] = useState(null);

    if (!sala) {
        return (
            <SelecionarSalaInventario
                onSelecionar={setSala}
                titulo="Selecione a sala para inventário"
            />
        );
    }

    return (
        <div className="page-container scanner-inventario-container">

            <div className="scanner-header">
                <h1>Inventário em andamento</h1>

                <p className="scanner-subtitle">
                    <b>Inventário:</b> #{id}
                    <br />
                    <b>Sala selecionada:</b> {sala.nome}
                </p>
            </div>

            <div className="scanner-card">
                <LeitorQRInventario
                    inventarioId={id}
                    salaId={sala.id}
                />
            </div>

            <div className="scanner-actions">
                <button
                    className="btn btn-secondary"
                    onClick={() => setSala(null)}
                >
                    Trocar sala
                </button>
            </div>

        </div>
    );
}
