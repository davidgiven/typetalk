(function () {
    "use strict";

    var remaining = 0;
    var scripts = {};
    function loaded_cb() {
        if ((remaining == 0) && (window.ts != undefined)) {
            var ts = scripts["bootstrap.ts"].text;
            var js = window.ts.transpileModule(ts, {
                extendedDiagnostics: true,
                noEmitHelpers: true,
                strict: true,
                target: window.ts.ScriptTarget.ES2015,
            });
            new Function(js.outputText)();
        }
    }

    var allscripts = document.getElementsByTagName("SCRIPT");
    for (var i = 0; i < allscripts.length; i++) {
        (function () {
            var script = allscripts[i];
            var type = script.getAttribute("type");
            if (type && type.startsWith("typetalk-")) {
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
