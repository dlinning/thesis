// Expose a wrapper around `fetch()` for JSON payloads.
//
// Also incorporates a simple client-side cache for requests,
// so we're not refetching the same data rapidly (within 500ms).
//

let jsonCache = {};

window.jsonFetch = (route, payload, method = "GET") => {
    return new Promise((resolve, reject) => {
        method = method.toUpperCase();

        // Only check the cache for GET requests.
        if (method == "GET" && jsonCache[route] != undefined) {
            resolve(jsonCache[route]);
        }

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
                // Add to cache if performing a GET request only.
                if (method === "GET") {
                    jsonCache[route] = asJson;
                    setTimeout(() => {
                        delete jsonCache[route];
                    }, 500);
                }

                // Return the JSON response
                resolve(asJson);
            })
            .catch(err => {
                reject(err);
            });
    });
};
