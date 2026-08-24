"use client";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable, type UploadTaskSnapshot } from "firebase/storage";
import { getFirebaseServices } from "./firebase-client";
import type { AccountType, FirebaseAccount, FirebaseOrganization, MwenzaRole, OrganizationType, UploadKind } from "./firebase-types";

function services() {
  const value = getFirebaseServices();
  if (!value) throw new Error("Firebase is not configured for this environment.");
  return value;
}

function isoNow() {
  return new Date().toISOString();
}

function recordId(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase()}`;
}

export async function getAccount(uid: string): Promise<FirebaseAccount | null> {
  const snapshot = await getDoc(doc(services().db, "accounts", uid));
  return snapshot.exists() ? snapshot.data() as FirebaseAccount : null;
}

export function watchAccount(uid: string, callback: (profile: FirebaseAccount | null) => void, onError?: (reason: Error) => void): Unsubscribe {
  return onSnapshot(doc(services().db, "accounts", uid), (snapshot) => callback(snapshot.exists() ? snapshot.data() as FirebaseAccount : null), (reason) => onError?.(reason));
}

export async function saveAccount(input: {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  serviceArea: string;
  accountType: AccountType;
  businessName?: string;
}, existing?: FirebaseAccount | null) {
  const now = isoNow();
  const selfRole: MwenzaRole = input.accountType === "Business" ? "business" : input.accountType === "Government" ? "government" : "customer";
  const safeExistingRoles = (existing?.roles ?? []).filter((role) => role === "provider" || role === "operations");
  const profile: FirebaseAccount = {
    uid: input.uid,
    email: input.email.trim(),
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    serviceArea: input.serviceArea.trim() || "Nairobi",
    accountType: input.accountType,
    businessName: input.accountType === "Home" ? null : input.businessName?.trim() || null,
    roles: Array.from(new Set(["customer" as MwenzaRole, selfRole, ...safeExistingRoles])),
    organizationIds: existing?.organizationIds ?? [],
    status: existing?.status ?? "Active",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await setDoc(doc(services().db, "accounts", input.uid), { ...profile, updatedAt: serverTimestamp(), createdAt: existing?.createdAt ?? serverTimestamp() }, { merge: true });
  return profile;
}

export async function createOrganization(input: {
  ownerUid: string;
  name: string;
  type: OrganizationType;
  services?: string[];
  frequency?: string;
  locationCount?: number;
  contact?: string;
}) {
  const { db } = services();
  const ownerAccount = await getAccount(input.ownerUid);
  if (!ownerAccount) throw new Error("Create your Mwenza account before adding an organization.");
  const id = recordId(input.type === "government" ? "MG" : "MB");
  const now = isoNow();
  const organization: FirebaseOrganization = {
    id,
    ownerUid: input.ownerUid,
    name: input.name.trim(),
    type: input.type,
    services: input.services ?? [],
    frequency: input.frequency ?? "Not sure",
    locationCount: Math.max(1, input.locationCount ?? 1),
    contact: input.contact?.trim() ?? "",
    status: "New lead",
    createdAt: now,
    updatedAt: now,
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "organizations", id), { ...organization, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.set(doc(db, "organizations", id, "members", input.ownerUid), { uid: input.ownerUid, role: "owner", createdAt: serverTimestamp() });
  const privilegedRoles = ownerAccount.roles.filter((role) => role === "provider" || role === "operations");
  batch.update(doc(db, "accounts", input.ownerUid), {
    organizationIds: arrayUnion(id),
    roles: Array.from(new Set<MwenzaRole>(["customer", input.type, ...privilegedRoles])),
    accountType: input.type === "government" ? "Government" : "Business",
    businessName: organization.name,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return organization;
}

export type AccountOrganization = FirebaseOrganization & { membershipRole: "owner" | "manager" | "billing" | "viewer" };

export async function listAccountOrganizations(uid: string, organizationIds?: string[]) {
  const { db } = services();
  const ids = organizationIds ?? (await getAccount(uid))?.organizationIds ?? [];
  const organizations = await Promise.all(ids.map(async (id) => {
    const [organizationSnapshot, membershipSnapshot] = await Promise.all([
      getDoc(doc(db, "organizations", id)),
      getDoc(doc(db, "organizations", id, "members", uid)),
    ]);
    if (!organizationSnapshot.exists() || !membershipSnapshot.exists()) return null;
    const organization = normalizedDocument(organizationSnapshot.id, organizationSnapshot.data()) as unknown as FirebaseOrganization;
    return { ...organization, membershipRole: String(membershipSnapshot.data().role ?? "viewer") as AccountOrganization["membershipRole"] };
  }));
  return organizations.filter((item): item is AccountOrganization => item !== null);
}

export async function ensureOrganization(input: {
  ownerUid: string;
  name: string;
  type: OrganizationType;
  services?: string[];
  frequency?: string;
  locationCount?: number;
  contact?: string;
}) {
  const { db } = services();
  const organizations = await listAccountOrganizations(input.ownerUid);
  const existing = organizations.find((organization) => organization.type === input.type);
  if (!existing) return createOrganization(input);
  if (existing.membershipRole === "owner" || existing.membershipRole === "manager") {
    const changes = {
      name: input.name.trim() || existing.name,
      services: input.services ?? existing.services,
      frequency: input.frequency ?? existing.frequency,
      locationCount: Math.max(1, input.locationCount ?? existing.locationCount),
      contact: input.contact?.trim() ?? existing.contact,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, "organizations", existing.id), changes);
    return { ...existing, ...changes, updatedAt: isoNow() } as AccountOrganization;
  }
  return existing;
}

export async function createBooking(input: Record<string, unknown>, ownerUid: string, organizationId?: string | null) {
  const { db } = services();
  const id = recordId("MW");
  const booking = {
    ...input,
    id,
    ownerUid,
    organizationId: organizationId ?? null,
    assignedProviderUid: null,
    status: "Confirmation pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, "bookings", id), booking);
  batch.set(doc(db, "serviceRecords", recordId("MSR")), {
    bookingId: id,
    ownerUid,
    organizationId: organizationId ?? null,
    providerUid: null,
    event: "Booking requested",
    status: "Confirmation pending",
    notes: "Created through the Mwenza booking flow.",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return { id, status: "Confirmation pending" };
}

export function watchOwnBookings(uid: string, callback: (items: DocumentData[]) => void): Unsubscribe {
  const own = query(collection(services().db, "bookings"), where("ownerUid", "==", uid), orderBy("createdAt", "desc"), limit(25));
  return onSnapshot(own, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
}

export async function updateOwnBooking(id: string, changes: Record<string, unknown>) {
  const { db } = services();
  const definedChanges = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
  const bookingRef = doc(db, "bookings", id);
  const bookingSnapshot = await getDoc(bookingRef);
  if (!bookingSnapshot.exists()) throw new Error("Booking not found.");
  const status = typeof definedChanges.status === "string" ? definedChanges.status : null;
  const event = status === "Reschedule requested" ? "Customer requested reschedule" : status === "Cancelled" ? "Customer cancelled booking" : null;
  const batch = writeBatch(db);
  batch.update(bookingRef, { ...definedChanges, updatedAt: serverTimestamp() });
  if (event) {
    const booking = bookingSnapshot.data();
    batch.set(doc(db, "serviceRecords", recordId("MSR")), {
      bookingId: id,
      ownerUid: booking.ownerUid,
      organizationId: booking.organizationId ?? null,
      providerUid: booking.assignedProviderUid ?? null,
      event,
      status,
      notes: status === "Cancelled" ? "Cancelled from the customer account." : "A new arrival window was requested from the customer account.",
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function submitProviderApplication(input: Record<string, unknown>, ownerUid: string) {
  const id = recordId("MP");
  await setDoc(doc(services().db, "providerApplications", id), {
    ...input,
    id,
    ownerUid,
    status: "Received",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id, status: "Received" };
}

export async function appendServiceRecord(input: {
  bookingId: string;
  ownerUid?: string | null;
  organizationId?: string | null;
  providerUid?: string | null;
  event: string;
  status: string;
  notes?: string;
}) {
  const { db } = services();
  const bookingSnapshot = await getDoc(doc(db, "bookings", input.bookingId));
  const bookingData = bookingSnapshot.exists() ? bookingSnapshot.data() : null;
  return addDoc(collection(db, "serviceRecords"), {
    ...input,
    ownerUid: input.ownerUid ?? bookingData?.ownerUid ?? null,
    organizationId: input.organizationId ?? bookingData?.organizationId ?? null,
    providerUid: input.providerUid ?? bookingData?.assignedProviderUid ?? null,
    createdAt: serverTimestamp(),
  });
}

function normalizedDocument(id: string, data: DocumentData) {
  const normalized = { id, ...data } as Record<string, unknown>;
  for (const key of ["createdAt", "updatedAt", "acceptedAt", "enRouteAt", "arrivedAt", "startedAt", "completedAt", "cancelledAt"]) {
    const value = normalized[key] as { toDate?: () => Date } | undefined;
    if (value?.toDate) normalized[key] = value.toDate().toISOString();
  }
  return normalized;
}

export function watchOperationsData(callback: (section: "bookings" | "organizations" | "applications" | "providers", items: Record<string, unknown>[]) => void, onError?: (reason: Error) => void) {
  const { db } = services();
  const listen = (section: "bookings" | "organizations" | "applications" | "providers", collectionName: string) => onSnapshot(
    query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(80)),
    (snapshot) => callback(section, snapshot.docs.map((item) => normalizedDocument(item.id, item.data()))),
    (reason) => onError?.(reason),
  );
  const stops = [
    listen("bookings", "bookings"),
    listen("organizations", "organizations"),
    listen("applications", "providerApplications"),
    listen("providers", "providerProfiles"),
  ];
  return () => stops.forEach((stop) => stop());
}

export async function firebaseOperationsAction(body: Record<string, unknown>) {
  const { db } = services();
  const action = String(body.action ?? "");
  const now = serverTimestamp();
  if (action === "assign") {
    const bookingId = String(body.bookingId ?? "");
    const providerId = String(body.providerId ?? "");
    const provider = await getDoc(doc(db, "providerProfiles", providerId));
    if (!provider.exists()) throw new Error("Provider profile not found.");
    if (provider.data().status !== "Active") throw new Error("Only active providers can be assigned.");
    await updateDoc(doc(db, "bookings", bookingId), { assignedProviderUid: providerId, assignedProviderId: providerId, assignedProviderName: provider.data().fullName, status: "Assigned", updatedAt: now });
    await appendServiceRecord({ bookingId, providerUid: providerId, event: "Provider assigned", status: "Assigned" });
    return { status: "Assigned" };
  }
  if (action === "booking-status") {
    const bookingId = String(body.bookingId ?? "");
    const status = String(body.status ?? "");
    await updateDoc(doc(db, "bookings", bookingId), { status, updatedAt: now, ...(status === "Completed" ? { completedAt: now } : {}) });
    await appendServiceRecord({ bookingId, event: `Booking moved to ${status}`, status });
    return { status };
  }
  if (action === "approve-provider") {
    const applicationId = String(body.applicationId ?? "");
    const applicationSnapshot = await getDoc(doc(db, "providerApplications", applicationId));
    if (!applicationSnapshot.exists()) throw new Error("Provider application not found.");
    const application = applicationSnapshot.data();
    const ownerUid = String(application.ownerUid ?? "");
    if (!ownerUid) throw new Error("The applicant must sign in before activation.");
    const accountSnapshot = await getDoc(doc(db, "accounts", ownerUid));
    if (!accountSnapshot.exists()) throw new Error("Applicant account not found.");
    const batch = writeBatch(db);
    batch.update(doc(db, "providerApplications", applicationId), { status: "Approved", updatedAt: now });
    batch.update(doc(db, "accounts", ownerUid), { roles: arrayUnion("provider"), updatedAt: now });
    batch.set(doc(db, "providerProfiles", ownerUid), {
      id: ownerUid,
      applicationId,
      ownerUid,
      ownerEmail: accountSnapshot.data().email ?? null,
      fullName: application.fullName,
      contact: application.contact,
      location: application.location,
      services: application.services ?? [],
      availability: application.availability ?? null,
      status: "Active",
      acceptingWork: true,
      rating: 500,
      completedJobs: 0,
      createdAt: now,
      updatedAt: now,
    });
    await batch.commit();
    return { ownerUid, ownerEmail: accountSnapshot.data().email ?? null, status: "Approved" };
  }
  if (action === "lead-status") {
    const requestId = String(body.requestId ?? "");
    const status = String(body.status ?? "");
    await updateDoc(doc(db, "organizations", requestId), { status, updatedAt: now });
    return { status };
  }
  throw new Error("Unsupported operations action.");
}

export function watchProviderAssigned(uid: string, callback: (profile: Record<string, unknown> | null, jobs: Record<string, unknown>[]) => void, onError?: (reason: Error) => void) {
  const { db } = services();
  let profile: Record<string, unknown> | null = null;
  let jobs: Record<string, unknown>[] = [];
  const emit = () => callback(profile, jobs);
  const stopProfile = onSnapshot(doc(db, "providerProfiles", uid), (snapshot) => { profile = snapshot.exists() ? normalizedDocument(snapshot.id, snapshot.data()) : null; emit(); }, (reason) => onError?.(reason));
  const assigned = query(collection(db, "bookings"), where("assignedProviderUid", "==", uid), orderBy("createdAt", "desc"), limit(30));
  const stopJobs = onSnapshot(assigned, (snapshot) => { jobs = snapshot.docs.map((item) => normalizedDocument(item.id, item.data())); emit(); }, (reason) => onError?.(reason));
  return () => { stopProfile(); stopJobs(); };
}

export async function firebaseProviderAction(uid: string, body: Record<string, unknown>) {
  const { db } = services();
  const action = String(body.action ?? "");
  if (action === "availability") {
    await updateDoc(doc(db, "providerProfiles", uid), { acceptingWork: Boolean(body.acceptingWork), updatedAt: serverTimestamp() });
    return { updated: true };
  }
  const bookingId = String(body.bookingId ?? "");
  const statusMap: Record<string, string> = { travel: "En route", arrive: "Arrived", start: "In progress", complete: "Completed" };
  const nextStatus = statusMap[action];
  if (!bookingId || !nextStatus) throw new Error("Unsupported provider action.");
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, "bookings", bookingId);
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists() || snapshot.data().assignedProviderUid !== uid) throw new Error("This booking is not assigned to your account.");
    const currentStatus = String(snapshot.data().status ?? "");
    const validTransition = (action === "travel" && ["Assigned", "Provider assigned"].includes(currentStatus))
      || (action === "arrive" && currentStatus === "En route")
      || (action === "start" && currentStatus === "Arrived")
      || (action === "complete" && currentStatus === "In progress");
    if (!validTransition) throw new Error(`Complete the current ${currentStatus.toLowerCase() || "job"} step first.`);
    transaction.update(bookingRef, { status: nextStatus, updatedAt: serverTimestamp(), ...(action === "travel" ? { enRouteAt: serverTimestamp() } : action === "arrive" ? { arrivedAt: serverTimestamp() } : action === "start" ? { startedAt: serverTimestamp() } : { completedAt: serverTimestamp() }) });
  });
  await appendServiceRecord({ bookingId, providerUid: uid, event: `Provider marked ${nextStatus}`, status: nextStatus });
  return { status: nextStatus };
}

export async function listOrganizationBookings(organizationId: string) {
  const snapshot = await getDocs(query(collection(services().db, "bookings"), where("organizationId", "==", organizationId), orderBy("createdAt", "desc"), limit(50)));
  return snapshot.docs.map((item) => normalizedDocument(item.id, item.data()));
}

function safeFilename(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

export function uploadMwenzaFile(input: {
  kind: UploadKind;
  uid: string;
  entityId?: string;
  file: File;
  onProgress?: (percent: number) => void;
}) {
  const { storage } = services();
  const fileId = `${Date.now()}-${safeFilename(input.file.name)}`;
  const base = input.kind === "profile" ? `profiles/${input.uid}`
    : input.kind === "provider" ? `providers/${input.uid}`
      : input.kind === "job-photo" ? `bookings/${input.entityId}/jobs`
        : `organizations/${input.entityId}/${input.kind === "invoice" ? "invoices" : "procurement"}`;
  const target = ref(storage, `${base}/${fileId}`);
  const task = uploadBytesResumable(target, input.file, {
    contentType: input.file.type,
    customMetadata: { ownerUid: input.uid, kind: input.kind, entityId: input.entityId ?? "" },
  });
  return new Promise<{ path: string; url: string; snapshot: UploadTaskSnapshot }>((resolve, reject) => {
    task.on("state_changed", (snapshot) => input.onProgress?.(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)), reject, async () => {
      resolve({ path: task.snapshot.ref.fullPath, url: await getDownloadURL(task.snapshot.ref), snapshot: task.snapshot });
    });
  });
}
