
import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, IndianRupee, FileText, Settings, Wallet, Building, CalendarDays } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const navItems = [
    { 
      id: 'DASHBOARD', 
      icon: LayoutDashboard, 
      label: 'Dash', 
      activeColor: 'text-indigo-600 dark:text-indigo-400', 
      activeBg: 'bg-indigo-50 dark:bg-indigo-900/30' 
    },
    { 
      id: 'PAYMENT', 
      icon: IndianRupee, 
      label: 'Collect', 
      activeColor: 'text-emerald-600 dark:text-emerald-400', 
      activeBg: 'bg-emerald-50 dark:bg-emerald-900/30' 
    },
    { 
      id: 'FLATS', 
      icon: Building, 
      label: 'Flats', 
      activeColor: 'text-orange-500 dark:text-orange-400', 
      activeBg: 'bg-orange-50 dark:bg-orange-900/30' 
    },
    { 
      id: 'HALL_BOOKING', 
      icon: CalendarDays, 
      label: 'Hall', 
      activeColor: 'text-purple-600 dark:text-purple-400', 
      activeBg: 'bg-purple-50 dark:bg-purple-900/30' 
    },
    { 
      id: 'ACCOUNTS', 
      icon: Wallet, 
      label: 'Accounts', 
      activeColor: 'text-pink-500 dark:text-pink-400', 
      activeBg: 'bg-pink-50 dark:bg-pink-900/30' 
    }, 
    { 
      id: 'REPORTS', 
      icon: FileText, 
      label: 'Reports', 
      activeColor: 'text-sky-600 dark:text-sky-400', 
      activeBg: 'bg-sky-50 dark:bg-sky-900/30' 
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="w-8"></div> {/* Spacer for centering */}
        <div className="text-center">
          <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight">Continental Heights B Wing</h1>
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-[0.2em] uppercase leading-tight">Accounts Manager</p>
        </div>
        <button 
          onClick={() => setView('SETTINGS')}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${
            currentView === 'SETTINGS' 
              ? 'bg-slate-900 dark:bg-black text-white rotate-180 shadow-md' 
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Settings size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors duration-200">
        <div className="flex justify-between items-center px-2 py-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewState)}
                className={`group flex flex-col items-center justify-center w-full py-2 rounded-2xl transition-all duration-300 ease-in-out relative overflow-hidden ${
                  isActive 
                    ? `${item.activeBg} ${item.activeColor}` 
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:-translate-y-0.5'}`}>
                   <item.icon 
                      size={24} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className={isActive ? "drop-shadow-sm" : ""}
                   />
                </div>
                <span className={`text-[10px] font-bold mt-0.5 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
                
                {isActive && (
                    <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${item.activeColor.split(' ')[0].replace('text-', 'bg-')} opacity-50`}></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
