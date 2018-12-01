// Expose a wrapper around `fetch()` for JSON payloads
window.jsonFetch = (route, payload, method = "GET") => {
    return new Promise((resolve, reject) => {
        method = method.toUpperCase();
        var opts = {
            method: method
        };
        if (method === "POST") {
            opts.headers = {
                "Content-Type": "application/json"
            };
            opts.body = JSON.stringify(payload);
        }
        fetch(route, opts)
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
