import type { SubscriptionPlanId } from '../types';

export interface PlanPresentation {
  id: SubscriptionPlanId;
  nameKey: string;
  descriptionKey: string;
  featureKeys: string[];
  plannedFeatureKeys: string[];
}

/** Shared plan copy keys for the public pricing page and the in-app plans screen. */
export const PLAN_PRESENTATIONS: PlanPresentation[] = [
  {
    id: 'starter',
    nameKey: 'plans.starter.name',
    descriptionKey: 'plans.starter.description',
    featureKeys: [
      'plans.starter.feature1',
      'plans.starter.feature2',
      'plans.starter.feature3',
      'plans.starter.feature4',
      'plans.starter.feature5',
    ],
    plannedFeatureKeys: ['plans.starter.planned1', 'plans.starter.planned2'],
  },
  {
    id: 'pro_ai',
    nameKey: 'plans.pro.name',
    descriptionKey: 'plans.pro.description',
    featureKeys: [
      'plans.pro.feature1',
      'plans.pro.feature2',
      'plans.pro.feature3',
      'plans.pro.feature4',
      'plans.pro.feature5',
    ],
    plannedFeatureKeys: ['plans.pro.planned1', 'plans.pro.planned2'],
  },
  {
    id: 'business',
    nameKey: 'plans.business.name',
    descriptionKey: 'plans.business.description',
    featureKeys: [
      'plans.business.feature1',
      'plans.business.feature2',
      'plans.business.feature3',
      'plans.business.feature4',
    ],
    plannedFeatureKeys: ['plans.business.planned1', 'plans.business.planned2', 'plans.business.planned3'],
  },
];
