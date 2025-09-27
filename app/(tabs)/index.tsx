// Redirect to projects screen
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/projects" />;
}
