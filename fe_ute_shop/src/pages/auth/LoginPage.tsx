import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/UI/Button.tsx";
import { Input } from "../../components/UI/Input.tsx";
import { useAppDispatch, useAppState } from "../../store/hooks.ts";
import { loginAsync, clearError } from "../../store/slices/authSlice.ts";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const nav = useNavigate();
    
    const dispatch = useAppDispatch();
    const { auth } = useAppState();
    const { isLoading, error, isAuthenticated } = auth;

    useEffect(() => {
        if (isAuthenticated) {
            nav("/profile");
        }
    }, [isAuthenticated, nav]);

    useEffect(() => {
        // Clear error when component unmounts
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(clearError());
        
        const resultAction = await dispatch(loginAsync({ email, password, remember }));
        
        if (loginAsync.fulfilled.match(resultAction)) {
            nav("/profile");
        }
    };

    const handleGoogle = () => {
        // Nếu có backend OAuth:
        // window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
        console.log("Continue with Google");
    };

    return (
            <div className="w-[400px] max-w-full rounded-lg p-8 text-center border border-white/50 bg-white/10 backdrop-blur-[9px]">
                <form className="flex flex-col" onSubmit={onSubmit} noValidate>
                    <h2 className="text-3xl mb-5 text-white">Login</h2>

                    {error && (
                        <div className="mb-4 text-left text-sm text-red-200 bg-red-500/20 rounded p-2">
                            {error}
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
                    />

                    <Input
                        id="password"
                        type="password"
                        label="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <div className="flex items-center justify-between text-white mb-6">
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="h-4 w-4 accent-white"
                            />
                            <span className="ml-2">Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="text-[#efefef] hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    <Button type="submit" loading={isLoading}>
                        {isLoading ? "Logging in..." : "Log In"}
                    </Button>

                    <Button
                        type="button"
                        onClick={handleGoogle}
                        className="mt-4 gap-2 bg-white text-black font-medium py-3 px-5 rounded-md border-2 border-transparent
                         transition-colors duration-300
                         hover:bg-transparent hover:text-white hover:border-white"
                    >
                        <img
                            src="https://www.svgrepo.com/show/355037/google.svg"
                            alt="Google"
                            className="h-5 w-5"
                        />
                        Continue with Google
                    </Button>


                    <div className="text-center mt-8 text-white">
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
