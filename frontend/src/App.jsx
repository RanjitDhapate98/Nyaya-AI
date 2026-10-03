import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, style: { fontSize: '14px', borderRadius: '10px', border: '1px solid #e9ecf2' } }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
