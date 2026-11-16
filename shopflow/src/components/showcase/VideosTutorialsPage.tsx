import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  CheckCircle2,
  Coins,
  Lock,
  Maximize2,
  MousePointerClick,
  Package,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
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
    | 'vid-stock'
    | 'vid-ai'
    | 'vid-credits'
    | 'vid-pin'
    | 'vid-currency';
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
    id: 'vid-pos', moduleNumber: 'Partie 1 / 7', durationSec: 20,
    title: 'Préparer une vente et choisir les frais de livraison',
    summary: 'Découvrez le ticket de caisse, les modes de paiement et le choix « Sans frais » ou « Avec frais ». La séquence est simulée et s’arrête avant toute validation.',
    icon: ShoppingBag, accentBg: 'from-blue-600 to-indigo-700',
    frames: [
      { subtitle: '1. Dans « Caisse & Vente Rapide », « Facture + » ajoute un article au ticket.', cursorPos: { x: '74%', y: '38%' } },
      { subtitle: '2. Le ticket permet d’ajuster les quantités et de choisir le mode de paiement.', cursorPos: { x: '44%', y: '53%' }, clicking: true },
      { subtitle: '3. Choisissez « Sans frais » ou « Avec frais »; le montant éventuel est ajouté au total.', cursorPos: { x: '48%', y: '68%' }, clicking: true },
      { subtitle: '4. Le total et la monnaie à rendre sont récapitulés. Cette démonstration s’arrête avant la confirmation : aucune vente n’est enregistrée.', cursorPos: { x: '50%', y: '82%' } },
    ],
  },
  {
    id: 'vid-receipt', moduleNumber: 'Partie 2 / 7', durationSec: 20,
    title: 'Relire un reçu illustratif',
    summary: 'Un aperçu permet de vérifier les lignes, le total, les frais éventuels et les informations facultatives avant de choisir un format de reçu.',
    icon: ReceiptText, accentBg: 'from-emerald-600 to-teal-700',
    frames: [
      { subtitle: '1. L’aperçu affiche les articles et les quantités du ticket simulé.', cursorPos: { x: '42%', y: '34%' } },
      { subtitle: '2. Vérifiez le total et les frais de livraison s’ils sont inclus dans cet exemple.', cursorPos: { x: '67%', y: '57%' } },
      { subtitle: '3. Les coordonnées client et livraison peuvent être modifiées dans « Infos client / livraison ».', cursorPos: { x: '42%', y: '71%' }, clicking: true },
      { subtitle: '4. Les boutons proposés sont « Image PNG », « Imprimer » et « Envoyer sur WhatsApp ». La démo ne télécharge rien et n’envoie aucun message.', cursorPos: { x: '77%', y: '84%' } },
    ],
  },
  {
    id: 'vid-stock', moduleNumber: 'Partie 3 / 7', durationSec: 20,
    title: 'Rechercher un article et saisir un arrivage',
    summary: 'La page Marchandises & Stock permet de filtrer le catalogue, consulter les quantités et ouvrir la saisie « + Stock ». Les données affichées sont fictives.',
    icon: Package, accentBg: 'from-amber-600 to-orange-700',
    frames: [
      { subtitle: '1. Recherchez un article dans « Filtrer vos marchandises… » ou changez le mode d’affichage.', cursorPos: { x: '34%', y: '30%' } },
      { subtitle: '2. Vérifiez la quantité et le seuil d’alerte définis pour l’article.', cursorPos: { x: '53%', y: '47%' } },
      { subtitle: '3. « + Stock » ouvre la saisie d’un arrivage; cette animation ne valide aucune quantité.', cursorPos: { x: '78%', y: '62%' }, clicking: true },
      { subtitle: '4. Les modifications du stock ne sont pas enregistrées dans ce tutoriel simulé.', cursorPos: { x: '52%', y: '74%' } },
    ],
  },
  {
    id: 'vid-ai', moduleNumber: 'Partie 4 / 7', durationSec: 20,
    title: 'Poser une question à ShopFlow AI',
    summary: 'L’assistant peut répondre lorsque la connexion et le service sont disponibles. Ses réponses restent à vérifier et ne déclenchent pas automatiquement d’action dans la boutique.',
    icon: Bot, accentBg: 'from-violet-600 to-purple-700',
    frames: [
      { subtitle: '1. Ouvrez ShopFlow AI depuis « Plus » et écrivez votre question.', cursorPos: { x: '48%', y: '75%' }, clicking: true },
      { subtitle: '2. La réponse dépend de la connexion et de la disponibilité du service en ligne.', cursorPos: { x: '33%', y: '44%' } },
      { subtitle: '3. Lisez la réponse et vérifiez les informations avant de vous y fier.', cursorPos: { x: '55%', y: '53%' } },
      { subtitle: '4. L’illustration ne contient pas d’analyse réelle de boutique et ne modifie aucune donnée.', cursorPos: { x: '50%', y: '72%' } },
    ],
  },
  {
    id: 'vid-credits', moduleNumber: 'Partie 5 / 7', durationSec: 20,
    title: 'Consulter les crédits et les avances notées',
    summary: 'Le carnet présente les montants restants et les avances enregistrées par le commerçant. Les exemples restent fictifs; aucun paiement n’est initié par ShopFlow.',
    icon: ReceiptText, accentBg: 'from-rose-600 to-pink-700',
    frames: [
      { subtitle: '1. « Carnet Bon / Crédit Clients » récapitule les fiches de crédit enregistrées.', cursorPos: { x: '40%', y: '36%' } },
      { subtitle: '2. « Encaisser avance » sert à noter une avance reçue hors de l’application; ce tutoriel n’enregistre rien.', cursorPos: { x: '66%', y: '52%' }, clicking: true },
      { subtitle: '3. Le solde restant reflète les avances déjà consignées dans la fiche.', cursorPos: { x: '42%', y: '52%' } },
      { subtitle: '4. « Rappel WhatsApp » prépare un message à vérifier. Aucun rappel n’est envoyé ici.', cursorPos: { x: '72%', y: '70%' } },
    ],
  },
  {
    id: 'vid-pin', moduleNumber: 'Partie 6 / 7', durationSec: 20,
    title: 'Comprendre le Mode Vendeur et le code PIN',
    summary: 'Le Mode Vendeur limite l’accès à certains écrans protégés par le code PIN propriétaire. Le code reste privé et n’apparaît pas dans cette animation.',
    icon: Lock, accentBg: 'from-slate-800 to-slate-950',
    frames: [
      { subtitle: '1. Le propriétaire configure le Mode Vendeur depuis les paramètres.', cursorPos: { x: '70%', y: '27%' } },
      { subtitle: '2. Les écrans autorisés restent disponibles pour le vendeur.', cursorPos: { x: '27%', y: '48%' } },
      { subtitle: '3. Un écran protégé demande le code PIN propriétaire.', cursorPos: { x: '50%', y: '58%' } },
      { subtitle: '4. Ne partagez pas le PIN. Cette démonstration n’en saisit ni n’enregistre aucun.', cursorPos: { x: '50%', y: '70%' } },
    ],
  },
  {
    id: 'vid-currency', moduleNumber: 'Partie 7 / 7', durationSec: 20,
    title: 'Basculer rapidement entre FC et USD',
    summary: 'Le bouton de devise placé dans l’en-tête change l’affichage depuis l’interface de gestion, sans passer par Paramètres.',
    icon: Coins, accentBg: 'from-cyan-600 to-blue-700',
    frames: [
      { subtitle: '1. Repérez le bouton FC / USD près du nom ShopFlow.', cursorPos: { x: '83%', y: '19%' } },
      { subtitle: '2. Touchez le bouton pour basculer l’affichage des montants.', cursorPos: { x: '83%', y: '19%' }, clicking: true },
      { subtitle: '3. La conversion utilise le taux de change configuré pour la boutique; le défaut initial est de 2 400 FC pour 1 USD.', cursorPos: { x: '63%', y: '48%' } },
      { subtitle: '4. La démonstration montre uniquement un changement d’affichage, sans modifier ni envoyer de paiement.', cursorPos: { x: '52%', y: '69%' } },
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
          {/* App Mini Header — illustrative, not a live application */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <img src={SHOPFLOW_APP_LOGO} alt="ShopFlow" className="h-6 w-6 rounded-md object-contain" />
              <span className="text-xs font-black text-slate-900">Shop<span className="text-[#0A4DFF]">Flow</span> · Ma Boutique</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-800">
              <Coins className="h-3 w-3" /> {video.id === 'vid-currency' && stepIdx >= 2 ? 'USD' : 'FC'}
            </span>
          </div>
          <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">Illustration simulée · aucune opération réelle</p>

          {/* Dynamic module illustration */}
          <div className="my-auto py-2">
            {video.id === 'vid-pos' && (
              <div className="space-y-2.5 text-xs">
                {[INITIAL_PRODUCTS[0], INITIAL_PRODUCTS[1]].map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <img src={prod.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      <div><p className="font-bold text-slate-900">{prod.name}</p><p className="text-[10px] text-slate-500">Quantité au ticket : 1</p></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">Facture +</span>
                  </div>
                ))}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-[10px] text-slate-700">
                  <p className="font-bold">Paiement : Cash · Mobile Money · Carte · Crédit</p>
                  <p className="mt-1">Livraison : <strong>Sans frais</strong> · Avec frais (montant défini par le vendeur)</p>
                  <p className="mt-1 border-t border-blue-100 pt-1.5 font-extrabold">Démo arrêtée avant la validation du ticket.</p>
                </div>
              </div>
            )}

            {video.id === 'vid-receipt' && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <div className="flex items-center justify-between"><span className="font-black text-slate-900">APERÇU — EXEMPLE FICTIF</span><span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[9px] font-black text-blue-800">APERÇU</span></div>
                <p className="text-[10px] text-slate-600">Client démo · articles et frais selon le ticket illustré</p>
                <div className="flex items-center justify-between rounded-xl bg-[#081844] px-3 py-2 text-white"><span className="text-[10px] font-bold">TOTAL EXEMPLE</span><span className="font-black">73 000 FC</span></div>
                <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-bold text-slate-700"><span className="rounded-lg bg-white p-2">Image PNG</span><span className="rounded-lg bg-white p-2">Imprimer</span><span className="rounded-lg bg-white p-2">WhatsApp</span></div>
                <p className="text-center text-[9px] text-slate-500">Aucun téléchargement ni message n’est déclenché.</p>
              </div>
            )}

            {video.id === 'vid-stock' && (
              <div className="space-y-2.5 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500">Filtrer vos marchandises… · Tableau / cartes</div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-3"><img src={INITIAL_PRODUCTS[5].image} alt="" className="h-10 w-10 rounded-lg object-cover" /><div><p className="font-black text-slate-900">{INITIAL_PRODUCTS[5].name}</p><p className="text-[10px] text-slate-500">Quantité : {INITIAL_PRODUCTS[5].stock} · exemple</p></div></div>
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold text-slate-700">+ Stock</span>
                </div>
                <p className="text-center text-[9px] text-slate-500">La saisie et l’enregistrement ne sont pas exécutés dans ce tutoriel.</p>
              </div>
            )}

            {video.id === 'vid-ai' && (
              <div className="space-y-2.5 text-xs">
                <div className="ml-8 rounded-2xl bg-slate-100 px-3.5 py-2 font-semibold text-slate-800">Comment ajouter un article ?</div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3"><p className="font-black text-slate-900">ShopFlow AI · réponse illustrative</p><p className="mt-1 text-[10px] leading-relaxed text-slate-600">Ouvrez « Marchandises & Stock », puis utilisez « Ajouter une marchandise ». Les réponses réelles dépendent du service en ligne et doivent être vérifiées.</p></div>
              </div>
            )}

            {video.id === 'vid-credits' && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-rose-700">Exemple fictif · carnet de crédits</p>
                <div className="flex items-center justify-between"><span className="font-black text-slate-900">Client démo</span><span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800">Reste : 95 000 FC</span></div>
                <p className="text-[10px] text-slate-600">Avance enregistrée : 100 000 FC / 195 000 FC</p>
                <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-bold"><span className="rounded-lg border border-slate-200 bg-white p-2">Encaisser avance</span><span className="rounded-lg border border-slate-200 bg-white p-2">Rappel WhatsApp</span></div>
                <p className="text-center text-[9px] text-slate-500">Aucun paiement ni rappel n’est effectué.</p>
              </div>
            )}

            {video.id === 'vid-pin' && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs">
                <Lock className="mx-auto h-5 w-5 text-amber-600" />
                <p className="font-black text-slate-900">Mode Vendeur</p>
                <p className="text-[10px] text-slate-600">Un écran protégé demande le code PIN propriétaire.</p>
                <div className="inline-block rounded-xl bg-white px-5 py-2 font-mono text-base font-black tracking-[0.45em] text-slate-900 ring-1 ring-slate-300">••••</div>
                <p className="text-[9px] text-slate-500">Code fictif masqué · aucune saisie réelle</p>
              </div>
            )}

            {video.id === 'vid-currency' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-[10px] font-bold text-slate-500">Devise affichée · accès rapide depuis l’en-tête</p>
                <div className="flex items-center justify-center gap-3"><span className="rounded-xl bg-white px-4 py-2 text-xl font-black text-slate-900">{stepIdx < 2 ? 'FC' : 'USD'}</span><span className="text-slate-400">⇄</span><span className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xl font-black text-[#0A4DFF]">{stepIdx < 2 ? 'USD' : 'FC'}</span></div>
                <p className="text-[10px] text-slate-600">Exemple : 12 000 FC = 5 USD au taux initial de 2 400 FC / USD</p>
                <p className="text-[9px] text-slate-500">Bascule d’affichage uniquement — aucun paiement réel.</p>
              </div>
            )}
          </div>

          {/* Animated pointer remains inside the schematic stage */}
          <motion.div
            animate={{ left: currentFrame.cursorPos.x, top: currentFrame.cursorPos.y, scale: currentFrame.clicking ? [1, 0.84, 1.08, 1] : 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute z-20 flex items-center justify-center"
          >
            {currentFrame.clicking && <motion.span initial={{ scale: 0.4, opacity: 0.9 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ repeat: Infinity, duration: 0.9 }} className="absolute h-8 w-8 rounded-full bg-[#0A4DFF]" />}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl ring-2 ring-white"><MousePointerClick className="h-4 w-4" /></div>
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
