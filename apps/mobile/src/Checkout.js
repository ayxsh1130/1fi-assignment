import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { money, useApi } from './api';
import { Button, colors, Header, LoadState, ProductImage, s } from './ui';

export function Details({ selection, dispatch, onBack, onNext }) {
  const result = useApi(`/api/products/${selection.productId}`);
  const product = result.data?.product;
  const variant = product?.variants.find(v => v.id === selection.variantId);
  useEffect(() => {
    if (product && !selection.variantId) dispatch({ type:'variant', id:product.variants.find(v => v.inStock)?.id || null });
  }, [product, selection.variantId, dispatch]);
  return <View style={{ flex:1 }}><Header title="Product details" subtitle="1Fi Marketplace" onBack={onBack} />
    <ScrollView contentContainerStyle={s.content}>
      <LoadState {...result}>{product && <>
        <View style={s.between}><Text style={s.label}>{product.brand.toUpperCase()} / {product.category.toUpperCase()}</Text><View style={s.pill}><Text style={{ color:colors.purple, fontSize:11, fontWeight:'600' }}>{product.tag}</Text></View></View>
        <ProductImage name={product.image} large />
        <Text style={s.caption}>Product reference imagery. Shown finishes may differ from your selection.</Text>
        <Text style={[s.title, { fontSize:29 }]}>{product.name}</Text>
        {variant && <View style={s.row}><Text style={[s.title, { fontSize:28 }]}>{money(variant.pricePaise)}</Text><Text style={[s.muted, { textDecorationLine:'line-through' }]}>{money(variant.mrpPaise)}</Text></View>}
        <Text style={s.caption}>Sample price · Inclusive of taxes</Text>
        <View style={{ gap:10 }}><Text style={s.subtitle}>Choose your variant</Text>{product.variants.map(v => <Pressable key={v.id} accessibilityRole="radio" accessibilityState={{ checked:selection.variantId === v.id, disabled:!v.inStock }} disabled={!v.inStock} onPress={() => dispatch({ type:'variant', id:v.id })} style={[s.card, { padding:14, flexDirection:'row', alignItems:'center', borderColor:selection.variantId === v.id ? colors.purple : colors.line, backgroundColor:selection.variantId === v.id ? '#f8f4ff' : 'white', opacity:v.inStock ? 1 : 0.45 }]}><View style={{ width:24, height:24, borderRadius:12, backgroundColor:v.color, borderColor:'#00000015', borderWidth:1 }} /><View style={{ flex:1 }}><Text style={[s.text, { fontWeight:'600' }]}>{v.label}</Text>{!v.inStock && <Text style={s.caption}>Out of stock</Text>}</View><Text style={{ color:colors.purple, fontSize:19 }}>{selection.variantId === v.id ? '●' : '○'}</Text></Pressable>)}</View>
        <View style={[s.card, { backgroundColor:colors.lilac, borderWidth:0 }]}><Text style={[s.subtitle, { color:colors.purple }]}>A little each month.</Text><Text style={s.text}>Explore no-cost EMI options for your chosen variant.</Text><Text style={s.caption}>Plans are illustrative and do not represent a credit offer.</Text></View>
        <Text style={s.subtitle}>Made for your everyday</Text><Text style={s.muted}>{product.description}</Text>
        <View style={s.card}>{product.features.map(feature => <View key={feature} style={s.row}><Text style={{ color:colors.purple }}>✓</Text><Text style={[s.text, { flex:1 }]}>{feature}</Text></View>)}</View>
      </>}</LoadState>
    </ScrollView>
    {!result.loading && !result.error && <View style={s.footer}><Button title="Choose an EMI plan  →" disabled={!variant?.inStock} onPress={onNext} /></View>}
  </View>;
}

