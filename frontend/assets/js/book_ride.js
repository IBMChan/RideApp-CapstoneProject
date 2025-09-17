// book_ride.js - Rider ride booking UI
document.addEventListener('DOMContentLoaded', () => {
    /* -------------------------
       Elements
       -------------------------*/
    const logoutBtn = document.getElementById('logoutBtn');
    const pickupInput = document.getElementById('pickupInput');
    const dropInput = document.getElementById('dropInput');
    const pickupCoordsEl = document.getElementById('pickupCoords');
    const dropCoordsEl = document.getElementById('dropCoords');
    const btnCreate = document.getElementById('btnCreateRide');
    const btnSwap = document.getElementById('btnSwap');
    const rideInfoArea = document.getElementById('rideInfoArea');

    const formSaveLocation = document.getElementById('formSaveLocation');
    const locLabel = document.getElementById('locLabel');
    const locAddress = document.getElementById('locAddress');
    const locLat = document.getElementById('locLat');
    const locLng = document.getElementById('locLng');
    const savedLocationsEl = document.getElementById('savedLocations');

    if (!pickupInput || !dropInput || !btnCreate || !rideInfoArea || !savedLocationsEl) {
        console.error('Missing essential DOM elements — check HTML ids.');
        return;
    }

    /* -------------------------
       User & API helpers
       -------------------------*/
    function getUser() {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }
    const USER = getUser();
    const RIDER_ID = USER?.user_id || null;
    const API_BASE = window.RIDE_API_BASE || 'http://localhost:3000/api';

    function authHeaders() {
        const h = {};
        if (USER?.token) h['Authorization'] = 'Bearer ' + USER.token;
        return h;
    }

    async function safeFetch(path, opts = {}) {
        const url = path.startsWith('http') ? path : (API_BASE + path);
        const headers = Object.assign({}, (opts.headers || {}));
        if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
        if (!headers['Authorization'] && USER?.token) headers['Authorization'] = 'Bearer ' + USER.token;
        try {
            const res = await fetch(url, {
                credentials: 'include',
                ...opts,
                headers
            });
            const text = await res.text();
            try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
            catch { return { ok: res.ok, status: res.status, data: text }; }
        } catch (e) {
            console.error('Network error', e);
            return { ok: false, error: e };
        }
    }

    /* -------------------------
       Map setup (Leaflet)
       -------------------------*/
    const initialCenter = [20.5937, 78.9629];
    const map = L.map('map', { center: initialCenter, zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    let pickupMarker = null, dropMarker = null, routePolyline = null;

    function setPickup(latlng) {
        if (pickupMarker) map.removeLayer(pickupMarker);
        pickupMarker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup('Pickup').openPopup();
        pickupCoordsEl.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
        pickupMarker.on('dragend', () => {
            const p = pickupMarker.getLatLng();
            pickupCoordsEl.textContent = `Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)}`;
            if (dropMarker) drawRoute(p, dropMarker.getLatLng());
        });
        if (dropMarker) drawRoute(latlng, dropMarker.getLatLng());
    }

    function setDrop(latlng) {
        if (dropMarker) map.removeLayer(dropMarker);
        dropMarker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup('Drop').openPopup();
        dropCoordsEl.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
        dropMarker.on('dragend', () => {
            const p = dropMarker.getLatLng();
            dropCoordsEl.textContent = `Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)}`;
            if (pickupMarker) drawRoute(pickupMarker.getLatLng(), p);
        });
        if (pickupMarker) drawRoute(pickupMarker.getLatLng(), latlng);
    }

    function drawRoute(pickup, drop) {
        if (routePolyline) map.removeLayer(routePolyline);
        routePolyline = L.polyline([pickup, drop], { color: 'blue', weight: 4, opacity: 0.7 }).addTo(map);
        map.fitBounds([pickup, drop], { padding: [40, 40] });
    }

    function clearRoute() {
        if (routePolyline) {
            map.removeLayer(routePolyline);
            routePolyline = null;
        }
    }

    map.on('click', (e) => {
        if (!pickupMarker) setPickup(e.latlng);
        else if (!dropMarker) setDrop(e.latlng);
        else {
            if (pickupMarker) map.removeLayer(pickupMarker);
            if (dropMarker) map.removeLayer(dropMarker);
            pickupMarker = dropMarker = null;
            clearRoute();
            setPickup(e.latlng);
        }
    });

    /* -------------------------
       Geocoding + autocomplete
       -------------------------*/
    async function geocode(query) {
        if (!query || query.trim().length < 2) return [];

        // 1) try backend proxy (if provided)
        try {
            const p = `${API_BASE}/geocode?q=${encodeURIComponent(query)}`;
            const r = await fetch(p);
            if (r.ok) {
                const j = await r.json();
                if (Array.isArray(j) && j.length) return j;
            }
        } catch (e) {
            // ignore and fallback
        }

        // 2) fallback to Nominatim (may fail due to CORS depending on origin)
        try {
            const nom = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
            const r2 = await fetch(nom);
            if (r2.ok) {
                const j2 = await r2.json();
                return j2;
            }
        } catch (e) {
            console.error('geocode error', e);
        }
        return [];
    }

    function attachAutocomplete(inputEl, onSelect) {
        let dd;
        inputEl.addEventListener('input', async (ev) => {
            const q = ev.target.value;
            if (!q) { removeDropdown(); return; }
            const items = await geocode(q);
            showDropdown(items);
        });
        inputEl.addEventListener('blur', () => { setTimeout(removeDropdown, 200); });

        function showDropdown(items) {
            removeDropdown();
            dd = document.createElement('div');
            dd.className = 'autocomplete-dd';
            dd.style.position = 'absolute';
            dd.style.zIndex = 9999;
            const rect = inputEl.getBoundingClientRect();
            dd.style.left = rect.left + window.scrollX + 'px';
            dd.style.top = (rect.bottom + window.scrollY) + 'px';
            dd.style.width = inputEl.offsetWidth + 'px';
            dd.style.background = '#fff';
            dd.style.border = '1px solid #e6eef8';
            dd.style.borderRadius = '8px';
            dd.style.boxShadow = '0 6px 18px rgba(15,23,42,0.06)';
            dd.style.maxHeight = '220px';
            dd.style.overflow = 'auto';
            dd.style.padding = '4px';

            if (!items || items.length === 0) {
                const el = document.createElement('div');
                el.className = 'muted small';
                el.style.padding = '10px';
                el.textContent = 'No places found';
                dd.appendChild(el);
            } else {
                items.forEach(item => {
                    const el = document.createElement('div');
                    el.style.padding = '8px 10px';
                    el.style.cursor = 'pointer';
                    el.style.borderBottom = '1px solid #f1f5f9';
                    const title = (item.display_name || '').split(',')[0];
                    el.innerHTML = `<div style="font-weight:600">${title}</div><div class="small muted" style="font-size:12px">${item.display_name || ''}</div>`;
                    el.addEventListener('click', () => {
                        inputEl.value = item.display_name;
                        removeDropdown();
                        onSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), raw: item });
                    });
                    dd.appendChild(el);
                });
            }
            document.body.appendChild(dd);
        }

        function removeDropdown() { if (dd && dd.parentNode) dd.parentNode.removeChild(dd); dd = null; }
    }

    attachAutocomplete(pickupInput, (loc) => { setPickup({ lat: loc.lat, lng: loc.lng }); map.setView([loc.lat, loc.lng], 14); });
    attachAutocomplete(dropInput, (loc) => { setDrop({ lat: loc.lat, lng: loc.lng }); if (pickupMarker) drawRoute(pickupMarker.getLatLng(), { lat: loc.lat, lng: loc.lng }); else map.setView([loc.lat, loc.lng], 14); });

    /* -------------------------
       Swap button
       -------------------------*/
    btnSwap.addEventListener('click', () => {
        const pVal = pickupInput.value;
        const dVal = dropInput.value;
        const pCoords = pickupMarker ? pickupMarker.getLatLng() : null;
        const dCoords = dropMarker ? dropMarker.getLatLng() : null;
        pickupInput.value = dVal;
        dropInput.value = pVal;
        if (pCoords || dCoords) {
            if (pickupMarker) map.removeLayer(pickupMarker);
            if (dropMarker) map.removeLayer(dropMarker);
            pickupMarker = dropMarker = null;
            clearRoute();
            if (dCoords) setPickup(dCoords);
            if (pCoords) setDrop(pCoords);
        }
    });

    /* -------------------------
       Create ride
       -------------------------*/
    btnCreate.addEventListener('click', async () => {
        const pickupLatLng = pickupMarker ? pickupMarker.getLatLng() : null;
        const dropLatLng = dropMarker ? dropMarker.getLatLng() : null;
        if (!pickupLatLng || !dropLatLng) return alert('Please specify both pickup and drop locations.');

        btnCreate.disabled = true;
        btnCreate.textContent = 'Requesting...';

        try {
            // call RideAPI.createRide (book_ride_helper.js)
            // pass simple lat/lng objects
            const pickup = { lat: Number(pickupLatLng.lat.toFixed(6)), lng: Number(pickupLatLng.lng.toFixed(6)) };
            const drop = { lat: Number(dropLatLng.lat.toFixed(6)), lng: Number(dropLatLng.lng.toFixed(6)) };
            const resp = await RideAPI.createRide(pickup, drop);

            // RideAPI returns parsed JSON or text. Try to find success flag / ride object.
            const success = resp && (resp.success === true || (resp.data && resp.data.success === true));
            const rideObj = (resp && resp.data && (resp.data.ride || resp.data)) || resp;

            if (success || (rideObj && (rideObj.ride_id || rideObj.id))) {
                // show ride information (attempt to normalize)
                const ride = rideObj.ride || rideObj;
                showRideInfo(normalizeRide(ride, resp));
                window.location.href = "/RideApp-CapstoneProject/frontend/views/my_rides.html";
                // also refresh saved locations (no harm)

            } else {
                console.warn('createRide resp', resp);
                alert('Failed to create ride: ' + (resp?.message || JSON.stringify(resp)));
            }
        } catch (err) {
            console.error('create ride err', err);
            alert('Error creating ride: ' + (err.message || err));
        } finally {
            btnCreate.disabled = false;
            btnCreate.textContent = 'Request Ride';
        }
    });

    // normalize various ride response shapes into a simple object
    function normalizeRide(ride, fullResp) {
        // ride may be null and info in fullResp.data
        if (!ride && fullResp && fullResp.data) {
            ride = fullResp.data.ride || fullResp.data;
        }
        if (!ride) return {};
        // try to extract id and pickup/drop fields into standard names
        const id = ride.ride_id || ride.id || (fullResp && fullResp.data && fullResp.data.ride_id);
        const pickup = ride.pickup || ride.pickup_loc || ride.pickup_location || ride.pickup_coords || ride.from;
        const drop = ride.drop || ride.drop_loc || ride.drop_location || ride.drop_coords || ride.to;
        return { ...ride, ride_id: id, pickup, drop, status: ride.status || (fullResp && fullResp.data && fullResp.data.status) || 'requested' };
    }

    function coordsFromField(f) {
        if (!f) return null;
        if (typeof f === 'string') {
            try {
                const parsed = JSON.parse(f);
                if (parsed) f = parsed;
            } catch (e) { /* not JSON */ }
        }
        if (Array.isArray(f)) {
            return { lat: Number(f[0]), lng: Number(f[1]) };
        }
        if (f.lat != null && f.lng != null) return { lat: Number(f.lat), lng: Number(f.lng) };
        if (f.latitude != null && f.longitude != null) return { lat: Number(f.latitude), lng: Number(f.longitude) };
        // sometimes object might be { x: .., y: .. } or nested latlng
        if (f.latlng && (f.latlng.lat != null)) return { lat: Number(f.latlng.lat), lng: Number(f.latlng.lng) };
        return null;
    }

    async function showRideInfo(ride) {
        if (!ride) {
            rideInfoArea.innerHTML = '<div class="muted">No ride information available.</div>';
            return;
        }
        const pickupCoords = coordsFromField(ride.pickup);
        const dropCoords = coordsFromField(ride.drop);

        // show readable info
        const id = ride.ride_id || ride.id || '-';
        const status = ride.status || 'requested';

        rideInfoArea.innerHTML = `
      <div><strong>Ride ID:</strong> ${id}</div>
      <div><strong>Status:</strong> ${status}</div>
      <div><strong>Pickup:</strong> ${pickupCoords ? `${pickupCoords.lat.toFixed(6)}, ${pickupCoords.lng.toFixed(6)}` : '—'}</div>
      <div><strong>Drop:</strong> ${dropCoords ? `${dropCoords.lat.toFixed(6)}, ${dropCoords.lng.toFixed(6)}` : '—'}</div>
      <div style="margin-top:8px"><button class="cancel-btn ghost small">Cancel Ride</button></div>
    `;

        // draw on map
        if (pickupCoords) setPickup(pickupCoords);
        if (dropCoords) setDrop(dropCoords);
        if (pickupCoords && dropCoords) drawRoute(pickupCoords, dropCoords);

        // wire cancel
        const cancelBtn = rideInfoArea.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                if (!confirm('Cancel this ride?')) return;
                try {
                    // call helper cancel endpoint
                    const idToCancel = ride.ride_id || ride.id;
                    if (!idToCancel) {
                        alert('Missing ride id');
                        return;
                    }
                    const cancelledResp = await RideAPI.cancelRide(idToCancel);
                    // cancelledResp may be object or string
                    const ok = cancelledResp && (cancelledResp.success === true || cancelledResp === 'OK' || (cancelledResp.data && cancelledResp.data.success === true));
                    if (ok) {
                        rideInfoArea.innerHTML = `<div class="muted">Ride cancelled.</div>`;
                        // remove markers/route
                        if (pickupMarker) map.removeLayer(pickupMarker);
                        if (dropMarker) map.removeLayer(dropMarker);
                        pickupMarker = dropMarker = null;
                        clearRoute();
                    } else {
                        console.warn('cancel response', cancelledResp);
                        alert('Unable to cancel ride.');
                    }
                } catch (e) {
                    console.error('cancel error', e);
                    alert('Error cancelling ride');
                }
            });
        }
    }

    /* -------------------------
       Saved locations (backend or localStorage fallback)
       -------------------------*/
    const LOCAL_STORAGE_LOC_KEY = 'vaahan_saved_locations';

    async function loadSavedLocations() {
        if (!savedLocationsEl) {
            console.warn('No #savedLocations element in DOM');
            return;
        }

        let arr = null;
        if (RIDER_ID) {
            try {
                const r = await safeFetch(`/rider/${RIDER_ID}/locations`, { method: 'GET' });
                if (r.ok && r.data) {
                    arr = r.data.locations || r.data || [];
                    if (!Array.isArray(arr)) arr = [];
                }
            } catch (e) {
                console.warn('backend locations failed', e);
            }
        }

        if (!Array.isArray(arr) || arr.length === 0) {
            try {
                const saved = localStorage.getItem(LOCAL_STORAGE_LOC_KEY);
                arr = saved ? JSON.parse(saved) : [];
            } catch (e) { arr = []; }
        }

        savedLocationsEl.innerHTML = '';
        if (!arr || arr.length === 0) {
            savedLocationsEl.innerHTML = '<div class="muted">No saved locations yet</div>';
            return;
        }

        arr.forEach(loc => {
            const item = document.createElement('div');
            item.className = 'item';
            const label = loc.label || loc.name || '-';
            const address = loc.address || '-';
            const lat = loc.latitude ?? loc.lat ?? (loc.latlng?.lat) ?? '-';
            const lng = loc.longitude ?? loc.lng ?? (loc.latlng?.lng) ?? '-';
            item.innerHTML = `
                <div>
                    <div style="font-weight:700">${label}</div>
                    <div class="small muted">${address}</div>
                    <div class="small muted">${(Number(lat).toFixed ? Number(lat).toFixed(5) : lat)}, ${(Number(lng).toFixed ? Number(lng).toFixed(5) : lng)}</div>
                    <button class="small ghost btn-use-loc" data-lat="${lat}" data-lng="${lng}" data-address="${address}">Use</button>
                </div>
            `;
            savedLocationsEl.appendChild(item);
        });

        savedLocationsEl.querySelectorAll('.btn-use-loc').forEach(b => {
            b.addEventListener('click', () => {
                const lat = parseFloat(b.dataset.lat);
                const lng = parseFloat(b.dataset.lng);
                const address = b.dataset.address;
                if (Number.isNaN(lat) || Number.isNaN(lng)) return alert('Invalid coordinates');
                dropInput.value = address;
                setDrop({ lat, lng });
                map.setView([lat, lng], 14);
            });
        });
    }

    if (formSaveLocation) {
        formSaveLocation.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const payload = {
                label: (locLabel.value || '').trim(),
                address: (locAddress.value || '').trim(),
                latitude: parseFloat(locLat.value),
                longitude: parseFloat(locLng.value)
            };
            if (!payload.label || !payload.address || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
                alert('Please provide valid location details');
                return;
            }

            let saved = false;
            if (RIDER_ID) {
                try {
                    const r = await safeFetch(`/rider/${RIDER_ID}/locations`, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    if (r.ok) saved = true;
                } catch (e) {
                    console.warn('save location backend error', e);
                }
            }

            if (!saved) {
                try {
                    const arr = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LOC_KEY)) || [];
                    arr.unshift(payload);
                    localStorage.setItem(LOCAL_STORAGE_LOC_KEY, JSON.stringify(arr));
                    saved = true;
                } catch (e) {
                    console.error('local save failed', e);
                }
            }

            if (saved) {
                await loadSavedLocations();
                formSaveLocation.reset();
            } else {
                alert('Failed to save location');
            }
        });
    }

    // on save location submit: try backend, fallback to localStorage
    // formSaveLocation.addEventListener('submit', async (ev) => {
    //     ev.preventDefault();
    //     const payload = {
    //         label: (locLabel.value || '').trim(),
    //         address: (locAddress.value || '').trim(),
    //         latitude: parseFloat(locLat.value),
    //         longitude: parseFloat(locLng.value)
    //     };
    //     if (!payload.label || !payload.address || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
    //         alert('Please provide valid location details');
    //         return;
    //     }

    //     // backend attempt if RIDER_ID
    //     let saved = false;
    //     if (RIDER_ID) {
    //         try {
    //             const r = await safeFetch(`/rider/${RIDER_ID}/locations`, {
    //                 method: 'POST',
    //                 body: JSON.stringify(payload)
    //             });
    //             if (r.ok) saved = true;
    //         } catch (e) {
    //             console.warn('save location backend error', e);
    //         }
    //     }

    //     // fallback to localStorage
    //     if (!saved) {
    //         try {
    //             const arr = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LOC_KEY)) || [];
    //             arr.unshift(payload);
    //             localStorage.setItem(LOCAL_STORAGE_LOC_KEY, JSON.stringify(arr));
    //             saved = true;
    //         } catch (e) {
    //             console.error('local save failed', e);
    //         }
    //     }

    //     if (saved) {
    //         showTempMessage(savedLocationsEl, 'Location saved', false);
    //         formSaveLocation.reset();
    //         await loadSavedLocations();
    //     } else {
    //         alert('Failed to save location');
    //     }
    // });

    function showTempMessage(containerEl, msg, isError = false) {
        if (!containerEl) return;
        const prev = containerEl._tmp;
        if (prev) clearTimeout(prev.timeout);
        const tmp = document.createElement('div');
        tmp.textContent = msg;
        tmp.style.color = isError ? '#b91c1c' : '#0f5132';
        tmp.style.fontSize = '13px';
        tmp.style.marginTop = '6px';
        containerEl.prepend(tmp);
        const to = setTimeout(() => {
            try { if (tmp.parentNode) tmp.parentNode.removeChild(tmp); } catch (e) { }
        }, 3000);
        containerEl._tmp = { node: tmp, timeout: to };
    }

    /* -------------------------
       Logout
       -------------------------*/
    logoutBtn?.addEventListener('click', async () => {
        try {
            await safeFetch('/auth/logout', { method: 'POST' });
        } catch (e) { /* ignore */ }
        localStorage.removeItem('user');
        window.location.href = '/public/login.html';
    });

    /* -------------------------
       Startup
       -------------------------*/
    (async function startup() {
        try {
            await loadSavedLocations();
        } catch (err) {
            console.warn('loadSavedLocations failed', err);
        }
    })();
    // loadSavedLocations().catch(err => console.warn('loadSavedLocations failed', err));
});

