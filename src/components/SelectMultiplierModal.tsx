import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS, MINING_RATES } from '../constants/mining';

const MULTIPLIERS = [1, 2, 3, 4, 5, 6];

interface SelectMultiplierModalProps {
  visible: boolean;
  selectedHours: number;
  onClose: () => void;
  onConfirm: (multiplier: number) => void;
}

const { width } = Dimensions.get('window');

export const SelectMultiplierModal: React.FC<SelectMultiplierModalProps> = ({
  visible,
  selectedHours,
  onClose,
  onConfirm,
}) => {
  const [selectedMultiplier, setSelectedMultiplier] = useState(1);
  const [spinAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setSelectedMultiplier(1);
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible, spinAnim]);

  const expectedReward = useMemo(() => {
    const rate = MINING_RATES[selectedMultiplier]?.rate ?? 0.01;
    const seconds = selectedHours * 3600;
    return (rate * seconds).toFixed(2);
  }, [selectedMultiplier, selectedHours]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerIcon}>⚡</Text>
            <Text style={styles.headerTitle}>SELECT MULTIPLIER</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>Duration Selected: {selectedHours}h</Text>
          </View>

          <View style={styles.centerpieceContainer}>
            <Animated.View style={[styles.centerpiece, { transform: [{ rotate: spin }] }]}>    
              <Text style={styles.centerpieceMultiplier}>{selectedMultiplier}×</Text>
              <Text style={styles.centerpieceLabel}>POWER</Text>
            </Animated.View>
          </View>

          <Text style={styles.sectionLabel}>CHOOSE YOUR POWER</Text>

          <View style={styles.multiplierRow}>
            {MULTIPLIERS.map((value) => {
              const isSelected = value === selectedMultiplier;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.multiplierBubble,
                    isSelected && {
                      backgroundColor: COLORS.orange,
                      borderColor: COLORS.orangeLight,
                    },
                  ]}
                  onPress={() => setSelectedMultiplier(value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.multiplierText,
                      isSelected && { color: COLORS.text },
                    ]}
                  >
                    {value}×
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rewardCard}>
            <Text style={styles.rewardLabel}>EXPECTED REWARD</Text>
            <Text style={styles.rewardAmount}>{expectedReward} TOKENS</Text>
            <Text style={styles.rewardMeta}>
              Rate: {(MINING_RATES[selectedMultiplier]?.rate ?? 0.01).toFixed(4)} tokens/sec
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => onConfirm(selectedMultiplier)}
            activeOpacity={0.9}
          >
            <Text style={styles.confirmIcon}>🚀</Text>
            <Text style={styles.confirmText}>START WITH {selectedMultiplier}× MULTIPLIER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: width > 420 ? 420 : width - 32,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 20,
    borderWidth: 4,
    borderColor: COLORS.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.orange,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkCard,
  },
  closeText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  durationBadge: {
    alignSelf: 'center',
    backgroundColor: COLORS.darkCard,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    marginBottom: 20,
  },
  durationText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
  },
  centerpieceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  centerpiece: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.orange,
    borderWidth: 6,
    borderColor: COLORS.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  centerpieceMultiplier: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.text,
  },
  centerpieceLabel: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  multiplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  multiplierBubble: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.slate,
  },
  multiplierText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  rewardCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: COLORS.yellow,
    marginBottom: 20,
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
    fontWeight: '600',
  },
  rewardAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  rewardMeta: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orange,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 4,
    borderColor: COLORS.orangeLight,
  },
  confirmIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
