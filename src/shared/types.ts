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
        commissionTechRate?: number; // default 0.6
        payoutCheckRate?: number;    // default 0.7
    };
    createdAt: number;
    updatedAt: number;
};

// -------- Loyalty earn modes (owner must choose ONE) --------
export type LoyaltyEarn =
  | { mode: "PER_DOLLAR"; pointsPerDollarSpent: number; }
  | { mode: "PER_VISIT"; pointsPerVisit: number; minServiceCentsToCount: number; };

// -------- Reward types --------
export type Reward =
  | { type: "CREDIT"; creditCents: number; }            // $ off service (cents)
  | { type: "PERCENT"; percentOffService: number; };    // % off service (0-100)

// -------- Audience Targeting  --------
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type LifecycleStage = 'NEW' | 'ACTIVE' | 'AT_RISK' | 'CHURNED';

export type Audience = {
    tiers: LoyaltyTier[] | null;
    stages: LifecycleStage[] | null;
} | null; // null means ALL customers

// --- Promos (New Schema) ---
export type TriggerType = 'MANUAL' | 'CUSTOMER_DATE_DRIVEN';

// -------- Promos --------
export type Promo = {
  promoId: number;
  name: string;
  isActive: boolean;
  
  triggerType: TriggerType;
  customerDateKey?: string; // e.g., 'dateOfBirthISO' or 'stats.firstVisitISO'
  
  // Manual Date Logic
  startISO?: string;       
  endISO?: string;         
  
  // Dynamic Window Logic (for Special Days)
  windowDaysBefore?: number;
  windowDaysAfter?: number;
  
  // Recurrence
  recurEveryDays: number; 
  usageLimitPerCustomer: number; 

  // Targeting & Value
  audience: Audience; 
  couponCode?: string; 
  minServiceCents: number; 
  reward: Reward;
};

// -------- Reward Redemption --------
export type RewardRedemption = {
  redemptionId: number;
  isActive: boolean;
  name: string;
  audience: Audience; // null means ALL
  reward: Reward;
  redeemPointsCost: number;
};

// --- Settings ---
export type Settings = {
    id: number; // Always 1

    // --- Payroll Settings ---
    periodDays: number;              // default 14
    periodStartDate: string;        // ISO date string of the start of the first payroll period
    
    // --- Loyalty Settings ---
    // storing this as a JSON string in DB, but parse it for the UI
    loyaltyEarn: LoyaltyEarn; // default: { mode: "PER_DOLLAR", pointsPerDollarSpent: 1 }

    // --- Rates for new staff ---
    defaultCommissionTechRate: number; //default 0.6
    defaultPayoutCheckRate: number;    // default 0.7
};
