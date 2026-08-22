import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api";
import "../../styles/relatorioInventario.css";


export default function RelatorioInventario() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        async function carregar() {
            try {
                const res = await api.get(`/inventarios/${id}/relatorio/`);
                setDados(res.data);
            } catch (err) {
                console.error(err);
                alert("Erro ao carregar relatório");
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, [id]);

    async function excluirInventario() {
        if (!window.confirm("Excluir este inventário?")) return;

        try {
            setExcluindo(true);
            await api.delete(`/inventarios/${id}/`);
            navigate("/inventarios");
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir inventário");
        } finally {
            setExcluindo(false);
        }
    }

    async function resolverItem(itemId, acao) {
        try {
            await api.post(`/inventarios/${id}/resolver_item/`, {
                item_id: itemId,
                acao,
            });

            const res = await api.get(`/inventarios/${id}/relatorio/`);
            setDados(res.data);
        } catch (err) {
            console.error(err);
            alert("Erro ao resolver item");
        }
    }

    function formatarData(data) {
        if (!data) return "-";
        return new Date(data).toLocaleString("pt-BR");
    }

    function renderStatus(registro) {
        const item = registro.item;

        switch (registro.status) {
            case "ok":
                return <span className="status-ok">✔ OK</span>;

            case "fora_do_lugar":
                return (
                    <div>
                        <span className="status-warning">
                            Fora do lugar
                        </span>

                        <div className="status-actions">
                            <button
                                className="btn btn-small btn-success"
                                onClick={() =>
                                    resolverItem(
                                        item.id,
                                        "manter_encontrada"
                                    )
                                }
                            >
                                Manter nesta sala
                            </button>

                            <button
                                className="btn btn-small btn-secondary"
                                onClick={() =>
                                    resolverItem(
                                        item.id,
                                        "voltar_oficial"
                                    )
                                }
                            >
                                Voltar para sala oficial
                            </button>
                        </div>
                    </div>
                );

            case "movido":
                return (
                    <span className="status-info">
                        Movido para sala encontrada
                    </span>
                );

            case "mantido_oficial":
                return (
                    <span className="status-info">
                        Mantido na sala oficial
                    </span>
                );

            case "nao_encontrado":
                return (
                    <span className="status-danger">
                        Não encontrado
                    </span>
                );

            default:
                return <span>-</span>;
        }
    }

    if (loading) return <p>Carregando relatório...</p>;
    if (!dados) return <p>Relatório indisponível</p>;

    const { inventario, resumo, itens } = dados;

    return (
        <div className="page-container relatorio-inventario-container">
            <h1>Relatório do Inventário</h1>

            <div className="resumo-card">
                <p><b>Inventário:</b> {inventario.nome}</p>
                <p><b>Total:</b> {resumo.total}</p>
                <p><b>OK:</b> {resumo.ok}</p>
                <p><b>Fora do lugar:</b> {resumo.fora_do_lugar}</p>
                <p><b>Não encontrados:</b> {resumo.nao_encontrados}</p>
            </div>

            <table className="relatorio-inventario-table">
                <thead>
                    <tr>
                        <th>Tombamento</th>
                        <th>Nome</th>
                        <th>Sala Oficial</th>
                        <th>Sala Encontrada</th>
                        <th>Status</th>
                        <th>Registrado por</th>
                        <th>Registrado em</th>
                        <th>Resolvido por</th>
                        <th>Resolvido em</th>
                    </tr>
                </thead>
                <tbody>
                    {itens.map((registro) => {
                        const item = registro.item;

                        return (
                            <tr key={registro.id}>
                                <td>{item?.codigo_tombamento || "-"}</td>
                                <td>{item?.nome || "-"}</td>
                                <td>{registro.sala_oficial_nome || "-"}</td>
                                <td>{registro.sala_encontrada_nome || "-"}</td>

                                <td>
                                    {renderStatus(registro)}
                                </td>

                                <td style={{fontWeight: 500}}>
                                    {registro.registrado_por
                                        ? registro.registrado_por.username
                                        : "-"}
                                </td>

                                <td>
                                    {formatarData(registro.registrado_em)}
                                </td>

                                <td style={{fontWeight: 500}}>
                                    {registro.resolvido_por
                                        ? registro.resolvido_por.username
                                        : "-"}
                                </td>

                                <td>
                                    {formatarData(registro.resolvido_em)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <button
                className="btn btn-danger"
                onClick={excluirInventario}
                disabled={excluindo}
            >
                Excluir inventário
            </button>
        </div>
    );
}
