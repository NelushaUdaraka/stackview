import { useState } from "react";
import type { EbBus } from '../../types';
import { RefreshCw, Play, Send, Settings, Check, Copy } from "lucide-react";

interface Props {
  bus: EbBus;
  showToast: (type: "success" | "error", text: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded hover:bg-raised text-3 hover:text-1 transition-colors"
    >
      {copied ? (
        <Check size={13} className="text-emerald-500" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

export default function EbPutEvents({ bus, showToast }: Props) {
  const [source, setSource] = useState("com.myapp");
  const [detailType, setDetailType] = useState("OrderCreated");
  const [detail, setDetail] = useState(
    '{\n  "orderId": "123",\n  "amount": 99.99\n}',
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    // Validate JSON
    try {
      if (detail.trim()) JSON.parse(detail);
    } catch (e) {
      showToast("error", "Detail payload must be valid JSON.");
      return;
    }

    setSending(true);
    try {
      const res = await window.electronAPI.ebPutEvents(bus.name, [
        {
          source,
          detailType,
          detail: detail.trim() || "{}",
        },
      ]);

      if (res.success) {
        if (res.data === 0) {
          showToast("success", "Event sent successfully!");
        } else {
          showToast("error", `Sent event, but ${res.data} entries failed.`);
        }
      } else {
        showToast("error", res.error || "Failed to send event");
      }
    } catch (error: any) {
      showToast("error", error.message);
    }
    setSending(false);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(detail);
      setDetail(JSON.stringify(parsed, null, 2));
    } catch (e) {
      showToast("error", "Invalid JSON to format");
    }
  };

  const EXAMPLE_EVENTS = [
    {
      label: "Order",
      source: "my.shop",
      type: "OrderCreated",
      detail: { id: "123", total: 45.99 },
    },
    {
      label: "User",
      source: "my.auth",
      type: "UserLogin",
      detail: { userId: "usr_1", ip: "1.2.3.4" },
    },
    {
      label: "System",
      source: "my.monitor",
      type: "HealthCheck",
      detail: { status: "OK", uptime: 3600 },
    },
  ];

  return (
    <div className="pt-1 px-1 pb-4 h-full overflow-auto space-y-3 animate-in fade-in duration-300">
      <div className="card !p-4 space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider">
          <Settings size={14} className="text-fuchsia-500" /> Event Bus Details
        </h3>
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-bold text-4 uppercase tracking-wider w-24 shrink-0">
            ARN
          </p>
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-xs text-1 break-all">
              {bus.arn}
            </span>
            <CopyButton text={bus.arn} />
          </div>
        </div>
      </div>

      <div className="card !p-5 space-y-4 border-fuchsia-500/20 shadow-sm relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 100% 0%, rgb(192 38 211), transparent 40%)",
          }}
        />
        <h3 className="text-xs font-bold text-2 flex items-center gap-2 uppercase tracking-wider relative">
          <Send size={14} className="text-fuchsia-500" /> Put Custom Event to
          Bus
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          <div className="relative">
            <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">
              Event Source *
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. com.mycompany.service"
              className="input-base w-full text-sm font-medium"
            />
          </div>
          <div className="relative">
            <label className="block text-[11px] font-bold text-3 mb-1.5 ml-1">
              Detail Type *
            </label>
            <input
              type="text"
              value={detailType}
              onChange={(e) => setDetailType(e.target.value)}
              placeholder="e.g. OrderCreated"
              className="input-base w-full text-sm font-medium"
            />
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-3 ml-1 uppercase tracking-tight">
              Detail Payload (JSON) *
            </label>
            <button
              type="button"
              onClick={formatJson}
              className="text-[10px] text-fuchsia-500 hover:text-fuchsia-400 font-bold uppercase"
            >
              Format JSON
            </button>
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="JSON event payload..."
            rows={8}
            className="input-base w-full text-sm font-mono resize-none leading-relaxed"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-[10px] text-4 font-bold uppercase tracking-widest mr-1 mt-1.5">
              Examples:
            </span>
            {EXAMPLE_EVENTS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setSource(ex.source);
                  setDetailType(ex.type);
                  setDetail(JSON.stringify(ex.detail, null, 2));
                }}
                className="px-2.5 py-1 text-[10px] bg-raised border border-theme rounded text-2 hover:border-fuchsia-500/50 hover:text-fuchsia-500 transition-all font-medium"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end relative">
          <button
            onClick={handleSend}
            disabled={sending || !source.trim() || !detailType.trim()}
            className="btn-primary gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-sm disabled:opacity-50"
          >
            {sending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            Put Event
          </button>
        </div>
      </div>
    </div>
  );
}
