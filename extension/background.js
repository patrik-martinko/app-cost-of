if (typeof browser !== 'undefined') {
    browser.runtime.onInstalled.addListener(function (details) {
        if (details.reason === 'install') {
            browser.runtime.openOptionsPage();
        }
    });
} else {
    chrome.runtime.onInstalled.addListener(function (details) {
        if (details.reason === 'install') {
            chrome.runtime.openOptionsPage();
        }
    });
}