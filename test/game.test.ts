import { describe, expect, it } from "vitest";
import { BOARD_SIZE, Board } from "../src/logic/board";
import { GameState, createInitialState, getClickRepeatCount, playMove } from "../src/logic/game";

describe("createInitialState", () => {
  it("starts with black to move on the standard opening", () => {
    const state = createInitialState();
    expect(state.currentPlayer).toBe("black");
    expect(state.isOver).toBe(false);
  });
});

describe("playMove", () => {
  it("rejects a move that isn't legal and leaves the state untouched", () => {
    const state = createInitialState();
    const outcome = playMove(state, { row: 0, col: 0 });
    expect(outcome.type).toBe("invalid");
  });

  it("flips stones and hands the turn to the opponent", () => {
    const state = createInitialState();
    const outcome = playMove(state, { row: 2, col: 3 });
    if (outcome.type !== "moved") {
      throw new Error(`expected "moved", got "${outcome.type}"`);
    }
    expect(outcome.state.currentPlayer).toBe("white");
    expect(outcome.state.board.countStones("black")).toBe(4);
    expect(outcome.flippedCount).toBe(1);
  });

  it("passes back to the mover when the opponent has no legal move", () => {
    const board = new Board();
    board.setCell({ row: 3, col: 0 }, "black");
    board.setCell({ row: 3, col: 1 }, "white");
    board.setCell({ row: 3, col: 2 }, "white");
    board.setCell({ row: 5, col: 0 }, "black");
    board.setCell({ row: 5, col: 1 }, "white");
    const state: GameState = { board, currentPlayer: "black", isOver: false };

    const outcome = playMove(state, { row: 3, col: 3 });
    if (outcome.type !== "passed") {
      throw new Error(`expected "passed", got "${outcome.type}"`);
    }
    expect(outcome.skippedPlayer).toBe("white");
    expect(outcome.state.currentPlayer).toBe("black");
    expect(outcome.flippedCount).toBe(2);
  });

  it("ends the game and declares a winner once the board fills up", () => {
    const board = new Board();
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        board.setCell({ row, col }, "black");
      }
    }
    board.setCell({ row: 0, col: 0 }, null);
    board.setCell({ row: 0, col: 1 }, "white");
    const state: GameState = { board, currentPlayer: "black", isOver: false };

    const outcome = playMove(state, { row: 0, col: 0 });
    if (outcome.type !== "gameOver") {
      throw new Error(`expected "gameOver", got "${outcome.type}"`);
    }
    expect(outcome.winner).toBe("black");
    expect(outcome.state.isOver).toBe(true);
    expect(outcome.flippedCount).toBe(1);
  });
});

describe("getClickRepeatCount", () => {
  it("is zero for an invalid move", () => {
    const outcome = playMove(createInitialState(), { row: 0, col: 0 });
    expect(getClickRepeatCount(outcome)).toBe(0);
  });

  it("is one plus the number of flipped stones for a legal move", () => {
    const outcome = playMove(createInitialState(), { row: 2, col: 3 });
    expect(getClickRepeatCount(outcome)).toBe(2);
  });
});
