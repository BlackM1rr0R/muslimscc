import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import PageHero from '../components/PageHero';

const CURRENCIES = [
  { code:'AZN', symbol:'₼' }, { code:'USD', symbol:'$' }, { code:'EUR', symbol:'€' },
  { code:'RUB', symbol:'₽' }, { code:'TRY', symbol:'₺' }, { code:'SAR', symbol:'﷼' },
  { code:'GBP', symbol:'£' }, { code:'AED', symbol:'د.إ' },
];

const FALLBACK_RATES = { AZN:1.7, USD:1, EUR:0.92, RUB:89, TRY:28, SAR:3.75, GBP:0.79, AED:3.67 };
const GOLD_NISAB_G = 85;
const SILVER_NISAB_G = 595;

export default function ZakatScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.zakat || T.az.zakat;

  const [currency, setCurrency] = useState(0);
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [cash, setCash] = useState('');
  const [trade, setTrade] = useState('');
  const [goldPrice, setGoldPrice] = useState('');
  const [silverPrice, setSilverPrice] = useState('');
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => setRates(d.rates || FALLBACK_RATES))
      .catch(() => {});
  }, []);

  const curr = CURRENCIES[currency];
  const rate = rates[curr.code] || 1;

  const goldVal = (parseFloat(gold) || 0) * (parseFloat(goldPrice) || 0);
  const silverVal = (parseFloat(silver) || 0) * (parseFloat(silverPrice) || 0);
  const cashVal = parseFloat(cash) || 0;
  const tradeVal = parseFloat(trade) || 0;
  const total = goldVal + silverVal + cashVal + tradeVal;

  const goldNisabUSD = GOLD_NISAB_G * ((parseFloat(goldPrice) || 0) / rate);
  const nisabValue = GOLD_NISAB_G * (parseFloat(goldPrice) || 60);
  const aboveNisab = total >= nisabValue;
  const zakatDue = aboveNisab ? total * 0.025 : 0;

  const reset = () => {
    setGold(''); setSilver(''); setCash(''); setTrade('');
    setGoldPrice(''); setSilverPrice('');
    setCalculated(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <PageHero arabic="الزكاة" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>
        {/* Currency selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currScroll}>
          {CURRENCIES.map((cur, i) => (
            <TouchableOpacity key={i} style={[styles.currBtn, currency === i && { backgroundColor: c.primary }]} onPress={() => setCurrency(i)}>
              <Text style={[styles.currText, currency === i && { color: '#fff' }]}>{cur.symbol} {cur.code}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Inputs */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <InputRow label={t.goldLabel} value={gold} onChange={setGold} c={c} />
          <InputRow label={t.goldPrice} value={goldPrice} onChange={setGoldPrice} c={c} />
          <InputRow label={t.silverLabel} value={silver} onChange={setSilver} c={c} />
          <InputRow label={t.silverPrice} value={silverPrice} onChange={setSilverPrice} c={c} />
          <InputRow label={t.cashLabel} value={cash} onChange={setCash} c={c} />
          <InputRow label={t.tradeLabel} value={trade} onChange={setTrade} c={c} />
        </View>

        {/* Note */}
        <View style={[styles.noteCard, { backgroundColor: c.surfaceAlt }]}>
          <Text style={[styles.noteText, { color: c.textSecondary }]}>ℹ️ {t.note}</Text>
        </View>

        {/* Results */}
        <View style={[styles.resultCard, { backgroundColor: c.card, borderColor: aboveNisab ? c.primary : c.cardBorder }]}>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { color: c.textSecondary }]}>{t.total}</Text>
            <Text style={[styles.resultValue, { color: c.text }]}>{curr.symbol} {total.toFixed(2)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { color: c.textSecondary }]}>{t.nisab}</Text>
            <Text style={[styles.resultValue, { color: c.text }]}>{curr.symbol} {nisabValue.toFixed(2)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.resultRow}>
            <Text style={[styles.zakatLabel, { color: aboveNisab ? c.primary : c.error }]}>{t.zakatDue}</Text>
            <Text style={[styles.zakatValue, { color: aboveNisab ? c.primary : c.error }]}>
              {aboveNisab ? `${curr.symbol} ${zakatDue.toFixed(2)}` : t.nisabNote}
            </Text>
          </View>
          {aboveNisab && (
            <Text style={[styles.nisabNote, { color: c.success }]}>✅ {t.aboveNisab}</Text>
          )}
        </View>

        {/* Reset */}
        <TouchableOpacity style={[styles.resetBtn, { backgroundColor: c.surfaceAlt }]} onPress={reset}>
          <Text style={[styles.resetText, { color: c.text }]}>🔄 {t.reset}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InputRow({ label, value, onChange, c }) {
  return (
    <View style={styles.inputRow}>
      <Text style={[styles.inputLabel, { color: c.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={c.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  currScroll: { marginBottom: 16, maxHeight: 40 },
  currBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#eee', marginRight: 8 },
  currText: { fontSize: 13, fontWeight: '600', color: '#555' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  inputRow: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  noteCard: { padding: 12, borderRadius: 10, marginBottom: 16 },
  noteText: { fontSize: 13, lineHeight: 20 },
  resultCard: { padding: 20, borderRadius: 12, borderWidth: 1.5, marginBottom: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultLabel: { fontSize: 14 },
  resultValue: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, marginVertical: 10 },
  zakatLabel: { fontSize: 16, fontWeight: '700' },
  zakatValue: { fontSize: 18, fontWeight: '800' },
  nisabNote: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  resetBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  resetText: { fontSize: 15, fontWeight: '600' },
});
