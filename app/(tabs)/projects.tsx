import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getProjects, Project } from '../../utils/projectStorage';


export default function ProjectsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'any' | 'finished' | 'ongoing'>('any');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load projects when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const filteredProjects = projects.filter(project => 
    selectedFilter === 'any' || project.status === selectedFilter
  );

  const ProjectCard = ({ project }: { project: Project }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => router.push(`/project-details?projectId=${project.id}`)}
      activeOpacity={0.7}
    >
      <Image source={project.image} style={styles.projectImage} />
      <View style={styles.projectBody}>
        <View style={styles.projectHeader}>
          <View style={styles.projectTitle}>
            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.projectDate}>{project.date}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: project.status === 'finished' ? '#22c55d' : '#a1a1a1' }
          ]}>
            <Text style={styles.statusText}>
              {project.status === 'finished' ? 'Finished' : 'Ongoing'}
            </Text>
          </View>
        </View>
        <Text style={styles.projectAddress}>{project.address}</Text>
        <View style={styles.projectFooter}>
          <Text style={styles.viewDetailsText}>Tap to view details</Text>
          <Ionicons name="chevron-forward" size={16} color="#a1a1a1" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Projects</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'any' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter('any')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'any' && styles.filterButtonTextActive
              ]}>
                Any
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'finished' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter('finished')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'finished' && styles.filterButtonTextActive
              ]}>
                Finished
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'ongoing' && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter('ongoing')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'ongoing' && styles.filterButtonTextActive
              ]}>
                Ongoing
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/add-project')}
          >
            <Ionicons name="add-circle" size={36} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Projects List */}
        <View style={styles.projectsList}>
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#a1a1a1" />
              <Text style={styles.emptyStateTitle}>No projects yet</Text>
              <Text style={styles.emptyStateDescription}>
                Create your first project by tapping the + button above
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingBottom: 60, // Space for tab bar
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Geologica',
    letterSpacing: -0.32,
    lineHeight: 24,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButtonActive: {
    backgroundColor: '#ffce00',
    borderColor: '#ffce00',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  filterButtonTextActive: {
    color: '#000000',
  },
  addButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectsList: {
    gap: 20,
    paddingBottom: 20, // Space for tab bar
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
    textAlign: 'center',
  },
  projectCard: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 160,
  },
  projectBody: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectTitle: {
    flex: 1,
  },
  projectName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 20.4,
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 95,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  projectAddress: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 18,
  },
});
