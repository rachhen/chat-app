const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Tempalate
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector(
	'#location-message-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true
});

const autoscroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild;

	// Height of the new message
	const newMessageStyle = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyle.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// Visiable height
	const visiableHeigth = $messages.offsetHeight;

	// Heigth of message container
	const containerHeight = $messages.scrollHeight;

	// How far have i scroll?
	const scrollOffset = $messages.scrollTop + visiableHeigth;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight;
	}
};

socket.on('message', message => {
	console.log(message);
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('locationMessage', message => {
	console.log(message);
	const html = Mustache.render(locationMessageTemplate, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});
	document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', e => {
	e.preventDefault();

	$messageFormButton.setAttribute('disabled', 'disabled');

	const message = e.target.elements.message.value;
	socket.emit('sendMessage', message, error => {
		$messageFormButton.removeAttribute('disabled');
		$messageFormInput.value = '';
		$messageFormInput.focus();

		if (error) {
			console.log(error);
		}

		console.log('Message delivered!');
	});
});

$sendLocationButton.addEventListener('click', e => {
	if (!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser!');
	}

	$sendLocationButton.setAttribute('disabled', 'disabled');

	navigator.geolocation.getCurrentPosition(position => {
		const { latitude, longitude } = position.coords;
		socket.emit('sendLocation', { latitude, longitude }, () => {
			$sendLocationButton.removeAttribute('disabled');
			console.log('Location shared!');
		});
	});
});

socket.emit('join', { username, room }, error => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});
