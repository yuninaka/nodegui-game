export type Player = "black" | "white";

export type CellState = Player | null;

export interface Position {
  row: number;
  col: number;
}
