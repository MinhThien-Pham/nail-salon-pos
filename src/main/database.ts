// src/main/database.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { Settings, Staff } from '../shared/types';

const todayISO = new Date().toISOString().split('T')[0];
export class AppDatabase {
    private db: Database.Database;

    constructor() {
        // Save DB in user data folder: C:\Users\Name\AppData\Roaming\nail-salon-pos\nail-pos.db
        const dbPath = path.join(app.getPath('userData'), 'nail-pos.db');
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        
        console.log('Connected to database at:', dbPath);
        this.init();
    }

    private init() {
        // 1. Staff Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS staff (
                staffId INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                roles TEXT NOT NULL, 
                pin TEXT NOT NULL,
                isActive INTEGER DEFAULT 1,
                skillsTypeIds TEXT DEFAULT '[]',
                commissionTechRate REAL,
                payoutCheckRate REAL,
                createdAt INTEGER,
                updatedAt INTEGER
            );
        `);

        // 2. Settings Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                defaultCommissionTechRate REAL,
                defaultPayoutCheckRate REAL,
                periodDays INTEGER,
                periodStartDate TEXT,
                loyaltyEarnConfig TEXT -- JSON: { mode, pointsPerDollarSpent, ... }
            );
        `);

        // 3. Promos Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS promos (
                promoId INTEGER PRIMARY KEY AUTOINCREMENT,
                isActive INTEGER DEFAULT 1,
                name TEXT NOT NULL,
                timeConfig TEXT NOT NULL,     -- JSON: { startISO, durationDays... }
                audience TEXT,                -- JSON: ["AT_RISK"] or null
                couponCode TEXT,
                minServiceCents INTEGER,
                rewardConfig TEXT NOT NULL    -- JSON: { type: "CREDIT", creditCents: ... }
            );
        `);

        // 4. Redemptions Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS redemptions (
                redemptionId INTEGER PRIMARY KEY AUTOINCREMENT,
                isActive INTEGER DEFAULT 1,
                name TEXT NOT NULL,
                audience TEXT,                -- JSON or null
                redeemPointsCost INTEGER,
                rewardConfig TEXT NOT NULL    -- JSON
            );
        `);