// book_ride.js - Rider ride booking UI

// document.addEventListener('DOMContentLoaded', () => {
//     /* -------------------------
//        Elements
//        -------------------------*/
//     const logoutBtn = document.getElementById('logoutBtn');
//     const pickupInput = document.getElementById('pickupInput');
//     const dropInput = document.getElementById('dropInput');
//     const pickupCoordsEl = document.getElementById('pickupCoords');
//     const dropCoordsEl = document.getElementById('dropCoords');
//     const btnCreate = document.getElementById('btnCreateRide');
//     const btnSwap = document.getElementById('btnSwap');
//     const rideInfoArea = document.getElementById('rideInfoArea');

//     const formSaveLocation = document.getElementById('formSaveLocation');
//     const locLabel = document.getElementById('locLabel');
//     const locAddress = document.getElementById('locAddress');
//     const locLat = document.getElementById('locLat');
//     const locLng = document.getElementById('locLng');
//     const savedLocationsEl = document.getElementById('savedLocations');

//     if (!pickupInput || !dropInput || !btnCreate || !rideInfoArea) {
//         console.error('Missing essential DOM elements — check HTML ids.');
//         return;
//     }

//     /* -------------------------
//        User & API helpers
//        -------------------------*/
//     function getUser() {
//         try {
//             const raw = localStorage.getItem('user');
//             if (!raw) return null;
//             return JSON.parse(raw);
//         } catch (e) {
//             return null;
//         }
//     }
//     const USER = getUser();
//     const RIDER_ID = USER?.user_id || null;
//     const API_BASE = window.RIDE_API_BASE || 'http://localhost:3000/api';

