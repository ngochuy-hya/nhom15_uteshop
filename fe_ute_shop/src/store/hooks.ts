import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch, AppRootState } from './index';

// Typed hooks để sử dụng trong components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Hook với proper typing cho app state
export const useAppState = () => {
  return useSelector((state: RootState) => state as unknown as AppRootState);
};
