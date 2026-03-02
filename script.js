let map;
let markers = [];
let userMarker;
let bounds;

// UI Controls
document.getElementById('menu-toggle').onclick = () => document.getElementById('side-menu').classList.add('active');
document.getElementById('close-menu').onclick = () => document.getElementById('side-menu').classList.remove('active');

function initMap() {
    const initialPos = { lat: 42.144541, lng: 24.755741 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14, center: initialPos, mapTypeId: 'satellite', disableDefaultUI: true,
        styles: [{ "featureType": "poi", "stylers": [{ "visibility": "off" }] }]
    });
    bounds = new google.maps.LatLngBounds();
    loadTourData();
    trackUserLocation();
}

async function loadTourData() {
    try {
        const response = await fetch('Route_001.json');
        const data = await response.json();
        renderCards(data);
        setupIntersectionObserver(data);
    } catch (err) { console.error("JSON Error:", err); }
}

function renderCards(data) {
    const container = document.getElementById('card-container');
    data.forEach((stop, index) => {
        const markerPos = { lat: stop.lat, lng: stop.lng };
        const marker = new google.maps.Marker({
            position: markerPos, map: map,
            icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#d35400', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white', scale: 12 },
            label: { text: (index + 1).toString(), color: "white", fontWeight: "bold" }
        });
        markers.push(marker);
        bounds.extend(markerPos);

        const card = document.createElement('div');
        card.className = 'card';
        card.id = stop.id;
        card.innerHTML = `
            <img src="${stop.picture}" class="card-img">
            <h2 style="color:var(--accent); margin-bottom:10px;">${stop.name}</h2>
            <div style="flex:1;">
                <p style="margin-bottom:15px; line-height:1.5;">${stop.description}</p>
                <div style="background:#fdf2e9; padding:12px; border-left:4px solid var(--accent); border-radius:8px; font-size:0.9rem;">
                    <strong>Tip:</strong> ${stop.facts}
                </div>
            </div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking" 
               class="cta-button" target="_blank">Start Navigation</a>
        `;
        container.appendChild(card);

        if (index < data.length - 1) {
            const bridge = document.createElement('div');
            bridge.className = 'route-bridge';
            bridge.innerHTML = `<div class="bridge-arrows">↓↓</div>`;
            container.appendChild(bridge);
        }
    });
    map.fitBounds(bounds);
}

function setupIntersectionObserver(data) {
    const options = { root: document.getElementById('story-section'), threshold: 0.6 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('tour-header')) {
                    map.fitBounds(bounds);
                    return;
                }
                const stopData = data.find(s => s.id === entry.target.id);
                if (stopData) {
                    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
                    entry.target.classList.add('active');
                    map.panTo({ lat: stopData.lat, lng: stopData.lng });
                    map.setZoom(stopData.zoomLevel || 18);
                }
            }
        });
    }, options);
    observer.observe(document.querySelector('.tour-header'));
    document.querySelectorAll('.card').forEach(card => observer.observe(card));
}

function trackUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            if (!userMarker) {
                userMarker = new google.maps.Marker({
                    position: pos, map: map, zIndex: 99,
                    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
                });
            } else { userMarker.setPosition(pos); }
        }, null, { enableHighAccuracy: true });
    }
    document.getElementById('recenter-btn').onclick = () => { if (userMarker) map.panTo(userMarker.getPosition()); };
}