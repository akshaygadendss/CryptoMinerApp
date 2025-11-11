import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export const AnimatedBackground: React.FC = () => {
  const stars = Array.from({ length: 30 }).map(() => {
    const angle = Math.random() * Math.PI * 2;
    // Increase distance multiplier to move stars beyond screen edges
    const distance = Math.random() * Math.max(width, height) * 1.8 + Math.max(width, height) * 0.5;
    
    return {
      x: useSharedValue(width / 2),
      y: useSharedValue(height / 2),
      targetX: width / 2 + Math.cos(angle) * distance,
      targetY: height / 2 + Math.sin(angle) * distance,
      opacity: useSharedValue(0),
      scale: useSharedValue(0.5),
    };
  });

  useEffect(() => {
    stars.forEach((s, i) => {
      const delay = i * 200;
      const duration = 4000 + Math.random() * 2000;
      
      setTimeout(() => {
        s.x.value = withTiming(s.targetX, { duration });
        s.y.value = withTiming(s.targetY, { duration });
        
        // Fade out as stars move away
        s.opacity.value = withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.8, { duration: duration / 2 }),
          withTiming(0, { duration: duration / 2 })
        );
        
        // Stars grow slightly then shrink as they move away
        s.scale.value = withSequence(
          withTiming(1.5, { duration: duration / 3 }),
          withTiming(0.3, { duration: (duration * 2) / 3 })
        );
      }, delay);
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Transparent background image */}
      <ImageBackground
        source={require("../../assets/logo.png")}
        style={styles.imageBackground}
        resizeMode="cover"
      />

      {/* Stars spreading from center and moving off screen */}
      {stars.map((s, i) => {
        const style = useAnimatedStyle(() => ({
          opacity: s.opacity.value,
          transform: [
            { translateX: s.x.value },
            { translateY: s.y.value },
            { scale: s.scale.value },
          ],
        }));
        return (
          <Animated.Text
            key={`star-${i}`}
            style={[
              styles.star,
              style,
              {
                fontSize: 10 + Math.random() * 10,
              },
            ]}
          >
            ✦
          </Animated.Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width,
    height,
    zIndex: 0,
    overflow: "hidden",
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  star: {
    position: "absolute",
    color: "#FCD34D",
  },
});

export default AnimatedBackground;