// --- SEED DEFAULT DATA ---

        // A. Default Settings
        const settings = this.db.prepare('SELECT * FROM settings WHERE id = 1').get();
        if (!settings) {
            console.log('Seeding Default Settings...');
            
            // Default: 1 point per dollar
            const defaultLoyalty = JSON.stringify({ mode: "PER_DOLLAR", pointsPerDollarSpent: 1 });
            
            this.db.prepare(`
                INSERT INTO settings (id, defaultCommissionTechRate, defaultPayoutCheckRate, periodDays, periodStartDate, loyaltyEarnConfig)
                VALUES (1, ?, ?, ?, ?, ?)
            `).run(
                0.6,
                0.7,
                14,
                todayISO,
                defaultLoyalty
            );
            
            // B. Default Promo ("We Miss You")
            this.db.prepare(`
                INSERT INTO promos (isActive, name, timeConfig, audience, couponCode, minServiceCents, rewardConfig)
                VALUES (1, ?, ?, ?, ?, ?, ?)
            `).run(
                'We Miss You - $15 Off',
                JSON.stringify({ startISO: todayISO, durationDays: 365 }),
                JSON.stringify(["AT_RISK"]),
                'COMEBACK20',
                4000,
                JSON.stringify({ type: "CREDIT", creditCents: 1500 }),
            );

            // C. Default Redemption ("Mini Treat")            
            this.db.prepare(`
                INSERT INTO redemptions (isActive, name, audience, redeemPointsCost, rewardConfig)
                VALUES (1,  ?, ?, ?, ?)
            `).run('The Mini Treat ($5 Off)', 
                null, 
                100,
                JSON.stringify({ type: "CREDIT", creditCents: 500 })
            );
        }

        // D. Default Hardcoded Owner
        const owner = this.db.prepare('SELECT * FROM staff WHERE staffId = 1').get();
        if (!owner) {
            console.log('Seeding Hardcoded Owner...');
            const now = Date.now();
            this.db.prepare(`
                INSERT INTO staff (staffId, name, roles, pin, commissionTechRate, payoutCheckRate, createdAt, updatedAt)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                'Owner', 
                JSON.stringify(['OWNER', 'TECH', 'RECEPTIONIST']), 
                '123456', 
                0.0, 0.0, now, now
            );
        }
    }

    // --- METHODS ---

    // 1. SETTINGS
    getSettings(): Settings {
        const row = this.db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
        if (!row) throw new Error("Settings not initialized");

        return {
            id: row.id,
            defaultCommissionTechRate: row.defaultCommissionTechRate,
            defaultPayoutCheckRate: row.defaultPayoutCheckRate,
            periodDays: row.periodDays,
            periodStartDate: row.periodStartDate,
            loyaltyEarn: JSON.parse(row.loyaltyEarnConfig)
        };
    }
    
    // --- SETTINGS ---
    updateSettings(newSettings: Partial<Settings>) {
        // 1. Get current settings to ensure we don't overwrite with nulls
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };

        this.db.prepare(`
            UPDATE settings 
            SET defaultCommissionTechRate = ?, 
                defaultPayoutCheckRate = ?,
                periodDays = ?,
                periodStartDayofWeek = ?,
                loyaltyEarnConfig = ?
            WHERE id = 1
        `).run(
            updated.defaultCommissionTechRate,
            updated.defaultPayoutCheckRate,
            updated.periodDays,
            updated.periodStartDate,
            JSON.stringify(updated.loyaltyEarn)
        );
    }

    // 2. STAFF
    verifyPin(pin: string): Staff | undefined {
        const user = this.db.prepare('SELECT * FROM staff WHERE pin = ? AND isActive = 1').get(pin) as any;
        if (!user) return undefined;
        return this.mapRowToStaff(user);
    }

    verifyOwnerPin(pin: string): Staff | undefined {
        const user = this.verifyStaffPin(1, pin);
        if (!user) return undefined;
        // Strictly ID 1 AND Owner role
        return user.roles.includes('OWNER') ? user : undefined;
    }

    verifyReceptionistPin(pin: string): Staff | undefined {
        const user = this.verifyPin(pin);
        if (!user) return undefined;
        return user.roles.includes('RECEPTIONIST') ? user : undefined;
    }

    verifyStaffPin(staffId: number, pin: string): Staff | undefined {
        const user = this.db.prepare('SELECT * FROM staff WHERE staffId = ? AND pin = ? AND isActive = 1').get(staffId, pin) as any;
        if (!user) return undefined;
        return this.mapRowToStaff(user);
    }

    updateStaffPin(staffId: number, newPin: string) {
        this.db.prepare('UPDATE staff SET pin = ?, updatedAt = ? WHERE staffId = ?')
               .run(newPin, Date.now(), staffId);
    }

    getAllStaff(): Staff[] {
        const rows = this.db.prepare('SELECT * FROM staff').all() as any[];
        return rows.map(this.mapRowToStaff);
    }

    createStaff(staff: Omit<Staff, 'staffId' | 'createdAt' | 'updatedAt'>): number {
        const stmt = this.db.prepare(`
            INSERT INTO staff (name, roles, pin, isActive, skillsTypeIds, commissionTechRate, payoutCheckRate, createdAt, updatedAt)
            VALUES (@name, @roles, @pin, @isActive, @skillsTypeIds, @commissionTechRate, @payoutCheckRate, @createdAt, @updatedAt)
        `);

        const info = stmt.run({
            name: staff.name,
            roles: JSON.stringify(staff.roles),
            pin: staff.pin,
            isActive: staff.isActive ? 1 : 0,
            skillsTypeIds: JSON.stringify(staff.skillsTypeIds),
            commissionTechRate: staff.payroll?.commissionTechRate || 0,
            payoutCheckRate: staff.payroll?.payoutCheckRate || 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        return info.lastInsertRowid as number;
    }

   updateStaff(staffId: number, staff: Partial<Staff>) {
        // Prevent updating the Owner's roles or ID (security check)
        if (staffId === 1) {
            // We only allow changing the Name or PIN for owner, not roles/status
            // But for simplicity in this MVP, let's just allow updates but ensure they don't lock themselves out.
            // A safer backend would check roles here.
        }

        const stmt = this.db.prepare(`
            UPDATE staff SET 
                name = COALESCE(@name, name),
                roles = COALESCE(@roles, roles),
                pin = COALESCE(@pin, pin),
                isActive = COALESCE(@isActive, isActive),
                skillsTypeIds = COALESCE(@skillsTypeIds, skillsTypeIds),
                commissionTechRate = COALESCE(@commissionTechRate, commissionTechRate),
                payoutCheckRate = COALESCE(@payoutCheckRate, payoutCheckRate),
                updatedAt = @updatedAt
            WHERE staffId = @staffId
        `);

        stmt.run({
            staffId,
            name: staff.name,
            roles: staff.roles ? JSON.stringify(staff.roles) : null,
            pin: staff.pin,
            isActive: staff.isActive === undefined ? null : (staff.isActive ? 1 : 0),
            skillsTypeIds: staff.skillsTypeIds ? JSON.stringify(staff.skillsTypeIds) : null,
            commissionTechRate: staff.payroll?.commissionTechRate,
            payoutCheckRate: staff.payroll?.payoutCheckRate,
            updatedAt: Date.now()
        });
    }

    deleteStaff(staffId: number) {
        if (staffId === 1) throw new Error("Cannot delete the Owner account.");
        this.db.prepare('DELETE FROM staff WHERE staffId = ?').run(staffId);
    }

    // --- HELPERS ---
    private mapRowToStaff(row: any): Staff {
        return {
            ...row,
            roles: JSON.parse(row.roles),
            skillsTypeIds: JSON.parse(row.skillsTypeIds),
            isActive: !!row.isActive,
            payroll: {
                commissionTechRate: row.commissionTechRate,
                payoutCheckRate: row.payoutCheckRate
            }
        };
    }

    // --- PROMOS ---
    getAllPromos() {
        const rows = this.db.prepare('SELECT * FROM promos').all() as any[];
        return rows.map(this.mapRowToPromo);
    }

    createPromo(promo: any): number {
        const stmt = this.db.prepare(`
            INSERT INTO promos (isActive, name, timeConfig, audience, couponCode, minServiceCents, rewardConfig)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const res = stmt.run(
            promo.isActive ? 1 : 0,
            promo.name,
            JSON.stringify(promo.time),
            JSON.stringify(promo.audience),
            promo.couponCode,
            promo.minServiceCents,
            JSON.stringify(promo.reward)
        );
        return res.lastInsertRowid as number;
    }

    updatePromo(promoId: number, promo: any) {
        const stmt = this.db.prepare(`
            UPDATE promos SET 
                isActive = ?, name = ?, timeConfig = ?, audience = ?, 
                couponCode = ?, minServiceCents = ?, rewardConfig = ?
            WHERE promoId = ?
        `);
        stmt.run(
            promo.isActive ? 1 : 0,
            promo.name,
            JSON.stringify(promo.time),
            JSON.stringify(promo.audience),
            promo.couponCode,
            promo.minServiceCents,
            JSON.stringify(promo.reward),
            promoId
        );
    }

    deletePromo(promoId: number) {
        this.db.prepare('DELETE FROM promos WHERE promoId = ?').run(promoId);
    }

    // --- REDEMPTIONS ---
    getAllRedemptions() {
        const rows = this.db.prepare('SELECT * FROM redemptions').all() as any[];
        return rows.map(this.mapRowToRedemption);
    }

    createRedemption(redemption: any): number {
        const stmt = this.db.prepare(`
            INSERT INTO redemptions (isActive, name, audience, redeemPointsCost, rewardConfig)
            VALUES (?, ?, ?, ?, ?)
        `);
        const res = stmt.run(
            redemption.isActive ? 1 : 0,
            redemption.name,
            JSON.stringify(redemption.audience),
            redemption.redeemPointsCost,
            JSON.stringify(redemption.reward)
        );
        return res.lastInsertRowid as number;
    }

    updateRedemption(redemptionId: number, r: any) {
        const stmt = this.db.prepare(`
            UPDATE redemptions SET 
                isActive = ?, name = ?, audience = ?, 
                redeemPointsCost = ?, rewardConfig = ?
            WHERE redemptionId = ?
        `);
        stmt.run(
            r.isActive ? 1 : 0,
            r.name,
            JSON.stringify(r.audience),
            r.redeemPointsCost,
            JSON.stringify(r.reward),
            redemptionId
        );
    }

    deleteRedemption(redemptionId: number) {
        this.db.prepare('DELETE FROM redemptions WHERE redemptionId = ?').run(redemptionId);
    }

    // --- HELPERS ---
    private mapRowToPromo(row: any) {
        return {
            promoId: row.promoId,
            isActive: !!row.isActive,
            name: row.name,
            time: JSON.parse(row.timeConfig),
            audience: JSON.parse(row.audience),
            couponCode: row.couponCode,
            minServiceCents: row.minServiceCents,
            reward: JSON.parse(row.rewardConfig)
        };
    }

    private mapRowToRedemption(row: any) {
        return {
            redemptionId: row.redemptionId,
            isActive: !!row.isActive,
            name: row.name,
            audience: JSON.parse(row.audience),
            redeemPointsCost: row.redeemPointsCost,
            reward: JSON.parse(row.rewardConfig)
        };
    }
}