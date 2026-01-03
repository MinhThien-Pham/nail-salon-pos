// src/main/ipcHandlers.ts
import { ipcMain } from 'electron';
import { AppDatabase } from './database';

export default function setUpHandlers(db: AppDatabase) {
    // 1. Auth Handlers
    ipcMain.handle('auth:verify-pin', (_, pin) => {
        return db.verifyPin(pin);
    });

    ipcMain.handle('auth:verify-owner', (_, pin) => {
        return db.verifyOwnerPin(pin);
    });

    ipcMain.handle('auth:verify-receptionist', (_, pin) => {
        return db.verifyReceptionistPin(pin);
    });
    
    // 2. Staff Handlers
    ipcMain.handle('staff:get-all', () => {
        return db.getAllStaff();
    });

    ipcMain.handle('staff:create', (_, data) => {
        return db.createStaff(data);
    });

    // 3. Settings Handlers
    ipcMain.handle('settings:get-rates', () => {
        return db.getDefaultRates();
    });
}