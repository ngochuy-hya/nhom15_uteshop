import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { Input } from "../components/UI/Input";
import { Button } from "../components/UI/Button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { forgotPasswordAsync, clearError } from "../store/slices/authSlice";

type Errors = Partial<Record<"email" | "form", string>>;

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [sent, setSent] = useState(false);
    const nav = useNavigate();
    
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (error) {
            setErrors((prev) => ({
                ...prev,
                form: error,
            }));
        }
    }, [error]);

    useEffect(() => {
        // Clear error when component unmounts
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const validate = () => {
        const next: Errors = {};
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) next.email = "Email is required";
        else if (!emailRe.test(email)) next.email = "Invalid email";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        dispatch(clearError());
        setErrors({});

        const resultAction = await dispatch(forgotPasswordAsync({ email }));
        
        if (forgotPasswordAsync.fulfilled.match(resultAction)) {
            setSent(true);
            nav("/verify-otp", { state: { email, mode: "reset" } });
        }
    };

    return (
            <div className="w-[400px] max-w-full rounded-lg p-8 text-center border border-white/50 bg-white/10 backdrop-blur-[9px]">
                <form className="flex flex-col" onSubmit={onSubmit} noValidate>
                    <h2 className="text-3xl mb-5 text-white">Forgot Password</h2>

                    {errors.form && (
                        <div className="mb-3 text-sm text-red-200 bg-red-500/20 rounded p-2 text-left">
                            {errors.form}
                        </div>
                    )}
                    {sent && (
                        <div className="mb-3 text-sm text-emerald-200 bg-emerald-500/20 rounded p-2 text-left">
                            OTP has been sent to your email.
                        </div>
                    )}

                    <Input
                        id="email"
                        type="email"
                        label="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        error={errors.email}
                    />

                    <Button type="submit" loading={isLoading} className="mt-2 w-full">
                        {isLoading ? "Sending..." : "Send OTP"}
                    </Button>

                    <div className="text-center mt-8 text-white space-y-2">
                        <p>
                            Remembered your password?{" "}
                            <Link to="/login" className="text-[#efefef] hover:underline">
                                Login
                            </Link>
                        </p>
                        <p>
                            Don&apos;t have an account?{" "}
                            <Link to="/register" className="text-[#efefef] hover:underline">
                                Register
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
    );
}
