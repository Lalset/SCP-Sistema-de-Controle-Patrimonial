import axios from "axios";

export const api = axios.create({
    baseURL: "/api/",
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refresh = localStorage.getItem("refresh_token");

            if (!refresh) {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const res = await axios.post("/api/token/refresh/", { refresh });
                const newAccess = res.data.access;
                localStorage.setItem("access_token", newAccess);
                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            } catch {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/login";
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);
