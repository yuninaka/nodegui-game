import { Board } from "./board";
import { Player, Position } from "./types";

const DIRECTIONS: readonly Position[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

export type GameResult = Player | "draw";

export const getOpponent = (player: Player): Player => (player === "black" ? "white" : "black");

const getFlippableInDirection = (board: Board, player: Player, origin: Position, direction: Position): Position[] => {
  const opponent = getOpponent(player);
  const flippable: Position[] = [];
  let current: Position = { row: origin.row + direction.row, col: origin.col + direction.col };

  while (board.isInBounds(current) && board.getCell(current) === opponent) {
    flippable.push(current);
    current = { row: current.row + direction.row, col: current.col + direction.col };
  }

  const endsOnOwnStone = board.isInBounds(current) && board.getCell(current) === player;
  return endsOnOwnStone ? flippable : [];
};

export const getFlippableStones = (board: Board, player: Player, position: Position): Position[] =>
  DIRECTIONS.flatMap((direction) => getFlippableInDirection(board, player, position, direction));

export const isValidMove = (board: Board, player: Player, position: Position): boolean =>
  board.getCell(position) === null && getFlippableStones(board, player, position).length > 0;

export const getValidMoves = (board: Board, player: Player): Position[] => {
  const moves: Position[] = [];
  board.forEachCell((position, state) => {
    if (state === null && isValidMove(board, player, position)) {
      moves.push(position);
    }
  });
  return moves;
};

export const applyMove = (board: Board, player: Player, position: Position): Board => {
  const flippable = getFlippableStones(board, player, position);
  const next = board.clone();
  next.setCell(position, player);
  flippable.forEach((cell) => {
    next.setCell(cell, player);
  });
  return next;
};

export const hasValidMove = (board: Board, player: Player): boolean => getValidMoves(board, player).length > 0;

export const getWinner = (board: Board): GameResult => {
  const blackCount = board.countStones("black");
  const whiteCount = board.countStones("white");
  if (blackCount === whiteCount) {
    return "draw";
  }
  return blackCount > whiteCount ? "black" : "white";
};
