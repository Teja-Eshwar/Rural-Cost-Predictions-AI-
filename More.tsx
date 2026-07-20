import { Transaction } from './supabase';
import { daysAgo, withinDays } from './format';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RiskContributor = {
  key: 'low_sales' | 'high_expenses' | 'loan_burden' | 'seasonal_variation';
  label: string;
  value: number;
  detail: string;
};

export type ForecastDay = {
  date: string;
  balance: number;
  income: number;
  expense: number;
  risk: RiskLevel;
  riskReason: string;
  suggestedAction: string;
};

export type Recommendation = {
  id: string;
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
};

export type RiskAnalysis = {
  score: number;
  level: RiskLevel;
  contributors: RiskContributor[];
  explanation: string;
  trend: { date: string; score: number }[];
};

export type AISummary = {
  text: string;
  tone: 'good' | 'warn' | 'bad';
};

export type Analytics = {
  todayIncome: number;
  todayExpense: number;
  weekIncome: number;
  weekExpense: number;
  monthIncome: number;
  monthExpense: number;
  netProfit: number;
  balance: number;
};

export function computeAnalytics(txns: Transaction[]): Analytics {
  const now = new Date();
  let todayIncome = 0, todayExpense = 0;
  let weekIncome = 0, weekExpense = 0;
  let monthIncome = 0, monthExpense = 0;
  let balance = 0;

  for (const t of txns) {
    const amt = Number(t.amount);
    const isInc = t.type === 'income';
    balance += isInc ? amt : -amt;
    const d = new Date(t.date);
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) isInc ? (todayIncome += amt) : (todayExpense += amt);
    if (daysAgo(t.date, 7, now)) isInc ? (weekIncome += amt) : (weekExpense += amt);
    if (daysAgo(t.date, 30, now)) isInc ? (monthIncome += amt) : (monthExpense += amt);
  }

  return {
    todayIncome, todayExpense, weekIncome, weekExpense,
    monthIncome, monthExpense,
    netProfit: monthIncome - monthExpense,
    balance,
  };
}

function avgDaily(txns: Transaction[], type: 'income' | 'expense', windowDays: number): number {
  const now = new Date();
  const inWindow = txns.filter((t) => t.type === type && daysAgo(t.date, windowDays, now));
  const sum = inWindow.reduce((s, t) => s + Number(t.amount), 0);
  return sum / windowDays;
}

export function computeRiskScore(txns: Transaction[]): number {
  const a = computeAnalytics(txns);
  if (txns.length === 0) return 50;
  const avgInc = avgDaily(txns, 'income', 30) || 1;
  const avgExp = avgDaily(txns, 'expense', 30) || 1;
  const expenseRatio = avgExp / avgInc;
  const loanTxns = txns.filter((t) => t.type === 'expense' && /loan|emi/i.test(t.category));
  const loanBurden = loanTxns.reduce((s, t) => s + Number(t.amount), 0);
  const loanRatio = a.monthIncome > 0 ? loanBurden / a.monthIncome : 0;

  let score = 30;
  if (expenseRatio > 0.9) score += 25;
  else if (expenseRatio > 0.7) score += 15;
  else if (expenseRatio > 0.5) score += 5;
  if (loanRatio > 0.3) score += 20;
  else if (loanRatio > 0.15) score += 10;
  if (a.balance < 0) score += 20;
  else if (a.balance < avgExp * 7) score += 10;
  if (avgInc < 100) score += 15;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return score;
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score < 40) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

