const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, data) => {
    let validChannels = [
      'track_switched',
      'track_playing',
      'track_progress',
      'lyrics_click',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
});
