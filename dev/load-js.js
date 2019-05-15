
/*global process, document, exports*/

/* Soubor slouží k načítání a spojování JS souborů.
 * Pokud je soubor spuštěn v prohlížeči, vloží do stránky
 * vývojové soubory pomocí elementů script. Pokud je spuštěn
 * v Node.js, vrátí objekt s nastavením pro spojení souborů.
 *
 * Do objektu FILES se jako název vlastnosti zadá název
 * spojeného souboru a jako její hodnota se zadá pole
 * s cestami k souborům.
 *
 * Soubory je možné spojit gulp-taskem js. Výstupní složka
 * se nastavuje v /dev/PATHS.js (PATHS.JS_OUTPUT).
 *
 * Pokud se používá tento soubor i pro vývoj, pak je potřeba,
 * aby element script měl atribut data-files, do kterého se
 * zadají názvy polí souborů oddělené čárkou, které se mají
 * pro danou stránku použit. (Není-li atribut zadán, použije
 * se první hodnota.) Do stránky se také musí vložit
 * /dev/PATHS.js.
 *
 * K dispozi jsou funkce pro vytvoření cest k souborům podle
 * nastavení v /dev/PATHS.js:
 *
 * file(): JS soubory stránky
 *     relativePathToJSFiles (String): cesta relativní
 *          k PATHS.JS_FILES
 *
 * comp(): JS moduly
 *     relativePathToModules (String): cesta relativní
 *          k PATHS.JS_MODULES
 *
 * lib(): JS soubory knihoven a pluginů
 *     relativePathToLibsFiles (String): cesta relativní
 *          k PATHS.LIBS_FILES
 *
 * Cesty zadávejte bez počátečního lomítka.
 *  */

(function (file, mod, lib, _insert, _isBuild) {

    var FILES = {
            "all.build.js": [
                //lib("svg4everybody/dist/svg4everybody.js"),
                lib("fulltilt.js"),
                lib("parallax.js"),
                lib("gsap/easing/CustomEase.min.js"),
                lib("lottie-web-master/build/player/lottie.min.js"),

                file("GLOBALS.js"),

                file("Tweens/SectionTextShowBtnTween.js"),
                file("Tweens/SectionTextHideBtnTween.js"),

                mod("BreakText.js"),

                mod("Fullscreen.js"),

                mod("Controller.js"),

                mod("SectionNavigator.js"),
                mod("SectionParallax.js"),

                mod("Section.js"),
                mod("SectionText.js"),
                mod("SectionIntro.js"),
                mod("SectionDisclaimer.js"),
                mod("SectionGeneralInfo.js"),
                mod("SectionExercises.js"),
                mod("SectionExercise.js"),
                mod("SectionExerciseRelax.js"),
                mod("SectionExerciseTable.js"),
                mod("SectionExerciseAccommodation.js"),
                mod("SectionExerciseEyeExercises.js"),
                mod("SectionOutro.js"),

                file("init.js")
            ]
        };

    return _isBuild ? (exports.files = FILES) : _insert(FILES);
}(

    function (relativePathToJSFiles /*String*/) {
        return this.MJNS.__dev.PATHS.JS_FILES + "/" + relativePathToJSFiles;
    },

    function (relativePathToModules /*String*/) {
        return this.MJNS.__dev.PATHS.JS_MODULES + "/" + relativePathToModules;
    },

    function (relativePathToLibsFiles /*String*/) {
        return this.MJNS.__dev.PATHS.LIBS_FILES + "/" + relativePathToLibsFiles;
    },


    function (files) {

        var self = document.querySelector("[src$=\"" + this.MJNS.__dev.PATHS.JS_LOAD + "\"]"),
            fileNames = self.getAttribute("data-files") || Object.keys(files)[0];

        fileNames = JSON.parse(JSON.stringify(fileNames.split(/\s*,\s*/)));

        fileNames.forEach(function (fileName) {

            if (files[fileName]) {

                files[fileName].forEach(function (file) {
                    document.write("<script src=\"" + file + "\"></script>");
                });
            }
        });
    },


    typeof process !== "undefined" && process.versions != null && process.versions.node != null
));
