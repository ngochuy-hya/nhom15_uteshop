import axios from "axios";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "../utils/token.ts";
import { API_BASE_URL } from "../config/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // giữ cookie nếu backend dùng httpOnly refresh cookie
});

// Gắn Authorization
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Tự refresh khi 401
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;

            if (!refreshing) {
                refreshing = (async () => {
                    let newAccess: string | null = null;
                    try {
                        const { data } = await axios.post(
                            `${API_BASE_URL}/auth/refresh`,
                            { refreshToken: getRefreshToken() },
                            { withCredentials: true }
                        );
                        const access = data?.accessToken as string | undefined;
                        const refresh = data?.refreshToken as string | undefined;

                        if (access) {
                            saveTokens(access, refresh, true);
                            newAccess = access;
                        }
                    } catch {
                        clearTokens();
                        newAccess = null;
                    } finally {
                        refreshing = null;
                    }
                    return newAccess;
                })();
            }

            const newAccess = await refreshing;
            if (newAccess) {
                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            }
        }

        return Promise.reject(error);
    }
);
