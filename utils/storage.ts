import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUDOKU_SAVE_KEY = 'SUDOKU_GAME_STATE';

export interface SudokuGameState {
  puzzle: number[][];
  solution: number[][];
  initialBoard: number[][];
  notes: number[][][];
  mistakes: number;
  timer: number;
  difficulty: string;
}

export async function saveGameState(state: SudokuGameState) {
  try {
    await AsyncStorage.setItem(SUDOKU_SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    // handle error
    console.error('Failed to save game state', e);
  }
}

export async function loadGameState(): Promise<SudokuGameState | null> {
  try {
    const json = await AsyncStorage.getItem(SUDOKU_SAVE_KEY);
    if (json) return JSON.parse(json);
    return null;
  } catch (e) {
    console.error('Failed to load game state', e);
    return null;
  }
}

export async function clearGameState() {
  try {
    await AsyncStorage.removeItem(SUDOKU_SAVE_KEY);
  } catch (e) {
    console.error('Failed to clear game state', e);
  }
}
