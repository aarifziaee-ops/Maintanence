const fs = require('fs');
let code = fs.readFileSync('components/Reports.tsx', 'utf-8');

const formatFunction = `
const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return \`\${d.getDate()}-\${d.getMonth() + 1}-\${d.getFullYear().toString().slice(2)}\`;
};
`;

code = code.replace(
  /const Reports: React\.FC<ReportsProps> = \(\{ state, view, refreshState, onEditTransaction \}\) => \{/,
  formatFunction + '\nconst Reports: React.FC<ReportsProps> = ({ state, view, refreshState, onEditTransaction }) => {'
);

code = code.replace(/\{formatDate\(t\.date\)\.split\(\',\', 1\)?\[0\]\}/g, '{formatShortDate(t.date)}');
code = code.replace(/\{formatDate\(t\.date\)\.split\(\',\', 1\)\[0\]\}/g, '{formatShortDate(t.date)}');
code = code.replace(/\{formatDate\(t\.date\)\.split\(\',\'\)\[0\]\}/g, '{formatShortDate(t.date)}');

fs.writeFileSync('components/Reports.tsx', code);