//     function authHeaders() {
//         const h = {};
//         if (USER?.token) h['Authorization'] = 'Bearer ' + USER.token;
//         return h;
//     }

//     async function safeFetch(path, opts = {}) {
//         const url = path.startsWith('http') ? path : (API_BASE + path);
//         const headers = Object.assign({}, (opts.headers || {}));
//         if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
//         if (!headers['Authorization'] && USER?.token) headers['Authorization'] = 'Bearer ' + USER.token;
//         try {
//             const res = await fetch(url, {
//                 credentials: 'include',
//                 ...opts,
//                 headers
//             });
//             const text = await res.text();
//             try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
//             catch { return { ok: res.ok, status: res.status, data: text }; }
//         } catch (e) {
//             console.error('Network error', e);
//             return { ok: false, error: e };
//         }
//     }

//     /* -------------------------
//        Map setup (Leaflet)
//        -------------------------*/
//     const initialCenter = [20.5937, 78.9629];
//     const map = L.map('map', { center: initialCenter, zoom: 5 });
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         maxZoom: 19,
//     }).addTo(map);

//     let pickupMarker = null, dropMarker = null, routePolyline = null;

//     function setPickup(latlng) {
//         if (pickupMarker) map.removeLayer(pickupMarker);
//         pickupMarker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup('Pickup').openPopup();
//         if (pickupCoordsEl) pickupCoordsEl.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
//         pickupMarker.on('dragend', () => {
//             const p = pickupMarker.getLatLng();
//             if (pickupCoordsEl) pickupCoordsEl.textContent = `Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)}`;
//             if (dropMarker) drawRoute(p, dropMarker.getLatLng());
//         });
//         if (dropMarker) drawRoute(latlng, dropMarker.getLatLng());
//     }

