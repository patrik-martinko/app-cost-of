import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
let data = null;
let charts = {
	countries: null,
	history: null
};
const get = id => {
	return document.getElementById(id);
};
const show = id => {
	const element = document.getElementById(id);
	element.setAttribute('class', element.getAttribute('class').replace('d-none', ''));
};
const hide = id => {
	const element = document.getElementById(id);
	if (element.getAttribute('class').indexOf('d-none') === -1) {
		element.setAttribute('class', element.getAttribute('class') + ' d-none');
	}
};
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
		update();
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
const update = () => {
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
			show('data-trip');
			get('cost-trip').value = calculate(options.consumptionElectricity, options.trip, options.priceElectricity);
			if (share) {
				get('cost-route').textContent = calculate(options.consumptionElectricity, share[2], options.priceElectricity) + '€';
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
			show('data-trip');
		}
		get('selected-type').textContent = '(' + typeName + ')';
		get('latest-update').textContent = data[0][0];
		for (let key in data) {
			if (data[key][0] == options.country) {
				const price = data[key][type];
				get('price').textContent = price + '€/l';
				get('cost-trip').value = calculate(options.consumption * 1000 / 100, options.trip, price);
				if (share) {
					get('cost-route').textContent = calculate(options.consumption * 1000 / 100, share[2], price) + '€';
				}
			}
		}
		show('box-history');
		show('box-countries');
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
		fetch('https://script.google.com/macros/s/AKfycbzNGzvH8k5Uzk7NiT8wBSiauUZjMciW2SsYa2ocJGabUC1UqOTC6GA7K9Fjz1r7qnUC/exec?country=' + options.country).then(response => response.json()).then(response => {
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
		});
	}
};
const controls = document.getElementsByClassName('control');
for (let control of controls) {
	let id = control.getAttribute('id');
	control.value = options[id] = localStorage.getItem(id) ? localStorage.getItem(id) : options[id];
	control.addEventListener('input', (event) => {
		input(event.target, false);
	});
}
get('button-setup').onclick = () => {
	localStorage.setItem('setup', true);
	hide('button-setup');
	show('button-get');
	input(get('country'), true);
};
get('button-get').onclick = () => {
	get('links').scrollIntoView();
};
addEventListener('beforeinstallprompt', event => {
	event.preventDefault();
	get('button-setup').setAttribute('class', 'btn btn-secondary mb-3');
	show('button-get');
	get('button-get').textContent = 'Install the application';
	get('button-get').onclick = () => {
		event.prompt();
	};
});
let countryDetecting = false;
get('country').onclick = () => {
	if (countryDetecting) {
		countryDetecting = false;
		get('country').firstChild.remove();
	}
};
if (!localStorage.getItem('country')) {
	countryDetecting = true;
	const option = document.createElement('option');
	option.textContent = 'Detecting country...';
	get('country').prepend(option);
	fetch('https://api.ipregistry.co/?key=kpebi6wx7c0b7v6w').then(response => response.json()).then(response => {
		if (countryDetecting) {
			const control = get('country');
			control.value = response.location.country.code;
			control.firstChild.remove();
			input(control, false);
		}
	}).catch(reason => {
		if (countryDetecting) {
			countryDetecting = false;
			get('country').firstChild.remove();
		}
	});
} else {
	get('country').value = localStorage.getItem('country');
	input(get('country'), false);
}
fetch('https://script.google.com/macros/s/AKfycbzNGzvH8k5Uzk7NiT8wBSiauUZjMciW2SsYa2ocJGabUC1UqOTC6GA7K9Fjz1r7qnUC/exec').then(response => response.json()).then(response => {
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
let share;
if (params.get('share')) {
	show('route');
	share = (/(.*\(([\d\.,]+\sk*m)\)).*(https:\/\/.*)/s).exec(params.get('share'));
	if (share) {
		get('description-route').textContent = share[1];
		get('link-route').setAttribute('href', share[3]);
	}
}