import React, { useState } from 'react';
import { Check, Copy, MessageCircle, Send, X } from 'lucide-react';

interface WhatsAppModalProps {
  title: string;
  recipientLabel: string;
  message: string;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  title,
  recipientLabel,
  message,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateSend = () => {
    setSent(true);
    setTimeout(() => {
      onClose();
    }, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header WhatsApp Emerald */}
        <div className="flex items-center justify-between bg-emerald-700 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">{title}</h3>
              <p className="text-xs text-emerald-100">{recipientLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-100 transition hover:bg-white/15 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat bubble preview */}
        <div className="bg-[#EFEAE2] p-5">
          <div className="rounded-xl rounded-tl-none bg-[#DCF8C6] p-4 text-[13px] leading-relaxed text-slate-900 shadow-xs">
            <pre className="whitespace-pre-wrap font-sans">{message}</pre>
            <div className="mt-2 text-right text-[11px] font-medium text-emerald-800/70">
               Généré automatiquement par ShopFlow ✓✓
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 bg-white px-5 py-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Copier le texte</span>
              </>
            )}
          </button>

          <button
            onClick={handleSimulateSend}
            disabled={sent}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:bg-emerald-500"
          >
            {sent ? (
              <>
                <Check className="h-4 w-4" />
                <span>Message prêt pour WhatsApp !</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Envoyer sur WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
