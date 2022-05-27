import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
let data = null;
let charts = {
	countries: null
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
const update = () => {
	const index = {
		'gasoline-95': 2,
		'diesel': 3,
		'lpg': 4
	}[options.type];
	const indexName = get('type').options[get('type').selectedIndex].textContent;
	if (options.type == 'electricity') {
		setVisibility('data-current', false);
		if (localStorage.getItem('setup')) {
			setVisibility('control-consumption', false);
			setVisibility('control-consumptionElectricity', true);
			setVisibility('control-priceElectricity', true);
			setVisibility('data-trip', true);
			get('cost-trip').textContent = (options.consumptionElectricity * options.priceElectricity * 100).toFixed(2) + '€';
		}
	} else {
		setVisibility('data-current', true);
		if (localStorage.getItem('setup')) {
			setVisibility('control-consumption', true);
			setVisibility('control-consumptionElectricity', false);
			setVisibility('control-priceElectricity', false);
			setVisibility('data-trip', true);
		}
		get('selected-type').textContent = '(' + indexName + ')';
		get('latest-update').textContent = data[0][0];
		for (let key in data) {
			if (data[key][0] == options.country) {
				const price = data[key][index];
				get('price').textContent = price + '€/l';
				get('cost-trip').textContent = (options.consumption * options.trip / 100 * price).toFixed(2) + '€';
			}
		}
	}
	let chartOptions = {
		labels: [],
		data: [],
		colors: []
	};
	const chartData = structuredClone(data);
	chartData.splice(0, 1);
	for (let i = 0; i < chartData.length; i++) {
		if (!chartData[i][index]) {
			chartData.splice(i, 1);
		}
	}
	chartData.sort((a, b) => {
		return b[index] - a[index];
	});
	for (let i = 0; i < chartData.length; i++) {
		chartOptions['labels'][i] = chartData[i][1];
		chartOptions['data'][i] = chartData[i][index];
		chartOptions['colors'][i] = chartData[i][0] == options.country ? '#0d6efd' : '#212529';
	}
	if (charts.countries === null) {
		charts.countries = new Chart('chart-countries', {
			type: 'bar',
			data: {
				labels: chartOptions['labels'],
				datasets: [{
					label: indexName + ' (€/l)',
					data: chartOptions['data'],
					backgroundColor: chartOptions['colors']
				}]
			}
		});
	} else {
		charts.countries.data.labels = chartOptions['labels'];
		charts.countries.data.datasets[0].label = indexName + ' (€/l)';
		charts.countries.data.datasets[0].data = chartOptions['data'];
		charts.countries.data.datasets[0].backgroundColor = chartOptions['colors'];
		charts.countries.update();
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
	setVisibility('button-setup', false);
	setVisibility('button-save', true);
	input(get('country'), true);
}
let countryInit = false;
get('country').onclick = () => {
	countryInit = true;
	get('country').firstChild.remove();
};
if (!localStorage.getItem('country')) {
	const option = document.createElement('option');
	option.textContent = 'Detecting country...';
	get('country').prepend(option);
	fetch('https://api.ipregistry.co/?key=kpebi6wx7c0b7v6w').then(response => {
		response.json().then(response => {
			if (!countryInit) {
				const control = get('country');
				control.value = response.location.country.code;
				control.firstChild.remove();
				input(control, false);
			}
		});
	}).catch(reason => {
		countryInit = true;
		get('country').firstChild.remove();
		input(get('country'), false);
	});
} else {
	get('country').value = localStorage.getItem('country');
	input(get('country'), false);
}
fetch('https://script.google.com/macros/s/AKfycby5CcRVznevNoWZeexy0m1DSeOX4Kg1FeMgxFdXlr4sySwgehnIr4T23Q5ooWDtR1iB/exec').then(response => {
	response.json().then(response => {
		data = response;
		update();
	});
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
const params = new URLSearchParams(document.location.search);
if (params.get('mode') && params.get('mode') === 'signIn' && localStorage.getItem('email')) {
	signInWithEmailLink(auth, localStorage.getItem('email'), window.location.href).then(() => {
		get('alerts').innerHTML = '<div class="alert alert-success alert-dismissible mb-7" role="alert">You have been signed in.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
		window.history.pushState({}, '', '/');
	});
}
onAuthStateChanged(auth, (user) => {
	const initSignIn = () => {
		get('account').innerHTML = '';
		if (localStorage.getItem('setup')) {
			setVisibility('button-save', true);
		} else {
			setVisibility('button-setup', true);
		}
		get('button-save').onclick = () => {
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
		setVisibility('button-setup', false);
		setVisibility('button-save', false);
		localStorage.setItem('setup', true);
		get('button-signout').onclick = () => {
			signOut(auth).then(() => {
				initSignIn();
				get('alerts').innerHTML = '<div class="alert alert-success alert-dismissible mb-7" role="alert">You have been signed out.<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
			});
			return false;
		}
		getDoc(doc(db, 'options', user.email)).then((remote) => {
			for (let control of controls) {
				control.value = remote.data()[control.getAttribute('id')];
				input(control, true);
			}
		});
	} else {
		initSignIn();
	}
});