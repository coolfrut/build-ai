import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { NutritionStorage } from '../../utils/nutritionStorage';
import { OpenAIService } from '../../utils/openAIService';

export default function ScannerScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<{ name: string; calories: number } | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');


  // Compress and convert image to base64 without blobs - prevents OOM crashes
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      console.log('🖼️ Compressing and converting image:', uri);
      
      // Step 1: Compress and resize image to reduce memory usage
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }], // 1280px width is enough for Vision API
        { 
          compress: 0.7, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      
      console.log('✅ Image compressed:', manipResult.uri);
      
      // Step 2: Convert to base64 using FileSystem (no blob/fetch!)
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ Base64 conversion complete, length:', base64.length);
      return base64;
    } catch (error) {
      console.error('❌ Error converting image to base64:', error);
      throw error;
    }
  };

  const analyzeImageForFood = async (imageUri: string) => {
    setIsAnalyzing(true);
    setCapturedImage(imageUri);
    
    try {
      // Convert and compress image to base64 (locally, not in state!)
      const base64Image = await convertImageToBase64(imageUri);
      
      // Analyze image with OpenAI Vision - base64 stays local
      console.log('🔍 Analyzing food with OpenAI...');
      const result = await OpenAIService.analyzeFoodImage(base64Image);

      if (result && result.name && result.calories > 0) {
        // Successfully analyzed - auto-fill fields
        console.log('✅ Food identified:', result.name, result.calories);
        setMealName(result.name);
        setMealCalories(result.calories.toString());
        setAnalyzedData(result);
        setShowConfirmModal(true); // Show modal with results
      } else {
        // Failed to analyze or no food detected
        console.log('⚠️ No food detected or analysis failed');
        Alert.alert(
          'Unable to recognize',
          'Could not identify the dish in the photo. Try another photo or enter data manually.',
          [
            {
              text: 'Retry',
              onPress: () => setCapturedImage(null)
            },
            {
              text: 'Enter manually',
              onPress: () => {
                setMealName('');
                setMealCalories('');
                setShowConfirmModal(true);
              }
            }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('❌ Error analyzing food:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      console.log('📸 Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Camera access permission required');
        return;
      }

      console.log('📸 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
      });

      console.log('📸 Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Photo taken:', result.assets[0].uri);
        await analyzeImageForFood(result.assets[0].uri);
      } else {
        console.log('Camera cancelled or no assets');
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo: ' + (error as Error).message);
    }
  };

  const handleAddFromPhoto = async () => {
    try {
      console.log('📂 Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📂 Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Gallery access permission required');
        return;
      }

      console.log('📂 Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      console.log('📂 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Image selected:', result.assets[0].uri);
        await analyzeImageForFood(result.assets[0].uri);
      } else {
        console.log('Image selection cancelled or no assets');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + (error as Error).message);
    }
  };

  const handleSaveMeal = async () => {
    if (!mealName.trim() || !mealCalories.trim()) {
      Alert.alert('Error', 'Fill in all fields');
      return;
    }

    const calories = parseInt(mealCalories);
    if (isNaN(calories) || calories <= 0) {
      Alert.alert('Error', 'Enter a valid number of calories');
      return;
    }

    try {
      const now = new Date();
      await NutritionStorage.addMeal({
        name: mealName.trim(),
        calories,
        date: now.toISOString(),
        time: now.toTimeString().slice(0, 5),
        imageUri: capturedImage || undefined,
        addedBy: 'ai',
      });

      setShowConfirmModal(false);
      setCapturedImage(null);
      setMealName('');
      setMealCalories('');
      setAnalyzedData(null);

      Alert.alert('Success', 'Meal added successfully', [
        {
          text: 'OK',
          onPress: () => router.push('/'),
        },
      ]);
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
    setCapturedImage(null);
    setMealName('');
    setMealCalories('');
    setAnalyzedData(null);
    setIsAnalyzing(false);
  };



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Photo</Text>
        <Text style={styles.headerSubtitle}>AI-powered calorie analysis</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffce00" />
            <Text style={styles.loadingText}>Analyzing your photo...</Text>
          </View>
        )}

        {!isAnalyzing && !showConfirmModal && (
          <>
            {/* How It Works Section */}
            <View style={styles.howItWorksSection}>
              <View style={styles.howItWorksHeader}>
                <View style={styles.aiIconWrapper}>
                  <Ionicons name="sparkles-outline" size={20} color="#ffce00" />
                </View>
                <Text style={styles.howItWorksTitle}>How does AI analysis work?</Text>
              </View>
              
              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Take or select a photo</Text>
                    <Text style={styles.stepDescription}>
                      Use camera or choose an existing photo of your meal
                    </Text>
                  </View>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>AI analyzes the image</Text>
                    <Text style={styles.stepDescription}>
                      Neural network identifies dishes and calculates calories
                    </Text>
                  </View>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Get results instantly</Text>
                    <Text style={styles.stepDescription}>
                      View details and save to your nutrition diary
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.accuracyBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.accuracyText}>95% accuracy in dish recognition</Text>
              </View>
            </View>

            {/* Upload Buttons Section */}
            <View style={styles.uploadSection}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => {
                  console.log('📸 Camera button pressed');
                  handleTakePhoto();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={32} color="#050508" />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, styles.uploadButtonSecondary]}
                onPress={() => {
                  console.log('📂 Gallery button pressed');
                  handleAddFromPhoto();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="images" size={32} color="#ffce00" />
                <Text style={[styles.uploadButtonText, styles.uploadButtonTextSecondary]}>
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelModal}
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
                    <Text style={styles.modalTitle}>Confirm Data</Text>
                    <TouchableOpacity onPress={handleCancelModal}>
                      <Ionicons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {capturedImage && (
                      <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                    )}

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

                    <View style={styles.modalButtons}>
                      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelModal}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeal}>
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
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
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#a1a1a1',
    marginTop: 16,
  },
  howItWorksSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.2)',
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiIconWrapper: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 206, 0, 0.15)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  stepsList: {
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 206, 0, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffce00',
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#a1a1a1',
    lineHeight: 18,
  },
  stepDivider: {
    width: 2,
    height: 16,
    backgroundColor: 'rgba(255, 206, 0, 0.2)',
    marginLeft: 15,
    marginVertical: 8,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  accuracyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },
  uploadSection: {
    gap: 16,
    marginTop: 8,
  },
  uploadButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  uploadButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffce00',
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#050508',
  },
  uploadButtonTextSecondary: {
    color: '#ffce00',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffce00',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#a1a1a1',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050508',
    fontFamily: 'Geologica',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cameraLoadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    marginTop: 16,
    textAlign: 'center',
  },
  photoPreviewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 20,
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  photoPreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginTop: 16,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  flipButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  instructionsTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 20.4,
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanFrame: {
    width: 280,
    height: 180,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#ffce00',
    borderWidth: 4,
  },
  scanCornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopLeftRadius: 12,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderTopRightRadius: 12,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomLeftRadius: 12,
  },
  scanCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderBottomRightRadius: 12,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  takePhotoButton: {
    backgroundColor: '#ffce00',
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addFromPhotoButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addFromPhotoText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 20.4,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
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
    maxHeight: '80%',
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
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#3b3b3b',
    resizeMode: 'cover',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#3b3b3b',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'Geologica',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3b3b3b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ffce00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#050508',
    fontFamily: 'Geologica',
  },
});
