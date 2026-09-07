import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useApi, useDebounced, money } from './api';
import { Button, colors, Icon, LoadState, ProductImage, s } from './ui';

function ProductCard({ product, onPress, width }) {
  const available = product.variants.filter(v => v.inStock);
  const cheapest = [...available].sort((a,b) => a.pricePaise-b.pricePaise)[0];
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${product.name}`} onPress={onPress} style={({ pressed }) => [styles.product, { width, opacity:pressed ? 0.75 : 1 }]}>
    <ProductImage name={product.image} />
    <Text style={styles.tag}>{product.tag}</Text>
    <Text style={styles.name}>{product.name}</Text>
    <Text style={s.caption}>{available.length} {available.length === 1 ? 'variant' : 'variants'} available</Text>
    {cheapest ? <><Text style={styles.price}>{money(cheapest.pricePaise)}</Text><Text style={styles.mrp}>{money(cheapest.mrpPaise)}</Text><View style={styles.emi}><Text style={styles.emiText}>Explore no-cost EMI  ›</Text></View></> : <Text style={s.muted}>Currently unavailable</Text>}
  </Pressable>;
}
export default function Shop({ tab, setTab, query, setQuery, category, setCategory, onProduct }) {
  const { width } = useWindowDimensions();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const frameWidth = layoutWidth || Math.min(width, 760);
  const debounced = useDebounced(query);
  const result = useApi(`/api/products?q=${encodeURIComponent(debounced)}${category === 'All' ? '' : `&category=${encodeURIComponent(category)}`}`);
  const [categories, setCategories] = useState([]);
  useEffect(() => { if (result.data?.categories) setCategories(result.data.categories); }, [result.data]);
  const columns = frameWidth < 350 ? 1 : frameWidth > 620 ? 3 : 2;
  const cardWidth = (frameWidth - 40 - (columns - 1) * 12) / columns;
  const bannerHeight = frameWidth * 1024 / 1535;
  return <View style={{ flex:1 }} onLayout={event => setLayoutWidth(event.nativeEvent.layout.width)}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom:20 }}>
      <View style={{ width:frameWidth, height:bannerHeight, backgroundColor:'#28108b', overflow:'hidden' }}>
        <Image source={require('../assets/shop-banner.png')} resizeMode="contain" accessibilityLabel="Shop today, pay later using mutual funds. No-cost EMIs." style={{ position:'absolute', top:0, left:0, width:frameWidth, height:bannerHeight }} />
      </View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {['Top Brands','Nearby Stores','1Fi Marketplace'].map(name => <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected:tab === name }} onPress={() => setTab(name)} style={[styles.tab, tab === name && styles.selectedTab]}><Text style={[styles.tabText, tab === name && { color:colors.purple }]}>{name}</Text>{tab === name && <View style={styles.underline} />}</Pressable>)}
      </View>
      {tab === '1Fi Marketplace' && <View style={s.content}>
        <View style={styles.search}><Icon name="search" /><TextInput accessibilityLabel="Search products" placeholder="Search phones, laptops and more…" placeholderTextColor="#9ca0aa" value={query} onChangeText={setQuery} style={styles.input} returnKeyType="search" />{query !== '' && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={{ padding:7 }}><Text style={s.muted}>✕</Text></Pressable>}</View>
        <View style={s.between}><View style={{ gap:4 }}><Text style={s.title}>1Fi Marketplace</Text><Text style={s.muted}>Your next favourite, on your terms.</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8 }}>
          {['All', ...categories].map(c => <Pressable accessibilityRole="button" accessibilityState={{ selected:category === c }} key={c} onPress={() => setCategory(c)} style={[s.chip, category === c && s.chipActive]}><Text style={[s.chipText, category === c && { color:'white' }]}>{c}</Text></Pressable>)}
        </ScrollView>
        <LoadState {...result}>
          {result.data?.items.length ? <><View style={s.between}><Text style={s.label}>CURATED FOR YOU</Text><Text style={s.caption}>{result.data.items.length} products</Text></View><View style={styles.grid}>{result.data.items.map(p => <ProductCard key={p.id} product={p} width={cardWidth} onPress={() => onProduct(p.id)} />)}</View></> : <View style={s.state}><Text style={s.subtitle}>No matches just yet</Text><Text style={s.muted}>Try a different product or category.</Text><Button secondary title="Clear filters" onPress={() => { setQuery(''); setCategory('All'); }} /></View>}
        </LoadState>
        <View style={styles.note}><Text style={s.caption}>Real products · Demo prices, availability and EMI terms. No real transactions.</Text></View>
      </View>}
    </ScrollView>
    <View style={styles.nav}>{[['Home','home'],['Shop','shop'],['EMI Dues','receipt'],['Limit','limit'],['Profile','profile']].map(([label, icon]) => <View key={label} accessible accessibilityLabel={`${label}${label === 'Shop' ? ', selected' : ', outside assignment scope'}`} style={styles.navItem}>{label === 'Shop' && <View style={styles.navMark} />}<Icon name={icon} color={label === 'Shop' ? colors.purple : '#9aa0aa'} /><Text style={[styles.navLabel, label === 'Shop' && { color:colors.purple, fontWeight:'700' }]}>{label}</Text></View>)}</View>
  </View>;
}
const styles = StyleSheet.create({
  tabs:{ position:'relative', zIndex:2, elevation:3, marginHorizontal:20, marginTop:-27, borderRadius:30, padding:5, flexDirection:'row', backgroundColor:'#f3edff', borderWidth:1, borderColor:'#ede3fd', minHeight:62 },
  tab:{ flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:4, paddingVertical:12, borderRadius:26, minHeight:50 },
  selectedTab:{ backgroundColor:'white', boxShadow:'0 2px 6px rgba(35,15,60,0.10)' }, tabText:{ color:'#74727f', fontWeight:'700', fontSize:12, textAlign:'center' },
  underline:{ height:3, width:22, borderRadius:3, backgroundColor:colors.purple, position:'absolute', bottom:5 },
  search:{ flexDirection:'row', alignItems:'center', backgroundColor:'white', borderWidth:1, borderColor:colors.line, paddingHorizontal:16, borderRadius:28, minHeight:52, gap:10 },
  input:{ flex:1, minWidth:0, fontSize:14, paddingVertical:14, color:colors.ink, outlineStyle:'none' },
  grid:{ flexDirection:'row', flexWrap:'wrap', gap:12 },
  product:{ padding:10, borderRadius:21, borderColor:colors.line, borderWidth:1, backgroundColor:'white', gap:6 },
  tag:{ color:colors.purple, fontSize:10, fontWeight:'700', paddingTop:7 }, name:{ color:colors.ink, fontSize:15, fontWeight:'700', lineHeight:20, minHeight:40 },
  price:{ fontSize:19, color:colors.ink, fontWeight:'700', marginTop:2 }, mrp:{ color:'#9497a1', fontSize:12, textDecorationLine:'line-through' },
  emi:{ marginTop:5, paddingVertical:10, borderTopWidth:1, borderColor:colors.line }, emiText:{ color:colors.purple, fontSize:11, fontWeight:'600' },
  note:{ paddingVertical:6 }, nav:{ marginHorizontal:12, marginBottom:8, borderRadius:32, backgroundColor:'white', flexDirection:'row', paddingVertical:18, boxShadow:'0 -3px 24px rgba(30,20,55,0.06)' },
  navItem:{ flex:1, alignItems:'center', gap:7 }, navLabel:{ color:'#9aa0aa', fontSize:11 }, navMark:{ position:'absolute', top:-13, height:3, width:27, borderRadius:3, backgroundColor:colors.purple },
});
