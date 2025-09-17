/* ride.js
   Low-level helper functions to talk to backend ride endpoints.
   Uses fetch with credentials included so cookie auth works.
*/

const RideAPI = (function () {
    const BASE = window.RIDE_API_BASE || 'http://localhost:3000/api';

    async function req(path, opts = {}) {
        // read token from localStorage if present
        let token = null;
        try {
            const u = localStorage.getItem("user");
            if (u) token = JSON.parse(u)?.token;
        } catch (e) { /* ignore */ }

        // build headers intelligently
        const headers = Object.assign({}, opts.headers || {});
        if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
        if (token && !headers['Authorization']) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch(BASE + path, {
            credentials: 'include',
            ...opts,
            headers
        });

        const text = await res.text();
        try { return JSON.parse(text); }
        catch { return text; }
    }

    return {
        // create ride POST /api/rides/create
        createRide: (pickup, drop) => req('/rides/create', {
            method: 'POST',
            body: JSON.stringify({ pickup_loc: pickup, drop_loc: drop })
        }),

        // accept ride (driver) POST /api/rides/accept/:ride_id
        acceptRide: (ride_id) => req(`/rides/accept/${ride_id}`, { method: 'POST' }),

        // cancel ride POST /api/rides/cancel/:ride_id
        cancelRide: (ride_id) => req(`/rides/cancel/${ride_id}`, { method: 'POST' }),

        // history GET /api/rides/history
        getHistory: () => req('/rides/history'),

        // list GET /api/rides/list
        listRides: () => req('/rides/list'),

        // get by id
        getRide: (ride_id) => req(`/rides/${ride_id}`),
    };
})();
