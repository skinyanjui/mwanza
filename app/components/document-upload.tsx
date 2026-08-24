"use client";

import { useState } from "react";
import { uploadMwenzaFile } from "../lib/firebase-data";
import type { UploadKind } from "../lib/firebase-types";

export default function DocumentUpload({ kind, uid, entityId, label, accept = "image/*,.pdf", onUploaded }: { kind: UploadKind; uid: string; entityId?: string; label: string; accept?: string; onUploaded?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    const maxMegabytes = kind === "job-photo" ? 20 : 10;
    if (file.size > maxMegabytes * 1024 * 1024) { setMessage(`Choose a file smaller than ${maxMegabytes} MB.`); return; }
    setWorking(true); setMessage(""); setProgress(0);
    try { await uploadMwenzaFile({ kind, uid, entityId, file, onProgress: setProgress }); setMessage(`${file.name} uploaded securely.`); onUploaded?.(); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Upload failed."); }
    finally { setWorking(false); }
  };
  return <label className="document-upload"><span><b>{label}</b><small>{working ? `Uploading · ${progress}%` : message || "PDF, image or document"}</small></span><input type="file" accept={accept} disabled={working} onChange={(event) => { const input = event.currentTarget; void upload(input.files?.[0]).finally(() => { input.value = ""; }); }}/><i>{working ? `${progress}%` : "Choose file"}</i></label>;
}
