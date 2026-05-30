import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/api";

const SESSION_KEY = "lms_chat_session_id";
const MAX_MSG_LEN = 4000;

function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getOrCreateSessionId() {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = generateSessionId();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const QUICK_CHIPS = ["My courses", "My certificates", "What's overdue?"];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get(`/chat/history?sessionId=${sessionId}`);
      setMessages(res.data.messages || []);
    } catch {
      // silent — history not critical
    }
  }, [sessionId]);

  useEffect(() => {
    if (open) loadHistory();
  }, [open, loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-grow textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px"; // max ~4 rows
  };

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;

    if (text.length > MAX_MSG_LEN) {
      setMessages((prev) => [
        ...prev,
        { _id: `err-${Date.now()}`, role: "error", content: `Message too long (max ${MAX_MSG_LEN} characters).` },
      ]);
      return;
    }

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setMessages((prev) => [
      ...prev,
      { _id: `u-${Date.now()}`, role: "user", content: text, ts: Date.now() },
    ]);
    setLoading(true);

    try {
      const res = await api.post("/chat/message", { message: text, sessionId });
      setMessages((prev) => [
        ...prev,
        { _id: `a-${Date.now()}`, role: "assistant", content: res.data.reply, ts: Date.now() },
      ]);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        status === 429 ? "Too many messages — please wait a moment before sending more."
        : status === 504 ? "AI is taking too long to respond. Please try again."
        : status === 403 ? "You are not authorised to use chat."
        : status === 400 ? (err?.response?.data?.message || "Invalid message.")
        : "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        { _id: `err-${Date.now()}`, role: "error", content: msg, ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const charCount = input.length;
  const showCounter = charCount > 3000;
  const counterDanger = charCount > 3800;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

      {/* ── Widget Panel ── */}
      {open && (
        <div
          className="chat-widget-open mb-3 flex flex-col overflow-hidden rounded-2xl bg-surface"
          style={{
            width: "400px",
            height: "580px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 0 0 1px rgba(16,185,129,0.08)",
          }}
        >

          {/* Header */}
          <div
            className="flex flex-shrink-0 items-center justify-between px-4 py-3"
            style={{ background: "linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)" }}
          >
            <div className="flex items-center gap-3">
              {/* Avatar with glow ring */}
              <div className="relative flex-shrink-0">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-emerald/30"
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                >
                  AI
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-charcoal bg-emerald" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white leading-tight">LMS Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
                  <span className="text-[11px] text-white/50">Online · Powered by Groq</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ background: "#F9FAFB", scrollbarWidth: "thin", scrollbarColor: "#E5E7EB #F9FAFB" }}
          >

            {/* Welcome / empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center pt-6 pb-2 text-center">
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    boxShadow: "0 0 24px rgba(16,185,129,0.35)",
                  }}
                >
                  AI
                </div>
                <p className="mb-1 text-sm font-semibold text-brand-text">LMS Assistant</p>
                <p className="mb-5 px-4 text-xs text-brand-muted leading-relaxed">
                  Ask me about courses, progress, certificates, compliance, or team performance.
                </p>
                {/* Quick chips */}
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="rounded-full border border-emerald/30 bg-emerald-light px-3 py-1.5 text-xs font-medium text-emerald transition-all hover:bg-emerald hover:text-white hover:shadow-sm"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            <div className="space-y-3">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const isError = msg.role === "error";
                const ts = msg.ts || msg.createdAt;

                if (isError) {
                  return (
                    <div key={msg._id} className="chat-msg-in flex justify-start">
                      <div className="max-w-[82%] rounded-2xl rounded-bl-sm border-l-2 border-brand-danger bg-red-50 px-3 py-2 text-sm text-brand-danger">
                        <i className="fa-solid fa-circle-exclamation mr-1.5 text-xs" />
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                if (isUser) {
                  return (
                    <div key={msg._id} className="chat-msg-in flex flex-col items-end">
                      <div
                        className="max-w-[78%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm whitespace-pre-wrap"
                        style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                      >
                        {msg.content}
                      </div>
                      {ts && (
                        <span className="mt-1 text-[10px] text-brand-muted">{formatTime(ts)}</span>
                      )}
                    </div>
                  );
                }

                // Assistant message
                return (
                  <div key={msg._id} className="chat-msg-in flex flex-col items-start">
                    <div className="flex items-end gap-2">
                      <div
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                      >
                        AI
                      </div>
                      <div
                        className="max-w-[82%] rounded-2xl rounded-bl-sm border border-brand-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-brand-text whitespace-pre-wrap"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                      >
                        {msg.content}
                      </div>
                    </div>
                    {ts && (
                      <span className="ml-7 mt-1 text-[10px] text-brand-muted">{formatTime(ts)}</span>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {loading && (
                <div className="chat-msg-in flex items-end gap-2">
                  <div
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                  >
                    AI
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-sm border border-brand-border bg-surface px-4 py-3"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                  >
                    <div className="chat-dot-pulse flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-brand-muted" />
                      <span className="h-2 w-2 rounded-full bg-brand-muted" />
                      <span className="h-2 w-2 rounded-full bg-brand-muted" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-brand-border bg-surface px-3 pb-3 pt-2">
            {showCounter && (
              <div className={`mb-1 text-right text-[10px] ${counterDanger ? "text-brand-danger" : "text-brand-muted"}`}>
                {charCount}/{MAX_MSG_LEN}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                className="flex-1 resize-none rounded-2xl border border-brand-border bg-canvas px-3.5 py-2.5 text-sm text-brand-text transition-all focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20 disabled:opacity-50"
                style={{ minHeight: "40px", maxHeight: "96px" }}
                rows={1}
                placeholder="Ask anything…"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)" }}
              >
                <i className="fa-solid fa-paper-plane text-xs" style={{ transform: "rotate(-45deg)" }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB Toggle Button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? "Close chat" : "Open LMS Assistant"}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 hover:scale-110 ${
          open ? "ring-2 ring-emerald/40" : ""
        }`}
        style={{
          background: "linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)",
          boxShadow: open
            ? "0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(16,185,129,0.2)"
            : "0 8px 24px rgba(0,0,0,0.25)",
        }}
      >
        <i
          className={`fa-solid text-xl transition-all duration-300 ${
            open ? "fa-xmark rotate-90 scale-110" : "fa-robot"
          }`}
        />
      </button>
    </div>
  );
}
