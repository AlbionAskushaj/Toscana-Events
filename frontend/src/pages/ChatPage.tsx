import React, { useState, useEffect, useRef, useCallback } from "react";
import { getRooms, getMenuItems, createInquiry, streamChatMessage, requestChatSession } from "../api";
import type { ChatMessage, ChatInquiryPayload, RoomLayout, MenuItem, CreateInquiryPayload } from "../types";
import ChatBubble from "../components/ChatBubble";
import TypingIndicator from "../components/TypingIndicator";
import LiveInquiryForm from "../components/LiveInquiryForm";
import ToscanaLogo from "../assets/ToscanaMainLogo.png";

const CHAT_STORAGE_KEY = "toscana:chat:v1";
const SESSION_TOKEN_KEY = "toscana:chat:token:v1";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement | string,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface StoredSessionToken {
  token: string;
  sid: string;
  exp: number;
}

function loadSessionToken(currentSid: string): string | null {
  try {
    const raw = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredSessionToken;
    if (stored.sid !== currentSid) return null;
    if (Date.now() > stored.exp - 60_000) return null;
    return stored.token;
  } catch {
    return null;
  }
}

function saveSessionToken(token: string, sid: string) {
  const stored: StoredSessionToken = { token, sid, exp: Date.now() + 55 * 60 * 1000 };
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(stored));
  } catch {}
}

function clearSessionToken() {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

const OPENING_MESSAGE: ChatMessage = {
  id: "opening",
  role: "assistant",
  content:
    "Welcome to Toscana Italian Grill. I'm your private dining concierge — I'd love to help you plan something unforgettable. What's the occasion?",
};

function loadSession(): { messages: ChatMessage[]; sessionId: string } {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { messages: [OPENING_MESSAGE], sessionId: crypto.randomUUID() };
}

function saveSession(messages: ChatMessage[], sessionId: string) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, sessionId }));
  } catch {}
}

