import React from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { AppLanguage } from '../types';
import { SHOPFLOW_APP_LOGO } from '../data/initialData';

interface FirstRunOnboardingProps {
  language: AppLanguage;
  onStart: () => void;
  onFinish: () => void;
}

const COPY = {
  fr: {
    welcome: 'Bienvenue dans ShopFlow',
    title: 'Commencez par ajouter vos articles',
    description: 'Ajoutez vos articles et leurs quantités, puis enregistrez votre première vente dans la caisse.',
    first: '1. Ajouter des articles',
    second: '2. Enregistrer une vente',
    start: 'Ajouter mon premier article',
    later: 'Voir mon accueil',
  },
  en: {
    welcome: 'Welcome to ShopFlow',
    title: 'Start by adding your items',
    description: 'Add your items and quantities, then record your first sale at the register.',
    first: '1. Add items',
    second: '2. Record a sale',
    start: 'Add my first item',
    later: 'Go to home',
  },
  ln: {
    welcome: 'Boyei na ShopFlow',
    title: 'Bandá na kobakisa biloko na yo',
    description: 'Bakisa biloko mpe motango na yango, sima koma moteki na yo ya liboso na caisse.',
    first: '1. Bakisa biloko',
    second: '2. Komá moteki',
    start: 'Bakisa eloko na ngai ya liboso',
    later: 'Fungola ebandeli',
  },
  sw: {
    welcome: 'Karibu ShopFlow',
    title: 'Anza kwa kuongeza bidhaa zako',
    description: 'Ongeza bidhaa na kiasi chake, kisha rekodi mauzo yako ya kwanza kwenye kaunta.',
    first: '1. Ongeza bidhaa',
    second: '2. Rekodi mauzo',
    start: 'Ongeza bidhaa yangu ya kwanza',
    later: 'Nenda mwanzo',
  },
  zh: {
    welcome: '欢迎使用 ShopFlow',
    title: '先添加您的商品',
    description: '添加商品及其数量，然后在收银台记录第一笔销售。',
    first: '1. 添加商品',
    second: '2. 记录销售',
    start: '添加我的第一件商品',
    later: '返回首页',
  },
} as const;

export const FirstRunOnboarding: React.FC<FirstRunOnboardingProps> = ({
  language,
  onStart,
  onFinish,
}) => {
  const copy = language === 'en' ? COPY.en : language === 'ln' ? COPY.ln : COPY.fr;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="first-run-title">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-3">
          <img src={SHOPFLOW_APP_LOGO} alt="ShopFlow" className="h-12 w-12 rounded-2xl object-contain ring-1 ring-slate-200" />
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#0A4DFF]">{copy.welcome}</p>
        </div>
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0A4DFF]">
          <Package className="h-6 w-6" />
        </div>
        <h1 id="first-run-title" className="mt-4 text-xl font-black tracking-tight text-slate-900">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.description}</p>
        <ol className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          <li>{copy.first}</li>
          <li>{copy.second}</li>
        </ol>
        <button type="button" onClick={onStart} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A4DFF] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700">
          {copy.start}<ArrowRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onFinish} className="mt-2 w-full rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700">
          {copy.later}
        </button>
      </section>
    </div>
  );
};
