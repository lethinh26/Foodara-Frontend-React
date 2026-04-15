import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from '../store';
import { antdTheme } from '../config/antdTheme';
import { AppRouter } from '../routes';
import { useSessionRestore } from '../hooks/useSessionRestore';
import '../styles/global.css';

// Component to handle session restoration
const SessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSessionRestore();
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SessionManager>
          <ConfigProvider theme={antdTheme} locale={viVN}>
            <AppRouter />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '14px',
                },
              }}
            />
          </ConfigProvider>
        </SessionManager>
      </PersistGate>
    </Provider>
  );
};

export default App;
