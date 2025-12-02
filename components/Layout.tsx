
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, IndianRupee, FileText, List, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dash' },
    { id: 'PAYMENT', icon: IndianRupee, label: 'Collect' },
    { id: 'REPORTS', icon: FileText, label: 'Reports' },
    { id: 'UNPAID_LIST', icon: List, label: 'Unpaid' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="w-8"></div> {/* Spacer for centering */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">Continental Heights</h1>
          <p className="text-xs text-slate-500">B-Wing Manager</p>
        </div>
        <button 
          onClick={() => setView('SETTINGS')}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${currentView === 'SETTINGS' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                currentView === item.id ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
