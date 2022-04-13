var options = {
	type: 'electric',
	priceElectric: 0.1,
	consumptionElectric: 0.2,
	consumption: 7
};
var data = null;
const get = function (url, load) {
	const request = new XMLHttpRequest();
	request.addEventListener('load', load);
	request.open('GET', url);
	request.send();
};
const selectCountry = document.getElementById('country');
const selectType = document.getElementById('type');
const update = function () {
	localStorage.setItem('country', selectCountry.value);
	localStorage.setItem('type', selectType.value);
	if (data) {
		if (selectType.value == 'electricity') {
			document.getElementById('data-current').style = 'display: none';
		} else {
			document.getElementById('data-current').style = '';
			const country = selectCountry.options[selectCountry.selectedIndex].textContent;
			document.getElementById('selected-type').textContent = '(' + selectType.options[selectType.selectedIndex].textContent + ')';
			document.getElementById('latest-update').textContent = data[0][0];
			for (const key in data) {
				if (data[key][0] == country) {
					document.getElementById('price').textContent = data[key][selectType.selectedIndex + 1] + '€/l';
				}
			}
		}
	}
};
selectCountry.onchange = update;
selectType.onchange = update;
if (!localStorage.getItem('country')) {
	get('https://ip2c.org/self', function (request) {
		const country = request.target.responseText.split(';')[1];
		if (country) {
			selectCountry.value = country;
			update();
		}
	});
} else {
	selectCountry.value = localStorage.getItem('country');
	update();
}
get('https://script.google.com/macros/s/AKfycby5CcRVznevNoWZeexy0m1DSeOX4Kg1FeMgxFdXlr4sySwgehnIr4T23Q5ooWDtR1iB/exec', function (request) {
	data = JSON.parse(request.target.responseText);
	update();
});
document.getElementById('copyright').innerHTML = '&copy; ' + (new Date()).getFullYear();