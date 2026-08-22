import { useEffect, useState } from "react";
import { api } from "../../api/api";
import LeitorQR from "../../components/LeitorQRTombamento";
import "../../styles/SelecionarSalaTombamento.css";


export default function SelecionarSala() {
    const [ambientes, setAmbientes] = useState([]);
    const [salas, setSalas] = useState([]);

    const [ambienteId, setAmbienteId] = useState("");
    const [salaId, setSalaId] = useState("");

    const [tombamentoId, setTombamentoId] = useState(null);
    const [carregando, setCarregando] = useState(true);

    // Iniciar tombamento
    useEffect(() => {
        api.post("tombamentos/iniciar/")
            .then(res => {
                setTombamentoId(res.data.tombamento_id);
            })
            .catch(() => {
                alert("Erro ao iniciar tombamento");
            })
            .finally(() => setCarregando(false));
    }, []);

    // Carregar ambientes
    useEffect(() => {
        api.get("ambientes/")
            .then(res => setAmbientes(res.data))
            .catch(err => console.error(err));
    }, []);

    // Carregar salas
    useEffect(() => {
        if (!ambienteId) return;

        api.get(`salas/?ambiente=${ambienteId}`)
            .then(res => setSalas(res.data))
            .catch(err => console.error(err));
    }, [ambienteId]);

    // Abre leitor
    if (salaId && tombamentoId) {
        return (
            <LeitorQR
                tombamentoId={tombamentoId}
                salaId={salaId}
            />
        );
    }

    return (
        <div className="selecionar-container">
            <h1>Selecionar Sala</h1>
            <p className="selecionar-subtitle">
                Escolha o ambiente e a sala para iniciar o tombamento
            </p>

            <div className="selecionar-form">
                {carregando && (
                    <p className="status-text">
                        Iniciando tombamento...
                    </p>
                )}

                <label>Ambiente</label>
                <select
                    value={ambienteId}
                    onChange={e => {
                        setAmbienteId(e.target.value);
                        setSalaId("");
                        setSalas([]);
                    }}
                    disabled={carregando}
                >
                    <option value="">Selecione o ambiente</option>
                    {ambientes.map(a => (
                        <option key={a.id} value={a.id}>
                            {a.nome}
                        </option>
                    ))}
                </select>

                <label>Sala</label>
                <select
                    value={salaId}
                    onChange={e => setSalaId(e.target.value)}
                    disabled={!ambienteId || carregando}
                >
                    <option value="">Selecione a sala</option>
                    {salas.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.nome}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
