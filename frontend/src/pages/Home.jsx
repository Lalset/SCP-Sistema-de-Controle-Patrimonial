import { Link } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
    return (
        <div className="home-container">
            <h1 className="home-title">SCP</h1>
            <p className="home-subtitle">
                Sistema de Controle Patrimonial do IFPE
            </p>

            <div className="home-grid">

                {/* ESTRUTURA */}
                <div className="home-card">
                    <Link to="/gerenciar-estrutura">
                        <h3>Gerenciar Estrutura</h3>
                        <p>
                            Cadastre ambientes, blocos e salas que compõem
                            a estrutura física do campus.
                        </p>
                    </Link>
                </div>

                {/* TOMBAMENTO */}
                <div className="home-card">
                    <Link to="/tombamento">
                        <h3>Tombamento Patrimonial</h3>
                        <p>
                            Realize o cadastro oficial dos bens patrimoniais,
                            vinculando cada item à sua sala de origem.
                        </p>
                    </Link>
                </div>

                {/* INVENTÁRIO */}
                <div className="home-card">
                    <Link to="/inventario">
                        <h3>Inventário Patrimonial</h3>
                        <p>
                            Crie inventários para verificar se os bens
                            permanecem nas salas corretas.
                        </p>
                    </Link>
                </div>

                {/* RELATÓRIOS */}
                <div className="home-card">
                    <Link to="/relatorios">
                        <h3>Relatórios</h3>
                        <p>
                            Consulte relatórios de tombamento anual e
                            inventários realizados.
                        </p>
                    </Link>
                </div>

            </div>
        </div>
    );
}
