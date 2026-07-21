const fs = require('fs');
const file = 'services/storageService.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `export const uploadCurrentDataToCloud = async (state: AppState): Promise<boolean> => {`;

const replacement = `export const recoverLegacyData = (): AppState | null => {
  const legacyKeys = [
      'ch_manager_data_stable_v1',
      'continental_heights_data_v11',
      'continental_heights_data_v10',
      'continental_heights_data_v9',
      'continental_heights_data_v8',
      'continental_heights_data_v7'
  ];
  let bestData = null;
  let maxTxs = -1;
  let bestKey = '';
  
  for (const key of legacyKeys) {
      const legacyData = localStorage.getItem(key);
      if (legacyData) {
          try {
              const legacyParsed = JSON.parse(legacyData);
              const txCount = legacyParsed.transactions ? legacyParsed.transactions.length : 0;
              if (txCount > maxTxs) {
                  maxTxs = txCount;
                  bestData = legacyParsed;
                  bestKey = key;
              }
          } catch(e) {}
      }
  }
  
  if (bestData && maxTxs > 1) {
      console.log(\`Manual recovery found \${maxTxs} txs in \${bestKey}\`);
      saveData(bestData);
      return bestData;
  }
  return null;
};

export const uploadCurrentDataToCloud = async (state: AppState): Promise<boolean> => {`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
