import { OthelloWindow } from "./ui/OthelloWindow";

const gameWindow = new OthelloWindow();
gameWindow.show();

// Node's GC can collect the window once no JS reference remains; keep it alive globally.
(global as unknown as { win: OthelloWindow }).win = gameWindow;
