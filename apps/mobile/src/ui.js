import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { imageUrl, useApiConfig } from './api';
import { normalizeBaseUrl, requestJson } from './connection.mjs';

export const colors = { purple:'#7534c9', ink:'#171d29', muted:'#7d818d', bg:'#f7f7f9', line:'#e7e5ec', lilac:'#f3edff', green:'#227f64' };
export function Icon({ name, color = colors.muted, size = 24 }) {
  const line = { borderColor:color, borderWidth:1.8 };
  return <View accessible={false} style={{ width:size, height:size, alignItems:'center', justifyContent:'center' }}>
    {name === 'home' ? <><View style={[line, { position:'absolute', top:3, width:15, height:15, transform:[{ rotate:'45deg' }], borderRightWidth:0, borderBottomWidth:0 }]} /><View style={[line, { top:4, width:17, height:16, borderTopWidth:0, borderRadius:2 }]} /><View style={[line, { position:'absolute', bottom:0, width:6, height:10 }]} /></> :
    name === 'shop' ? <><View style={[line, { width:19, height:17, top:3, borderRadius:3 }]} /><View style={[line, { position:'absolute', top:0, width:10, height:9, borderRadius:5 }]} /></> :
    name === 'profile' ? <><View style={[line, { position:'absolute', top:0, width:9, height:9, borderRadius:9 }]} /><View style={[line, { position:'absolute', bottom:0, width:19, height:11, borderTopLeftRadius:12, borderTopRightRadius:12, borderBottomWidth:0 }]} /></> :
    name === 'limit' ? <View style={{ flexDirection:'row', alignItems:'flex-end', gap:3 }}>{[10,17,23].map(h => <View key={h} style={{ width:4, height:h, backgroundColor:color, borderRadius:2 }} />)}</View> :
    name === 'search' ? <><View style={[line, { width:15, height:15, borderRadius:15, position:'absolute', top:1, left:1 }]} /><View style={{ position:'absolute', width:9, height:2, backgroundColor:color, transform:[{ rotate:'45deg' }], right:0, bottom:4 }} /></> :
    name === 'back' ? <View style={[line, { width:11, height:11, borderTopWidth:0, borderRightWidth:0, transform:[{ rotate:'45deg' }] }]} /> :
    <View style={[line, { width:17, height:23, borderRadius:2, justifyContent:'center', alignItems:'center' }]}><Text style={{ color, fontWeight:'600', fontSize:15 }}>₹</Text></View>}
  </View>;
}
export function Button({ title, onPress, disabled, secondary = false, testID }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled:!!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, disabled && { opacity:0.4 }, pressed && { opacity:0.8 }]}>
    <Text style={[s.buttonText, secondary && { color:colors.purple }]}>{title}</Text>
  </Pressable>;
}
export function ProductImage({ name, large = false }) {
  const { baseUrl } = useApiConfig();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [name, baseUrl]);
  return <View style={[s.imageBox, large && { height:255, borderRadius:24 }]}>
    {failed ? <Text style={s.muted}>Image unavailable</Text> : <Image accessibilityLabel="Product image" source={{ uri:imageUrl(name, baseUrl) }} resizeMode="contain" onError={() => setFailed(true)} style={{ width:'100%', height:'100%' }} />}
  </View>;
}
export function LoadState({ loading, error, retry, children }) {
  if (loading) return <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={s.state}><ActivityIndicator color={colors.purple} size="large" /><Text style={s.muted}>Getting things ready…</Text></View>;
  if (error) return <View accessibilityRole="alert" style={s.state}><Text style={s.title}>Let’s try that again</Text><Text style={[s.muted, { textAlign:'center' }]}>{error}</Text><Button title="Retry" onPress={retry} secondary />{__DEV__ && <ConnectionSettings onConnected={retry} />}</View>;
  return children;
}
export function Header({ title, subtitle, onBack }) {
  return <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={s.back}><Icon name="back" color={colors.ink} /></Pressable><View style={{ flex:1 }}><Text style={s.headerTitle}>{title}</Text>{subtitle && <Text style={s.caption}>{subtitle}</Text>}</View><Text style={s.wordmark}>1Fi</Text></View>;
}
function ConnectionSettings({ onConnected }) {
  const { baseUrl, suggestedUrl, connect } = useApiConfig();
  const [draft, setDraft] = useState(baseUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  return <View style={{ width:'100%', gap:10 }}>
    <Text style={s.caption}>Demo API address</Text>
    <TextInput accessibilityLabel="Demo API address" value={draft} onChangeText={setDraft} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={{ minHeight:48, backgroundColor:'white', padding:12, borderRadius:12, borderWidth:1, borderColor:colors.line, color:colors.ink }} />
    <Text style={s.caption}>Paste the working address from your phone browser, including its port. Currently using: {baseUrl}</Text>
    {draft !== suggestedUrl && <Pressable accessibilityRole="button" onPress={() => setDraft(suggestedUrl)}><Text style={{ color:colors.purple }}>Use Expo host: {suggestedUrl}</Text></Pressable>}
    {error && <Text accessibilityRole="alert" style={{ color:'#a3314a' }}>{error}</Text>}
    <Button title={busy ? 'Checking products…' : 'Test & connect'} disabled={busy} onPress={async () => {
      setBusy(true); setError(null);
      try {
        const address = normalizeBaseUrl(draft);
        await requestJson(address, '/api/products');
        connect(address); onConnected();
      } catch (e) { setError(e.message); }
      finally { setBusy(false); }
    }} secondary />
  </View>;
}
export const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:colors.bg }, frame:{ flex:1, width:'100%', maxWidth:760, alignSelf:'center', backgroundColor:colors.bg },
  content:{ padding:20, paddingBottom:28, gap:18 }, title:{ fontSize:24, fontWeight:'700', color:colors.ink, letterSpacing:-0.6 },
  subtitle:{ fontSize:19, fontWeight:'700', color:colors.ink, letterSpacing:-0.3 }, text:{ color:colors.ink, fontSize:15, lineHeight:23 },
  muted:{ color:colors.muted, fontSize:14, lineHeight:21 }, caption:{ color:colors.muted, fontSize:12, lineHeight:18 },
  row:{ flexDirection:'row', alignItems:'center', gap:10 }, between:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:8 },
  card:{ padding:18, backgroundColor:'white', borderRadius:22, borderWidth:1, borderColor:colors.line, gap:14 },
  button:{ minHeight:52, backgroundColor:colors.purple, borderRadius:15, paddingHorizontal:20, paddingVertical:14, alignItems:'center', justifyContent:'center' },
  secondary:{ backgroundColor:colors.lilac }, buttonText:{ color:'white', fontWeight:'700', fontSize:15 },
  imageBox:{ height:154, width:'100%', backgroundColor:'#f1eff7', borderRadius:16, overflow:'hidden', alignItems:'center', justifyContent:'center' },
  state:{ padding:28, minHeight:260, alignItems:'center', justifyContent:'center', gap:18 },
  header:{ paddingHorizontal:20, paddingVertical:14, flexDirection:'row', alignItems:'center', gap:12, borderBottomWidth:1, borderColor:colors.line, backgroundColor:'white' },
  headerTitle:{ color:colors.ink, fontSize:17, fontWeight:'700' }, back:{ width:38, height:42, alignItems:'center', justifyContent:'center', backgroundColor:colors.bg, borderRadius:12 },
  wordmark:{ fontSize:28, color:colors.purple, fontWeight:'800', letterSpacing:-2 },
  chip:{ borderRadius:24, borderWidth:1, borderColor:colors.line, backgroundColor:'white', paddingHorizontal:17, paddingVertical:11 },
  chipActive:{ backgroundColor:colors.purple, borderColor:colors.purple }, chipText:{ color:colors.muted, fontSize:13, fontWeight:'600' },
  footer:{ backgroundColor:'white', padding:18, borderTopWidth:1, borderColor:colors.line, gap:12 },
  label:{ fontSize:11, fontWeight:'700', letterSpacing:1.4, color:colors.purple },
  pill:{ alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:5, backgroundColor:colors.lilac, borderRadius:7 },
  divider:{ height:1, backgroundColor:colors.line },
});
