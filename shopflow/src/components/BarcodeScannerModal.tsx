import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ScanBarcode,
  ShoppingCart,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { Product, ShopSettings } from '../types';
import { formatMoney } from '../utils/currency';

interface BarcodeScannerModalProps {
  settings: ShopSettings;
  products: Product[];
  onScanAction: (product: Product, mode: 'instant_sell' | 'add_cart') => void;
  onClose: () => void;
}

function playBeepSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio optional if browser blocks autoplay
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  settings,
  products,
  onScanAction,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanMode, setScanMode] = useState<'instant_sell' | 'add_cart'>(
    'instant_sell'
  );
  const [lastScanned, setLastScanned] = useState<Product | null>(null);

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const triggerScanProduct = (product: Product) => {
    if (product.stock <= 0) return;
    playBeepSound();
    setLastScanned(product);
    onScanAction(product, scanMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <ScanBarcode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">
                Scanner Caméra Code-Barres & QR
              </h3>
              <p className="text-[11px] text-slate-400">
                Vendez en 0,5 seconde sans douchette externe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 px-5 py-3 text-xs">
          <button
            type="button"
            onClick={() => setScanMode('instant_sell')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold transition ${
              scanMode === 'instant_sell'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Scan = +1 Vendu direct</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('add_cart')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 font-bold transition ${
              scanMode === 'add_cart'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Scan = Ajouter au Panier</span>
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative mx-5 mt-3 h-48 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover opacity-85"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <Camera className="h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-xs font-bold text-slate-200">
                Viseur laser prêt (Caméra simulée ou en attente d’autorisation)
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Touchez un produit ci-dessous pour simuler un « BIP » code-barres immédiat
              </p>
            </div>
          )}

          {/* Laser Guide Overlay */}
          <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-emerald-400/60">
            <div className="absolute top-1/2 right-2 left-2 h-0.5 -translate-y-1/2 bg-emerald-400 shadow-[0_0_12px_#34d399]" />
          </div>

          {lastScanned && (
            <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between rounded-xl bg-emerald-600/95 px-3.5 py-2 text-xs font-bold text-white shadow-lg">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="truncate">BIP ! {lastScanned.name}</span>
              </span>
              <span className="ml-2 shrink-0 tabular-nums">
                {fmt(lastScanned.sellingPriceFC)}
              </span>
            </div>
          )}
        </div>

        {/* Instant Barcode Simulation Buttons for Easy Mockup Testing */}
        <div className="p-5">
          <div className="mb-2.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              Tester un scan code-barres en 1 clic :
            </span>
            <span className="text-[11px] text-slate-400">Son BIP actif</span>
          </div>

          <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1 @sm:grid-cols-2">
            {products.slice(0, 6).map((prod, idx) => (
              <button
                key={prod.id}
                type="button"
                disabled={prod.stock <= 0}
                onClick={() => triggerScanProduct(prod)}
                className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-700/80 bg-slate-800/80 p-2.5 text-left transition hover:border-emerald-500 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-40"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">
                      {prod.name}
                    </p>
                    <p className="font-mono text-[10px] text-emerald-400">
                      EAN 600981{idx}4 · Stock {prod.stock}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-500/20 px-2 py-1 text-[11px] font-extrabold text-emerald-300">
                  BIP
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
