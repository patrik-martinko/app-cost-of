var data = null;
var options = {
	country: null,
	type: 'gasoline-95',
	consumption: 7,
	consumptionElectricity: 0.2,
	priceElectricity: 0.1
};
const get = (id) => {
	return document.getElementById(id);
}
const setVisibility = (id, visibility) => {
	const element = document.getElementById(id);
	if (visibility) {
		element.setAttribute('class', element.getAttribute('class').replace('d-none', ''));
	} else if (element.getAttribute('class').indexOf('d-none') === -1) {
		element.setAttribute('class', element.getAttribute('class') + ' d-none');
	}
};
const request = (url, load) => {
	const request = new XMLHttpRequest();
	request.addEventListener('load', load);
	request.open('GET', url);
	request.send();
};
const controls = document.getElementsByClassName('control');
const update = () => {
	for (let control of controls) {
		localStorage.setItem(control.getAttribute('id'), control.value);
	}
	if (data) {
		if (get('type').value == 'electricity') {
			setVisibility('data-current', false);
			setVisibility('data-cost-100', true);
			if (localStorage.getItem('setup')) {
				setVisibility('control-consumption', false);
				setVisibility('control-consumptionElectricity', true);
				setVisibility('control-priceElectricity', true);
			}
			get('cost-100').textContent = (get('consumptionElectricity').value * get('priceElectricity').value * 100).toFixed(2) + '€';
		} else {
			setVisibility('data-current', true);
			setVisibility('data-cost-100', true);
			if (localStorage.getItem('setup')) {
				setVisibility('control-consumption', true);
				setVisibility('control-consumptionElectricity', false);
				setVisibility('control-priceElectricity', false);
			}
			const country = get('country').options[get('country').selectedIndex].textContent;
			get('selected-type').textContent = '(' + get('type').options[get('type').selectedIndex].textContent + ')';
			get('latest-update').textContent = data[0][0];
			for (let key in data) {
				if (data[key][0] == country) {
					const price = data[key][get('type').selectedIndex + 1];
					get('price').textContent = price + '€/l';
					get('cost-100').textContent = (get('consumption').value * price).toFixed(2) + '€';
				}
			}
		}
	}
};
for (let control of controls) {
	let id = control.getAttribute('id');
	control.value = localStorage.getItem(id) ? localStorage.getItem(id) : options[id];
	control.onchange = update;
}
get('button-setup').onclick = () => {
	localStorage.setItem('setup', true);
	setVisibility('button-setup', false);
	setVisibility('button-save', true);
	update();
}
// get('country').prepend('<option>Detecting country</option>');
// if (!localStorage.getItem('country')) {
// 	get('https://ip2c.org/self', function (request) {
// 		const country = request.target.responseText.split(';')[1];
// 		if (country) {
// 			selectCountry.value = country;
// 			update();
// 		}
// 	});
// } else {
// 	selectCountry.value = localStorage.getItem('country');
// 	update();
// }
request('https://script.google.com/macros/s/AKfycby5CcRVznevNoWZeexy0m1DSeOX4Kg1FeMgxFdXlr4sySwgehnIr4T23Q5ooWDtR1iB/exec', request => {
	data = JSON.parse(request.target.responseText);
	update();
});
get('copyright').innerHTML = '&copy; ' + (new Date()).getFullYear();