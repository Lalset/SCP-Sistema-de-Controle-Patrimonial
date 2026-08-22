import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../api/api";
import "../styles/leitorQR.css";

export default function LeitorQRInventario({ inventarioId, salaId }) {
    const scannerRef = useRef(null);
    const lendoRef = useRef(false);

    const [mensagem, setMensagem] = useState({
        tipo: "info",
        texto: "Iniciando câmera...",
    });
    const setMsg = (tipo, texto) => setMensagem({ tipo, texto });

    useEffect(() => {
        if (!inventarioId || !salaId) return;

        const containerId = "qr-reader-inventario";
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
                        const res = await api.post(
                            `/inventarios/${inventarioId}/escanear/`,
                            { qr_text: texto, sala_encontrada: salaId }
                        );

                        const { status } = res.data;

                        if (status === "ja_verificado") {
                            setMsg("info", "Item já verificado neste inventário.");
                        } else if (status === "ok") {
                            setMsg("sucesso", "Item correto — está na sala certa.");
                        } else if (status === "fora_do_lugar") {
                            setMsg("aviso", "Item fora do lugar — sala divergente.");
                        } else {
                            setMsg("info", "Item processado.");
                        }

                        liberarLeitura(1500);
                    } catch (err) {
                        console.error("Erro inventário:", err?.response?.data || err);
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
    }, [inventarioId, salaId]);

    function liberarLeitura(ms = 1200) {
        setTimeout(() => {
            lendoRef.current = false;
            setMsg("info", "Aguardando próxima leitura...");
        }, ms);
    }

    return (
        <div className="leitorqr-container">
            <h2 className="leitorqr-titulo">Leitura de QR Code (Inventário)</h2>

            <div id="qr-reader-inventario" className="leitorqr-reader" />

            <p className={`leitorqr-status leitorqr-status--${mensagem.tipo}`}>
                {mensagem.texto}
            </p>
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
        return "Item não encontrado no cadastro do sistema.";
    }
    if (backend) {
        return backend; // mensagens legítimas do backend (ex.: inventário encerrado)
    }
    return "Não foi possível processar a leitura. Tente novamente.";
}
