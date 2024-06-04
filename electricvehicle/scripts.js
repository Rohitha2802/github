document.getElementById('station-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const location = document.getElementById('location').value;
    findStations(location);
});

async function findStations(location) {
    // Mockup function to simulate finding stations
    const stations = [
        { name: 'Station 1', address: '123 Main St, City' },
        { name: 'Station 2', address: '456 Elm St, City' },
        { name: 'Station 3', address: '789 Pine St, City' },
    ];

    const stationResult = document.getElementById('station-result');
    stationResult.innerHTML = '';

    stations.forEach(station => {
        const stationItem = document.createElement('div');
        stationItem.classList.add('station-item');
        stationItem.innerHTML = `<h3>${station.name}</h3><p>${station.address}</p>`;
        stationResult.appendChild(stationItem);
    });
}

document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    if (name && email && message) {
        alert('Thank you for your message, ' + name + '!');
        document.getElementById('contact-form').reset();
    } else {
        alert('Please fill out all fields.');
    }
});
