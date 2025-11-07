import analytics from '@react-native-firebase/analytics';

class FirebaseService {
  private initialized = false;

  async initialize() {
    try {
      if (this.initialized) {
        console.log('[Firebase] Already initialized');
        return;
      }

      // Firebase is automatically initialized by the native modules
      // We just need to verify it's working
      await analytics().setAnalyticsCollectionEnabled(true);
      
      this.initialized = true;
      console.log('[Firebase] Initialized successfully');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error);
    }
  }

  async logAppInstall() {
    try {
      await analytics().logEvent('app_install', {
        timestamp: new Date().toISOString(),
        platform: 'android',
      });
      console.log('[Firebase] App install event logged');
    } catch (error) {
      console.error('[Firebase] Error logging app install:', error);
    }
  }

  async logAppOpen() {
    try {
      await analytics().logAppOpen();
      console.log('[Firebase] App open event logged');
    } catch (error) {
      console.error('[Firebase] Error logging app open:', error);
    }
  }

  async logScreenView(screenName: string, screenClass?: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      console.log(`[Firebase] Screen view logged: ${screenName}`);
    } catch (error) {
      console.error('[Firebase] Error logging screen view:', error);
    }
  }

  async logCustomEvent(eventName: string, params?: { [key: string]: any }) {
    try {
      await analytics().logEvent(eventName, params);
      console.log(`[Firebase] Custom event logged: ${eventName}`, params);
    } catch (error) {
      console.error('[Firebase] Error logging custom event:', error);
    }
  }
}

export default new FirebaseService();

