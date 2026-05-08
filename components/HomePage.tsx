import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type HomePageNavigationProp = StackNavigationProp<any, 'Home'>;

interface HomePageProps {
    navigation: HomePageNavigationProp;
}

const HomePage: React.FC<HomePageProps> = ({ navigation }) => {
    const handleDifficultySelect = (difficulty: string) => {
        navigation.navigate('Game', { difficulty });
        console.log('Home page')
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Choose Difficulty Level</Text>
            
            <Button
                title="Easy"
                onPress={() => handleDifficultySelect('easy')}
            />
            <Button
                title="Medium"
                onPress={() => handleDifficultySelect('medium')}
            />
            <Button
                title="Hard"
                onPress={() => handleDifficultySelect('hard')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default HomePage;
