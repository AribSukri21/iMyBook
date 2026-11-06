
const { app, BrowserWindow } = require("electron");
const path = require("path");

// Function to create the application window
function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    // Load the first page
    win.loadFile("index.html");

    // Hide the default menu
    win.setMenuBarVisibility(false);
}

// Start Electron when it is ready
app.whenReady().then(() => {
    createWindow();

    // Recreate window on macOS when needed
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Close application on Windows and Linux
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});