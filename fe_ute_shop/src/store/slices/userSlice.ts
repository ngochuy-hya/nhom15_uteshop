import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { User } from './authSlice';

export interface UserState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
}

// Async thunks
export const getProfileAsync = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/profile');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get profile');
      }

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to get profile';
      return rejectWithValue(message);
    }
  }
);

export const updateProfileAsync = createAsyncThunk(
  'user/updateProfile',
  async (profileData: { fullName?: string; phone?: string; address?: string; avatar?: string }, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/profile', profileData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update profile');
      }

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

export const changePasswordAsync = createAsyncThunk(
  'user/changePassword',
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await api.put('/user/change-password', { currentPassword, newPassword });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password');
      }

      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to change password';
      return rejectWithValue(message);
    }
  }
);

export const deleteAccountAsync = createAsyncThunk(
  'user/deleteAccount',
  async ({ password }: { password: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete('/user/delete-account', { data: { password } });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete account');
      }

      return response.data.message;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete account';
      return rejectWithValue(message);
    }
  }
);

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get Profile
    builder
      .addCase(getProfileAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfileAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getProfileAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateProfileAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(updateProfileAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Change Password
    builder
      .addCase(changePasswordAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePasswordAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePasswordAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Account
    builder
      .addCase(deleteAccountAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccountAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.profile = null;
        state.error = null;
      })
      .addCase(deleteAccountAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearProfile } = userSlice.actions;
export default userSlice.reducer;
