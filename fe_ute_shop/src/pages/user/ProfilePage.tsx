import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppState } from "../../store/hooks.ts";
import { getProfileAsync, updateProfileAsync, changePasswordAsync } from "../../store/slices/userSlice.ts";
import { logout } from "../../store/slices/authSlice.ts";
import { Button } from "../../components/UI/Button.tsx";
import { Input } from "../../components/UI/Input.tsx";

function initialsOf(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function ProfileView() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { auth, user: userSlice } = useAppState();
    const { user, isAuthenticated } = auth;
    const { profile, isLoading, error } = userSlice;

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Edit form state
    const [editForm, setEditForm] = useState({
        fullName: "",
        phone: "",
        address: ""
    });

    // Change password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        // Load profile data
        dispatch(getProfileAsync());
    }, [isAuthenticated, navigate, dispatch]);

    useEffect(() => {
        if (profile) {
            setEditForm({
                fullName: profile.fullName || "",
                phone: profile.phone || "",
                address: profile.address || ""
            });
        }
    }, [profile]);

    const currentUser = profile || user;

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const handleUpdateProfile = async () => {
        const resultAction = await dispatch(updateProfileAsync(editForm));
        if (updateProfileAsync.fulfilled.match(resultAction)) {
            setIsEditing(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError("");

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        const resultAction = await dispatch(changePasswordAsync({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
        }));

        if (changePasswordAsync.fulfilled.match(resultAction)) {
            setIsChangingPassword(false);
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        }
    };

    if (!currentUser) {
        return (
            <div className="relative min-h-screen w-full text-white flex items-center justify-center">
                <div>Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full text-white">
            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" aria-hidden="true" />

            <div className="relative z-10 px-6 py-10">
                <div className="mx-auto max-w-3xl">
                    <header className="mb-6 flex justify-between items-center">
                        <h1 className="text-2xl md:text-3xl font-semibold leading-relaxed">
                            Hồ sơ người dùng
                        </h1>
                        <div className="flex gap-2">
                            <Button onClick={() => setIsChangingPassword(true)} variant="ghost" size="sm">
                                Change Password
                            </Button>
                            <Button onClick={handleLogout} variant="ghost" size="sm">
                                Logout
                            </Button>
                        </div>
                    </header>

                    <section
                        aria-label="Thông tin hồ sơ"
                        className="rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md p-6 md:p-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 grid place-items-center text-xl font-bold text-slate-900">
                                    {initialsOf(currentUser.fullName)}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-lg font-semibold break-words">{currentUser.fullName}</div>
                                    <div className="text-white/80 text-sm break-words">{currentUser.email}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={
                                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium " +
                                        (currentUser.isVerified
                                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                                            : "bg-amber-500/15 text-amber-300 border border-amber-400/30")
                                    }
                                >
                    <span
                        className={
                            "h-2 w-2 rounded-full " +
                            (currentUser.isVerified ? "bg-emerald-400" : "bg-amber-400")
                        }
                        aria-hidden="true"
                    />
                                    {currentUser.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                  </span>

                                <Button
                                    onClick={() => setIsEditing(!isEditing)}
                                    variant="ghost"
                                    size="sm"
                                >
                                    {isEditing ? "Cancel" : "Edit"}
                                </Button>
                            </div>
                        </div>

                        <div className="my-6 h-px w-full bg-white/10" />

                        {error && (
                            <div className="mb-4 text-left text-sm text-red-200 bg-red-500/20 rounded p-2">
                                {error}
                            </div>
                        )}

                        {/* Thông tin chi tiết */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm text-white/80">Email</label>
                                <div className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 break-words">
                                    {currentUser.email}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-white/80">Họ và tên</label>
                                {isEditing ? (
                                    <Input
                                        label="Full Name"
                                        value={editForm.fullName}
                                        onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                                        placeholder="Enter full name"
                                    />
                                ) : (
                                    <div className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 break-words">
                                        {currentUser.fullName}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-white/80">Số điện thoại</label>
                                {isEditing ? (
                                    <Input
                                        label="Phone Number"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        placeholder="Enter phone number"
                                    />
                                ) : (
                                    <div className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 break-words">
                                        {currentUser.phone || "Not provided"}
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm text-white/80">Địa chỉ</label>
                                {isEditing ? (
                                    <Input
                                        label="Address"
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                        placeholder="Enter address"
                                    />
                                ) : (
                                    <div className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 break-words">
                                        {currentUser.address || "Not provided"}
                                    </div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="md:col-span-2 flex gap-3 justify-end">
                                    <Button
                                        onClick={() => setIsEditing(false)}
                                        variant="ghost"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpdateProfile}
                                        loading={isLoading}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Change Password Modal */}
                    {isChangingPassword && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 w-full max-w-md border border-white/20">
                                <h3 className="text-xl font-semibold mb-4">Change Password</h3>

                                {passwordError && (
                                    <div className="mb-4 text-sm text-red-200 bg-red-500/20 rounded p-2">
                                        {passwordError}
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 text-sm text-red-200 bg-red-500/20 rounded p-2">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <Input
                                        type="password"
                                        label="Current Password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                    />

                                    <Input
                                        type="password"
                                        label="New Password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                    />

                                    <Input
                                        type="password"
                                        label="Confirm New Password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-6">
                                    <Button
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setPasswordForm({
                                                currentPassword: "",
                                                newPassword: "",
                                                confirmPassword: ""
                                            });
                                            setPasswordError("");
                                        }}
                                        variant="ghost"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleChangePassword}
                                        loading={isLoading}
                                    >
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
