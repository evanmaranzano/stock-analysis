import WatchList from '../components/portfolio/WatchList';
import PortfolioSummary from '../components/portfolio/PortfolioSummary';

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">自选股</h1>
      <PortfolioSummary />
      <WatchList />
    </div>
  );
}
