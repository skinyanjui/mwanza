import { after, before, beforeEach, describe, test } from "node:test";
import fs from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

const projectId = "mwenza-rules-test";
let env;

const account = (uid, roles = ["customer"], accountType = "Home", organizationIds = []) => ({
  uid,
  email: `${uid}@mwenza.test`,
  fullName: `${uid} account`,
  phone: "0712345678",
  serviceArea: "Nairobi",
  accountType,
  businessName: accountType === "Home" ? null : `${uid} organization`,
  roles,
  organizationIds,
  status: "Active",
  createdAt: "2026-08-24T00:00:00.000Z",
  updatedAt: "2026-08-24T00:00:00.000Z",
});

const booking = (id, overrides = {}) => ({
  id,
  ownerUid: "alice",
  organizationId: null,
  assignedProviderUid: null,
  customerType: "Home",
  status: "Confirmation pending",
  service: "Cleaning",
  createdAt: "2026-08-24T00:00:00.000Z",
  updatedAt: "2026-08-24T00:00:00.000Z",
  ...overrides,
});

async function seed(callback) {
  await env.withSecurityRulesDisabled(async (context) => callback(context.firestore()));
}

async function seedOrganization(id = "ORG-1") {
  await seed(async (db) => {
    await setDoc(doc(db, "organizations", id), {
      id,
      ownerUid: "alice",
      name: "Alice Limited",
      type: "business",
      services: ["Cleaning"],
      frequency: "Weekly",
      locationCount: 2,
      contact: "alice@mwenza.test",
      status: "New lead",
      createdAt: "2026-08-24T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z",
    });
    await setDoc(doc(db, "organizations", id, "members", "alice"), { uid: "alice", role: "owner", createdAt: "2026-08-24T00:00:00.000Z" });
    await setDoc(doc(db, "organizations", id, "members", "maya"), { uid: "maya", role: "manager", createdAt: "2026-08-24T00:00:00.000Z" });
    await setDoc(doc(db, "organizations", id, "members", "bob"), { uid: "bob", role: "viewer", createdAt: "2026-08-24T00:00:00.000Z" });
  });
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: fs.readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: fs.readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await seed(async (db) => {
    await setDoc(doc(db, "accounts", "ops"), account("ops", ["customer", "operations"]));
  });
});

after(async () => env?.cleanup());

describe("account roles", () => {
  test("a user can create only their own account type and cannot self-assign privileged roles", async () => {
    const alice = env.authenticatedContext("alice", { email: "alice@mwenza.test" }).firestore();
    const bob = env.authenticatedContext("bob", { email: "bob@mwenza.test" }).firestore();

    await assertSucceeds(setDoc(doc(alice, "accounts", "alice"), account("alice")));
    await assertFails(setDoc(doc(alice, "accounts", "mallory"), account("mallory")));
    await assertFails(setDoc(doc(bob, "accounts", "bob"), account("bob", ["customer", "operations"])));
    await assertFails(setDoc(doc(bob, "accounts", "bob"), account("bob", ["customer", "business"], "Home")));
    await assertSucceeds(setDoc(doc(bob, "accounts", "bob"), account("bob", ["customer", "business"], "Business")));
  });

  test("customers can change their audience but cannot add or remove privileged roles", async () => {
    await seed(async (db) => setDoc(doc(db, "accounts", "alice"), account("alice")));
    const alice = env.authenticatedContext("alice", { email: "alice@mwenza.test" }).firestore();

    await assertFails(updateDoc(doc(alice, "accounts", "alice"), { roles: ["customer", "operations"] }));
    await assertSucceeds(updateDoc(doc(alice, "accounts", "alice"), { accountType: "Business", roles: ["customer", "business"], businessName: "Alice Limited" }));

    await seed(async (db) => setDoc(doc(db, "accounts", "provider"), account("provider", ["customer", "provider"])));
    const provider = env.authenticatedContext("provider", { email: "provider@mwenza.test" }).firestore();
    await assertFails(updateDoc(doc(provider, "accounts", "provider"), { roles: ["customer"] }));
  });
});

