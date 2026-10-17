import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import NewExperimentPage from './pages/NewExperimentPage';
import ExperimentDetailPage from './pages/ExperimentDetailPage';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="experiments/new" element={<NewExperimentPage />} />
          <Route path="experiments/:id" element={<ExperimentDetailPage />} />
          <Route path="experiments/:id/report" element={<ReportPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
