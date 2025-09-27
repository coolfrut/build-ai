import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { saveProject } from '../utils/projectStorage';

type MaterialType = 'brick' | 'concrete' | 'wood';

export default function AddProjectScreen() {
  const [projectName, setProjectName] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('brick');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const materials: Array<{ type: MaterialType; name: string; image: any }> = [
    { type: 'brick', name: 'Brick', image: require('../assets/images/materials/brick.png') },
    { type: 'concrete', name: 'Concrete', image: require('../assets/images/materials/concrete.png') },
    { type: 'wood', name: 'Wood', image: require('../assets/images/materials/wood.png') },
  ];

  const pickImages = async () => {
    if (selectedImages.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images');
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to your photo library to upload images');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - selectedImages.length, // Limit based on already selected images
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Ensure max 5 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !address.trim() || !area.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      await saveProject({
        name: projectName.trim(),
        address: address.trim(),
        area: area.trim(),
        material: selectedMaterial,
        mediaImages: selectedImages,
      });

      Alert.alert('Success', 'Project created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create project. Please try again.');
      console.error('Error creating project:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creating a project</Text>
        </View>

        {/* Form Content */}
        <View style={styles.formContainer}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter the name"
                placeholderTextColor="#a1a1a1"
                value={projectName}
                onChangeText={setProjectName}
              />
            </View>
          </View>

          {/* Address Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Adress</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter the adress"
                placeholderTextColor="#a1a1a1"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          {/* Area Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Area</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="100"
                placeholderTextColor="#a1a1a1"
                value={area}
                onChangeText={setArea}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>m²</Text>
            </View>
          </View>

          {/* Material Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Material</Text>
            <View style={styles.materialGrid}>
              {materials.map((material) => (
                <TouchableOpacity
                  key={material.type}
                  style={[
                    styles.materialCard,
                    selectedMaterial === material.type && styles.materialCardActive,
                  ]}
                  onPress={() => setSelectedMaterial(material.type)}
                >
                  <View style={styles.materialIcon}>
                    <Image 
                      source={material.image} 
                      style={styles.materialIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.materialText}>{material.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Files Section */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Files ({selectedImages.length}/5)</Text>
            <View style={styles.filesContainer}>
              {selectedImages.length === 0 ? (
                <>
                  <Text style={styles.filesDescription}>
                    Upload up to 5 media files. Each file must be from 1MB to 50MB.
                  </Text>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
                    <Ionicons name="add" size={24} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Upload media</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imagesContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                    {selectedImages.map((imageUri, index) => (
                      <View key={index} style={styles.imageItem}>
                        <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton} 
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close" size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {selectedImages.length < 5 && (
                      <TouchableOpacity style={styles.addMoreButton} onPress={pickImages}>
                        <Ionicons name="add" size={24} color="#a1a1a1" />
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateProject}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Home Indicator */}
      <View style={styles.homeIndicator} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    letterSpacing: -0.32,
    lineHeight: 24,
    textAlign: 'center',
    flex: 1,
    marginRight: 56, // Compensate for back button width
  },
  formContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  unitText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
  },
  materialGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  materialCard: {
    width: 115,
    height: 75,
    backgroundColor: '#1c1c1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  materialCardActive: {
    borderColor: '#ffce00',
  },
  materialIcon: {
    width: 36,
    height: 36,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialIconImage: {
    width: 36,
    height: 36,
  },
  materialText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
    textAlign: 'center',
  },
  filesContainer: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    gap: 20,
  },
  filesDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  imagesContainer: {
    width: '100%',
  },
  imagesScroll: {
    paddingVertical: 8,
  },
  imageItem: {
    position: 'relative',
    marginRight: 12,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2c2c2d',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: '#ff4656',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#050508',
  },
  addMoreButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  createButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#050508',
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Geologica',
    lineHeight: 26,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -67 }],
    width: 134,
    height: 5,
    backgroundColor: '#ffffff',
    borderRadius: 100,
  },
});