describe("organization tenancy", () => {
  test("members can read an organization while outsiders cannot", async () => {
    await seedOrganization();
    await assertSucceeds(getDoc(doc(env.authenticatedContext("bob").firestore(), "organizations", "ORG-1")));
    await assertFails(getDoc(doc(env.authenticatedContext("outsider").firestore(), "organizations", "ORG-1")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("ops").firestore(), "organizations", "ORG-1")));
  });

  test("managers can update service details but cannot change ownership or lead state", async () => {
    await seedOrganization();
    const manager = env.authenticatedContext("maya").firestore();
    const viewer = env.authenticatedContext("bob").firestore();

    await assertSucceeds(updateDoc(doc(manager, "organizations", "ORG-1"), { services: ["Cleaning", "Laundry"], updatedAt: "later" }));
    await assertFails(updateDoc(doc(manager, "organizations", "ORG-1"), { ownerUid: "maya" }));
    await assertFails(updateDoc(doc(manager, "organizations", "ORG-1"), { status: "Approved" }));
    await assertFails(updateDoc(doc(viewer, "organizations", "ORG-1"), { name: "Viewer takeover" }));
  });

  test("only owners and operations control membership", async () => {
    await seedOrganization();
    const owner = env.authenticatedContext("alice").firestore();
    const manager = env.authenticatedContext("maya").firestore();

    await assertSucceeds(setDoc(doc(owner, "organizations", "ORG-1", "members", "charlie"), { uid: "charlie", role: "billing", createdAt: "now" }));
    await assertFails(setDoc(doc(manager, "organizations", "ORG-1", "members", "dana"), { uid: "dana", role: "viewer", createdAt: "now" }));
    await assertFails(updateDoc(doc(owner, "organizations", "ORG-1", "members", "maya"), { role: "owner" }));
    await assertFails(deleteDoc(doc(owner, "organizations", "ORG-1", "members", "alice")));
    await assertSucceeds(deleteDoc(doc(owner, "organizations", "ORG-1", "members", "charlie")));
  });
});

describe("bookings and service records", () => {
  test("home bookings remain personal and managed bookings require membership", async () => {
    await seedOrganization();
    await seed(async (db) => setDoc(doc(db, "accounts", "alice"), account("alice")));
    const alice = env.authenticatedContext("alice").firestore();
    const outsider = env.authenticatedContext("outsider").firestore();

    await assertSucceeds(setDoc(doc(alice, "bookings", "MW-HOME"), booking("MW-HOME")));
    await assertFails(setDoc(doc(alice, "bookings", "MW-NO-ORG"), booking("MW-NO-ORG", { customerType: "Business" })));
    await assertSucceeds(setDoc(doc(alice, "bookings", "MW-BIZ"), booking("MW-BIZ", { customerType: "Business", organizationId: "ORG-1" })));
    await assertFails(setDoc(doc(outsider, "bookings", "MW-OUT"), booking("MW-OUT", { ownerUid: "outsider", customerType: "Business", organizationId: "ORG-1" })));
    await assertFails(setDoc(doc(alice, "bookings", "MW-ASSIGNED"), booking("MW-ASSIGNED", { assignedProviderUid: "alice" })));
  });

  test("booking visibility is limited to owners, organization members, assigned providers, and operations", async () => {
    await seedOrganization();
    await seed(async (db) => {
      await setDoc(doc(db, "accounts", "provider"), account("provider", ["customer", "provider"]));
      await setDoc(doc(db, "bookings", "MW-1"), booking("MW-1", { organizationId: "ORG-1", customerType: "Business", assignedProviderUid: "provider", status: "Assigned" }));
    });

    await assertSucceeds(getDoc(doc(env.authenticatedContext("alice").firestore(), "bookings", "MW-1")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("bob").firestore(), "bookings", "MW-1")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("provider").firestore(), "bookings", "MW-1")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("ops").firestore(), "bookings", "MW-1")));
    await assertFails(getDoc(doc(env.authenticatedContext("outsider").firestore(), "bookings", "MW-1")));
  });

  test("providers must complete assigned work in order and cannot forge timestamps", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "accounts", "provider"), account("provider", ["customer", "provider"]));
      await setDoc(doc(db, "bookings", "MW-JOB"), booking("MW-JOB", { assignedProviderUid: "provider", status: "Assigned" }));
      await setDoc(doc(db, "bookings", "MW-SKIP"), booking("MW-SKIP", { assignedProviderUid: "provider", status: "Assigned" }));
    });
    const provider = env.authenticatedContext("provider").firestore();

    await assertSucceeds(updateDoc(doc(provider, "bookings", "MW-JOB"), { status: "En route", enRouteAt: "now", updatedAt: "now" }));
    await assertFails(updateDoc(doc(provider, "bookings", "MW-JOB"), { status: "Arrived", arrivedAt: "now", completedAt: "forged", updatedAt: "now" }));
    await assertSucceeds(updateDoc(doc(provider, "bookings", "MW-JOB"), { status: "Arrived", arrivedAt: "now", updatedAt: "now" }));
    await assertFails(updateDoc(doc(provider, "bookings", "MW-SKIP"), { status: "Completed", completedAt: "now", updatedAt: "now" }));
    await assertFails(updateDoc(doc(env.authenticatedContext("outsider").firestore(), "bookings", "MW-JOB"), { status: "In progress", startedAt: "now", updatedAt: "now" }));
  });

  test("booking creation and customer changes produce matching append-only records", async () => {
    await seed(async (db) => setDoc(doc(db, "accounts", "alice"), account("alice")));
    const alice = env.authenticatedContext("alice").firestore();
    const create = writeBatch(alice);
    create.set(doc(alice, "bookings", "MW-AUDIT"), booking("MW-AUDIT"));
    create.set(doc(alice, "serviceRecords", "MSR-CREATE"), {
      bookingId: "MW-AUDIT",
      ownerUid: "alice",
      organizationId: null,
      providerUid: null,
      event: "Booking requested",
      status: "Confirmation pending",
      createdAt: "now",
    });
    await assertSucceeds(create.commit());

    const reschedule = writeBatch(alice);
    reschedule.update(doc(alice, "bookings", "MW-AUDIT"), { status: "Reschedule requested", scheduledDay: "Tomorrow", updatedAt: "later" });
    reschedule.set(doc(alice, "serviceRecords", "MSR-RESCHEDULE"), {
      bookingId: "MW-AUDIT",
      ownerUid: "alice",
      organizationId: null,
      providerUid: null,
      event: "Customer requested reschedule",
      status: "Reschedule requested",
      createdAt: "later",
    });
    await assertSucceeds(reschedule.commit());

    await assertFails(setDoc(doc(alice, "serviceRecords", "MSR-FORGED"), {
      bookingId: "MW-AUDIT",
      ownerUid: "alice",
      organizationId: null,
      providerUid: null,
      event: "Provider marked Completed",
      status: "Completed",
      createdAt: "later",
    }));
  });

  test("provider applications are private to the applicant and operations", async () => {
    await seed(async (db) => setDoc(doc(db, "providerApplications", "MP-1"), { ownerUid: "alice", status: "Received" }));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("alice").firestore(), "providerApplications", "MP-1")));
    await assertFails(getDoc(doc(env.authenticatedContext("bob").firestore(), "providerApplications", "MP-1")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("ops").firestore(), "providerApplications", "MP-1")));
  });
});

