// navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import HomePage from '../components/HomePage';
import GameScreen from '../components/GameScreen';

// Optional: Global context for future extensibility (settings, stats, etc.)
// export const AppContext = React.createContext({});

// Define the types for your navigation
export type RootStackParamList = {
    Home: undefined;
    Game: { difficulty: 'easy' | 'medium' | 'hard' };
};

const Stack = createStackNavigator<RootStackParamList>();

// Custom theme for navigation
const SudokuTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f0f3f5',
    primary: '#2c3e50',
    card: '#a4c8e5',
    text: '#2c3e50',
    border: '#bdc3c7',
    notification: '#e74c3c',
  },
};

// Error boundary for navigation
class NavigationErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // Log error if needed
    console.error('Navigation error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <>{/* Fallback UI */}Something went wrong.</>;
    }
    return this.props.children;
  }
}

const AppNavigator = () => (
  <NavigationErrorBoundary>
    <NavigationContainer theme={SudokuTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#a4c8e5' },
          headerTintColor: '#2c3e50',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomePage}
          options={{ title: 'Sudoku Home' }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={({ route }) => ({
            title: `Sudoku - ${route.params?.difficulty?.toUpperCase() || ''}`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  </NavigationErrorBoundary>
);

export default AppNavigator;