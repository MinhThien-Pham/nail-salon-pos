// src/main/database.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { Staff } from '../shared/types';

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

        // 2. Settings Table (For your defaults)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                defaultCommissionTechRate REAL,
                defaultPayoutCheckRate REAL
            );
        `);

        // 3. Initialize Default Settings (0.6 and 0.7)
        const settings = this.db.prepare('SELECT * FROM settings WHERE id = 1').get();
        if (!settings) {
            this.db.prepare(`
                INSERT INTO settings (id, defaultCommissionTechRate, defaultPayoutCheckRate)
                VALUES (1, 0.6, 0.7)
            `).run();
        }

        // 4. Initialize HARDCODED OWNER (ID = 1)
        const owner = this.db.prepare('SELECT * FROM staff WHERE staffId = 1').get();
        if (!owner) {
            console.log('Creating Hardcoded Owner...');
            const now = Date.now();
            const ownerStmt = this.db.prepare(`
                INSERT INTO staff (staffId, name, roles, pin, commissionTechRate, payoutCheckRate, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            ownerStmt.run(
                1, 
                'Owner', 
                JSON.stringify(['OWNER', 'TECH', 'RECEPTIONIST']), 
                '123456', 
                0.0, 
                0.0, 
                now, 
                now
            );
        }
    }

    // --- METHODS ---

    verifyPin(pin: string): Staff | undefined {
        const user = this.db.prepare('SELECT * FROM staff WHERE pin = ? AND isActive = 1').get(pin) as any;
        if (!user) return undefined;
        return this.mapRowToStaff(user);
    }

    // Checks for strict Owner access (ID 1 or OWNER role)
    verifyOwnerPin(pin: string): Staff | undefined {
        const user = this.verifyPin(pin);
        if (!user) return undefined;
        const isOwner = user.staffId === 1 && user.roles.includes('OWNER');
        return isOwner ? user : undefined;
    }

    // Checks for Receptionist access
    verifyReceptionistPin(pin: string): Staff | undefined {
        const user = this.verifyPin(pin);
        if (!user) return undefined;
        const hasAccess = user.roles.includes('RECEPTIONIST');
        return hasAccess ? user : undefined;
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

    getDefaultRates() {
        return this.db.prepare('SELECT defaultCommissionTechRate, defaultPayoutCheckRate FROM settings WHERE id = 1').get();
    }

    // Helper to convert DB row (JSON strings) -> JS Object
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
}