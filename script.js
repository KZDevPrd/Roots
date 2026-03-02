let map;
let markers = [];
let userMarker;

function initMap() {
    // Updated initial center for Plovdiv area
    const initialPos = { lat: 42.14454107158534, lng: 24.755741136905943 };
    
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: initialPos,
        mapTypeId: 'satellite', // <--- This enables Satellite mode
        disableDefaultUI: true, 
        styles: [ { "featureType": "poi", "stylers": [{ "visibility": "off" }] } ] 
    });

    loadTourData();
    trackUserLocation();
}

async function loadTourData() {
    try {
        const response = await fetch('Route_001.json');
        const data = await response.json();
        renderCards(data);
        setupIntersectionObserver(data);
    } catch (err) {
        console.error("Error loading tour data:", err);
    }
}

function renderCards(data) {
    const container = document.getElementById('card-container');
    data.forEach((stop, index) => {
        // Add Marker to Map
        const marker = new google.maps.Marker({
            position: { lat: stop.lat, lng: stop.lng },
            map: map,
            title: stop.name,
            label: (index + 1).toString()
        });
        markers.push(marker);

        // Create Card HTML
        const card = document.createElement('div');
        card.className = 'card';
        card.id = stop.id;
        
        // Fixed the Google Maps Deep Link URL structure below
        card.innerHTML = `
            <img src="${stop.picture}" class="card-img" alt="${stop.name}">
            <div class="card-content">
                <h2 class="card-name">${stop.name}</h2>
                <p class="card-desc">${stop.description}</p>
                <div class="fact-box"><strong>Local Tip:</strong> ${stop.facts}</div>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking" 
                   class="cta-button" target="_blank">Get Me There</a>
            </div>
        `;
        container.appendChild(card);
    });
}

function setupIntersectionObserver(data) {
    const options = {
        root: document.getElementById('story-section'),
        threshold: 0.6 
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
                entry.target.classList.add('active');

                const stopData = data.find(s => s.id === entry.target.id);
                map.panTo({ lat: stopData.lat, lng: stopData.lng });
                map.setZoom(stopData.zoomLevel || 17);
            }
        });
    }, options);

    document.querySelectorAll('.card').forEach(card => observer.observe(card));
}

function trackUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            if (!userMarker) {
                userMarker = new google.maps.Marker({
                    position: pos,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "white"
                    }
                });
            } else {
                userMarker.setPosition(pos);
            }
        }, (error) => {
            console.warn("Geolocation error:", error);
        }, {
            enableHighAccuracy: true
        });
    }

    document.getElementById('recenter-btn').addEventListener('click', () => {
        if (userMarker) map.panTo(userMarker.getPosition());
    });
}