export function computeRiskAnalysis(txns: Transaction[]): RiskAnalysis {
  const score = computeRiskScore(txns);
  const level = riskLevelFromScore(score);
  const avgInc = avgDaily(txns, 'income', 30);
  const avgExp = avgDaily(txns, 'expense', 30);
  const a = computeAnalytics(txns);
  const loanTxns = txns.filter((t) => t.type === 'expense' && /loan|emi/i.test(t.category));
  const loanBurden = loanTxns.reduce((s, t) => s + Number(t.amount), 0);

  const contributors: RiskContributor[] = [
    {
      key: 'low_sales',
      label: 'Low Sales',
      value: avgInc < 200 ? 70 : avgInc < 500 ? 40 : 15,
      detail: avgInc < 200 ? 'Daily income is critically low.' : avgInc < 500 ? 'Income could be higher.' : 'Sales are healthy.',
    },
    {
      key: 'high_expenses',
      label: 'High Expenses',
      value: avgExp > avgInc * 0.8 ? 70 : avgExp > avgInc * 0.5 ? 40 : 15,
      detail: avgExp > avgInc * 0.8 ? 'Expenses exceed 80% of income.' : 'Expense ratio is manageable.',
    },
    {
      key: 'loan_burden',
      label: 'Loan Burden',
      value: a.monthIncome > 0 ? Math.min(80, Math.round((loanBurden / a.monthIncome) * 100)) : 0,
      detail: loanBurden > 0 ? `₹${loanBurden} loan/EMI this month.` : 'No loan burden detected.',
    },
    {
      key: 'seasonal_variation',
      label: 'Seasonal Variation',
      value: 35,
      detail: 'Some seasonal fluctuation expected in rural businesses.',
    },
  ];

  const explanation =
    level === 'low'
      ? 'Your business is financially stable. Continue current operations and consider building reserves.'
      : level === 'medium'
      ? 'Your business shows moderate risk. Monitor expenses and aim to increase sales to improve stability.'
      : 'High risk detected. Immediate action needed: reduce non-essential spending and prioritize loan repayments.';

  // trend: last 14 days risk score based on rolling window
  const trend: { date: string; score: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const ref = new Date();
    ref.setDate(ref.getDate() - i);
    const past = txns.filter((t) => new Date(t.date) <= ref);
    trend.push({ date: ref.toISOString().slice(0, 10), score: computeRiskScore(past) });
  }

  return { score, level, contributors, explanation, trend };
}

export function computeForecast(txns: Transaction[], days: number): ForecastDay[] {
  const a = computeAnalytics(txns);
  const avgInc = avgDaily(txns, 'income', 30);
  const avgExp = avgDaily(txns, 'expense', 30);
  const loanPerWeek = txns
    .filter((t) => t.type === 'expense' && /loan|emi/i.test(t.category) && daysAgo(t.date, 30))
    .reduce((s, t) => s + Number(t.amount), 0) / 4;

  const result: ForecastDay[] = [];
  let balance = a.balance;
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i + 1);
    const dow = d.getDay();
    const weekendFactor = dow === 0 || dow === 6 ? 0.7 : 1;
    let inc = avgInc * weekendFactor * (0.85 + Math.random() * 0.3);
    let exp = avgExp * (0.85 + Math.random() * 0.3);
    if (i % 7 === 3) exp += loanPerWeek;
    balance += inc - exp;
    let risk: RiskLevel = 'low';
    let riskReason = 'Cash flow looks healthy.';
    let suggestedAction = 'Maintain current operations.';
    if (balance < avgExp * 3) {
      risk = balance < avgExp ? 'high' : 'medium';
      riskReason = balance < avgExp ? 'Predicted balance below 1 day of expenses.' : 'Reserves dropping below 3 days of expenses.';
      suggestedAction = risk === 'high' ? 'Reduce non-essential spending immediately.' : 'Delay discretionary purchases this week.';
    }
    result.push({
      date: d.toISOString().slice(0, 10),
      balance: Math.round(balance),
      income: Math.round(inc),
      expense: Math.round(exp),
      risk,
      riskReason,
      suggestedAction,
    });
  }
  return result;
}

export function computeRecommendations(txns: Transaction[]): Recommendation[] {
  const a = computeAnalytics(txns);
  const risk = computeRiskAnalysis(txns);
  const avgInc = avgDaily(txns, 'income', 30);
  const avgExp = avgDaily(txns, 'expense', 30);
  const recs: Recommendation[] = [];

  if (avgExp > avgInc * 0.7) {
    recs.push({
      id: 'reduce-inventory',
      title: 'Reduce inventory purchases by 10%',
      detail: 'Your expense-to-income ratio is high. Trimming inventory spend frees up cash.',
      priority: 'high',
      expectedImpact: 'Save ~₹' + Math.round(avgExp * 30 * 0.1) + ' per month',
    });
  }

  if (avgInc < 500) {
    recs.push({
      id: 'increase-sales',
      title: 'Increase weekly sales target',
      detail: 'Current daily income is below optimal. Set a 15% higher weekly sales goal.',
      priority: 'high',
      expectedImpact: '+₹' + Math.round(avgInc * 7 * 0.15) + ' per week',
    });
  }

  if (risk.level !== 'low') {
    recs.push({
      id: 'delay-expenses',
      title: 'Delay non-essential expenses',
      detail: 'Postpone discretionary purchases until risk score improves.',
      priority: 'medium',
      expectedImpact: 'Risk score -10 to -15 points',
    });
  }

  const loanTxns = txns.filter((t) => t.type === 'expense' && /loan|emi/i.test(t.category));
  if (loanTxns.length > 0) {
    recs.push({
      id: 'loan-repay',
      title: 'Prepare for loan repayment',
      detail: 'Schedule upcoming EMI payments to avoid late fees and credit impact.',
      priority: 'medium',
      expectedImpact: 'Avoid ₹200-500 late fees',
    });
  }

  recs.push({
    id: 'reserves',
    title: 'Improve cash reserves',
    detail: 'Aim for at least 7 days of expenses as a buffer (₹' + Math.round(avgExp * 7) + ').',
    priority: avgExp * 7 > a.balance ? 'high' : 'low',
    expectedImpact: 'Better resilience to shocks',
  });

  return recs;
}

