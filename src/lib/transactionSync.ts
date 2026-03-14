export const isManualSummaryTransaction = (orderSerial?: string | null) => {
  return typeof orderSerial === 'string' && (orderSerial.startsWith('EXP-') || orderSerial.startsWith('INC-'));
};

export const isTaggedCostOrShipping = (description?: string | null) => {
  const desc = description || '';
  return desc.includes('[cost]') || desc.includes('[shipping]');
};

export const shouldSkipMirroredWorkshopExpense = (
  description?: string | null,
  orderSerial?: string | null
) => {
  return isTaggedCostOrShipping(description) && !isManualSummaryTransaction(orderSerial);
};
