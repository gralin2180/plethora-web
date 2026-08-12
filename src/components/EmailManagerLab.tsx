"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Monitor,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";
import {
  applyTemplate,
  dueReminders,
  loadEmailManager,
  saveEmailManager,
  uid,
  type EmailDraft,
  type EmailManagerState,
  type EmailTemplate,
  type JobApplication,
} from "@/lib/email-manager";

type Tab = "compose" | "drafts" | "applications" | "templates" | "background";

export function EmailManagerLab() {
  const [tab, setTab] = useState<Tab>("compose");
  const [state, setState] = useState<EmailManagerState>(() => loadEmailManager());
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Job app form
  const [appCompany, setAppCompany] = useState("");
  const [appRole, setAppRole] = useState("");
  const [appEmail, setAppEmail] = useState("");
  const [appNotes, setAppNotes] = useState("");
  const [appFollowUp, setAppFollowUp] = useState("");

  const persist = useCallback((next: EmailManagerState) => {
    setState(next);
    saveEmailManager(next);
  }, []);

  useEffect(() => {
    trackToolUse("email-manager", 1);
  }, []);

  // Background reminder checks
  useEffect(() => {
    if (!state.settings.notificationsEnabled) return;
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const due = dueReminders(state.applications);
      for (const a of due.slice(0, 3)) {
        const key = `plethora-rem-${a.id}-${a.followUpAt?.slice(0, 10)}`;
        if (sessionStorage.getItem(key)) continue;
        sessionStorage.setItem(key, "1");
        new Notification(`Follow up: ${a.company}`, {
          body: `${a.role} — due ${a.followUpAt?.slice(0, 10) || "soon"}`,
          tag: key,
        });
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [state.applications, state.settings.notificationsEnabled]);

  const tabs: { id: Tab; label: string; icon: typeof Mail }[] = [
    { id: "compose", label: "Compose", icon: PenLine },
    { id: "drafts", label: "Drafts", icon: FileText },
    { id: "applications", label: "Job apps", icon: Briefcase },
    { id: "templates", label: "Templates", icon: Mail },
    { id: "background", label: "Tray / background", icon: Monitor },
  ];

  function saveDraft() {
    const now = new Date().toISOString();
    if (editingDraftId) {
      persist({
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === editingDraftId
            ? { ...d, to, subject, body, updatedAt: now }
            : d
        ),
      });
      setNotice("Draft updated");
    } else {
      const draft: EmailDraft = {
        id: uid(),
        to,
        subject,
        body,
        status: "draft",
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      persist({ ...state, drafts: [draft, ...state.drafts] });
      setEditingDraftId(draft.id);
      setNotice("Draft saved locally");
    }
    setTimeout(() => setNotice(null), 2500);
  }

  function loadDraft(d: EmailDraft) {
    setTo(d.to);
    setSubject(d.subject);
    setBody(d.body);
    setEditingDraftId(d.id);
    setTab("compose");
  }

  function copyAll() {
    const text = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    void navigator.clipboard.writeText(text);
    setNotice("Copied — paste into Gmail, Outlook, or Apple Mail");
    setTimeout(() => setNotice(null), 2500);
  }

  function mailtoLink() {
    const q = new URLSearchParams();
    if (subject) q.set("subject", subject);
    if (body) q.set("body", body.slice(0, 1800));
    return `mailto:${encodeURIComponent(to)}?${q.toString()}`;
  }

  function addApplication() {
    if (!appCompany.trim()) return;
    const now = new Date().toISOString();
    const app: JobApplication = {
      id: uid(),
      company: appCompany.trim(),
      role: appRole.trim(),
      contactEmail: appEmail.trim(),
      status: "draft",
      notes: appNotes.trim(),
      followUpAt: appFollowUp || undefined,
      createdAt: now,
      updatedAt: now,
    };
    persist({ ...state, applications: [app, ...state.applications] });
    setAppCompany("");
    setAppRole("");
    setAppEmail("");
    setAppNotes("");
    setAppFollowUp("");
    setNotice("Application saved locally");
    setTimeout(() => setNotice(null), 2500);
  }

  function generateAppEmail(app: JobApplication) {
    const tpl =
      state.templates.find((t) => t.id === "tpl-job") || state.templates[0];
    if (!tpl) return;
    const { subject: sub, body: bod } = applyTemplate(tpl, {
      company: app.company,
      role: app.role,
      name: "Hiring team",
      years: "3",
      skill: "your field",
      your_name: state.settings.signature || "Your name",
    });
    setTo(app.contactEmail);
    setSubject(sub);
    setBody(bod);
    setTab("compose");
  }

  function useTemplate(tpl: EmailTemplate) {
    const { subject: sub, body: bod } = applyTemplate(tpl, {
      company: "Acme",
      role: "Role title",
      name: "there",
      hook: "your recent launch",
      offer: "what you do",
      proof: "one metric",
      topic: "the team",
      years: "3",
      skill: "relevant skill",
      your_name: state.settings.signature || "Your name",
    });
    setSubject(sub);
    setBody(bod);
    setTab("compose");
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setNotice("Notifications not supported in this browser");
      return;
    }
    const perm = await Notification.requestPermission();
    persist({
      ...state,
      settings: {
        ...state.settings,
        notificationsEnabled: perm === "granted",
      },
    });
    setNotice(
      perm === "granted"
        ? "Reminders on — keep Plethora open or install as app (Background tab)"
        : "Notifications blocked — allow in browser settings"
    );
    setTimeout(() => setNotice(null), 3500);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plethora-email-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const due = useMemo(() => dueReminders(state.applications), [state.applications]);

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-zinc-500">
        Local email workspace — drafts, job applications, and follow-ups stay on{" "}
        <strong className="text-zinc-300">this device</strong>. Plethora does not send mail; you
        copy or open your mail app. For Gmail/Outlook sync later, use{" "}
        <Link href="/connect" className="text-violet-400 hover:underline">
          Connect apps
        </Link>{" "}
        or BYOK + MCP.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
              tab === t.id
                ? "bg-violet-600 text-white"
                : "border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {notice && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {notice}
        </p>
      )}

      {due.length > 0 && tab !== "background" && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <Bell className="h-3.5 w-3.5 shrink-0" />
          {due.length} follow-up{due.length > 1 ? "s" : ""} due soon — check Job apps
        </p>
      )}

      {tab === "compose" && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To: recruiter@company.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            placeholder="Write your email…"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <label className="block text-xs text-zinc-500">
            Signature (used in templates)
            <input
              value={state.settings.signature}
              onChange={(e) =>
                persist({
                  ...state,
                  settings: { ...state.settings, signature: e.target.value },
                })
              }
              placeholder="Your name"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={copyAll}
              className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <a
              href={mailtoLink()}
              className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in mail app
            </a>
          </div>
        </div>
      )}

      {tab === "drafts" && (
        <div className="space-y-2">
          {state.drafts.length === 0 && (
            <p className="text-sm text-zinc-600">No drafts yet — compose one and save.</p>
          )}
          {state.drafts.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{d.subject || "(no subject)"}</p>
                <p className="text-xs text-zinc-500">To: {d.to || "—"}</p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{d.body}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => loadDraft(d)}
                  className="rounded-lg bg-violet-600/80 px-2 py-1 text-xs text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    persist({
                      ...state,
                      drafts: state.drafts.filter((x) => x.id !== d.id),
                    })
                  }
                  className="rounded-lg border border-white/10 p-1 text-zinc-500 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "applications" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <p className="text-xs font-medium text-zinc-400">Track a job application</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={appCompany}
                onChange={(e) => setAppCompany(e.target.value)}
                placeholder="Company"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <input
                value={appRole}
                onChange={(e) => setAppRole(e.target.value)}
                placeholder="Role title"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <input
                value={appEmail}
                onChange={(e) => setAppEmail(e.target.value)}
                placeholder="Recruiter email (optional)"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <input
                type="date"
                value={appFollowUp}
                onChange={(e) => setAppFollowUp(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                title="Follow-up date"
              />
            </div>
            <textarea
              value={appNotes}
              onChange={(e) => setAppNotes(e.target.value)}
              rows={2}
              placeholder="Notes (link to posting, salary, etc.)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={addApplication}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Add application
            </button>
          </div>
          {state.applications.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">
                    {a.role || "Role"} @ {a.company}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {a.contactEmail || "No contact"} · follow-up:{" "}
                    {a.followUpAt?.slice(0, 10) || "—"}
                  </p>
                  {a.notes && <p className="mt-1 text-xs text-zinc-600">{a.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-1">
                  <select
                    value={a.status}
                    onChange={(e) =>
                      persist({
                        ...state,
                        applications: state.applications.map((x) =>
                          x.id === a.id
                            ? {
                                ...x,
                                status: e.target.value as JobApplication["status"],
                                updatedAt: new Date().toISOString(),
                              }
                            : x
                        ),
                      })
                    }
                    className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-zinc-300"
                  >
                    {["draft", "applied", "interview", "offer", "rejected", "ghosted"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => generateAppEmail(a)}
                    className="rounded-lg bg-violet-600/80 px-2 py-1 text-xs text-white"
                  >
                    Draft email
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "templates" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {state.templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => useTemplate(tpl)}
              className="rounded-xl border border-white/10 bg-black/30 p-3 text-left hover:border-violet-500/40"
            >
              <p className="text-sm font-medium text-white">{tpl.name}</p>
              <p className="mt-1 truncate text-xs text-zinc-500">{tpl.subject}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "background" && (
        <div className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <Monitor className="h-4 w-4" /> Run Plethora in the background
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-xs text-zinc-400">
            <li>
              <strong className="text-zinc-300">Install as app (PWA):</strong> Chrome → menu →
              Install Plethora. Opens in its own window; follow-up reminders still fire while it
              runs.
            </li>
            <li>
              <strong className="text-zinc-300">Keep tab open:</strong> Minimize the browser — we
              check reminders every minute when notifications are on.
            </li>
            <li>
              <strong className="text-zinc-300">System tray (coming):</strong> A small desktop app
              (Tauri/Electron) will sit in the tray, sync drafts, and nudge you without a browser tab.
              Request priority via{" "}
              <Link href="/tools/request-tool" className="text-violet-400 hover:underline">
                Request a tool
              </Link>
              .
            </li>
            <li>
              <strong className="text-zinc-300">Real inbox sync:</strong> Connect Gmail via{" "}
              <Link href="/connect" className="text-violet-400 hover:underline">
                /connect
              </Link>{" "}
              + Zapier MCP — send still happens in your mail account.
            </li>
          </ul>
          <button
            type="button"
            onClick={() => void enableNotifications()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            <Bell className="h-4 w-4" />
            {state.settings.notificationsEnabled
              ? "Notifications enabled"
              : "Enable follow-up notifications"}
          </button>
          <button
            type="button"
            onClick={exportBackup}
            className="ml-2 inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            <Download className="h-4 w-4" /> Export backup JSON
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <Link href="/tools/message-automation" className="text-violet-400 hover:underline">
          Messaging automation planner
        </Link>
        <Link href="/tools/message-sequence-copy" className="text-violet-400 hover:underline">
          Sequence copy writer
        </Link>
        <Link href="/prompt-assistant" className="text-violet-400 hover:underline">
          Polish with Prompt Assistant
        </Link>
      </div>
    </div>
  );
}
