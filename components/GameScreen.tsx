// Helper to get possible candidates for a cell
function getPossibleCandidates(board: number[][], row: number, col: number): number[] {
    if (board[row][col] !== 0) return [];
    const used = new Set<number>();
    for (let i = 0; i < 9; i++) {
        used.add(board[row][i]);
        used.add(board[i][col]);
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
            used.add(board[r][c]);
        }
    }
    return Array.from({ length: 9 }, (_, i) => i + 1).filter(n => !used.has(n));
}
// components/GameScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { saveGameState, loadGameState, clearGameState, SudokuGameState } from '../utils/storage';
import { View, Text, TouchableOpacity, StyleSheet, Alert, useColorScheme, Appearance } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import SudokuGrid from './SudokuGrid';
import { generatePuzzle } from '../utils/sudokuLogic';

type InputMode = 'pen' | 'pencil';
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;

interface GameScreenProps {
    route: GameScreenRouteProp;
    navigation: GameScreenNavigationProp;
}

const lightTheme = {
    background: '#f0f3f5',
    text: '#2c3e50',
    accent: '#a4c8e5',
    cell: '#fff',
    border: '#bdc3c7',
    highlight: '#ffeaa7',
    error: '#e74c3c',
    correct: '#a4e5a4',
    note: '#636100',
    pencil: '#4a90e2', // blue for pencil/notes
    pencilBg: '#eaf1fb', // very light blue background for pencil grid
};
const darkTheme = {
    background: '#181c1f',
    text: '#f0f3f5',
    accent: '#3a6ea5',
    cell: '#23272a',
    border: '#444b53',
    highlight: '#3a3e2f',
    error: '#ff7675',
    correct: '#55efc4',
    note: '#ffeaa7',
    pencil: '#7eb6ff', // lighter blue for dark mode
    pencilBg: '#232946', // deep blue background for pencil grid
};

