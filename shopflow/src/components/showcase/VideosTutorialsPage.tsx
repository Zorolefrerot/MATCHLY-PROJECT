import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  CheckCircle2,
  Lock,
  Maximize2,
  MousePointerClick,
  Package,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  ScanBarcode,
  ShoppingBag,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { INITIAL_PRODUCTS, SHOPFLOW_APP_LOGO } from '../../data/initialData';
import { AppLanguage } from '../../types';
import { speakCleanText, stopAllSpeech } from '../../utils/speechCleaner';
import { RevealOnScroll, StaggerGroup, StaggerItem } from './MotionPrimitives';

export interface ModuleVideoSpec {
  id:
    | 'vid-pos'
    | 'vid-receipt'
    | 'vid-scanner'
    | 'vid-stock'
    | 'vid-ai'
    | 'vid-credits'
    | 'vid-pin';
  moduleNumber: string;
  durationSec: number;
  title: string;
  summary: string;
  icon: React.FC<{ className?: string }>;
  accentBg: string;
  frames: {
    subtitle: string;
    cursorPos: { x: string; y: string };
    clicking?: boolean;
  }[];
}

const MODULE_VIDEOS: ModuleVideoSpec[] = [
  {
    id: 'vid-pos',
    moduleNumber: 'Partie 1 / 7',
    durationSec: 16,
    title: 'Encaisser une vente en 1 clic & voir son Bénéfice Net',
    summary:
      'Regardez comment une vente met à jour simultanément votre caisse, votre stock restant et votre vrai bénéfice net du soir.',
    icon: ShoppingBag,
    accentBg: 'from-blue-600 to-indigo-700',
    frames: [
      {
        subtitle:
          '1. Le client choisit un collier et un bracelet dans le catalogue.',
        cursorPos: { x: '76%', y: '38%' },
      },
      {
        subtitle:
          '2. Un simple toucher sur « +1 Vendu » : l’article s’encaisse immédiatement !',
        cursorPos: { x: '80%', y: '38%' },
        clicking: true,
      },
      {
        subtitle:
          '3. Les quantités des articles vendus sont déduites du stock enregistré.',
        cursorPos: { x: '80%', y: '56%' },
        clicking: true,
      },
      {
        subtitle:
          '4. Votre Vrai Bénéfice Net grimpe en direct (+15 000 FC nets gagnés sur la vente) !',
        cursorPos: { x: '52%', y: '22%' },
      },
    ],
  },
  {
    id: 'vid-receipt',
    moduleNumber: 'Partie 2 / 7',
    durationSec: 16,
    title: 'Générer un reçu et le partager sur WhatsApp',
    summary:
      'Voyez comment préparer un reçu avec les informations de la boutique puis ouvrir le partage WhatsApp. Vérifiez le contenu et confirmez vous-même son envoi.',
    icon: ReceiptText,
    accentBg: 'from-emerald-600 to-teal-700',
    frames: [
      {
        subtitle:
          '1. Saisissez le nom et le numéro WhatsApp de votre client au moment de valider.',
        cursorPos: { x: '45%', y: '35%' },
      },
      {
        subtitle:
          '2. Cliquez sur « Générer le Reçu Officiel » : votre logo et vos articles s’affichent proprement.',
        cursorPos: { x: '55%', y: '58%' },
        clicking: true,
      },
      {
        subtitle:
          '3. Le cachet « ✓ PAYÉ » est apposé avec le total exact et vos coordonnées boutique.',
        cursorPos: { x: '68%', y: '30%' },
      },
      {
        subtitle:
          '4. WhatsApp s’ouvre avec le reçu à partager; vérifiez le destinataire et confirmez l’envoi.',
        cursorPos: { x: '50%', y: '76%' },
        clicking: true,
      },
    ],
  },
  {
    id: 'vid-scanner',
    moduleNumber: 'Partie 3 / 7',
    durationSec: 16,
    title: 'Scanner un article par Caméra ou simple Photo',
    summary:
      'Parcourez les options de scan ou de photo, puis vérifiez les informations proposées avant de les enregistrer.',
    icon: ScanBarcode,
    accentBg: 'from-sky-600 to-cyan-700',
    frames: [
      {
        subtitle:
          '1. Ouvrez le bouton « Scanner Photo / Code-barres » depuis la caisse.',
        cursorPos: { x: '50%', y: '30%' },
        clicking: true,
      },
      {
        subtitle:
          '2. Pointez l’emballage ou prenez une photo : le faisceau analyse l’article.',
        cursorPos: { x: '50%', y: '48%' },
      },
      {
        subtitle:
          '3. Vérifiez le nom et le prix proposés avant de confirmer : la reconnaissance peut se tromper.',
        cursorPos: { x: '65%', y: '68%' },
      },
      {
        subtitle:
          '4. L’article est automatiquement ajouté à la facture et déduit du stock !',
        cursorPos: { x: '75%', y: '68%' },
        clicking: true,
      },
    ],
  },
  {
    id: 'vid-stock',
    moduleNumber: 'Partie 4 / 7',
    durationSec: 16,
    title: 'Gérer le Stock, les Alertes Rupture & le Réapprovisionnement',
    summary:
      'Consultez les quantités enregistrées et les seuils d’alerte configurés pour préparer un réapprovisionnement.',
    icon: Package,
    accentBg: 'from-amber-600 to-orange-700',
    frames: [
      {
        subtitle:
          '1. Repérez dans le catalogue les articles sous leur seuil d’alerte, par exemple une paire de mocassins.',
        cursorPos: { x: '35%', y: '42%' },
      },
      {
        subtitle:
          '2. Lorsque le fournisseur vous livre, cliquez sur « + Réapprovisionner ».',
        cursorPos: { x: '78%', y: '45%' },
        clicking: true,
      },
      {
        subtitle:
          '3. Saisissez la quantité reçue, puis validez le réapprovisionnement.',
        cursorPos: { x: '55%', y: '62%' },
        clicking: true,
      },
      {
        subtitle:
          '4. Le stock passe immédiatement à 24 bidons disponibles et l’alerte disparaît !',
        cursorPos: { x: '78%', y: '45%' },
      },
    ],
  },
  {
    id: 'vid-ai',
    moduleNumber: 'Partie 5 / 7',
    durationSec: 16,
    title: 'Consulter l’Assistant IA ShopFlow',
    summary:
      'L’Assistant IA peut aider à résumer des données ou rédiger des idées lorsque la connexion et le service sont disponibles. Vérifiez ses réponses avant usage.',
    icon: Bot,
    accentBg: 'from-violet-600 to-purple-700',
    frames: [
      {
        subtitle:
          '1. Écrivez une question, par exemple : « Résume les ventes de la journée ».',
        cursorPos: { x: '48%', y: '75%' },
        clicking: true,
      },
      {
        subtitle:
          '2. Si le service en ligne est disponible, l’assistant prépare une réponse à vérifier.',
        cursorPos: { x: '30%', y: '42%' },
      },
      {
        subtitle:
          '3. Il affiche un tableau clair et la formule propre de votre rentabilité nette.',
        cursorPos: { x: '50%', y: '48%' },
      },
      {
        subtitle:
          '4. Consultez le résumé écrit; une lecture audio de synthèse peut être disponible sur l’appareil.',
        cursorPos: { x: '28%', y: '70%' },
        clicking: true,
      },
    ],
  },
  {
    id: 'vid-credits',
    moduleNumber: 'Partie 6 / 7',
    durationSec: 16,
    title: 'Suivre le Cahier de Crédits Clients (« Bons ») & Relancer',
    summary:
      'Fini les dettes oubliées : suivez chaque avance payée et envoyez un rappel WhatsApp propre en 1 clic.',
    icon: ReceiptText,
    accentBg: 'from-rose-600 to-pink-700',
    frames: [
      {
        subtitle:
          '1. Retrouvez tous vos clients ayant pris à crédit avec le montant exact restant.',
        cursorPos: { x: '42%', y: '38%' },
      },
      {
        subtitle:
          '2. Le client verse une avance ? Cliquez sur « Enregistrer un paiement (+50 000 FC) ».',
        cursorPos: { x: '68%', y: '52%' },
        clicking: true,
      },
      {
        subtitle:
          '3. Le reste à payer descend automatiquement de 95 000 FC à 45 000 FC.',
        cursorPos: { x: '42%', y: '52%' },
      },
      {
        subtitle:
          '4. À l’échéance, un clic sur « Relance WhatsApp » prépare un message courtois prêt à envoyer !',
        cursorPos: { x: '72%', y: '70%' },
        clicking: true,
      },
    ],
  },
  {
    id: 'vid-pin',
    moduleNumber: 'Partie 7 / 7',
    durationSec: 16,
    title: 'Verrouiller la boutique en Mode Vendeur (Code PIN Patron)',
    summary:
      'Le Mode Vendeur masque certains écrans réservés au patron derrière un code PIN. Cette protection locale ne remplace pas la sécurité de l’appareil.',
    icon: Lock,
    accentBg: 'from-slate-800 to-slate-950',
    frames: [
      {
        subtitle:
          '1. Avant de laisser le téléphone à votre vendeur, cliquez sur « 🔒 Mode Vendeur ».',
        cursorPos: { x: '70%', y: '25%' },
        clicking: true,
      },
      {
        subtitle:
          '2. Votre vendeur peut encaisser les clients normalement, mais les onglets Patron portent un cadenas.',
        cursorPos: { x: '25%', y: '50%' },
      },
      {
        subtitle:
          '3. S’il tente d’ouvrir votre Bénéfice Net, l’application bloque l’accès et demande votre Code PIN.',
        cursorPos: { x: '50%', y: '52%' },
        clicking: true,
      },
      {
        subtitle:
          '4. Le patron saisit le code PIN configuré pour retrouver les écrans protégés.',
        cursorPos: { x: '50%', y: '68%' },
        clicking: true,
      },
    ],
  },
];

