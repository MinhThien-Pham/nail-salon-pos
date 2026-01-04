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
  | {
      mode: "PER_DOLLAR";
      // Example: 1 point per $1 spent -> pointsPerDollarSpent = 1
      pointsPerDollarSpent: number;
    }
  | {
      mode: "PER_VISIT";
      // Example: 1 point per qualifying visit -> pointsPerVisit = 1
      pointsPerVisit: number;
      // Optional threshold for a visit to qualify (in cents). If 0 => every visit counts.
      minServiceCentsToCount: number;
    };

// -------- Reward types --------
export type Reward =
  | { type: "CREDIT"; creditCents: number }            // $ off service (cents)
  | { type: "PERCENT"; percentOffService: number };    // % off service (0-100)

// -------- Promos --------
export type PromoTime =
  | { startISO: string; endISO: string }                // explicit range
  | { startISO: string; durationDays: number };         // end = start + durationDays

export type Audience = CustomerType[] | null;   // null means all

export type Promo = {
  promoId: string;
  isActive: boolean;
  name: string;
  time: PromoTime;
  audience: Audience; // null means ALL
  couponCode?: string; // optional coupon code to activate
  minServiceCents: number; // 0 means no min spend
  reward: Reward;
};

// -------- Reward Redemption --------
export type RewardRedemption = {
  redemptionId: string;
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

// -------- Customer-related types --------
export type CustomerType = "VIP" | "NEW" | "AT_RISK" | "REGULAR" | "NORMAL";