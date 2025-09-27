const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Скрипт для сброса статуса онбординга
// Используйте этот скрипт для тестирования онбординга

async function resetOnboarding() {
  try {
    await AsyncStorage.removeItem('has_seen_onboarding');
    console.log('✅ Статус онбординга сброшен! При следующем запуске приложения будет показан онбординг.');
  } catch (error) {
    console.error('❌ Ошибка при сбросе статуса онбординга:', error);
  }
}

resetOnboarding();
