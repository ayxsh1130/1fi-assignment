import React, { useEffect, useReducer, useState } from 'react';
import { BackHandler, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { ApiProvider } from './src/api';
import Shop from './src/Shop';
import { Details, Plans, Review } from './src/Checkout';
import { initialSelection, selectionReducer } from './src/selection.mjs';
import { s } from './src/ui';

export default function App() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}><ApiProvider><MarketplaceApp /></ApiProvider></SafeAreaProvider>;
}

function MarketplaceApp() {
  const [screen, setScreen] = useState('shop');
  const [tab, setTab] = useState('1Fi Marketplace');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selection, dispatch] = useReducer(selectionReducer, initialSelection);
  const goBack = () => setScreen(current => ({ review:'plans', plans:'details', details:'shop' })[current] || 'shop');
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'shop') return false;
      goBack(); return true;
    });
    return () => subscription.remove();
  }, [screen]);
  return <SafeAreaView style={s.root}>
    <StatusBar barStyle="dark-content" />
    <View style={s.frame}>
      {screen === 'shop' && <Shop {...{ tab, setTab, query, setQuery, category, setCategory }} onProduct={id => { dispatch({ type:'product', id }); setScreen('details'); }} />}
      {screen === 'details' && <Details {...{ selection, dispatch }} onBack={goBack} onNext={() => setScreen('plans')} />}
      {screen === 'plans' && <Plans {...{ selection, dispatch }} onBack={goBack} onNext={() => setScreen('review')} />}
      {screen === 'review' && <Review selection={selection} onBack={goBack} onDone={() => { dispatch({ type:'reset' }); setScreen('shop'); }} />}
    </View>
  </SafeAreaView>;
}
