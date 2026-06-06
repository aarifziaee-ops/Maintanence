
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { MAINTENANCE_AMOUNT } from '../constants';
import { formatCurrency, calculateMaintenanceForMonth } from '../utils/helpers';
import { Users, IndianRupee, AlertCircle, Percent, BarChart3, CalendarCheck, ChevronLeft, ChevronRight, Calendar, Wallet } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const handlePrevMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  // Derived Stats based on SELECTED MONTH
  const stats = useMemo(() => {
    // 1. Get transactions only for the selected month
    const monthTransactions = state.transactions.filter(t => t.date.startsWith(selectedMonth));
    
    // 2. Determine paid flats for this month
    const paidFlatIds = new Set(monthTransactions.map(t => t.flatId));
    const paidCount = paidFlatIds.size;
    const unpaidCount = Math.max(0, state.flats.length - paidCount);
    
    const targetYear = parseInt(selectedMonth.split('-')[0]);
    const targetMonth = parseInt(selectedMonth.split('-')[1]);
    
    // Calculate Outstanding Amount dynamically
    const unpaidFlats = state.flats.filter(f => !paidFlatIds.has(f.id));
    const outstandingAmount = unpaidFlats.reduce((acc, flat) => {
      return acc + calculateMaintenanceForMonth(flat, targetYear, targetMonth);
    }, 0);
    
    // 3. Total collected in this month
    const totalCollected = monthTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Payment Mode Split
    const cashTransactions = monthTransactions.filter(t => t.paymentMode === 'CASH' || !t.paymentMode);
    const bankTransactions = monthTransactions.filter(t => t.paymentMode === 'BANK');
    
    const cashAmount = cashTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const bankAmount = bankTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const cashCount = cashTransactions.length;
    const bankCount = bankTransactions.length;

    // Tenant / Owner Split
    const totalTenants = state.flats.filter(f => f.isRented).length;
    const totalOwners = state.flats.filter(f => !f.isRented).length;
    const paidTenants = state.flats.filter(f => f.isRented && paidFlatIds.has(f.id)).length;
    const paidOwners = state.flats.filter(f => !f.isRented && paidFlatIds.has(f.id)).length;
    
    // 4. Today's collection (only if today is in the selected month)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollected = state.transactions
      .filter(t => t.date.startsWith(todayStr))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const percentPaid = state.flats.length > 0 ? Math.round((paidCount / state.flats.length) * 100) : 0;
    
    // 5. Calculate Outstanding Amount (already done above)

    return {
      paidCount,
      unpaidCount,
      totalCollected,
      todayCollected,
      percentPaid,
      monthTransactions,
      outstandingAmount,
      cashAmount,
      bankAmount,
      cashCount,
      bankCount,
      totalTenants,
      totalOwners,
      paidTenants,
      paidOwners
    };
  }, [state.flats, state.transactions, selectedMonth]);

  const pieData = [
    { name: 'Paid', value: stats.paidCount },
    { name: 'Unpaid', value: stats.unpaidCount },
  ];

  const PIE_COLORS = ['#22c55e', '#ef4444'];

  // Trend data for the selected month
  const dailyTrend = useMemo(() => {
      const daysInMonth = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
      const data = [];
      for(let i = 1; i <= daysInMonth; i++) {
          const dayStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
          const dailySum = state.transactions
              .filter(t => t.date === dayStr)
              .reduce((sum, t) => sum + t.amount, 0);
          
          if (dailySum > 0 || i % 5 === 0) { // Optimize points for chart
              data.push({
                  name: String(i),
                  amount: dailySum
              });
          }
      }
      return data;
  }, [state.transactions, selectedMonth]);

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full transition-colors">
      
      {/* Month Navigator - Compact Version */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between sticky top-0 z-20 mx-1">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
          
          <div className="flex flex-col items-center">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Period</div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase flex items-center">
                  <Calendar size={14} className="mr-1.5 text-blue-500" />
                  {monthLabel}
              </h2>
          </div>

          <button onClick={handleNextMonth} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Collected */}
        <div className="bg-blue-600 dark:bg-blue-700 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden text-center">
            <div className="relative z-10 flex flex-col items-center justify-center">
                <p className="text-blue-100 text-[10px] font-black uppercase mb-1 flex items-center justify-center">
                    <IndianRupee size={12} className="mr-1" />
                    Collection ({new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'short' })})
                </p>
                <h2 className="text-2xl font-black truncate tracking-tight">{formatCurrency(stats.totalCollected)}</h2>
            </div>
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500 rounded-full opacity-50 blur-xl"></div>
        </div>

        {/* Today's Collection */}
        <div className="bg-emerald-500 dark:bg-emerald-600 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden text-center">
             <div className="relative z-10 flex flex-col items-center justify-center">
                <p className="text-emerald-50 text-[10px] font-black uppercase mb-1 flex items-center justify-center">
                    <CalendarCheck size={12} className="mr-1" />
                    Today's Collection
                </p>
                <h2 className="text-2xl font-black tracking-tight">{formatCurrency(stats.todayCollected)}</h2>
             </div>
             <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-400 rounded-full opacity-30 blur-xl"></div>
        </div>
      </div>

      {/* Payment Modes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
           <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-1">
            <Wallet size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cash in Hand</span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{formatCurrency(stats.cashAmount)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{stats.cashCount} payments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
           <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-1">
            <IndianRupee size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cash at Bank</span>
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{formatCurrency(stats.bankAmount)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{stats.bankCount} transfers</p>
        </div>
      </div>

      {/* Counts Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
           <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-1">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Paid</span>
          </div>
          <p className="text-xl font-bold text-green-700 dark:text-green-500 leading-tight">{stats.paidCount}</p>
          <p className="text-[10px] text-slate-400">/ {state.flats.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col items-center text-center">
           <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-1 relative z-10">
            <Percent size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">Progress</span>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight relative z-10">{stats.percentPaid}%</p>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
             <div className="h-full bg-blue-500" style={{ width: `${stats.percentPaid}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
           <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-1">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-xl font-bold text-red-700 dark:text-red-500 leading-tight">{stats.unpaidCount}</p>
           <p className="text-[10px] text-slate-400">flats</p>
        </div>
      </div>

      {/* Tenant / Owner Payment Split */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-1">
              <Users size={14} className="text-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Rental Paid</span>
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {stats.paidTenants} <span className="text-sm text-slate-400 font-normal">/ {stats.totalTenants}</span>
            </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <div className="flex items-center justify-center space-x-1 text-slate-500 dark:text-slate-400 mb-1">
              <Users size={14} className="text-purple-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Owners Paid</span>
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {stats.paidOwners} <span className="text-sm text-slate-400 font-normal">/ {stats.totalOwners}</span>
            </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
            <BarChart3 size={16} className="mr-2 text-blue-500" />
            Daily Trend ({new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'short' })})
          </h3>
          <div className="h-40 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dailyTrend}>
                 <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                 <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} width={30} />
                 <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc' }} />
                 <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Collection Mix</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc' }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{fontSize: '12px', color: '#94a3b8'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Outstanding Amount (Replaces AI Insight) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center mb-1">
              <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
              Outstanding Amount
            </h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
               {formatCurrency(stats.outstandingAmount)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
               {stats.unpaidCount} flats pending payment
            </p>
          </div>
           <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full text-red-500 dark:text-red-400">
             <Wallet size={24} />
           </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-10 transform translate-y-1/4 translate-x-1/4">
             <Wallet size={120} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
