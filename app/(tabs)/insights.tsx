import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Zap, Calendar } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { COLORS, SPACING, RADIUS, FONT, CATEGORY_COLORS } from '@/constants/theme';
import { formatCurrency, getMonthStart } from '@/utils/format';

export default function InsightsScreen() {
  const { transactions } = useApp();
  const now = new Date();
  const monthStart = getMonthStart();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const thisMonthTxns = useMemo(
    () => transactions.filter((t) => t.is_debit && new Date(t.date) >= monthStart),
    [transactions, monthStart]
  );
  const prevMonthTxns = useMemo(
    () => transactions.filter((t) => t.is_debit && new Date(t.date) >= prevMonthStart && new Date(t.date) <= prevMonthEnd),
    [transactions, prevMonthStart, prevMonthEnd]
  );

  const thisTotal = thisMonthTxns.reduce((s, t) => s + t.amount, 0);
  const prevTotal = prevMonthTxns.reduce((s, t) => s + t.amount, 0);

  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonthTxns.forEach((t) => { map[t.category_name] = (map[t.category_name] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [thisMonthTxns]);

  const prevCatBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    prevMonthTxns.forEach((t) => { map[t.category_name] = (map[t.category_name] ?? 0) + t.amount; });
    return map;
  }, [prevMonthTxns]);

  const daySpend = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, number> = {};
    days.forEach((d) => { map[d] = 0; });
    thisMonthTxns.forEach((t) => { const d = days[new Date(t.date).getDay()]; map[d] += t.amount; });
    return days.map((d) => ({ day: d, amount: map[d] }));
  }, [thisMonthTxns]);

  const topDay = [...daySpend].sort((a, b) => b.amount - a.amount)[0];
  const maxDay = Math.max(...daySpend.map((d) => d.amount), 1);

  const insights = useMemo(() => {
    const list: { icon: string; text: string; type: 'good' | 'bad' | 'neutral' }[] = [];
    if (prevTotal > 0) {
      const delta = ((thisTotal - prevTotal) / prevTotal) * 100;
      if (delta > 10) list.push({ icon: 'up', text: `You've spent ${Math.round(delta)}% more than last month.`, type: 'bad' });
      else if (delta < -10) list.push({ icon: 'down', text: `You've spent ${Math.round(Math.abs(delta))}% less than last month.`, type: 'good' });
    }
    catBreakdown.forEach(([cat, amount]) => {
      const prev = prevCatBreakdown[cat] ?? 0;
      if (prev > 0) {
        const delta = ((amount - prev) / prev) * 100;
        if (delta > 30) list.push({ icon: 'up', text: `${cat} spending rose by ${Math.round(delta)}% vs last month.`, type: 'bad' });
        else if (delta < -20) list.push({ icon: 'down', text: `${cat} spending fell by ${Math.round(Math.abs(delta))}%.`, type: 'good' });
      }
    });
    if (topDay) list.push({ icon: 'cal', text: `${topDay.day} is your highest spending day this month.`, type: 'neutral' });
    if (catBreakdown[0]) {
      const pct = thisTotal > 0 ? Math.round((catBreakdown[0][1] / thisTotal) * 100) : 0;
      list.push({ icon: 'zap', text: `${catBreakdown[0][0]} is your top category at ${pct}% of spending.`, type: 'neutral' });
    }
    return list;
  }, [thisTotal, prevTotal, catBreakdown, prevCatBreakdown, topDay]);

  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const amount = transactions
        .filter((t) => t.is_debit && new Date(t.date) >= start && new Date(t.date) <= end)
        .reduce((s, t) => s + t.amount, 0);
      return { label: d.toLocaleDateString('en-IN', { month: 'short' }), amount };
    });
  }, [transactions]);

  const maxMonth = Math.max(...monthlyTrend.map((m) => m.amount), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Insights</Text>

        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Insights</Text>
            {insights.map((ins, i) => (
              <View key={i} style={[styles.insightCard, ins.type === 'bad' && styles.cardBad, ins.type === 'good' && styles.cardGood]}>
                {ins.icon === 'up' && <TrendingUp color={ins.type === 'bad' ? COLORS.error : COLORS.success} size={18} />}
                {ins.icon === 'down' && <TrendingDown color={COLORS.success} size={18} />}
                {ins.icon === 'zap' && <Zap color={COLORS.primary} size={18} />}
                {ins.icon === 'cal' && <Calendar color={COLORS.textMuted} size={18} />}
                <Text style={[styles.insightText, ins.type === 'bad' && { color: COLORS.error }, ins.type === 'good' && { color: '#065F46' }]}>
                  {ins.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6-Month Trend</Text>
          <View style={styles.chartCard}>
            <View style={styles.barChart}>
              {monthlyTrend.map((m, i) => (
                <View key={i} style={styles.barItem}>
                  <Text style={styles.barAmt}>{m.amount > 0 ? `₹${Math.round(m.amount / 1000)}k` : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${Math.max(2, (m.amount / maxMonth) * 100)}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Day of Week</Text>
          <View style={styles.dayGrid}>
            {daySpend.map((d, i) => {
              const intensity = d.amount / maxDay;
              return (
                <View key={i} style={styles.dayItem}>
                  <View style={[styles.dayCell, { backgroundColor: `rgba(15,98,254,${Math.max(0.08, intensity * 0.9)})` }]}>
                    <Text style={[styles.dayCellAmt, { color: intensity > 0.5 ? '#fff' : COLORS.primary }]}>
                      {d.amount > 0 ? `₹${Math.round(d.amount / 1000)}k` : '—'}
                    </Text>
                  </View>
                  <Text style={styles.dayLabel}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {catBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {catBreakdown.map(([cat, amount]) => {
              const pct = thisTotal > 0 ? amount / thisTotal : 0;
              const prev = prevCatBreakdown[cat] ?? 0;
              const change = prev > 0 ? ((amount - prev) / prev) * 100 : null;
              const color = CATEGORY_COLORS[cat] ?? COLORS.textMuted;
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: color }]} />
                  <Text style={styles.catName}>{cat}</Text>
                  <View style={styles.catBarTrack}>
                    <View style={[styles.catBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.catAmt}>{formatCurrency(amount)}</Text>
                  {change !== null && (
                    <Text style={[styles.catChange, { color: change > 0 ? COLORS.error : COLORS.success }]}>
                      {change > 0 ? '+' : ''}{Math.round(change)}%
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {transactions.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sync transactions to unlock insights.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.md, paddingBottom: 100 },
  heading: { fontSize: FONT.sizes.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xs },
  cardBad: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error + '40' },
  cardGood: { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' },
  insightText: { flex: 1, fontSize: FONT.sizes.sm, color: COLORS.text, lineHeight: 20 },
  chartCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  barChart: { flexDirection: 'row', height: 120, gap: SPACING.xs, alignItems: 'flex-end' },
  barItem: { flex: 1, alignItems: 'center', gap: 4 },
  barAmt: { fontSize: 9, color: COLORS.textMuted },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: COLORS.border, borderRadius: 4 },
  barFill: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  barLabel: { fontSize: 10, color: COLORS.textMuted },
  dayGrid: { flexDirection: 'row', gap: SPACING.xs },
  dayItem: { flex: 1, alignItems: 'center', gap: 4 },
  dayCell: { width: '100%', aspectRatio: 0.75, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  dayCellAmt: { fontSize: 9, fontWeight: '700' },
  dayLabel: { fontSize: 10, color: COLORS.textMuted },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: FONT.sizes.sm, color: COLORS.text, width: 100 },
  catBarTrack: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catAmt: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.text, width: 65, textAlign: 'right' },
  catChange: { fontSize: FONT.sizes.xs, fontWeight: '700', width: 38, textAlign: 'right' },
  empty: { padding: SPACING.xxl, alignItems: 'center' },
  emptyText: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, textAlign: 'center' },
});
