import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import { saveTokens, clearTokens } from '../../utils/token';

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  avatar?: string;
  isVerified: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Async thunks
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember = false }: { email: string; password: string; remember?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { token, user } = response.data.data;
      
      if (!token) {
        throw new Error('No token received');
      }

      // Lưu token vào storage
      saveTokens(token, undefined, remember);
      
      return { user, token };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const registerAsync = createAsyncThunk(
  'auth/register',
  async ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', { email, password, fullName, phone });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const verifyOTPAsync = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'OTP verification failed');
      }

      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'OTP verification failed';
      return rejectWithValue(message);
    }
  }
);

export const forgotPasswordAsync = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send reset email');
      }

      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to send reset email';
      return rejectWithValue(message);
    }
  }
);

export const resetPasswordAsync = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, otp, newPassword }: { email: string; otp: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Password reset failed');
      }

      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Password reset failed';
      return rejectWithValue(message);
    }
  }
);

export const resendOTPAsync = createAsyncThunk(
  'auth/resendOTP',
  async ({ email, type }: { email: string; type: 'register' | 'forgot-password' }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/resend-otp', { email, type });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to resend OTP');
      }

      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to resend OTP';
      return rejectWithValue(message);
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      clearTokens();
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOTPAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTPAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyOTPAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Forgot Password
    builder
      .addCase(forgotPasswordAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPasswordAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPasswordAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset Password
    builder
      .addCase(resetPasswordAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPasswordAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPasswordAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resend OTP
    builder
      .addCase(resendOTPAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOTPAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendOTPAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, setCredentials, updateUser } = authSlice.actions;
export default authSlice.reducer;
