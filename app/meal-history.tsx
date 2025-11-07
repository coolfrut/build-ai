import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { NutritionStorage, DayMeals } from '../utils/nutritionStorage';

export default function MealHistoryScreen() {
  const [mealsHistory, setMealsHistory] = useState<DayMeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await NutritionStorage.getMealsGroupedByDate(30); // Last 30 days
      setMealsHistory(history);
      if (history.length > 0 && !selectedDate) {
        setSelectedDate(history[0].date);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert(
      'Delete meal?',
      'This action cannot be undone',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await NutritionStorage.deleteMeal(mealId);
              loadHistory();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = dateStr.split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayStr) return 'Today';
    if (dateOnly === yesterdayStr) return 'Yesterday';

    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const selectedDayData = mealsHistory.find(day => day.date === selectedDate);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffce00" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal History</Text>
          <View style={styles.backButton} />
        </View>
        <ActivityIndicator size="large" color="#ffce00" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffce00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meals history</Text>
        <View style={styles.backButton} />
      </View>

      {/* Date Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateSelector}
        contentContainerStyle={styles.dateSelectorContent}
      >
        {mealsHistory.map((dayMeals) => (
          <TouchableOpacity
            key={dayMeals.date}
            style={[
              styles.dateItem,
              selectedDate === dayMeals.date && styles.dateItemActive
            ]}
            onPress={() => setSelectedDate(dayMeals.date)}
          >
            <Text style={[
              styles.dateItemText,
              selectedDate === dayMeals.date && styles.dateItemTextActive
            ]}>
              {formatShortDate(dayMeals.date)}
            </Text>
            <Text style={[
              styles.dateItemCalories,
              selectedDate === dayMeals.date && styles.dateItemCaloriesActive
            ]}>
              {dayMeals.totalCalories} kcal
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meals List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedDayData ? (
          <>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{formatDate(selectedDayData.date)}</Text>
              <View style={styles.dayTotalBadge}>
                <Text style={styles.dayTotalText}>
                  {selectedDayData.totalCalories} kcal
                </Text>
              </View>
            </View>

            {selectedDayData.meals.length > 0 ? (
              <View style={styles.mealsList}>
                {selectedDayData.meals.map((meal) => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.mealCard}
                    onPress={() => router.push({
                      pathname: '/meal-details',
                      params: { mealId: meal.id }
                    })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.mealLeft}>
                      <View style={styles.mealIconContainer}>
                        <Text style={styles.mealIcon}>
                          {meal.addedBy === 'manual' ? '✏️' : '📷'}
                        </Text>
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealTime}>{meal.time}</Text>
                        {meal.notes && (
                          <Text style={styles.mealNotes} numberOfLines={1}>
                            {meal.notes}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.mealRight}>
                      <View style={styles.caloriesBadge}>
                        <Text style={styles.mealCalories}>{meal.calories}</Text>
                        <Text style={styles.mealCaloriesUnit}>kcal</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteMeal(meal.id);
                        }}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ff4656" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Image 
                  source={require('../assets/images/blank.png')} 
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>No meals</Text>
                <Text style={styles.emptyHint}>on this day</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Image 
              source={require('../assets/images/blank.png')} 
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>History  is empty</Text>
            <Text style={styles.emptyHint}>Add first meal</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  dateSelector: {
    maxHeight: 80,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1d',
  },
  dateSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dateItem: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: '#3b3b3b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  dateItemActive: {
    backgroundColor: '#ffce00',
    borderColor: '#ffce00',
  },
  dateItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 4,
  },
  dateItemTextActive: {
    color: '#050508',
  },
  dateItemCalories: {
    fontSize: 12,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  dateItemCaloriesActive: {
    color: '#050508',
  },
  scrollView: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  dayTotalBadge: {
    backgroundColor: '#ffce00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dayTotalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#050508',
    fontFamily: 'Geologica',
  },
  mealsList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 20,
  },
  mealCard: {
    backgroundColor: '#1c1c1d',
    borderWidth: 2,
    borderColor: '#3b3b3b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#3b3b3b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    marginBottom: 2,
  },
  mealNotes: {
    fontSize: 13,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    fontStyle: 'italic',
  },
  mealRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  caloriesBadge: {
    backgroundColor: '#ffce00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#050508',
    fontFamily: 'Geologica',
  },
  mealCaloriesUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#050508',
    fontFamily: 'Geologica',
    marginLeft: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    textAlign: 'center',
  },
});

