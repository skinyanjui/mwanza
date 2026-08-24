import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

const projectId = "mwenza-rules-test";
let env;

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
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "accounts", "ops"), { uid: "ops", email: "ops@mwenza.test", roles: ["operations"], status: "Active" });
  });
});

after(async () => env?.cleanup());

describe("Mwenza Firestore access", () => {
  test("a user can create only their own non-privileged account", async () => {
    const db = env.authenticatedContext("alice", { email: "alice@example.com" }).firestore();
    await assertSucceeds(setDoc(doc(db, "accounts", "alice"), { uid: "alice", email: "alice@example.com", roles: ["customer"], status: "Active" }));
    await assertFails(setDoc(doc(db, "accounts", "mallory"), { uid: "mallory", email: "alice@example.com", roles: ["customer"], status: "Active" }));
    await assertFails(setDoc(doc(db, "accounts", "alice-ops"), { uid: "alice-ops", email: "alice@example.com", roles: ["operations"], status: "Active" }));
  });

  test("booking access remains owner-scoped while operations can read it", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "accounts", "alice"), { uid: "alice", email: "alice@example.com", roles: ["customer"], status: "Active" });
      await setDoc(doc(db, "bookings", "MW-1"), { ownerUid: "alice", organizationId: null, assignedProviderUid: null, status: "Confirmation pending" });
    });
    await assertSucceeds(getDoc(doc(env.authenticatedContext("alice").firestore(), "bookings", "MW-1")));
    await assertFails(getDoc(doc(env.authenticatedContext("bob").firestore(), "bookings", "MW-1")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("ops").firestore(), "bookings", "MW-1")));
  });

  test("customers cannot promote themselves to operations", async () => {
    await env.withSecurityRulesDisabled(async (context) => setDoc(doc(context.firestore(), "accounts", "alice"), { uid: "alice", email: "alice@example.com", roles: ["customer"], status: "Active" }));
    const db = env.authenticatedContext("alice", { email: "alice@example.com" }).firestore();
    await assertFails(updateDoc(doc(db, "accounts", "alice"), { roles: ["customer", "operations"] }));
    await assertSucceeds(updateDoc(doc(db, "accounts", "alice"), { roles: ["customer", "business"] }));
  });

  test("provider applications are private to the applicant and operations", async () => {
    await env.withSecurityRulesDisabled(async (context) => setDoc(doc(context.firestore(), "providerApplications", "MP-1"), { ownerUid: "alice", status: "Received" }));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("alice").firestore(), "providerApplications", "MP-1")));
    await assertFails(getDoc(doc(env.authenticatedContext("bob").firestore(), "providerApplications", "MP-1")));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("ops").firestore(), "providerApplications", "MP-1")));
  });
});

describe("Mwenza Storage access", () => {
  test("profile documents are owner-scoped", async () => {
    const file = new Uint8Array([1, 2, 3]);
    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("alice").storage(), "profiles/alice/id.pdf"), file, { contentType: "application/pdf" }));
    await assertFails(uploadBytes(ref(env.authenticatedContext("bob").storage(), "profiles/alice/id.pdf"), file, { contentType: "application/pdf" }));
  });

  test("procurement writes require an organization manager", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "organizations", "ORG-1"), { ownerUid: "alice", type: "business" });
      await setDoc(doc(db, "organizations", "ORG-1", "members", "alice"), { uid: "alice", role: "owner" });
      await setDoc(doc(db, "organizations", "ORG-1", "members", "bob"), { uid: "bob", role: "viewer" });
    });
    const file = new Uint8Array([1, 2, 3]);
    await assertSucceeds(uploadBytes(ref(env.authenticatedContext("alice").storage(), "organizations/ORG-1/procurement/tender.pdf"), file, { contentType: "application/pdf" }));
    await assertFails(uploadBytes(ref(env.authenticatedContext("bob").storage(), "organizations/ORG-1/procurement/tender.pdf"), file, { contentType: "application/pdf" }));
  });
});

test("rules default to deny", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "accounts", "ops")));
  assert.ok(true);
});
