import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const certKeyPath = path.resolve(__dirname, "certificados/key.pem");
const certPath = path.resolve(__dirname, "certificados/cert.pem");
const hasLocalCerts = fs.existsSync(certKeyPath) && fs.existsSync(certPath);

export default defineConfig({
    plugins: [react()],
    server: {
        https: hasLocalCerts
            ? {
                  key: fs.readFileSync(certKeyPath),
                  cert: fs.readFileSync(certPath),
              }
            : undefined,
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