const GameScreen: React.FC<GameScreenProps> = ({ route, navigation }) => {
    const { difficulty } = route.params;
    const [puzzle, setPuzzle] = useState<number[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [errorCells, setErrorCells] = useState<{ row: number; col: number }[]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [initialBoard, setInitialBoard] = useState<number[][]>([]);
    const [timer, setTimer] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [inputMode, setInputMode] = useState<InputMode>('pen');
    const [notes, setNotes] = useState<number[][][]>(Array(9).fill(null).map(() => Array(9).fill([])));
    // Undo/Redo stacks
    const [undoStack, setUndoStack] = useState<any[]>([]);
    const [redoStack, setRedoStack] = useState<any[]>([]);
    // Tooltip/modal for notes info
    const [showNotesInfo, setShowNotesInfo] = useState(false);
    // Auto notes toggle
    const [autoNotes, setAutoNotes] = useState(true);
    // Last move highlight
    const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
    // Theme state handled by themeIndex/palettes below

    // Manual error check handler (single definition)
    const handleCheck = useCallback(() => {
        const errors: { row: number; col: number }[] = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] !== 0 && puzzle[r][c] !== solution[r][c]) {
                    errors.push({ row: r, col: c });
                }
            }
        }
        setErrorCells(errors);
        if (errors.length === 0) {
            Alert.alert('No mistakes found!');
        } else {
            setTimeout(() => setErrorCells([]), 2000); // Clear after 2 seconds
        }
    }, [puzzle, solution]);

    // Initialize game with save/resume support
    useEffect(() => {
        (async () => {
            const saved = await loadGameState();
            if (saved && saved.difficulty === difficulty) {
                setPuzzle(saved.puzzle);
                setSolution(saved.solution);
                setInitialBoard(saved.initialBoard);
                setMistakes(saved.mistakes);
                setTimer(saved.timer);
                setNotes(saved.notes);
                setIsGameOver(false);
                setSelectedCell(null);
                setUndoStack([]);
                setRedoStack([]);
            } else {
                const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(difficulty);
                setPuzzle(newPuzzle.map(row => [...row]));
                setSolution(newSolution.map(row => [...row]));
                setInitialBoard(newPuzzle.map(row => [...row]));
                setIsGameOver(false);
                setMistakes(0);
                setTimer(0);
                setSelectedCell(null);
                setNotes(Array(9).fill(null).map(() => Array(9).fill([])));
                setUndoStack([]);
                setRedoStack([]);
            }
        })();
    }, [difficulty]);

    // Save game state on every relevant change
    useEffect(() => {
        if (puzzle.length && solution.length && initialBoard.length) {
            saveGameState({
                puzzle,
                solution,
                initialBoard,
                notes,
                mistakes,
                timer,
                difficulty
            });
        }
    }, [puzzle, notes, mistakes, timer, difficulty, solution, initialBoard]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isGameOver) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => interval && clearInterval(interval);
    }, [isGameOver]);

    // Game completion check
    const checkCompletion = useCallback(() => {
        try {
            return puzzle.every((row, i) =>
                row.every((cell, j) => cell === solution[i][j])
            ) && puzzle.length === 9 && solution.length === 9;
        } catch {
            return false;
        }
    }, [puzzle, solution]);

    // Handle game completion
    const handleGameComplete = useCallback(() => {
        if (checkCompletion() && !isGameOver) {
            setIsGameOver(true);
            clearGameState();
            setShowCompletionModal(true);
        }
    }, [checkCompletion, isGameOver]);
    // Completion modal state
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    // Simple confetti effect (optional, can be replaced with a package for more polish)
    const Confetti = () => (
        <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 100,
        }}>
            <Text style={{ fontSize: 64, color: '#ffe066', opacity: 0.8 }}>🎉</Text>
        </View>
    );

    // Completion detection
    useEffect(() => {
        if (puzzle.length > 0 && solution.length > 0) {
            console.log('Checking completion...'); // Debug log
            handleGameComplete();
        }
        const timer = setTimeout(() => handleGameComplete(), 100);
        return () => clearTimeout(timer);
    }, [puzzle, handleGameComplete]);

    // Handle game over
    const handleGameOver = useCallback(() => {
        setIsGameOver(true);
        Alert.alert(
            'Game Over',
            'Too many mistakes!',
            [
                {
                    text: 'Retry',
                    onPress: () => navigation.replace('Game', { difficulty })
                },
                {
                    text: 'Home',
                    onPress: () => navigation.navigate('Home')
                }
            ],
            { cancelable: false }
        );
    }, [difficulty, navigation]);

    // Handle number input
    const handleNumberInput = (num: number) => {
        // Clear error highlights on new input
        setErrorCells([]);
        if (!selectedCell || isGameOver) return;

        const { row, col } = selectedCell;

        // Save current state for undo
        setUndoStack(prev => [
            {
                puzzle: puzzle.map(r => [...r]),
                notes: notes.map(r => r.map(c => [...c])),
                mistakes,
            },
            ...prev
        ]);
        setRedoStack([]); // Clear redo stack on new move

        if (inputMode === 'pen') {
            if (num === solution[row][col]) {
                // Correct entry
                const newPuzzle = puzzle.map(row => [...row]);
                newPuzzle[row][col] = num;
                setPuzzle(newPuzzle);

                if (autoNotes) {
                    // Smart auto-notes: remove this number from all notes in row, col, block
                    setNotes(prevNotes => {
                        const newNotes = prevNotes.map(r => r.map(c => [...c]));
                        // Clear notes for the filled cell
                        newNotes[row][col] = [];
                        // Remove from row and column
                        for (let i = 0; i < 9; i++) {
                            // Row
                            if (newNotes[row][i].includes(num)) {
                                newNotes[row][i] = newNotes[row][i].filter(n => n !== num);
                            }
                            // Column
                            if (newNotes[i][col].includes(num)) {
                                newNotes[i][col] = newNotes[i][col].filter(n => n !== num);
                            }
                        }
                        // Remove from block
                        const startRow = Math.floor(row / 3) * 3;
                        const startCol = Math.floor(col / 3) * 3;
                        for (let r2 = startRow; r2 < startRow + 3; r2++) {
                            for (let c2 = startCol; c2 < startCol + 3; c2++) {
                                if (newNotes[r2][c2].includes(num)) {
                                    newNotes[r2][c2] = newNotes[r2][c2].filter(n => n !== num);
                                }
                            }
                        }
                        return newNotes;
                    });
                }
            } else {
                // Incorrect entry: highlight as error
                setErrorCells([{ row, col }]);
                const newMistakes = mistakes + 1;
                setMistakes(newMistakes);
                if (newMistakes >= 3) {
                    handleGameOver();
                }
            }
        } else {
            // Pencil/notes mode
            setNotes(prevNotes => {
                const newNotes = prevNotes.map(r => [...r]);
                const currentNotes = newNotes[row][col];

                if (currentNotes.includes(num)) {
                    newNotes[row][col] = currentNotes.filter(n => n !== num);
                } else {
                    newNotes[row][col] = [...currentNotes, num].slice(0, 9);
                }
                return newNotes;
            });
        }
        setSelectedCell(null);
    };

    // (removed duplicate handleCheck definition)
    // (removed stray destructure of selectedCell)
    // (removed stray closing brace)

    // Undo/Redo handlers
    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return;
        const prevState = undoStack[0];
        setUndoStack((prev: any[]) => prev.slice(1));
        setRedoStack((prev: any[]) => [
            {
                puzzle: puzzle.map((r: number[]) => [...r]),
                notes: notes.map((r: number[][]) => r.map((c: number[]) => [...c])),
                mistakes: prevState.mistakes,
            },
            ...prev
        ]);
        setPuzzle(prevState.puzzle.map((r: number[]) => [...r]));
        setNotes(prevState.notes.map((r: number[][]) => r.map((c: number[]) => [...c])));
        setMistakes(prevState.mistakes);
    }, [undoStack, puzzle, notes, mistakes]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[0];
        setRedoStack((prev: any[]) => prev.slice(1));
        setUndoStack((prev: any[]) => [
            {
                puzzle: puzzle.map((r: number[]) => [...r]),
                notes: notes.map((r: number[][]) => r.map((c: number[]) => [...c])),
                mistakes: nextState.mistakes,
            },
            ...prev
        ]);
        setPuzzle(nextState.puzzle.map((r: number[]) => [...r]));
        setNotes(nextState.notes.map((r: number[][]) => r.map((c: number[]) => [...c])));
        setMistakes(nextState.mistakes);
    }, [redoStack, puzzle, notes, mistakes]);

    // Hint handler: fill a random empty cell with the correct value
    const handleHint = () => {
        if (isGameOver) return;
        // Find all empty cells
        const emptyCells: { row: number; col: number }[] = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] === 0) emptyCells.push({ row: r, col: c });
            }
        }
        if (emptyCells.length === 0) return;
        // Pick a random empty cell
        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctValue = solution[row][col];
        // Save current state for undo
        setUndoStack(prev => [
            {
                puzzle: puzzle.map(r => [...r]),
                notes: notes.map(r => r.map(c => [...c])),
                mistakes,
            },
            ...prev
        ]);
        setRedoStack([]);
        // Fill the cell and auto-remove notes
        const newPuzzle = puzzle.map(r => [...r]);
        newPuzzle[row][col] = correctValue;
        setPuzzle(newPuzzle);
        setNotes(prevNotes => {
            const newNotes = prevNotes.map(r => r.map(c => [...c]));
            newNotes[row][col] = [];
            for (let i = 0; i < 9; i++) {
                if (newNotes[row][i].includes(correctValue)) {
                    newNotes[row][i] = newNotes[row][i].filter(n => n !== correctValue);
                }
                if (newNotes[i][col].includes(correctValue)) {
                    newNotes[i][col] = newNotes[i][col].filter(n => n !== correctValue);
                }
            }
            const startRow = Math.floor(row / 3) * 3;
            const startCol = Math.floor(col / 3) * 3;
            for (let r2 = startRow; r2 < startRow + 3; r2++) {
                for (let c2 = startCol; c2 < startCol + 3; c2++) {
                    if (newNotes[r2][c2].includes(correctValue)) {
                        newNotes[r2][c2] = newNotes[r2][c2].filter(n => n !== correctValue);
                    }
                }
            }
            return newNotes;
        });
    };

    // Toggle input mode
    const toggleInputMode = () => {
        setInputMode(prev => prev === 'pen' ? 'pencil' : 'pen');
    };

    // Format time display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handler for Pencil button: fill all notes with all possible candidates
    const handlePencilAll = () => {
        setNotes(prevNotes => prevNotes.map((row, r) =>
            row.map((cell, c) => getPossibleCandidates(puzzle, r, c))
        ));
    };

    // Long-press handler for cells: fill all notes if empty, clear if present
    const [toast, setToast] = useState<string | null>(null);
    const handleCellLongPress = (row: number, col: number) => {
        if (isGameOver || initialBoard[row][col] !== 0) return;
        setUndoStack(prev => [
            {
                puzzle: puzzle.map(r => [...r]),
                notes: notes.map(r => r.map(c => [...c])),
                mistakes,
            },
            ...prev
        ]);
        setRedoStack([]);
        setNotes(prevNotes => {
            const current = prevNotes[row][col];
            if (!current || current.length === 0) {
                // Fill with all possible notes
                const candidates = getPossibleCandidates(puzzle, row, col);
                setToast('All possible notes filled');
                return prevNotes.map((r, rIdx) => r.map((c, cIdx) => (rIdx === row && cIdx === col ? candidates : c)));
            } else {
                // Clear notes
                setToast('Notes cleared');
                return prevNotes.map((r, rIdx) => r.map((c, cIdx) => (rIdx === row && cIdx === col ? [] : c)));
            }
        });
        setTimeout(() => setToast(null), 1200);
    };

    // Theme picker logic
    const palettes = [
        { name: 'Light', ...lightTheme },
        { name: 'Dark', ...darkTheme },
        { name: 'Ocean', background: '#e0f7fa', text: '#006064', accent: '#4dd0e1', cell: '#ffffff', border: '#00bcd4', highlight: '#b2ebf2', error: '#e57373', correct: '#81c784', note: '#00838f', pencil: '#0288d1', pencilBg: '#b3e5fc' },
        { name: 'Sunset', background: '#fff3e0', text: '#bf360c', accent: '#ff8a65', cell: '#fffde7', border: '#ffb300', highlight: '#ffe0b2', error: '#d84315', correct: '#ffd54f', note: '#ff7043', pencil: '#ffb74d', pencilBg: '#ffe0b2' },
    ];
    const [themeIndex, setThemeIndex] = useState(0);
    const theme = useMemo(() => palettes[themeIndex], [themeIndex]);

    // Loading indicator for puzzle generation
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        setTimeout(async () => {
            const saved = await loadGameState();
            if (saved && saved.difficulty === difficulty) {
                setPuzzle(saved.puzzle);
                setSolution(saved.solution);
                setInitialBoard(saved.initialBoard);
                setMistakes(saved.mistakes);
                setTimer(saved.timer);
                setNotes(saved.notes);
                setIsGameOver(false);
                setSelectedCell(null);
                setUndoStack([]);
                setRedoStack([]);
            } else {
                // Generate puzzle async so UI is never blocked
                await new Promise(resolve => setTimeout(resolve, 10));
                const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(difficulty);
                setPuzzle(newPuzzle.map(row => [...row]));
                setSolution(newSolution.map(row => [...row]));
                setInitialBoard(newPuzzle.map(row => [...row]));
                setIsGameOver(false);
                setMistakes(0);
                setTimer(0);
                setSelectedCell(null);
                setNotes(Array(9).fill(null).map(() => Array(9).fill([])));
                setUndoStack([]);
                setRedoStack([]);
            }
            setLoading(false);
        }, 0);
    }, [difficulty]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}> 
            {loading && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.background, zIndex: 200, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: theme.text, fontSize: 22, fontWeight: 'bold' }}>Loading puzzle...</Text>
                </View>
            )}
            {toast && (
                <View style={{ position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center', zIndex: 200 }}>
                    <View style={{ backgroundColor: theme.cell, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: theme.pencil, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 6 }}>
                        <Text style={{ color: theme.text, fontWeight: 'bold' }}>{toast}</Text>
                    </View>
                </View>
            )}
            {showCompletionModal && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    zIndex: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Confetti />
                    <View style={{ backgroundColor: theme.cell, borderRadius: 16, padding: 32, alignItems: 'center', width: 300, maxWidth: '90%' }}>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>🎉 Congratulations!</Text>
                        <Text style={{ fontSize: 18, color: theme.text, marginBottom: 24 }}>You completed the puzzle in {formatTime(timer)}!</Text>
                        <TouchableOpacity style={[styles.checkButton, { backgroundColor: theme.correct, marginBottom: 10 }]} onPress={() => navigation.replace('Game', { difficulty })}>
                            <Text style={[styles.checkText, { color: theme.text }]}>New Game</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.checkButton, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('Home')}>
                            <Text style={[styles.checkText, { color: theme.text }]}>Main Menu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <View style={styles.header}>
                <Text style={[styles.timer, { color: theme.text }]}>⏱️ {formatTime(timer)}</Text>
                <Text style={[styles.mistakes, { color: theme.error }]}>❌ {mistakes}/3</Text>
                <TouchableOpacity
                    style={[styles.themeButton, { backgroundColor: theme.accent }]}
                    onPress={() => setThemeIndex((themeIndex + 1) % palettes.length)}
                >
                    <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                        Theme: {palettes[themeIndex].name}
                    </Text>
                </TouchableOpacity>
            </View>




            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <TouchableOpacity
                    style={[styles.modeButton, inputMode === 'pen' ? { backgroundColor: theme.accent } : { backgroundColor: theme.cell }]}
                    onPress={toggleInputMode}
                >
                    <Text style={[styles.modeText, { color: theme.text }]}>
                        {inputMode === 'pen' ? '✒️ Pen' : '📝 Pencil'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, { backgroundColor: autoNotes ? theme.pencil : theme.cell, borderWidth: 1, borderColor: theme.pencil, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                    onPress={() => setAutoNotes(a => !a)}
                >
                    <Text style={[styles.modeText, { color: autoNotes ? theme.background : theme.pencil, fontWeight: 'bold' }]}>Auto Notes: {autoNotes ? 'ON' : 'OFF'}</Text>
                    <TouchableOpacity
                        onPress={() => setShowNotesInfo(true)}
                        style={{ marginLeft: 4 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={{ color: autoNotes ? theme.background : theme.pencil, fontSize: 16 }}>ℹ️</Text>
                    </TouchableOpacity>
                </TouchableOpacity>

            {/* Tooltip/modal for notes info */}
            {showNotesInfo && (
                <View style={{ position: 'absolute', top: 90, left: 0, right: 0, alignItems: 'center', zIndex: 200 }}>
                    <View style={{ backgroundColor: theme.cell, borderRadius: 10, padding: 16, maxWidth: 320, borderWidth: 1, borderColor: theme.pencil, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 8 }}>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>Auto Notes</Text>
                        <Text style={{ color: theme.text, fontSize: 14, marginBottom: 8 }}>
                            <Text style={{ fontWeight: 'bold' }}>ON:</Text> Notes update automatically as you fill numbers. {'\n'}
                            <Text style={{ fontWeight: 'bold' }}>OFF:</Text> Notes only change when you edit them or use the Pencil button.
                        </Text>
                        <TouchableOpacity onPress={() => setShowNotesInfo(false)} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                            <Text style={{ color: theme.pencil, fontWeight: 'bold', fontSize: 15 }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            </View>

            <SudokuGrid
                board={puzzle}
                initialBoard={initialBoard}
                selectedCell={selectedCell}
                notes={notes}
                onCellPress={(row, col) => {
                    if (!isGameOver && initialBoard[row][col] === 0) {
                        setSelectedCell({ row, col });
                        setLastMove({ row, col });
                    }
                }}
                onCellLongPress={handleCellLongPress}
                highlightInfo={selectedCell ? {
                    row: selectedCell.row,
                    col: selectedCell.col,
                    block: {
                        startRow: Math.floor(selectedCell.row / 3) * 3,
                        startCol: Math.floor(selectedCell.col / 3) * 3
                    },
                    value: puzzle[selectedCell.row][selectedCell.col]
                } : null}
                errorCells={errorCells}
                theme={theme}
                lastMove={lastMove}
            />

            <View style={styles.undoRedoRow}>
                <TouchableOpacity style={[styles.undoRedoButton, { backgroundColor: theme.cell }]} onPress={handleUndo} disabled={undoStack.length === 0}>
                    <Text style={[styles.undoRedoText, { color: undoStack.length === 0 ? '#ccc' : theme.text }]}>Undo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.undoRedoButton, { backgroundColor: theme.cell }]} onPress={handleRedo} disabled={redoStack.length === 0}>
                    <Text style={[styles.undoRedoText, { color: redoStack.length === 0 ? '#ccc' : theme.text }]}>Redo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.hintButton, { backgroundColor: theme.highlight }]} onPress={handleHint} disabled={isGameOver}>
                    <Text style={[styles.hintText, { color: theme.note }]}>Hint</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.checkButton, { backgroundColor: theme.correct }]} onPress={handleCheck} disabled={isGameOver}>
                    <Text style={[styles.checkText, { color: theme.text }]}>Check</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.hintButton, { backgroundColor: theme.pencil }]} onPress={handlePencilAll} disabled={isGameOver}>
                    <Text style={[styles.hintText, { color: theme.background }]}>Pencil</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.numberPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <TouchableOpacity
                        key={num}
                        style={[styles.numberButton, { backgroundColor: theme.cell, borderColor: theme.border }]}
                        onPress={() => handleNumberInput(num)}
                        disabled={isGameOver}
                    >
                        <Text style={[styles.numberText, { color: theme.text }]}>{num}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    themeButton: {
        padding: 8,
        borderRadius: 5,
        minWidth: 60,
        alignItems: 'center',
    },
    modeButton: {
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        alignSelf: 'center',
        minWidth: 100,
        alignItems: 'center',
    },
    modeText: {
        fontSize: 16,
        fontWeight: '500',
    },
    timer: {
        fontSize: 18,
        fontWeight: '600',
    },
    mistakes: {
        fontSize: 18,
        fontWeight: '600',
    },
    undoRedoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 10,
        gap: 20,
    },
    undoRedoButton: {
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
        minWidth: 60,
        alignItems: 'center',
    },
    undoRedoText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
        gap: 10,
    },
    numberButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        margin: 2,
    },
    numberText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    hintButton: {
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
        minWidth: 60,
        alignItems: 'center',
    },
    hintText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkButton: {
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
        minWidth: 60,
        alignItems: 'center',
    },
    checkText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default GameScreen;

function checkCompletion() {
    throw new Error('Function not implemented.');
}
