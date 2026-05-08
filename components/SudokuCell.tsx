import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
// No gradient import; using flat, empowering color palette
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
    fontFamily?: string;
    gridBackgroundImage?: any;
};

type SudokuCellProps = {
    rowIndex: number;
    colIndex: number;
    cell: number;
    isSelected: boolean;
    isInitial: boolean;
    cellNotes: number[];
    highlightStyle: any;
    isLastMove: boolean;
    isError: boolean;
    cellSize: number;
    onCellPress: (row: number, col: number) => void;
    onCellLongPress?: (row: number, col: number) => void;
    theme: Theme;
    cellFontSize: number;
    notesGrid: (string | number)[][];
    focusedCell: React.MutableRefObject<{ row: number; col: number } | null>;
    pencilColor: string;
    pencilBg?: string;
};

const SudokuCell: React.FC<SudokuCellProps> = ({
    rowIndex, colIndex, cell, isSelected, isInitial, cellNotes, highlightStyle, isLastMove, isError, cellSize, onCellPress, onCellLongPress, theme, cellFontSize, notesGrid, focusedCell, pencilColor, pencilBg
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const errorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isSelected) {
            Animated.spring(scaleAnim, {
                toValue: 1.12,
                useNativeDriver: true,
                friction: 5,
            }).start();
        } else {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 5,
            }).start();
        }
    }, [isSelected]);

    useEffect(() => {
        if (cell !== 0) {
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [cell]);

    useEffect(() => {
        if (isError) {
            errorAnim.setValue(0);
            Animated.sequence([
                Animated.timing(errorAnim, {
                    toValue: 1,
                    duration: 80,
                    useNativeDriver: false,
                }),
                Animated.timing(errorAnim, {
                    toValue: 0,
                    duration: 320,
                    useNativeDriver: false,
                })
            ]).start();
        }
    }, [isError]);

    // Get highlight background color if present
    let highlightBg = theme.error;
    if (highlightStyle && typeof highlightStyle === 'object' && 'backgroundColor' in highlightStyle) {
        // @ts-ignore
        highlightBg = highlightStyle.backgroundColor || theme.error;
    }
    // Visually attractive, psychology-driven cell background and animation
    // Empowering, psychologically harmonious color palette (from color psychology)
    // Light: bg #f6f5f3 (calm beige), border #b5c9d6 (soft blue-gray), selected #4a90e2 (trust blue), last #ffe066 (optimism gold), notes #43bfa7 (growth teal), error #e94f37 (red for error), number #22223b (clarity)
    // Dark:  bg #1a2233 (deep navy), border #3a4a5d, selected #4a90e2, last #ffe066, notes #43bfa7, error #e94f37, number #f4f4f4
    const isDark = (theme.background && (theme.background.toLowerCase().includes('1a2233') || theme.background.toLowerCase().includes('232946') || theme.background.toLowerCase().includes('1a1a1a') || theme.background.toLowerCase().includes('222')));
    const palette = {
        light: {
            background: '#f7f7fa', // ultra-light gray
            border: '#bfc7d5',     // soft blue-gray
            selected: '#2979ff',   // bold blue for selection
            lastMove: '#ffe066',   // optimism gold
            notes: '#43bfa7',      // growth teal
            error: '#e94f37',      // empowering red
            number: '#22223b',     // rich navy for numbers
            initial: '#0d1b2a',    // almost black navy for initial/given
        },
        dark: {
            background: '#181c1f', // deep dark
            border: '#3a4a5d',     // blue-gray
            selected: '#2979ff',   // bold blue
            lastMove: '#ffe066',
            notes: '#43bfa7',
            error: '#e94f37',
            number: '#ffe066',      // soft gold for numbers
            initial: '#fffbe6',     // off-white gold for initial/given
        }
    };
    const p = isDark ? palette.dark : palette.light;
    // Flat, non-animated, empowering style
    const animatedCellStyle = {
        backgroundColor: isError
            ? p.error
            : isSelected
            ? p.selected // bold blue for selection
            : isInitial
            ? p.background
            : p.background,
        // No borderRadius for sharp corners
        borderWidth: isSelected ? 2.5 : 1,
        // Always blue border for selection, never yellow
        borderColor: isSelected ? p.selected : p.border,
        // Subtle shadow for selected cell only
        shadowColor: isSelected ? p.selected : 'transparent',
        shadowOpacity: isSelected ? 0.18 : 0,
        shadowRadius: isSelected ? 8 : 0,
        shadowOffset: { width: 0, height: 2 },
        elevation: isSelected ? 4 : 0,
    };

    // Accessibility label
    const cellLabel = `Row ${rowIndex + 1}, Column ${colIndex + 1}, ${cell !== 0 ? `Value ${cell}` : 'Empty'}${isInitial ? ', Given' : ''}`;

    // Focus ring style (static, not animated)
    // Soft focus ring for accessibility
    const focusRingStyle = isSelected
        ? {
              borderWidth: 2.5,
              borderColor: p.selected,
              shadowColor: p.selected,
              shadowOpacity: 0.18,
              shadowRadius: 10,
              elevation: 6,
          }
        : {};

    // Modern, beautiful 3x3 block and cell border logic
    const borderStyles: any = {
        borderWidth: 1,
        borderColor: p.border,
        borderRightWidth: colIndex === 8 ? 2.5 : ((colIndex + 1) % 3 === 0 ? 3.5 : 1),
        borderBottomWidth: rowIndex === 8 ? 2.5 : ((rowIndex + 1) % 3 === 0 ? 3.5 : 1),
        borderLeftWidth: colIndex === 0 ? 2.5 : undefined,
        borderTopWidth: rowIndex === 0 ? 2.5 : undefined,
        // No border radius for sharp corners
        overflow: 'hidden',
    };

    // NOTE: To ensure the whole grid is square with sharp corners, set borderRadius: 0 on your grid container (in SudokuGrid or parent component)
    return (
        <View
            style={[
                { width: cellSize, height: cellSize, zIndex: isSelected ? 2 : 1 },
                animatedCellStyle,
                // Only use yellow border for last move, never for selection
                !isSelected && isLastMove && { borderWidth: 3, borderColor: p.lastMove },
            ]}
        >
            <TouchableOpacity
                style={[
                    borderStyles,
                    focusRingStyle,
                    highlightStyle,
                    isError && { backgroundColor: p.error },
                    // Only use yellow border for last move if not selected
                    !isSelected && isLastMove && { borderWidth: 3, borderColor: p.lastMove },
                    { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: cellSize, minWidth: cellSize, backgroundColor: 'transparent' },
                ]}
                onPress={() => {
                    // Quick scale feedback
                    Animated.sequence([
                        Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, friction: 5 }),
                        Animated.spring(scaleAnim, { toValue: isSelected ? 1.12 : 1, useNativeDriver: true, friction: 5 })
                    ]).start();
                    onCellPress(rowIndex, colIndex);
                }}
                onLongPress={onCellLongPress ? () => onCellLongPress(rowIndex, colIndex) : undefined}
                delayLongPress={300}
                disabled={isInitial}
                activeOpacity={0.8}
                accessible={true}
                accessibilityLabel={cellLabel}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isInitial }}
                onFocus={() => { focusedCell.current = { row: rowIndex, col: colIndex }; }}
                onBlur={() => { if (focusedCell.current?.row === rowIndex && focusedCell.current?.col === colIndex) focusedCell.current = null; }}
            >
                {cell !== 0 ? (
                    <Text
                        style={[
                            {
                                fontWeight: isInitial ? '900' : '800',
                                textAlign: 'center',
                                letterSpacing: 0.5,
                                color: isInitial ? p.initial : p.number,
                                fontFamily: theme.fontFamily || 'System',
                                fontSize: cellFontSize || cellSize * 0.6,
                                textShadowColor: isSelected ? p.selected : (isDark ? '#00000099' : '#b0b8d1'),
                                textShadowOffset: { width: 0, height: 2 },
                                textShadowRadius: isSelected ? 8 : 2,
                                margin: 0,
                                padding: 0,
                            },
                        ]}
                        allowFontScaling={true}
                    >
                        {cell}
                    </Text>
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                        <View style={{
                            flex: 1,
                            width: '94%',
                            height: '94%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 6,
                            backgroundColor: pencilBg || '#eaf1fb', // fallback soft blue
                            borderWidth: 0.5,
                            borderColor: pencilColor + '33', // subtle border
                        }}>
                            {notesGrid.map((noteRow, r) => (
                                <View key={r} style={{ flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                                    {noteRow.map((note, c) => {
                                        // Highlight pencil conflicts: dim or cross out if not possible
                                        let isConflict = false;
                                        if (note) {
                                            // Check if this note is possible in this cell
                                            const num = Number(note);
                                            // Check row, col, block for conflicts
                                            let used = false;
                                            for (let i = 0; i < 9; i++) {
                                                if (cell === 0 && (i !== colIndex && cellNotes.includes(num))) continue;
                                                if (i !== colIndex && cell !== 0 && cell === num) used = true;
                                                if (i !== rowIndex && cell !== 0 && cell === num) used = true;
                                            }
                                            // Check block
                                            const startRow = Math.floor(rowIndex / 3) * 3;
                                            const startCol = Math.floor(colIndex / 3) * 3;
                                            for (let r2 = startRow; r2 < startRow + 3; r2++) {
                                                for (let c2 = startCol; c2 < startCol + 3; c2++) {
                                                    if ((r2 !== rowIndex || c2 !== colIndex) && cell !== 0 && cell === num) used = true;
                                                }
                                            }
                                            isConflict = used;
                                        }
                                        return (
                                            <Text
                                                key={c}
                                                style={{
                                                    textAlign: 'center',
                                                    fontWeight: isConflict ? '400' : '400',
                                                    fontStyle: isConflict ? 'italic' : 'italic',
                                                    textDecorationLine: isConflict ? 'line-through' : 'none',
                                                    margin: 0,
                                                    padding: 0,
                                                    width: cellSize / 3.1,
                                                    height: cellSize / 3.1,
                                                    lineHeight: cellSize / 3.1,
                                                    color: isConflict ? '#b0b8d1' : pencilColor,
                                                    fontFamily: theme.fontFamily || 'System',
                                                    fontSize: cellSize * 0.19,
                                                    opacity: note ? (isConflict ? 0.45 : 0.95) : 0.22,
                                                    letterSpacing: 0.1,
                                                    backgroundColor: 'transparent',
                                                }}
                                                allowFontScaling={true}
                                            >
                                                {note}
                                            </Text>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
        
    );
};

export default SudokuCell;
