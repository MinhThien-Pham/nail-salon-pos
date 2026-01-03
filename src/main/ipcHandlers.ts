// src/main/ipcHandlers.ts
import { ipcMain } from 'electron';
import { AppDatabase } from './database';

export default function setUpHandlers(db: AppDatabase) {
    // 1. Auth Handlers
    ipcMain.handle('auth:verify-pin', (_, pin) => {return db.verifyPin(pin);});
    ipcMain.handle('auth:verify-owner', (_, pin) => {return db.verifyOwnerPin(pin);});
    ipcMain.handle('auth:verify-receptionist', (_, pin) => {return db.verifyReceptionistPin(pin);});
    // 2. Staff Handlers
    ipcMain.handle('staff:get-all', () => {return db.getAllStaff();});
    ipcMain.handle('staff:create', (_, data) => {return db.createStaff(data);});
    // 3. Settings Handlers
    ipcMain.handle('settings:get', () => {return db.getSettings();});
    ipcMain.handle('settings:update', (_, data) => db.updateSettings(data));
    // 4. Promos
    ipcMain.handle('marketing:get-promos', () => db.getAllPromos());
    ipcMain.handle('marketing:create-promo', (_, data) => db.createPromo(data));
    ipcMain.handle('marketing:update-promo', (_, { id, data }) => db.updatePromo(id, data));
    ipcMain.handle('marketing:delete-promo', (_, id) => db.deletePromo(id));
    // 5. Redemptions
    ipcMain.handle('marketing:get-redemptions', () => db.getAllRedemptions());
    ipcMain.handle('marketing:create-redemption', (_, data) => db.createRedemption(data));
    ipcMain.handle('marketing:update-redemption', (_, { id, data }) => db.updateRedemption(id, data));
    ipcMain.handle('marketing:delete-redemption', (_, id) => db.deleteRedemption(id));
}