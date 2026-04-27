import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
let data = null;
let charts = {
	countries: null,
	history: null
};
const get = id => document.getElementById(id);
const show = id => get(id).classList.remove('d-none');
const hide = id => get(id).classList.add('d-none');
const input = (control, load) => {
	let id = control.getAttribute('id');
	options[id] = control.value;
	localStorage.setItem(id, control.value);
	try {
		if (!load && auth.currentUser) {
			setDoc(doc(db, 'options', auth.currentUser.email), options);
		}
	} catch (error) { }
	if (data) {
		update(id);
	}
};
const calculate = (consumption, distance, price) => {
	let dividing = 1000;
	if (typeof distance === 'string') {
		if (distance.includes('km')) {
			dividing = 1000;
		} else if (distance.includes('m')) {
			dividing = 1;
		}
		distance = distance.replace(/[km\s]/g, '');
		if (![distance.length - 2, distance.length - 3].includes(distance.indexOf('.'))) {
			distance = distance.replace('.', '');
		}
		if ([distance.length - 2, distance.length - 3].includes(distance.indexOf(','))) {
			distance = distance.replace(',', '.');
		}
		distance = distance.replace(',', '');
		distance = Number(distance);
	}
	return (distance / dividing * consumption * price).toFixed(2);
};
const calculateDistance = (consumption, cost, price) => (cost / consumption / price * 1000).toFixed(2);
const update = source => {
	const type = {
		'gasoline-95': 2,
		'diesel': 3,
		'lpg': 4
	}[options.type];
	const typeName = get('type').options[get('type').selectedIndex].textContent;
	if (options.type == 'electricity') {
		hide('data-current');
		if (localStorage.getItem('setup')) {
			hide('control-consumption');
			show('control-consumptionElectricity');
			show('control-priceElectricity');
			show('trip-data');
			if (source === 'tripCost') {
				get('trip').value = calculateDistance(options.consumptionElectricity, options.tripCost, options.priceElectricity);
			} else {
				get('tripCost').value = calculate(options.consumptionElectricity, options.trip, options.priceElectricity);
			}
			if (route) {
				get('route-cost').textContent = calculate(options.consumptionElectricity, route, options.priceElectricity) + '€';
			}
		}
		hide('box-history');
		hide('box-countries');
	} else {
		show('data-current');
		if (localStorage.getItem('setup')) {
			show('control-consumption');
			hide('control-consumptionElectricity');
			hide('control-priceElectricity');
			show('trip-data');
		}
		get('selected-type').innerHTML = 'for <strong>' + typeName + '</strong>';
		get('latest-update').textContent = data[0][0];
		for (let key in data) {
			if (data[key][0] == options.country) {
				const price = data[key][type];
				get('price').textContent = price + '€/l';
				if (source === 'tripCost') {
					get('trip').value = calculateDistance(options.consumption * 1000 / 100, options.tripCost, price);
				} else {
					get('tripCost').value = calculate(options.consumption * 1000 / 100, options.trip, price);
				}
				if (route) {
					get('route-cost').textContent = calculate(options.consumption * 1000 / 100, route, price) + '€';
				}
			}
		}
		show('box-history');
		show('box-countries');
		if (!['trip', 'tripCost'].includes(source)) {
			const chartData = structuredClone(data);
			chartData.splice(0, 1);
			for (let i = 0; i < chartData.length; i++) {
				if (!chartData[i][type]) {
					chartData.splice(i, 1);
				}
			}
			chartData.sort((a, b) => {
				return b[type] - a[type];
			});
			const labels = chartData.map(record => record[1]);
			const colors = chartData.map(record => record[0] === options.country ? '#0d6efd' : '#212529');
			if (charts.countries === null) {
				charts.countries = new Chart('chart-countries', {
					type: 'bar',
					data: {
						labels: labels,
						datasets: [{
							label: typeName + ' (€/l)',
							data: chartData.map(record => record[type]),
							backgroundColor: colors,
							borderRadius: 3
						}]
					},
					options: {
						maintainAspectRatio: false
					}
				});
			} else {
				charts.countries.data.labels = labels;
				charts.countries.data.datasets[0].label = typeName + ' (€/l)';
				charts.countries.data.datasets[0].data = chartData.map(record => record[type]);
				charts.countries.data.datasets[0].backgroundColor = colors;
				charts.countries.update();
			}
			fetch(`https://data.costof.app/${options.country}.json`).then(response => response.json()).then(response => {
				const columns = response[0].length === 4 ? [0, 1, 2] : [0, 1];
				const labels = response.map(record => record[0]);
				const colors = {
					primary: '#0d6efd',
					border: ['#909090', '#505050'],
					background: ['#909090', '#505050']
				}
				const data = {
					labels: labels,
					datasets: columns.map(index => {
						return {
							label: get('type').options[index].textContent + ' (€/l)',
							data: response.map(record => record[index + 1]),
							borderColor: index + 2 === type ? colors.primary : colors.border.pop(),
							backgroundColor: index + 2 === type ? colors.primary : colors.background.pop(),
							tension: 0.5
						};
					})
				};
				if (charts.history === null) {
					charts.history = new Chart('chart-history', {
						type: 'line',
						data: data,
						options: {
							maintainAspectRatio: false,
							elements: {
								point: {
									radius: 1
								}
							}
						}
					});
				} else {
					charts.history.data = data;
					charts.history.update();
				}
			})
		};
	}
};
const controls = document.getElementsByClassName('control');
for (let control of controls) {
	let id = control.getAttribute('id');
	control.value = options[id] = localStorage.getItem(id) ? localStorage.getItem(id) : options[id];
	control.addEventListener('input', event => input(event.target, false));
}
get('button-setup').onclick = () => {
	localStorage.setItem('setup', true);
	hide('button-setup');
	show('button-get');
	input(get('country'), true);
};
document.addEventListener('AppCostOf', () => get('button-get').setAttribute('href', 'https://maps.google.com').textContent = 'Open Google Maps');
get('button-get').onclick = () => {
	if (navigator.userAgentData && navigator.userAgentData.brands.some(b => b.brand === 'Chromium')) {
		get('button-get').setAttribute('href', 'https://chrome.google.com/webstore/detail/cost-of-driving-in-google/glajpeclpoeodmfofkelgedjphkdgmie');
	} else {
		get('button-get').setAttribute('href', 'https://addons.mozilla.org/en-US/firefox/addon/cost-of-driving-in-google-maps');
	}
};
if (navigator.userAgentData && navigator.userAgentData.mobile) {
	addEventListener('beforeinstallprompt', event => {
		get('button-setup').setAttribute('class', get('button-setup').getAttribute('class').replace('btn btn-primary', 'btn btn-secondary mb-3'));
		show('button-get');
		get('button-get').textContent = 'Install the application';
		get('button-get').onclick = () => event.prompt();
	});
}
const country = get('country');
const countrySearch = get('country-search');
const countries = document.querySelectorAll('#countries .dropdown-item');
countrySearch.addEventListener('click', event => event.stopPropagation());
countries.forEach(item => {
	item.addEventListener('click', () => {
		country.value = item.getAttribute('value');
		country.dispatchEvent(new Event('input'));
		input(country, false);
		country.innerHTML = item.innerHTML;
		countrySearch.value = '';
		countries.forEach(item => item.style.display = '');
	});
});
countrySearch.addEventListener('keyup', () => {
	const filter = countrySearch.value.toLowerCase();
	countries.forEach(item => {
		const text = item.textContent.toLowerCase();
		if (text.includes(filter)) {
			item.style.display = '';
		} else {
			item.style.display = 'none';
		}
	});
});
let countryDetecting = false;
country.onclick = () => {
	if (countryDetecting) {
		countryDetecting = false;
	}
};
if (!localStorage.getItem('country')) {
	countryDetecting = true;
	country.textContent = 'Detecting country...';
	fetch('https://data.costof.app/detection').then(response => response.text()).then(response => {
		if (countryDetecting) {
			country.value = response;
			country.innerHTML = document.querySelector(`#countries [value="${country.value}"]`).innerHTML;
			input(country, false);
		}
	}).catch(reason => {
		if (countryDetecting) {
			countryDetecting = false;
			country.textContent = 'Detection failed, click to select';
		}
	});
} else {
	country.value = localStorage.getItem('country');
	country.innerHTML = document.querySelector(`#countries [value="${country.value}"]`).innerHTML;
	input(country, false);
}
fetch('https://data.costof.app/ALL.json').then(response => response.json()).then(response => {
	data = response;
	update();
});
get('copyright').innerHTML = '&copy; ' + (new Date()).getFullYear();
const config = {
	apiKey: "AIzaSyDW0tyQQHS2NBu7dX7iMlpyrflqUOBtndE",
	authDomain: "cost-of-app.firebaseapp.com",
	databaseURL: "https://cost-of-app-default-rtdb.firebaseio.com",
	projectId: "cost-of-app",
	storageBucket: "cost-of-app.appspot.com",
	messagingSenderId: "630278657376",
	appId: "1:630278657376:web:688c632f68d469960a3a05"
};
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const modal = new bootstrap.Modal(get('modal'), {
	focus: false
});
get('modal').addEventListener('shown.bs.modal', () => {
	get('email').focus();
});
const params = new URLSearchParams(location.search);
if (params.get('mode') && params.get('mode') === 'signIn' && localStorage.getItem('email')) {
	signInWithEmailLink(auth, localStorage.getItem('email'), location.href).then(() => {
		get('alerts').innerHTML = '<div class="alert alert-success alert-dismissible mb-7" role="alert">You have been signed in.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
		history.pushState({}, '', '/');
	});
}
onAuthStateChanged(auth, (user) => {
	const initSignIn = () => {
		get('account').innerHTML = '<a id="button-signin" class="text-muted">Sync settings across your devices</a>';
		if (localStorage.getItem('setup')) {
			show('button-get');
		} else {
			show('button-setup');
		}
		get('button-signin').onclick = () => {
			get('modal-title').textContent = 'Enter your email address';
			get('modal-submit').textContent = 'Send sign-in link';
			get('modal-submit').onclick = () => {
				localStorage.setItem('email', get('email').value);
				sendSignInLinkToEmail(auth, get('email').value, {
					url: 'https://costof.app',
					handleCodeInApp: true
				}).then(() => {
					get('modal-alerts').innerHTML = '<div class="alert alert-success alert-dismissible mt-2 mb-0" role="alert">Link has been sent to your email address.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
				});
			}
			modal.show();
			return false;
		};
	};
	if (user) {
		get('account').innerHTML = user.email + ' <a href="" id="button-signout" class="text-muted">(sign out)</a>';
		show('button-get');
		hide('button-setup');
		localStorage.setItem('setup', true);
		get('button-signout').onclick = () => {
			signOut(auth).then(() => {
				initSignIn();
				get('alerts').innerHTML = '<div class="alert alert-success alert-dismissible mb-7" role="alert">You have been signed out.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
			});
			return false;
		}
		getDoc(doc(db, 'options', user.email)).then((remote) => {
			if (remote.data()) {
				for (let control of controls) {
					control.value = remote.data()[control.getAttribute('id')];
					input(control, true);
				}
			} else {
				setDoc(doc(db, 'options', user.email), options);
			}
		});
	} else {
		initSignIn();
	}
});
let route;
if (params.get('share')) {
	const link = params.get('share');
	fetch(`https://data.costof.app/direction?link=${link}`).then(response => response.json()).then(response => {
		if (response.routes) {
			route = response.routes[0].distanceMeters / 1000;
			update();
			get('route-description').textContent = `From ${response.origin} to ${response.destination}: ${response.routes[0].localizedValues.duration.text} (${response.routes[0].localizedValues.distance.text})`;
			get('route-link').setAttribute('href', link);
			show('route');
		}
	});
}