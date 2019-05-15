/*global process, exports*/

/* Nastavení cest ke složkám a souborům. */

(function (ns, _isBuild) {

    var PATHS = {
        //cesta ke zdrojovým HTML souborům
        HTML_INPUT: "/",
        //složka pro uložení aktuální verze HTML souborů
        //(používá se, pokud se přepíná vývojová a produkční verze pomocí Gulpu,
        //nebo při kopírování obsahu mezi dokumenty)
        HTML_SAVE: "../htmlsave",

        //soubor pro načítání CSS souborů
        CSS_LOAD: "dev/load-css.js",
        //složka s CSS soubory
        CSS_FILES: "css",
        //složka s CSS komponenty
        CSS_COMPONETS: "css/components",
        //složka pro vytvoření souboru spojených CSS souborů
        CSS_OUTPUT: "build",
        //složka pro načítání souborů pomocí @import
        CSS_IMPORT: "dev/cssimport",

        //soubor pro načítání JS souborů
        JS_LOAD: "dev/load-js.js",
        //složka s JS soubory
        JS_FILES: "js",
        //složka s JS moduly
        JS_MODULES: "js/modules",
        //složka pro vytvoření souboru spojených JS souborů
        JS_OUTPUT: "build",

        //složka s použitými knihovnami a pluginy
        LIBS_FILES: "libs",

        //složka pro vytvoření Critical CSS
        CRITICAL_OUTPUT: "critical",

        //složka s obrázky pro optimalizace
        IMG_INPUT: "img/src",
        //složka pro vytvoření optimalizovaných obrázků
        IMG_OUTPUT: "img",

        //složka se vstupními soubory pro vytvoření SVG spritu
        SVG_INPUT: "img/svg-sprite/src",
        //složka pro vytvoření SVG spritu
        SVG_OUTPUT: "img/svg-sprite",

        //složka s šablonami pro generovaný kód
        GENERATOR_TEMPLATES: "dev/templates",
        //složka s daty pro šablony pro generovaný kód
        GENERATOR_TEMPLATES_DATA: "dev/templates/data"
    };


    ns.__dev = ns.__dev || {};
    ns.__dev.PATHS = ns.__dev.PATHS || PATHS;

    if (_isBuild) {

        //Nastavení sledování pro Gulp: CSS, JS, knihovny/pluginy, HTML
        PATHS.CSS_FILES_WATCH = PATHS.CSS_FILES + "/**/*.css";
        PATHS.JS_FILES_WATCH = PATHS.JS_FILES + "/**/*.js";

        PATHS.CSS_LIBS_FILES_WATCH = PATHS.LIBS_FILES + "/**/*.css";
        PATHS.JS_LIBS_FILES_WATCH = PATHS.LIBS_FILES + "/**/*.js";

        PATHS.HTML_FILES_WATCH = PATHS.LIBS_FILES + "*.html";

        exports.PATHS = PATHS;
    }

}((function (ns) { this[ns] = this[ns] || { toString: function () { return ns; } }; return this[ns]; }("MJNS")), typeof process !== "undefined" && process.versions != null && process.versions.node != null));
