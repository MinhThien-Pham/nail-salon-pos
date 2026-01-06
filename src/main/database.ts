// src/main/database.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { Settings, Staff, Promo, Reward, ServiceType, Service } from '../shared/types';

const todayISO = new Date().toISOString().split('T')[0];

// Helper to calculate end date (Today + 365 days)
const nextYearDate = new Date();
nextYearDate.setDate(nextYearDate.getDate() + 365);
const nextYearISO = nextYearDate.toISOString().split('T')[0];

export class AppDatabase {
    private db: Database.Database;

    constructor() {
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
                loyaltyEarnConfig TEXT
            );
        `);

        // 3. Promos Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS promos (
                promoId INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                isActive INTEGER DEFAULT 0, 
                triggerType TEXT NOT NULL,  -- 'MANUAL' or 'CUSTOMER_DATE_DRIVEN'
                customerDateKey TEXT,       -- 'dateOfBirthISO' or 'stats.firstVisitISO'
                
                -- Manual Dates
                startISO TEXT,
                endISO TEXT,
                
                -- Dynamic Window
                windowDaysBefore INTEGER DEFAULT 0,
                windowDaysAfter INTEGER DEFAULT 0,
                
                -- Reset Logic
                recurEveryDays INTEGER DEFAULT 0, 
                usageLimitPerCustomer INTEGER DEFAULT 1,
                
                -- Reward & Rules
                rewardType TEXT NOT NULL, 
                rewardValue INTEGER NOT NULL,      
                minServiceCents INTEGER DEFAULT 0,
                couponCode TEXT,
                
                -- Audience
                audienceTiers TEXT,       -- JSON
                audienceStages TEXT       -- JSON
            );
        `);

        // 4. Redemptions Table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS redemptions (
                redemptionId INTEGER PRIMARY KEY AUTOINCREMENT,
                isActive INTEGER DEFAULT 1,
                name TEXT NOT NULL,
                audience TEXT,
                redeemPointsCost INTEGER,
                rewardConfig TEXT NOT NULL
            );
        `);

        // 5. Service Types
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS service_types (
                serviceTypeId INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                createdAt INTEGER,
                updatedAt INTEGER
            );
        `);

        // 6. Services
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS services (
                serviceId INTEGER PRIMARY KEY AUTOINCREMENT,
                typeId INTEGER NOT NULL,
                name TEXT NOT NULL,
                priceCents INTEGER DEFAULT 0,
                durationMin INTEGER DEFAULT 0,
                createdAt INTEGER,
                updatedAt INTEGER,
                FOREIGN KEY (typeId) REFERENCES service_types(serviceTypeId) ON DELETE CASCADE
            );
        `);

        this.seedData();
        this.cleanupExpiredPromos();
    }

    private cleanupExpiredPromos() {
        const today = new Date().toISOString().split('T')[0];
        
        const stmt = this.db.prepare(`
            UPDATE promos 
            SET isActive = 0 
            WHERE isActive = 1 
              AND recurEveryDays = 0 
              AND triggerType = 'MANUAL' 
              AND endISO < ?
        `);
        
        const info = stmt.run(today);
        if (info.changes > 0) {
            console.log(`[Startup] Auto-Archived ${info.changes} expired promotions.`);
        }
    }

    private seedData() {
        // A. Seed Default Settings
        const settings = this.db.prepare('SELECT * FROM settings WHERE id = 1').get();
        if (!settings) {
            const defaultLoyalty = JSON.stringify({ mode: "PER_DOLLAR", pointsPerDollarSpent: 1 });
            this.db.prepare(`
                INSERT INTO settings (id, defaultCommissionTechRate, defaultPayoutCheckRate, periodDays, periodStartDate, loyaltyEarnConfig)
                VALUES (1, 0.6, 0.7, 14, ?, ?)
            `).run(todayISO, defaultLoyalty);
        }

        // B. Seed "Immortal" Promos (ID 1 & 2)
        this.db.prepare(`
            INSERT OR IGNORE INTO promos (
                promoId, name, isActive, triggerType, customerDateKey, 
                recurEveryDays, windowDaysBefore, windowDaysAfter, 
                rewardType, rewardValue, usageLimitPerCustomer
            )
            VALUES 
            (1, 'Birthday Special', 0, 'CUSTOMER_DATE_DRIVEN', 'dateOfBirthISO', 365, 7, 7, 'PERCENT', 15, 1),
            (2, 'Customer Anniversary', 0, 'CUSTOMER_DATE_DRIVEN', 'stats.firstVisitISO', 365, 7, 7, 'CREDIT', 1000, 1)
        `).run();

        // C. Seed "We Miss You" (ID 3)
        this.db.prepare(`
            INSERT OR IGNORE INTO promos (
                promoId, name, isActive, triggerType, 
                startISO, endISO,
                recurEveryDays, usageLimitPerCustomer, 
                rewardType, rewardValue, minServiceCents, couponCode,
                audienceStages
            )
            VALUES (
                3, 'We Miss You - $15 Off', 0, 'MANUAL',
                ?, ?,
                0, 1,
                'CREDIT', 1500, 4000, 'COMEBACK20',
                ?
            )
        `).run(
            todayISO, 
            nextYearISO,
            JSON.stringify(["AT_RISK"])
        );

        // D. Seed "The Mini Treat" Redemption
        const redemption = this.db.prepare('SELECT * FROM redemptions WHERE name = ?').get('The Mini Treat ($5 Off)');
        if (!redemption) {
            this.db.prepare(`
                INSERT INTO redemptions (isActive, name, audience, redeemPointsCost, rewardConfig)
                VALUES (0, ?, ?, ?, ?)
            `).run(
                'The Mini Treat ($5 Off)', 
                null, 
                100,
                JSON.stringify({ type: "CREDIT", creditCents: 500 })
            );
        }

        // E. Seed Owner
        const owner = this.db.prepare('SELECT * FROM staff WHERE staffId = 1').get();
        if (!owner) {
            const now = Date.now();
            this.db.prepare(`
                INSERT INTO staff (staffId, name, roles, pin, commissionTechRate, payoutCheckRate, createdAt, updatedAt)
                VALUES (1, 'Owner', ?, '123456', 0.0, 0.0, ?, ?)
            `).run(JSON.stringify(['OWNER', 'TECH', 'RECEPTIONIST']), now, now);
        }
    }

    // --- PROMOS ---

    getAllPromos(): Promo[] {
        this.cleanupExpiredPromos();
        const rows = this.db.prepare('SELECT * FROM promos').all() as any[];
        return rows.map(this.mapRowToPromo);
    }

    createPromo(data: Promo): number {
        const stmt = this.db.prepare(`
            INSERT INTO promos (
                name, isActive, triggerType, customerDateKey, 
                startISO, endISO, windowDaysBefore, windowDaysAfter,
                recurEveryDays, usageLimitPerCustomer, 
                rewardType, rewardValue, minServiceCents, couponCode,
                audienceTiers, audienceStages
            )
            VALUES (
                @name, @isActive, @triggerType, @customerDateKey,
                @startISO, @endISO, @windowDaysBefore, @windowDaysAfter,
                @recurEveryDays, @usageLimitPerCustomer,
                @rewardType, @rewardValue, @minServiceCents, @couponCode,
                @audienceTiers, @audienceStages
            )
        `);

        const rewardType = data.reward.type;
        const rewardValue = data.reward.type === 'CREDIT' ? data.reward.creditCents : data.reward.percentOffService;

        const info = stmt.run({
            name: data.name,
            isActive: data.isActive ? 1 : 0,
            triggerType: data.triggerType || 'MANUAL',
            customerDateKey: data.customerDateKey || null,
            startISO: data.startISO || null,
            endISO: data.endISO || null,
            windowDaysBefore: data.windowDaysBefore || 0,
            windowDaysAfter: data.windowDaysAfter || 0,
            recurEveryDays: data.recurEveryDays || 0,
            usageLimitPerCustomer: data.usageLimitPerCustomer || 1,
            rewardType,
            rewardValue,
            minServiceCents: data.minServiceCents || 0,
            couponCode: data.couponCode || null,
            audienceTiers: data.audience?.tiers ? JSON.stringify(data.audience.tiers) : null,
            audienceStages: data.audience?.stages ? JSON.stringify(data.audience.stages) : null
        });

        return info.lastInsertRowid as number;
    }

    updatePromo(promoId: number, data: Promo) {
        if (promoId === 1 || promoId === 2) {
            const rewardType = data.reward.type;
            const rewardValue = data.reward.type === 'CREDIT' ? data.reward.creditCents : data.reward.percentOffService;

            const stmt = this.db.prepare(`
                UPDATE promos 
                SET name = ?, isActive = ?, 
                    rewardType = ?, rewardValue = ?, 
                    windowDaysBefore = ?, windowDaysAfter = ?, 
                    minServiceCents = ?
                WHERE promoId = ?
            `);
            
            return stmt.run(
                data.name,
                data.isActive ? 1 : 0,
                rewardType,
                rewardValue,
                data.windowDaysBefore,
                data.windowDaysAfter,
                data.minServiceCents,
                promoId
            );
        }

        const stmt = this.db.prepare(`
            UPDATE promos SET 
                name = @name, isActive = @isActive, triggerType = @triggerType,
                startISO = @startISO, endISO = @endISO,
                recurEveryDays = @recurEveryDays, usageLimitPerCustomer = @usageLimitPerCustomer,
                rewardType = @rewardType, rewardValue = @rewardValue, minServiceCents = @minServiceCents,
                couponCode = @couponCode, audienceTiers = @audienceTiers, audienceStages = @audienceStages
            WHERE promoId = @promoId
        `);

        const rewardType = data.reward.type;
        const rewardValue = data.reward.type === 'CREDIT' ? data.reward.creditCents : data.reward.percentOffService;

        stmt.run({
            promoId,
            name: data.name,
            isActive: data.isActive ? 1 : 0,
            triggerType: data.triggerType,
            startISO: data.startISO || null,
            endISO: data.endISO || null,
            recurEveryDays: data.recurEveryDays,
            usageLimitPerCustomer: data.usageLimitPerCustomer,
            rewardType,
            rewardValue,
            minServiceCents: data.minServiceCents,
            couponCode: data.couponCode || null,
            audienceTiers: data.audience?.tiers ? JSON.stringify(data.audience.tiers) : null,
            audienceStages: data.audience?.stages ? JSON.stringify(data.audience.stages) : null
        });
    }

    deletePromo(promoId: number) {
        if (promoId === 1 || promoId === 2) {
            throw new Error("Cannot delete System Promos (Birthday/Anniversary). Disable them instead.");
        }
        this.db.prepare('DELETE FROM promos WHERE promoId = ?').run(promoId);
    }

    // --- MAPPERS ---
    private mapRowToPromo(row: any): Promo {
        const reward: Reward = row.rewardType === 'CREDIT' 
            ? { type: 'CREDIT', creditCents: row.rewardValue }
            : { type: 'PERCENT', percentOffService: row.rewardValue };

        return {
            promoId: row.promoId,
            name: row.name,
            isActive: !!row.isActive,
            triggerType: row.triggerType as any,
            customerDateKey: row.customerDateKey,
            startISO: row.startISO,
            endISO: row.endISO,
            windowDaysBefore: row.windowDaysBefore,
            windowDaysAfter: row.windowDaysAfter,
            recurEveryDays: row.recurEveryDays,
            usageLimitPerCustomer: row.usageLimitPerCustomer,
            reward,
            minServiceCents: row.minServiceCents,
            couponCode: row.couponCode,
            audience: {
                tiers: row.audienceTiers ? JSON.parse(row.audienceTiers) : null,
                stages: row.audienceStages ? JSON.parse(row.audienceStages) : null
            }
        };
    }

    // --- STAFF ---
    getAllStaff(): Staff[] {
        const rows = this.db.prepare('SELECT * FROM staff').all() as any[];
        return rows.map(this.mapRowToStaff);
    }

    createStaff(staff: any): number { 
         const stmt = this.db.prepare(`
            INSERT INTO staff (name, roles, pin, isActive, skillsTypeIds, commissionTechRate, payoutCheckRate, createdAt, updatedAt)
            VALUES (@name, @roles, @pin, @isActive, @skillsTypeIds, @commissionTechRate, @payoutCheckRate, @createdAt, @updatedAt)
        `);
        return stmt.run({
            name: staff.name,
            roles: JSON.stringify(staff.roles),
            pin: staff.pin,
            isActive: staff.isActive ? 1 : 0,
            skillsTypeIds: JSON.stringify(staff.skillsTypeIds || []),
            commissionTechRate: staff.payroll?.commissionTechRate || 0,
            payoutCheckRate: staff.payroll?.payoutCheckRate || 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }).lastInsertRowid as number;
    }

    updateStaff(id: number, staff: any) { 
        const stmt = this.db.prepare(`
            UPDATE staff SET 
                name = COALESCE(@name, name), 
                roles = COALESCE(@roles, roles), 
                isActive = COALESCE(@isActive, isActive), 
                skillsTypeIds = COALESCE(@skillsTypeIds, skillsTypeIds), 
                commissionTechRate = COALESCE(@commissionTechRate, commissionTechRate), 
                payoutCheckRate = COALESCE(@payoutCheckRate, payoutCheckRate), 
                updatedAt = @updatedAt 
            WHERE staffId = @staffId
        `);
        
        stmt.run({ 
            ...staff, 
            roles: staff.roles ? JSON.stringify(staff.roles) : null, 
            isActive: staff.isActive === undefined ? null : (staff.isActive ? 1 : 0), 
            // FIX: Handle array to string conversion carefully
            skillsTypeIds: staff.skillsTypeIds ? JSON.stringify(staff.skillsTypeIds) : null, 
            commissionTechRate: staff.payroll?.commissionTechRate, 
            payoutCheckRate: staff.payroll?.payoutCheckRate, 
            updatedAt: Date.now(), 
            staffId: id 
        });
    }

    deleteStaff(id: number) { 
        if (id === 1) throw new Error("Cannot delete Owner"); 
        this.db.prepare('DELETE FROM staff WHERE staffId = ?').run(id); 
    }
    
    // Auth
    verifyPin(pin: string): Staff | undefined { const u = this.db.prepare('SELECT * FROM staff WHERE pin = ? AND isActive = 1').get(pin); return u ? this.mapRowToStaff(u) : undefined; }
    verifyOwnerPin(pin: string): Staff | undefined { const u = this.verifyStaffPin(1, pin); return (u && u.roles.includes('OWNER')) ? u : undefined; }
    verifyReceptionistPin(pin: string): Staff | undefined { const u = this.verifyPin(pin); return (u && u.roles.includes('RECEPTIONIST')) ? u : undefined; }
    verifyStaffPin(id: number, pin: string): Staff | undefined { const u = this.db.prepare('SELECT * FROM staff WHERE staffId = ? AND pin = ? AND isActive = 1').get(id, pin); return u ? this.mapRowToStaff(u) : undefined; }
    updateStaffPin(id: number, pin: string) { this.db.prepare('UPDATE staff SET pin = ?, updatedAt = ? WHERE staffId = ?').run(pin, Date.now(), id); }

    // --- REDEMPTIONS ---
    getAllRedemptions() { const rows = this.db.prepare('SELECT * FROM redemptions').all() as any[]; return rows.map(this.mapRowToRedemption); }
    createRedemption(r: any): number { 
        const stmt = this.db.prepare(`INSERT INTO redemptions (isActive, name, audience, redeemPointsCost, rewardConfig) VALUES (?, ?, ?, ?, ?)`);
        return stmt.run(r.isActive?1:0, r.name, JSON.stringify(r.audience), r.redeemPointsCost, JSON.stringify(r.reward)).lastInsertRowid as number;
    }
    updateRedemption(id: number, r: any) {
        const stmt = this.db.prepare(`UPDATE redemptions SET isActive = ?, name = ?, audience = ?, redeemPointsCost = ?, rewardConfig = ? WHERE redemptionId = ?`);
        stmt.run(r.isActive?1:0, r.name, JSON.stringify(r.audience), r.redeemPointsCost, JSON.stringify(r.reward), id);
    }
    deleteRedemption(id: number) { this.db.prepare('DELETE FROM redemptions WHERE redemptionId = ?').run(id); }
    
    // --- SETTINGS ---
    getSettings(): Settings { const row = this.db.prepare('SELECT * FROM settings WHERE id = 1').get() as any; return { id: row.id, defaultCommissionTechRate: row.defaultCommissionTechRate, defaultPayoutCheckRate: row.defaultPayoutCheckRate, periodDays: row.periodDays, periodStartDate: row.periodStartDate, loyaltyEarn: JSON.parse(row.loyaltyEarnConfig) }; }
    updateSettings(s: any) { 
        const cur = this.getSettings();
        const up = { ...cur, ...s };
        this.db.prepare(`UPDATE settings SET defaultCommissionTechRate = ?, defaultPayoutCheckRate = ?, periodDays = ?, periodStartDate = ?, loyaltyEarnConfig = ? WHERE id = 1`).run(up.defaultCommissionTechRate, up.defaultPayoutCheckRate, up.periodDays, up.periodStartDate, JSON.stringify(up.loyaltyEarn));
    }

    private mapRowToStaff(row: any): Staff { 
        let skills: number[] = [];
        // FIX: Robust JSON parsing for skills
        try {
            if (row.skillsTypeIds) {
                skills = JSON.parse(row.skillsTypeIds);
                if (!Array.isArray(skills)) skills = [];
            }
        } catch (e) {
            skills = [];
        }

        return { 
            ...row, 
            roles: JSON.parse(row.roles), 
            skillsTypeIds: skills, 
            isActive: !!row.isActive, 
            payroll: { 
                commissionTechRate: row.commissionTechRate, 
                payoutCheckRate: row.payoutCheckRate 
            } 
        }; 
    }
    private mapRowToRedemption(row: any) { return { redemptionId: row.redemptionId, isActive: !!row.isActive, name: row.name, audience: JSON.parse(row.audience), redeemPointsCost: row.redeemPointsCost, reward: JSON.parse(row.rewardConfig) }; }

    // --- SERVICE TYPES ---
    getAllServiceTypes(): ServiceType[] {
        return this.db.prepare('SELECT * FROM service_types ORDER BY name ASC').all() as ServiceType[];
    }

    createServiceType(name: string): number {
        const stmt = this.db.prepare('INSERT INTO service_types (name, createdAt, updatedAt) VALUES (?, ?, ?)');
        const now = Date.now();
        return stmt.run(name, now, now).lastInsertRowid as number;
    }

    updateServiceType(id: number, name: string) {
        this.db.prepare('UPDATE service_types SET name = ?, updatedAt = ? WHERE serviceTypeId = ?')
            .run(name, Date.now(), id);
    }

    deleteServiceType(id: number) {
        this.db.prepare('DELETE FROM service_types WHERE serviceTypeId = ?').run(id);
    }

    // --- SERVICES ---
    getAllServices(): Service[] {
        return this.db.prepare('SELECT * FROM services ORDER BY name ASC').all() as Service[];
    }

    createService(s: any): number {
        const stmt = this.db.prepare(`
            INSERT INTO services (typeId, name, priceCents, durationMin, createdAt, updatedAt)
            VALUES (@typeId, @name, @priceCents, @durationMin, @createdAt, @updatedAt)
        `);
        const now = Date.now();
        return stmt.run({ ...s, createdAt: now, updatedAt: now }).lastInsertRowid as number;
    }

    updateService(id: number, data: any) {
        const stmt = this.db.prepare(`
            UPDATE services SET 
                name = @name, 
                priceCents = @priceCents, 
                durationMin = @durationMin, 
                updatedAt = @updatedAt 
            WHERE serviceId = @serviceId
        `);
        stmt.run({ 
            ...data, 
            serviceId: id, 
            updatedAt: Date.now() 
        });
    }

    deleteService(id: number) {
        this.db.prepare('DELETE FROM services WHERE serviceId = ?').run(id);
    }
}