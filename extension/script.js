if (location.host === 'costof.app') {
    document.documentElement.setAttribute('app-cost-of', 'true');
    const set = control => {
        let option = {};
        option[control.getAttribute('id')] = control.value;
        chrome.storage.sync.set(option);
    };
    const controls = document.getElementsByClassName('control');
    for (let control of controls) {
        set(control);
        control.addEventListener('input', event => set(event.target));
    }
} else {
    const formatCurrency = new Intl.NumberFormat(document.getElementsByTagName('html')[0].getAttribute('lang'), { style: 'currency', currency: 'EUR' });
    chrome.storage.sync.get(options, options => {
        let price;
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
                fetch('https://data.costof.app/ALL.json').then(response => response.json()).then(data => {
                    data.forEach(item => {
                        if (item[0] === options.country) {
                            price = item[{
                                'gasoline-95': 2,
                                'diesel': 3,
                                'lpg': 4
                            }[options.type]];
                        }
                    });
                    render();
                });
            } else {
                render();
            }
        };
        const interval = setInterval(() => {
            const element = document.querySelector('.XltNde.tTVLSc');
            if (element !== null) {
                clearInterval(interval);
                const observer = new MutationObserver(handle);
                observer.observe(element, { childList: true, subtree: true });
                handle();
            }
        }, 500);
    });
}