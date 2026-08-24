"use client";

import { useCallback, useEffect, useState } from "react";
import { getMwenzaFileUrl, listMwenzaFiles, type MwenzaStoredFile } from "../lib/firebase-data";
import type { UploadKind } from "../lib/firebase-types";
import DocumentUpload from "./document-upload";

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentVault({
  kind,
  uid,
  entityId,
  title,
  description,
  uploadLabel,
  accept = "image/*,.pdf",
  allowUpload = true,
}: {
  kind: UploadKind;
  uid: string;
  entityId?: string;
  title: string;
  description: string;
  uploadLabel?: string;
  accept?: string;
  allowUpload?: boolean;
}) {
  const [files, setFiles] = useState<MwenzaStoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [opening, setOpening] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setMessage("");
    try { setFiles(await listMwenzaFiles({ kind, uid, entityId })); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Documents could not be loaded."); }
    finally { setLoading(false); }
  }, [entityId, kind, uid]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const openFile = async (file: MwenzaStoredFile) => {
    setOpening(file.path); setMessage("");
    try {
      const url = await getMwenzaFileUrl(file.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "The file could not be opened."); }
    finally { setOpening(""); }
  };

  return <section className="document-vault">
    <header><div><small>SECURE FILES</small><h3>{title}</h3><p>{description}</p></div><span>{files.length}</span></header>
    {loading ? <div className="document-vault-empty">Loading documents…</div> : files.length ? <div className="document-file-list">{files.map((file) => <article key={file.path}><span><b>{file.name}</b><small>{fileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</small></span><button disabled={opening === file.path} onClick={() => void openFile(file)}>{opening === file.path ? "Opening…" : "Open →"}</button></article>)}</div> : <div className="document-vault-empty">No documents here yet.</div>}
    {message && <p className="document-vault-message" role="status">{message}</p>}
    {allowUpload && uploadLabel && <DocumentUpload kind={kind} uid={uid} entityId={entityId} label={uploadLabel} accept={accept} onUploaded={() => void refresh()}/>} 
  </section>;
}
