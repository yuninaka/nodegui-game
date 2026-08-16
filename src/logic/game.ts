import { Board } from "./board";
import { GameResult, applyMove, getFlippableStones, getOpponent, getWinner, hasValidMove, isValidMove } from "./rules";
import { Player, Position } from "./types";

export interface GameState {
  board: Board;
  currentPlayer: Player;
  isOver: boolean;
}

export const createInitialState = (): GameState => ({
  board: Board.createInitial(),
  currentPlayer: "black",
  isOver: false,
});

export type MoveOutcome =
  | { type: "invalid" }
  | { type: "moved"; state: GameState; flippedCount: number }
  | { type: "passed"; state: GameState; skippedPlayer: Player; flippedCount: number }
  | { type: "gameOver"; state: GameState; winner: GameResult; flippedCount: number };

const resolveNextTurn = (board: Board, mover: Player, flippedCount: number): MoveOutcome => {
  const nextPlayer = getOpponent(mover);

  if (hasValidMove(board, nextPlayer)) {
    return { type: "moved", state: { board, currentPlayer: nextPlayer, isOver: false }, flippedCount };
  }

  if (hasValidMove(board, mover)) {
    return {
      type: "passed",
      state: { board, currentPlayer: mover, isOver: false },
      skippedPlayer: nextPlayer,
      flippedCount,
    };
  }

  const finalState: GameState = { board, currentPlayer: nextPlayer, isOver: true };
  return { type: "gameOver", state: finalState, winner: getWinner(board), flippedCount };
};

export const playMove = (state: GameState, position: Position): MoveOutcome => {
  if (state.isOver || !isValidMove(state.board, state.currentPlayer, position)) {
    return { type: "invalid" };
  }

  const flippedCount = getFlippableStones(state.board, state.currentPlayer, position).length;
  const board = applyMove(state.board, state.currentPlayer, position);
  return resolveNextTurn(board, state.currentPlayer, flippedCount);
};

// One click for the placed stone, plus one per stone it flipped -- mirrors the sound a real
// board makes as each disc is placed and turned over.
export const getClickRepeatCount = (outcome: MoveOutcome): number => (outcome.type === "invalid" ? 0 : 1 + outcome.flippedCount);
