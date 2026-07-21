
import React, { useState, useMemo } from 'react';
import { AppState, Flat } from '../types';
import { updateFlatDetails } from '../services/storageService';
import { Search, Building, User, Phone, Save, ArrowLeft, Bike, Car, Home, LayoutDashboard, List, PieChart as PieIcon, Edit2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface FlatMasterProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
}

const FlatMaster: React.FC<FlatMasterProps> = ({ state, refreshState }) => {
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'LIST'>('LIST');
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Edit Mode State ---
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Occupancy
  const [isRented, setIsRented] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantMobile, setTenantMobile] = useState('');
  
  // Vehicles
  const [vehicle2WCount, setVehicle2WCount] = useState(0);
  const [vehicle4WCount, setVehicle4WCount] = useState(0);
  const [vehicle2WNumbers, setVehicle2WNumbers] = useState('');
  const [vehicle4WNumbers, setVehicle4WNumbers] = useState('');

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    let rented = 0;
    let owners = 0;
    let total2W = 0;
    let total4W = 0;
    
    state.flats.forEach(flat => {
      if (flat.isRented) {
        rented++;
      } else {
        owners++;
      }
      total2W += (flat.vehicle2WCount || 0);
      total4W += (flat.vehicle4WCount || 0);
    });

    return {
      total: state.flats.length,
      rented,
      owners,
      total2W,
      total4W,
      totalVehicles: total2W + total4W
    };
  }, [state.flats]);

  const occupancyData = [
    { name: 'Owner', value: stats.owners, color: '#3b82f6' }, // Blue
    { name: 'Rented', value: stats.rented, color: '#f97316' }, // Orange
  ];

  const vehicleData = [
    { name: '2 Wheelers', count: stats.total2W, fill: '#8b5cf6' }, // Violet
    { name: '4 Wheelers', count: stats.total4W, fill: '#10b981' }, // Emerald
  ];

  const filteredFlats = useMemo(() => {
    return state.flats.filter(flat => {
      const search = searchTerm.toLowerCase();
      return (
        flat.flatNumber.toLowerCase().includes(search) || 
        flat.ownerName?.toLowerCase().includes(search) ||
        flat.mobile?.toLowerCase().includes(search) ||
        flat.tenantName?.toLowerCase().includes(search) ||
        flat.tenantMobile?.toLowerCase().includes(search)
      );
    });
  }, [state.flats, searchTerm]);

  const handleSelectFlat = (flat: Flat) => {
    setSelectedFlatId(flat.id);
    // Initialize form state
    setOwnerName(flat.ownerName || '');
    setMobile(flat.mobile || '');
    setIsRented(!!flat.isRented);
    setTenantName(flat.tenantName || '');
    setTenantMobile(flat.tenantMobile || '');
    setVehicle2WCount(flat.vehicle2WCount || 0);
    setVehicle4WCount(flat.vehicle4WCount || 0);
    setVehicle2WNumbers(flat.vehicle2WNumbers || '');
    setVehicle4WNumbers(flat.vehicle4WNumbers || '');
  };

  const handleSave = () => {
    if (!selectedFlatId) return;
    try {
      const newState = updateFlatDetails(state, selectedFlatId, {
        ownerName,
        mobile,
        isRented,
        tenantName: isRented ? tenantName : '',
        tenantMobile: isRented ? tenantMobile : '',
        vehicle2WCount,
        vehicle4WCount,
        vehicle2WNumbers,
        vehicle4WNumbers
      });
      refreshState(newState);
      setSelectedFlatId(null);
    } catch (error) {
      alert("Failed to update details.");
    }
  };

  const getFlatNumber = () => {
    return state.flats.find(f => f.id === selectedFlatId)?.flatNumber || '';
  };

  // --- RENDER DASHBOARD ---
  const renderDashboard = () => (
    <div className="p-4 space-y-6 pb-24">
       {/* Summary Cards */}
       <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center h-24">
             <span className="text-slate-400 mb-1"><Building size={20} /></span>
             <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase">Total Flats</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center h-24">
             <span className="text-orange-400 mb-1"><User size={20} /></span>
             <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.rented}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase">Rented</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center h-24">
             <span className="text-emerald-500 mb-1"><Car size={20} /></span>
             <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalVehicles}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicles</span>
          </div>
       </div>

       {/* Occupancy Chart */}
       <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
             <PieIcon size={16} className="mr-2 text-slate-400" />
             Occupancy Status
          </h3>
          <div className="h-48 w-full flex">
             <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={occupancyData}
                         cx="50%"
                         cy="50%"
                         innerRadius={35}
                         outerRadius={55}
                         paddingAngle={5}
                         dataKey="value"
                         stroke="none"
                      >
                         {occupancyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Pie>
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="w-1/2 flex flex-col justify-center space-y-3 pl-2">
                {occupancyData.map(item => (
                   <div key={item.name}>
                      <div className="flex items-center space-x-2 mb-1">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                         <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.name}</span>
                      </div>
                      <p className="text-xl font-bold text-slate-800 dark:text-white ml-5">{item.value}</p>
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Vehicle Stats Chart */}
       <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
             <Car size={16} className="mr-2 text-slate-400" />
             Vehicle Distribution
          </h3>
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleData} layout="vertical" margin={{ left: 20, right: 20 }}>
                   <XAxis type="number" hide />
                   <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{fill: 'transparent'}} 
                       contentStyle={{
                          borderRadius: '8px', 
                          border: 'none', 
                          backgroundColor: '#1e293b', 
                          color: '#f8fafc'
                       }}
                   />
                   <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {vehicleData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-around mt-2">
             {vehicleData.map(item => (
                <div key={item.name} className="text-center">
                   <p className="text-xs text-slate-400 font-bold uppercase">{item.name}</p>
                   <p className="text-lg font-bold text-slate-800 dark:text-white">{item.count}</p>
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  // --- RENDER LIST ---
  const renderList = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
       <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by flat, name, or phone..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          <div className="flex justify-between items-center mb-2 px-1">
             <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Master Directory ({filteredFlats.length})</h3>
          </div>
          {filteredFlats.length === 0 ? (
             <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Search size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No records found matching "{searchTerm}"</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredFlats.map(flat => (
                 <div
                   key={flat.id}
                   className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group cursor-pointer"
                   onClick={() => handleSelectFlat(flat)}
                 >
                    {/* Card Header (Flat & Status) */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                       <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-xl flex items-center justify-center font-black shadow-sm">
                             {flat.flatNumber.split('-')[1] || flat.flatNumber}
                          </div>
                          <div>
                             <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{flat.flatNumber}</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Continental Heights</p>
                          </div>
                       </div>
                       <div>
                          {flat.isRented ? (
                             <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-black px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-800/50 shadow-sm flex items-center">
                               <Home size={12} className="mr-1.5" /> Rented
                             </span>
                          ) : (
                             <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center">
                               <User size={12} className="mr-1.5" /> Owner
                             </span>
                          )}
                       </div>
                    </div>

                    {/* Card Body (Owner & Tenant Info) */}
                    <div className="p-4 space-y-4 flex-1">
                       <div className="flex items-start space-x-3">
                          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0 mt-0.5">
                             <User size={16} className="text-slate-400 dark:text-slate-500" />
                          </div>
                          <div className="flex-1">
                             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Owner</p>
                             <p className="font-semibold text-slate-800 dark:text-slate-200 break-words">{flat.ownerName || 'Not Specified'}</p>
                             {flat.mobile ? (
                                <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); window.open(`tel:${flat.mobile}`); }}>
                                   <Phone size={12} className="mr-1.5" />
                                   {flat.mobile}
                                </div>
                             ) : (
                                <div className="flex items-center text-xs font-medium text-slate-400 mt-1 italic">No Number</div>
                             )}
                          </div>
                       </div>

                       {flat.isRented && (
                          <>
                             <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
                             <div className="flex items-start space-x-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg shrink-0 mt-0.5">
                                   <User size={16} className="text-orange-400" />
                                </div>
                                <div className="flex-1">
                                   <p className="text-xs font-bold text-orange-500/70 dark:text-orange-400/70 uppercase tracking-wider mb-0.5">Tenant</p>
                                   <p className="font-semibold text-slate-800 dark:text-slate-200 break-words">{flat.tenantName || 'Not Specified'}</p>
                                   {flat.tenantMobile ? (
                                      <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); window.open(`tel:${flat.tenantMobile}`); }}>
                                         <Phone size={12} className="mr-1.5" />
                                         {flat.tenantMobile}
                                      </div>
                                   ) : (
                                      <div className="flex items-center text-xs font-medium text-slate-400 mt-1 italic">No Number</div>
                                   )}
                                </div>
                             </div>
                          </>
                       )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center">
                          Tap to Edit <Edit2 size={10} className="ml-1" />
                       </span>
                    </div>
                 </div>
               ))}
             </div>
          )}
       </div>
    </div>
  );

  // --- EDIT VIEW ---
  if (selectedFlatId) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex justify-between items-center shadow-sm">
           <div className="flex items-center">
              <button onClick={() => setSelectedFlatId(null)} className="mr-3 text-slate-500 hover:text-slate-800 dark:hover:text-white">
                 <ArrowLeft size={24} />
              </button>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Edit Flat Details</h2>
           </div>
           <button onClick={handleSave} className="text-blue-600 dark:text-blue-400 font-bold text-sm">Save</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
          
          {/* Unit Info */}
          <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Unit Information</h3>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Flat Number</label>
                <div className="flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                   <Building size={18} className="mr-3" />
                   <span className="font-bold">{getFlatNumber()}</span>
                </div>
             </div>
          </section>

          {/* Owner Details */}
          <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Owner Details</h3>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Owner Name</label>
                   <div className="relative">
                      <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Owner Mobile</label>
                   <div className="relative">
                      <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      <input 
                        type="tel" 
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                      />
                   </div>
                </div>
             </div>
          </section>

          {/* Occupancy Status */}
          <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Occupancy Status</h3>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                   <div className="flex items-center text-blue-800 dark:text-blue-300">
                      <div className="p-2 bg-white dark:bg-blue-900/50 rounded-full mr-3 shadow-sm">
                         <Home size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-bold">Is Flat Rented?</span>
                   </div>
                   <div 
                     className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${isRented ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                     onClick={() => setIsRented(!isRented)}
                   >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${isRented ? 'translate-x-5' : 'translate-x-0'}`}></div>
                   </div>
                </div>

                {isRented && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                     <div className="pl-4 border-l-2 border-blue-200 dark:border-blue-900/30 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tenant Name</label>
                          <input 
                            type="text" 
                            value={tenantName}
                            onChange={(e) => setTenantName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                            placeholder="Enter tenant name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tenant Mobile</label>
                          <input 
                            type="tel" 
                            value={tenantMobile}
                            onChange={(e) => setTenantMobile(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                            placeholder="Enter tenant mobile"
                          />
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </section>

          {/* Parking & Vehicles */}
          <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Parking & Vehicles</h3>
             
             {/* 2 Wheelers */}
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center text-slate-700 dark:text-slate-200 font-bold">
                      <Bike size={20} className="mr-2 text-slate-500 dark:text-slate-400" />
                      2 Wheelers
                   </div>
                   <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                      <button 
                        onClick={() => setVehicle2WCount(Math.max(0, vehicle2WCount - 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all"
                      >-</button>
                      <span className="font-bold w-4 text-center dark:text-white">{vehicle2WCount}</span>
                      <button 
                        onClick={() => setVehicle2WCount(vehicle2WCount + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all"
                      >+</button>
                   </div>
                </div>
                {vehicle2WCount > 0 && (
                    <input 
                      type="text" 
                      value={vehicle2WNumbers}
                      onChange={(e) => setVehicle2WNumbers(e.target.value)}
                      placeholder="e.g. MH 04 AB 1234, MH 04 XY 5678"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white font-mono text-sm bg-white dark:bg-slate-800"
                    />
                )}
             </div>

             {/* 4 Wheelers */}
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center text-slate-700 dark:text-slate-200 font-bold">
                      <Car size={20} className="mr-2 text-slate-500 dark:text-slate-400" />
                      4 Wheelers
                   </div>
                   <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                      <button 
                        onClick={() => setVehicle4WCount(Math.max(0, vehicle4WCount - 1))}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all"
                      >-</button>
                      <span className="font-bold w-4 text-center dark:text-white">{vehicle4WCount}</span>
                      <button 
                        onClick={() => setVehicle4WCount(vehicle4WCount + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded transition-all"
                      >+</button>
                   </div>
                </div>
                {vehicle4WCount > 0 && (
                    <input 
                      type="text" 
                      value={vehicle4WNumbers}
                      onChange={(e) => setVehicle4WNumbers(e.target.value)}
                      placeholder="e.g. MH 04 CD 9999"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white font-mono text-sm bg-white dark:bg-slate-800"
                    />
                )}
             </div>
          </section>

          {/* Save Button Large */}
          <button
             onClick={handleSave}
             className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-transform flex items-center justify-center"
          >
             <Save size={20} className="mr-2" />
             Save Changes
          </button>

        </div>
      </div>
    );
  }

  // --- MAIN CONTAINER ---
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
       
       {/* Tab Switcher */}
       <div className="bg-white dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm transition-colors">
          <div className="flex justify-between items-center mb-2">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">Flat Master</h2>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
             <button 
               onClick={() => setViewMode('DASHBOARD')}
               className={`flex-1 py-1.5 rounded-md text-sm font-bold flex items-center justify-center transition-all ${viewMode === 'DASHBOARD' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >
                <LayoutDashboard size={16} className="mr-2" />
                Overview
             </button>
             <button 
               onClick={() => setViewMode('LIST')}
               className={`flex-1 py-1.5 rounded-md text-sm font-bold flex items-center justify-center transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >
                <List size={16} className="mr-2" />
                All Flats
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto">
          {viewMode === 'DASHBOARD' ? renderDashboard() : renderList()}
       </div>

    </div>
  );
};

export default FlatMaster;
