import React, { useRef, useState } from 'react';
import { toBlob, toPng } from 'html-to-image';
import {
  Check,
  Clock,
  Download,
  Edit3,
  Info,
  Instagram,
  MapPin,
  MessageCircle,
  Printer,
  ReceiptText,
  Share2,
  ShoppingCart,
  Smartphone,
  Truck,
  X,
} from 'lucide-react';
import { SHOPFLOW_APP_LOGO } from '../data/initialData';
import { ShopSettings, VisualReceiptPayload } from '../types';

interface VisualReceiptModalProps {
  settings: ShopSettings;
  receipt: VisualReceiptPayload;
  onClose: () => void;
}

/**
 * Formats amounts in the exact receipt style shown in the user's model:
 * e.g. "7 000 CDF" or "12,50 USD"
 */
function formatReceiptCurrency(
  amountFC: number,
  currency: ShopSettings['currency'],
  usdRateFC: number
): string {
  if (currency === 'USD') {
    const val = amountFC / (usdRateFC || 2850);
    return `${val.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }
  return `${Math.round(amountFC).toLocaleString('fr-FR')} CDF`;
}

/**
 * Generates deterministic crisp SVG barcode bars for any invoice code
 */
const BarcodeSvg: React.FC<{ code: string }> = ({ code }) => {
  const bars: number[] = [];
  for (let i = 0; i < code.length * 4; i++) {
    const charCode = code.charCodeAt(i % code.length);
    const width = ((charCode + i * 7) % 3) + 1;
    bars.push(width);
  }

  let currentX = 0;
  return (
    <div className="inline-flex flex-col items-center">
      <svg
        width="156"
        height="42"
        viewBox="0 0 156 42"
        className="overflow-visible"
        aria-label={`Code-barres ${code}`}
      >
        {bars.map((w, idx) => {
          const x = currentX;
          currentX += w + (idx % 2 === 0 ? 1.5 : 2.3);
          if (x > 152) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={w}
              height={40}
              fill="#0B0F19"
            />
          );
        })}
      </svg>
      <span className="mt-1 font-mono text-[10px] font-semibold tracking-widest text-slate-800">
        {code}
      </span>
    </div>
  );
};

type ReceiptPaperSize = '58mm' | '80mm' | 'A4';

const getSavedPaperSize = (): ReceiptPaperSize => {
  try {
    const saved = localStorage.getItem('shopflow_receipt_paper_size_v1');
    return saved === '58mm' || saved === '80mm' || saved === 'A4' ? saved : '80mm';
  } catch {
    return '80mm';
  }
};

export const VisualReceiptModal: React.FC<VisualReceiptModalProps> = ({
  settings,
  receipt,
  onClose,
}) => {
  const receiptSheetRef = useRef<HTMLDivElement | null>(null);

  // Editable fields live right before export so merchant can customize client info in 1 second!
  const [customerName, setCustomerName] = useState(receipt.customerName);
  const [customerPhone, setCustomerPhone] = useState(receipt.customerPhone);
  const [customerAddress, setCustomerAddress] = useState(
    receipt.customerAddress
  );
  const [deliveryFeeFC, setDeliveryFeeFC] = useState(receipt.deliveryFeeFC);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [paperSize, setPaperSize] = useState<ReceiptPaperSize>(getSavedPaperSize);

  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const subtotalFC = receipt.items.reduce(
    (sum, item) => sum + item.unitPriceFC * item.quantity,
    0
  );
  const grandTotalFC = subtotalFC + Math.max(0, deliveryFeeFC);

  const fmt = (val: number) =>
    formatReceiptCurrency(val, settings.currency, settings.usdRateFC);

  const shopInitials = settings.shopName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  const barcodeValue = `SF${receipt.invoiceNumber.replace(/\D/g, '')}2026`;

  const handleDownloadPng = async () => {
    if (!receiptSheetRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(receiptSheetRef.current, {
        pixelRatio: 2.2,
        cacheBust: true,
        backgroundColor: '#FAFAFA',
      });
      const link = document.createElement('a');
      link.download = `Recu-${settings.shopName.replace(/\s+/g, '-')}-${receipt.invoiceNumber}.png`;
      link.href = dataUrl;
      link.click();
      setExportStatus('Image PNG HD téléchargée !');
      setTimeout(() => setExportStatus(null), 3000);
    } catch {
      setExportStatus('Utilisez Imprimer/PDF si votre navigateur bloque le téléchargement.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsAppImage = async () => {
    if (!receiptSheetRef.current) return;
    setIsExporting(true);

    const caption =
      `🧾 *REÇU DE VENTE ${receipt.invoiceNumber}* — *${settings.shopName}*\n` +
      `Client : ${customerName}\n` +
      `Total payé : *${fmt(grandTotalFC)}*\n` +
      `Merci pour votre confiance ! 🙏`;

    try {
      const blob = await toBlob(receiptSheetRef.current, {
        pixelRatio: 2.2,
        cacheBust: true,
        backgroundColor: '#FAFAFA',
      });

      if (blob) {
        const file = new File(
          [blob],
          `Recu-${receipt.invoiceNumber.replace('#', '')}.png`,
          { type: 'image/png' }
        );

        // Native Mobile Share Sheet with actual PNG file -> sends straight into WhatsApp!
        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            files: [file],
            title: `Reçu ${settings.shopName}`,
            text: caption,
          });
          setExportStatus('Reçu image partagé sur WhatsApp !');
          setIsExporting(false);
          return;
        }

        // Desktop fallback: download the crisp PNG automatically + open WhatsApp Web/App chat!
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = file.name;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }

      const cleanDigits = customerPhone.replace(/\D/g, '');
      const waUrl = cleanDigits
        ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(caption)}`
        : `https://wa.me/?text=${encodeURIComponent(caption)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setExportStatus(
        'Image PNG téléchargée + Discussion WhatsApp ouverte ! Glissez l’image dedans.'
      );
      setTimeout(() => setExportStatus(null), 4000);
    } catch {
      setExportStatus('Partage annulé ou image enregistrée.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-xs md:p-6">
      {/* Top Action Toolbar */}
      <div className="sticky top-0 z-20 mb-3 flex w-full max-w-[700px] flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-white shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-2 text-[11px] font-bold text-slate-200">
            Papier
            <select
              aria-label="Format du papier du reçu"
              value={paperSize}
              onChange={(event) => {
                const size = event.target.value as ReceiptPaperSize;
                setPaperSize(size);
                try { localStorage.setItem('shopflow_receipt_paper_size_v1', size); } catch { /* Keep the current choice for this receipt. */ }
              }}
              className="max-w-24 bg-transparent text-white outline-none"
            >
              <option value="58mm" className="text-slate-900">Rouleau 58 mm</option>
              <option value="80mm" className="text-slate-900">Rouleau 80 mm</option>
              <option value="A4" className="text-slate-900">A4</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowQuickEdit((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            <Edit3 className="h-3.5 w-3.5 text-sky-400" />
            <span>{showQuickEdit ? 'Masquer infos' : 'Infos client / livraison'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Image PNG</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            <Printer className="h-3.5 w-3.5 text-slate-300" />
            <span>Imprimer</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsAppImage}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 disabled:bg-emerald-400"
          >
            <Share2 className="h-4 w-4" />
            <span>
              {isExporting ? 'Génération HD...' : 'Envoyer sur WhatsApp'}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="mb-3 flex w-full max-w-[700px] items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg">
          <Check className="h-4 w-4 shrink-0" />
          <span>{exportStatus}</span>
        </div>
      )}

      {/* Optional Live Client / Delivery Customizer Drawer */}
      {showQuickEdit && (
        <div className="mb-3 grid w-full max-w-[700px] grid-cols-1 gap-2.5 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-xs text-white sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-400">
              Nom du client
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-400">
              Téléphone WhatsApp
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-400">
              Adresse / Livraison
            </label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-semibold text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-400">
              Livraison (FC)
            </label>
            <input
              type="number"
              min="0"
              value={deliveryFeeFC}
              onChange={(e) => setDeliveryFeeFC(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-bold text-white tabular-nums"
            />
          </div>
        </div>
      )}

      <style>{`
        #receipt-paper-sheet[data-paper-size="58mm"] .grid-cols-12, #receipt-paper-sheet[data-paper-size="80mm"] .grid-cols-12 { display: flex; flex-direction: column; gap: 8px; }
        #receipt-paper-sheet[data-paper-size="58mm"] [class*="col-span-"], #receipt-paper-sheet[data-paper-size="80mm"] [class*="col-span-"] { width: 100%; }
        #receipt-paper-sheet[data-paper-size="58mm"] .grid-cols-12 > *, #receipt-paper-sheet[data-paper-size="80mm"] .grid-cols-12 > * { border-left: 0; padding-left: 0; }
        @media print {
          @page { size: ${paperSize === 'A4' ? 'A4' : `${paperSize} auto`}; margin: 0; }
          body * { visibility: hidden !important; }
          #receipt-paper-sheet, #receipt-paper-sheet * { visibility: visible !important; }
          #receipt-paper-sheet { position: fixed !important; top: 0 !important; left: 0 !important; margin: 0 !important; max-width: none !important; box-shadow: none !important; overflow: visible !important; }
          #receipt-paper-sheet[data-paper-size="58mm"] { width: 58mm !important; padding: 3mm !important; font-size: 9px !important; }
          #receipt-paper-sheet[data-paper-size="80mm"] { width: 80mm !important; padding: 4mm !important; font-size: 10px !important; }
          #receipt-paper-sheet[data-paper-size="A4"] { width: 200mm !important; padding: 8mm !important; }
          #receipt-paper-sheet[data-paper-size="58mm"] .grid-cols-12, #receipt-paper-sheet[data-paper-size="80mm"] .grid-cols-12 { display: flex !important; flex-direction: column !important; gap: 2mm !important; }
          #receipt-paper-sheet[data-paper-size="58mm"] [class*="col-span-"], #receipt-paper-sheet[data-paper-size="80mm"] [class*="col-span-"] { width: 100% !important; }
          #receipt-paper-sheet[data-paper-size="58mm"] .grid-cols-12 > *, #receipt-paper-sheet[data-paper-size="80mm"] .grid-cols-12 > * { border-left: 0 !important; padding-left: 0 !important; }
          #receipt-paper-sheet img { max-width: 18mm; }
          #receipt-paper-sheet svg { max-width: 100%; }
        }
      `}</style>

      {/* =====================================================================
          Receipt sheet, sized for the selected thermal roll or A4 paper
          Scrollable horizontally on narrow phones so exact proportion stays crisp!
         ===================================================================== */}
      <div className="w-full max-w-[700px] overflow-x-auto rounded-2xl shadow-2xl">
        <div
          id="receipt-paper-sheet"
          ref={receiptSheetRef}
          data-paper-size={paperSize}
          className="mx-auto max-w-full bg-[#FAFAFA] text-[#14181F] shadow-lg print:shadow-none"
          style={{
            width: paperSize === '58mm' ? '220px' : paperSize === '80mm' ? '302px' : '680px',
            padding: paperSize === '58mm' ? '12px' : paperSize === '80mm' ? '16px' : '32px',
          }}
        >
          {/* 1. TOP STORE HEADER (Shop Logo Circle + Shop Name & Slogan + Right Contact Column) */}
          <div className="grid grid-cols-12 items-center gap-4 pb-6">
            {/* Left: Shop Custom Circular Logo */}
            <div className="col-span-2 flex justify-start">
              {settings.shopLogo ? (
                <img
                  src={settings.shopLogo}
                  alt={settings.shopName}
                  className="h-20 w-20 rounded-full border-2 border-slate-900 object-cover shadow-xs"
                />
              ) : (
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-slate-900 bg-gradient-to-br from-[#081844] via-[#0A4DFF] to-[#00B4FF] text-white shadow-xs">
                  <span className="text-xl font-black tracking-tight">
                    {shopInitials || 'SF'}
                  </span>
                  <span className="text-[8px] font-bold tracking-widest uppercase opacity-90">
                    STORE
                  </span>
                </div>
              )}
            </div>

            {/* Center: Shop Title, Specialty Bullets, Italic Underlined Slogan */}
            <div className="col-span-6 text-center">
              <h1 className="text-[24px] leading-tight font-black tracking-wide text-[#0F172A] uppercase">
                {settings.shopName}
              </h1>
              <p className="mt-1 text-[9.5px] font-extrabold tracking-[0.14em] text-slate-700 uppercase">
                {settings.shopSpecialties}
              </p>
              <div className="mt-1.5 inline-block">
                <p className="font-serif text-[15px] italic font-semibold text-slate-900">
                  {settings.shopTagline}
                </p>
                <svg
                  viewBox="0 0 180 8"
                  className="mx-auto -mt-0.5 h-2 w-36 text-[#C81E1E]"
                >
                  <path
                    d="M4 6 Q 90 1, 176 3"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Right: 4 Contact Details with crisp dark badges */}
            <div className="col-span-4 space-y-1.5 pl-2 text-[10.5px] leading-snug text-slate-800">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-900" />
                <span className="font-medium">{settings.city}, RDC</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-slate-900" />
                <span className="font-semibold tabular-nums">
                  {settings.whatsappNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="h-3.5 w-3.5 shrink-0 text-slate-900" />
                <span className="font-medium">{settings.instagramHandle}</span>
              </div>
              <div className="flex items-start gap-2">
                <ShoppingCart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-900" />
                <span className="font-medium">{settings.businessActivity}</span>
              </div>
            </div>
          </div>

          {/* 2. GRAY INVOICE BANNER ("REÇU DE VENTE" | N° Facture, Date, Vendeur) */}
          <div className="grid grid-cols-12 items-center rounded-xl bg-[#EEF0F3] px-6 py-4">
            <div className="col-span-7 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-slate-900">
                <ReceiptText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] leading-none font-black tracking-tight text-slate-950 uppercase">
                  REÇU DE VENTE
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-700">
                  Merci pour votre achat !
                </p>
              </div>
            </div>

            <div className="col-span-5 space-y-1 border-l border-slate-400/70 pl-5 text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="font-bold text-slate-800">N° Facture :</span>
                <span className="font-mono font-semibold text-slate-900">
                  {receipt.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-bold text-slate-800">Date :</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {receipt.dateTime}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="font-bold text-slate-800">Vendeur :</span>
                <span className="truncate font-semibold text-slate-900 uppercase">
                  {settings.shopName}
                </span>
              </div>
            </div>
          </div>

          {/* 3. CLIENT & MODE DE PAIEMENT TWO-COLUMN SECTION */}
          <div className="my-5 grid grid-cols-12 gap-6 px-1 text-xs">
            {/* Client Column */}
            <div className="col-span-6 space-y-1.5">
              <h3 className="text-xs font-extrabold text-slate-950">Client :</h3>
              <p className="text-slate-800">
                <span className="text-slate-600">Nom : </span>
                <strong className="font-semibold text-slate-950">
                  {customerName}
                </strong>
              </p>
              <p className="text-slate-800 tabular-nums">
                <span className="text-slate-600">Téléphone : </span>
                <span className="font-medium">{customerPhone}</span>
              </p>
              <p className="text-slate-800">
                <span className="text-slate-600">Adresse : </span>
                <span className="font-medium">{customerAddress}</span>
              </p>
            </div>

            {/* Payment Method Column */}
            <div className="col-span-6 space-y-1.5 border-l border-slate-300 pl-6">
              <h3 className="text-xs font-extrabold text-slate-950">
                Mode de paiement :
              </h3>
              <div className="flex items-center gap-2 font-medium text-slate-900">
                <Smartphone className="h-4 w-4 shrink-0 text-slate-900" />
                <span>{receipt.paymentMethodLabel}</span>
              </div>
              <p className="text-slate-800">
                <span className="text-slate-600">Référence : </span>
                <span className="font-mono font-medium">
                  {receipt.paymentReference}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Statut :</span>
                {receipt.isPaid ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    Payé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                    <Clock className="h-3.5 w-3.5" />À Crédit (Bon)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4. DARK PRODUCT TABLE WITH REAL ITEM PHOTOS */}
          <div className="mt-2">
            <div className="grid grid-cols-12 items-center rounded-md bg-[#1F242B] px-3.5 py-2.5 text-[11px] font-bold text-white">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Produit</div>
              <div className="col-span-2 text-center">Quantité</div>
              <div className="col-span-2 text-right">Prix unitaire</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="divide-y divide-slate-200 border-b border-slate-300">
              {receipt.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center px-3.5 py-3 text-xs"
                >
                  <div className="col-span-1 font-bold text-slate-800">
                    {idx + 1}
                  </div>
                  <div className="col-span-5 flex items-center gap-3 pr-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white object-cover shadow-2xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-slate-950">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        ({item.subtitle})
                      </p>
                      <p className="text-[10.5px] text-slate-500">
                        Réf : {item.refCode}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-semibold text-slate-900 tabular-nums">
                    {item.quantity}
                  </div>
                  <div className="col-span-2 text-right font-medium text-slate-800 tabular-nums">
                    {fmt(item.unitPriceFC)}
                  </div>
                  <div className="col-span-2 text-right font-extrabold text-slate-950 tabular-nums">
                    {fmt(item.unitPriceFC * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. TOTALS SECTION */}
          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-700">Sous-total :</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {fmt(subtotalFC)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Frais de livraison :</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {fmt(deliveryFeeFC)}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-extrabold text-slate-950">
                    Total à payer :
                  </span>
                  <span className="text-base font-black text-slate-950 tabular-nums">
                    {fmt(grandTotalFC)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. BOTTOM SUPPLEMENTARY INFO CARD + HANDWRITTEN THANK YOU */}
          <div className="mt-6 grid grid-cols-12 items-center gap-6">
            <div className="col-span-7 rounded-xl bg-[#EEF0F3] p-4 text-[10.5px] leading-relaxed text-slate-800">
              <h4 className="mb-2 text-xs font-extrabold text-slate-950">
                Informations supplémentaires
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 shrink-0 text-slate-900" />
                  <span>Livraison : {customerAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-900" />
                  <span>Délai estimé : {settings.deliveryDelayText}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-900" />
                  <span>Conditions : {settings.returnPolicyText}</span>
                </div>
              </div>
            </div>

            <div className="col-span-5 text-center">
              <div className="-rotate-3 inline-block">
                <p className="font-serif text-[18px] leading-snug italic font-bold text-slate-900">
                  Encore merci
                  <br />
                  pour votre confiance !
                </p>
                <svg
                  viewBox="0 0 180 12"
                  className="mx-auto mt-1 h-2.5 w-36 text-[#C81E1E]"
                >
                  <path
                    d="M8 10 Q 90 2, 172 5"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 7. FOOTER BAR WITH REAL BARCODE + SHOP SOCIALS + QUOTE */}
          <div className="mt-7 grid grid-cols-12 items-center gap-4 border-t border-slate-800 pt-4">
            {/* Barcode */}
            <div className="col-span-4">
              <BarcodeSvg code={barcodeValue} />
            </div>

            {/* Center Shop Community + Social Badges + ShopFlow Certified Stamp */}
            <div className="col-span-4 text-center">
              <p className="text-xs font-black tracking-wide text-slate-950 uppercase">
                {settings.shopName}
              </p>
              <p className="mt-0.5 text-[10px] italic text-slate-700">
                {settings.receiptFooterSubtitle}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                  IG
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                  TT
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                  FB
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                  WA
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 opacity-75">
                <img
                  src={SHOPFLOW_APP_LOGO}
                  alt="ShopFlow"
                  className="h-3.5 w-3.5 rounded-xs object-contain"
                />
                <span className="text-[8.5px] font-bold text-slate-500">
                  Certifié par ShopFlow
                </span>
              </div>
            </div>

            {/* Right Quote */}
            <div className="col-span-4 text-center">
              <p className="text-[9.5px] leading-snug italic text-slate-800">
                {settings.receiptQuote}
              </p>
              <svg
                viewBox="0 0 120 8"
                className="mx-auto mt-1 h-2 w-24 text-[#C81E1E]"
              >
                <path
                  d="M6 6 Q 60 2, 114 4"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
