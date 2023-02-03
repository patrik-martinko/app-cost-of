const afterInstall = async ({ reason }) => {
    if (reason === 'install') {
        const tab = (await chrome.tabs.create({
            url: 'https://costof.app',
            active: true,
        }));
    }
};
if (typeof browser !== 'undefined') {
    browser.runtime.onInstalled.addListener(afterInstall);
} else {
    chrome.runtime.onInstalled.addListener(afterInstall);
}