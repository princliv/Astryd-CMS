import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AdminRestaurantProvider } from '../context/RestaurantContext';
import { AdminToastProvider } from './context/AdminToastContext';
import { DraftSaveProvider } from './context/DraftSaveContext';
import { AdminRoutes } from './routes';
import { ThemeProvider } from './theme/ThemeProvider';
import './astryd.css';

export function AdminApp() {
  return (
    <ThemeProvider>
      <div className="admin-shell min-h-screen">
        <BrowserRouter>
          <AuthProvider>
            <AdminRestaurantProvider>
              <AdminToastProvider>
                <DraftSaveProvider>
                  <AdminRoutes />
                </DraftSaveProvider>
              </AdminToastProvider>
            </AdminRestaurantProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}