function Line({ label, value, strong }) {
  return <View style={s.between}><Text style={strong ? [s.text, { fontWeight:'700' }] : s.muted}>{label}</Text><Text style={[s.text, strong && { fontWeight:'700' }]}>{value}</Text></View>;
}
export function Plans({ selection, dispatch, onBack, onNext }) {
  const result = useApi(`/api/products/${selection.productId}/emi-plans?variantId=${encodeURIComponent(selection.variantId)}`);
  const plans = result.data?.items || [];
  const selected = plans.find(p => p.id === selection.planId);
  return <View style={{ flex:1 }}><Header title="Make it monthly" subtitle="Choose your EMI plan" onBack={onBack} />
    <ScrollView contentContainerStyle={s.content}><View style={{ gap:7 }}><Text style={s.label}>FLEXIBILITY, BUILT IN</Text><Text style={[s.title, { fontSize:29 }]}>Your purchase. Your pace.</Text><Text style={s.muted}>Choose a comfortable monthly amount.</Text></View>
      <LoadState {...result}>
      {result.data?.product && <View style={[s.card, { marginBottom:18 }]}><Text style={s.subtitle}>{result.data.product.name}</Text><Text style={s.muted}>{result.data.variant.label} · {money(result.data.variant.pricePaise)}</Text></View>}
      <View style={{ gap:12 }}>{plans.map(plan => <Pressable key={plan.id} accessibilityRole="radio" accessibilityLabel={`${plan.months} months, ${money(plan.monthlyPaise)} per month`} accessibilityState={{ checked:selected?.id === plan.id }} onPress={() => dispatch({ type:'plan', id:plan.id })} style={[s.card, { borderWidth:selected?.id === plan.id ? 2 : 1, borderColor:selected?.id === plan.id ? colors.purple : colors.line, backgroundColor:selected?.id === plan.id ? '#faf7ff' : 'white' }]}>
        <View style={s.between}><View style={s.row}><Text style={{ color:colors.purple, fontSize:23 }}>{selected?.id === plan.id ? '●' : '○'}</Text><Text style={s.subtitle}>{plan.months} months</Text></View>{plan.recommended && <View style={s.pill}><Text style={{ color:colors.purple, fontSize:11, fontWeight:'700' }}>Popular choice</Text></View>}</View>
        <View style={s.row}><Text style={[s.title, { fontSize:28 }]}>{money(plan.monthlyPaise)}</Text><Text style={s.muted}>/ month</Text></View><View style={s.between}><Text style={{ color:colors.green, fontSize:12, fontWeight:'600' }}>0% interest · No processing fee</Text><Text style={s.caption}>No-cost EMI</Text></View>
      </Pressable>)}</View>
      {plans.length === 0 && <View style={s.state}><Text style={s.subtitle}>No plans available</Text><Text style={s.muted}>Go back and choose another variant.</Text><Button secondary title="Change variant" onPress={onBack} /></View>}
      {selected && <View style={[s.card, { marginTop:18 }]}><Text style={s.subtitle}>A clear breakdown</Text><Line label="Product price" value={money(selected.totalPaise)} /><Line label="Interest" value={money(selected.interestPaise)} /><Line label="Processing fee" value={money(selected.feePaise)} /><Line label="Down payment" value={money(selected.downPaymentPaise)} /><View style={s.divider} /><Line label="Total payable" value={money(selected.totalPaise)} strong /><Text style={s.caption}>First {selected.months - 1} payments: {money(selected.monthlyPaise)} each. Final payment: {money(selected.finalPaymentPaise)}. Rounding is included in the final payment.</Text></View>}
      </LoadState><Text style={s.caption}>Demo plans only. No eligibility check, investment pledge or payment is performed.</Text>
    </ScrollView>
    <View style={s.footer}>{selected && <Line label={`${selected.months}-month plan`} value={`${money(selected.monthlyPaise)}/mo`} strong />}<Button title="Continue with this plan  →" disabled={!selected || result.loading || !!result.error} onPress={onNext} /></View>
  </View>;
}

export function Review({ selection, onBack, onDone }) {
  const result = useApi('/api/orders/preview', JSON.stringify(selection));
  const preview = result.data;
  return <View style={{ flex:1 }}><Header title="Review your selection" subtitle="Final step · Demo only" onBack={onBack} /><ScrollView contentContainerStyle={s.content}><LoadState {...result}>{preview && <>
    <View style={{ alignItems:'center', gap:12, paddingVertical:20 }}><View style={{ width:62, height:62, borderRadius:31, backgroundColor:colors.lilac, alignItems:'center', justifyContent:'center' }}><Text style={{ fontSize:30, color:colors.purple }}>✓</Text></View><Text style={s.title}>Your plan is ready to review</Text><Text style={[s.muted, { textAlign:'center' }]}>Here’s how your selected plan adds up.</Text></View>
    <View style={s.card}><ProductImage name={preview.product.image} /><Text style={s.subtitle}>{preview.product.name}</Text><Text style={s.muted}>{preview.variant.label}</Text><View style={s.divider} /><Line label="Monthly payment" value={money(preview.plan.monthlyPaise)} strong /><Line label="Tenure" value={`${preview.plan.months} months`} /><Line label="Final payment" value={money(preview.plan.finalPaymentPaise)} /><Line label="Interest & fees" value={money(preview.plan.interestPaise + preview.plan.feePaise)} /><Line label="Total payable" value={money(preview.plan.totalPaise)} strong /></View>
    <View style={[s.card, { backgroundColor:colors.lilac, borderWidth:0 }]}><Text style={[s.subtitle, { color:colors.purple }]}>You’re viewing a demo</Text><Text style={s.muted}>{preview.message}</Text></View>
  </>}</LoadState></ScrollView><View style={s.footer}><Button title="Back to Marketplace" onPress={onDone} /></View></View>;
}
