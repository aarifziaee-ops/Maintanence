const fs = require('fs');
const file = 'components/Settings.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `                   <button 
                       onClick={handleDisconnectCloud}
                       className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 py-3 rounded-lg font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                   >
                       <Lock size={18} />
                       <span>Disconnect Firebase</span>
                   </button>
               </div>
           )}
        </div>`;

const replacement = `                   <button 
                       onClick={handleDisconnectCloud}
                       className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 py-3 rounded-lg font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                   >
                       <Lock size={18} />
                       <span>Disconnect Firebase</span>
                   </button>
               </div>
           )}
           
           <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => {
                        const legacyData = recoverLegacyData();
                        if (legacyData) {
                            if (window.confirm("Found legacy data with more records. Overwrite current state and sync to cloud?")) {
                                refreshState(legacyData);
                                setStatus({ type: 'success', message: 'Legacy data recovered successfully!' });
                            }
                        } else {
                            setStatus({ type: 'error', message: 'No richer legacy data found on this device.' });
                        }
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 py-3 rounded-lg font-bold text-sm hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                    <History size={18} />
                    <span>Emergency: Recover Missing Data</span>
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">Use this if you lost data during recent updates</p>
           </div>
        </div>`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
