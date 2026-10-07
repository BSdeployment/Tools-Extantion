// This file does exactly one thing: when the toolbar icon is clicked,
// it injects content.js into the active tab. It never makes network
// requests and never reads or stores any data itself.

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !/^https?:/.test(tab.url)) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (err) {
    console.error("Save Page As Single File: could not inject script:", err);
  }
});
