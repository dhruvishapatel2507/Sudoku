import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// A reusable gradient background for Sudoku cells
export default function GradientCellBg({
  width,
  height,
  borderRadius = 16,
  colors,
  children,
  style
}: {
  width: number;
  height: number;
  borderRadius?: number;
  colors: string[];
  children?: React.ReactNode;
  style?: any;
}) {
  return (
    <LinearGradient
      colors={colors as [string, string]}
      style={[
        styles.gradient,
        { width, height, borderRadius },
        style
      ]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
