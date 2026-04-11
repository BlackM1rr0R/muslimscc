import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { T } from '../data/i18n';
import AppIcon from '../components/Icon';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const CURRENCIES = [
  { code:'AZN', symbol:'₼' }, { code:'USD', symbol:'$' }, { code:'EUR', symbol:'€' },
  { code:'RUB', symbol:'₽' }, { code:'TRY', symbol:'₺' }, { code:'SAR', symbol:'﷼' },
  { code:'GBP', symbol:'£' }, { code:'AED', symbol:'د.إ' },
];

const FALLBACK_RATES = { AZN:1.7, USD:1, EUR:0.92, RUB:89, TRY:28, SAR:3.75, GBP:0.79, AED:3.67 };
const GOLD_NISAB_G = 85;

export default function ZakatScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const t = T[lang]?.zakat || T.az.zakat;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [currency, setCurrency] = useState(0);
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [cash, setCash] = useState('');
  const [trade, setTrade] = useState('');
  const [goldPrice, setGoldPrice] = useState('60');
  const [silverPrice, setSilverPrice] = useState('0.8');

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => setRates(d.rates || FALLBACK_RATES))
      .catch(() => {});
  }, []);

  const curr = CURRENCIES[currency];

  const goldVal = (parseFloat(gold) || 0) * (parseFloat(goldPrice) || 0);
  const silverVal = (parseFloat(silver) || 0) * (parseFloat(silverPrice) || 0);
  const cashVal = parseFloat(cash) || 0;
  const tradeVal = parseFloat(trade) || 0;
  const total = goldVal + silverVal + cashVal + tradeVal;

  const nisabValue = GOLD_NISAB_G * (parseFloat(goldPrice) || 60);
  const aboveNisab = total >= nisabValue;
  const zakatDue = aboveNisab ? total * 0.025 : 0;

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGold(''); setSilver(''); setCash(''); setTrade('');
    setGoldPrice('60'); setSilverPrice('0.8');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="الزَّكَاة" title={t.title} subtitle={t.subtitle} />

      <View style={styles.content}>

        {/* Currency selector */}
        <FadeUp delay={100}>
          <Text style={[styles.label, { color: c.textMuted }]}>
            {lang==='az'?'VALYUTA':lang==='ru'?'ВАЛЮТА':lang==='ar'?'العملة':lang==='tr'?'PARA BİRİMİ':'CURRENCY'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currRow}>
            {CURRENCIES.map((cur, i) => {
              const active = currency === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.currBtn,
                    {
                      backgroundColor: active ? c.primary : c.card,
                      borderColor: active ? c.primary : c.cardBorder,
                    },
                    active ? Shadows.button : shS,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCurrency(i);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.currSymbol, { color: active ? '#fff' : c.primary }]}>{cur.symbol}</Text>
                  <Text style={[styles.currText, { color: active ? '#fff' : c.textSecondary }]}>{cur.code}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* Gold & Silver */}
        <FadeUp delay={200}>
          <Text style={[styles.label, { color: c.textMuted }]}>
            {lang==='az'?'QIZIL VƏ GÜMÜŞ':lang==='ru'?'ЗОЛОТО И СЕРЕБРО':lang==='ar'?'الذهب والفضة':lang==='tr'?'ALTIN VE GÜMÜŞ':'GOLD & SILVER'}
          </Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
            <InputRow icon="zakat" iconColor="#d4a017" label={t.goldLabel} value={gold} onChange={setGold} c={c} />
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <InputRow icon="zakat" iconColor="#d4a017" label={t.goldPrice} value={goldPrice} onChange={setGoldPrice} c={c} />
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <InputRow icon="zakat" iconColor="#94a3b8" label={t.silverLabel} value={silver} onChange={setSilver} c={c} />
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <InputRow icon="zakat" iconColor="#94a3b8" label={t.silverPrice} value={silverPrice} onChange={setSilverPrice} c={c} />
          </View>
        </FadeUp>

        {/* Cash & Trade */}
        <FadeUp delay={300}>
          <Text style={[styles.label, { color: c.textMuted }]}>
            {lang==='az'?'NAĞD VƏ TİCARƏT':lang==='ru'?'НАЛИЧНЫЕ И ТОВАРЫ':lang==='ar'?'النقد والتجارة':lang==='tr'?'NAKİT VE TİCARET':'CASH & TRADE'}
          </Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}>
            <InputRow icon="zakat" iconColor="#10b981" label={t.cashLabel} value={cash} onChange={setCash} c={c} />
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <InputRow icon="zakat" iconColor="#3b82f6" label={t.tradeLabel} value={trade} onChange={setTrade} c={c} />
          </View>
        </FadeUp>

        {/* Note */}
        <FadeUp delay={400}>
          <View style={[styles.noteCard, { backgroundColor: c.primaryBg, borderColor: c.primaryBorder }]}>
            <AppIcon name="about" size={18} color={c.primary} />
            <Text style={[styles.noteText, { color: c.textSecondary }]}>{t.note}</Text>
          </View>
        </FadeUp>

        {/* Result card */}
        <ScaleIn delay={500}>
          <LinearGradient
            colors={aboveNisab ? [c.primary, c.primaryDark] : [c.surfaceAlt, c.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.resultCard, sh]}
          >
            <View style={styles.resultCircle1} />
            <View style={styles.resultCircle2} />

            <View style={styles.resultHeader}>
              <AppIcon name="zakat" size={24} color={aboveNisab ? '#fff' : c.text} />
              <Text style={[styles.resultTitle, { color: aboveNisab ? '#fff' : c.text }]}>
                {lang==='az'?'NƏTİCƏ':lang==='ru'?'РЕЗУЛЬТАТ':lang==='ar'?'النتيجة':lang==='tr'?'SONUÇ':'RESULT'}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: aboveNisab ? 'rgba(255,255,255,0.85)' : c.textSecondary }]}>{t.total}</Text>
              <Text style={[styles.resultValue, { color: aboveNisab ? '#fff' : c.text }]}>{curr.symbol} {total.toFixed(2)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: aboveNisab ? 'rgba(255,255,255,0.85)' : c.textSecondary }]}>{t.nisab}</Text>
              <Text style={[styles.resultValue, { color: aboveNisab ? '#fff' : c.text }]}>{curr.symbol} {nisabValue.toFixed(2)}</Text>
            </View>

            <View style={[styles.resultDivider, { backgroundColor: aboveNisab ? 'rgba(255,255,255,0.3)' : c.border }]} />

            <View style={styles.zakatRow}>
              <Text style={[styles.zakatLabel, { color: aboveNisab ? '#fff' : c.error }]}>{t.zakatDue}</Text>
              <Text style={[styles.zakatValue, { color: aboveNisab ? '#fff' : c.error }]}>
                {aboveNisab ? `${curr.symbol} ${zakatDue.toFixed(2)}` : '—'}
              </Text>
            </View>

            <View style={[styles.statusBadge, {
              backgroundColor: aboveNisab ? 'rgba(255,255,255,0.2)' : c.error + '15',
              borderColor: aboveNisab ? 'rgba(255,255,255,0.3)' : c.error + '30',
            }]}>
              <AppIcon name={aboveNisab ? 'check' : 'close'} size={14} color={aboveNisab ? '#fff' : c.error} />
              <Text style={[styles.statusText, { color: aboveNisab ? '#fff' : c.error }]}>
                {aboveNisab ? t.aboveNisab : t.nisabNote}
              </Text>
            </View>
          </LinearGradient>
        </ScaleIn>

        {/* Reset button */}
        <FadeUp delay={600}>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: c.card, borderColor: c.cardBorder }, shS]}
            onPress={reset}
            activeOpacity={0.7}
          >
            <AppIcon name="reset" size={18} color={c.error} />
            <Text style={[styles.resetText, { color: c.error }]}>{t.reset}</Text>
          </TouchableOpacity>
        </FadeUp>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

