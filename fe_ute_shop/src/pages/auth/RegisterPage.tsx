import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { Input } from "../../components/UI/Input.tsx";
import { Button } from "../../components/UI/Button.tsx";
import { useAppDispatch, useAppState } from "../../store/hooks.ts";
import { registerAsync, clearError } from "../../store/slices/authSlice.ts";

type Errors = Partial<
    Record<
        "fullName" | "email" | "phone" | "password" | "confirmPassword" | "form",
        string
    >
>;

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errors, setErrors] = useState<Errors>({});
    const nav = useNavigate();
    
    const dispatch = useAppDispatch();
    const { auth } = useAppState();
    const { isLoading, error } = auth;

    useEffect(() => {
        // Clear error when component unmounts
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            setErrors((prev) => ({
                ...prev,
                form: error,
            }));
        }
    }, [error]);

    const validate = (): boolean => {
        const next: Errors = {};

        if (!fullName.trim()) next.fullName = "Full name is required";

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) next.email = "Email is required";
        else if (!emailRe.test(email)) next.email = "Invalid email";

        const phoneRe = /^0\d{9}$/; // VN: 10 số, bắt đầu bằng 0
        if (!phone.trim()) next.phone = "Phone is required";
        else if (!phoneRe.test(phone)) next.phone = "Phone must be 10 digits, start with 0";

        if (!password) next.password = "Password is required";
        else if (password.length < 6) next.password = "At least 6 characters";

        if (!confirmPassword) next.confirmPassword = "Please confirm password";
        else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        dispatch(clearError());
        setErrors({});

        const resultAction = await dispatch(registerAsync({
            fullName,
            email,
            phone,
            password,
        }));

        if (registerAsync.fulfilled.match(resultAction)) {
            // Chuyển tới trang verify OTP
            nav("/verify-otp", { state: { email } });
        }
    };

    return (
            <div className="w-[400px] max-w-full rounded-lg p-8 text-center border border-white/50 bg-white/10 backdrop-blur-[9px]">
                <form className="flex flex-col" onSubmit={onSubmit} noValidate>
                    <h2 className="text-3xl mb-5 text-white">Register</h2>

                    {errors.form && (
                        <div className="mb-3 text-sm text-red-200 bg-red-500/20 rounded p-2 text-left">
                            {errors.form}
                        </div>
                    )}

                    <Input
                        id="fullName"
                        type="text"
                        label="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                        error={errors.fullName}
                    />

                    <Input
                        id="email"
                        type="email"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        error={errors.email}
                    />

                    <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        label="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        autoComplete="tel"
                        error={errors.phone}
                    />

                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        error={errors.password}
                    />

                    <Input
                        id="confirmPassword"
                        type="password"
                        label="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        error={errors.confirmPassword}
                    />

                    <Button type="submit" loading={isLoading} className="mt-2">
                        {isLoading ? "Registering..." : "Create account"}
                    </Button>

                    <div className="text-center mt-8 text-white">
                        <p>
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#efefef] hover:underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
    );
}
