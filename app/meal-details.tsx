import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { NutritionStorage, Meal } from '../utils/nutritionStorage';

export default function MealDetailsScreen() {
  const { mealId } = useLocalSearchParams();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMeal();
  }, [mealId]);

  const loadMeal = async () => {
    setIsLoading(true);
    try {
      const allMeals = await NutritionStorage.getAllMeals();
      const foundMeal = allMeals.find(m => m.id === mealId);
      if (foundMeal) {
        setMeal(foundMeal);
      } else {
        Alert.alert('Error', 'Meal not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading meal:', error);
      Alert.alert('Error', 'Failed to load data');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
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
              await NutritionStorage.deleteMeal(mealId as string);
              Alert.alert('Success', 'Meal deleted', [
                { text: 'OK', onPress: () => router.back() }
              ]);
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
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatFullDate = (dateStr: string, time: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}, ${time}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffce00" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={styles.backButton} />
        </View>
        <ActivityIndicator size="large" color="#ffce00" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!meal) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffce00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderButton}>
          <Ionicons name="trash-outline" size={24} color="#ff4656" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image if available */}
        {meal.imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: meal.imageUri }} style={styles.mealImage} />
          </View>
        )}

        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.methodBadge}>
              <Text style={styles.methodEmoji}>
                {meal.addedBy === 'manual' ? '✏️' : '📷'}
              </Text>
              <Text style={styles.methodText}>
                {meal.addedBy === 'manual' ? 'Manual' : 'AI Scan'}
              </Text>
            </View>
          </View>

          <Text style={styles.mealName}>{meal.name}</Text>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesLabel}>Calories</Text>
            <View style={styles.caloriesBadge}>
              <Text style={styles.caloriesValue}>{meal.calories}</Text>
              <Text style={styles.caloriesUnit}>kcal</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#ffce00" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Date and Time</Text>
              <Text style={styles.infoValue}>{formatFullDate(meal.date, meal.time)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="time-outline" size={20} color="#ffce00" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{meal.time}</Text>
            </View>
          </View>

          {meal.notes && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#ffce00" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{meal.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#ff4656" />
          <Text style={styles.deleteButtonText}>Delete Meal</Text>
        </TouchableOpacity>
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
  deleteHeaderButton: {
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
  imageContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffce00',
  },
  mealImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#1c1c1d',
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: '#1c1c1d',
    borderWidth: 2,
    borderColor: '#3b3b3b',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b3b3b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  methodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  mealName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 20,
  },
  caloriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3b3b3b',
  },
  caloriesLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#ffce00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#050508',
    fontFamily: 'Geologica',
  },
  caloriesUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050508',
    fontFamily: 'Geologica',
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#3b3b3b',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1d',
    borderWidth: 2,
    borderColor: '#ff4656',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ff4656',
    fontFamily: 'Geologica',
  },
});

