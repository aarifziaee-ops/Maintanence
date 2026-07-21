const fs = require('fs');
const file = 'components/Settings.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `                   <button 
                        onClick={handleDisconnectCloud}
                        className="w-full text-xs text-red-500 hover:text-red-700 underline text-center"
                   >
                       Disconnect / Edit Configuration
                   </button>
               </div>
           )}
           
        </div>
      </section>`;

const replacement = `                   <button 
                        onClick={handleDisconnectCloud}
                        className="w-full text-xs text-red-500 hover:text-red-700 underline text-center"
                   >
                       Disconnect / Edit Configuration
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
                            }
                        } else {
                            alert("No richer legacy data found on this device.");
                        }
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 py-3 rounded-lg font-bold text-sm hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                    <History size={18} />
                    <span>Emergency: Recover Missing Data</span>
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">Use this if you lost data during recent updates</p>
           </div>
        </div>
      </section>`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
