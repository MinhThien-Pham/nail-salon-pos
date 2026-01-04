// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { verify } from 'node:crypto';

const api = {
    // Auth
    verifyPin: (pin: string) => ipcRenderer.invoke('auth:verify-pin', pin),
    verifyOwner: (pin: string) => ipcRenderer.invoke('auth:verify-owner', pin),
    verifyReceptionist: (pin: string) => ipcRenderer.invoke('auth:verify-receptionist', pin),
    // Staff
    getAllStaff: () => ipcRenderer.invoke('staff:get-all'),
    createStaff: (data: any) => ipcRenderer.invoke('staff:create', data),
    adminSetPin: (staffId: number, newPin: string) => ipcRenderer.invoke('staff:admin-set-pin', { staffId, newPin }),
    changeOwnPin: (staffId: number, oldPin: string, newPin: string) => ipcRenderer.invoke('auth:change-own-pin', { staffId, oldPin, newPin }),    
    updateStaff: (id: number, data: any) => ipcRenderer.invoke('staff:update', { id, data }),
    deleteStaff: (id: number) => ipcRenderer.invoke('staff:delete', id),
    // Settings
    getSettings: () => ipcRenderer.invoke('settings:get'),
    updateSettings: (data: any) => ipcRenderer.invoke('settings:update', data),
    // Promos
    getPromos: () => ipcRenderer.invoke('marketing:get-promos'),
    createPromo: (data: any) => ipcRenderer.invoke('marketing:create-promo', data),
    updatePromo: (id: number, data: any) => ipcRenderer.invoke('marketing:update-promo', { id, data }),
    deletePromo: (id: number) => ipcRenderer.invoke('marketing:delete-promo', id),
    // Redemptions
    getRedemptions: () => ipcRenderer.invoke('marketing:get-redemptions'),
    createRedemption: (data: any) => ipcRenderer.invoke('marketing:create-redemption', data),
    updateRedemption: (id: number, data: any) => ipcRenderer.invoke('marketing:update-redemption', { id, data }),
    deleteRedemption: (id: number) => ipcRenderer.invoke('marketing:delete-redemption', id),
};

contextBridge.exposeInMainWorld('api', api);