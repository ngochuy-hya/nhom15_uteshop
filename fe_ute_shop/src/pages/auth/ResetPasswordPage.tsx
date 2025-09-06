import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { Input } from "../../components/UI/Input.tsx";
import { Button } from "../../components/UI/Button.tsx";
import { useAppDispatch, useAppSelector } from "../../store/hooks.ts";
import { resetPasswordAsync, clearError } from "../../store/slices/authSlice.ts";

type Errors = Partial<Record<"password" | "confirmPassword" | "form", string>>;

function useEmailOtpFromRouter() {
    const loc = useLocation();
    const state = (loc.state as { email?: string; otp?: string } | null) ?? null;
    const qs = new URLSearchParams(loc.search);
    const email = (state?.email ?? qs.get("email") ?? "").trim();
    const otp = (state?.otp ?? qs.get("otp") ?? "").trim();
    return { email, otp };
}

export default function ResetPasswordPage() {
    const { email, otp } = useEmailOtpFromRouter();
    const nav = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Errors>({});

    const canSubmit = useMemo(() => !!email && !!otp, [email, otp]);

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
        if (!password) next.password = "Password is required";
        else if (password.length < 6) next.password = "At least 6 characters";

        if (!confirmPassword) next.confirmPassword = "Please confirm password";
        else if (confirmPassword !== password) next.confirmPassword = "Passwords do not match";

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

            // Dispatch reset password action
            const result = await dispatch(resetPasswordAsync({ 
                email, 
                otp, 
                newPassword: password 
            }));
            
            if (resetPasswordAsync.fulfilled.match(result)) {
                nav("/login", { state: { resetDone: true, email } });
            }
        } catch (err) {
            // Error will be handled by Redux and useEffect
            console.error('Reset password error:', err);
        }
    };

    return (
            <div className="w-[400px] max-w-full rounded-lg p-8 text-center border border-white/50 bg-white/10 backdrop-blur-[9px]">
                <form className="flex flex-col" onSubmit={onSubmit} noValidate>
                    <h2 className="text-3xl mb-5 text-white">Set New Password</h2>


                    {errors.form && (
                        <div className="mb-3 text-sm text-red-200 bg-red-500/20 rounded p-2 text-left">
                            {errors.form}
                        </div>
                    )}

                    <Input
                        id="password"
                        type="password"
                        label="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        error={errors.password}
                    />

                    <Input
                        id="confirmPassword"
                        type="password"
                        label="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        error={errors.confirmPassword}
                    />

                    <Button type="submit" loading={isLoading} className="mt-2 w-full" disabled={!canSubmit}>
                        {isLoading ? "Processing..." : "Reset password"}
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
