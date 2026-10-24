import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Lock,
  Maximize2,
  Package,
  Play,
  Volume2,
  X,
} from 'lucide-react';
import { INITIAL_PRODUCTS, SHOPFLOW_APP_LOGO } from '../../data/initialData';
import { RevealOnScroll } from './MotionPrimitives';

export interface CaptureGuideItem {
  id: string;
  number: string;
  category: 'ventes' | 'stock' | 'gestion';
  title: string;
  subtitle: string;
  steps: string[];
}

const CAPTURES: CaptureGuideItem[] = [
  {
    id: 'cap-dashboard',
    number: '01',
    category: 'ventes',
    title: 'Tableau de Bord & Vrai Bénéfice Net',
    subtitle:
      'Dès l’ouverture de ShopFlow, visualisez l’argent réellement gagné aujourd’hui sans aucune calculatrice.',
    steps: [
      'Affiche séparément le Chiffre d’Affaires, le Coût d’achat des articles vendus et vos Dépenses du jour.',
      'Calcule en direct votre Vrai Bénéfice Net exact en Francs (FC) ou en Dollars ($ USD).',
      'Courbe automatique des 7 derniers jours pour suivre la progression de votre boutique.',
    ],
  },
  {
    id: 'cap-pos',
    number: '02',
    category: 'ventes',
    title: 'Caisse Rapide 1-Clic & Panier Client',
    subtitle:
      'Servez vos clients en moins de 2 secondes au comptoir, même aux heures de grande affluence.',
    steps: [
      'Appuyez sur « +1 Vendu » pour encaisser un article instantanément, ou ajoutez plusieurs articles au panier.',
      'Choisissez le mode de règlement : Cash, Mobile Money (M-Pesa, Orange, Airtel) ou Crédit.',
      'Vous vous êtes trompé ? Annulez une vente en 1 clic et le stock se remet à jour tout seul.',
    ],
  },
  {
    id: 'cap-receipt',
    number: '03',
    category: 'ventes',
    title: 'Reçu Graphique Professionnel sur WhatsApp',
    subtitle:
      'Offrez à chaque client un reçu propre et haut de gamme portant le logo et les couleurs de votre boutique.',
    steps: [
      'Génère automatiquement le numéro de reçu, la date, le nom du client et les miniatures photos des articles.',
      'Affiche clairement le sous-total, la livraison éventuelle et le cachet officiel « ✓ PAYÉ ».',
      'Téléchargeable en image HD (PNG) ou PDF pour l’envoyer directement sur le WhatsApp du client.',
    ],
  },
  {
    id: 'cap-stock',
    number: '04',
    category: 'stock',
    title: 'Inventaire, Prix d’Achat & Alertes Rupture',
    subtitle:
      'Sachez toujours exactement combien de pièces restent en rayon avant de tomber en rupture.',
    steps: [
      'Chaque vente diminue votre stock réel automatiquement à la seconde même.',
      'Un badge orange « Stock bas » vous alerte dès qu’un produit descend sous le seuil minimum choisi.',
      'Bouton « + Réapprovisionner » pour ajouter un nouvel arrivage en 3 secondes.',
    ],
  },
  {
    id: 'cap-scanner',
    number: '05',
    category: 'stock',
    title: 'Scanner Photo & Code-Barres Intelligent',
    subtitle:
      'Plus besoin d’acheter un lecteur laser coûteux : la caméra de votre téléphone fait tout.',
    steps: [
      'Lit instantanément les codes-barres et QR codes sur n’importe quel emballage.',
      'Fonctionne aussi en prenant simplement une photo d’un article sans code-barres grâce à la reconnaissance visuelle.',
      'Encaisse directement l’article ou l’ajoute au panier client.',
    ],
  },
  {
    id: 'cap-ai',
    number: '06',
    category: 'gestion',
    title: 'ShopFlow AI : Conseiller Financier & Voix Naturelle',
    subtitle:
      'Posez vos questions en langage simple, obtenez des tableaux clairs et écoutez les réponses à voix haute.',
    steps: [
      'Connaît en temps réel vos ventes, vos marges et vos articles les plus rentables.',
      'Simule vos promotions, calcule vos seuils de rentabilité et rédige vos textes publicitaires WhatsApp.',
      '6 voix naturelles au choix (masculines & féminines) sans jamais prononcer de symboles bizarres.',
    ],
  },
  {
    id: 'cap-credits',
    number: '07',
    category: 'gestion',
    title: 'Cahier de Crédits (« Bons ») & Relance 1 Clic',
    subtitle:
      'Ne perdez plus jamais d’argent à cause des dettes clients oubliées sur des feuilles volantes.',
    steps: [
      'Enregistre le nom du client, son numéro WhatsApp, le détail pris et la date promise.',
      'Note chaque avance partielle versée et calcule automatiquement le reste exact à payer.',
      'Envoie un message de rappel poli et professionnel sur WhatsApp en un seul toucher.',
    ],
  },
  {
    id: 'cap-security',
    number: '08',
    category: 'gestion',
    title: 'Mode Vendeur (Code PIN) & Thème Boutique',
    subtitle:
      'Laissez vos employés tenir la caisse sans jamais dévoiler vos bénéfices secrets ni vos prix fournisseurs.',
    steps: [
      'Activez le cadenas « Mode Vendeur » en 1 clic avant de confier le téléphone à votre caissier.',
      'Seul votre Code PIN Patron à 4 chiffres permet de rouvrir le Tableau de bord et les Paramètres.',
      'Personnalisez aussi les couleurs, le mode sombre AMOLED et la langue complète (FR, EN, Lingala, Swahili, Chinois).',
    ],
  },
];

