// sudokuLogic.ts

type DifficultyLevel = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG = {
    easy: { minClues: 85, maxClues: 50, symmetry: 0.7, maxAttempts: 3 },
    medium: { minClues: 27, maxClues: 35, symmetry: 0.5, maxAttempts: 100 },
    hard: { minClues: 17, maxClues: 26, symmetry: 0.3, maxAttempts: 150 }
};

export const generatePuzzle = (
    difficulty: DifficultyLevel
): { puzzle: number[][]; solution: number[][] } => {
    const solution = generateValidSolution();
    const puzzle = createPuzzleFromSolution(solution, DIFFICULTY_CONFIG[difficulty]);
    return { puzzle, solution };
};

const generateValidSolution = (): number[][] => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffledBase = shuffleArray([...base]);

    return Array.from({ length: 9 }, (_, i) => {
        const rotation = (i % 3) * 3 + Math.floor(i / 3);
        return rotateArray(shuffledBase, rotation);
    });
};

const createPuzzleFromSolution = (
    solution: number[][],
    config: typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]
): number[][] => {
    const puzzle = solution.map(row => [...row]);
    const targetClues = Math.floor(Math.random() * (config.maxClues - config.minClues + 1)) + config.minClues;
    let removedCells = 0;
    let attempts = 0;

    while (removedCells < 81 - targetClues && attempts < config.maxAttempts) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);

        if (puzzle[row][col] === 0) continue;

        const originalValue = puzzle[row][col];
        puzzle[row][col] = 0;

        if (hasUniqueSolution(puzzle.map(row => [...row]))) {
            removedCells++;
            if (Math.random() < config.symmetry) {
                const mirrorRow = 8 - row;
                const mirrorCol = 8 - col;
                if (puzzle[mirrorRow][mirrorCol] !== 0) {
                    puzzle[mirrorRow][mirrorCol] = 0;
                    removedCells++;
                }
            }
        } else {
            puzzle[row][col] = originalValue;
            attempts++;
        }
    }

    return puzzle;
};

export const isValidMove = (
    puzzle: number[][],
    row: number,
    col: number,
    value: number
): boolean => {
    // Row check
    for (let i = 0; i < 9; i++) {
        if (puzzle[row][i] === value) return false;
    }

    // Column check
    for (let i = 0; i < 9; i++) {
        if (puzzle[i][col] === value) return false;
    }

    // Subgrid check
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = startRow; i < startRow + 3; i++) {
        for (let j = startCol; j < startCol + 3; j++) {
            if (puzzle[i][j] === value) return false;
        }
    }

    return true;
};

const hasUniqueSolution = (puzzle: number[][]): boolean => {
    let solutionCount = 0;
    const solve = (board: number[][], index = 0): boolean => {
        if (solutionCount > 1) return false;
        if (index === 81) return solutionCount++ === 0;

        const row = Math.floor(index / 9);
        const col = index % 9;

        if (board[row][col] !== 0) return solve(board, index + 1);

        for (let num = 1; num <= 9; num++) {
            if (isValidMove(board, row, col, num)) {
                board[row][col] = num;
                solve(board, index + 1);
                board[row][col] = 0;
            }
        }
        return false;
    };

    solve(puzzle.map(row => [...row]));
    return solutionCount === 1;
};

// Utilities
const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const rotateArray = <T>(array: T[], n: number): T[] => {
    const rotationIndex = n % array.length;
    return [...array.slice(rotationIndex), ...array.slice(0, rotationIndex)];
};

export default {generatePuzzle, isValidMove}