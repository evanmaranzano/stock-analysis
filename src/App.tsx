import { Routes, Route } from 'react-router-dom';
import { DataSourceProvider } from './contexts/DataSourceContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import Home from './pages/Home';
import StockPage from './pages/StockPage';
import PortfolioPage from './pages/PortfolioPage';

export default function App() {
  return (
    <DataSourceProvider>
      <PortfolioProvider>
        <Layout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/stock/:market/:code" element={<StockPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </PortfolioProvider>
    </DataSourceProvider>
  );
}
