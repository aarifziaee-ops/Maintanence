async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/state');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const state = await response.json();
        
        console.log('First 5 flat IDs:');
        state.flats.slice(0, 5).forEach((f: any) => console.log(f.id));
    } catch (e) {
        console.error(e);
    }
}

run();
