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
    // Services
    getServiceTypes: () => ipcRenderer.invoke('services:get-types'),
    createServiceType: (name: string) => ipcRenderer.invoke('services:create-type', name),
    updateServiceType: (id: number, name: string) => ipcRenderer.invoke('services:update-type', { id, name }),
    deleteServiceType: (id: number) => ipcRenderer.invoke('services:delete-type', id),
    getAllServices: () => ipcRenderer.invoke('services:get-all'),
    createService: (data: any) => ipcRenderer.invoke('services:create', data),
    updateService: (id: number, data: any) => ipcRenderer.invoke('services:update', { id, data }),
    deleteService: (id: number) => ipcRenderer.invoke('services:delete', id),
    // Queue
    getQueueState: () => ipcRenderer.invoke('queue:get-state'),
    saveQueueState: (entries: any[]) => ipcRenderer.invoke('queue:save-state', entries),
    resetQueue: () => ipcRenderer.invoke('queue:reset'),
    addTechToQueue: (staffId: number, order: number) => ipcRenderer.invoke('queue:add-tech', { staffId, order }),
    removeTechFromQueue: (staffId: number) => ipcRenderer.invoke('queue:remove-tech', staffId),
    updateTechStatus: (staffId: number, status: string) => ipcRenderer.invoke('queue:update-status', { staffId, status }),
    bulkAddTechsToQueue: (staffIds: number[]) => ipcRenderer.invoke('queue:bulk-add', staffIds),
    getBusyTechs: () => ipcRenderer.invoke('queue:get-busy-techs'),
    // Customers
    getAllCustomers: () => ipcRenderer.invoke('customers:get-all'),
    searchCustomers: (query: string) => ipcRenderer.invoke('customers:search', query),
    getCustomerById: (id: number) => ipcRenderer.invoke('customers:get-by-id', id),
    getCustomerByPhone: (phone: string) => ipcRenderer.invoke('customers:get-by-phone', phone),
    createCustomer: (data: any) => ipcRenderer.invoke('customers:create', data),
    updateCustomer: (id: number, data: any) => ipcRenderer.invoke('customers:update', { id, data }),
    deleteCustomer: (id: number) => ipcRenderer.invoke('customers:delete', id),
    // Checkout Splits
    getAllCheckoutSplits: () => ipcRenderer.invoke('splits:get-all'),
    getCheckoutSplitById: (id: number) => ipcRenderer.invoke('splits:get-by-id', id),
    createCheckoutSplit: (items: any[], totalCents: number) => ipcRenderer.invoke('splits:create', { items, totalCents }),
    deleteCheckoutSplit: (id: number) => ipcRenderer.invoke('splits:delete', id),
    deleteAllCheckoutSplits: () => ipcRenderer.invoke('splits:delete-all'),
};

contextBridge.exposeInMainWorld('api', api);