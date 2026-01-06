/// <reference types="vite/client" />
import { Staff, Settings } from "./shared/types";

// Because this file has an 'import', we must use 'declare global' 
// to make these variables visible to main.ts
declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
  const MAIN_WINDOW_VITE_NAME: string;

  // We also extend the Window interface here
  interface Window {
    api: IElectronAPI;
  }
}

export interface IElectronAPI {
  // Auth
  verifyPin: (pin: string) => Promise<Staff | undefined>;
  verifyOwner: (pin: string) => Promise<Staff | undefined>;
  verifyReceptionist: (pin: string) => Promise<Staff | undefined>;
  // Staff
  getAllStaff: () => Promise<Staff[]>;
  createStaff: (data: any) => Promise<number>;
  adminSetPin: (staffId: number, newPin: string) => Promise<void>;
  changeOwnPin: (staffId: number, oldPin: string, newPin: string) => Promise<boolean>;
  updateStaff: (id: number, data: any) => Promise<void>;
  deleteStaff: (id: number) => Promise<void>;
  // Settings
  getSettings: () => Promise<Settings>;
  updateSettings: (data: any) => Promise<void>;
  // Promos    
  getPromos: () => Promise<any[]>;
  createPromo: (data: any) => Promise<number>;
  updatePromo: (id: number, data: any) => Promise<void>;
  deletePromo: (id: number) => Promise<void>;
  // Redemptions
  getRedemptions: () => Promise<any[]>;
  createRedemption: (data: any) => Promise<number>;
  updateRedemption: (id: number, data: any) => Promise<void>;
  deleteRedemption: (id: number) => Promise<void>;
  // Services
getServiceTypes: () => Promise<ServiceType[]>;
  createServiceType: (name: string) => Promise<number>;
  updateServiceType: (id: number, name: string) => Promise<void>;
  deleteServiceType: (id: number) => Promise<void>;
  getAllServices: () => Promise<Service[]>;
  createService: (data: any) => Promise<number>;
  updateService: (id: number, data: any) => Promise<void>;
  deleteService: (id: number) => Promise<void>;
}