import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getProjects, updateProjectStatus, deleteProject, Project } from '../utils/projectStorage';

const { width: screenWidth } = Dimensions.get('window');

export default function ProjectDetailsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const projects = await getProjects();
      const foundProject = projects.find(p => p.id === projectId);
      setProject(foundProject || null);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!project) return;
    
    const newStatus = project.status === 'ongoing' ? 'finished' : 'ongoing';
    try {
      await updateProjectStatus(project.id, newStatus);
      setProject(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    
    try {
      await deleteProject(project.id);
      router.back();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!project || project.mediaImages.length === 0) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(prev => 
        prev > 0 ? prev - 1 : project.mediaImages.length - 1
      );
    } else {
      setSelectedImageIndex(prev => 
        prev < project.mediaImages.length - 1 ? prev + 1 : 0
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#000000" translucent={false} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#000000" translucent={false} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" translucent={false} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Details</Text>
          <TouchableOpacity style={styles.menuButton} onPress={handleDeleteProject}>
            <Ionicons name="trash" size={24} color="#ff4656" />
          </TouchableOpacity>
        </View>

        {/* Project Info */}
        <View style={styles.contentContainer}>
          {/* Main Project Image */}
          <View style={styles.projectImageContainer}>
            <Image source={project.image} style={styles.projectImage} />
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {project.status === 'finished' ? 'Completed' : 'Ongoing'}
              </Text>
            </View>
          </View>

          {/* Project Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.projectDate}>{project.date}</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{project.address}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Area</Text>
                <Text style={styles.infoValue}>{project.area} m²</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Material</Text>
                <Text style={styles.infoValue}>
                  {project.material.charAt(0).toUpperCase() + project.material.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Media Gallery */}
          {project.mediaImages && project.mediaImages.length > 0 && (
            <View style={styles.mediaContainer}>
              <Text style={styles.mediaTitle}>Media ({project.mediaImages.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.mediaScroll}
              >
                {project.mediaImages.map((imageUri, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.mediaItem}
                    onPress={() => openImageModal(index)}
                  >
                    <Image source={{ uri: imageUri }} style={styles.mediaImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity 
            style={[
              styles.actionButton,
              project.status === 'finished' ? styles.actionButtonFinished : styles.actionButtonOngoing
            ]}
            onPress={handleStatusToggle}
          >
            <Text style={styles.actionButtonText}>
              {project.status === 'finished' ? 'Mark as Ongoing' : 'Mark as Completed'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setImageModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedImageIndex + 1} of {project.mediaImages.length}
            </Text>
          </View>
          
          <View style={styles.imageContainer}>
            {project.mediaImages.length > 1 && (
              <TouchableOpacity 
                style={[styles.navButton, styles.prevButton]} 
                onPress={() => navigateImage('prev')}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
            
            <Image 
              source={{ uri: project.mediaImages[selectedImageIndex] }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
            
            {project.mediaImages.length > 1 && (
              <TouchableOpacity 
                style={[styles.navButton, styles.nextButton]} 
                onPress={() => navigateImage('next')}
              >
                <Ionicons name="chevron-forward" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Geologica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    letterSpacing: -0.32,
    lineHeight: 24,
  },
  menuButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 24,
    paddingBottom: 80,
  },
  projectImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffce00',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Geologica',
  },
  detailsContainer: {
    gap: 16,
  },
  projectName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 30,
  },
  projectDate: {
    fontSize: 16,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 20,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 18,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22,
  },
  mediaContainer: {
    gap: 16,
  },
  mediaTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 24,
  },
  mediaScroll: {
    paddingVertical: 4,
  },
  mediaItem: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 120,
    height: 120,
    backgroundColor: '#2c2c2d',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  actionButtonOngoing: {
    backgroundColor: '#ffce00',
  },
  actionButtonFinished: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Geologica',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Geologica',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: screenWidth,
    height: '70%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
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
