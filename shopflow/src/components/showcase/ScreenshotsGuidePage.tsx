import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Coins,
  Lock,
  Maximize2,
  Package,
  Play,
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
    id: 'cap-dashboard', number: '01', category: 'ventes',
    title: 'L’accueil vous indique par où commencer',
    subtitle: 'Au premier lancement, l’accueil guide le commerçant vers l’ajout des articles puis l’ouverture de la caisse. Les indicateurs détaillés restent dans le suivi.',
    steps: [
      'Ajoutez d’abord un article depuis « Ouvrir le stock » ou « Ajouter une marchandise ».',
      'Une fois le catalogue prêt, ouvrez « Ouvrir la caisse » pour préparer une vente.',
      'Le suivi détaillé de l’activité se consulte séparément; ce guide n’utilise pas de données réelles.',
    ],
  },
  {
    id: 'cap-pos', number: '02', category: 'ventes',
    title: 'Préparer une vente et choisir la livraison',
    subtitle: 'La caisse permet d’ajouter des articles au ticket, de régler les quantités, puis de vérifier le paiement et les frais avant confirmation.',
    steps: [
      'Dans « Caisse & Vente Rapide », cherchez un article et choisissez « Facture + » pour l’ajouter au ticket.',
      'Ajustez les quantités avec les boutons − et + du ticket, puis choisissez le mode de paiement.',
      'Choisissez « Sans frais » ou « Avec frais » de livraison et saisissez le montant si nécessaire.',
      'Vérifiez le total puis choisissez « Valider + Générer Reçu Image WhatsApp » ou « Encaisser rapidement sans reçu ».',
    ],
  },
  {
    id: 'cap-receipt', number: '03', category: 'ventes',
    title: 'Vérifier et partager un reçu',
    subtitle: 'Après avoir choisi la génération du reçu, l’application présente un aperçu avec les articles, les coordonnées facultatives et le mode de paiement.',
    steps: [
      'Relisez les articles, les quantités, le total et, s’il y en a, les frais de livraison.',
      'Complétez ou corrigez les informations client dans « Infos client / livraison ».',
      'Choisissez « Image PNG », « Imprimer » ou « Envoyer sur WhatsApp » selon le besoin.',
      'La démo utilise un reçu fictif : aucun message n’est envoyé et aucune vente n’est créée par ce guide.',
    ],
  },
  {
    id: 'cap-stock', number: '04', category: 'stock',
    title: 'Retrouver et mettre à jour les articles',
    subtitle: 'La page « Mes Marchandises & Stock » propose recherche, affichage en tableau ou cartes, quantités et actions sur chaque article.',
    steps: [
      'Filtrez les articles avec « Filtrer vos marchandises… » ou parcourez le tableau / les cartes.',
      'Vérifiez la quantité, les prix d’achat et de vente; l’alerte de stock bas dépend du seuil défini pour l’article.',
      'Utilisez « + Stock » pour saisir un arrivage ou ouvrez l’article pour le modifier.',
      'Les exemples affichés dans cette capture sont fictifs et ne modifient pas votre stock.',
    ],
  },
  {
    id: 'cap-ai', number: '05', category: 'gestion',
    title: 'Poser une question à l’assistant IA',
    subtitle: 'L’assistant répond selon la connexion et la disponibilité du service. Ses réponses sont des suggestions à vérifier, pas une action automatique dans la boutique.',
    steps: [
      'Ouvrez ShopFlow AI depuis « Plus » et écrivez une question dans la conversation.',
      'Attendez la réponse si la connexion et le service en ligne sont disponibles.',
      'Vérifiez les informations avant de les utiliser; l’assistant peut se tromper.',
    ],
  },
  {
    id: 'cap-credits', number: '06', category: 'gestion',
    title: 'Consulter le carnet des crédits clients',
    subtitle: 'Le carnet garde le montant dû et les avances enregistrées par le commerçant; le rappel WhatsApp est préparé à sa demande.',
    steps: [
      'Ouvrez « Carnet Bon / Crédit Clients » depuis « Plus ».',
      'Consultez le solde restant et les avances déjà notées.',
      'La commande de rappel prépare un message à vérifier et à envoyer vous-même.',
      'Les données et actions illustrées ici sont fictives; aucune transaction n’est exécutée.',
    ],
  },
  {
    id: 'cap-security', number: '07', category: 'gestion',
    title: 'Comprendre le Mode Vendeur',
    subtitle: 'Le Mode Vendeur verrouille certains écrans derrière le code PIN propriétaire lorsque le téléphone est utilisé par un caissier.',
    steps: [
      'Le propriétaire active le Mode Vendeur depuis les paramètres de l’application.',
      'Le vendeur conserve l’accès aux écrans autorisés pour la vente.',
      'Le code PIN propriétaire sert à quitter le mode protégé; gardez-le confidentiel.',
    ],
  },
  {
    id: 'cap-currency', number: '08', category: 'gestion',
    title: 'Changer rapidement la devise affichée',
    subtitle: 'Le petit bouton FC / USD dans l’en-tête bascule l’affichage des montants sans ouvrir les paramètres.',
    steps: [
      'Repérez le bouton de devise près du nom ShopFlow.',
      'Touchez-le pour passer de FC à USD, ou de USD à FC.',
      'La conversion utilise le taux enregistré pour la boutique; le taux initial est 2 400 FC pour 1 USD.',
    ],
  },
];

