import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'

export default function Pagination({ current, total, onChange, color = '#10b981' }) {
  if (total <= 1) return null

  const pages = []
  const add = (p) => { if (!pages.includes(p) && p >= 1 && p <= total) pages.push(p) }
  add(1)
  for (let i = current - 1; i <= current + 1; i++) add(i)
  add(total)
  pages.sort((a, b) => a - b)

  const out = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('…')
    out.push(p)
  })

  const handlePress = (n) => {
    Haptics.selectionAsync()
    onChange(n)
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, current === 1 && styles.disabled]}
        onPress={() => handlePress(current - 1)}
        disabled={current === 1}
      >
        <Text style={styles.btnText}>‹</Text>
      </TouchableOpacity>

      {out.map((item, i) =>
        item === '…' ? (
          <Text key={`d-${i}`} style={styles.dots}>…</Text>
        ) : (
          <TouchableOpacity
            key={item}
            style={[
              styles.btn,
              item === current && { backgroundColor: color, borderColor: color },
            ]}
            onPress={() => handlePress(item)}
            disabled={item === current}
          >
            <Text style={[styles.btnText, item === current && { color:'#fff' }]}>{item}</Text>
          </TouchableOpacity>
        )
      )}

      <TouchableOpacity
        style={[styles.btn, current === total && styles.disabled]}
        onPress={() => handlePress(current + 1)}
        disabled={current === total}
      >
        <Text style={styles.btnText}>›</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginVertical: 18,
    flexWrap: 'wrap',
  },
  btn: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#e2e8df',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 14, fontWeight: '700', color: '#1a2e1e' },
  disabled: { opacity: 0.4 },
  dots: { color: '#7a9b82', paddingHorizontal: 4, fontWeight: '800' },
})
