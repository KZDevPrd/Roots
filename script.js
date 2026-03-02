/**
 * Roots | Local Guide v1.0
 * Custom Scripting for Google Maps + Storytelling Sidebar
 */

let map;
let markers = [];
let userMarker;
let bounds; // Object to calculate the area covering all points

// 1. Initialize Map
function initMap() {
    // Starting coordinates (Plovdiv Area)
    const initialPos = { lat: 42.14454107158534, lng: 24.755741136905943 };
    
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: initialPos,
        mapTypeId: 'satellite', // Satellite view enabled
        disableDefaultUI: true, // Clean mobile interface
        // Minimal styles to hide commercial POIs that clutter the satellite view
        styles: [
            { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
            { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
        ]
    });

    bounds = new google.maps.LatLngBounds(); 

    loadTourData();
    trackUserLocation();
}

// 2. Load Data from JSON
async function loadTourData() {
    try {
        const response = await fetch('Route_001.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        renderCards(data);
        setupIntersectionObserver(data);
    } catch (err) {
        console.error("Error loading tour data:", err);
        document.getElementById('card-container').innerHTML = `<p style="padding:20px;">Error loading your route. Please check your JSON file.</p>`;
    }
}

// 3. Render Cards and Place Markers
function renderCards(data) {
    const container = document.getElementById('card-container');
    
    data.forEach((stop, index) => {
        const markerPos = { lat: stop.lat, lng: stop.lng };
        
        // Add Custom Terracotta Marker to Map
        const marker = new google.maps.Marker({
            position: markerPos,
            map: map,
            title: stop.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#d35400', // Matches --accent in CSS
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
        bounds.extend(markerPos); // Add this stop to the overview area

        // Create the Scrollable Card
        const card = document.createElement('div');
        card.className = 'card';
        card.id = stop.id;
        
        // Google Maps Universal Link for Walking Navigation
        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking`;

        card.innerHTML = `
            <img src="${stop.picture}" class="card-img" alt="${stop.name}" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image+Found'">
            <div class="card-content">
                <h2 class="card-name">${stop.name}</h2>
                <p class="card-desc">${stop.description}</p>
                <div class="fact-box"><strong>Interesting Fact:</strong> ${stop.facts}</div>
                <a href="${navUrl}" class="cta-button" target="_blank">Get Me There</a>
            </div>
        `;
        container.appendChild(card);
    });

    // Fit map to show ALL points initially
    map.fitBounds(bounds);
}

// 4. Handle Scroll Interactivity
function setupIntersectionObserver(data) {
    const options = {
        root: document.getElementById('story-section'),
        threshold: 0.5 // Trigger when card is halfway in view
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Case A: User scrolled back to the Top Header
                if (entry.target.classList.contains('tour-header')) {
                    map.fitBounds(bounds); // Zoom back out to show all
                    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
                    return;
                }

                // Case B: User is on a specific card
                document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
                entry.target.classList.add('active');

                const stopData = data.find(s => s.id === entry.target.id);
                if (stopData) {
                    map.panTo({ lat: stopData.lat, lng: stopData.lng });
                    map.setZoom(stopData.zoomLevel || 18);
                }
            }
        });
    }, options);

    // Watch the Header and the Cards
    const header = document.querySelector('.tour-header');
    if (header) observer.observe(header);
    
    document.querySelectorAll('.card').forEach(card => observer.observe(card));
}

// 5. User GPS Tracking (The Blue Dot)
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
                    optimized: false,
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
        }, (error) => {
            console.warn("Geolocation permission denied or unavailable.", error);
        }, {
            enableHighAccuracy: true
        });
    }

    // Recenter button click logic
    document.getElementById('recenter-btn').addEventListener('click', () => {
        if (userMarker) {
            map.panTo(userMarker.getPosition());
            map.setZoom(17);
        } else {
            alert("Waiting for GPS signal...");
        }
    });
}