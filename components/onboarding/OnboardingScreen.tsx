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
    title: '🍽️ Track Your Meals',
    description: 'Log your daily meals with ease. Add photos, track calories, and monitor your nutrition all in one place.',
    image: require('../../assets/images/onboarding/slide1.png'),
    buttonText: 'Continue',
  },
  {
    id: 2,
    title: '📸 AI Food Scanner',
    description: 'Take a photo of your meal and let AI identify the food and calculate calories automatically.',
    image: require('../../assets/images/onboarding/slide2.png'),
    buttonText: 'Continue',
  },
  {
    id: 3,
    title: '💬 AI Nutritionist',
    description: 'Chat with AI nutritionist to get personalized advice, meal plans, and answers to your nutrition questions.',
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
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Image at the top */}
        <View style={styles.imageContainer}>
          <Image
            source={currentData.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentData.title}</Text>
          <Text style={styles.description}>{currentData.description}</Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
          <Text style={styles.continueButtonText}>{currentData.buttonText}</Text>
        </TouchableOpacity>
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
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
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