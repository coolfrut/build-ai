import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { NutritionStorage, DayMeals } from '../../utils/nutritionStorage';

export default function NutritionScreen() {
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [todayCalories, setTodayCalories] = useState(0);
  const [mealsHistory, setMealsHistory] = useState<DayMeals[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal form states
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [goalInput, setGoalInput] = useState('');

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [goal, todayCal, history] = await Promise.all([
        NutritionStorage.getCalorieGoal(),
        NutritionStorage.getTodayCalories(),
        NutritionStorage.getMealsGroupedByDate(7),
      ]);

      setCalorieGoal(goal);
      setTodayCalories(todayCal);
      setMealsHistory(history);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMeal = async () => {
    if (!mealName.trim() || !mealCalories.trim()) {
      Alert.alert('Error', 'Fill in all fields');
      return;
    }

    const calories = parseInt(mealCalories);
    if (isNaN(calories) || calories <= 0) {
      Alert.alert('Error', 'Enter correct number of calories');
      return;
    }

    try {
      const now = new Date();
      await NutritionStorage.addMeal({
        name: mealName.trim(),
        calories,
        date: now.toISOString(),
        time: now.toTimeString().slice(0, 5),
        addedBy: 'manual',
      });

      setMealName('');
      setMealCalories('');
      setIsAddModalVisible(false);
      loadData();
      Alert.alert('Success', 'Meal added');
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to add meal');
    }
  };

  const handleUpdateGoal = async () => {
    const goal = parseInt(goalInput);
    if (isNaN(goal) || goal <= 0) {
      Alert.alert('Error', 'Enter correct value');
      return;
    }

    try {
      await NutritionStorage.setCalorieGoal(goal);
      setCalorieGoal(goal);
      setGoalInput('');
      setIsGoalModalVisible(false);
      Alert.alert('Success', 'Goal updated');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal');
    }
  };


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = dateStr.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayStr) return 'Сегодня';
    if (dateOnly === yesterdayStr) return 'Вчера';

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const progressPercentage = Math.min((todayCalories / calorieGoal) * 100, 100);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffce00" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Diet</Text>
          <Text style={styles.headerSubtitle}>Calorie and nutrition tracker</Text>
        </View>

        {/* Calorie Goal Widget - Full Width */}
        <TouchableOpacity
          style={styles.widgetLarge}
          onPress={() => {
            setGoalInput(calorieGoal.toString());
            setIsGoalModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.widgetContent}>
            <View style={styles.widgetLeft}>
              <Text style={styles.widgetEmoji}>🎯</Text>
              <View style={styles.widgetTextContainer}>
              <Text style={styles.widgetTitle}>Daily Goal</Text>
              <Text style={styles.widgetSubtitle}>
                {todayCalories} / {calorieGoal} kcal
              </Text>
              </View>
            </View>
            <View style={styles.widgetArrow}>
              <Ionicons name="arrow-forward" size={24} color="#050508" />
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Row 1: Add Meal Widgets */}
        <View style={styles.widgetRow}>
          <TouchableOpacity
            style={styles.widgetSmall}
            onPress={() => setIsAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../../assets/images/main/manual.png')}
              style={styles.widgetBackground}
              imageStyle={styles.widgetBackgroundImage}
            >
              <View style={styles.widgetContentSmall}>
                <View style={styles.spacer} />
                <Text style={styles.widgetTitleSmall}>Manual</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.widgetSmall}
            onPress={() => {
              // Navigate to scanner tab by index (index 2)
              router.navigate('/(tabs)/scanner');
            }}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../../assets/images/main/camera.png')}
              style={styles.widgetBackground}
              imageStyle={styles.widgetBackgroundImage}
            >
              <View style={styles.widgetContentSmall}>
                <View style={styles.spacer} />
                <Text style={styles.widgetTitleSmall}>AI Scan</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Row 2: Calculator & History */}
        <View style={styles.widgetRow}>
          <TouchableOpacity
            style={styles.widgetSmall}
            onPress={() => router.push('/weight-calculator')}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../../assets/images/main/calculator.png')}
              style={styles.widgetBackground}
              imageStyle={styles.widgetBackgroundImage}
            >
              <View style={styles.widgetContentSmall}>
                <View style={styles.spacer} />
                <Text style={styles.widgetTitleSmall}>Calculator</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.widgetSmall}
            onPress={() => router.push('/meal-history')}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={require('../../assets/images/main/history.png')}
              style={styles.widgetBackground}
              imageStyle={styles.widgetBackgroundImage}
            >
              <View style={styles.widgetContentSmall}>
                <View style={styles.spacer} />
                <Text style={styles.widgetTitleSmall}>History</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Meal</Text>
                    <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Meal name"
                    placeholderTextColor="#a1a1a1"
                    value={mealName}
                    onChangeText={setMealName}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Calories"
                    placeholderTextColor="#a1a1a1"
                    value={mealCalories}
                    onChangeText={setMealCalories}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity style={styles.modalButton} onPress={handleAddMeal}>
                    <Text style={styles.modalButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Goal Modal */}
      <Modal
        visible={isGoalModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Change Goal</Text>
                    <TouchableOpacity onPress={() => setIsGoalModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Goal (kcal per day)"
                    placeholderTextColor="#a1a1a1"
                    value={goalInput}
                    onChangeText={setGoalInput}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity style={styles.modalButton} onPress={handleUpdateGoal}>
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingBottom: 60,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffce00',
    fontFamily: 'Geologica',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  
  // Large Widget (Goal)
  widgetLarge: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#ffce00',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#ffce00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  widgetContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  widgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  widgetEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  widgetTextContainer: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 4,
  },
  widgetSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  widgetArrow: {
    width: 48,
    height: 48,
    backgroundColor: '#ffce00',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginTop: 16,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#1c1c1d',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3b3b3b',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffce00',
    borderRadius: 5,
  },

  // Small Widgets (2 columns)
  widgetRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  widgetSmall: {
    flex: 1,
    borderRadius: 20,
    minHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  widgetBackground: {
    flex: 1,
    padding: 16,
  },
  widgetBackgroundImage: {
    borderRadius: 20,
    opacity: 0.5,
  },
  widgetContentSmall: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  widgetTitleSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Geologica',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1d',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  input: {
    backgroundColor: '#3b3b3b',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  modalButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050508',
    fontFamily: 'Geologica',
  },
});

