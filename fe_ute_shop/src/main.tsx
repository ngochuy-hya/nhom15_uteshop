import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import './index.css'
import App from './App.tsx'
import { store, persistor } from './store'
import { api } from './api/client'
import { setupMock } from './api/mock'

if (import.meta.env.VITE_USE_MOCK !== 'false') {
    setupMock(api)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
)


