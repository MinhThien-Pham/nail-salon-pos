// src/shared/types.ts

// --- Staff & Roles ---
export type Role = "OWNER" | "RECEPTIONIST" | "TECH";

export type Staff = {
    staffId: number;
    name: string;
    roles: Role[];
    pin: string;
    isActive: boolean;
    skillsTypeIds: string[]; // IDs of services they can perform
    payroll?: { 
        commissionTechRate?: number; // e.g. 0.6
        payoutCheckRate?: number;    // e.g. 0.7
    };
    createdAt: number;
    updatedAt: number;
};

// --- Settings ---
export type Settings = {
    id: number;
    defaultCommissionTechRate: number;
    defaultPayoutCheckRate: number;
};