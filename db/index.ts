/* eslint-disable @typescript-eslint/no-explicit-any */
import * as schema from "./schema";

export type Schema = typeof schema;

// In-memory persistent table store
type TableRow = Record<string, any>;

function getColName(col: any): string {
  if (!col) return "";
  if (typeof col === "string") return col;
  return col.key || col.name || col._?.name || String(col);
}

function getVal(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === "object" && "value" in val) return val.value;
  return val;
}

function evaluateCondition(row: TableRow, condition: any): boolean {
  if (!condition) return true;

  // Drizzle BinaryOperator / SQL condition
  if (condition.left !== undefined) {
    const leftCol = getColName(condition.left);
    const rightVal = getVal(condition.right);
    const rowVal = row[leftCol] ?? row[condition.left?.name] ?? row[condition.left?.key];
    const op = condition.operator || "=";

    if (op === "=") {
      if (rightVal === null || rightVal === undefined) return rowVal === null || rowVal === undefined;
      return String(rowVal).toLowerCase() === String(rightVal).toLowerCase();
    }
    if (op === "!=") {
      return String(rowVal).toLowerCase() !== String(rightVal).toLowerCase();
    }
    return true;
  }

  // Drizzle and / or / inArray / isNull expression chunks
  if (condition.queryChunks || condition.chunks) {
    const chunks = condition.queryChunks || condition.chunks || [];
    let isOr = false;
    const subConditions: any[] = [];

    for (const chunk of chunks) {
      if (typeof chunk === "string" && chunk.trim().toLowerCase() === "or") {
        isOr = true;
      } else if (chunk && typeof chunk === "object") {
        if (chunk.left !== undefined || chunk.queryChunks || chunk.chunks || chunk.column) {
          subConditions.push(chunk);
        }
      }
    }

    if (subConditions.length > 0) {
      if (isOr) {
        return subConditions.some((sub) => evaluateCondition(row, sub));
      } else {
        return subConditions.every((sub) => evaluateCondition(row, sub));
      }
    }
  }

  // inArray or isNull
  if (condition.column || condition.value) {
    const colName = getColName(condition.column);
    const rowVal = row[colName] ?? (condition.column?.name ? row[condition.column.name] : undefined);
    if (condition.values && Array.isArray(condition.values)) {
      const allowed = condition.values.map((v: any) => String(getVal(v)).toLowerCase());
      return allowed.includes(String(rowVal).toLowerCase());
    }
    if (condition.operator === "is null" || condition.isNull) {
      return rowVal === null || rowVal === undefined;
    }
  }

  return true;
}

function getTableName(table: any): string {
  if (typeof table === "string") return table;
  return table?._?.name || table?.name || "default";
}

