import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { NutritionStorage } from '../utils/nutritionStorage';

type Gender = 'male' | 'female';
type DeficitLevel = 'light' | 'moderate' | 'aggressive';

export default function WeightCalculatorScreen() {
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState(1.375); // Легкая активность
  const [deficitLevel, setDeficitLevel] = useState<DeficitLevel>('moderate');
  const [result, setResult] = useState<{
    dailyCalories: number;
    estimatedWeeks: number;
    estimatedMonths: number;
  } | null>(null);

  const deficitOptions = {
    light: { label: 'Light', value: 250, description: '-250 kcal/day' },
    moderate: { label: 'Moderate', value: 500, description: '-500 kcal/day' },
    aggressive: { label: 'Aggressive', value: 750, description: '-750 kcal/day' },
  };

  const activityOptions = [
    { label: 'Minimal', value: 1.2, description: 'Sedentary lifestyle' },
    { label: 'Light', value: 1.375, description: '1-3 workouts per week' },
    { label: 'Moderate', value: 1.55, description: '3-5 workouts per week' },
    { label: 'High', value: 1.725, description: '6-7 workouts per week' },
    { label: 'Very High', value: 1.9, description: 'Hard training twice a day' },
  ];

  const calculateBMR = (weight: number, height: number, age: number, gender: Gender): number => {
    // Формула Миффлина-Сан Жеора
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const handleCalculate = async () => {
    // Validate inputs
    if (!age || !height || !currentWeight || !targetWeight) {
      Alert.alert('Error', 'Fill in all fields');
      return;
    }

    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const currentWeightNum = parseFloat(currentWeight);
    const targetWeightNum = parseFloat(targetWeight);

    if (
      isNaN(ageNum) || ageNum < 10 || ageNum > 100 ||
      isNaN(heightNum) || heightNum < 100 || heightNum > 250 ||
      isNaN(currentWeightNum) || currentWeightNum < 30 || currentWeightNum > 300 ||
      isNaN(targetWeightNum) || targetWeightNum < 30 || targetWeightNum > 300
    ) {
      Alert.alert('Error', 'Enter valid values');
      return;
    }

    if (targetWeightNum >= currentWeightNum) {
      Alert.alert('Error', 'Target weight must be less than current weight');
      return;
    }

    // Calculate BMR
    const bmr = calculateBMR(currentWeightNum, heightNum, ageNum, gender);
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityLevel;
    
    // Calculate target calories with deficit
    const deficit = deficitOptions[deficitLevel].value;
    const dailyCalories = Math.round(tdee - deficit);

    // Calculate weight loss estimation
    // 1 kg fat ≈ 7700 calories
    const totalWeightToLose = currentWeightNum - targetWeightNum;
    const totalCaloriesNeeded = totalWeightToLose * 7700;
    const estimatedDays = totalCaloriesNeeded / deficit;
    const estimatedWeeks = Math.ceil(estimatedDays / 7);
    const estimatedMonths = Math.ceil(estimatedWeeks / 4);

    setResult({
      dailyCalories,
      estimatedWeeks,
      estimatedMonths,
    });

    // Save calorie goal
    try {
      await NutritionStorage.setCalorieGoal(dailyCalories);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleApply = () => {
    Alert.alert(
      'Goal Set!',
      `Your daily goal: ${result?.dailyCalories} kcal`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffce00" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weight Loss Calculator</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={require('../assets/images/calculator_il.png')} 
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Gender Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gender</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                onPress={() => setGender('male')}
              >
                <Text style={styles.genderEmoji}>👨</Text>
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                onPress={() => setGender('female')}
              >
                <Text style={styles.genderEmoji}>👩</Text>
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age (years)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 25"
                placeholderTextColor="#a1a1a1"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 170"
                placeholderTextColor="#a1a1a1"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 80"
                placeholderTextColor="#a1a1a1"
                value={currentWeight}
                onChangeText={setCurrentWeight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 70"
                placeholderTextColor="#a1a1a1"
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Activity Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Level</Text>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  activityLevel === option.value && styles.optionButtonActive,
                ]}
                onPress={() => setActivityLevel(option.value)}
              >
                <View style={styles.optionLeft}>
                  <Text style={[
                    styles.optionLabel,
                    activityLevel === option.value && styles.optionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {activityLevel === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#ffce00" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Deficit Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calorie Deficit</Text>
            {Object.entries(deficitOptions).map(([key, option]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  deficitLevel === key && styles.optionButtonActive,
                ]}
                onPress={() => setDeficitLevel(key as DeficitLevel)}
              >
                <View style={styles.optionLeft}>
                  <Text style={[
                    styles.optionLabel,
                    deficitLevel === key && styles.optionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {deficitLevel === key && (
                  <Ionicons name="checkmark-circle" size={24} color="#ffce00" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Calculate Button */}
          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Text style={styles.calculateButtonText}>Calculate</Text>
          </TouchableOpacity>

          {/* Result */}
          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Your Weight Loss Plan</Text>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Daily Calorie Goal:</Text>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultValue}>{result.dailyCalories}</Text>
                  <Text style={styles.resultUnit}>kcal</Text>
                </View>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Estimated Time:</Text>
                <Text style={styles.resultText}>
                  {result.estimatedWeeks} {result.estimatedWeeks === 1 ? 'week' : 'weeks'} 
                  {' '}({result.estimatedMonths} {result.estimatedMonths === 1 ? 'month' : 'months'})
                </Text>
              </View>

              <View style={styles.resultInfo}>
                <Ionicons name="information-circle" size={20} color="#ffce00" />
                <Text style={styles.resultInfoText}>
                  Calorie goal automatically set on the main screen
                </Text>
              </View>

              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply and Return</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  scrollView: {
    flex: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  illustration: {
    width: '100%',
    maxWidth: 300,
    height: 200,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffce00',
    fontFamily: 'Geologica',
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#1c1c1d',
    borderWidth: 2,
    borderColor: '#3b3b3b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#ffce00',
    backgroundColor: '#1c1c1d',
  },
  genderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  genderTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1c1c1d',
    borderWidth: 2,
    borderColor: '#3b3b3b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  optionButton: {
    backgroundColor: '#1c1c1d',
    borderWidth: 2,
    borderColor: '#3b3b3b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: '#ffce00',
  },
  optionLeft: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    marginBottom: 4,
  },
  optionLabelActive: {
    color: '#ffffff',
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  calculateButton: {
    backgroundColor: '#ffce00',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#050508',
    fontFamily: 'Geologica',
  },
  resultCard: {
    backgroundColor: '#1c1c1d',
    borderWidth: 2,
    borderColor: '#ffce00',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 24,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#ffce00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#050508',
    fontFamily: 'Geologica',
  },
  resultUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050508',
    fontFamily: 'Geologica',
    marginLeft: 4,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#3b3b3b',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  resultInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 18,
  },
  applyButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#050508',
    fontFamily: 'Geologica',
  },
});

