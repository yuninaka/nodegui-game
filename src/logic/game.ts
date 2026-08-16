import { Board } from "./board";
import { GameResult, applyMove, getOpponent, getWinner, hasValidMove, isValidMove } from "./rules";
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
  | { type: "moved"; state: GameState }
  | { type: "passed"; state: GameState; skippedPlayer: Player }
  | { type: "gameOver"; state: GameState; winner: GameResult };

const resolveNextTurn = (board: Board, mover: Player): MoveOutcome => {
  const nextPlayer = getOpponent(mover);

  if (hasValidMove(board, nextPlayer)) {
    return { type: "moved", state: { board, currentPlayer: nextPlayer, isOver: false } };
  }

  if (hasValidMove(board, mover)) {
    return {
      type: "passed",
      state: { board, currentPlayer: mover, isOver: false },
      skippedPlayer: nextPlayer,
    };
  }

  const finalState: GameState = { board, currentPlayer: nextPlayer, isOver: true };
  return { type: "gameOver", state: finalState, winner: getWinner(board) };
};

export const playMove = (state: GameState, position: Position): MoveOutcome => {
  if (state.isOver || !isValidMove(state.board, state.currentPlayer, position)) {
    return { type: "invalid" };
  }

  const board = applyMove(state.board, state.currentPlayer, position);
  return resolveNextTurn(board, state.currentPlayer);
};
