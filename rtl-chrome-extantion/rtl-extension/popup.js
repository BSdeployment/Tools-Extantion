document.getElementById("rtlButton").addEventListener("click", function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: setRTL
        });
    });
});

function setRTL() {
    document.querySelectorAll('*').forEach(function(el) {
        el.style.direction = 'rtl';
        el.style.textAlign = 'right';
    });
}
