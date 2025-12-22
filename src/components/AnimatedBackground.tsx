import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Text,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "../constants/mining";

const { width, height } = Dimensions.get("window");

export const AnimatedBackground: React.FC = () => {
  const coins = Array.from({ length: 6 }).map(() => ({
    x: useSharedValue(Math.random() * width),
    y: useSharedValue(-50),
    rotate: useSharedValue(0),
  }));
  const crystals = Array.from({ length: 5 }).map(() => ({
    x: useSharedValue(Math.random() * width),
    y: useSharedValue(-50),
    rotate: useSharedValue(0),
  }));
  const stars = Array.from({ length: 20 }).map(() => ({
    opacity: useSharedValue(0.3),
    scale: useSharedValue(1),
    x: useSharedValue(Math.random() * width),
    y: useSharedValue(Math.random() * height),
  }));

  useEffect(() => {
    coins.forEach((c, i) => {
      const duration = 8000 + Math.random() * 4000;
      const delay = i * 800;
      
      setTimeout(() => {
        c.y.value = withRepeat(
          withTiming(height + 50, { duration }),
          -1,
          false
        );
        c.x.value = withRepeat(
          withSequence(
            withTiming(c.x.value - 30, { duration: duration / 4 }),
            withTiming(c.x.value + 60, { duration: duration / 2 }),
            withTiming(c.x.value - 30, { duration: duration / 4 })
          ),
          -1,
          false
        );
      }, delay);
      
      c.rotate.value = withRepeat(
        withTiming(360, { duration: 3000 + Math.random() * 2000 }),
        -1,
        false
      );
    });

    crystals.forEach((cr, i) => {
      const duration = 10000 + Math.random() * 5000;
      const delay = i * 1000;
      
      setTimeout(() => {
        cr.y.value = withRepeat(
          withTiming(height + 50, { duration }),
          -1,
          false
        );
        cr.x.value = withRepeat(
          withSequence(
            withTiming(cr.x.value + 40, { duration: duration / 3 }),
            withTiming(cr.x.value - 80, { duration: duration / 3 }),
            withTiming(cr.x.value + 40, { duration: duration / 3 })
          ),
          -1,
          false
        );
      }, delay);
      
      cr.rotate.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 1500 }),
          withTiming(-15, { duration: 1500 })
        ),
        -1,
        true
      );
    });

    stars.forEach((s, i) => {
      const delay = i * 100;
      setTimeout(() => {
        s.opacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1500 + Math.random() * 1000 }),
            withTiming(0.2, { duration: 1500 + Math.random() * 1000 })
          ),
          -1,
          false
        );
        s.scale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 1500 + Math.random() * 1000 }),
            withTiming(0.8, { duration: 1500 + Math.random() * 1000 })
          ),
          -1,
          false
        );
      }, delay);
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Main Background */}
      <View style={styles.mainBackground} />

      {/* Background Image */}
      <ImageBackground
        source={require("../../assets/logo.png")}
        style={styles.imageBackground}
        resizeMode="cover"
      />

      {/* Floating Coins */}
      {coins.map((c, i) => {
        const style = useAnimatedStyle(() => ({
          transform: [
            { translateX: c.x.value },
            { translateY: c.y.value },
            { rotate: `${c.rotate.value}deg` },
          ],
        }));
        return (
          <Animated.View
            key={`coin-${i}`}
            style={[styles.coin, style]}
          >
            <Text style={styles.coinText}>₿</Text>
          </Animated.View>
        );
      })}

      {/* Floating Crystals */}
      {crystals.map((cr, i) => {
        const style = useAnimatedStyle(() => ({
          transform: [
            { translateX: cr.x.value },
            { translateY: cr.y.value },
            { rotate: `${cr.rotate.value}deg` },
          ],
        }));
        return (
          <Animated.View
            key={`crystal-${i}`}
            style={[styles.crystalWrapper, style]}
          >
            <View style={styles.crystalOuter} />
            <View style={styles.crystalInner} />
          </Animated.View>
        );
      })}

      {/* Stars */}
      {stars.map((s, i) => {
        const style = useAnimatedStyle(() => ({
          opacity: s.opacity.value,
          transform: [
            { scale: s.scale.value },
            { translateX: s.x.value },
            { translateY: s.y.value },
          ],
        }));
        return (
          <Animated.Text
            key={`star-${i}`}
            style={[styles.star, style]}
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
  mainBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  coin: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.orange,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  coinText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  crystalWrapper: {
    position: "absolute",
    width: 40,
    height: 48,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  crystalOuter: {
    position: "absolute",
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 40,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: COLORS.cyan,
    opacity: 0.8,
  },
  crystalInner: {
    position: "absolute",
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 32,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: COLORS.cyanLight,
  },
  star: {
    position: "absolute",
    color: COLORS.yellow,
    fontSize: 8 + Math.random() * 8,
  },
});

export default AnimatedBackground;
