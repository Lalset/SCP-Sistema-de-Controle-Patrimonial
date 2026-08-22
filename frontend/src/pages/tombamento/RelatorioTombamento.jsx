import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/api";
import "../../styles/RelatorioTombamento.css";


export default function RelatorioTombamento() {
    const { id: ano } = useParams();
    const [relatorio, setRelatorio] = useState(null);

    useEffect(() => {
        api.get(`relatorios/tombamentos/${ano}/`)
            .then(res => setRelatorio(res.data))
            .catch(() => setRelatorio(null));
    }, [ano]);

    async function baixarPDF() {
        try {
            const res = await api.get(`relatorios/tombamentos/${ano}/pdf/`, {
                responseType: "blob",
            });
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = `relatorio_tombamento_${ano}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            alert("Erro ao gerar PDF");
        }
    }

    if (!relatorio) {
        return (
            <div className="page-container">
                <p>Carregando relatório...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="relatorio-header">
                <h1>Relatório de Tombamento – {relatorio.ano}</h1>

                <button onClick={baixarPDF} className="btn btn-primary">
                    Baixar PDF
                </button>
            </div>

            {relatorio.ambientes.map(ambiente => (
                <div key={ambiente.id} className="relatorio-card">
                    <h2>Ambiente: {ambiente.nome}</h2>

                    {ambiente.salas.map(sala => (
                        <div key={sala.id} className="relatorio-sala">
                            <h3>Sala: {sala.nome}</h3>

                            {sala.itens.length === 0 ? (
                                <p>Nenhum item registrado.</p>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Tombamento</th>
                                            <th>Empenho</th>
                                            <th>Campus</th>
                                            <th>Nota Fiscal</th>
                                            <th>Data Entrada</th>
                                            <th>Sala Original</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sala.itens.map(item => (
                                            <tr key={item.codigo_tombamento}>
                                                <td>{item.nome || "-"}</td>
                                                <td>{item.codigo_tombamento}</td>
                                                <td>{item.empenho || "-"}</td>
                                                <td>{item.campus_origem || "-"}</td>
                                                <td>{item.nota_fiscal || "-"}</td>
                                                <td>{item.data_entrada || "-"}</td>
                                                <td>{item.sala_original || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
