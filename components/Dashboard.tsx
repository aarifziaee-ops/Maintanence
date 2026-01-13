
import React, { useState, useMemo } from 'react';
import { AppState, PaymentStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Sparkles, TrendingUp, Users, IndianRupee, AlertCircle, Percent, Clock, BarChart3, Receipt, CalendarCheck } from 'lucide-react';
import { generateFinancialInsight } from '../services/geminiService';
import { updateInsight } from '../services/storageService';

interface DashboardProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, refreshState }) => {
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Derived Stats to ensure perfect synchronization
  const stats = useMemo(() => {
    // A flat is "Paid" if it has at least one transaction
    const paidFlatIds = new Set(state.transactions.map(t => t.flatId));
    const paidCount = paidFlatIds.size;
    const unpaidCount = Math.max(0, state.flats.length - paidCount);
    
    const totalCollected = state.transactions.reduce((acc, curr) => acc + curr.amount, 0);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollected = state.transactions
      .filter(t => t.date.startsWith(todayStr))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const percentPaid = state.flats.length > 0 ? Math.round((paidCount / state.flats.length) * 100) : 0;
    
    // Explicitly find the highest receipt number from data
    const actualLastReceipt = state.transactions.reduce((max, t) => Math.max(max, t.receiptNo), 0);

    return {
      paidCount,
      unpaidCount,
      totalCollected,
      todayCollected,
      percentPaid,
      lastReceipt: actualLastReceipt || state.lastReceiptNo
    };
  }, [state.flats, state.transactions, state.lastReceiptNo]);

  const pieData = [
    { name: 'Paid', value: stats.paidCount },
    { name: 'Unpaid', value: stats.unpaidCount },
  ];

  const PIE_COLORS = ['#22c55e', '#ef4444'];

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const trendData = last7Days.map(dateStr => {
    const dailySum = state.transactions
      .filter(t => t.date.startsWith(dateStr))
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' }),
      amount: dailySum
    };
  });

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const text = await generateFinancialInsight(state);
    const newState = updateInsight(state, text);
    refreshState(newState);
    setLoadingInsight(false);
  };

  const insight = state.aiInsight?.text;
  const lastUpdated = state.aiInsight?.timestamp 
    ? new Date(state.aiInsight.timestamp).toLocaleString() 
    : null;

  return (
    <div className="p-4 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full transition-colors">
      
      {/* Financial Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Collected */}
        <div className="bg-blue-600 dark:bg-blue-700 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden text-center">
            <div className="relative z-10 flex flex-col items-center justify-center">
                <p className="text-blue-100 text-xs font-medium mb-1 flex items-center justify-center">
                    <IndianRupee size={14} className="mr-1" />
                    Total Collected
                </p>
                <h2 className="text-2xl font-bold truncate tracking-tight">{formatCurrency(stats.totalCollected)}</h2>
            </div>
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500 rounded-full opacity-50 blur-xl"></div>
        </div>

        {/* Today's Collection */}
        <div className="bg-emerald-500 dark:bg-emerald-600 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden text-center">
             <div className="relative z-10 flex flex-col items-center justify-center">
                <p className="text-emerald-50 text-xs font-medium mb-1 flex items-center justify-center">
                    <CalendarCheck size={14} className="mr-1" />
                    Today's Collection
                </p>
                <h2 className="text-2xl font-bold tracking-tight">{formatCurrency(stats.todayCollected)}</h2>
             </div>
             <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-400 rounded-full opacity-30 blur-xl"></div>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
            <BarChart3 size={16} className="mr-2 text-blue-500" />
            Weekly Trend
          </h3>
          <div className="h-40 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={trendData}>
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

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-indigo-900 dark:text-indigo-200 font-bold flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            AI Insight
          </h3>
          <button onClick={handleGenerateInsight} disabled={loadingInsight} className="text-xs bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loadingInsight ? 'Analyzing...' : 'Generate Analysis'}
          </button>
        </div>
        {insight ? (
          <div>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-2">{insight}</p>
            {lastUpdated && <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right">Last updated: {lastUpdated}</p>}
          </div>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-sm italic">Tap generate to analyze collection trends.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
