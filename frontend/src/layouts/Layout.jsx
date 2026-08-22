import { Outlet, useNavigate } from "react-router-dom";
import "../styles/layout.css";

export default function Layout() {
    const navigate = useNavigate();

    function logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
    }

    return (
        <div className="app-wrapper">
            <header className="app-header">
                <div
                    className="app-logo"
                    onClick={() => navigate("/")}
                >
                    Sistema de Controle Patrimonial
                </div>

                <nav className="app-nav">
                    <button
                        className="nav-btn"
                        onClick={() => navigate("/")}
                    >
                        Dashboard
                    </button>

                    <button
                        className="nav-btn"
                        onClick={() => navigate("/inventarios")}
                    >
                        Inventários
                    </button>

                    <button
                        className="nav-btn logout"
                        onClick={logout}
                    >
                        Sair
                    </button>
                </nav>
            </header>

            <main className="app-content">
                <Outlet />
            </main>
        </div>
    );
}
