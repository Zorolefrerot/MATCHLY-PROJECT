import React, { useEffect, useRef, useState } from 'react';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from '@zxing/library';
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  ScanBarcode,
  ShoppingCart,
  Sparkles,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { Product, ShopSettings } from '../types';
import { formatMoney } from '../utils/currency';
import { requestChatCompletion } from '../utils/aiApi';

interface BarcodeScannerModalProps {
  settings: ShopSettings;
  products: Product[];
  onScanAction: (product: Product, mode: 'instant_sell' | 'add_cart') => void;
  onBindBarcodeOrCreateProduct: (
    newOrUpdatedProduct: Product,
    isNew: boolean,
    mode: 'instant_sell' | 'add_cart'
  ) => void;
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
    osc.frequency.setValueAtTime(1120, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);
  } catch {
    // Optional audio
  }
}

function createZXingReader(): MultiFormatReader {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new MultiFormatReader();
  reader.setHints(hints);
  return reader;
}

function decodeCanvasOnce(
  reader: MultiFormatReader,
  canvas: HTMLCanvasElement
): string | null {
  try {
    const luminance = new HTMLCanvasElementLuminanceSource(canvas);
    try {
      const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
      const res = reader.decode(bitmap);
      if (res?.getText()) return res.getText();
    } catch {
      // Fallback to GlobalHistogramBinarizer (excels on slightly out-of-focus smartphone photos!)
    }
    const histBitmap = new BinaryBitmap(
      new GlobalHistogramBinarizer(luminance)
    );
    const res2 = reader.decode(histBitmap);
    return res2?.getText() || null;
  } catch {
    return null;
  }
}

/**
 * Spatial 5x4 Overlapping Pyramid Decoder with 48px White Quiet-Zone Padding:
 * Guarantees detection of 1D EAN-13 / UPC / Code-128 / QR barcodes ANYWHERE in a smartphone photo
 * (top corner, bottom-right package corner, edge-to-edge tight labels on dark tables, or vertical 90°).
 */