/**
 * Interactive 60fps Animated Video Player Stage for any Module
 */
const AnimatedModuleVideoStage: React.FC<{
  video: ModuleVideoSpec;
  language: AppLanguage;
  autoPlay?: boolean;
}> = ({ video, language, autoPlay = true }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [stepIdx, setStepIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Reset to frame 0 when user selects another module video
  useEffect(() => {
    stopAllSpeech();
    setStepIdx(0);
    setProgressPct(0);
    setIsPlaying(true);
  }, [video.id]);

  // Speak subtitle out loud if voice narration is toggled ON!
  useEffect(() => {
    if (isPlaying && voiceEnabled) {
      speakCleanText(video.frames[stepIdx].subtitle, language, 'nova');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, isPlaying, voiceEnabled, video.id]);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  // Smooth 60fps timeline ticker (4 seconds per scene × 4 scenes = 16s loop)
  useEffect(() => {
    if (!isPlaying) return;
    const totalMs = video.durationSec * 1000;
    const intervalMs = 80;
    const timer = window.setInterval(() => {
      setProgressPct((prev) => {
        const next = prev + (intervalMs / totalMs) * 100;
        if (next >= 100) {
          setStepIdx(0);
          return 0;
        }
        const computedStep = Math.min(
          video.frames.length - 1,
          Math.floor((next / 100) * video.frames.length)
        );
        setStepIdx(computedStep);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, video]);

  const currentFrame = video.frames[stepIdx] || video.frames[0];
  const currentSec = Math.min(
    video.durationSec,
    Math.floor((progressPct / 100) * video.durationSec)
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#070E24] text-white shadow-2xl">
      {/* Top Cinema Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-5 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="rounded-md bg-[#0A4DFF] px-2 py-0.5 text-[10px] font-black">
            {video.moduleNumber}
          </span>
          <span className="font-bold text-slate-200 line-clamp-1">
            {video.title}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (voiceEnabled) stopAllSpeech();
            setVoiceEnabled((v) => !v);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition ${
            voiceEnabled
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-white/10 text-slate-200 hover:bg-white/20'
          }`}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className="h-3.5 w-3.5" />
              <span>Voix explicative : ON</span>
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5" />
              <span>Activer le son / la voix</span>
            </>
          )}
        </button>
      </div>

      {/* Main Animated 16:9 Motion Stage */}
      <div className="relative h-[340px] w-full overflow-hidden bg-gradient-to-br from-[#0B1739] via-[#070E24] to-[#050A18] p-5 sm:h-[400px] sm:p-8">
        {/* Ambient Glow */}
        <div
          className={`pointer-events-none absolute -top-20 right-10 h-64 w-64 rounded-full bg-gradient-to-br ${video.accentBg} opacity-25 blur-3xl`}
        />

        {/* Animated Scene Card Inside Video */}
        <div className="relative mx-auto flex h-[calc(100%-56px)] max-w-xl flex-col justify-between rounded-2xl border border-white/15 bg-white p-4 text-slate-900 shadow-2xl sm:p-5">
          {/* App Mini Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <img
                src={SHOPFLOW_APP_LOGO}
                alt="ShopFlow"
                className="h-6 w-6 rounded-md object-contain"
              />
              <span className="text-xs font-black text-slate-900">
                Shop<span className="text-[#0A4DFF]">Flow</span>
              </span>
            </div>
            <motion.span
              key={`${video.id}-profit-${stepIdx}`}
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-200 tabular-nums"
            >
              {video.id === 'vid-pos' && stepIdx >= 2
                ? 'Bénéfice Net : +78 500 FC ▲'
                : 'Bénéfice Net : +63 500 FC'}
            </motion.span>
          </div>

          {/* Dynamic Module Body Animated per Step */}
          <div className="my-auto py-2">
            {video.id === 'vid-pos' && (
              <div className="space-y-2.5 text-xs">
                {[INITIAL_PRODUCTS[0], INITIAL_PRODUCTS[1]].map((prod, i) => {
                  const soldAnim =
                    (i === 0 && stepIdx >= 1) || (i === 1 && stepIdx >= 2);
                  return (
                    <div
                      key={prod.id}
                      className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                        soldAnim
                          ? 'border-emerald-300 bg-emerald-50/60'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{prod.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Stock :{' '}
                            <strong>
                              {soldAnim ? prod.stock - 1 : prod.stock}
                            </strong>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-xl px-3 py-1.5 text-[11px] font-black text-white transition ${
                          soldAnim ? 'bg-emerald-600 scale-105' : 'bg-[#0A4DFF]'
                        }`}
                      >
                        {soldAnim ? '✓ Vendu !' : '+1 Vendu'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {video.id === 'vid-receipt' && (
              <motion.div
                key={stepIdx}
                initial={{ opacity: 0.5, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">
                    APERÇU — REÇU ILLUSTRATIF
                  </span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white">
                    ✓ PAYÉ
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Exemple client : <strong>Client boutique</strong>
                </p>
                <div className="flex items-center justify-between rounded-xl bg-[#081844] px-3 py-2 text-white">
                  <span className="text-[11px] font-bold">TOTAL ENCAISSÉ</span>
                  <span className="font-black">73 000 FC</span>
                </div>
                <div
                  className={`rounded-xl py-2 text-center text-[11px] font-black text-white transition ${
                    stepIdx === 3 ? 'bg-emerald-600' : 'bg-[#0A4DFF]'
                  }`}
                >
                  {stepIdx === 3
                    ? '✓ Reçu prêt à partager sur WhatsApp'
                    : 'Envoyer le Reçu sur WhatsApp'}
                </div>
              </motion.div>
            )}

            {video.id === 'vid-scanner' && (
              <div className="space-y-2.5 text-xs">
                <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-900">
                  <img
                    src={INITIAL_PRODUCTS[0].image}
                    alt="Scan"
                    className="h-full w-full object-cover opacity-50"
                  />
                  <motion.div
                    animate={{ y: [-26, 26, -26] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="absolute inset-x-8 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444]"
                  />
                  {stepIdx >= 2 && (
                    <span className="absolute rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-black text-slate-950 shadow-lg">
                      ✓ Code reconnu : Collier doré délicat (45 000 FC)
                    </span>
                  )}
                </div>
              </div>
            )}

            {video.id === 'vid-stock' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={INITIAL_PRODUCTS[5].image}
                      alt={INITIAL_PRODUCTS[5].name}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-black text-slate-900">
                        {INITIAL_PRODUCTS[5].name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {stepIdx < 3
                          ? '⚠️ Alerte stock bas : 4 paires'
                          : '✅ Stock confortable : 24 paires'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-xl px-3 py-2 text-[11px] font-black text-white ${
                      stepIdx < 3 ? 'bg-amber-600' : 'bg-emerald-600'
                    }`}
                  >
                    {stepIdx < 3 ? '+ Réapprovisionner' : 'Stock : 24 ✓'}
                  </span>
                </div>
              </div>
            )}

            {video.id === 'vid-ai' && (
              <div className="space-y-2.5 text-xs">
                <div className="ml-12 rounded-2xl bg-slate-100 px-3.5 py-2 font-semibold text-slate-800">
                  Résume les ventes de ma journée.
                </div>
                {stepIdx >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3"
                  >
                    <p className="font-black text-slate-900">
                      ShopFlow AI • Bilan Net : +63 500 FC
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      CA (485 000 FC) − Coût d’achat (402 500 FC) − Dépenses
                      (19 000 FC).
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#0A4DFF] px-2.5 py-1 text-[10px] font-bold text-white">
                      <Volume2 className="h-3 w-3" />
                      <span>
                        {stepIdx === 3
                          ? 'Lecture audio de synthèse…'
                          : 'Écouter la synthèse audio'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {video.id === 'vid-credits' && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">
                    Client : Maman Chantal
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-black text-amber-800 tabular-nums">
                    Reste : {stepIdx >= 2 ? '45 000 FC' : '95 000 FC'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl bg-[#0A4DFF] py-2 text-center text-[11px] font-bold text-white">
                    + Noter Avance (50 000)
                  </div>
                  <div className="rounded-xl bg-emerald-600 py-2 text-center text-[11px] font-bold text-white">
                    {stepIdx === 3
                      ? '✓ Rappel WhatsApp prêt !'
                      : 'Relance WhatsApp'}
                  </div>
                </div>
              </div>
            )}

            {video.id === 'vid-pin' && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center text-xs">
                <p className="font-black text-slate-900">
                  {stepIdx === 3
                    ? '🔓 Mode Patron Déverrouillé !'
                    : '🔒 Mode Vendeur Actif — Bénéfices Masqués'}
                </p>
                <div className="inline-block rounded-xl bg-white px-5 py-2 font-mono text-base font-black tracking-[0.45em] text-slate-900 ring-1 ring-slate-300">
                  {stepIdx === 3 ? '1 2 3 4' : '• • • •'}
                </div>
                <p className="text-[11px] text-slate-500">
                  Votre employé vend sans voir vos secrets financiers
                </p>
              </div>
            )}
          </div>

          {/* Animated Floating Pointer Cursor + Click Ripple */}
          <motion.div
            animate={{
              left: currentFrame.cursorPos.x,
              top: currentFrame.cursorPos.y,
              scale: currentFrame.clicking ? [1, 0.84, 1.08, 1] : 1,
            }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute z-20 flex items-center justify-center"
          >
            {currentFrame.clicking && (
              <motion.span
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 2.1, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                className="absolute h-8 w-8 rounded-full bg-[#0A4DFF]"
              />
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl ring-2 ring-white">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </motion.div>
        </div>

        {/* Synchronized Subtitle Bar Inside Video Bottom */}
        <motion.div
          key={`${video.id}-sub-${stepIdx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 max-w-xl rounded-xl bg-black/75 px-4 py-2 text-center text-xs font-semibold text-white backdrop-blur-xs"
        >
          {currentFrame.subtitle}
        </motion.div>
      </div>

      {/* Video Player Bottom Control Bar (Play/Pause + Scrubber + Time) */}
      <div className="flex items-center gap-3 border-t border-white/10 bg-[#050B1C] px-5 py-3.5 text-xs">
        <button
          type="button"
          onClick={() => {
            if (isPlaying) stopAllSpeech();
            setIsPlaying((p) => !p);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A4DFF] text-white transition hover:bg-blue-500"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setStepIdx(0);
            setProgressPct(0);
            setIsPlaying(true);
          }}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          title="Rejouer depuis le début"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Interactive Scrubber Timeline */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(
              0,
              Math.min(1, (e.clientX - rect.left) / rect.width)
            );
            setProgressPct(ratio * 100);
            setStepIdx(
              Math.min(
                video.frames.length - 1,
                Math.floor(ratio * video.frames.length)
              )
            );
          }}
          className="relative h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/15"
        >
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[#0A4DFF] to-sky-400 transition-all duration-75"
          />
        </div>

        <span className="shrink-0 font-mono text-[11px] font-bold text-slate-400 tabular-nums">
          00:{String(currentSec).padStart(2, '0')} / 00:{video.durationSec}
        </span>
      </div>
    </div>
  );
};

interface VideosTutorialsPageProps {
  language: AppLanguage;
}

export const VideosTutorialsPage: React.FC<VideosTutorialsPageProps> = ({
  language,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<ModuleVideoSpec>(
    MODULE_VIDEOS[0]
  );
  const [fullscreenModal, setFullscreenModal] = useState(false);

  return (
    <div className="bg-slate-50 pb-24">
      {/* Dark Cinema Header + Main Interactive Player */}
      <section className="relative overflow-hidden bg-[#050B1C] pt-14 pb-20 text-white">
        <div className="pointer-events-none absolute -top-24 right-1/4 h-80 w-80 rounded-full bg-[#0A4DFF]/25 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1.5 text-xs font-bold text-emerald-300">
              🎬 Tutoriels Vidéo Interactifs (7 Parties)
            </span>
            <h1 className="sf-display-heading mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Les parcours ShopFlow expliqués en animation
            </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Choisissez une animation pour parcourir les étapes avec des sous-titres écrits. Les gestes, produits et montants affichés sont des exemples simulés; aucun achat ni aucune vente réelle n’est effectué.
            </p>
          </div>

          {/* Main Active Video Cinema Stage */}
          <div className="mx-auto max-w-4xl">
            <AnimatedModuleVideoStage
              video={selectedVideo}
              language={language}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setFullscreenModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Agrandir en mode Cinéma</span>
              </button>


            </div>
          </div>
        </div>
      </section>

      {/* All 7 Module Video Playlist Grid (Scroll-Revealed) */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <RevealOnScroll>
          <h2 className="sf-display-heading text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Choisissez la vidéo d’un module ({MODULE_VIDEOS.length} vidéos)
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ces animations illustrent les modules sans lancer ni intégrer l’application. Cliquez sur une carte pour choisir la démonstration correspondante.
          </p>
        </RevealOnScroll>

        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_VIDEOS.map((vid) => {
            const Icon = vid.icon;
            const active = vid.id === selectedVideo.id;
            return (
              <StaggerItem key={vid.id}>
                <div
                  onClick={() => {
                    setSelectedVideo(vid);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className={`group flex h-full cursor-pointer flex-col justify-between rounded-3xl border p-6 transition hover:-translate-y-1 hover:shadow-xl ${
                    active
                      ? 'border-2 border-[#0A4DFF] bg-blue-50/40 shadow-md'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${vid.accentBg} text-white shadow-sm`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-700">
                        <Play className="h-3 w-3 fill-current text-[#0A4DFF]" />
                        <span>0:{vid.durationSec}</span>
                      </span>
                    </div>

                    <p className="mt-4 text-[11px] font-extrabold tracking-wider text-[#0A4DFF] uppercase">
                      {vid.moduleNumber}
                    </p>
                    <h3 className="mt-1 text-base font-extrabold text-slate-950 group-hover:text-[#0A4DFF]">
                      {vid.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {vid.summary}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-bold">
                    {active ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>En cours de lecture</span>
                      </span>
                    ) : (
                      <span className="text-[#0A4DFF]">
                        Lancer la vidéo →
                      </span>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Fullscreen Cinema Lightbox */}
      <AnimatePresence>
        {fullscreenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setFullscreenModal(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/25"
                >
                  <X className="h-4 w-4" />
                  <span>Fermer le plein écran</span>
                </button>
              </div>
              <AnimatedModuleVideoStage
                video={selectedVideo}
                language={language}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
