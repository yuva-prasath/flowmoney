const RULES: { patterns: RegExp[]; category: string }[] = [
  { patterns: [/swiggy|zomato|dominos|pizza|mcdonald|kfc|burger|restaurant|cafe|chai|dhaba/i], category: 'Food & Dining' },
  { patterns: [/bigbasket|dmart|grofer|blinkit|zepto|jiomart|grocery|supermarket|reliance fresh/i], category: 'Groceries' },
  { patterns: [/rent|housing|pg |paying guest|lodging/i], category: 'Rent' },
  { patterns: [/uber|ola|rapido|metro|irctc|railway|bus|flight|indigo|spice|air india|taxi|makemytrip|yatra/i], category: 'Travel' },
  { patterns: [/amazon|flipkart|myntra|ajio|meesho|nykaa|shopping|mall|retail|store|snapdeal/i], category: 'Shopping' },
  { patterns: [/netflix|spotify|hotstar|prime video|zee5|sonyliv|youtube premium|subscription/i], category: 'Subscriptions' },
  { patterns: [/electricity|water|gas|broadband|jio|airtel|vi |vodafone|bill|recharge|postpaid|bsnl/i], category: 'Bills' },
  { patterns: [/movie|cinema|pvr|inox|concert|gaming|entertainment|bookmyshow/i], category: 'Entertainment' },
  { patterns: [/sip|mutual fund|zerodha|groww|upstox|stock|invest|fd |fixed deposit|ppf|nps|coin/i], category: 'Investments' },
  { patterns: [/transfer|sent to|received from|upi\/[a-z]/i], category: 'Transfers' },
];

export function categorize(merchant: string, description: string): string {
  const text = `${merchant} ${description}`;
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.category;
  }
  return 'Others';
}
