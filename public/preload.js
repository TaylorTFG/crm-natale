const { contextBridge } = require('electron');

// Esponi eventuali API qui se necessario
contextBridge.exposeInMainWorld('api', {
  // Funzioni API qui
});

console.log('Preload script caricato');