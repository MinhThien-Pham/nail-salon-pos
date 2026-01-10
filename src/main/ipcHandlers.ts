// src/main/ipcHandlers.ts
import { ipcMain } from 'electron';
import { AppDatabase } from './database';

export default function setUpHandlers(db: AppDatabase) {
    // 1. Auth Handlers
    ipcMain.handle('auth:verify-pin', (_, pin) => { return db.verifyPin(pin); });
    ipcMain.handle('auth:verify-owner', (_, pin) => { return db.verifyOwnerPin(pin); });
    ipcMain.handle('auth:verify-receptionist', (_, pin) => { return db.verifyReceptionistPin(pin); });
    // 2. Staff Handlers
    ipcMain.handle('staff:get-all', () => { return db.getAllStaff(); });
    ipcMain.handle('staff:create', (_, data) => { return db.createStaff(data); });
    ipcMain.handle('staff:update', (_, { id, data }) => db.updateStaff(id, data));
    ipcMain.handle('staff:delete', (_, id) => db.deleteStaff(id));
    ipcMain.handle('staff:admin-set-pin', (_, { staffId, newPin }) => { return db.updateStaffPin(staffId, newPin); });
    ipcMain.handle('auth:change-own-pin', (_, { staffId, oldPin, newPin }) => {
        const user = db.verifyStaffPin(staffId, oldPin);// Verify Old PIN first
        if (!user) throw new Error("Invalid PIN.");     // Frontend catches this
        db.updateStaffPin(staffId, newPin);             // Update to New PIN
        return true;
    });
    // 3. Settings Handlers
    ipcMain.handle('settings:get', () => { return db.getSettings(); });
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
    // 6. Services
    ipcMain.handle('services:get-types', () => db.getAllServiceTypes());
    ipcMain.handle('services:create-type', (_, name) => db.createServiceType(name));
    ipcMain.handle('services:update-type', (_, { id, name }) => db.updateServiceType(id, name));
    ipcMain.handle('services:delete-type', (_, id) => db.deleteServiceType(id));
    ipcMain.handle('services:get-all', () => db.getAllServices());
    ipcMain.handle('services:create', (_, data) => db.createService(data));
    ipcMain.handle('services:update', (_, { id, data }) => db.updateService(id, data));
    ipcMain.handle('services:delete', (_, id) => db.deleteService(id));
    // 7. Queue
    ipcMain.handle('queue:get-state', () => db.getQueueState());
    ipcMain.handle('queue:save-state', (_, entries) => db.saveQueueState(entries));
    ipcMain.handle('queue:reset', () => db.resetQueue());
    ipcMain.handle('queue:add-tech', (_, { staffId, order }) => db.addTechToQueue(staffId, order));
    ipcMain.handle('queue:remove-tech', (_, staffId) => db.removeTechFromQueue(staffId));
    ipcMain.handle('queue:update-status', (_, { staffId, status }) => db.updateTechStatus(staffId, status));
    ipcMain.handle('queue:bulk-add', (_, staffIds) => db.bulkAddTechsToQueue(staffIds));
    ipcMain.handle('queue:get-busy-techs', () => db.getBusyTechs());
    // 8. Customers
    ipcMain.handle('customers:get-all', () => db.getAllCustomers());
    ipcMain.handle('customers:search', (_, query) => db.searchCustomers(query));
    ipcMain.handle('customers:get-by-id', (_, id) => db.getCustomerById(id));
    ipcMain.handle('customers:get-by-phone', (_, phone) => db.getCustomerByPhone(phone));
    ipcMain.handle('customers:create', (_, data) => db.createCustomer(data));
    ipcMain.handle('customers:update', (_, { id, data }) => db.updateCustomer(id, data));
    ipcMain.handle('customers:delete', (_, id) => db.deleteCustomer(id));
    // 9. Checkout Splits
    ipcMain.handle('splits:get-all', () => db.getAllCheckoutSplits());
    ipcMain.handle('splits:get-by-id', (_, id) => db.getCheckoutSplitById(id));
    ipcMain.handle('splits:create', (_, { items, totalCents }) => db.createCheckoutSplit(items, totalCents));
    ipcMain.handle('splits:delete', (_, id) => db.deleteCheckoutSplit(id));
    ipcMain.handle('splits:delete-all', () => db.deleteAllCheckoutSplits());
}