/*global process, document, exports*/

/* Soubor slouží k načítání a spojování CSS souborů.
 * Pokud je soubor spuštěn v prohlížeči, vloží do stránky
 * vývojové soubory pomocí elementů link. Pokud je spuštěn
 * v Node.js, vrátí objekt s nastavením pro spojení souborů.
 *
 * Do objektu FILES se jako název vlastnosti zadá název
 * spojeného souboru a jako její hodnota se zadá pole
 * s cestami k souborům.
 *
 * Soubory je možné spojit gulp-taskem css. Výstupní složka
 * se nastavuje v /dev/PATHS.js (PATHS.CSS_OUTPUT).
 *
 * Pokud se používá tento soubor i pro vývoj, pak je potřeba,
 * aby element script měl atribut data-files, do kterého se
 * zadají názvy polí souborů oddělené čárkou, které se mají
 * pro danou stránku použit. (Není-li atribut zadán, použije
 * se první hodnota.) Do stránky se také musí vložit
 * /dev/PATHS.js.
 *
 * Mají-li se použít různé soubory pro různá media, pak je
 * možné přidat atribut data-media, do kterého se zadají
 * hodnoty pro atribut media elementů link oddělené čárkou.
 * Počet hodnot musí odpovídat počtu souborů.
 *
 * K dispozi jsou funkce pro vytvoření cest k souborům podle
 * nastavení v /dev/PATHS.js:
 *
 * file(): CSS soubory stránky
 *     relativePathToCSSFiles (String): cesta relativní
 *          k PATHS.CSS_FILES
 *
 * comp(): CSS komponenty
 *     relativePathToComponents (String): cesta relativní
 *          k PATHS.CSS_COMPONENTS
 *
 * lib(): CSS soubory knihoven a pluginů
 *     relativePathToLibsFiles (String): cesta relativní
 *          k PATHS.LIBS_FILES
 *
 * Cesty zadávejte bez počátečního lomítka.
 *  */

(function (file, comp, lib, _insert, _isBuild) {

    var FILES = {
            "all.build.css": [
                file("reset.css"),
                file("main.css"),
                file("utility.css"),

                comp("ui.css"),

                comp("btn.css"),
                comp("controller.css"),

                comp("section.css"),
                comp("section-intro.css"),
                comp("section-text.css"),
                comp("section-disclaimer.css"),
                comp("section-general-info.css"),
                comp("section-exercises.css"),
                comp("section-exercise.css"),
                comp("section-exercise-table.css"),
                comp("section-exercise-eye-exercises.css")
            ],

            "print.build.css": [
                file("print.css")
            ]
        };

    return _isBuild ? (exports.files = FILES) : _insert(FILES);
}(

    function (relativePathToCSSFiles /*String*/) {
        return this.MJNS.__dev.PATHS.CSS_FILES + "/" + relativePathToCSSFiles;
    },

    function (relativePathToComponents /*String*/) {
        return this.MJNS.__dev.PATHS.CSS_COMPONETS + "/" + relativePathToComponents;
    },

    function (relativePathToLibsFiles /*String*/) {
        return this.MJNS.__dev.PATHS.LIBS_FILES + "/" + relativePathToLibsFiles;
    },


    function (files) {

        var self = document.querySelector("[src=\"" + this.MJNS.__dev.PATHS.CSS_LOAD + "\"]"),
            fileNames = self.getAttribute("data-files") || Object.keys(files)[0],
            medias = (self.getAttribute("data-media") || "screen").split(/\s*,\s*/);

        fileNames = JSON.parse(JSON.stringify(fileNames.split(/\s*,\s*/)));

        fileNames.forEach(function (fileName, i) {

            if (files[fileName]) {

                files[fileName].forEach(function (file) {
                    document.write("<link rel=\"stylesheet\" href=\"" + file + "\" media=\"" + medias[i] + "\">");
                });
            }
        });
    },


    typeof process !== "undefined" && process.versions != null && process.versions.node != null
));
