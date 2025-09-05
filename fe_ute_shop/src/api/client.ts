// src/api/client.ts
import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000", // đổi sang API thật khi deploy
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Optional: interceptor thêm token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (err) => Promise.reject(err)
);

// Optional: interceptor xử lý lỗi
api.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("API error:", err);
        return Promise.reject(err);
    }
);
