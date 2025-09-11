import { Canvas, Group, Rect, Text, useFont } from '@shopify/react-native-skia';
import React, { useCallback, useState } from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useDerivedValue,
  useSharedValue,
  withDecay,
  runOnJS
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Interface for canvas items
 */
interface CanvasItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

/**
 * Sample data items for demonstration
 * Creates a grid of 200 colorful items distributed across the canvas
 */
const sampleItems: CanvasItem[] = Array.from({ length: 200 }, (_, i) => ({
  id: i,
  x: (i % 20) * 150 - 1500, // Spread items across canvas
  y: Math.floor(i / 20) * 100 - 500,
  width: 120,
  height: 60,
  text: `Item ${i + 1}`,
  color: `hsl(${(i * 137.5) % 360}, 70%, 60%)`, // Different colors
}));

/**
 * InfiniteCanvas component demonstrating the concepts from the blog post:
 * - Transform matrix for coordinate management
 * - Multi-touch gesture handling with focal point tracking
 * - Performance optimization through content culling
 * - Smooth 60fps rendering with Skia
 */
export default function InfiniteCanvas() {
  // Core shared values for transform state
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  
  // Track previous pan position for delta calculation
  const prevPanX = useSharedValue(0);
  const prevPanY = useSharedValue(0);
  
  // Zoom state
  const scalePrevious = useSharedValue(1);
  
  // Selection state
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  

  // Load font (optional - fallback to default if not found)
  const font = useFont(require('../assets/fonts/SpaceMono-Regular.ttf'), 14);

  // Calculate transform matrix (simplified since we're not using scaleCurrent anymore)
  const transform = useDerivedValue(() => {
    return [
      { translateX: panX.value },
      { translateY: panY.value },
      { scale: scalePrevious.value },
    ];
  });

  // Content culling - only render items visible in viewport (using blog post approach)
  const visibleItems = useDerivedValue(() => {
    const currentZoom = scalePrevious.value;
    const currentPanX = panX.value;
    const currentPanY = panY.value;
    
    // Calculate viewport bounds in world coordinates (blog post method)
    const viewportLeft = (0 - currentPanX) / currentZoom;
    const viewportRight = (screenWidth - currentPanX) / currentZoom;
    const viewportTop = (0 - currentPanY) / currentZoom;
    const viewportBottom = (screenHeight - currentPanY) / currentZoom;
    
    // Add margin for smooth scrolling
    const margin = 300 / currentZoom;

    return sampleItems.filter(item => {
      const itemLeft = item.x;
      const itemRight = item.x + item.width;
      const itemTop = item.y;
      const itemBottom = item.y + item.height;
      
      // Check if item intersects with viewport (blog post logic)
      return !(itemRight < viewportLeft - margin ||
               itemLeft > viewportRight + margin ||
               itemBottom < viewportTop - margin ||
               itemTop > viewportBottom + margin);
    });
  });

  /**
   * Handles tap gestures for item selection
   * Converts screen coordinates to world coordinates and performs hit testing
   */
  const handleTap = useCallback((
    screenX: number, 
    screenY: number, 
    currentZoom: number, 
    currentPanX: number, 
    currentPanY: number
  ) => {
    // Convert screen coordinates to world coordinates
    const worldX = (screenX - currentPanX) / currentZoom;
    const worldY = (screenY - currentPanY) / currentZoom;
    
    // Hit test against items
    const tappedItem = sampleItems.find((item: CanvasItem) => {
      return worldX >= item.x && 
             worldX <= item.x + item.width &&
             worldY >= item.y && 
             worldY <= item.y + item.height;
    });
    
    setSelectedItemId(tappedItem ? tappedItem.id : null);
  }, []);

  const tapGesture = Gesture.Tap()
    .onStart((event) => {
      runOnJS(handleTap)(event.x, event.y, scalePrevious.value, panX.value, panY.value);
    });

  // Pan gesture handler - 1:1 finger tracking with momentum
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      // Store the starting position
      prevPanX.value = event.translationX;
      prevPanY.value = event.translationY;
    })
    .onUpdate((event) => {
      // Calculate the change since last frame
      const deltaX = event.translationX - prevPanX.value;
      const deltaY = event.translationY - prevPanY.value;
      
      // Apply the delta to pan position
      panX.value += deltaX;
      panY.value += deltaY;
      
      // Update previous position for next frame
      prevPanX.value = event.translationX;
      prevPanY.value = event.translationY;
    })
    .onEnd((event) => {
      // Add momentum with smooth physics
      panX.value = withDecay({
        velocity: event.velocityX,
        deceleration: 0.998,
        clamp: [-5000, 5000]
      });
      
      panY.value = withDecay({
        velocity: event.velocityY,
        deceleration: 0.998,
        clamp: [-5000, 5000]
      });
    });

  // Pinch gesture handler - apply zoom continuously
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // Apply zoom sensitivity (slower zoom)
      const zoomSensitivity = 0.05;
      const rawScale = 1 + (event.scale - 1) * zoomSensitivity;
      const newZoom = Math.max(0.1, Math.min(5.0, scalePrevious.value * rawScale));
      
      // Get current focal point
      const currentFocalX = event.focalX;
      const currentFocalY = event.focalY;
      
      // Calculate what world point is under the focal point at current zoom
      const worldX = (currentFocalX - panX.value) / scalePrevious.value;
      const worldY = (currentFocalY - panY.value) / scalePrevious.value;
      
      // Update zoom and adjust pan to keep world point under focal point
      scalePrevious.value = newZoom;
      panX.value = currentFocalX - worldX * newZoom;
      panY.value = currentFocalY - worldY * newZoom;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={{ flex: 1 }}>
        <Canvas style={{ flex: 1 }}>
          <Group transform={transform}>
            {visibleItems.value.map(item => {
              const isSelected = selectedItemId === item.id;
              return (
                <Group key={item.id}>
                  {/* Item background */}
                  <Rect
                    x={item.x}
                    y={item.y}
                    width={item.width}
                    height={item.height}
                    color={item.color}
                    style="fill"
                  />
                  {/* Item border - thicker and different color when selected */}
                  <Rect
                    x={item.x}
                    y={item.y}
                    width={item.width}
                    height={item.height}
                    color={isSelected ? "#007AFF" : "black"}
                    style="stroke"
                    strokeWidth={isSelected ? 3 : 1}
                  />
                  {/* Item text */}
                  <Text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2}
                    text={item.text}
                    font={font}
                    color="black"
                  />
                </Group>
              );
            })}
            
            {/* Origin indicator */}
            <Group>
              <Rect
                x={-5}
                y={-5}
                width={10}
                height={10}
                color="red"
                style="fill"
              />
              <Text
                x={10}
                y={0}
                text="Origin (0,0)"
                font={font}
                color="red"
              />
            </Group>
          </Group>
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
}