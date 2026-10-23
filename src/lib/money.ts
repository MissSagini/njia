/** Amounts are whole Kenyan shillings. "KSh 250,000" */
export const formatKes = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`;