const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconMagic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChatPage: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [introExiting, setIntroExiting] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const [inquiryFields, setInquiryFields] = useState<Partial<ChatInquiryPayload>>({});
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  const [rooms, setRooms] = useState<RoomLayout[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    setMessages(session.messages);
    setSessionId(session.sessionId);
    const existingToken = loadSessionToken(session.sessionId);
    if (existingToken) setSessionToken(existingToken);
    // Skip intro for returning users with an active session AND a valid token
    if (session.messages.length > 1 && existingToken) {
      setShowIntro(false);
    }
    getRooms().then(setRooms).catch(console.error);
    getMenuItems({ active: true }).then(setAllMenuItems).catch(console.error);
  }, []);

  // Mount Turnstile widget on the intro screen when we need a session token
  useEffect(() => {
    if (!showIntro) return;
    if (sessionToken) return;
    if (!TURNSTILE_SITE_KEY) return;
    if (!turnstileContainerRef.current) return;

    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (!window.turnstile) {
        setTimeout(tryRender, 200);
        return;
      }
      if (turnstileWidgetIdRef.current) return;
      const container = turnstileContainerRef.current;
      if (!container) return;
      turnstileWidgetIdRef.current = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: "interaction-only",
        callback: (token: string) => setTurnstileToken(token),
        "error-callback": () => setVerifyError("Verification failed. Please refresh and try again."),
        "expired-callback": () => setTurnstileToken(null),
      });
    };
    tryRender();
    return () => {
      cancelled = true;
      if (window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [showIntro, sessionToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const handleBeginPlanning = async () => {
    setVerifyError("");
    if (!sessionToken) {
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        setVerifyError("Please complete the verification check above before continuing.");
        return;
      }
      setIsVerifying(true);
      try {
        const token = await requestChatSession(sessionId, turnstileToken);
        setSessionToken(token);
        saveSessionToken(token, sessionId);
      } catch (err) {
        setVerifyError(err instanceof Error ? err.message : "Verification failed.");
        if (window.turnstile && turnstileWidgetIdRef.current) {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        }
        setTurnstileToken(null);
        setIsVerifying(false);
        return;
      }
      setIsVerifying(false);
    }
    setIntroExiting(true);
    setTimeout(() => {
      setShowIntro(false);
      setIntroExiting(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, 480);
  };

  const handleFieldUpdate = useCallback((update: Partial<ChatInquiryPayload>) => {
    setInquiryFields((prev) => ({ ...prev, ...update }));
    const keys = Object.keys(update);
    setHighlightedFields(keys);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedFields([]), 1600);
  }, []);

  const handleUserFieldChange = useCallback((update: Partial<ChatInquiryPayload>) => {
    setInquiryFields((prev) => ({ ...prev, ...update }));
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      if (!sessionToken) {
        setShowIntro(true);
        return;
      }

      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
      const nextMessages: ChatMessage[] = [...messages, userMessage];
      const streamingId = crypto.randomUUID();

      setMessages([...nextMessages, { id: streamingId, role: "assistant", content: "" }]);
      setInput("");
      setIsStreaming(true);

      const payload = nextMessages.slice(-30);
      let assistantContent = "";
      const controller = new AbortController();
      abortRef.current = controller;

      streamChatMessage(
        payload,
        sessionId,
        sessionToken,
        (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, role: "assistant", content: assistantContent };
            return updated;
          });
        },
        handleFieldUpdate,
        () => {
          setIsStreaming(false);
          abortRef.current = null;
          const finalMessages: ChatMessage[] = [
            ...nextMessages,
            { id: streamingId, role: "assistant" as const, content: assistantContent },
          ];
          setMessages(finalMessages);
          saveSession(finalMessages, sessionId);
        },
        (err) => {
          console.error("[chat] stream error", err);
          setIsStreaming(false);
          abortRef.current = null;
          const expired = /expired|please refresh/i.test(err.message);
          if (expired) {
            clearSessionToken();
            setSessionToken(null);
            setShowIntro(true);
          }
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: expired
              ? "Your session has timed out — please verify again to continue."
              : "I'm sorry, something went wrong. Please try again.",
          };
          const finalMessages = [...nextMessages, errorMessage];
          setMessages(finalMessages);
          saveSession(finalMessages, sessionId);
        },
        controller.signal,
      );
    },
    [messages, isStreaming, sessionId, sessionToken, handleFieldUpdate],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await createInquiry(inquiryFields as CreateInquiryPayload);
      setSubmitted(true);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    if (!window.confirm("This will clear your conversation and form. Are you sure?")) return;
    abortRef.current?.abort();
    localStorage.removeItem(CHAT_STORAGE_KEY);
    clearSessionToken();
    setSessionToken(null);
    setTurnstileToken(null);
    setVerifyError("");
    setMessages([OPENING_MESSAGE]);
    setSessionId(crypto.randomUUID());
    setInquiryFields({});
    setHighlightedFields([]);
    setSubmitted(false);
    setSubmitError("");
    setInput("");
    setIsStreaming(false);
    setShowIntro(true);
    setIntroExiting(false);
  };

  return (
    <div className="page page-chat">
      {showIntro ? (
        <div className={`chat-intro${introExiting ? " chat-intro--exit" : ""}`}>
          <div className="chat-intro__card">
            <img src={ToscanaLogo} alt="Toscana Italian Grill" className="chat-intro__logo" />
            <h1 className="chat-intro__headline">Private Dining, Curated.</h1>
            <p className="chat-intro__sub">
              Your personal concierge will guide you through every detail.
            </p>
            <div className="chat-intro__divider" aria-hidden="true" />
            <div className="chat-intro__steps">
              <div className="chat-intro__step">
                <div className="chat-intro__step-icon">
                  <IconChat />
                </div>
                <div className="chat-intro__step-label">Tell us your vision</div>
                <div className="chat-intro__step-desc">
                  Chat naturally about your event, occasion, and preferences.
                </div>
              </div>
              <div className="chat-intro__step">
                <div className="chat-intro__step-icon">
                  <IconMagic />
                </div>
                <div className="chat-intro__step-label">We curate your event</div>
                <div className="chat-intro__step-desc">
                  Room recommendation, menu selection, and live pricing — all in real time.
                </div>
              </div>
              <div className="chat-intro__step">
                <div className="chat-intro__step-icon">
                  <IconCheck />
                </div>
                <div className="chat-intro__step-label">Review &amp; confirm</div>
                <div className="chat-intro__step-desc">
                  Edit any detail on the live form, then submit when you're ready.
                </div>
              </div>
            </div>
            {TURNSTILE_SITE_KEY && !sessionToken && (
              <div className="chat-intro__verify" ref={turnstileContainerRef} />
            )}
            {verifyError && (
              <div
                className="alert alert-danger py-2 px-3"
                style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}
              >
                {verifyError}
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary chat-intro__cta"
              onClick={handleBeginPlanning}
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying…" : "Begin Planning"}
              {!isVerifying && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-split">
          {/* Left: Chat */}
          <div className="chat-split__pane chat-split__pane--chat">
            <div className="chat-split-header">
              <div className="chat-split-header__avatar">T</div>
              <div>
                <div className="chat-split-header__name">Toscana Concierge</div>
                <div className="chat-split-header__status">
                  {isStreaming ? "Typing…" : "Online · here to help"}
                </div>
              </div>
            </div>
            <div className="chat-panel">
              <div className="chat-window" ref={scrollRef}>
                {messages.map((msg, i) => (
                  <ChatBubble key={msg.id ?? i} role={msg.role} content={msg.content} />
                ))}
                {isStreaming && messages[messages.length - 1]?.content === "" && (
                  <TypingIndicator />
                )}
              </div>

              {!submitted && (
                <>
                  <div className="chat-input-row">
                    <textarea
                      ref={textareaRef}
                      className="chat-input"
                      rows={2}
                      placeholder="Type your message…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isStreaming}
                    />
                    <button
                      type="button"
                      className="btn btn-primary chat-send-btn"
                      onClick={() => sendMessage(input)}
                      disabled={isStreaming || !input.trim()}
                      aria-label="Send"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                  <p className="chat-hint">
                    <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
                  </p>
                </>
              )}

              {submitted && (
                <div className="chat-input-row chat-input-row--disabled">
                  <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                    Your inquiry has been submitted — check the form on the right.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live inquiry form */}
          <div className="chat-split__pane chat-split__pane--form">
            <LiveInquiryForm
              fields={inquiryFields}
              highlightedFields={highlightedFields}
              rooms={rooms}
              allMenuItems={allMenuItems}
              onFieldChange={handleUserFieldChange}
              onSubmit={handleSubmit}
              onStartOver={handleStartOver}
              submitted={submitted}
              submitError={submitError}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
