import { QMainWindow, QLabel, QWidget, FlexLayout } from "@nodegui/nodegui";

const WINDOW_WIDTH_PX = 640;
const WINDOW_HEIGHT_PX = 480;

const window = new QMainWindow();
window.setWindowTitle("NodeGui Game Prototype");
window.setFixedSize(WINDOW_WIDTH_PX, WINDOW_HEIGHT_PX);

const centralWidget = new QWidget();
centralWidget.setObjectName("centralWidget");

const rootLayout = new FlexLayout();
centralWidget.setLayout(rootLayout);

const label = new QLabel();
label.setText("NodeGui + TypeScript プロトタイプ環境");
rootLayout.addWidget(label);

window.setCentralWidget(centralWidget);
window.show();

// Node's GC can collect the window once no JS reference remains; keep it alive globally.
(global as unknown as { win: QMainWindow }).win = window;
