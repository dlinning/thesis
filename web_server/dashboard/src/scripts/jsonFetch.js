// Expose a wrapper around `fetch()` for JSON payloads
window.jsonFetch = (route, method, payload) => {
    return new Promise((resolve, reject) => {
        fetch(route, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                return response.json();
            })
            .then(asJson => {
                resolve(asJson);
            })
            .catch(err => {
                reject(err);
            });
    });
};