function InputRow({ icon, iconColor, label, value, onChange, c }) {
  return (
    <View style={styles.inputRow}>
      <View style={[styles.inputIconWrap, { backgroundColor: iconColor + '18' }]}>
        <AppIcon name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.inputLabel, { color: c.textSecondary }]}>{label}</Text>
        <TextInput
          style={[styles.input, { color: c.text }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={c.textMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 14 },

  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, marginTop: 8 },

  // Currency
  currRow: { gap: 8, paddingBottom: 8 },
  currBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  currSymbol: { fontSize: 16, fontWeight: '800' },
  currText: { fontSize: 12, fontWeight: '700' },

  // Card
  card: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: 6, marginBottom: 16 },

  // Input row
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  inputIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  input: { fontSize: 18, fontWeight: '800', padding: 0 },
  divider: { height: 1, marginHorizontal: 14 },

  // Note
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 20,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },

  // Result
  resultCard: {
    padding: 26,
    borderRadius: BorderRadius.xl,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  resultCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -40 },
  resultCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  resultTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultLabel: { fontSize: 14, fontWeight: '600' },
  resultValue: { fontSize: 17, fontWeight: '800' },
  resultDivider: { height: 1, marginVertical: 12 },
  zakatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  zakatLabel: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  zakatValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700', flex: 1 },

  // Reset
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  resetText: { fontSize: 15, fontWeight: '700' },
});
