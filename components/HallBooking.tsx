
import React, { useState, useMemo } from 'react';
import { AppState, HallBooking as HallBookingType } from '../types';
import { addHallBooking, deleteHallBooking, updateHallBookingDetails } from '../services/storageService';
import { formatDate, formatCurrency, getTodayDateString } from '../utils/helpers';
import { Search, Plus, Calendar, Trash2, Share2, ArrowRight, PartyPopper, Home, CheckCircle2, X, Edit2, CalendarDays, Sparkles, MessageCircle } from 'lucide-react';
import { BUILDING_NAME } from '../constants';

interface HallBookingProps {
  state: AppState;
  refreshState: (newState: AppState) => void;
}

type Mode = 'DASHBOARD' | 'FORM';

const HallBooking: React.FC<HallBookingProps> = ({ state, refreshState }) => {
  const [mode, setMode] = useState<Mode>('DASHBOARD');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  
  const [ownerName, setOwnerName] = useState(''); 
  const [mobile, setMobile] = useState('');
  const [hallType, setHallType] = useState<'BIG' | 'SMALL'>('BIG');
  const [bookingDate, setBookingDate] = useState(getTodayDateString());
  const [amount, setAmount] = useState<number | ''>('');

  const filteredFlats = useMemo(() => {
    if (!searchTerm) return [];
    return state.flats.filter(flat => 
      flat.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      flat.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [state.flats, searchTerm]);

  // FIXED: Sort Upcoming (nearest first) -> Past (most recent first)
  const sortedBookings = useMemo(() => {
    if (!state.hallBookings) return [];
    const today = getTodayDateString();
    
    const upcoming = state.hallBookings
      .filter(b => b.bookingDate >= today)
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));
      
    const past = state.hallBookings
      .filter(b => b.bookingDate < today)
      .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate));

    return [...upcoming, ...past];
  }, [state.hallBookings]);

  const handleSelectFlat = (flatId: string) => {
    const flat = state.flats.find(f => f.id === flatId);
    if (flat) {
      setSelectedFlatId(flatId);
      setOwnerName(flat.ownerName || '');
      setMobile(flat.mobile || '');
      setStep(2);
    }
  };

  const startEdit = (booking: HallBookingType) => {
    setEditingId(booking.id);
    setSelectedFlatId(booking.flatId);
    setOwnerName(booking.ownerName);
    setMobile(booking.mobile);
    setHallType(booking.hallType);
    setBookingDate(booking.bookingDate);
    setAmount(booking.amount);
    setStep(2);
    setMode('FORM');
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatId || amount === '') return;

    const flat = state.flats.find(f => f.id === selectedFlatId);
    if (!flat) return;

    if (editingId) {
      const newState = updateHallBookingDetails(state, editingId, {
        ownerName,
        mobile,
        hallType,
        bookingDate,
        amount: Number(amount)
      });
      refreshState(newState);
    } else {
      const newState = addHallBooking(state, {
        flatId: selectedFlatId,
        flatNumber: flat.flatNumber,
        ownerName, 
        mobile,
        hallType,
        bookingDate,
        amount: Number(amount)
      });
      refreshState(newState);
    }

    setMode('DASHBOARD');
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking entry?")) {
      const newState = deleteHallBooking(state, id);
      refreshState(newState);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSearchTerm('');
    setSelectedFlatId(null);
    setEditingId(null);
    setOwnerName('');
    setMobile('');
    setHallType('BIG');
    setBookingDate(getTodayDateString());
    setAmount('');
  };

  const generateWhatsAppReceipt = (booking: HallBookingType) => {
    const cleanMobile = booking.mobile.replace(/\D/g, '');
    const phone = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
    const message = `*HALL BOOKING CONFIRMED*\n${BUILDING_NAME}\n\nDear *${booking.ownerName}*,\n\nYour booking for *${booking.hallType} HALL* is confirmed.\n\nFlat: *${booking.flatNumber}*\nDate: *${formatDate(booking.bookingDate)}*\nAmount: *${formatCurrency(booking.amount)}*\n\nThank you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const generateAdminPrepLink = (booking: HallBookingType) => {
    const message = `*HALL PREPARATION REMINDER*\n${BUILDING_NAME}\n\nTask: Please clean the *${booking.hallType} HALL* and make it ready for the event held for Flat *${booking.flatNumber}*.\n\nEvent Date: *${formatDate(booking.bookingDate)}*\nMember: *${booking.ownerName}*\n\nAdmin Action Required.`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const parseDateParts = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
      year: date.getFullYear()
    };
  };

  const isPrepRequired = (bookingDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = new Date(bookingDateStr);
    event.setHours(0, 0, 0, 0);
    
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Preparation message should be available starting 2 days before the event
    return diffDays >= 0 && diffDays <= 2;
  };

  if (mode === 'FORM') {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex justify-between items-center shadow-sm">
           <button onClick={() => { setMode('DASHBOARD'); resetForm(); }} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1">
             <X size={24} />
           </button>
           <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Booking' : 'New Booking'}</h2>
           <div className="w-8"></div>
        </div>

        {step === 1 ? (
          <div className="p-5 flex-1 overflow-y-auto">
             <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-blue-500" size={20} />
                <input
                  type="text"
                  placeholder="Search flat..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="space-y-3 pb-24">
               {filteredFlats.map(flat => (
                 <button key={flat.id} onClick={() => handleSelectFlat(flat.id)} className="w-full flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all">
                    <div className="text-left">
                        <span className="text-lg font-bold text-slate-800 dark:text-white block leading-tight">{flat.flatNumber}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{flat.ownerName}</span>
                    </div>
                    <ArrowRight size={20} className="text-slate-300" />
                 </button>
               ))}
               {searchTerm && filteredFlats.length === 0 && (
                 <p className="text-center text-slate-400 text-sm py-10">No matching flats found.</p>
               )}
             </div>
          </div>
        ) : (
          <div className="p-5 flex-1 overflow-y-auto pb-24">
             <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <div>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-1">Target Unit</p>
                            <p className="text-3xl font-black text-blue-900 dark:text-blue-100 leading-none">
                              {state.flats.find(f => f.id === selectedFlatId)?.flatNumber}
                            </p>
                        </div>
                        {!editingId && <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-4">Change</button>}
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Facility Choice</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setHallType('BIG')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${hallType === 'BIG' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30' : 'border-slate-100 dark:border-slate-800 grayscale opacity-60'}`}>
                            <PartyPopper size={28} className={hallType === 'BIG' ? 'text-purple-600' : 'text-slate-400'} />
                            <span className={`block font-bold mt-2 ${hallType === 'BIG' ? 'text-purple-900 dark:text-purple-100' : 'text-slate-500'}`}>Big Hall</span>
                          </button>
                          <button type="button" onClick={() => setHallType('SMALL')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${hallType === 'SMALL' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-slate-100 dark:border-slate-800 grayscale opacity-60'}`}>
                            <Home size={28} className={hallType === 'SMALL' ? 'text-amber-600' : 'text-slate-400'} />
                            <span className={`block font-bold mt-2 ${hallType === 'SMALL' ? 'text-amber-900 dark:text-amber-100' : 'text-slate-500'}`}>Small Hall</span>
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Booking Date</label>
                          <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
                          <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold" />
                       </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Person</label>
                       <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Mobile</label>
                       <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
                    </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all">
                   <CheckCircle2 size={20} />
                   <span>{editingId ? 'Update Booking' : 'Confirm Booking'}</span>
                </button>
             </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
       <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
             <CalendarDays size={20} className="mr-2 text-purple-600" />
             Hall Bookings
          </h2>
          <button onClick={() => setMode('FORM')} className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none active:scale-95 transition-all">
             <Plus size={20} />
          </button>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {sortedBookings.length === 0 ? (
             <div className="text-center py-20">
                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Calendar size={32} />
                </div>
                <p className="text-slate-500 font-bold">No bookings recorded yet.</p>
                <button onClick={() => setMode('FORM')} className="mt-4 text-purple-600 font-bold underline">Create your first booking</button>
             </div>
          ) : (
            sortedBookings.map(booking => {
              const status = booking.bookingDate >= getTodayDateString() ? 'UPCOMING' : 'FINISHED';
              const needsPrep = status === 'UPCOMING' && isPrepRequired(booking.bookingDate);
              const date = parseDateParts(booking.bookingDate);
              
              return (
                <div key={booking.id} className={`bg-white dark:bg-slate-900 rounded-2xl border ${status === 'UPCOMING' ? (needsPrep ? 'border-amber-400 shadow-amber-50' : 'border-purple-200 shadow-purple-50') : 'border-slate-200'} dark:border-slate-800 overflow-hidden shadow-md transition-all`}>
                   
                   {needsPrep && (
                      <div className="bg-amber-400 dark:bg-amber-600 px-4 py-1.5 flex items-center justify-between text-black dark:text-white">
                         <div className="flex items-center space-x-2">
                            <Sparkles size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Preparation Required</span>
                         </div>
                         <a href={generateAdminPrepLink(booking)} target="_blank" rel="noreferrer" className="flex items-center space-x-1 bg-black/10 hover:bg-black/20 px-2 py-0.5 rounded text-[10px] font-black transition-colors">
                            <MessageCircle size={12} />
                            <span>Notify Admin</span>
                         </a>
                      </div>
                   )}

                   <div className="flex">
                      {/* Date Column */}
                      <div className={`w-20 shrink-0 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 p-3 ${status === 'UPCOMING' ? (needsPrep ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-purple-50 dark:bg-purple-900/20') : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                         <span className="text-[10px] font-black text-slate-400 tracking-tighter">{date.month}</span>
                         <span className={`text-2xl font-black leading-none my-1 ${status === 'UPCOMING' ? (needsPrep ? 'text-amber-600' : 'text-purple-600') : 'text-slate-600'} dark:text-white`}>{date.day}</span>
                         <span className="text-[10px] font-black text-slate-400 tracking-tighter">{date.year}</span>
                      </div>

                      {/* Info Column */}
                      <div className="flex-1 p-4">
                         <div className="flex justify-between items-start mb-1">
                            <div>
                               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{booking.hallType} HALL</span>
                               <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">{booking.flatNumber}</h3>
                            </div>
                            <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${status === 'UPCOMING' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                               {status}
                            </div>
                         </div>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">{booking.ownerName}</p>
                         
                         <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-black text-slate-800 dark:text-white">{formatCurrency(booking.amount)}</span>
                            <div className="flex items-center space-x-1">
                               <a href={generateWhatsAppReceipt(booking)} title="Share with Member" target="_blank" rel="noreferrer" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                  <Share2 size={16} />
                               </a>
                               <button onClick={() => startEdit(booking)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                               </button>
                               <button onClick={() => handleDelete(booking.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              );
            })
          )}
       </div>
    </div>
  );
};

export default HallBooking;