//     function setDrop(latlng) {
//         if (dropMarker) map.removeLayer(dropMarker);
//         dropMarker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup('Drop').openPopup();
//         if (dropCoordsEl) dropCoordsEl.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
//         dropMarker.on('dragend', () => {
//             const p = dropMarker.getLatLng();
//             if (dropCoordsEl) dropCoordsEl.textContent = `Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)}`;
//             if (pickupMarker) drawRoute(pickupMarker.getLatLng(), p);
//         });
//         if (pickupMarker) drawRoute(pickupMarker.getLatLng(), latlng);
//     }

//     function drawRoute(pickup, drop) {
//         if (routePolyline) map.removeLayer(routePolyline);
//         routePolyline = L.polyline([pickup, drop], { color: 'blue', weight: 4, opacity: 0.7 }).addTo(map);
//         map.fitBounds([pickup, drop], { padding: [40, 40] });
//     }

//     function clearRoute() {
//         if (routePolyline) {
//             map.removeLayer(routePolyline);
//             routePolyline = null;
//         }
//     }

//     map.on('click', (e) => {
//         if (!pickupMarker) setPickup(e.latlng);
//         else if (!dropMarker) setDrop(e.latlng);
//         else {
//             if (pickupMarker) map.removeLayer(pickupMarker);
//             if (dropMarker) map.removeLayer(dropMarker);
//             pickupMarker = dropMarker = null;
//             clearRoute();
//             setPickup(e.latlng);
//         }
//     });

