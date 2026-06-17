const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lexoraAgent', {
  getState: () => ipcRenderer.invoke('agent:get-state'),
  updateSettings: (settings) => ipcRenderer.invoke('agent:update-settings', settings),
  login: (credentials) => ipcRenderer.invoke('agent:login', credentials),
  logout: () => ipcRenderer.invoke('agent:logout'),
  retrySync: () => ipcRenderer.invoke('agent:retry-sync'),
  openWebMeter: () => ipcRenderer.invoke('agent:open-web-meter'),
  openTool: (tool) => ipcRenderer.invoke('agent:open-tool', tool),
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('agent:state', listener);
    return () => ipcRenderer.removeListener('agent:state', listener);
  },
});
