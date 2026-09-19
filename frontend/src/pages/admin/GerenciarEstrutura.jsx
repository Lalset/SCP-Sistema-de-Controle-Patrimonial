import { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../../styles/GerenciarEstrutura.css";

export default function GerenciarEstrutura() {
    const [ambientes, setAmbientes] = useState([]);
    const [salas, setSalas] = useState([]);
    const [itens, setItens] = useState([]);

    const [ambienteId, setAmbienteId] = useState(null);
    const [salaId, setSalaId] = useState(null);

    const [novoAmbiente, setNovoAmbiente] = useState("");
    const [novaSala, setNovaSala] = useState("");

    const [editandoAmbiente, setEditandoAmbiente] = useState(null);
    const [editandoSala, setEditandoSala] = useState(null);
    const [editandoItem, setEditandoItem] = useState(null);

    const [valorEditado, setValorEditado] = useState("");

    const normalizarLista = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        return [];
    };

    /* AMBIENTES */

    useEffect(() => {
        api.get("ambientes/")
            .then(res => setAmbientes(normalizarLista(res.data)))
            .catch(() => setAmbientes([]));
    }, []);

    const criarAmbiente = async () => {
        if (!novoAmbiente.trim()) return;

        const res = await api.post("ambientes/", { nome: novoAmbiente });
        setAmbientes(prev => [...prev, res.data]);
        setNovoAmbiente("");
    };

    const salvarAmbiente = async (id) => {
        const res = await api.patch(`ambientes/${id}/`, { nome: valorEditado });
        setAmbientes(prev => prev.map(a => a.id === id ? res.data : a));
        setEditandoAmbiente(null);
        setValorEditado("");
    };

    const excluirAmbiente = async (id) => {
        if (!confirm("Excluir ambiente e TODAS as salas?")) return;

        await api.delete(`ambientes/${id}/`);
        setAmbientes(prev => prev.filter(a => a.id !== id));
        setAmbienteId(null);
        setSalas([]);
        setItens([]);
    };

    /* SALAS */

    useEffect(() => {
        if (!ambienteId) return;

        setSalas([]);  
        setSalaId(null);
        setItens([]);

        api.get(`salas/?ambiente=${ambienteId}`)
            .then(res => setSalas(normalizarLista(res.data)))
            .catch(() => setSalas([]));
    }, [ambienteId]);

    const criarSala = async () => {
        if (!novaSala.trim()) return;

        const res = await api.post("salas/", {
            nome: novaSala,
            ambiente: ambienteId
        });
        setSalas(prev => [...prev, res.data]);
        setNovaSala("");
    };

    const salvarSala = async (id) => {
        const res = await api.patch(`salas/${id}/`, { nome: valorEditado });
        setSalas(prev => prev.map(s => s.id === id ? res.data : s));
        setEditandoSala(null);
        setValorEditado("");
    };

    const excluirSala = async (id) => {
        if (!confirm("Excluir sala e seus itens?")) return;

        await api.delete(`salas/${id}/`);
        setSalas(prev => prev.filter(s => s.id !== id));
        setSalaId(null);
        setItens([]);
    };

    /* ITENS */

    useEffect(() => {
        if (!salaId) return;

        api.get(`itens/?sala_atual=${salaId}`)
            .then(res => setItens(normalizarLista(res.data)))
            .catch(() => setItens([]));
    }, [salaId]);

    const salvarItem = async (id) => {
        const res = await api.patch(`itens/${id}/`, { nome: valorEditado });
        setItens(prev => prev.map(i => i.id === id ? res.data : i));
        setEditandoItem(null);
        setValorEditado(""); 
    };

    const excluirItem = async (id) => {
        if (!confirm("Excluir item?")) return;

        await api.delete(`itens/${id}/`);
        setItens(prev => prev.filter(i => i.id !== id));
    };

    /* UI */

    return (
        <div className="admin-container">
            <h1>Gerenciar Estrutura</h1>

            {/* AMBIENTES */}
            <div className="admin-card">
                <h2>Ambientes</h2>

                <div className="admin-form">
                    <input
                        placeholder="Novo ambiente"
                        value={novoAmbiente}
                        onChange={e => setNovoAmbiente(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={criarAmbiente}>
                        Criar
                    </button>
                </div>

                <ul className="admin-list">
                    {ambientes.map(a => (
                        <li key={a.id} className={ambienteId === a.id ? "active" : ""}>
                            {editandoAmbiente === a.id ? (
                                <>
                                    <input
                                        value={valorEditado}
                                        onChange={e => setValorEditado(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-success"
                                        onClick={() => salvarAmbiente(a.id)}
                                    >
                                        Salvar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span onClick={() => setAmbienteId(a.id)}>
                                        {a.nome}
                                    </span>
                                    <button
                                        className="btn btn-edit"
                                        onClick={() => {
                                            setEditandoAmbiente(a.id);
                                            setValorEditado(a.nome);
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => excluirAmbiente(a.id)}
                                    >
                                        Excluir
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* SALAS */}
            {ambienteId && (
                <div className="admin-card">
                    <h2>Salas</h2>

                    <div className="admin-form">
                        <input
                            placeholder="Nova sala"
                            value={novaSala}
                            onChange={e => setNovaSala(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={criarSala}>
                            Criar
                        </button>
                    </div>

                    <ul className="admin-list">
                        {salas.map(s => (
                            <li key={s.id} className={salaId === s.id ? "active" : ""}>
                                {editandoSala === s.id ? (
                                    <>
                                        <input
                                            value={valorEditado}
                                            onChange={e => setValorEditado(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-success"
                                            onClick={() => salvarSala(s.id)}
                                        >
                                            Salvar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span onClick={() => setSalaId(s.id)}>
                                            {s.nome}
                                        </span>
                                        <button
                                            className="btn btn-edit"
                                            onClick={() => {
                                                setEditandoSala(s.id);
                                                setValorEditado(s.nome);
                                            }}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => excluirSala(s.id)}
                                        >
                                            Excluir
                                        </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ITENS */}
            {salaId && (
                <div className="admin-card">
                    <h2>Itens da Sala</h2>

                    <div className="table-scroll">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Tombamento</th>
                                <th>Empenho</th>
                                <th>Campus</th>
                                <th>Nota Fiscal</th>
                                <th>Data Entrada</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.map(i => (
                                <tr key={i.id}>
                                    <td>
                                        {editandoItem === i.id ? (
                                            <input
                                                value={valorEditado}
                                                onChange={e => setValorEditado(e.target.value)}
                                            />
                                        ) : (
                                            i.nome || <em>Sem nome</em>
                                        )}
                                    </td>
                                    <td>{i.codigo_tombamento}</td>
                                    <td>{i.empenho || "-"}</td>
                                    <td>{i.campus_origem || "-"}</td>
                                    <td>{i.nota_fiscal || "-"}</td>
                                    <td>{i.data_entrada || "-"}</td>
                                    <td>
                                        <div className="admin-actions">
                                            {editandoItem === i.id ? (
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => salvarItem(i.id)}
                                                >
                                                    Salvar
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-edit"
                                                        onClick={() => {
                                                            setEditandoItem(i.id);
                                                            setValorEditado(i.nome || "");
                                                        }}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => excluirItem(i.id)}
                                                    >
                                                        Excluir
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
        </div>
    );
}
