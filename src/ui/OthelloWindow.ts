import {
  AlignmentFlag,
  FlexLayout,
  QGridLayout,
  QLabel,
  QMainWindow,
  QMessageBox,
  QPushButton,
  QWidget,
} from "@nodegui/nodegui";
import { BOARD_SIZE } from "../logic/board";
import { GameState, createInitialState, playMove } from "../logic/game";
import { GameResult, getValidMoves } from "../logic/rules";
import { Player, Position } from "../logic/types";

const CELL_SIZE_PX = 52;
const WINDOW_WIDTH_PX = 470;
const WINDOW_HEIGHT_PX = 600;

const STONE_MARK: Record<Player, string> = { black: "●", white: "○" };
const PLAYER_LABEL: Record<Player, string> = { black: "黒", white: "白" };
const RESULT_LABEL: Record<GameResult, string> = { black: "黒の勝ち", white: "白の勝ち", draw: "引き分け" };

const CELL_STYLE_BASE = `
  background-color: #2e7d32;
  border: 1px solid #1b5e20;
  color: white;
  font-size: 26px;
`;
const CELL_STYLE_HINT = `
  background-color: #388e3c;
  border: 1px solid #1b5e20;
  color: white;
  font-size: 26px;
`;

export class OthelloWindow {
  private readonly window = new QMainWindow();
  private readonly turnLabel = new QLabel();
  private readonly scoreLabel = new QLabel();
  private readonly cellButtons: QPushButton[][] = [];
  private state: GameState = createInitialState();

  constructor() {
    this.window.setWindowTitle("Othello");
    this.window.setFixedSize(WINDOW_WIDTH_PX, WINDOW_HEIGHT_PX);
    this.window.setCentralWidget(this.buildCentralWidget());
    this.render();
  }

  show(): void {
    this.window.show();
  }

  private buildCentralWidget(): QWidget {
    const central = new QWidget();
    central.setInlineStyle("flex: 1; flex-direction: column; align-items: center; padding: 12px;");
    const rootLayout = new FlexLayout();
    central.setLayout(rootLayout);

    rootLayout.addWidget(this.buildStatusBar());
    rootLayout.addWidget(this.buildBoardWidget());
    return central;
  }

  private buildStatusBar(): QWidget {
    const statusBar = new QWidget();
    statusBar.setInlineStyle(
      "flex-direction: row; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px;",
    );
    const statusLayout = new FlexLayout();
    statusBar.setLayout(statusLayout);

    this.turnLabel.setAlignment(AlignmentFlag.AlignVCenter);
    this.scoreLabel.setAlignment(AlignmentFlag.AlignVCenter);

    const resetButton = new QPushButton();
    resetButton.setText("リセット");
    resetButton.addEventListener("clicked", () => this.handleReset());

    statusLayout.addWidget(this.turnLabel);
    statusLayout.addWidget(this.scoreLabel);
    statusLayout.addWidget(resetButton);
    return statusBar;
  }

  private buildBoardWidget(): QWidget {
    const boardWidget = new QWidget();
    const gridLayout = new QGridLayout();
    gridLayout.setHorizontalSpacing(0);
    gridLayout.setVerticalSpacing(0);
    boardWidget.setLayout(gridLayout);

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      const buttonRow: QPushButton[] = [];
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const position: Position = { row, col };
        const button = new QPushButton();
        button.setFixedSize(CELL_SIZE_PX, CELL_SIZE_PX);
        button.addEventListener("clicked", () => this.handleCellClick(position));
        gridLayout.addWidget(button, row, col);
        buttonRow.push(button);
      }
      this.cellButtons.push(buttonRow);
    }

    return boardWidget;
  }

  private handleCellClick(position: Position): void {
    const outcome = playMove(this.state, position);
    if (outcome.type === "invalid") {
      return;
    }

    this.state = outcome.state;
    this.render();

    if (outcome.type === "passed") {
      this.showMessage(`${PLAYER_LABEL[outcome.skippedPlayer]}は打てる場所がないためパスしました`);
    } else if (outcome.type === "gameOver") {
      this.showMessage(`ゲーム終了：${RESULT_LABEL[outcome.winner]}`);
    }
  }

  private handleReset(): void {
    this.state = createInitialState();
    this.render();
  }

  private showMessage(text: string): void {
    const messageBox = new QMessageBox();
    messageBox.setText(text);
    const okButton = new QPushButton();
    okButton.setText("OK");
    messageBox.addButton(okButton);
    messageBox.exec();
  }

  private render(): void {
    this.turnLabel.setText(`手番: ${PLAYER_LABEL[this.state.currentPlayer]}`);
    this.scoreLabel.setText(
      `黒: ${this.state.board.countStones("black")} / 白: ${this.state.board.countStones("white")}`,
    );

    const validMoves = new Set(
      getValidMoves(this.state.board, this.state.currentPlayer).map((p) => `${p.row},${p.col}`),
    );

    this.state.board.forEachCell((position, cellState) => {
      const button = this.cellButtons[position.row]?.[position.col];
      if (!button) {
        return;
      }

      button.setText(cellState ? STONE_MARK[cellState] : "");
      const isPlayable = !this.state.isOver && validMoves.has(`${position.row},${position.col}`);
      button.setStyleSheet(isPlayable ? CELL_STYLE_HINT : CELL_STYLE_BASE);
      button.setEnabled(isPlayable);
    });
  }
}
