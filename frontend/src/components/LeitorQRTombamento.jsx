import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../api/api";
import "../styles/leitorQR.css";

export default function LeitorQRTombamento({ tombamentoId, salaId }) {
    const scannerRef = useRef(null);
    const lendoRef = useRef(false);

    const [mensagem, setMensagem] = useState({
        tipo: "info",
        texto: "Iniciando câmera...",
    });
    const [confirmacao, setConfirmacao] = useState(null);
    const setMsg = (tipo, texto) => setMensagem({ tipo, texto });

    useEffect(() => {
        const containerId = "qr-reader-tombamento";
        const qrCode = new Html5Qrcode(containerId);
        scannerRef.current = qrCode;

        qrCode
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (texto) => {
                    if (lendoRef.current) return;
                    lendoRef.current = true;

                    setMsg("info", "Processando QR Code...");

                    try {
                        if (!tombamentoId || !salaId) {
                            setMsg("erro", "Dados de tombamento inválidos.");
                            liberarLeitura();
                            return;
                        }

                        const res = await api.post(
                            `/tombamentos/${tombamentoId}/escanear/`,
                            { qr_text: texto, sala_encontrada: salaId }
                        );

                        const { status, item, sala_oficial, pode_mover } = res.data;

                        if (status === "ja_registrado_na_sala") {
                            setMsg("info", "Item já registrado nesta sala.");
                            liberarLeitura();
                            return;
                        }

                        if (status === "ja_registrado_outra_sala") {
                            setMsg("aviso", "Item já registrado em outra sala neste tombamento.");
                            liberarLeitura();
                            return;
                        }

                        if (status === "pertence_outra_sala" && pode_mover) {
                            setMsg("aviso", `Item pertence à sala "${sala_oficial}".`);
                            setConfirmacao({ item, salaAtual: sala_oficial });
                            return;
                        }

                        if (status === "ok") {
                            setMsg("sucesso", "Item registrado com sucesso.");
                            liberarLeitura();
                            return;
                        }

                        setMsg("info", "Leitura processada.");
                        liberarLeitura();
                    } catch (err) {
                        console.error("Erro tombamento:", err?.response?.data || err);
                        setMsg("erro", mensagemDeErro(err));
                        liberarLeitura(3500);
                    }
                },
                () => {}
            )
            .then(() => setMsg("info", "Aguardando leitura..."))
            .catch((err) => {
                console.error("Erro ao iniciar câmera:", err);
                setMsg(
                    "erro",
                    "Não foi possível acessar a câmera. Verifique a permissão de câmera do navegador."
                );
            });

        return () => {
            lendoRef.current = false;
            const scanner = scannerRef.current;
            if (scanner) {
                scanner.stop().then(() => scanner.clear()).catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [tombamentoId, salaId]);

    function liberarLeitura(ms = 1200) {
        setTimeout(() => {
            lendoRef.current = false;
            setMsg("info", "Aguardando próxima leitura...");
        }, ms);
    }

    async function confirmarMovimento() {
        if (!confirmacao) return;

        setMsg("info", "Movendo item...");

        try {
            await api.post(`/itens/${confirmacao.item.id}/mover/`, {
                nova_sala: salaId,
            });
            setMsg("sucesso", "Item movido com sucesso.");
        } catch (err) {
            console.error(err);
            setMsg("erro", "Não foi possível mover o item. Tente novamente.");
        }

        setConfirmacao(null);
        liberarLeitura();
    }

    function cancelarMovimento() {
        setConfirmacao(null);
        liberarLeitura();
    }

    return (
        <div className="leitorqr-container">
            <h2 className="leitorqr-titulo">Leitura de QR Code</h2>

            <div id="qr-reader-tombamento" className="leitorqr-reader" />

            <p className={`leitorqr-status leitorqr-status--${mensagem.tipo}`}>
                {mensagem.texto}
            </p>

            {confirmacao && (
                <div className="leitorqr-confirmacao">
                    <p>
                        Item está na sala <b>{confirmacao.salaAtual}</b>.
                        <br />
                        Deseja mover para esta sala?
                    </p>

                    <div className="leitorqr-confirmacao-actions">
                        <button className="btn" onClick={cancelarMovimento}>
                            Não
                        </button>

                        <button className="btn btn-success" onClick={confirmarMovimento}>
                            Sim
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Converte o erro da requisição em uma mensagem clara para o operador.
function mensagemDeErro(err) {
    const status = err?.response?.status;
    const backend = err?.response?.data?.erro;

    // QR ilegível: imagem borrada, mal enquadrada ou fora do padrão do patrimônio.
    if (backend && /inv[aá]lido|padr[aã]o/i.test(backend)) {
        return "QR Code não reconhecido. Aproxime a câmera, segure firme e com boa iluminação, e leia novamente.";
    }
    if (status === 404) {
        return "Sala ou item não encontrado no sistema.";
    }
    if (backend) {
        return backend;
    }
    return "Não foi possível processar a leitura. Tente novamente.";
}
