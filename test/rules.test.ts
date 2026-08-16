import { describe, expect, it } from "vitest";
import { Board } from "../src/logic/board";
import { applyMove, getOpponent, getValidMoves, getWinner, isValidMove } from "../src/logic/rules";

describe("getOpponent", () => {
  it("flips between black and white", () => {
    expect(getOpponent("black")).toBe("white");
    expect(getOpponent("white")).toBe("black");
  });
});

describe("getValidMoves on the standard opening", () => {
  it("gives black exactly the four textbook opening moves", () => {
    const board = Board.createInitial();
    const moves = getValidMoves(board, "black").map((move) => `${String(move.row)},${String(move.col)}`);
    expect(moves).toHaveLength(4);
    expect(moves).toEqual(expect.arrayContaining(["2,3", "3,2", "4,5", "5,4"]));
  });
});

describe("isValidMove", () => {
  it("rejects an already-occupied cell", () => {
    const board = Board.createInitial();
    expect(isValidMove(board, "black", { row: 3, col: 3 })).toBe(false);
  });

  it("rejects an empty cell that flips nothing", () => {
    const board = Board.createInitial();
    expect(isValidMove(board, "black", { row: 0, col: 0 })).toBe(false);
  });
});

describe("applyMove", () => {
  it("flips every bracketed opponent stone and does not mutate the input board", () => {
    const before = Board.createInitial();
    const after = applyMove(before, "black", { row: 2, col: 3 });

    expect(before.getCell({ row: 2, col: 3 })).toBeNull();
    expect(after.getCell({ row: 2, col: 3 })).toBe("black");
    expect(after.getCell({ row: 3, col: 3 })).toBe("black");
    expect(after.countStones("black")).toBe(4);
    expect(after.countStones("white")).toBe(1);
  });
});

describe("getWinner", () => {
  it("picks the player with more stones, or a draw on a tie", () => {
    const tied = Board.createInitial();
    expect(getWinner(tied)).toBe("draw");

    const blackAhead = applyMove(tied, "black", { row: 2, col: 3 });
    expect(getWinner(blackAhead)).toBe("black");
  });
});