export function computeAISummary(txns: Transaction[]): AISummary {
  const a = computeAnalytics(txns);
  const risk = computeRiskScore(txns);
  const avgExp = avgDaily(txns, 'expense', 30);
  const forecast = computeForecast(txns, 30);
  const shortageDay = forecast.find((f) => f.balance < 0);

  if (txns.length === 0) {
    return { text: 'Add transactions to unlock AI insights about your business.', tone: 'warn' };
  }
  if (shortageDay) {
    const days = forecast.indexOf(shortageDay) + 1;
    return { text: `Cash shortage likely within ${days} days. Review expenses now.`, tone: 'bad' };
  }
  if (risk < 40) {
    return { text: 'Your business is currently stable. Keep up the good work!', tone: 'good' };
  }
  if (risk < 70) {
    return { text: 'Your business is moderately stable. Watch expenses to stay safe.', tone: 'warn' };
  }
  return { text: 'High financial risk detected. Take action to stabilize cash flow.', tone: 'bad' };
}

export function generateAlerts(txns: Transaction[]): { type: string; title: string; body: string; severity: 'low' | 'medium' | 'high' }[] {
  const a = computeAnalytics(txns);
  const risk = computeRiskAnalysis(txns);
  const forecast = computeForecast(txns, 30);
  const alerts: { type: string; title: string; body: string; severity: 'low' | 'medium' | 'high' }[] = [];

  const shortage = forecast.find((f) => f.balance < 0);
  if (shortage) {
    const days = forecast.indexOf(shortage) + 1;
    alerts.push({
      type: 'cash_shortage',
      title: 'Cash Shortage Warning',
      body: `Projected negative balance in ${days} days. Reduce expenses now.`,
      severity: 'high',
    });
  }

  if (risk.level === 'high') {
    alerts.push({
      type: 'high_risk',
      title: 'High Risk Warning',
      body: `Your risk score is ${risk.score}/100. Immediate action recommended.`,
      severity: 'high',
    });
  }

  const loanTxns = txns.filter((t) => t.type === 'expense' && /loan|emi/i.test(t.category) && withinDays(t.date, 30));
  if (loanTxns.length > 0) {
    alerts.push({
      type: 'loan_due',
      title: 'Loan Due Reminder',
      body: `You have ${loanTxns.length} loan/EMI payment(s) in the next 30 days.`,
      severity: 'medium',
    });
  }

  const recentExp = txns.filter((t) => t.type === 'expense' && daysAgo(t.date, 7));
  const prevExp = txns.filter((t) => t.type === 'expense' && daysAgo(t.date, 14) && !daysAgo(t.date, 7));
  const recentSum = recentExp.reduce((s, t) => s + Number(t.amount), 0);
  const prevSum = prevExp.reduce((s, t) => s + Number(t.amount), 0);
  if (prevSum > 0 && recentSum > prevSum * 1.5) {
    alerts.push({
      type: 'expense_spike',
      title: 'Expense Spike Alert',
      body: `This week's expenses are ${Math.round((recentSum / prevSum - 1) * 100)}% higher than last week.`,
      severity: 'medium',
    });
  }

  if (risk.trend.length >= 2 && risk.trend[risk.trend.length - 1].score > risk.trend[risk.trend.length - 2].score + 5) {
    alerts.push({
      type: 'forecast_change',
      title: 'Forecast Change Alert',
      body: 'Your risk score is trending upward. Review your recent transactions.',
      severity: 'low',
    });
  }

  return alerts;
}