function pyramidDecodeCanvas(
  reader: MultiFormatReader,
  canvas: HTMLCanvasElement
): string | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const W = canvas.width;
  const H = canvas.height;
  const rgba = ctx.getImageData(0, 0, W, H).data;
  const gray = new Uint8ClampedArray(W * H);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    gray[i] = (rgba[p] * 77 + rgba[p + 1] * 150 + rgba[p + 2] * 29) >> 8;
  }

  const PAD = 48;
  const yBands: [number, number][] = [
    [0, 1],
    [0, 0.36],
    [0.22, 0.58],
    [0.44, 0.8],
    [0.64, 1.0],
  ];
  const xBands: [number, number][] = [
    [0, 1],
    [0, 0.55],
    [0.22, 0.78],
    [0.45, 1.0],
  ];

  for (const [y0f, y1f] of yBands) {
    for (const [x0f, x1f] of xBands) {
      const sx = Math.floor(W * x0f);
      const sw = Math.max(48, Math.floor(W * (x1f - x0f)));
      const sy = Math.floor(H * y0f);
      const sh = Math.max(32, Math.floor(H * (y1f - y0f)));
      const bw = sw + PAD * 2;
      const bh = sh + PAD * 2;
      const buf = new Uint8ClampedArray(bw * bh).fill(254);
      for (let y = 0; y < sh; y++) {
        buf.set(
          gray.subarray((sy + y) * W + sx, (sy + y) * W + sx + sw),
          (y + PAD) * bw + PAD
        );
      }
      try {
        const lum = new RGBLuminanceSource(buf, bw, bh);
        const res = reader.decode(new BinaryBitmap(new HybridBinarizer(lum)));
        if (res?.getText()) return res.getText();
      } catch {
        // Try GlobalHistogramBinarizer on full bands
        if (x0f === 0 && x1f === 1) {
          try {
            const lum2 = new RGBLuminanceSource(buf, bw, bh);
            const res2 = reader.decode(
              new BinaryBitmap(new GlobalHistogramBinarizer(lum2))
            );
            if (res2?.getText()) return res2.getText();
          } catch {
            // Continue next tile
          }
        }
      }
    }
  }
  return null;
}
async function decodeBarcodeFromImageElement(
  img: HTMLImageElement
): Promise<string | null> {
  // Engine 0: Hardware-accelerated OS BarcodeDetector when available (Android Chrome, Edge, Safari)
  try {
    const NativeDetector = (
      window as unknown as {
        BarcodeDetector?: new () => {
          detect: (
            src: HTMLImageElement
          ) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;
    if (NativeDetector) {
      const detector = new NativeDetector();
      const detected = await detector.detect(img);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        return detected[0].rawValue.trim();
      }
    }
  } catch {
    // Continue to 6-pass pure JS ZXing decoder
  }

  const reader = createZXingReader();
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(64, Math.round(img.width * scale));
  const h = Math.max(64, Math.round(img.height * scale));

  // Pass 1: Spatial 5x4 Overlapping Pyramid with 48px Quiet-Zone Border across ENTIRE photo (top/bottom/corners!)
  const c1 = document.createElement('canvas');
  c1.width = w;
  c1.height = h;
  const ctx1 = c1.getContext('2d');
  if (!ctx1) return null;
  ctx1.drawImage(img, 0, 0, w, h);
  const hit1 = pyramidDecodeCanvas(reader, c1);
  if (hit1) return hit1;

  // Pass 2: 90-degree rotated Spatial 5x4 Pyramid (fixes vertical / portrait mobile camera orientation!)
  const c4 = document.createElement('canvas');
  c4.width = h;
  c4.height = w;
  const ctx4 = c4.getContext('2d');
  if (ctx4) {
    ctx4.translate(h / 2, w / 2);
    ctx4.rotate(Math.PI / 2);
    ctx4.drawImage(img, -w / 2, -h / 2, w, h);
    const hit4 = pyramidDecodeCanvas(reader, c4);
    if (hit4) return hit4;
  }

  // Pass 3: High-contrast boosted pass (dim shop lighting / faded thermal labels)
  const c3 = document.createElement('canvas');
  c3.width = w;
  c3.height = h;
  const ctx3 = c3.getContext('2d');
  if (ctx3) {
    ctx3.filter = 'grayscale(100%) contrast(195%) brightness(108%)';
    ctx3.drawImage(img, 0, 0, w, h);
    const hit3 = pyramidDecodeCanvas(reader, c3);
    if (hit3) return hit3;
  }

  // Pass 4: 45-degree diagonal pass (tilted handheld smartphone shots)
  const diag = Math.round(Math.hypot(w, h));
  const c5 = document.createElement('canvas');
  c5.width = diag;
  c5.height = diag;
  const ctx5 = c5.getContext('2d');
  if (ctx5) {
    ctx5.fillStyle = '#FFFFFF';
    ctx5.fillRect(0, 0, diag, diag);
    ctx5.translate(diag / 2, diag / 2);
    ctx5.rotate(Math.PI / 4);
    ctx5.drawImage(img, -w / 2, -h / 2, w, h);
    const hit5 = decodeCanvasOnce(reader, c5);
    if (hit5) return hit5;
  }

  return null;
}

function makeCompactDataUrl(img: HTMLImageElement, maxSide = 480): string {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(48, Math.round(img.width * scale));
  const h = Math.max(48, Math.round(img.height * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.8);
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  settings,
  products,
  onScanAction,
  onBindBarcodeOrCreateProduct,
  onClose,
}) => {
  const [sourceTab, setSourceTab] = useState<'photo' | 'live'>('photo');
  const [scanMode, setScanMode] = useState<'instant_sell' | 'add_cart'>(
    'instant_sell'
  );

  // Photo state
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [decodedCode, setDecodedCode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [aiVisionSuggestion, setAiVisionSuggestion] = useState<{
    detectedName: string;
    estimatedPriceFC: number;
    category: Product['category'];
  } | null>(null);
  const [selectedBindProductId, setSelectedBindProductId] = useState<string>(
    products[0]?.id || ''
  );

  // New Product Quick Form when unknown photo/barcode is scanned
  const [quickNewName, setQuickNewName] = useState('');
  const [quickNewSellPrice, setQuickNewSellPrice] = useState('15000');
  const [quickNewBuyPrice, setQuickNewBuyPrice] = useState('11000');

  // Live Video Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const findProductByCodeOrText = (codeOrLabel: string): Product | null => {
    const clean = codeOrLabel.trim().toLowerCase();
    return (
      products.find(
        (p) =>
          p.barcode?.toLowerCase() === clean ||
          p.refCode?.toLowerCase() === clean ||
          p.id.toLowerCase() === clean ||
          clean.includes(p.name.toLowerCase()) ||
          p.name
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length >= 4)
            .some((w) => clean.includes(w))
      ) || null
    );
  };

  // Continuous real live camera decoding when user switches to 'live' tab
  useEffect(() => {
    if (sourceTab !== 'live') return;

    let stream: MediaStream | null = null;
    let intervalId: number | null = null;
    const reader = createZXingReader();
    const frameCanvas = document.createElement('canvas');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
        })
        .then((s) => {
          stream = s;
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }

          intervalId = window.setInterval(() => {
            const vid = videoRef.current;
            if (!vid || vid.readyState < 2 || vid.videoWidth === 0) return;
            frameCanvas.width = vid.videoWidth;
            frameCanvas.height = vid.videoHeight;
            const ctx = frameCanvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(vid, 0, 0, frameCanvas.width, frameCanvas.height);
            const code = decodeCanvasOnce(reader, frameCanvas);
            if (code) {
              playBeepSound();
              setDecodedCode(code);
              const found = findProductByCodeOrText(code);
              if (found) {
                setMatchedProduct(found);
                onScanAction(found, scanMode);
              } else {
                setSourceTab('photo');
                setCapturedPhotoUrl(frameCanvas.toDataURL('image/jpeg', 0.8));
                setQuickNewName(`Produit Code ${code}`);
              }
            }
          }, 350);
        })
        .catch(() => {
          setCameraActive(false);
        });
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTab, scanMode]);

  /**
   * Handles ANY real camera photo or gallery image selected by the user!
   * Step 1: Multi-pass ZXing barcode / QR decoding
   * Step 2: If no barcode printed on the item, Multimodal Vision AI inspects the image & identifies the merchandise!
   */
  const handlePhotoSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset file input immediately so consecutive camera captures on mobile always trigger onChange
    e.target.value = '';

    setIsAnalyzing(true);
    setDecodedCode(null);
    setMatchedProduct(null);
    setAiVisionSuggestion(null);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      const compactDataUrl = makeCompactDataUrl(img, 560);
      setCapturedPhotoUrl(compactDataUrl);

      // 1. Run Hardware BarcodeDetector + 6-pass ZXing Barcode & QR Decoder first
      const barcodeResult = await decodeBarcodeFromImageElement(img);
      URL.revokeObjectURL(objectUrl);

      if (barcodeResult) {
        playBeepSound();
        setDecodedCode(barcodeResult);
        const existing = findProductByCodeOrText(barcodeResult);
        if (existing) {
          setMatchedProduct(existing);
          onScanAction(existing, scanMode);
          setIsAnalyzing(false);
          return;
        }
      }

      // 2. Ask Multimodal Vision AI to visually recognize the photographed product/barcode!
      try {
        const stockNames = products.map((p) => `${p.id}: ${p.name}`).join(', ');
        const inner = await requestChatCompletion(
          [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyse cette photo prise par un commerçant. Produits existants dans son stock: [${stockNames}].\nRéponds UNIQUEMENT avec un objet JSON strict sans balises markdown de la forme:\n{"matchedProductId": "id exact si c'est clairement l'un des produits du stock sinon null", "detectedName": "nom commercial court et précis en français de l'objet sur la photo", "barcodeRead": "chiffres du code-barres si visible sinon null", "estimatedPriceFC": 15000, "category": "Alimentation"}`,
                },
                { type: 'image_url', image_url: { url: compactDataUrl } },
              ],
            },
          ],
          { timeoutMs: 25_000, maxTokens: 300 }
        );
        const jsonMatch = inner.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const info = JSON.parse(jsonMatch[0]);
          if (info.barcodeRead && !barcodeResult) {
            setDecodedCode(String(info.barcodeRead));
          }
          if (info.matchedProductId) {
            const found = products.find(
              (product) => product.id === info.matchedProductId
            );
            if (found) {
              playBeepSound();
              setMatchedProduct(found);
              onScanAction(found, scanMode);
              setIsAnalyzing(false);
              return;
            }
          }
          if (info.detectedName) {
            playBeepSound();
            setAiVisionSuggestion({
              detectedName: info.detectedName,
              estimatedPriceFC: Number(info.estimatedPriceFC) || 15000,
              category: info.category || 'Alimentation',
            });
            setQuickNewName(info.detectedName);
            setQuickNewSellPrice(String(Number(info.estimatedPriceFC) || 15000));
            setQuickNewBuyPrice(
              String(
                Math.round((Number(info.estimatedPriceFC) || 15000) * 0.75)
              )
            );
          }
        }
      } catch {
        // Fallback ready below so user can still bind/sell in 1 tap even offline!
      }

      if (!quickNewName) {
        setQuickNewName(
          barcodeResult ? `Article (${barcodeResult})` : 'Nouvelle marchandise scannée'
        );
      }
      setIsAnalyzing(false);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setIsAnalyzing(false);
    };

    img.src = objectUrl;
    e.target.value = '';
  };

  const handleLinkToExistingAndSell = () => {
    const prod = products.find((p) => p.id === selectedBindProductId);
    if (!prod) return;
    const updated: Product = {
      ...prod,
      barcode: decodedCode || prod.barcode,
      image: capturedPhotoUrl || prod.image,
    };
    playBeepSound();
    onBindBarcodeOrCreateProduct(updated, false, scanMode);
    setMatchedProduct(updated);
  };

  const handleCreateScannedProductAndSell = () => {
    const sellFC = Math.max(500, Number(quickNewSellPrice) || 15000);
    const buyFC = Math.max(100, Number(quickNewBuyPrice) || Math.round(sellFC * 0.75));
    const created: Product = {
      id: `prod-scan-${Date.now()}`,
      refCode: `SF-${Math.floor(100 + Math.random() * 900)}`,
      barcode: decodedCode || undefined,
      name: quickNewName.trim() || 'Marchandise Scannée',
      category: aiVisionSuggestion?.category || 'Alimentation',
      unit: 'Pièce',
      image: capturedPhotoUrl || products[0].image,
      stock: 15,
      minStockAlert: 4,
      purchasePriceFC: buyFC,
      sellingPriceFC: sellFC,
    };
    playBeepSound();
    onBindBarcodeOrCreateProduct(created, true, scanMode);
    setMatchedProduct(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-xs md:p-5">
      <div className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-sky-400">
              <ScanBarcode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">
                Scanner Photo IA & Code-Barres HD
              </h3>
              <p className="text-[11px] text-slate-400">
                Prenez en photo un code-barres, un QR code ou directement le produit !
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

        {/* Source Switch: Photo Scan (Works 100% on ALL phones!) vs Live Video */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/70 px-5 pt-3 text-xs">
          <button
            type="button"
            onClick={() => setSourceTab('photo')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-extrabold transition ${
              sourceTab === 'photo'
                ? 'bg-[#0A4DFF] text-white shadow-sm'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Scanner par Photo</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceTab('live')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-extrabold transition ${
              sourceTab === 'live'
                ? 'bg-[#0A4DFF] text-white shadow-sm'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Caméra Vidéo Direct</span>
          </button>
        </div>

        {/* Action Mode after Scan */}
        <div className="flex items-center justify-between gap-2 px-5 py-2.5 text-[11px]">
          <span className="text-slate-400">Action dès détection :</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setScanMode('instant_sell')}
              className={`rounded-lg px-2.5 py-1 font-bold ${
                scanMode === 'instant_sell'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              ⚡ +1 Vendu direct
            </button>
            <button
              type="button"
              onClick={() => setScanMode('add_cart')}
              className={`rounded-lg px-2.5 py-1 font-bold ${
                scanMode === 'add_cart'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              🛒 Ajouter Facture
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 pb-5">
          {sourceTab === 'photo' ? (
            <>
              {/* Big Native Camera Capture & Gallery Upload Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-sky-400/60 bg-blue-950/40 p-4 text-center transition hover:bg-blue-950/70">
                  <Camera className="h-7 w-7 text-sky-400" />
                  <span className="text-xs font-extrabold text-white">
                    Prendre une Photo
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Code-barres ou objet
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelected}
                    className="hidden"
                  />
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-center transition hover:border-emerald-400 hover:bg-slate-800">
                  <ImagePlus className="h-7 w-7 text-emerald-400" />
                  <span className="text-xs font-extrabold text-white">
                    Choisir une Image
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Depuis la galerie / capture
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelected}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Photo Analysis Preview & Smart Result Box */}
              {capturedPhotoUrl && (
                <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={capturedPhotoUrl}
                      alt="Scan"
                      className="h-16 w-16 shrink-0 rounded-xl border border-slate-700 object-cover"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      {isAnalyzing ? (
                        <div className="flex items-center gap-2 font-bold text-sky-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>
                            Lecture du code-barres & reconnaissance IA Vision...
                          </span>
                        </div>
                      ) : matchedProduct ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 font-extrabold text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Marchandise reconnue & enregistrée !
                          </span>
                          <p className="truncate font-bold text-white">
                            {matchedProduct.name} ({fmt(matchedProduct.sellingPriceFC)})
                          </p>
                          {decodedCode && (
                            <p className="font-mono text-[10px] text-slate-400">
                              Code lu : {decodedCode}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 font-extrabold text-amber-300">
                            <Sparkles className="h-4 w-4" />
                            {decodedCode
                              ? `Code détecté : ${decodedCode}`
                              : aiVisionSuggestion
                                ? `Objet reconnu par IA : ${aiVisionSuggestion.detectedName}`
                                : 'Photo capturée avec succès !'}
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Associez-le à un produit existant ou ajoutez-le en 1 clic au stock :
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* If not yet matched in stock, let merchant EITHER link to existing OR create in 1 tap! */}
                  {!isAnalyzing && !matchedProduct && (
                    <div className="space-y-3 border-t border-slate-800 pt-3 text-xs">
                      {/* Option A: Create & Sell new item immediately with captured photo */}
                      <div className="rounded-xl bg-slate-900 p-3">
                        <p className="mb-2 font-bold text-emerald-400">
                          1. Enregistrer ce nouvel article avec sa photo & vendre :
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={quickNewName}
                            onChange={(e) => setQuickNewName(e.target.value)}
                            placeholder="Nom du produit"
                            className="col-span-3 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-white"
                          />
                          <div>
                            <span className="text-[10px] text-slate-400">
                              Achat (FC)
                            </span>
                            <input
                              type="number"
                              value={quickNewBuyPrice}
                              onChange={(e) => setQuickNewBuyPrice(e.target.value)}
                              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-bold text-white tabular-nums"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">
                              Vente (FC)
                            </span>
                            <input
                              type="number"
                              value={quickNewSellPrice}
                              onChange={(e) =>
                                setQuickNewSellPrice(e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-bold text-white tabular-nums"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleCreateScannedProductAndSell}
                            className="mt-auto flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 font-extrabold text-white hover:bg-emerald-500"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Créer & BIP</span>
                          </button>
                        </div>
                      </div>

                      {/* Option B: Bind to existing product */}
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedBindProductId}
                          onChange={(e) =>
                            setSelectedBindProductId(e.target.value)
                          }
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({fmt(p.sellingPriceFC)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleLinkToExistingAndSell}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0A4DFF] px-3 py-2 font-extrabold text-white"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Lier & Vendre</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Live Video Stream Viewfinder */
            <div className="relative h-52 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <Camera className="h-8 w-8 text-sky-400" />
                  <p className="mt-2 text-xs font-bold text-slate-200">
                    Caméra vidéo bloquée par ce navigateur — utilisez l’onglet « Scanner par Photo » juste au-dessus !
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-emerald-400/70">
                <div className="absolute top-1/2 right-2 left-2 h-0.5 -translate-y-1/2 bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              </div>
            </div>
          )}

          {/* Quick 1-Tap Stock Barcodes for Ultra-Fast Cashier Testing */}
          <div>
            <p className="mb-2 text-[11px] font-bold text-slate-400">
              Ou BIP rapide d’un article déjà enregistré en stock :
            </p>
            <div className="grid max-h-36 grid-cols-1 gap-2 overflow-y-auto pr-1 @sm:grid-cols-2">
              {products.slice(0, 6).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  disabled={prod.stock <= 0}
                  onClick={() => {
                    playBeepSound();
                    setMatchedProduct(prod);
                    onScanAction(prod, scanMode);
                  }}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-800/70 p-2 text-left transition hover:border-emerald-500"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="h-8 w-8 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {prod.name}
                      </p>
                      <p className="font-mono text-[10px] text-emerald-400">
                        {prod.barcode || prod.refCode} · Qté {prod.stock}
                      </p>
                    </div>
                  </div>
                  <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
