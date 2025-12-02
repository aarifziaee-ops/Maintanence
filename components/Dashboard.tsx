import React, { useState } from 'react';
import { AppState, PaymentStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils/helpers';
import { Sparkles, TrendingUp, Users } from 'lucide-react';
import { generateFinancialInsight } from '../services/geminiService';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const paidCount = state.flats.filter(f => f.status === PaymentStatus.PAID).length;
  const unpaidCount = state.flats.filter(f => f.status === PaymentStatus.UNPAID).length;
  const totalCollected = state.transactions.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Today's stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollected = state.transactions
    .filter(t => t.date.startsWith(todayStr))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const data = [
    { name: 'Paid', value: paidCount },
    { name: 'Unpaid', value: unpaidCount },
  ];

  const COLORS = ['#22c55e', '#ef4444'];

  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const text = await generateFinancialInsight(state);
    setInsight(text);
    setLoadingInsight(false);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 text-slate-500 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase">Collected Today</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(todayCollected)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center space-x-2 text-slate-500 mb-1">
            <Users size={16} />
            <span className="text-xs font-semibold uppercase">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{paidCount} <span className="text-sm font-normal text-slate-400">/ {state.flats.length}</span></p>
        </div>
      </div>

      <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white">
        <p className="text-blue-100 text-sm font-medium mb-1">Total Collection (Cycle)</p>
        <h2 className="text-4xl font-bold">{formatCurrency(totalCollected)}</h2>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Collection Status</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Flats']} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-indigo-900 font-bold flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
            AI Insight
          </h3>
          <button 
            onClick={handleGenerateInsight}
            disabled={loadingInsight}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingInsight ? 'Analyzing...' : 'Generate Analysis'}
          </button>
        </div>
        
        {insight ? (
          <p className="text-slate-700 text-sm leading-relaxed animate-fade-in">
            {insight}
          </p>
        ) : (
          <p className="text-slate-400 text-sm italic">
            Tap generate to analyze collection trends with Gemini.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;