//     /* -------------------------
//        Saved locations
//        -------------------------*/
//     const LOCAL_STORAGE_LOC_KEY = 'vaahan_saved_locations';

//     async function loadSavedLocations() {
//         if (!savedLocationsEl) {
//             console.warn('No #savedLocations element in DOM');
//             return;
//         }

//         let arr = null;
//         if (RIDER_ID) {
//             try {
//                 const r = await safeFetch(`/rider/${RIDER_ID}/locations`, { method: 'GET' });
//                 if (r.ok && r.data) {
//                     arr = r.data.locations || r.data || [];
//                     if (!Array.isArray(arr)) arr = [];
//                 }
//             } catch (e) {
//                 console.warn('backend locations failed', e);
//             }
//         }

//         if (!Array.isArray(arr) || arr.length === 0) {
//             try {
//                 const saved = localStorage.getItem(LOCAL_STORAGE_LOC_KEY);
//                 arr = saved ? JSON.parse(saved) : [];
//             } catch (e) { arr = []; }
//         }

//         savedLocationsEl.innerHTML = '';
//         if (!arr || arr.length === 0) {
//             savedLocationsEl.innerHTML = '<div class="muted">No saved locations yet</div>';
//             return;
//         }

//         arr.forEach(loc => {
//             const item = document.createElement('div');
//             item.className = 'item';
//             const label = loc.label || loc.name || '-';
//             const address = loc.address || '-';
//             const lat = loc.latitude ?? loc.lat ?? (loc.latlng?.lat) ?? '-';
//             const lng = loc.longitude ?? loc.lng ?? (loc.latlng?.lng) ?? '-';
//             item.innerHTML = `
//                 <div>
//                     <div style="font-weight:700">${label}</div>
//                     <div class="small muted">${address}</div>
//                     <div class="small muted">${(Number(lat).toFixed ? Number(lat).toFixed(5) : lat)}, ${(Number(lng).toFixed ? Number(lng).toFixed(5) : lng)}</div>
//                     <button class="small ghost btn-use-loc" data-lat="${lat}" data-lng="${lng}">Use</button>
//                 </div>
//             `;
//             savedLocationsEl.appendChild(item);
//         });

