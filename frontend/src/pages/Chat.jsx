import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, Sparkles, Bot, User, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import ModelPicker from "@/components/ModelPicker";

const STARTERS = [
  "Which is better for gaming under ₹40,000: Redmi Note or realme?",
  "Compare Sony WH-1000XM5 vs Bose QC Ultra on price and reviews.",
  "Best truly wireless earbuds under ₹5,000 for calls?",
  "Is the OnePlus 15 worth ₹85,999 today?",
];

/**
 * Ask SMART BUY — grounded conversational chat page.
 * Streams tokens over SSE. Every claim is grounded in real DB records only.
 */
export default function Chat() {
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [model, setModel] = useState("openai");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialQ);
  const [streaming, setStreaming] = useState(false);
  const [meta, setMeta] = useState(null);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (initialQ) {
      // Auto-send if the user landed with ?q=
      // Small timeout to ensure state is committed
      const t = setTimeout(() => send(initialQ), 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "", pending: true }]);
    setStreaming(true);

    // Extract likely product query from user text — first quoted phrase or first 40 chars
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: meta?.session_id,
          messages: nextMessages,
          model,
          query: text.slice(0, 80),
        }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        throw new Error(errText || `HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assembled = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const json = JSON.parse(line.slice(6));
          if (json.type === "meta") setMeta(json);
          else if (json.type === "delta") {
            assembled += json.content;
            setMessages((prev) => {
              const copy = prev.slice();
              copy[copy.length - 1] = { role: "assistant", content: assembled, pending: true, model: meta?.model };
              return copy;
            });
          } else if (json.type === "done") {
            setMessages((prev) => {
              const copy = prev.slice();
              copy[copy.length - 1] = { role: "assistant", content: json.full_text, pending: false, model: meta?.model };
              return copy;
            });
          } else if (json.type === "error") {
            throw new Error(json.message || "AI stream failed");
          }
        }
      }
    } catch (e) {
      if (e.name === "AbortError") return;
      toast.error(e.message || "Chat failed");
      setMessages((prev) => prev.slice(0, -1)); // drop pending assistant bubble
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, messages, model, meta]);

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const clear = () => {
    setMessages([]);
    setMeta(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-up">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="eyebrow mb-1">Ask SMART BUY</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Chat with an analyst that <span className="italic text-accent">only cites real data.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ModelPicker value={model} onChange={setModel} />
            {messages.length > 0 && (
              <button onClick={clear} className="btn-secondary text-xs" data-testid="chat-clear">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
        {meta && (
          <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Model: {meta.model} · Grounded in {meta.context_products || 0} real product record(s)
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="rounded-2xl border border-border bg-card card-elevated min-h-[400px] max-h-[60vh] overflow-y-auto p-5 sm:p-7 space-y-5"
        data-testid="chat-scroll"
      >
        {messages.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/30">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div className="font-display text-lg font-semibold">What are you shopping for?</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              I'll only answer using real products SMART BUY has fetched from Google Shopping and real customer reviews from Amazon.in. If I don't have enough evidence, I'll say so.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto pt-3">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-left text-sm p-3 rounded-lg border border-border hover:border-foreground/30 hover:bg-secondary/60 transition-colors"
                  data-testid={`starter-${s.slice(0, 20)}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} pending={m.pending} />
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="mt-4 relative rounded-xl border border-border bg-card focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 transition-all"
      >
        <input
          data-testid="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any real product… e.g. Which is better for me?"
          className="w-full pl-4 pr-28 py-3.5 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/70"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            data-testid="chat-stop"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-secondary text-foreground px-3 py-2 rounded-lg text-sm font-semibold hover:bg-border"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            data-testid="chat-send"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-semibold hover:bg-accent disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        )}
      </form>
      <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">
        Real data only · No fabricated products or reviews
      </p>
    </div>
  );
}

function Bubble({ role, content, pending }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`h-8 w-8 rounded-full border border-border flex-shrink-0 flex items-center justify-center ${isUser ? "bg-foreground text-background" : "bg-secondary"}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-accent" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser ? "bg-foreground text-background rounded-tr-sm" : "bg-secondary/50 text-foreground rounded-tl-sm"
      }`}>
        {content || (pending ? <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> thinking…</span> : "")}
      </div>
    </div>
  );
}
