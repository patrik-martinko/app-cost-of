if (location.host === 'costof.app') {
} else {
    var options = {
        type: 'electric',
        priceElectric: 0.1,
        consumptionElectric: 0.2,
        consumption: 7
    };
    var get = function (options) {
        var price;
        var element = document.querySelector('#pane');
        var render = function () {
            document.querySelectorAll('div.xB1mrd-T3iPGc-trip div, div.xB1mrd-T3iPGc-trip-tUvA6e div, div.xB1mrd-T3iPGc-iSfDt-tUvA6e div').forEach(function (distanceElement) {
                var distance = distanceElement.textContent;
                if (distance.indexOf('(') === -1) {
                    var dividing = distance.indexOf(' m') !== -1 ? 1000 : 1;
                    distance = distance.replace(/[km\s]/g, '');
                    if ([distance.length - 2, distance.length - 3].includes(distance.indexOf(','))) {
                        distance = distance.replace(',', '.');
                    }
                    distance = distance.replace(',', '');
                    if (options.type === 'electric') {
                        distanceElement.textContent += ' (' + (distance / dividing * options.consumptionElectric * options.priceElectric).toFixed(2) + ' €)';
                        distanceElement.setAttribute('title', options.priceElectric + ' €/kWh');
                    } else {
                        distanceElement.textContent += ' (' + (distance / dividing / 100 * options.consumption * price).toFixed(2) + ' €)';
                        distanceElement.setAttribute('title', price + ' €/' + (options.type === 'cng' ? 'kg' : 'l'));
                    }
                }
            });
        }
        var handle = function () {
            if (options.type !== 'electric' && price === undefined) {
                var request = new XMLHttpRequest();
                request.onreadystatechange = function () {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        var values = JSON.parse(request.responseText)['value'].slice(3000);
                        price = values[values.findIndex((element) => element === null) - {
                            'gasoline-95': 5,
                            'gasoline-98': 4,
                            'lpg': 3,
                            'diesel': 2,
                            'cng': 1
                        }[options.type]];
                        render();
                    }
                }
                request.open('GET', 'https://data.statistics.sk/api/v2/dataset/sp0207ts/all/all?lang=en&type=json');
                request.send();
            } else {
                render();
            }
        };
        var observer = new MutationObserver(handle);
        observer.observe(element, { childList: true, subtree: true });
        handle();
    };
    if (typeof browser !== 'undefined') {
        browser.storage.local.get(options, get);
    } else {
        chrome.storage.sync.get(options, get);
    }
}