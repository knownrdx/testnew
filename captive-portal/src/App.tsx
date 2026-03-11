import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { SuccessPage } from './pages/Success';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/portal/:hotelSlug" element={<LoginPage />} />
        <Route path="/portal/:hotelSlug/success" element={<SuccessPage />} />
        <Route path="*" element={<Navigate to="/portal/sample-hotel" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