/**
 * High-precision visual phone screen renderer for each of the 8 real ShopFlow screens
 */
export const PhoneScreenCapture: React.FC<{ captureId: string }> = ({
  captureId,
}) => {
  const p1 = INITIAL_PRODUCTS[0];
  const p2 = INITIAL_PRODUCTS[1];
  const p3 = INITIAL_PRODUCTS[5];

  return (
    <div className="mx-auto w-full max-w-[330px] rounded-[36px] border-[7px] border-slate-900 bg-slate-950 p-1.5 shadow-2xl ring-1 ring-white/15">
      {/* Dynamic Island Notch */}
      <div className="overflow-hidden rounded-[28px] bg-slate-50 text-slate-900">
        <div className="flex items-center justify-between bg-[#081844] px-4 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="ShopFlow"
              className="h-6 w-6 rounded-md bg-white p-0.5 object-contain"
            />
            <span className="text-xs font-extrabold tracking-tight">
              ShopFlow Pro
            </span>
          </div>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-sky-200">
            FC
          </span>
        </div>

        <div className="space-y-3 p-3.5 text-xs">
          {/* SCREEN 1: DASHBOARD */}
          {captureId === 'cap-dashboard' && (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-3.5 text-white shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-100">
                  <span>① VRAI BÉNÉFICE NET DU JOUR</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5">
                    +18%
                  </span>
                </div>
                <p className="mt-1 text-2xl font-black tabular-nums">
                  + 63 500 FC
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-100">
                  Coût d’achat & dépenses déjà déduits
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    ② Chiffre d’Affaires
                  </span>
                  <p className="mt-0.5 text-sm font-black text-slate-900 tabular-nums">
                    485 000 FC
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    Dépenses boutique
                  </span>
                  <p className="mt-0.5 text-sm font-black text-amber-700 tabular-nums">
                    − 19 000 FC
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>③ Progression 7 jours</span>
                  <BarChart3 className="h-3.5 w-3.5 text-[#0A4DFF]" />
                </div>
                <div className="mt-2.5 flex h-16 items-end gap-1.5">
                  {[42, 56, 48, 70, 78, 92, 100].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={`flex-1 rounded-t-md ${
                        i === 6 ? 'bg-emerald-500' : 'bg-[#0A4DFF]/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SCREEN 2: POS */}
          {captureId === 'cap-pos' && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">
                  ① Caisse Rapide 1-Clic
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#0A4DFF]">
                  Panier : 2 art.
                </span>
              </div>

              {[p1, p2].map((prod, idx) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                    <div>
                      <p className="line-clamp-1 text-[11px] font-bold text-slate-900">
                        {prod.name}
                      </p>
                      <p className="text-[11px] font-black text-[#0A4DFF] tabular-nums">
                        {prod.sellingPriceFC.toLocaleString('fr-FR')} FC
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black text-white">
                    {idx === 0 ? '② +1 Vendu' : '+1 Vendu'}
                  </span>
                </div>
              ))}

              <div className="rounded-xl bg-[#0A4DFF] p-3 text-center text-white shadow-xs">
                <p className="text-[11px] font-black">
                  ③ Encaisser 97 500 FC & Reçu WhatsApp →
                </p>
              </div>
            </>
          )}

          {/* SCREEN 3: RECEIPT */}
          {captureId === 'cap-receipt' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A4DFF] text-[10px] font-black text-white">
                    MG
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-900">
                      ① MAMAN GRÂCE MARKET
                    </p>
                    <p className="text-[9px] text-slate-400">
                      REÇU #2026-0427 • Kinshasa
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800">
                  ✓ PAYÉ
                </span>
              </div>

              <div className="my-2.5 space-y-1.5 text-[10px]">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>1× Sac de Riz 25 kg</span>
                  <span className="font-bold">68 000 FC</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>1× Huile Végétale 5 L</span>
                  <span className="font-bold">29 500 FC</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#081844] px-3 py-2 text-white">
                <span className="text-[10px] font-bold">② TOTAL PAYÉ</span>
                <span className="text-xs font-black">97 500 FC</span>
              </div>

              <div className="mt-2.5 rounded-lg bg-emerald-600 py-1.5 text-center text-[10px] font-black text-white">
                ③ Partager l’image HD sur WhatsApp
              </div>
            </div>
          )}

          {/* SCREEN 4: INVENTORY */}
          {captureId === 'cap-stock' && (
            <>
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-900 ring-1 ring-amber-200">
                <span>① Alerte : 2 produits bientôt épuisés</span>
                <Package className="h-3.5 w-3.5 text-amber-600" />
              </div>

              {[p2, p3].map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-[11px] font-bold text-slate-900">
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-semibold">
                        ② Gain/u : +
                        {(
                          prod.sellingPriceFC - prod.purchasePriceFC
                        ).toLocaleString('fr-FR')}{' '}
                        FC
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                      prod.stock <= prod.minStockAlert
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    Stock: {prod.stock}
                  </span>
                </div>
              ))}

              <div className="rounded-xl bg-slate-900 py-2 text-center text-[10px] font-bold text-white">
                ③ + Réapprovisionner en 1 clic
              </div>
            </>
          )}

          {/* SCREEN 5: SCANNER */}
          {captureId === 'cap-scanner' && (
            <div className="space-y-2.5">
              <div className="relative flex h-36 flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-white">
                <img
                  src={p1.image}
                  alt="Scan"
                  className="absolute inset-0 h-full w-full object-cover opacity-45"
                />
                <div className="relative z-10 h-20 w-44 rounded-xl border-2 border-emerald-400 bg-black/25 p-2 text-center">
                  <div className="mt-6 h-0.5 w-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  <p className="mt-2 text-[9px] font-bold text-emerald-300">
                    ① Code détecté : 6201045900124
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
                <div>
                  <p className="text-[11px] font-black text-slate-900">
                    ② Sac de Riz Parfumé 25 kg
                  </p>
                  <p className="text-[10px] font-bold text-emerald-700">
                    68 000 FC • En stock (14)
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black text-white">
                  ③ Vendu ✓
                </span>
              </div>
            </div>
          )}

          {/* SCREEN 6: AI ASSISTANT */}
          {captureId === 'cap-ai' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-[#0A4DFF]">
                <span className="inline-flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5" /> ① ShopFlow AI Actif
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Volume2 className="h-3 w-3" /> ② Voix : Nova
                </span>
              </div>
              <div className="ml-8 rounded-2xl bg-slate-200/80 px-3 py-2 text-[10px] font-semibold text-slate-900">
                Quel est mon bénéfice net exact aujourd’hui ?
              </div>
              <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-[10px]">
                <p className="font-extrabold text-slate-900">
                  ③ Analyse en direct :
                </p>
                <p className="rounded-lg bg-slate-50 p-1.5 text-center font-mono text-[10px] font-bold text-[#0A4DFF]">
                  Gain Net = 485 000 − 402 500 − 19 000 = +63 500 FC
                </p>
                <p className="text-slate-600">
                  Votre article le plus rentable est{' '}
                  <strong className="text-slate-900">Riz 25 kg</strong> (+30 000
                  FC).
                </p>
              </div>
            </div>
          )}

          {/* SCREEN 7: CREDITS */}
          {captureId === 'cap-credits' && (
            <div className="space-y-2.5">
              <div className="rounded-xl bg-rose-50 p-2.5 text-rose-950 ring-1 ring-rose-200">
                <span className="text-[10px] font-bold">
                  ① Total à recouvrer chez les clients
                </span>
                <p className="text-base font-black tabular-nums">199 000 FC</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex justify-between">
                  <p className="text-[11px] font-black text-slate-900">
                    Maman Chantal
                  </p>
                  <span className="text-[10px] font-bold text-amber-700">
                    Reste : 95 000 FC
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  ② Avance déjà payée : 100 000 FC / 195 000 FC
                </p>
                <div className="mt-2 rounded-lg bg-emerald-600 py-1.5 text-center text-[10px] font-black text-white">
                  ③ Envoyer Rappel Poli sur WhatsApp
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 8: SECURITY & THEME */}
          {captureId === 'cap-security' && (
            <div className="space-y-2.5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                <Lock className="mx-auto h-5 w-5 text-amber-600" />
                <p className="mt-1 text-[11px] font-black text-slate-900">
                  ① Mode Vendeur Actif (Caisse Seule)
                </p>
                <p className="text-[10px] text-slate-600">
                  Code PIN Patron requis pour voir les bénéfices :
                </p>
                <div className="mt-2 inline-block rounded-xl bg-white px-4 py-1 font-mono text-sm font-black tracking-[0.4em] text-slate-900 ring-1 ring-slate-300">
                  • • • •
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5">
                <span className="text-[10px] font-bold text-slate-700">
                  ② Couleur & Thème Boutique
                </span>
                <div className="flex gap-1.5">
                  {[
                    'bg-[#0A4DFF]',
                    'bg-emerald-600',
                    'bg-rose-600',
                    'bg-slate-900',
                    'bg-amber-600',
                  ].map((c, idx) => (
                    <span
                      key={idx}
                      className={`h-4 w-4 rounded-full ${c} ring-2 ring-offset-1 ${
                        idx === 0 ? 'ring-blue-400' : 'ring-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ScreenshotsGuidePageProps {
  onSwitchToVideosPage: () => void;
}

export const ScreenshotsGuidePage: React.FC<ScreenshotsGuidePageProps> = ({
  onSwitchToVideosPage,
}) => {
  const [filter, setFilter] = useState<'all' | 'ventes' | 'stock' | 'gestion'>(
    'all'
  );
  const [zoomedItem, setZoomedItem] = useState<CaptureGuideItem | null>(null);

  const visibleCaptures =
    filter === 'all'
      ? CAPTURES
      : CAPTURES.filter((c) => c.category === filter);

  return (
    <div className="bg-slate-50 pb-24">
      {/* Page Hero Banner */}
      <section className="relative overflow-hidden bg-[#050B1C] py-16 text-white sm:py-22">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-[#0A4DFF]/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-1.5 text-xs font-bold text-sky-300">
            📸 Guide Visuel Étape par Étape
          </span>
          <h1 className="sf-display-heading mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Comment fonctionne ShopFlow, écran par écran
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Faites défiler pour découvrir chaque partie de l’application
            expliquée avec des captures annotées <strong className="text-white">① ② ③</strong>.
            Cliquez sur une capture pour l’agrandir : le site présente des visuels, sans intégrer l’application.
          </p>

          {/* Filter Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { id: 'all', label: 'Tous les écrans (8)' },
              { id: 'ventes', label: 'Caisse, Bénéfice & Reçus' },
              { id: 'stock', label: 'Stock & Scanner Photo' },
              { id: 'gestion', label: 'IA, Crédits & Sécurité PIN' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilter(tab.id as 'all' | 'ventes' | 'stock' | 'gestion')
                }
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  filter === tab.id
                    ? 'bg-[#0A4DFF] text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Progressive Scroll Alternating Captures */}
      <div className="mx-auto mt-14 max-w-6xl space-y-20 px-4 sm:px-6">
        {visibleCaptures.map((cap, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={cap.id}
              className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-12"
            >
              {/* Phone Capture Side */}
              <RevealOnScroll
                direction={isEven ? 'left' : 'right'}
                className={`lg:col-span-5 ${
                  isEven ? 'lg:order-1' : 'lg:order-2'
                }`}
              >
                <div
                  onClick={() => setZoomedItem(cap)}
                  className="group relative cursor-pointer"
                >
                  <PhoneScreenCapture captureId={cap.id} />
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 group-hover:text-[#0A4DFF]">
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Cliquer pour agrandir la capture</span>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Explanation Steps Side */}
              <RevealOnScroll
                direction="up"
                delay={0.1}
                className={`space-y-5 lg:col-span-7 ${
                  isEven ? 'lg:order-2' : 'lg:order-1'
                }`}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-extrabold text-[#0A4DFF]">
                  <span>ÉCRAN {cap.number} / 08</span>
                </div>

                <h2 className="sf-display-heading text-2xl font-extrabold text-slate-950 sm:text-3xl">
                  {cap.title}
                </h2>

                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  {cap.subtitle}
                </p>

                <div className="space-y-3 pt-1">
                  {cap.steps.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A4DFF] text-xs font-black text-white">
                        {sIdx + 1}
                      </span>
                      <p className="text-xs leading-relaxed font-medium text-slate-700 sm:text-sm">
                        {s}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onSwitchToVideosPage}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-[#0A4DFF] hover:text-[#0A4DFF]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current text-[#0A4DFF]" />
                    <span>Voir aussi en vidéo</span>
                  </button>
                </div>
              </RevealOnScroll>
            </div>
          );
        })}
      </div>

      {/* Lightbox Zoom Modal */}
      <AnimatePresence>
        {zoomedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl bg-slate-900 p-6 text-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setZoomedItem(null)}
                className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="mb-4 text-center text-sm font-bold text-sky-300">
                Écran {zoomedItem.number} — {zoomedItem.title}
              </p>
              <div className="scale-105 py-2">
                <PhoneScreenCapture captureId={zoomedItem.id} />
              </div>
              <p className="mt-5 text-center text-xs text-slate-400">
                Capture de présentation — l’application n’est pas intégrée à ce site.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
