import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/api";

const SESSION_KEY = "lms_chat_session_id";

function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getOrCreateSessionId() {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = generateSessionId();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

export default function ChatWidget({ mode = "staff" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const bottomRef = useRef(null);

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

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { _id: `u-${Date.now()}`, role: "user", content: text },
    ]);
    setLoading(true);

    try {
      const res = await api.post("/chat/message", { message: text, sessionId, mode });
      setMessages((prev) => [
        ...prev,
        { _id: `a-${Date.now()}`, role: "assistant", content: res.data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          _id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
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

  const isAdmin = mode === "admin";
  const botName = isAdmin ? "Admin Assistant" : "Learning Assistant";
  const welcomeMsg = isAdmin
    ? "Ask me about staff training progress, compliance status, overdue courses, or certificate analytics."
    : "Ask me about your courses, certificates, due dates, or training progress.";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div
          className="mb-3 flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-surface shadow-2xl"
          style={{ width: "384px", height: "520px" }}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between bg-charcoal px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{botName}</p>
                <p className="text-xs text-white/50">Powered by Groq · Llama 3.3</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 transition-colors hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-3">
            {messages.length === 0 && (
              <div className="mt-6 px-4 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-muted">
                  <i className="fa-solid fa-robot text-lg text-emerald" />
                </div>
                <p className="mb-1 font-medium text-brand-text text-sm">{botName}</p>
                <p className="text-xs text-brand-muted">{welcomeMsg}</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg._id || msg.createdAt}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "rounded-br-none bg-charcoal text-white"
                      : "rounded-bl-none border border-brand-border bg-surface text-brand-text"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl rounded-bl-none border border-brand-border bg-surface px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-brand-border bg-surface px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 resize-none rounded-xl border border-brand-border bg-canvas px-3 py-2 text-sm text-brand-text transition-colors focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/20 disabled:opacity-50"
                rows={2}
                placeholder="Type your message… (Enter to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald text-white transition-colors hover:bg-emerald-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i className="fa-solid fa-paper-plane text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-charcoal-light"
        title={open ? "Close chat" : `Open ${botName}`}
      >
        {open ? (
          <i className="fa-solid fa-xmark text-xl" />
        ) : (
          <i className="fa-solid fa-robot text-xl" />
        )}
      </button>
    </div>
  );
}
