"use client";

import { useState } from "react";
import { uploadMwenzaFile } from "../lib/firebase-data";
import type { UploadKind } from "../lib/firebase-types";

export default function DocumentUpload({ kind, uid, entityId, label, accept = "image/*,.pdf" }: { kind: UploadKind; uid: string; entityId?: string; label: string; accept?: string }) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setWorking(true); setMessage(""); setProgress(0);
    try { await uploadMwenzaFile({ kind, uid, entityId, file, onProgress: setProgress }); setMessage(`${file.name} uploaded securely.`); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Upload failed."); }
    finally { setWorking(false); }
  };
  return <label className="document-upload"><span><b>{label}</b><small>{working ? `Uploading · ${progress}%` : message || "PDF, JPG or PNG"}</small></span><input type="file" accept={accept} disabled={working} onChange={(event) => void upload(event.target.files?.[0])}/><i>{working ? `${progress}%` : "Choose file"}</i></label>;
}
