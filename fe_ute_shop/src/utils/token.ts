type StorageArea = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

function getArea(remember: boolean): StorageArea {
    return remember ? localStorage : sessionStorage;
}

export function saveTokens(
    accessToken: string,
    refreshToken?: string,
    remember = false
) {
    const area = getArea(remember);
    area.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) area.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
    [localStorage, sessionStorage].forEach((a) => {
        a.removeItem(ACCESS_KEY);
        a.removeItem(REFRESH_KEY);
    });
}
