// main.js

import { loadScript } from './utils.js';
import { setupTryOnViewer } from './setupViewer.js';

const url = new URL(window.location.href);
const webGiVersion = url.searchParams.get('webgi') || '0.9.14';
const ijVtoVersion = url.searchParams.get('vto') || (window.location.origin === 'https://releases.ijewel3d.com' ? window.location.pathname.split('/')[3] : '0.0.16');

// Load the main WebGi script and then ij_vto
loadScript(`https://dist.pixotronics.com/webgi/runtime/bundle-${webGiVersion}.js`)
    .then(() => {
        window.webgi = window; // Make webgi available globally as it needs to be on the window object
        return loadScript(`https://releases.ijewel3d.com/libs/web-vto/${ijVtoVersion}/ij_vto.js`);
    })
    .then(() => {
        setupTryOnViewer(); // Call setupTryOnViewer after all scripts are loaded
    })
    .catch((error) => {
        console.error('Error loading scripts or initializing viewer:', error);
    });

console.log('Loading webgi version', webGiVersion, 'and ijewel vto version', ijVtoVersion);
