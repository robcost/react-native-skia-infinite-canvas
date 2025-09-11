import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import InfiniteCanvas from '@/components/InfiniteCanvas';

/**
 * Main demo screen showcasing the infinite canvas with Skia
 * Demonstrates concepts from the blog post:
 * - Transform matrix coordinate management
 * - Multi-touch gesture handling
 * - Performance optimization through content culling
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Infinite Canvas Demo</ThemedText>
        <ThemedText style={styles.instructions}>
          • Pan: Drag with one finger
        </ThemedText>
        <ThemedText style={styles.instructions}>
          • Zoom: Pinch with two fingers
        </ThemedText>
        <ThemedText style={styles.instructions}>
          • Select: Tap any item to highlight it
        </ThemedText>
        <ThemedText style={styles.instructions}>
          200 items with content culling for performance
        </ThemedText>
      </ThemedView>
      <InfiniteCanvas />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  instructions: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
});