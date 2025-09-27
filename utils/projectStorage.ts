import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Project {
  id: string;
  name: string;
  date: string;
  address: string;
  status: 'finished' | 'ongoing';
  area: string;
  material: 'brick' | 'concrete' | 'wood';
  image: any; // Main project image (for cards)
  mediaImages: string[]; // User uploaded images (up to 5)
}

const PROJECTS_KEY = 'builder_city_projects';

// Project images based on status
const projectImages = {
  finished: require('../assets/images/projects/finished.png'),
  ongoing: require('../assets/images/projects/ongoing.png'),
};

export const getProjectImage = (status: 'finished' | 'ongoing') => {
  return projectImages[status];
};

export const saveProject = async (project: Omit<Project, 'id' | 'date' | 'image' | 'mediaImages'> & { mediaImages?: string[] }): Promise<Project> => {
  try {
    const existingProjects = await getProjects();
    
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      status: 'ongoing', // New projects start as ongoing
      image: getProjectImage('ongoing'),
      mediaImages: project.mediaImages || [],
    };
    
    const updatedProjects = [...existingProjects, newProject];
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
    
    return newProject;
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const getProjects = async (): Promise<Project[]> => {
  try {
    const projectsData = await AsyncStorage.getItem(PROJECTS_KEY);
    if (projectsData) {
      const projects = JSON.parse(projectsData);
      // Ensure images are properly set and mediaImages exists
      return projects.map((project: Project) => ({
        ...project,
        image: getProjectImage(project.status),
        mediaImages: project.mediaImages || [], // Ensure mediaImages exists for old projects
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
};

export const updateProjectStatus = async (projectId: string, status: 'finished' | 'ongoing'): Promise<void> => {
  try {
    const existingProjects = await getProjects();
    const updatedProjects = existingProjects.map(project => 
      project.id === projectId 
        ? { ...project, status, image: getProjectImage(status) }
        : project
    );
    
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
  } catch (error) {
    console.error('Error updating project status:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const existingProjects = await getProjects();
    const updatedProjects = existingProjects.filter(project => project.id !== projectId);
    
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
