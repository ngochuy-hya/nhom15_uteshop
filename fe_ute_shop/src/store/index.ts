import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

import authReducer, { setCredentials } from './slices/authSlice';
import userReducer from './slices/userSlice';
import { initializeStorage } from '../utils/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Chỉ persist auth state
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Initialize storage and restore user session
const initializeApp = () => {
  const storedAuth = initializeStorage();
  if (storedAuth && storedAuth.user && storedAuth.token) {
    store.dispatch(setCredentials({
      user: storedAuth.user,
      token: storedAuth.token
    }));
  }
};

// Initialize app after store is created
initializeApp();

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Helper type để lấy root state without persistence wrapper
export type AppRootState = {
  auth: ReturnType<typeof authReducer>;
  user: ReturnType<typeof userReducer>;
};
