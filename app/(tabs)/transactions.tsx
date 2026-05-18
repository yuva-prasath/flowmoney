import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, ChevronDown } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { COLORS, SPACING, RADIUS, FONT, ALL_CATEGORIES, CATEGORY_COLORS } from '@/constants/theme';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import MerchantIcon from '@/components/MerchantIcon';
import CategoryBadge from '@/components/CategoryBadge';
import type { Transaction } from '@/types/index';

export default function TransactionsScreen() {
  const { transactions, updateTransactionCategory } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [catPickerVisible, setCatPickerVisible] = useState(false);

  const filtered = useMemo(() =>
    transactions.filter((t) => {
      const matchSearch = !search || t.merchant.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCat || t.category_name === filterCat;
      return matchSearch && matchCat;
    }), [transactions, search, filterCat]
  );

  const methodColor: Record<string, string> = {
    UPI: COLORS.secondary, Card: COLORS.primary, Wallet: COLORS.warning, Bank: COLORS.success,
  };

  async function handleCategoryChange(cat: string) {
    if (!selectedTxn) return;
    await updateTransactionCategory(selectedTxn.id, cat);
    setSelectedTxn((prev) => prev ? { ...prev, category_name: cat } : null);
    setCatPickerVisible(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Transactions</Text>
        <Text style={styles.count}>{filtered.length} records</Text>
      </View>

      <View style={styles.searchBox}>
        <Search color={COLORS.textMuted} size={16} />
        <TextInput
          style={styles.searchInput}
          value={search} onChangeText={setSearch}
          placeholder="Search merchant..." placeholderTextColor={COLORS.textMuted}
        />
        {!!search && <TouchableOpacity onPress={() => setSearch('')}><X color={COLORS.textMuted} size={16} /></TouchableOpacity>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {ALL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, filterCat === cat && styles.chipActive]}
            onPress={() => setFilterCat(filterCat === cat ? null : cat)}
          >
            <Text style={[styles.chipText, filterCat === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.txnCard} onPress={() => setSelectedTxn(item)}>
            <MerchantIcon merchant={item.merchant} category={item.category_name} />
            <View style={styles.txnInfo}>
              <Text style={styles.txnMerchant} numberOfLines={1}>{item.merchant}</Text>
              <View style={styles.txnMeta}>
                <CategoryBadge category={item.category_name} small />
                <View style={[styles.methodBadge, { borderColor: methodColor[item.payment_method] ?? COLORS.border }]}>
                  <Text style={[styles.methodText, { color: methodColor[item.payment_method] ?? COLORS.textMuted }]}>{item.payment_method}</Text>
                </View>
              </View>
            </View>
            <View style={styles.txnRight}>
              <Text style={[styles.txnAmount, { color: item.is_debit ? COLORS.error : COLORS.success }]}>
                -{formatCurrency(item.amount)}
              </Text>
              <Text style={styles.txnDate}>{formatDate(item.date)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail sheet */}
      <Modal visible={!!selectedTxn} transparent animationType="slide" onRequestClose={() => setSelectedTxn(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelectedTxn(null)} />
        {selectedTxn && (
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <MerchantIcon merchant={selectedTxn.merchant} category={selectedTxn.category_name} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetMerchant}>{selectedTxn.merchant}</Text>
                <Text style={styles.sheetDesc} numberOfLines={2}>{selectedTxn.description}</Text>
              </View>
            </View>
            <Text style={[styles.sheetAmount, { color: selectedTxn.is_debit ? COLORS.error : COLORS.success }]}>
              -{formatCurrency(selectedTxn.amount)}
            </Text>
            <View style={styles.detailGrid}>
              {[
                ['Date', formatDate(selectedTxn.date)],
                ['Time', formatTime(selectedTxn.date)],
                ['Method', selectedTxn.payment_method],
                ['Currency', selectedTxn.currency],
              ].map(([label, value]) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.catRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <TouchableOpacity style={styles.catEditBtn} onPress={() => setCatPickerVisible(true)}>
                <CategoryBadge category={selectedTxn.category_name} />
                <ChevronDown color={COLORS.textMuted} size={14} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Category picker */}
      <Modal visible={catPickerVisible} transparent animationType="slide" onRequestClose={() => setCatPickerVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setCatPickerVisible(false)} />
        <View style={[styles.sheet, { maxHeight: '70%' }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Change Category</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {ALL_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat} style={styles.catOption} onPress={() => handleCategoryChange(cat)}>
                <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[cat] ?? '#999' }]} />
                <Text style={styles.catOptionText}>{cat}</Text>
                {selectedTxn?.category_name === cat && <View style={styles.catCheck} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, marginBottom: SPACING.sm },
  heading: { fontSize: FONT.sizes.xl, fontWeight: '700', color: COLORS.text },
  count: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: SPACING.md, marginBottom: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT.sizes.sm, color: COLORS.text },
  filterRow: { marginBottom: SPACING.sm },
  filterContent: { gap: SPACING.xs, paddingHorizontal: SPACING.md },
  chip: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: SPACING.md, paddingBottom: 100, gap: SPACING.xs },
  empty: { padding: SPACING.xxl, alignItems: 'center' },
  emptyText: { fontSize: FONT.sizes.sm, color: COLORS.textMuted },
  txnCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  txnInfo: { flex: 1, gap: 4 },
  txnMerchant: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.text },
  txnMeta: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  methodBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  methodText: { fontSize: 10, fontWeight: '600' },
  txnRight: { alignItems: 'flex-end', gap: 3 },
  txnAmount: { fontSize: FONT.sizes.sm, fontWeight: '700' },
  txnDate: { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  sheetMerchant: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text },
  sheetDesc: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  sheetAmount: { fontSize: FONT.sizes.xxxl, fontWeight: '700', marginBottom: SPACING.md },
  sheetTitle: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  detailGrid: { gap: SPACING.xs, marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: FONT.sizes.sm, color: COLORS.textMuted },
  detailValue: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.text },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  catOptionText: { flex: 1, fontSize: FONT.sizes.md, color: COLORS.text },
  catCheck: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
});
