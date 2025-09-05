import type { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";
import type { Category, Product } from "../types/shop";

const IMG = {
    hero: "/image/img_1.png",
    product: "/image/img_2.png",
    category: "/image/img_3.png",
};

// ====== Fake DB ======
const users = [
    {
        id: "u1",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "0123456789",
        password: "123456", // plain text cho mock thôi
        isVerified: true,
        address: "Hanoi, Vietnam",
    },
];

const otps: Record<string, string> = {}; // email -> otp

const categories: Category[] = [
    { id: "c1", name: "Fiction", image: IMG.category, itemsCount: 12 },
    { id: "c2", name: "Non-fiction", image: IMG.category, itemsCount: 9 },
    { id: "c3", name: "Comics", image: IMG.category, itemsCount: 6 },
    { id: "c4", name: "Kids", image: IMG.category, itemsCount: 5 },
    { id: "c5", name: "Sci-Fi", image: IMG.category, itemsCount: 7 },
];

const baseProducts: Product[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `p${i + 1}`,
    name: i % 3 === 0 ? "Lost Boy" : i % 3 === 1 ? "Encula" : "Paper Towns",
    price: 60,
    priceOld: 80,
    image: IMG.product,
    discountPercent: 20,
    tags: ["featured", i % 2 === 0 ? "new" : i % 3 === 0 ? "best" : "deals"],
}));

const mostViewed: Product[] = baseProducts.slice(0, 12);

// ====== Helpers ======
function genOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ====== Setup Mock ======
export function setupMock(api: AxiosInstance) {
    const mock = new MockAdapter(api, { delayResponse: 500 });

    // --- Shop ---
    mock.onGet("/api/categories").reply(200, categories);

    mock.onGet("/api/products").reply((config) => {
        const { mostViewed: mv, tag, tab } = (config.params || {}) as Record<
            string,
            string
        >;

        if (mv === "true") {
            return [200, mostViewed];
        }

        let data = baseProducts;
        if (tag === "featured") {
            data = data.filter((p) => p.tags?.includes("featured"));
            if (tab === "new" || tab === "best" || tab === "deals") {
                data = data.filter((p) => p.tags?.includes(tab));
            }
        }
        return [200, data.slice(0, 12)];
    });

    mock.onGet("/api/search").reply((config) => {
        const q = String(config.params?.q || "").toLowerCase();
        const results = baseProducts.filter((p) =>
            p.name.toLowerCase().includes(q)
        );
        return [200, results.slice(0, 6)];
    });

    // --- Auth ---
    mock.onPost("/api/auth/register").reply((config) => {
        const { fullName, email, phone, password } = JSON.parse(config.data);
        if (users.find((u) => u.email === email)) {
            return [400, { message: "Email already exists" }];
        }
        const newUser = {
            id: `u${users.length + 1}`,
            fullName,
            email,
            phone,
            password,
            isVerified: false,
            address: "",
        };
        users.push(newUser);
        const otp = genOtp();
        otps[email] = otp;
        console.log("OTP register:", email, otp);
        return [200, { message: "Registered. Please verify OTP.", email }];
    });

    mock.onPost("/api/auth/login").reply((config) => {
        const { email, password } = JSON.parse(config.data);
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) return [400, { message: "Invalid credentials" }];
        if (!user.isVerified) return [400, { message: "Email not verified" }];
        return [200, { token: "fake-jwt", user }];
    });

    mock.onPost("/api/auth/forgot-password").reply((config) => {
        const { email } = JSON.parse(config.data);
        const user = users.find((u) => u.email === email);
        if (!user) return [400, { message: "Email not found" }];
        const otp = genOtp();
        otps[email] = otp;
        console.log("OTP reset:", email, otp);
        return [200, { message: "OTP sent", email }];
    });

    mock.onPost("/api/auth/verify-otp").reply((config) => {
        const { email, otp } = JSON.parse(config.data);
        if (otps[email] !== otp) return [400, { message: "Invalid OTP" }];
        const user = users.find((u) => u.email === email);
        if (user) user.isVerified = true;
        delete otps[email];
        return [200, { message: "OTP verified" }];
    });

    mock.onPost("/api/auth/resend-otp").reply((config) => {
        const { email } = JSON.parse(config.data);
        if (!users.find((u) => u.email === email))
            return [400, { message: "Email not found" }];
        const otp = genOtp();
        otps[email] = otp;
        console.log("OTP resent:", email, otp);
        return [200, { message: "OTP resent" }];
    });

    mock.onPost("/api/auth/reset-password").reply((config) => {
        const { email, otp, newPassword } = JSON.parse(config.data);
        if (otps[email] !== otp) return [400, { message: "Invalid OTP" }];
        const user = users.find((u) => u.email === email);
        if (!user) return [400, { message: "User not found" }];
        user.password = newPassword;
        delete otps[email];
        return [200, { message: "Password reset success" }];
    });

    mock.onGet("/api/categories").reply(() => {
        return [200, categories];
    });

    mock.onPost("/api/user/update-profile").reply((config) => {
        const { fullName, phone, address } = JSON.parse(config.data);
        const user = users[0];
        user.fullName = fullName;
        user.phone = phone;
        user.address = address;
        return [200, { message: "Profile updated", user }];
    });

    mock.onPost("/api/user/change-password").reply((config) => {
        const { currentPassword, newPassword } = JSON.parse(config.data);
        const user = users[0];
        if (user.password !== currentPassword) {
            return [400, { message: "Current password is incorrect" }];
        }
        user.password = newPassword;
        return [200, { message: "Password changed" }];
    });
}
