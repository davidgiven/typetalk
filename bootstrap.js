(function () {
    "use strict";

    var remaining = 0;
    var scripts = {};
    function loaded_cb() {
        if ((remaining == 0) && (window.ts != undefined)) {
            var ts = scripts["bootstrap.ts"].text;
            var js = window.ts.transpile(ts);
            new Function(js)();
        }
    }

    var allscripts = document.getElementsByTagName("SCRIPT");
    for (var i = 0; i < allscripts.length; i++) {
        (function () {
            var script = allscripts[i];
            if (script.getAttribute("type") == "typescript-lib") {
                remaining++;
                var x = new XMLHttpRequest();
                x.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        if (this.status == 200) {
                            script.text = this.responseText;
                            script.leafName = script.src.replace(/.*\//, "");
                            scripts[script.leafName] = script;
                            remaining--;
                            loaded_cb();
                        } else {
                            console.log("bootstrap failed for " + script.src);
                        }
                    }
                };
                x.open("GET", script.src, true);
                x.send();
            }
        })();
    }

    window.addEventListener("load", loaded_cb);
})();
