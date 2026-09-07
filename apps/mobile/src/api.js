import { Platform } from 'react-native';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeBaseUrl, requestJson, resolveApiUrl } from './connection.mjs';

const inferredUrl = resolveApiUrl({ hostUri:Constants.expoConfig?.hostUri, platform:Platform.OS });
let configuredUrl = inferredUrl;
try { configuredUrl = resolveApiUrl({ override:process.env.EXPO_PUBLIC_API_URL, hostUri:Constants.expoConfig?.hostUri, platform:Platform.OS }); }
catch { /* Invalid configuration can be corrected in the connection panel. */ }
const ApiContext = createContext(null);
export function ApiProvider({ children }) {
  const [baseUrl, setBaseUrl] = useState(configuredUrl);
  const value = useMemo(() => ({ baseUrl, suggestedUrl:inferredUrl, connect:value => setBaseUrl(normalizeBaseUrl(value)) }), [baseUrl]);
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
export const useApiConfig = () => useContext(ApiContext);
export const imageUrl = (name, baseUrl) => `${baseUrl}/assets/${encodeURIComponent(name)}`;
export const money = paise => new Intl.NumberFormat('en-IN', {
  style:'currency', currency:'INR', minimumFractionDigits:paise % 100 ? 2 : 0, maximumFractionDigits:2,
}).format(paise / 100);

export function useApi(path, jsonBody = null) {
  const { baseUrl } = useApiConfig();
  const requestId = `${baseUrl}:${path}:${jsonBody || ''}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ requestId:null, loading:true, data:null, error:null });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    let active = true;
    setState({ requestId, loading:true, data:null, error:null });
    requestJson(baseUrl, path, { body:jsonBody, signal:controller.signal })
      .then(data => { if (active) setState({ requestId, loading:false, data, error:null }); })
      .catch(error => { if (active) setState({ requestId, loading:false, data:null, error:error.message }); });
    return () => { active = false; controller.abort(); };
  }, [baseUrl, path, jsonBody, attempt]);
  const current = state.requestId === requestId ? state : { loading:true, data:null, error:null };
  // Keep internal identifiers out of the public result, especially React's reserved key.
  return { loading:current.loading, data:current.data, error:current.error, retry:() => setAttempt(n => n + 1) };
}

export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return debounced;
}
