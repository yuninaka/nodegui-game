import { OthelloWindow } from "./ui/OthelloWindow";

declare global {
  // NodeGui's native widgets hold only a weak reference to their JS wrapper, so
  // the top-level entry point must keep a strong one alive for the process lifetime.
  var win: OthelloWindow | undefined;
}

const gameWindow = new OthelloWindow();
gameWindow.show();
globalThis.win = gameWindow;
