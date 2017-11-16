chrome.runtime.onInstalled.addListener(function(res) {
    chrome.tabs.create({
        url: chrome.extension.getURL('index.html')
    })
});