// Initial seed data for live Kenya operations & services
const initialBookings: TableRow[] = [
  {
    id: "MW-2026-NBO8921",
    ownerEmail: "samuel.kinyanjui.sk@gmail.com",
    customerType: "Home",
    company: null,
    service: "Cleaning",
    option: "Standard home cleaning",
    address: "Kilimani, Argwings Kodhek Rd, Nairobi",
    instructions: "Gate code #402, second floor",
    scope: "3 bedrooms · 2 bathrooms",
    frequency: "One time",
    locations: 1,
    scheduledDay: "Today",
    scheduledDate: "2026-08-24",
    scheduledTime: "10:00 AM–12:00 PM",
    contactName: "Samuel Kinyanjui",
    contact: "0712 345 678",
    payment: "M-Pesa",
    total: 2400,
    status: "Assigned",
    assignedProviderId: "PR-2026-A109",
    assignedProviderEmail: "samuel.kinyanjui.sk@gmail.com",
    assignedProviderName: "Amina W.",
    acceptedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "MW-2026-NBO4821",
    ownerEmail: null,
    customerType: "Home",
    company: null,
    service: "Cleaning",
    option: "Standard home cleaning",
    address: "Riverside Drive, Westlands, Nairobi",
    instructions: "Supplies on site",
    scope: "2 bedrooms · 2 bathrooms · Supplies on site",
    frequency: "One time",
    locations: 1,
    scheduledDay: "Today",
    scheduledDate: "2026-08-24",
    scheduledTime: "2:00–4:00 PM",
    contactName: "Grace Mutua",
    contact: "0722 998 877",
    payment: "M-Pesa",
    total: 1450,
    status: "Unassigned",
    assignedProviderId: null,
    assignedProviderEmail: null,
    assignedProviderName: null,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "MW-2026-NBO4835",
    ownerEmail: null,
    customerType: "Business",
    company: "Lavington Tech Hub",
    service: "Laundry",
    option: "Laundry pickup & fold",
    address: "James Gichuru Rd, Lavington, Nairobi",
    instructions: "Front desk reception",
    scope: "Estimated 6 kg · Pickup and return",
    frequency: "Weekly",
    locations: 1,
    scheduledDay: "Tomorrow",
    scheduledDate: "2026-08-25",
    scheduledTime: "9:00–11:00 AM",
    contactName: "David Omondi",
    contact: "0733 112 233",
    payment: "Invoice",
    total: 1120,
    status: "Unassigned",
    assignedProviderId: null,
    assignedProviderEmail: null,
    assignedProviderName: null,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

const initialBusinessRequests: TableRow[] = [
  {
    id: "MB-2026-B8710",
    ownerEmail: "operations@safari-suites.co.ke",
    businessName: "Safari Suites Serviced Apartments",
    services: JSON.stringify(["Cleaning", "Laundry & linen", "Pest control"]),
    frequency: "Daily",
    locationCount: 3,
    contact: "info@safari-suites.co.ke / 0711 555 444",
    status: "New lead",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "MB-2026-B8711",
    ownerEmail: "facilities@apex-offices.co.ke",
    businessName: "Apex Coworking & Commercial Spaces",
    services: JSON.stringify(["Cleaning", "Handyman services"]),
    frequency: "Bi-weekly",
    locationCount: 2,
    contact: "admin@apex-offices.co.ke / 0799 123 456",
    status: "Site assessment",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

const initialApplications: TableRow[] = [
  {
    id: "MP-2026-APP01",
    ownerEmail: "samuel.kinyanjui.sk@gmail.com",
    applicationType: "provider",
    roleOrTerritory: "Mwenza service professional",
    fullName: "Amina W.",
    contact: "0712 345 678",
    location: "Kilimani, Nairobi",
    details: "5+ years residential and deep cleaning experience in Nairobi estates.",
    services: JSON.stringify(["Cleaning", "Laundry & linen"]),
    availability: "Flexible",
    status: "Approved",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 70).toISOString(),
  },
  {
    id: "MP-2026-APP02",
    ownerEmail: "john.k@mwenza.co.ke",
    applicationType: "provider",
    roleOrTerritory: "Pest control technician",
    fullName: "John Kamau",
    contact: "0744 556 677",
    location: "South B, Nairobi",
    details: "Certified pest management specialist with fumigation equipment.",
    services: JSON.stringify(["Pest control", "Home support"]),
    availability: "Weekdays",
    status: "Received",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

const initialProviderProfiles: TableRow[] = [
  {
    id: "PR-2026-A109",
    applicationId: "MP-2026-APP01",
    ownerEmail: "samuel.kinyanjui.sk@gmail.com",
    fullName: "Amina W.",
    contact: "0712 345 678",
    location: "Kilimani, Nairobi",
    services: JSON.stringify(["Cleaning", "Laundry & linen"]),
    availability: "Flexible",
    status: "Active",
    acceptingWork: 1,
    rating: 490,
    completedJobs: 38,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "PR-2026-K204",
    applicationId: "MP-2026-APP02",
    ownerEmail: "brian.m@mwenza.co.ke",
    fullName: "Brian Mwangi",
    contact: "0720 111 222",
    location: "Westlands, Nairobi",
    services: JSON.stringify(["Fundi services", "Cooking", "Home support"]),
    availability: "Full time",
    status: "Active",
    acceptingWork: 1,
    rating: 495,
    completedJobs: 64,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

const initialNotifications: TableRow[] = [
  {
    id: "MN-2026-N001",
    recipientEmail: "samuel.kinyanjui.sk@gmail.com",
    audience: "customer",
    bookingId: "MW-2026-NBO8921",
    title: "Professional assigned",
    message: "Amina W. has been assigned to Standard home cleaning for Today, 10:00 AM–12:00 PM.",
    status: "Unread",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    readAt: null,
  },
];

const initialIncidents: TableRow[] = [
  {
    id: "MI-2026-I001",
    ownerEmail: "samuel.kinyanjui.sk@gmail.com",
    reporterType: "customer",
    bookingId: "MW-2026-NBO8921",
    location: "Kilimani, Nairobi",
    category: "Service quality",
    details: "Minor delay on arrival due to heavy traffic on Ngong Road.",
    priority: "Medium",
    status: "Open",
    assignedTo: null,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

const initialAccountProfiles: TableRow[] = [
  {
    email: "samuel.kinyanjui.sk@gmail.com",
    fullName: "Samuel Kinyanjui",
    phone: "0712 345 678",
    accountType: "Home",
    businessName: null,
    serviceArea: "Nairobi",
    status: "Active",
    createdAt: new Date(Date.now() - 3600000 * 100).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 100).toISOString(),
  },
];

// Global in-memory storage across API calls in the same server instance
const tables: Record<string, TableRow[]> = {
  bookings: initialBookings,
  business_requests: initialBusinessRequests,
  applications: initialApplications,
  provider_profiles: initialProviderProfiles,
  notifications: initialNotifications,
  incidents: initialIncidents,
  account_profiles: initialAccountProfiles,
};

function getTableStore(tableName: string): TableRow[] {
  if (!tables[tableName]) {
    tables[tableName] = [];
  }
  return tables[tableName];
}

class QueryBuilder implements PromiseLike<TableRow[]> {
  private tableName: string;
  private selectedFields: any;
  private whereConditions: any[] = [];
  private orderDirectives: any[] = [];
  private limitCount: number | null = null;

  constructor(tableName: string, selectedFields?: any) {
    this.tableName = tableName;
    this.selectedFields = selectedFields;
  }

  from(table: any) {
    this.tableName = getTableName(table);
    return this;
  }

  where(...conditions: any[]) {
    this.whereConditions.push(...conditions);
    return this;
  }

  orderBy(...directives: any[]) {
    this.orderDirectives.push(...directives);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private execute(): TableRow[] {
    const store = getTableStore(this.tableName);
    let results = store.slice();

    if (this.whereConditions.length > 0) {
      results = results.filter((row) =>
        this.whereConditions.every((cond) => evaluateCondition(row, cond))
      );
    }

    if (this.orderDirectives.length > 0) {
      for (const directive of this.orderDirectives) {
        const isDesc = Boolean(directive?.isDescending || directive?._?.isDescending || String(directive).includes("desc"));
        const col = getColName(directive?.column || directive);
        results.sort((a, b) => {
          const valA = a[col];
          const valB = b[col];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return isDesc ? 1 : -1;
          if (valB === null || valB === undefined) return isDesc ? -1 : 1;
          if (valA < valB) return isDesc ? 1 : -1;
          return isDesc ? -1 : 1;
        });
      }
    }

    if (this.limitCount !== null) {
      results = results.slice(0, this.limitCount);
    }

    if (this.selectedFields && typeof this.selectedFields === "object") {
      const keys = Object.keys(this.selectedFields);
      return results.map((row) => {
        const item: TableRow = {};
        for (const k of keys) {
          item[k] = row[k] ?? row[getColName(this.selectedFields[k])];
        }
        return item;
      });
    }

    return results;
  }

  then<TResult1 = TableRow[], TResult2 = never>(
    onfulfilled?: ((value: TableRow[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const res = this.execute();
      return Promise.resolve(res).then(onfulfilled, onrejected);
    } catch (e) {
      if (onrejected) return Promise.reject(e).catch(onrejected);
      return Promise.reject(e);
    }
  }
}

class DbInstance {
  select(fields?: any) {
    const builder = new QueryBuilder("", fields);
    return {
      from: (table: any) => {
        builder.from(table);
        return builder;
      },
    };
  }

  insert(table: any) {
    const tableName = getTableName(table);
    return {
      values: async (data: TableRow | TableRow[]) => {
        const store = getTableStore(tableName);
        const rows = Array.isArray(data) ? data : [data];
        for (const r of rows) {
          const now = new Date().toISOString();
          const item = { ...r, createdAt: r.createdAt || now, updatedAt: r.updatedAt || now };
          store.unshift(item);
        }
        return rows;
      },
    };
  }

  update(table: any) {
    const tableName = getTableName(table);
    return {
      set: (changes: TableRow) => {
        return {
          where: async (...conditions: any[]) => {
            const store = getTableStore(tableName);
            const now = new Date().toISOString();
            for (let i = 0; i < store.length; i++) {
              if (conditions.every((cond) => evaluateCondition(store[i], cond))) {
                const current = store[i];
                const updated: TableRow = { ...current };
                for (const [key, val] of Object.entries(changes)) {
                  if (val && typeof val === "object" && ("queryChunks" in val || "chunks" in val)) {
                    if (key === "completedJobs") {
                      updated[key] = (Number(current[key]) || 0) + 1;
                    }
                  } else {
                    updated[key] = val;
                  }
                }
                updated.updatedAt = changes.updatedAt || now;
                store[i] = updated;
              }
            }
          },
        };
      },
    };
  }

  delete(table: any) {
    const tableName = getTableName(table);
    return {
      where: async (...conditions: any[]) => {
        const store = getTableStore(tableName);
        const remaining = store.filter(
          (row) => !conditions.every((cond) => evaluateCondition(row, cond))
        );
        tables[tableName] = remaining;
      },
    };
  }
}

const db = new DbInstance();

export async function getDb() {
  return db;
}
