const fs = require('fs');
const execSync = require('child_process').execSync;

const searches = [
  "initializeApp\\(",
  "getFirestore\\(",
  "collection\\(",
  "doc\\(",
  "getDoc\\(",
  "getDocs\\(",
  "onSnapshot\\(",
  "firebaseConfig",
  "projectId",
  "apiKey"
];

let report = "Firestore Usage Report\n======================\n\n";

for (const search of searches) {
  report += `\nSearch: ${search.replace('\\', '')}\n----------------------\n`;
  try {
    const output = execSync(`grep -rnE "${search}" components/ services/ App.tsx`).toString();
    
    // Process output to format it nicely
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line) {
         // Typical grep -rn format: filename:line:content
         const parts = line.split(':');
         if (parts.length >= 3) {
           const filename = parts[0];
           const lineNum = parts[1];
           const content = parts.slice(2).join(':').trim();
           report += `Filename: ${filename} | Line: ${lineNum} | Code: ${content}\n`;
         } else {
           report += line + "\n";
         }
      }
    }
  } catch (e) {
    report += "No matches found.\n";
  }
}

// Add a section for analyzing the 400 Bad Request
report += `
Analysis of Firestore Listen 400 Bad Request
--------------------------------------------
The error "GET https://firestore.googleapis.com/.../Listen... 400 (Bad Request)" typically occurs when the Firestore SDK attempts to establish a real-time listener (e.g., via \`onSnapshot\`), but the configuration (like \`projectId\` or \`apiKey\`) is invalid, empty, or contains hidden characters like whitespaces/newlines.

However, based on the codebase search, there is NO usage of \`onSnapshot\`. The only Firestore methods used are \`setDoc\` and \`getDoc\`. 

Why would a Listen request happen?
1. The Firebase JS SDK (especially older versions or specific configurations) might automatically fall back to polling or attempt a stream connection even for \`getDoc\` operations if it tries to sync state. 
2. A third-party dependency could be making the call.
3. If \`projectId\` is an empty string, the URL becomes malformed: \`/v1/projects//databases...\` which can trigger a 400 Bad Request from Google APIs, and it might be logged generically as a Listen failure in some network consoles.

Suspicious Code:
Filename: components/Settings.tsx
Line 92-101:
\`\`\`typescript
    const config = {
        apiKey,
        projectId,
        authDomain: authDomain || \`\${projectId}.firebaseapp.com\`
    };
\`\`\`
If \`apiKey\` or \`projectId\` contain trailing whitespaces or are empty when this object is constructed, it will create a malformed config. The previous patch script missed this block because it spanned multiple lines.

Filename: services/firebaseService.ts
Line 36-41:
\`\`\`typescript
    const cleanConfig = {
      ...config,
      apiKey: config.apiKey.trim(),
      projectId: config.projectId.trim(),
      authDomain: config.authDomain ? config.authDomain.trim() : \`\${config.projectId.trim()}.firebaseapp.com\`
    };
    app = initializeApp(cleanConfig);
\`\`\`
This was recently patched to trim whitespace, but if a previously initialized app exists, it skips this:
\`\`\`typescript
    // Check if already initialized
    if (getApps().length > 0) { 
       app = getApps()[0];
       if (!db) db = getFirestore(app);
       return true;
    }
\`\`\`
If the app was initialized with a bad config previously, it will reuse the bad config. 
`;

fs.writeFileSync("report.txt", report);
