/**
 * Roots | Local Guide v2.0
 * Paged-Scroll Architecture
 */

let map;
let markers = [];
let userMarker;
let bounds;

function initMap() {
    // Initial Center (Plovdiv)
    const initialPos = { lat: 42.14454107158534, lng: 24.755741136905943 };
    
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: initialPos,
        mapTypeId: 'satellite',
        disableDefaultUI: true, 
        styles: [ { "featureType": "poi", "stylers": [{ "visibility": "off" }] } ] 
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
    } catch (err) {
        console.error("Error loading tour data:", err);
    }
}

function renderCards(data) {
    const container = document.getElementById('card-container');
    
    data.forEach((stop, index) => {
        const markerPos = { lat: stop.lat, lng: stop.lng };
        
        // Custom Marker
        const marker = new google.maps.Marker({
            position: markerPos,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#d35400',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white',
                scale: 12
            },
            label: {
                text: (index + 1).toString(),
                color: "white",
                fontSize: "12px",
                fontWeight: "bold"
            }
        });
        
        markers.push(marker);
        bounds.extend(markerPos);

        const card = document.createElement('div');
        card.className = 'card';
        card.id = stop.id;
        
        // Deep link for navigation
        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking`;

        card.innerHTML = `
            <img src="${stop.picture}" class="card-img" alt="${stop.name}">
            <div class="card-content">
                <h2 class="card-name">${stop.name}</h2>
                <p class="card-desc">${stop.description}</p>
                <div class="fact-box"><strong>Did you know?</strong> ${stop.facts}</div>
                <a href="${navUrl}" class="cta-button" target="_blank">Start Navigation</a>
            </div>
        `;
        container.appendChild(card);
    });

    // Overview zoom at start
    map.fitBounds(bounds);
}

function setupIntersectionObserver(data) {
    const options = {
        root: document.getElementById('story-section'),
        threshold: 0.6 // The "Snap" trigger point
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Check if user is at the Top Header (Overview)
                if (entry.target.classList.contains('tour-header')) {
                    map.fitBounds(bounds);
                    return;
                }

                // Handle Snap to Card
                const stopData = data.find(s => s.id === entry.target.id);
                if (stopData) {
                    map.panTo({ lat: stopData.lat, lng: stopData.lng });
                    map.setZoom(stopData.zoomLevel || 18);
                }
            }
        });
    }, options);

    // Observe Header and all Cards
    observer.observe(document.querySelector('.tour-header'));
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
                    zIndex: 99,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "white"
                    }
                });
            } else {
                userMarker.setPosition(pos);
            }
        }, null, { enableHighAccuracy: true });
    }

    document.getElementById('recenter-btn').addEventListener('click', () => {
        if (userMarker) {
            map.panTo(userMarker.getPosition());
            map.setZoom(17);
        }
    });
}