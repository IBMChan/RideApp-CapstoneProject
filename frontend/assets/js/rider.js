// rider.js - Rider dashboard UI + features
// Guard: run only once DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  /* -------------------------
     Elements & helpers
     -------------------------*/
  const tabs = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab');
  const userNameEl = document.getElementById('userName');
  const btnLogout = document.getElementById('btnLogout');
  // Book UI
  const pickupInput = document.getElementById('pickupInput');
  const dropInput = document.getElementById('dropInput');
  const pickupCoordsEl = document.getElementById('pickupCoords');
  const dropCoordsEl = document.getElementById('dropCoords');
  const btnCreate = document.getElementById('btnCreateRide');
  const btnSwap = document.getElementById('btnSwap');
  const matchResult = document.getElementById('matchResult');
  const fareDistanceSummary = document.getElementById('fareDistanceSummary');
  // Right-side areas
  const requestsArea = document.getElementById('requestsArea');
  // Features
  const formSaveLocation = document.getElementById('formSaveLocation');
  const locLabel = document.getElementById('locLabel');
  const locAddress = document.getElementById('locAddress');
  const locLat = document.getElementById('locLat');
  const locLng = document.getElementById('locLng');
  const btnClearLoc = document.getElementById('btnClearLoc');
  const savedLocationsEl = document.getElementById('savedLocations');
  const formLostItem = document.getElementById('formLostItem');
  const lostRideId = document.getElementById('lostRideId');
  const lostDescription = document.getElementById('lostDescription');
  const lostItemsList = document.getElementById('lostItemsList');
  const formShareRide = document.getElementById('formShareRide');
  const shareRideId = document.getElementById('shareRideId');
  const shareEmail = document.getElementById('shareEmail');
  const shareResult = document.getElementById('shareResult');
  const formSOS = document.getElementById('formSOS');
  const sosEmail = document.getElementById('sosEmail');
  const sosResult = document.getElementById('sosResult');
  // Profile
  const profileCard = document.getElementById('profileCard');
  const profileForm = document.getElementById('profileForm');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  const btnEditProfile = document.getElementById('btnEditProfile');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  // Map setup (Leaflet)
  const initialCenter = [20.5937, 78.9629];
  const map = L.map('map', { center: initialCenter, zoom: 5 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  let pickupMarker = null, dropMarker = null;
  let routePolyline = null; // NEW: for route drawing

  /* -------------------------
     Auth & API helpers
     -------------------------*/
  function getUser() {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  }
  const USER = getUser();
  const RIDER_ID = USER?.user_id || null;
  const AUTH_TOKEN = USER?.token || null;
  const RIDE_ID = null;
  const API_BASE = window.RIDE_API_BASE || 'http://localhost:3000/api';
  function authHeaders(json = true) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    if (AUTH_TOKEN) h['Authorization'] = 'Bearer ' + AUTH_TOKEN;
    return h;
  }
  async function safeFetch(path, opts = {}) {
    // opts: {method, headers, body}
    const url = path.startsWith('http') ? path : (API_BASE + path);
    const merged = {
      credentials: 'include',
      ...opts,
      headers: { ...(opts.headers || {}), ...(opts.headers && opts.headers['Content-Type'] === undefined ? {} : {}) }
    };
    // do not override Content-Type if user passed
    try {
      const res = await fetch(url, merged);
      const text = await res.text();
      // try parse JSON
      try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
      catch { return { ok: res.ok, status: res.status, data: text }; }
    } catch (e) {
      console.error('Network error', e);
      return { ok: false, error: e };
    }
  }
  function showTempMessage(containerEl, msg, isError = false) {
    if (!containerEl) return;
    containerEl.textContent = msg;
    containerEl.style.color = isError ? '#b91c1c' : '';
    setTimeout(() => {
      if (containerEl.textContent === msg) containerEl.textContent = '';
    }, 4000);
  }
  /* -------------------------
     Map helpers
     -------------------------*/
  function setPickup(latlng, labelText = 'Pickup') {
    if (pickupMarker) map.removeLayer(pickupMarker);
    pickupMarker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup(labelText).openPopup();
    pickupMarker.on('dragend', () => {
      const p = pickupMarker.getLatLng();
      pickupCoordsEl.textContent = `Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)}`;
      if (dropMarker) drawRoute(pickupMarker.getLatLng(), dropMarker.getLatLng());
    });
    pickupCoordsEl.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
    if (dropMarker) drawRoute(pickupMarker.getLatLng(), dropMarker.getLatLng());
  }
  function setDrop(latlng, labelText = 'Drop') {
    if (dropMarker) map.removeLayer(dropMarker);
    dropMarker = L.marker(latlng, { draggable: true, icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconAnchor: [12, 41] }) })
      .addTo(map).bindPopup(labelText).openPopup();
    dropMarker.on('dragend', () => {
      const p = dropMarker.getLatLng();
      dropCoordsEl.textContent = `Lat: ${p.lat.toFixed(6)}, Lng: ${p.lng.toFixed(6)}`;
      if (pickupMarker) drawRoute(pickupMarker.getLatLng(), dropMarker.getLatLng());
    });
    dropCoordsEl.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`;
    if (pickupMarker) drawRoute(pickupMarker.getLatLng(), dropMarker.getLatLng());
  }

  // DRAW ROUTE: Draws a blue line on the map between pickup and drop
  function drawRoute(pickup, drop) {
    if (routePolyline) {
      map.removeLayer(routePolyline);
      routePolyline = null;
    }
    if (pickup && drop) {
      routePolyline = L.polyline([pickup, drop], { color: 'blue', weight: 4, opacity: 0.7 }).addTo(map);
      map.fitBounds([pickup, drop], { padding: [40, 40] });
    }
  }
  // CLEAR ROUTE
  function clearRoute() {
    if (routePolyline) {
      map.removeLayer(routePolyline);
      routePolyline = null;
    }
  }

  map.on('click', (e) => {
    if (!pickupMarker) setPickup(e.latlng);
    else if (!dropMarker) { setDrop(e.latlng); map.fitBounds([pickupMarker.getLatLng(), dropMarker.getLatLng()], { padding: [40, 40] }); }
    else { 
      map.removeLayer(pickupMarker);
      map.removeLayer(dropMarker);
      pickupMarker = dropMarker = null;
      clearRoute(); // Also clear the line when removing both markers
      setPickup(e.latlng);
    }
  });

  // Geocoding (Nominatim)
  async function geocode(query) {
    if (!query || query.trim().length < 2) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      return await res.json();
    } catch (e) {
      console.error('geocode error', e);
      return [];
    }
  }
  // Autocomplete dropdown
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
      dd.style.left = rect.left + 'px';
      dd.style.top = (rect.bottom + window.scrollY) + 'px';
      dd.style.width = inputEl.offsetWidth + 'px';
      dd.style.background = '#fff';
      dd.style.border = '1px solid #e6eef8';
      dd.style.borderRadius = '8px';
      dd.style.boxShadow = '0 6px 18px rgba(15,23,42,0.06)';
      dd.style.maxHeight = '220px';
      dd.style.overflow = 'auto';
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
          el.innerHTML = `<div style="font-weight:600">${item.display_name.split(',')[0]}</div><div class="small muted">${item.display_name}</div>`;
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
  // attach autocompletes
  attachAutocomplete(pickupInput, (loc) => { setPickup({ lat: loc.lat, lng: loc.lng }); map.setView([loc.lat, loc.lng], 14); });
  attachAutocomplete(dropInput, (loc) => { setDrop({ lat: loc.lat, lng: loc.lng }); if (pickupMarker) map.fitBounds([pickupMarker.getLatLng(), { lat: loc.lat, lng: loc.lng }], { padding: [40, 40] }); else map.setView([loc.lat, loc.lng], 14); });

  /* -------------------------
     Ride creation + Requests
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
      pickupMarker = null; dropMarker = null;
      clearRoute();
      if (dCoords) setPickup(dCoords);
      if (pCoords) setDrop(pCoords);
    }
  });

  btnCreate.addEventListener('click', async () => {
    const pickupLatLng = pickupMarker ? pickupMarker.getLatLng() : null;
    const dropLatLng = dropMarker ? dropMarker.getLatLng() : null;
    if (!pickupLatLng || !dropLatLng) return alert('Please specify both pickup and drop locations.');
    btnCreate.disabled = true; btnCreate.textContent = 'Requesting...'; matchResult.textContent = '';
    fareDistanceSummary.innerHTML = ''; // clear previous summary
    try {
      const pickup = { lat: parseFloat(pickupLatLng.lat.toFixed(6)), lng: parseFloat(pickupLatLng.lng.toFixed(6)) };
      const drop = { lat: parseFloat(dropLatLng.lat.toFixed(6)), lng: parseFloat(dropLatLng.lng.toFixed(6)) };
      const resp = await RideAPI.createRide(pickup, drop);
      if (resp && resp.success) {
        matchResult.innerHTML = `<div><strong>${resp.message}</strong></div>`;
        // If matched drivers were returned, show summary
        const assignments = resp.data?.matchedDrivers?.assignments || [];
        if (assignments.length > 0) {
          const first = assignments[0];
          matchResult.innerHTML += `<div class="small muted">Found ${first.drivers.length} nearby drivers. Ride id: ${resp.data.ride_id}</div>`;
        }
        // Show distance and fare from response
        const ride = resp.data?.ride;
        if (ride) {
          fareDistanceSummary.innerHTML = `
            <div>
              <strong>Fare:</strong> ₹${ride.fare ?? '-'} &nbsp;
              <strong>Distance:</strong> ${ride.distance ?? '-'} km
            </div>
          `;
          fareDistanceSummary.style.display = 'block';
        } else {
          fareDistanceSummary.innerHTML = '';
        }
        loadRequests();
        switchTab('requests');
      } else {
        fareDistanceSummary.innerHTML = '';
        alert('Failed to create ride: ' + (resp?.message || JSON.stringify(resp)));
      }
    } catch (e) {
      fareDistanceSummary.innerHTML = '';
      console.error('create ride err', e);
      alert('Error creating ride: ' + e.message);
    } finally {
      btnCreate.disabled = false; btnCreate.textContent = 'Request Ride';
    }
  });

  async function loadRequests() {
    requestsArea.innerHTML = '<div class="muted small">Loading...</div>';
    try {
      const resp = await RideAPI.listRides();
      if (!resp || !resp.success) { requestsArea.innerHTML = '<div class="muted">No requests found.</div>'; return; }
      const rides = (resp.data && resp.data.rides) ? resp.data.rides : resp.data || [];
      if (!rides || rides.length === 0) { requestsArea.innerHTML = '<div class="muted">No ride requests found.</div>'; return; }
      requestsArea.innerHTML = '';
      // Save into global for feature forms
      window.__CURRENT_RIDES = rides;
      rides.forEach(r => {
        const it = document.createElement('div');
        it.className = 'item';
        const pickup = tryParse(r.pickup_loc) || r.pickup_loc;
        const drop = tryParse(r.drop_loc) || r.drop_loc;
        const ridePin = r.ride_pin ? `<div class="ride-pin">PIN: ${r.ride_pin}</div>` : '';
        it.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px">
            <div>
              <div style="font-weight:700">Ride #${r.ride_id}</div>
              <div class="small muted">${pickup ? `Pickup: ${formatLatLng(pickup)}` : ''}</div>
              <div class="small muted">${drop ? `Drop: ${formatLatLng(drop)}` : ''}</div>
              ${ridePin}
            </div>
            <div style="margin-left:auto;text-align:right">
              <div class="small muted">Fare: ${r.fare || '-'}</div>
              <div class="status ${r.status || ''}">${r.status || 'unknown'}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="small ghost btn-view" data-id="${r.ride_id}">View</button>
            <button class="small ghost btn-cancel" data-id="${r.ride_id}">Cancel</button>
          </div>
        `;
        requestsArea.appendChild(it);
      });
      // attach handlers
      requestsArea.querySelectorAll('.btn-view').forEach(b => {
        b.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          fareDistanceSummary.innerHTML = ''; // clear prev
          clearRoute();
          const rr = await RideAPI.getRide(id);
          if (rr && rr.success && rr.data && rr.data.ride) {
            const ride = rr.data.ride;
            const pu = tryParse(ride.pickup_loc) || ride.pickup_loc;
            const dr = tryParse(ride.drop_loc) || ride.drop_loc;
            if (pu) setPickup(pu);
            if (dr) setDrop(dr);
            if (pu && dr) {
              drawRoute(pu, dr); // Draw route on view
            }
            // Optionally show fare & distance (reusing logic)
            if (ride.fare != null && ride.distance != null) {
              fareDistanceSummary.innerHTML = `
                <div>
                  <strong>Fare:</strong> ₹${ride.fare ?? '-'} &nbsp;
                  <strong>Distance:</strong> ${ride.distance ?? '-'} km
                </div>
              `;
              fareDistanceSummary.style.display = 'block';
            }
            switchTab('book');
          } else alert('Failed to fetch ride details');
        });
      });
      requestsArea.querySelectorAll('.btn-cancel').forEach(b => {
        b.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          if (!confirm('Cancel this ride?')) return;
          const rr = await RideAPI.cancelRide(id);
          if (rr && rr.success) {
            alert('Ride cancelled');
            loadRequests();
          } else alert('Unable to cancel ride');
        });
      });
    } catch (e) {
      console.error(e); requestsArea.innerHTML = '<div class="muted">Failed to load requests</div>';
    }
  }

  function formatLatLng(obj) {
    try {
      if (!obj) return '';
      if (typeof obj === 'string') {
        const parsed = tryParse(obj);
        if (parsed) obj = parsed;
      }
      const lat = obj.lat ?? obj.latitude ?? (obj[0] || null);
      const lng = obj.lng ?? obj.longitude ?? (obj[1] || null);
      if (lat == null || lng == null) return JSON.stringify(obj).slice(0, 60);
      return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    } catch (e) { return ''; }
  }

  function tryParse(s) {
    if (!s) return null;
    try {
      if (typeof s === 'object') return s;
      return JSON.parse(s);
    } catch (e) { return null; }
  }
  /* -------------------------
     Features: Saved locations
     -------------------------*/
  async function loadSavedLocations() {
    savedLocationsEl.innerHTML = '<div class="muted small">Loading...</div>';
    if (!RIDErIdCheck()) return savedLocationsEl.innerHTML = '<div class="muted">No user</div>';
    try {
      const { ok, data } = await safeFetch(`/rider/${RIDER_ID}/locations`, { method: 'GET', headers: authHeaders() });
      if (!ok || !data) {
        // backend may not implement GET; if so, show server response or message
        savedLocationsEl.innerHTML = `<div class="muted small">Unable to load saved locations.</div>`;
        return;
      }
      // data may be { success:true, locations: [...] } or direct array
      const arr = data.locations || data.data || data || [];
      if (!Array.isArray(arr) || arr.length === 0) {
        savedLocationsEl.innerHTML = '<div class="muted">No saved locations yet</div>';
        return;
      }
      savedLocationsEl.innerHTML = '';
      arr.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'item';
        const label = loc.label || loc.name || '-';
        const address = loc.address || '-';
        const lat = loc.latitude ?? loc.lat ?? (loc.latlng?.lat) ?? '-';
        const lng = loc.longitude ?? loc.lng ?? (loc.latlng?.lng) ?? '-';
        item.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700">${label}</div>
              <div class="small muted">${address}</div>
              <div class="small muted">${Number(lat).toFixed ? Number(lat).toFixed(5) : lat}, ${Number(lng).toFixed ? Number(lng).toFixed(5) : lng}, ${label}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
              <button class="small ghost btn-use-loc" data-lat="${lat}" data-lng="${lng}">Use</button>
            </div>
          </div>
        `;
        savedLocationsEl.appendChild(item);
      });
      // attach use handlers
      savedLocationsEl.querySelectorAll('.btn-use-loc').forEach(b => {
        b.addEventListener('click', () => {
          const lat = parseFloat(b.dataset.lat);
          const lng = parseFloat(b.dataset.lng);
          // dropInput.value = b.dataset.label;
          setDrop({ lat, lng });
          map.setView([lat, lng], 14);
        });
      });
    } catch (e) {
      console.error('loadSavedLocations', e);
      savedLocationsEl.innerHTML = '<div class="muted">Error loading locations</div>';
    }
  }
  formSaveLocation?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!RIDErIdCheck()) return;
    const payload = {
      label: locLabel.value.trim(),
      address: locAddress.value.trim(),
      latitude: parseFloat(locLat.value),
      longitude: parseFloat(locLng.value)
    };
    if (!payload.label || !payload.address || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
      alert('Please provide valid location details');
      return;
    }
    try {
      const res = await safeFetch(`/rider/${RIDER_ID}/locations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showTempMessage(savedLocationsEl, 'Location saved — reloading...', false);
        locLabel.value = locAddress.value = locLat.value = locLng.value = '';
        await loadSavedLocations();
      } else {
        console.warn(res);
        alert('Failed to save location');
      }
    } catch (e) {
      console.error(e); alert('Error saving location');
    }
  });
  btnClearLoc?.addEventListener('click', () => {
    locLabel.value = ''; locAddress.value = ''; locLat.value = ''; locLng.value = '';
  });
  /* -------------------------
     Features: Lost items
     -------------------------*/
  formLostItem?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!RIDErIdCheck()) return;
    const rideIdVal = Number(lostRideId.value);
    const desc = lostDescription.value.trim();
    if (!rideIdVal || !desc) return alert('Provide ride id and description');
    try {
      const res = await safeFetch(`/rider/lost-items/${RIDER_ID}/${rideIdVal}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ description: desc })
      });
      if (res.ok) {
        showTempMessage(lostItemsList, 'Lost item reported', false);
        lostRideId.value = ''; lostDescription.value = '';
        // you can optionally show server response
        const el = document.createElement('div'); el.className = 'item'; el.innerHTML = `<div><strong>Reported</strong><div class="small muted">${desc}</div></div>`;
        lostItemsList.prepend(el);
      } else {
        console.warn(res); showTempMessage(lostItemsList, 'Failed to report lost item', true);
      }
    } catch (e) {
      console.error(e); showTempMessage(lostItemsList, 'Error reporting lost item', true);
    }
  });
  /* -------------------------
     Features: Share ride (email)
     -------------------------*/
  formShareRide?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!RIDErIdCheck()) return;
    const targetEmail = shareEmail.value.trim();
    const rideIdVal = shareRideId.value ? Number(shareRideId.value) : null;
    if (!targetEmail) return alert('Provide recipient email');
    try {
      const payload = { recipientEmail: targetEmail };
      if (rideIdVal) payload.rideId = rideIdVal;
      const res = await safeFetch(`/rider/share-ride-email/${RIDER_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showTempMessage(shareResult, 'Ride status shared via email', false);
        shareEmail.value = shareRideId.value = '';
      } else {
        console.warn(res); showTempMessage(shareResult, 'Failed to share ride', true);
      }
    } catch (e) {
      console.error(e); showTempMessage(shareResult, 'Error sharing ride', true);
    }
  });
  /* -------------------------
     Features: SOS
     -------------------------*/
  formSOS?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!RIDErIdCheck()) return;
    const targetEmail = sosEmail.value.trim();
    if (!targetEmail) return alert('Provide emergency contact email');
    try {
      const res = await safeFetch(`/rider/sos/${RIDER_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ recipientEmail: targetEmail })
      });
      if (res.ok) {
        showTempMessage(sosResult, 'SOS sent', false);
        sosEmail.value = '';
      } else {
        console.warn(res); showTempMessage(sosResult, 'Failed to send SOS', true);
      }
    } catch (e) {
      console.error(e); showTempMessage(sosResult, 'Error sending SOS', true);
    }
  });
  /* -------------------------
     Profile: view / edit
     -------------------------*/
  async function loadProfile() {
    if (!RIDErIdCheck()) return;
    try {
      const resp = await safeFetch(`/rider/profile/${RIDER_ID}`, { method: 'GET', headers: authHeaders() });
      if (!resp.ok) {
        profileCard.innerHTML = `<div class="muted">Unable to load profile</div>`;
        return;
      }
      const data = resp.data;
      // some APIs may wrap user in data.rider or data.user
      const userData = data.rider || data.user || data;
      profileCard.innerHTML = `
        <h3>${userData.full_name || '—'}</h3>
        <p><strong>Role:</strong> ${userData.role || (USER?.role || 'rider')}</p>
        <p><strong>Email:</strong> ${userData.email || '—'}</p>
        <p><strong>Phone:</strong> ${userData.phone || '—'}</p>
      `;
      // prefill form
      profileName.value = userData.full_name || '';
      profileEmail.value = userData.email || '';
      profilePhone.value = userData.phone || '';
    } catch (e) {
      console.error('profile load err', e); profileCard.innerHTML = `<div class="muted">Error loading profile</div>`;
    }
  }
  btnEditProfile?.addEventListener('click', () => {
    profileCard.style.display = 'none';
    profileForm.style.display = 'block';
  });
  btnCancelEdit?.addEventListener('click', () => {
    profileForm.style.display = 'none';
    profileCard.style.display = 'block';
  });
  profileForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!RIDErIdCheck()) return;
    const payload = { full_name: profileName.value, email: profileEmail.value, phone: profilePhone.value };
    try {
      const resp = await safeFetch(`/rider/profile/${RIDER_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        alert('Profile saved successfully');
        profileForm.style.display = 'none'; profileCard.style.display = 'block';
        loadProfile();
      } else {
        console.warn(resp); alert('Failed to save profile');
      }
    } catch (e) {
      console.error(e); alert('Error saving profile');
    }
  });
  /* -------------------------
     Tabs + init
     -------------------------*/
  function switchTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    tabPanels.forEach(p => p.style.display = (p.id === name ? 'block' : 'none'));
    if (name === 'requests') loadRequests();
    if (name === 'features') { loadSavedLocations(); /* maybe refresh other features if needed */ }
    if (name === 'profile') loadProfile();
  }
  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  // Logout
  btnLogout?.addEventListener('click', async () => {
    try { await safeFetch('/auth/logout', { method: 'POST', headers: authHeaders() }); } catch (e) { /* ignore */ }
    localStorage.removeItem('user');
    window.location.href = "../public/login.html";
  });
  /* -------------------------
     Utilities & startup
     -------------------------*/
  function RIDErIdCheck() {
    if (!RIDErIdCheck._ok) {
      if (!RIDER_ID) {
        alert('User not logged in (missing rider id). Please login.');
        window.location.href = "../public/login.html";
        return false;
      }
      RIDErIdCheck._ok = true;
    }
    return true;
  }
  // show logged in name
  userNameEl.textContent = USER?.full_name ? USER.full_name : 'Rider';
  // Initial tab
  switchTab('book');
  // initial load of requests & profile (so requests shows even if user stays on book)
  loadRequests();
  loadProfile();
});
