import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import PrivateRoute from "./routes/PrivateRoute";
import Layout from "./layouts/Layout";

// Admin
import GerenciarEstrutura from "./pages/admin/GerenciarEstrutura";

// Tombamento
import SelecionarSala from "./pages/tombamento/SelecionarSalaTombamento";

// Inventário
import CriarInventario from "./pages/inventario/CriarInventario";
import ScannerInventario from "./pages/inventario/ScannerInventario";
import RelatorioInventario from "./pages/inventario/RelatorioInventario";
import ListarInventarios from "./pages/inventario/ListarInventarios";

// Relatórios
import Relatorios from "./pages/Relatorios";
import RelatorioTombamento from "./pages/tombamento/RelatorioTombamento";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Público */}
                <Route path="/login" element={<Login />} />

                {/* Privado */}
                <Route element={<PrivateRoute />}>
                    <Route element={<Layout />}>

                        <Route path="/" element={<Home />} />

                        {/* Administrativo */}
                        <Route path="/gerenciar-estrutura" element={<GerenciarEstrutura />} />

                        {/* Tombamento */}
                        <Route path="/tombamento" element={<SelecionarSala />} />

                        {/* Inventário */}
                        <Route path="/inventario" element={<CriarInventario />} />

                        <Route
                            path="/inventario/:id"
                            element={<ScannerInventario />}
                        />

                        <Route
                            path="/inventario/:id/relatorio"
                            element={<RelatorioInventario />}
                        />

                        <Route
                            path="/inventarios"
                            element={<ListarInventarios />}
                        />

                        {/* Relatórios */}
                        <Route path="/relatorios" element={<Relatorios />} />

                        <Route
                            path="/relatorios/tombamento/:id"
                            element={<RelatorioTombamento />}
                        />

                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
