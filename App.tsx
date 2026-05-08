import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator'; // Importing the AppNavigator for navigation

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}