/**
 * App-like illustrative screens. Labels and steps follow the current ShopFlow interface.
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
            <span className="text-xs font-extrabold tracking-tight">ShopFlow · Ma Boutique</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-sky-200">
            <Coins className="h-3 w-3" /> FC
          </span>
        </div>

        <div className="space-y-3 p-3.5 text-xs">
          {/* SCREEN 1: DASHBOARD */}
          {captureId === 'cap-dashboard' && (
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#0A4DFF]">① Commencez ici</p>
              <p className="mt-1 text-sm font-black text-slate-900">Deux étapes simples pour démarrer</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white p-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-800">1</span>
                  <span className="text-[11px] font-bold text-slate-800">Ajouter mes articles</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">2</span>
                  <span className="text-[11px] font-bold text-slate-600">Enregistrer une vente</span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-[#0A4DFF] px-3 py-2 text-center text-[11px] font-extrabold text-white">Ouvrir le stock →</div>
              <p className="mt-3 text-[10px] text-slate-500">② Les chiffres détaillés restent repliés sur l’accueil.</p>
            </div>
          )}

          {/* SCREEN 2: POS */}
          {captureId === 'cap-pos' && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">
                  ① Caisse & Vente Rapide
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
                  <div className="flex shrink-0 flex-col gap-1">
                    <span className="rounded-lg bg-emerald-600 px-2 py-1 text-center text-[9px] font-black text-white">+1 Vendu</span>
                    <span className="rounded-lg border border-slate-200 px-2 py-1 text-center text-[9px] font-bold text-slate-700">Facture +</span>
                  </div>
                </div>
              ))}

              <div className="space-y-2 rounded-xl bg-blue-50 p-2.5 text-[9px] font-semibold text-slate-700">
                <p>Mode de paiement : Cash · Mobile Money · Carte · Crédit</p>
                <p>Livraison : <strong>Sans frais</strong> / Avec frais</p>
                <div className="flex items-center justify-between border-t border-blue-100 pt-2"><span>Total facturé (exemple)</span><strong>73 000 FC</strong></div>
                <p className="rounded-lg bg-[#0A4DFF] px-2 py-1.5 text-center font-extrabold text-white">Valider + Générer Reçu Image WhatsApp</p>
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
                      ① BOUTIQUE DÉMO
                    </p>
                    <p className="text-[9px] text-slate-400">
                      EXEMPLE DE REÇU • Kinshasa
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-800">APERÇU</span>
              </div>

              <div className="my-2.5 space-y-1.5 text-[10px]">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>1× Collier doré</span>
                  <span className="font-bold">45 000 FC</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>1× Bracelet perlé</span>
                  <span className="font-bold">28 000 FC</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#081844] px-3 py-2 text-white">
                <span className="text-[10px] font-bold">② TOTAL (EXEMPLE)</span>
                <span className="text-xs font-black">73 000 FC</span>
              </div>

              <div className="mt-2.5 rounded-lg bg-emerald-600 py-1.5 text-center text-[10px] font-black text-white">Envoyer sur WhatsApp · Image PNG · Imprimer</div>
            </div>
          )}

          {/* SCREEN 4: INVENTORY */}
          {captureId === 'cap-stock' && (
            <>
              <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-700">
                <span>Mes Marchandises & Stock</span>
                <Package className="h-3.5 w-3.5 text-emerald-700" />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] text-slate-500">Filtrer vos marchandises… · Tableau complet · Cartes photos</div>

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

              <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-extrabold">
                <span className="rounded-xl border border-slate-200 bg-white py-2 text-slate-700">+ Stock</span>
                <span className="rounded-xl bg-emerald-600 py-2 text-white">+1 Vendu</span>
              </div>
            </>
          )}

          {/* SCREEN 5: AI ASSISTANT */}
          {captureId === 'cap-ai' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-extrabold text-[#0A4DFF]">
                <Bot className="h-3.5 w-3.5" /> ShopFlow AI
              </div>
              <div className="ml-6 rounded-2xl bg-slate-200/80 px-3 py-2 text-[10px] font-semibold text-slate-900">Comment ajouter un article ?</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[10px] leading-relaxed text-slate-700">
                Ouvrez « Marchandises & Stock », puis choisissez « Ajouter une marchandise ». Les réponses IA en ligne dépendent de la connexion et sont à vérifier.
              </div>
            </div>
          )}

          {/* SCREEN 6: CREDITS */}
          {captureId === 'cap-credits' && (
            <div className="space-y-2.5">
              <div className="rounded-xl bg-rose-50 p-2.5 text-rose-950 ring-1 ring-rose-200">
                <span className="text-[10px] font-bold">
                  ① Exemple fictif · total restant dehors
                </span>
                <p className="text-base font-black tabular-nums">199 000 FC</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex justify-between">
                  <p className="text-[11px] font-black text-slate-900">
                    Client démo
                  </p>
                  <span className="text-[10px] font-bold text-amber-700">
                    Reste : 95 000 FC
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  ② Avance enregistrée (exemple) : 100 000 FC / 195 000 FC
                </p>
                <div className="mt-2 rounded-lg bg-emerald-600 py-1.5 text-center text-[10px] font-black text-white">
                  ③ Envoyer Rappel Poli sur WhatsApp
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 7: SECURITY & THEME */}
          {captureId === 'cap-security' && (
            <div className="space-y-2.5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                <Lock className="mx-auto h-5 w-5 text-amber-600" />
                <p className="mt-1 text-[11px] font-black text-slate-900">Mode Vendeur</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-600">Les écrans réservés au propriétaire demandent le code PIN configuré.</p>
                <div className="mt-2 inline-block rounded-xl bg-white px-4 py-1 font-mono text-sm font-black tracking-[0.4em] text-slate-900 ring-1 ring-slate-300">••••</div>
              </div>
              <p className="rounded-xl border border-slate-200 bg-white p-2.5 text-[10px] text-slate-600">Le PIN est privé : cette maquette n’en affiche ni n’enregistre aucun.</p>
            </div>
          )}
          {captureId === 'cap-currency' && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500">Devise affichée</p>
                <p className="mt-1 text-xl font-black text-slate-900">FC</p>
              </div>
              <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-extrabold text-slate-800">
                <Coins className="h-4 w-4 text-[#0A4DFF]" /> FC · toucher pour USD
              </button>
              <p className="text-[10px] leading-relaxed text-slate-500">Taux initial indicatif : 1 USD = 2 400 FC. Le vendeur peut le modifier dans les paramètres.</p>
            </div>
          )}
        </div>
        <nav aria-label="Navigation simulée ShopFlow" className="grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 text-center text-[8px] font-bold text-slate-500">
          <span>Accueil</span><span className={captureId === 'cap-pos' ? 'text-[#0A4DFF]' : ''}>Vendre</span><span className={captureId === 'cap-stock' ? 'text-[#0A4DFF]' : ''}>Stock</span><span>Plus</span>
        </nav>
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
            Faites défiler pour découvrir les principaux parcours de l’application, expliqués étape par étape.
            Les écrans sont des illustrations schématiques — pas des captures directes de l’application — et les exemples sont fictifs; ce guide ne réalise aucune vente.
          </p>

          {/* Filter Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { id: 'all', label: 'Tous les écrans (8)' },
              { id: 'ventes', label: 'Ventes & Reçus' },
              { id: 'stock', label: 'Stock' },
              { id: 'gestion', label: 'Gestion, crédits, devise & sécurité' },
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
                    <span>Cliquer pour agrandir l’illustration</span>
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
                Illustration schématique — l’application n’est pas intégrée au site et aucun parcours de vente n’est exécuté.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
