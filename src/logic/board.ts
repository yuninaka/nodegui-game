import { CellState, Player, Position } from "./types";

export const BOARD_SIZE = 8;

const createEmptyGrid = (): CellState[][] => Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, (): CellState => null));

export class Board {
  private readonly grid: CellState[][];

  constructor(grid: CellState[][] = createEmptyGrid()) {
    this.grid = grid;
  }

  static createInitial(): Board {
    const board = new Board();
    const mid = BOARD_SIZE / 2;
    board.setCell({ row: mid - 1, col: mid - 1 }, "white");
    board.setCell({ row: mid - 1, col: mid }, "black");
    board.setCell({ row: mid, col: mid - 1 }, "black");
    board.setCell({ row: mid, col: mid }, "white");
    return board;
  }

  isInBounds(position: Position): boolean {
    return position.row >= 0 && position.row < BOARD_SIZE && position.col >= 0 && position.col < BOARD_SIZE;
  }

  getCell(position: Position): CellState {
    return this.isInBounds(position) ? (this.grid[position.row]?.[position.col] ?? null) : null;
  }

  setCell(position: Position, state: CellState): void {
    const row = this.grid[position.row];
    if (row) {
      row[position.col] = state;
    }
  }

  clone(): Board {
    return new Board(this.grid.map((row) => [...row]));
  }

  forEachCell(callback: (position: Position, state: CellState) => void): void {
    this.grid.forEach((row, rowIndex) => row.forEach((state, colIndex) => callback({ row: rowIndex, col: colIndex }, state)));
  }

  countStones(player: Player): number {
    return this.grid.flat().filter((cell) => cell === player).length;
  }

  isFull(): boolean {
    return this.grid.flat().every((cell) => cell !== null);
  }
}
