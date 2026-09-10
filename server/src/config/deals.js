/**
 * DevFlow CRM — Deal & Sales Pipeline Domain Constants & Enums
 *
 * Centralized constants for Deal stages, statuses, and currencies.
 * Always import from this file; never hardcode strings across services or controllers.
 */

export const DEAL_STAGE = Object.freeze({
  QUALIFICATION: 'qualification',
  DISCOVERY: 'discovery',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
});

export const ALL_DEAL_STAGES = Object.freeze(Object.values(DEAL_STAGE));

export const DEAL_STATUS = Object.freeze({
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost',
});

export const ALL_DEAL_STATUSES = Object.freeze(Object.values(DEAL_STATUS));

export const DEAL_CURRENCY = Object.freeze({
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  PKR: 'PKR',
  CAD: 'CAD',
  AUD: 'AUD',
});

export const ALL_DEAL_CURRENCIES = Object.freeze(Object.values(DEAL_CURRENCY));

/**
 * Default probability (%) associated with each pipeline stage
 */
export const STAGE_PROBABILITY = Object.freeze({
  [DEAL_STAGE.QUALIFICATION]: 20,
  [DEAL_STAGE.DISCOVERY]: 40,
  [DEAL_STAGE.PROPOSAL]: 60,
  [DEAL_STAGE.NEGOTIATION]: 80,
  [DEAL_STAGE.CLOSED_WON]: 100,
  [DEAL_STAGE.CLOSED_LOST]: 0,
});

/**
 * Maps stage to its default status
 * @param {string} stage
 * @returns {string}
 */
export const getStatusForStage = (stage) => {
  if (stage === DEAL_STAGE.CLOSED_WON) return DEAL_STATUS.WON;
  if (stage === DEAL_STAGE.CLOSED_LOST) return DEAL_STATUS.LOST;
  return DEAL_STATUS.OPEN;
};

export const isValidDealStage = (stage) => ALL_DEAL_STAGES.includes(stage);
export const isValidDealStatus = (status) => ALL_DEAL_STATUSES.includes(status);
export const isValidCurrency = (currency) => ALL_DEAL_CURRENCIES.includes(currency);

export default {
  DEAL_STAGE,
  ALL_DEAL_STAGES,
  DEAL_STATUS,
  ALL_DEAL_STATUSES,
  DEAL_CURRENCY,
  ALL_DEAL_CURRENCIES,
  STAGE_PROBABILITY,
  getStatusForStage,
  isValidDealStage,
  isValidDealStatus,
  isValidCurrency,
};
