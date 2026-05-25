import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Disclaimer from '../common/Disclaimer';
import { useDataSource } from '../../contexts/DataSourceContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { mockMode } = useDataSource();

  return (
    <div className="flex h-screen flex-col">
      {mockMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-center text-sm text-yellow-800">
          当前为模拟数据模式，显示的数据仅供参考
        </div>
      )}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
      <Disclaimer />
    </div>
  );
}
