// lib/transaction-types.js
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  ARRIVAL: 'arrival', 
  REFUND: 'refund',
  SWAP: 'swap',
  CORRECTION: 'correction'
};

export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled'
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  MIXED: 'mixed'
};