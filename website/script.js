var data = null;
const get = function (url, load) {
	const request = new XMLHttpRequest();
	request.addEventListener('load', load);
	request.open('GET', url);
	request.send();
};
const selectCountry = document.getElementById('country');
const updateCountry = function () {
	if (data) {
		const country = selectCountry.options[selectCountry.selectedIndex].textContent;
		for (const key in data) {
			if (data[key][0] == country) {
				document.getElementById('price').textContent = data[key][1] + '€';
			}
		}
	}
};
selectCountry.onchange = updateCountry;
if (!localStorage.getItem('country')) {
	get('https://ip2c.org/self', function (request) {
		const country = request.target.responseText.split(';')[1];
		if (country) {
			selectCountry.value = country;
			updateCountry();
			localStorage.setItem('country', country);
		}
	});
} else {
	selectCountry.value = localStorage.getItem('country');
	updateCountry();
}
get('https://script.google.com/macros/s/AKfycby5CcRVznevNoWZeexy0m1DSeOX4Kg1FeMgxFdXlr4sySwgehnIr4T23Q5ooWDtR1iB/exec', function (request) {
	data = JSON.parse(request.target.responseText);
	updateCountry();
});
document.getElementById('copyright').innerHTML = '&copy; ' + (new Date()).getFullYear();