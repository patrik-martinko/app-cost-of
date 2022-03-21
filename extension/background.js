if (typeof browser !== 'undefined') {
    browser.runtime.onInstalled.addListener(function () {
        browser.runtime.openOptionsPage();
    });
} else {
    chrome.runtime.onInstalled.addListener(function () {
        chrome.runtime.openOptionsPage();
    });
}