export interface FxQuote {
  fromCurrency: string;
  toCurrency: string;
  sourceAmount: number;
  rate: number;
  estimatedUsdcAmount: number;
  spreadPercent: number;
  expiresAt: string;
}

// Exchange rates against USD
const BASE_FX_RATES: Record<string, number> = {
  USD: 1.0,
  USDC: 1.0,
  EUR: 1.085, // 1 EUR = 1.085 USD
  GBP: 1.302, // 1 GBP = 1.302 USD
  JPY: 0.0067, // 1 JPY = 0.0067 USD (approx 149 JPY/USD)
};

export const fxService = {
  /**
   * Convert an international fiat invoice amount to USDC
   */
  convertInvoiceToUsdc(amount: number, fromCurrency: string): FxQuote {
    const currency = fromCurrency.toUpperCase().trim();
    const rate = BASE_FX_RATES[currency];

    if (!rate) {
      throw new Error(`Unsupported currency code '${currency}'. Supported: USD, EUR, GBP, JPY`);
    }

    const spreadPercent = 0.002; // 0.2% slippage / conversion buffer
    const rawUsdc = amount * rate;
    const finalUsdc = parseFloat((rawUsdc * (1 + spreadPercent)).toFixed(4));

    return {
      fromCurrency: currency,
      toCurrency: 'USDC',
      sourceAmount: amount,
      rate,
      estimatedUsdcAmount: finalUsdc,
      spreadPercent,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5-minute quote validity
    };
  },

  /**
   * Retrieve available FX rate feed
   */
  getRates(): Record<string, number> {
    return { ...BASE_FX_RATES };
  },
};