//         savedLocationsEl.querySelectorAll('.btn-use-loc').forEach(b => {
//             b.addEventListener('click', () => {
//                 const lat = parseFloat(b.dataset.lat);
//                 const lng = parseFloat(b.dataset.lng);
//                 if (Number.isNaN(lat) || Number.isNaN(lng)) return alert('Invalid coordinates');
//                 setDrop({ lat, lng });
//                 map.setView([lat, lng], 14);
//             });
//         });
//     }

//     if (formSaveLocation) {
//         formSaveLocation.addEventListener('submit', async (ev) => {
//             ev.preventDefault();
//             const payload = {
//                 label: (locLabel.value || '').trim(),
//                 address: (locAddress.value || '').trim(),
//                 latitude: parseFloat(locLat.value),
//                 longitude: parseFloat(locLng.value)
//             };
//             if (!payload.label || !payload.address || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
//                 alert('Please provide valid location details');
//                 return;
//             }

//             let saved = false;
//             if (RIDER_ID) {
//                 try {
//                     const r = await safeFetch(`/rider/${RIDER_ID}/locations`, {
//                         method: 'POST',
//                         body: JSON.stringify(payload)
//                     });
//                     if (r.ok) saved = true;
//                 } catch (e) {
//                     console.warn('save location backend error', e);
//                 }
//             }

//             if (!saved) {
//                 try {
//                     const arr = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LOC_KEY)) || [];
//                     arr.unshift(payload);
//                     localStorage.setItem(LOCAL_STORAGE_LOC_KEY, JSON.stringify(arr));
//                     saved = true;
//                 } catch (e) {
//                     console.error('local save failed', e);
//                 }
//             }

//             if (saved) {
//                 await loadSavedLocations();
//                 formSaveLocation.reset();
//             } else {
//                 alert('Failed to save location');
//             }
//         });
//     }

//     /* -------------------------
//        Logout
//        -------------------------*/
//     logoutBtn?.addEventListener('click', async () => {
//         try {
//             await safeFetch('/auth/logout', { method: 'POST' });
//         } catch (e) { /* ignore */ }
//         localStorage.removeItem('user');
//         window.location.href = '/public/login.html';
//     });

//     /* -------------------------
//        Startup
//        -------------------------*/
//     (async function startup() {
//         await loadSavedLocations();
//     })();
// });
