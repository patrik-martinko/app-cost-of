if (location.host === 'costof.app') {
    const set = control => {
        let option = {};
        option[control.getAttribute('id')] = control.value;
        chrome.storage.sync.set(option);
    };
    const controls = document.getElementsByClassName('control');
    for (let control of controls) {
        set(control);
        control.addEventListener('input', event => {
            set(event.target);
        });
    }
} else {
    const formatCurrency = new Intl.NumberFormat(document.getElementsByTagName('html')[0].getAttribute('lang'), { style: 'currency', currency: 'EUR' });
    const get = options => {
        let price;
        const element = document.querySelector('#QA0Szd');
        const render = function () {
            document.querySelectorAll('div.ivN21e div').forEach(distanceElement => {
                let distance = distanceElement.textContent;
                if (distance.indexOf('(') === -1) {
                    const dividing = distance.indexOf(' m') !== -1 ? 1000 : 1;
                    distance = distance.replace(/[km\s]/g, '');
                    if (![distance.length - 2, distance.length - 3].includes(distance.indexOf('.'))) {
                        distance = distance.replace('.', '');
                    }
                    if ([distance.length - 2, distance.length - 3].includes(distance.indexOf(','))) {
                        distance = distance.replace(',', '.');
                    }
                    distance = distance.replace(',', '');
                    if (options.type === 'electricity') {
                        distanceElement.textContent += ' (' + formatCurrency.format((distance / dividing * options.consumptionElectric * options.priceElectric).toFixed(2)) + ')';
                        distanceElement.setAttribute('title', formatCurrency.format(options.priceElectric) + '/kWh');
                    } else {
                        distanceElement.textContent += ' (' + formatCurrency.format((distance / dividing / 100 * options.consumption * price).toFixed(2)) + ')';
                        distanceElement.setAttribute('title', formatCurrency.format(price) + '/' + (options.type === 'cng' ? 'kg' : 'l'));
                    }
                }
            });
        }
        const handle = () => {
            if (options.type !== 'electricity' && price === undefined) {
                fetch('https://script.google.com/macros/s/AKfycby5CcRVznevNoWZeexy0m1DSeOX4Kg1FeMgxFdXlr4sySwgehnIr4T23Q5ooWDtR1iB/exec').then(response => {
                    response.json().then(data => {
                        for (let key in data) {
                            if (data[key][0] == options.country) {
                                price = data[key][{
                                    'gasoline-95': 2,
                                    'diesel': 3,
                                    'lpg': 4
                                }[options.type]];
                            }
                        }
                        render();
                    });
                });
            } else {
                render();
            }
        };
        const observer = new MutationObserver(handle);
        observer.observe(element, { childList: true, subtree: true });
        handle();
    };
    if (typeof browser !== 'undefined') {
        browser.storage.local.get(options, get);
    } else {
        chrome.storage.sync.get(options, get);
    }
}