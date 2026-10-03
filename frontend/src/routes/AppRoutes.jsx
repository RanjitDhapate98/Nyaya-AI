import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Cases from '../pages/Cases';
import CreateCase from '../pages/CreateCase';
import CaseDetails from '../pages/CaseDetails';
import Prediction from '../pages/Prediction';
import SimilarCases from '../pages/SimilarCases';
import Analytics from '../pages/Analytics';
import Recommendations from '../pages/Recommendations';
import PredictionHub from '../pages/PredictionHub';
import SimilarHub from '../pages/SimilarHub';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route element={<ProtectedRoute roles={['admin', 'analyst']} />}>
            <Route path="/cases/new" element={<CreateCase />} />
            <Route path="/cases/:id/edit" element={<CreateCase />} />
          </Route>
          <Route path="/cases/:id" element={<CaseDetails />} />
          <Route path="/cases/:id/prediction" element={<Prediction />} />
          <Route path="/cases/:id/similar" element={<SimilarCases />} />
          <Route path="/predictions" element={<PredictionHub />} />
          <Route path="/similar" element={<SimilarHub />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
