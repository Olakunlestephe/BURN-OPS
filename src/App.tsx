import React from 'react';
import { BurnOpsProvider, useBurnOps } from './context/BurnOpsContext';
import { Navbar } from './components/Navbar';
import { HomeTab } from './components/tabs/HomeTab';
import { StockTab } from './components/tabs/StockTab';
import { AuditTab } from './components/tabs/AuditTab';
import { SitesTab } from './components/tabs/SitesTab';
import { DispatchTab } from './components/tabs/DispatchTab';
import { TradeTab } from './components/tabs/TradeTab';
import { UpdatesTab } from './components/tabs/UpdatesTab';
import { AdminTab } from './components/tabs/AdminTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Check, AlertCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { state, toastMessage } = useBurnOps();

  const renderActiveTab = () => {
    switch (state.tab) {
      case 'home':
        return <HomeTab />;
      case 'stock':
        return <StockTab />;
      case 'audit':
        return <AuditTab />;
      case 'sites':
        return <SitesTab />;
      case 'dispatch':
        return <DispatchTab />;
      case 'trade':
        return <TradeTab />;
      case 'news':
        return <UpdatesTab />;
      case 'admin':
        return <AdminTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 pb-24 md:pb-12">
        <ErrorBoundary fallbackTitle="Could not load the requested tab view">
          {renderActiveTab()}
        </ErrorBoundary>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-stone-900/95 dark:bg-stone-100/95 text-stone-50 dark:text-stone-900 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 border border-stone-800 dark:border-stone-200 text-xs font-semibold tracking-wide max-w-sm sm:max-w-md text-center">
            <span className="w-2 h-2 rounded-full bg-[#E8590C] shrink-0 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BurnOpsProvider>
      <MainContent />
    </BurnOpsProvider>
  );
}
