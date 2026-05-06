const WHITEBOARD_PATH = 'whiteboard.html';

async function openWhiteboard(): Promise<void> {
  const url = chrome.runtime.getURL(WHITEBOARD_PATH);
  await chrome.tabs.create({ url, active: true });
}

chrome.action.onClicked.addListener(() => {
  void openWhiteboard();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-whiteboard') {
    void openWhiteboard();
  }
});
