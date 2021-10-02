(function () {
    var options = {
        type: 'electric',
        priceElectric: 0.1,
        consumptionElectric: 0.2,
        consumption: 7
    };
    var getElementByKey = function (key) {
        return document.getElementById(key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
    }
    var setType = function () {
        if (document.getElementById('type').value === 'electric') {
            document.getElementById('control-price-electric').setAttribute('style', '');
            document.getElementById('control-consumption-electric').setAttribute('style', '');
            document.getElementById('control-consumption').setAttribute('style', 'display: none;');
        } else {
            document.getElementById('control-consumption').setAttribute('style', '');
            document.getElementById('control-price-electric').setAttribute('style', 'display: none;');
            document.getElementById('control-consumption-electric').setAttribute('style', 'display: none;');
            document.getElementById('control-consumption-unit').textContent = document.getElementById('type').value === 'cng' ? 'kg/100km' : 'l/100km';
        }
    }
    document.getElementById('type').onchange = function () {
        setType();
    };
    document.getElementById('save').onclick = function (event) {
        for (const key in options) {
            options[key] = getElementByKey(key).value;
        }
        var set = function () {
            var message = document.createElement('div');
            message.setAttribute('class', 'alert alert-success mt-3 text-center');
            message.textContent = 'Options saved.';
            event.target.parentNode.appendChild(message);
            setTimeout(function () {
                message.remove();
            }, 2000);
        }
        if (typeof browser !== 'undefined') {
            browser.storage.local.set(options, set);
        } else {
            chrome.storage.sync.set(options, set);
        }
        return false;
    };
    var get = function (sync) {
        for (var key in options) {
            getElementByKey(key).value = sync[key];
        }
        setType();
    };
    if (typeof browser !== 'undefined') {
        browser.storage.local.get(options, get);
    } else {
        chrome.storage.sync.get(options, get);
    }
})();