// components/SudokuGrid.tsx
import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SudokuCell from './SudokuCell';

type HighlightInfo = {
    row: number;
    col: number;
    block: { startRow: number; startCol: number };
    value: number;
} | null;

type Theme = {
    background: string;
    text: string;
    accent: string;
    cell: string;
    border: string;
    highlight: string;
    error: string;
    correct: string;
    note: string;
    pencil: string; // new color for pencil/notes
    pencilBg?: string; // optional background for pencil grid
    fontFamily?: string;
    gridBackgroundImage?: any; // optional background image or pattern
};

type SudokuGridProps = {
    board: number[][];
    initialBoard: number[][];
    selectedCell: { row: number; col: number } | null;
    notes: number[][][];
    onCellPress: (row: number, col: number) => void;
    onCellLongPress?: (row: number, col: number) => void;
    highlightInfo?: HighlightInfo;
    errorCells?: { row: number; col: number }[];
    theme: Theme;
    lastMove?: { row: number; col: number } | null;
    cellFontSize?: number;
};

const SudokuGrid: React.FC<SudokuGridProps> = ({
    board,
    initialBoard,
    selectedCell,
    notes,
    onCellPress,
    onCellLongPress,
    highlightInfo,
    errorCells = [],
    theme,
    lastMove = null,
    cellFontSize = 20
}) => {
    // Responsive, perfectly square grid sizing
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    const gridPadding = 16;
    // Ensure grid fits vertically as well as horizontally, with a small buffer for controls
    // Use the smaller of width or height, minus a safe buffer for controls (header, number pad, etc)
    const safeVertical = windowHeight - 340; // slightly more buffer
    const safeHorizontal = windowWidth - gridPadding * 2;
    const gridSize = Math.min(safeVertical, safeHorizontal);
    // Use floating point cell size for perfect fit
    const cellSize = gridSize / 9;
    // Ensure grid is exactly 9x9 cells
    const trueGridSize = cellSize * 9;
// For accessibility: keep track of focused cell
    const focusedCell = useRef<{ row: number; col: number } | null>(null);

    return (
        <View style={[styles.gridBackgroundWrapper, { height: trueGridSize, minHeight: trueGridSize, maxHeight: trueGridSize }] }>
            <View style={[styles.gridOuterShadow, { borderRadius: 0 }]}> 
                <View
                    style={[
                        styles.grid,
                        {
                            width: trueGridSize,
                            height: trueGridSize,
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                            borderRadius: 0,
                            overflow: 'hidden',
                            shadowColor: theme.text,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.10,
                            shadowRadius: 24,
                            elevation: 12,
                        },
                    ]}
                >
                    {/* Subtle grid background gradient */}
                    <View style={styles.gridGradientOverlay} pointerEvents="none" />
                    {board.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((cell, colIndex) => {
                                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                                const isInitial = initialBoard[rowIndex][colIndex] !== 0;
                                const cellNotes = notes[rowIndex][colIndex];
                                // Highlight logic
                                let highlightStyle = {};
                                if (highlightInfo) {
                                    const inRow = rowIndex === highlightInfo.row;
                                    const inCol = colIndex === highlightInfo.col;
                                    const inBlock = rowIndex >= highlightInfo.block.startRow && rowIndex < highlightInfo.block.startRow + 3 &&
                                        colIndex >= highlightInfo.block.startCol && colIndex < highlightInfo.block.startCol + 3;
                                    const isSameValue = cell !== 0 && cell === highlightInfo.value && !(isSelected);
                                    if (isSelected) {
                                        highlightStyle = { backgroundColor: theme.accent };
                                    } else if (inRow || inCol || inBlock) {
                                        highlightStyle = { backgroundColor: theme.highlight };
                                    } else if (isSameValue) {
                                        highlightStyle = { backgroundColor: theme.correct };
                                    }
                                }
                                // Last move highlight (yellow border)
                                const isLastMove = !!(lastMove && lastMove.row === rowIndex && lastMove.col === colIndex);
                                // Error highlight
                                const isError = errorCells.some(ec => ec.row === rowIndex && ec.col === colIndex);
                                // Notes as a 3x3 grid (1-9 in correct positions, always show full grid)
                                const notesGrid = Array.from({ length: 3 }, (_, r) =>
                                    Array.from({ length: 3 }, (_, c) => {
                                        const num = r * 3 + c + 1;
                                        return cellNotes.includes(num) ? num : '';
                                    })
                                );
                                return (
                                    <SudokuCell
                                        key={colIndex}
                                        rowIndex={rowIndex}
                                        colIndex={colIndex}
                                        cell={cell}
                                        isSelected={isSelected}
                                        isInitial={isInitial}
                                        cellNotes={cellNotes}
                                        highlightStyle={highlightStyle}
                                        isLastMove={isLastMove}
                                        isError={isError}
                                        cellSize={cellSize}
                                        onCellPress={onCellPress}
                                        onCellLongPress={onCellLongPress}
                                        theme={theme}
                                        cellFontSize={cellFontSize}
                                        notesGrid={notesGrid}
                                        focusedCell={focusedCell}
                                        pencilColor={theme.pencil}
                                        pencilBg={theme.pencilBg}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    gridBackgroundWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        // Remove vertical margins to prevent grid cutoff
        marginTop: 0,
        marginBottom: 0,
        position: 'relative',
    },
    gridOuterShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 24,
        elevation: 12,
        borderRadius: 0, // Remove border radius for sharp corners
        backgroundColor: 'transparent',
    },
    grid: {
        borderWidth: 3.5,
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: 0, // Remove border radius for sharp corners
        overflow: 'hidden',
        position: 'relative',
    },
    gridGradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
        opacity: 0.13,
        backgroundColor: 'linear-gradient(135deg, #e9e9f7 0%, #c7d2fe 100%)', // fallback for web, can be replaced with expo-linear-gradient for mobile
    },
    row: {
        flexDirection: 'row',
    },
    softBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        opacity: 0.18,
        backgroundColor: '#b3c6e7', // fallback
        // You can swap this for a gradient or image background for more polish
    },
});

export default SudokuGrid;