import { describe, expect, it } from "vitest";
import { BOARD_SIZE, Board } from "../src/logic/board";

describe("Board.createInitial", () => {
  it("places the standard four-stone opening in the center", () => {
    const board = Board.createInitial();
    expect(board.getCell({ row: 3, col: 3 })).toBe("white");
    expect(board.getCell({ row: 3, col: 4 })).toBe("black");
    expect(board.getCell({ row: 4, col: 3 })).toBe("black");
    expect(board.getCell({ row: 4, col: 4 })).toBe("white");
    expect(board.countStones("black")).toBe(2);
    expect(board.countStones("white")).toBe(2);
  });

  it("leaves every other cell empty", () => {
    const board = Board.createInitial();
    expect(board.getCell({ row: 0, col: 0 })).toBeNull();
  });
});

describe("Board bounds and mutation", () => {
  it("treats out-of-bounds positions as null and ignores writes to them", () => {
    const board = new Board();
    expect(board.isInBounds({ row: -1, col: 0 })).toBe(false);
    expect(board.isInBounds({ row: BOARD_SIZE, col: 0 })).toBe(false);
    expect(board.getCell({ row: -1, col: 0 })).toBeNull();

    board.setCell({ row: -1, col: 0 }, "black");
    expect(board.getCell({ row: 0, col: 0 })).toBeNull();
  });

  it("clone is independent of the original", () => {
    const board = Board.createInitial();
    const clone = board.clone();
    clone.setCell({ row: 0, col: 0 }, "black");
    expect(board.getCell({ row: 0, col: 0 })).toBeNull();
    expect(clone.getCell({ row: 0, col: 0 })).toBe("black");
  });

  it("isFull is false until every cell is occupied", () => {
    const board = new Board();
    expect(board.isFull()).toBe(false);
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        board.setCell({ row, col }, "black");
      }
    }
    expect(board.isFull()).toBe(true);
  });
});
