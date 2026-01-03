// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { verify } from 'node:crypto';

const api = {
    verifyPin: (pin: string) => ipcRenderer.invoke('auth:verify-pin', pin),
    verifyOwner: (pin: string) => ipcRenderer.invoke('auth:verify-owner', pin),
    verifyReceptionist: (pin: string) => ipcRenderer.invoke('auth:verify-receptionist', pin),
    getAllStaff: () => ipcRenderer.invoke('staff:get-all'),
    createStaff: (data: any) => ipcRenderer.invoke('staff:create', data),
    getDefaultRates: () => ipcRenderer.invoke('settings:get-rates'),
};

contextBridge.exposeInMainWorld('api', api);