describe("Cloud Storage", () => {
  const file = new Uint8Array([1, 2, 3]);

  test("profile documents are owner-scoped and type checked", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "accounts", "alice"), account("alice"));
      await setDoc(doc(db, "accounts", "bob"), account("bob"));
    });
    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("alice").storage(), "profiles/alice/id.pdf"), file, { contentType: "application/pdf" }));
    await assertFails(uploadBytes(ref(env.authenticatedContext("bob").storage(), "profiles/alice/id.pdf"), file, { contentType: "application/pdf" }));
    await assertFails(uploadBytes(ref(env.authenticatedContext("alice").storage(), "profiles/alice/script.txt"), file, { contentType: "text/plain" }));
  });

  test("job photos are limited to the customer, active provider role, and operations", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "accounts", "provider"), account("provider", ["customer", "provider"]));
      await setDoc(doc(db, "bookings", "MW-PHOTO"), booking("MW-PHOTO", { assignedProviderUid: "provider", status: "Assigned" }));
      await setDoc(doc(db, "bookings", "MW-NOROLE"), booking("MW-NOROLE", { assignedProviderUid: "former", status: "Assigned" }));
    });
    const metadata = { contentType: "image/jpeg" };

    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("alice").storage(), "bookings/MW-PHOTO/jobs/before.jpg"), file, metadata));
    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("provider").storage(), "bookings/MW-PHOTO/jobs/after.jpg"), file, metadata));
    await assertFails(uploadBytes(ref(env.authenticatedContext("former").storage(), "bookings/MW-NOROLE/jobs/after.jpg"), file, metadata));
    await assertFails(uploadBytes(ref(env.authenticatedContext("outsider").storage(), "bookings/MW-PHOTO/jobs/after.jpg"), file, metadata));
    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("ops").storage(), "bookings/MW-PHOTO/jobs/review.jpg"), file, metadata));
  });

  test("procurement writes require an organization manager", async () => {
    await seedOrganization();
    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("alice").storage(), "organizations/ORG-1/procurement/tender.pdf"), file, { contentType: "application/pdf" }));
    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("maya").storage(), "organizations/ORG-1/procurement/quote.pdf"), file, { contentType: "application/pdf" }));
    await assertFails(uploadBytes(ref(env.authenticatedContext("bob").storage(), "organizations/ORG-1/procurement/tender.pdf"), file, { contentType: "application/pdf" }));
  });
});

test("rules default to deny", async () => {
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "accounts", "ops")));
  await assertFails(setDoc(doc(env.authenticatedContext("alice").firestore(), "unlisted", "record"), { value: true }));
});
