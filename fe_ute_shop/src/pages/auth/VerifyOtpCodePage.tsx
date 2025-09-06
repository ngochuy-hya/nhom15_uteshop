// src/pages/VerifyOtpCodePage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { FormEvent } from "react";
import { Input } from "../../components/UI/Input.tsx";
import { Button } from "../../components/UI/Button.tsx";
import { useAppDispatch, useAppSelector } from "../../store/hooks.ts";
import { verifyOTPAsync, resendOTPAsync, clearError } from "../../store/slices/authSlice.ts";

type Errors = Partial<Record<"otp" | "form", string>>;

export default function VerifyOtpCodePage() {
    const nav = useNavigate();
    const loc = useLocation();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);
    
    const state = (loc.state as { email?: string; mode?: string } | null) ?? null;
    const email = state?.email ?? ""; // vẫn giữ email từ state (ẩn, không nhập)
    const mode = state?.mode || "register"; // "register" hoặc "reset"

    const [otp, setOtp] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    useEffect(() => {
        // Clear error when component mounts
        dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        // Update local error state when Redux error changes
        if (error) {
            setErrors({ form: error });
        }
    }, [error]);

    const validate = () => {
        const next: Errors = {};
        const otpRe = /^\d{6}$/;
        if (!otp) next.otp = "OTP is required";
        else if (!otpRe.test(otp)) next.otp = "OTP must be 6 digits";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        if (!validate()) return;

        try {
            setErrors({});
            dispatch(clearError());

            if (mode === "reset") {
                // Cho forgot password: chuyển đến reset password page với email và otp
                nav("/reset-password", { state: { email, otp } });
            } else {
                // Cho register: verify OTP để activate account
                const result = await dispatch(verifyOTPAsync({ email, otp }));
                
                if (verifyOTPAsync.fulfilled.match(result)) {
                    nav("/login", { state: { verified: true, email } });
                }
            }
        } catch (err) {
            // Error will be handled by Redux and useEffect
            console.error('Verify OTP error:', err);
        }
    };

    const resendOtp = async () => {
        if (cooldown > 0 || isLoading) return;
        
        try {
            setErrors({});
            dispatch(clearError());
            
            // Dispatch resend OTP action với type dựa trên mode
            const otpType = mode === "reset" ? 'forgot-password' : 'register';
            const result = await dispatch(resendOTPAsync({ email, type: otpType }));
            
            if (resendOTPAsync.fulfilled.match(result)) {
                setCooldown(60);
            }
        } catch (err) {
            // Error will be handled by Redux and useEffect
            console.error('Resend OTP error:', err);
        }
    };

    return (
            <div className="w-[400px] max-w-full rounded-lg p-8 text-center border border-white/50 bg-white/10 backdrop-blur-[9px]">
                <form className="flex flex-col" onSubmit={onSubmit} noValidate>
                    <h2 className="text-3xl mb-5 text-white">
                        {mode === "reset" ? "Verify Reset Code" : "Verify OTP"}
                    </h2>

                    {errors.form && (
                        <div className="mb-3 text-sm text-red-200 bg-red-500/20 rounded p-2 text-left">
                            {errors.form}
                        </div>
                    )}

                    <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        label="OTP (6 digits)"
                        value={otp}
                        maxLength={6}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                        autoComplete="one-time-code"
                        error={errors.otp}
                    />

                    <Button type="submit" loading={isLoading} className="mt-2 w-full">
                        {isLoading ? "Verifying..." : (mode === "reset" ? "Continue" : "Verify OTP")}
                    </Button>

                    <Button
                        type="button"
                        onClick={resendOtp}
                        disabled={cooldown > 0 || isLoading || !email}
                        className="mt-3 w-full bg-white text-black font-semibold border-2 border-transparent
             hover:bg-transparent hover:text-white hover:border-white
             transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                    </Button>


                    <div className="text-center mt-8 text-white">
                        <p>
                            Back to{" "}
                            <Link to="/login" className="text-[#efefef] hover:underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
    );
}
