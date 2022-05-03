var data = null;
var options = {
	country: null,
	type: 'gasoline-95',
	consumption: 7,
	consumptionElectric: 0.2,
	priceElectric: 0.1
};
const get = (url, load) => {
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
		if (document.getElementById('type').value == 'electricity') {
			document.getElementById('data-current').style = 'display: none';
		} else {
			document.getElementById('data-current').style = '';
			const country = document.getElementById('country').options[document.getElementById('country').selectedIndex].textContent;
			document.getElementById('selected-type').textContent = '(' + document.getElementById('type').options[document.getElementById('type').selectedIndex].textContent + ')';
			document.getElementById('latest-update').textContent = data[0][0];
			for (let key in data) {
				if (data[key][0] == country) {
					document.getElementById('price').textContent = data[key][document.getElementById('type').selectedIndex + 1] + '€/l';
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
// document.getElementById('country').prepend('<option>Detecting country</option>');
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
get('https://script.google.com/macros/s/AKfycby5CcRVznevNoWZeexy0m1DSeOX4Kg1FeMgxFdXlr4sySwgehnIr4T23Q5ooWDtR1iB/exec', request => {
	data = JSON.parse(request.target.responseText);
	update();
});
document.getElementById('copyright').innerHTML = '&copy; ' + (new Date()).getFullYear();