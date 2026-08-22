import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync(
                path.resolve(__dirname, "certificados/key.pem")
            ),
            cert: fs.readFileSync(
                path.resolve(__dirname, "certificados/cert.pem")
            ),
        },
        host: true,
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
