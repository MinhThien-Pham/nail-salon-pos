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
  verifyPin: (pin: string) => Promise<Staff | undefined>;
  verifyOwner: (pin: string) => Promise<Staff | undefined>;
  verifyReceptionist: (pin: string) => Promise<Staff | undefined>;
  getAllStaff: () => Promise<Staff[]>;
  createStaff: (data: any) => Promise<number>;
  getDefaultRates: () => Promise<Settings>;
}