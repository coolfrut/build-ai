import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  image: any;
  buttonText: string;
}

const onboardingData: OnboardingSlide[] = [
  {
    id: 1,
    title: '🏗️ Manage Your Projects',
    description: 'Track construction projects from start to finish. Add photos, set budgets, and monitor progress all in one place.',
    image: require('../../assets/images/onboarding/slide1.png'),
    buttonText: 'Continue',
  },
  {
    id: 2,
    title: '🧮 Smart Calculator',
    description: 'Calculate materials, costs, and measurements with ease. Get accurate estimates for cement, bricks, and more.',
    image: require('../../assets/images/onboarding/slide2.png'),
    buttonText: 'Continue',
  },
  {
    id: 3,
    title: '📱 Document Scanner',
    description: 'Scan receipts, blueprints, and invoices. Extract text automatically and get AI insights for your construction needs.',
    image: require('../../assets/images/onboarding/slide3.png'),
    buttonText: 'Get Started',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = async () => {
    if (currentSlide < onboardingData.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Mark onboarding as completed
      try {
        await AsyncStorage.setItem('has_seen_onboarding', 'true');
      } catch (error) {
        console.error('Error saving onboarding status:', error);
      }
      // Navigate to main app
      router.replace('/(tabs)');
    }
  };

  const currentData = onboardingData[currentSlide];


  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
      
      {/* Main Content with Background Image */}
      <View style={styles.content}>
        {/* Background Image */}
        <Image
          source={currentData.image}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Dark Overlay */}
        <View style={styles.darkOverlay} />

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentData.title}</Text>
          <Text style={styles.description}>{currentData.description}</Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
          <Text style={styles.continueButtonText}>{currentData.buttonText}</Text>
        </TouchableOpacity>

        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.6)',
  },
  textContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Geologica',
    lineHeight: 31.2,
  },
  description: {
    fontSize: 17,
    fontWeight: '500',
    color: '#a6a6a6',
    textAlign: 'center',
    lineHeight: 20.4,
    fontFamily: 'Geologica',
  },
  continueButton: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#ffce00',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Geologica',
    lineHeight: 26,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -67 }],
    width: 134,
    height: 5,
    backgroundColor: '#ffffff',
    borderRadius: 100,
  },
});