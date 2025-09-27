import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { VisionService } from '../../utils/visionService';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const analyzeImageAndSendToAI = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      // Analyze image to extract text
      const result = await VisionService.analyzeImage(imageUri);
      
      if (!result.success) {
        Alert.alert('Analysis Failed', result.error || 'Failed to extract text from image');
        return;
      }

      if (!result.extractedText.trim()) {
        Alert.alert('No Text Found', 'No readable text was found in the image. Please try with a clearer image.');
        return;
      }

      // Create message for AI Builder
      const message = `I have a question about my project: ${result.extractedText}`;
      
      // Navigate to AI Builder tab and pass the extracted text
      router.push({
        pathname: '/(tabs)/ai-builder',
        params: { 
          autoMessage: message
        }
      });

      Alert.alert('Success', 'Text extracted and sent to AI Builder!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        await analyzeImageAndSendToAI(photo.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleAddFromPhoto = async () => {
    // Request permission for photo library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to your photo library to select images');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await analyzeImageAndSendToAI(result.assets[0].uri);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            This app needs camera access to scan documents and capture images.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Construction Scanner</Text>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          {/* Camera Controls Overlay */}
          <View style={styles.overlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Scan Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Position document in frame</Text>
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCornerTopLeft]} />
                <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
                <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
                <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              {/* Take Photo Button */}
              <TouchableOpacity 
                style={[styles.takePhotoButton, isAnalyzing && styles.buttonDisabled]} 
                onPress={handleTakePhoto}
                disabled={isAnalyzing}
              >
                <Ionicons name="camera" size={32} color="#ffffff" />
              </TouchableOpacity>
              
              {/* Add from Gallery Button */}
              <TouchableOpacity 
                style={[styles.addFromPhotoButton, isAnalyzing && styles.buttonDisabled]} 
                onPress={handleAddFromPhoto}
                disabled={isAnalyzing}
              >
                <Ionicons name="image" size={24} color="#ffffff" />
                <Text style={styles.addFromPhotoText}>
                  {isAnalyzing ? 'Analyzing...' : 'Add from photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingBottom: 60, // Space for tab bar
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1c1c1d',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 24,
    textAlign: 'center',
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
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
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
});
