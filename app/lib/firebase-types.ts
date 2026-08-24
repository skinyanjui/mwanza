export const selfServiceRoles = ["customer", "business", "government"] as const;
export const privilegedRoles = ["provider", "operations"] as const;
export const mwenzaRoles = [...selfServiceRoles, ...privilegedRoles] as const;

export type MwenzaRole = typeof mwenzaRoles[number];
export type AccountType = "Home" | "Business" | "Government";
export type OrganizationType = "business" | "government";
export type UploadKind = "profile" | "provider" | "job-photo" | "invoice" | "procurement";

export type FirebaseAccount = {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  serviceArea: string;
  accountType: AccountType;
  businessName?: string | null;
  roles: MwenzaRole[];
  organizationIds: string[];
  status: "Active" | "Suspended";
  createdAt: string;
  updatedAt: string;
};

export type FirebaseOrganization = {
  id: string;
  ownerUid: string;
  name: string;
  type: OrganizationType;
  services: string[];
  frequency: string;
  locationCount: number;
  contact: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
