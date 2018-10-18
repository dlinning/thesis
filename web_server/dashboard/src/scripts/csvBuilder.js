(() => {
    var csvBuilder = {};

    csvBuilder.build = (el, title = "output") => {
        if (el !== undefined) {
            var table = el.querySelector(".table");

            if (table !== undefined) {
                console.log(`CsvBuilder Running for element with id=${el.id}`);

                var startTime = Date.now();
                var csv = "";

                table.childNodes.forEach(row => {
                    var rowCsv = "";
                    row.childNodes.forEach(cell => {
                        let val = cell.getAttribute("alt") || cell.innerText;
                        rowCsv += val.toString().trim() + ",";
                    });
                    console.log(rowCsv);

                    csv += rowCsv.slice(0, -1) + "\n";
                });

                var endTime = Date.now() - startTime;

                console.log(`CSV Generated in ${endTime}ms`);

                var filename = title + ".csv";
                fileDownloader.downloadToDevice(csv, { type: "text/plain;charset=utf-8" }, filename);
            } else {
                console.error("Error: No .table exists as child of DataTable");
            }
        }
    };

    window.csvBuilder = csvBuilder;
})();
