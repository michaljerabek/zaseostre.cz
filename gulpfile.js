/*jslint indent: 4, white: true, nomen: true, unparam: true, node: true, browser: true, devel: true, plusplus: true, regexp: true, sloppy: true, vars: true, esversion: 6 */

/* Nastavení tasků pro Gulp.
 *
 *  0. Pomocné funkce a globální moduly.
 *  1. WATCH (Sledování změn souborů.)
 *  2. BUILD (Spojení JS a CSS + použití produkčích elementů.)
 *  3. PROD / DEV (Přepnutí produkčních a vývojových elementů.)
 *  4. COPY (Kopírovnání mezi HTML soubory.)
 *  5. EDIT (Editování HTML souborů.)
 *  6. HTMLSAVE (Uložení HTML souborů před změnami pomocí Gulpu.)
 *  7. CSS (Spojení CSS souborů.)
 *  8. COMP (Vygenerování CSS komponentu.)
 *  9. JS (Spojení JS souborů.)
 * 10. MOD (Vygenerování JS modulu.)
 * 11. GENERATE (Vygenerování statického kódu.)
 * 12. SVG-SPRITE (Vytvoření SVG spritu.)
 * 13. CRITICAL-CSS (Vytvoření Critical CSS.)
 * 14. IMAGES-OPTIMIZATION (Optimalizace / zmenšení velikosti obrázků.)
 *
 * ! Musíte mít nainstalovaný Node.js a NPM.
 * Nainstalování potřebných modulů: npm install.
 *
 * Nastavení NPM je v package.json. Je zde vytovřený npm-skript
 * pro použítí lokálního Gulpu. Jednotlivé tasky tak můžete spustit
 * příkazem npm run gulp [task] (například: npm run gulp css).
 * Pokud task umožňuje použití nějakých argumentů, je možné je přidat
 * za dvě pomlčky: npm run gulp [task] -- --[argument] [hodnota?]
 * (například npm run gulp critical --width 768 nebo --inline).
 *
 * Seznam modulů: gulp gulp-replace gulp-rename gulp-concat gulp-clean-css gulp-rewrite-css
 * critical gulp-uglify gulp-imagemin imagemin-mozjpeg gulp-svg-sprite yargs fse gulp-file
 * twig xml2js yamljs csvjson (ejs? handlebars?)
 *
 * !!! Tasky je nutné spouštět postupně. (Paralelní zpracování není nijak řešeno.)
 * */


/***Pomocné funkce***/
/*Načte modul, pokud je k dispozci.*/
let requireModule = (moduleName) => { try { return require(moduleName); } catch (e) { return function () {}; } };
/*Odtraní modul z cache a načte ho znovu.*/
let requireUncached = function (_module) { delete require.cache[require.resolve(_module)]; return require(_module); };


/***Globální moduly***/
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

const yargs = require("yargs");

const gulp = requireModule("gulp");
/* Přejmenování souborů. */
const rename = requireModule("gulp-rename");
/*Spojení souborů*/
const concat = requireModule("gulp-concat");
/*Úpravy souborů regexpem*/
const gReplace = requireModule("gulp-replace");


/*Nastavení cest ke zdrojovým souborům a cest pro vytvoření výstupů.*/
const PATHS = requireUncached(path.resolve("dev/PATHS.js")).PATHS;

/*Přepsat cesty "/" na process.cwd().*/
for (let path in PATHS) {

    if (PATHS.hasOwnProperty(path) && PATHS[path] === "/") {

        PATHS[path] = process.cwd();
    }
}

/* --------------------------------- WATCH --------------------------------- */


/* Task pro sledování změn CSS a JS souborů.
 * Pokud se nějakých soubor změní, dojde k automatickému spojení. Sledovány
 * jsou sobory ve složkách pro CSS (PATHS.CSS_FILES) a JS (PATHS.JS_FILES)
 * a pro knihovny/pluginy (PATHS.LIBS_FILES). Task se také změní při úpravě
 * souborů /dev/load-css.js a /dev/load-js.js.
 *
 * Nastavení cest pro sledování je v /dev/PATHS.js.
 * */

gulp.task("watch", () => {

    gulp.watch([
        path.resolve(PATHS.CSS_LOAD),
        path.resolve(PATHS.CSS_FILES_WATCH),
        path.resolve(PATHS.CSS_LIBS_FILES_WATCH)
    ], ["css"]);

    gulp.watch([
        path.resolve(PATHS.JS_LOAD),
        path.resolve(PATHS.JS_FILES_WATCH),
        path.resolve(PATHS.JS_LIBS_FILES_WATCH)
    ], ["js"]);
});


/* --------------------------------- BUILD --------------------------------- */


/* Spustí tasky css, js a prod. Více informací je v příslušných sekcích.
 * Spojí styly a skripty, odkomentuje produkční soubory a zakomentuje
 * vývojové soubory.
 */

gulp.task("build", ["css", "js", "prod"]);


/* --------------------------------- PROD / DEV --------------------------------- */


/* Zakomentuje/odkomentuje produkční/vývojové soubory v HTML dokumentech.
 * Elementy pro produkční verzi jsou vložené mezi komentáři <!--prod--><!--/prod-->
 * a elementy pro vývojové verzi jsou vložené mezi komentáři <!--dev--><!--/dev-->.
 *
 * Task dev zakomentuje elementy mezi komentáři <!--prod--><!--/prod-->
 * a odkomentuje elementy mezi komentáři <!--dev--><!--/dev-->.
 *
 * Task prod zakomentuje elementy mezi komentáři <!--dev--><!--/dev-->
 * a odkomentuje elementy mezi komentáři <!--prod--><!--/prod-->.
 *
 * Protože dochází k přepsání produkčních HTML souborů, pri úpravě se vytvoří
 * složka PATHS.HTML_SAVE, do které se zkopíruje aktuální stav. (Složku je možné
 * odstranit taskem clearsave. Poslední uložený stav lze zachovat pmocí
 * clearsave --last.)
 *
 * Je také možné použít argument --last pro zachování pouze posledního uložení
 * nebo argument --clear pro odstranění všech přechozích. Argumentem --save-dir
 * lze nastavit název (pod)složky.
 *
 * Argumenty:
 * save-dir (String): název (pod)složky pro uložení HTML souborů
 * clear (flag): odstranit předchozí uložené dokumenty
 * last (flag): zachovat pouze poslední uložené dokumenty
 *
 * Seznam modulů: gulp yarg gulp-replace
 * */

gulp.task("prod", () => {

    if (yargs.argv.last && !yargs.argv.clear) {

        preserveOnlyLastHTMLSave();
    }

    if (yargs.argv.clear) {

        clearHTMLSave();
    }

    switchToEnv("prod");
});

gulp.task("dev", () => {

    if (yargs.argv.last && !yargs.argv.clear) {

        preserveOnlyLastHTMLSave();
    }

    if (yargs.argv.clear) {

        clearHTMLSave();
    }

    switchToEnv("dev");
});

function switchToEnv(env) {

    gulp.src(path.resolve(PATHS.HTML_INPUT, "*.html"))
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${yargs.argv.saveDir || Date.now()}`))
        )
        //odkomentovat soubory pro dané prostředí
        .pipe(uncommentTag(env === "dev" ? "dev" : "prod"))
        //zakomentovat soubory pro dané prostředí
        .pipe(commentTag(env === "dev" ? "prod" : "dev"))
        //přepsat soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_INPUT))
        );
}

function wrapWithTag(tagName, content) {

    let startTag = `<!--${tagName}-->`,
        endTag = `<!--/${tagName}-->`;

    return `${startTag}\n\t${content}\n\t${endTag}`;
}

function getTagRegExp(tagName) {

    let startTag = `<!--${tagName}-->`,
        endTag = `<!--/${tagName}-->`;

    return new RegExp(`(?:${startTag})([\\s\\S]*?)(?:${endTag})`, "gi");
}

function uncommentTag(tagName) {

    return gReplace(getTagRegExp(tagName), (match, p1) => wrapWithTag(tagName, `${p1.trim().split("\n").map(line => line.trim().replace(/(<\!--\s*)|(\s*-->)/g, "")).join("\n\t")}`));
}

function commentTag(tagName) {

    return gReplace(getTagRegExp(tagName), (match, p1) =>
        //Pokud blok již obsahuje komentář, pak se nic nezmění.
        //Předpokládá se, že již k zakomentování došlo.
        ~p1.indexOf("<!--") ? match : wrapWithTag(tagName, `${p1.trim().split("\n").map(line => line.trim() ? `<!--${line.trim()}-->` : "").join("\n\t")}`)
    );
}


/* --------------------------------- COPY --------------------------------- */


/* Zkopíruje sekci komponent nebo element z jednoho HTML dokumentu do jiného.
 *
 * !!! Použití na vlastní nebezpečí!
 *
 * Komponenty jsou označené:
 * <!--––––––––– ** COMPONENT ** –––––––––-->
 * <!--––––––––– // COMPONENT // –––––––––-->
 *
 * Sekce jsou označené:
 * <!--———————————— SECTION ————————————-->
 *
 * Pro zkopírování sekce se použíje argument --section, pro zkopírování
 * komponentu --component a pro zkopírování elementu --element. Hodnotou
 * argumentu je název/selektor. (Pokud se jedná o komponent založený na
 * jiném, je potřeba před znak "|" přidat "\".)
 *
 * V případě komponentů se zkopíruje celý obsah od počátečního komentáře až
 * po konečný komentář.
 *
 * V případě sekcí se zkopíruje obsah začínající komentářem až po začátek
 * dalšího komentáře pro další sekci nebo po konečný tag head nebo body.
 *
 * V případě elementů se zkopíruje element s celým jeho obsahem.
 *
 * Zdrojový dokument se nastaví argumentem --from a dokumenty pro nahrazení
 * se nastaví argumentem --to.
 *
 * Protože dochází k přepsání produkčních HTML souborů, pri úpravě se vytvoří
 * složka PATHS.HTML_SAVE, do které se zkopíruje aktuální stav. (Složku je možné
 * odstranit taskem clearsave. Poslední uložený stav lze zachovat pmocí
 * clearsave --last.)
 *
 * Je také možné použít argument --last pro zachování pouze posledního uložení
 * nebo argument --clear pro odstranění všech přechozích. Argumentem --save-dir
 * lze nastavit název (pod)složky.
 *
 * Příklad — zkopírování sekce JAVASCRIPT z index.html do subpage.html
 * a subpage2.html:
 * gulp copy --section javascript --from index.html --to subpage.html,subpage2.html
 *
 * Příklad — zkopírování komponentu MAIN-NAV z index.html do všech ostatních
 * dokumentů:
 * gulp copy --component main-nav --from index.html --to *.html
 *
 * Příklad — zkopírování elementu .main-nav z index.html do všech ostatních
 * dokumentů:
 * gulp copy --element ".main-nav" --from index.html
 *
 * Příklad — zkopírování elementů #nav .link z index.html do subpage.html tak, aby
 * n-tý nalezený element v --from nahrazoval n-tý elmenent v --to:
 * gulp copy --each --element "#nav .link" --from index.html --to subpage.html
 *
 * Příklad — zkopírování elementu .header z index.html, kde má ale každá stránka
 * vlastní vnitřní element h2, který chceme zachovat.
 * gulp copy --element ".header" --from index.html
 * --run "$after.find('h2').replaceWith($before.find('h2'))"
 *
 * Argumenty:
 * section, s (String): název nahrazované sekce
 * component, c (String): název nahrazovaného komponentu
 * element, e (String): selektor nahrazovaného elementu
 * replace, r (String): název sekce nebo komponentu nebo selektor elementu, který se má
 *     přepsat, pokud se nepřepisuje stejná sekce, komponent nebo element jako zdrojový
 * replace-component, rc (String): název komponentu, kterým se má přepsat elementem
 * replace-element, re (String): název elementu, kterým se má přepsat komponentem
 * after, a (String): název sekce, za kterou se má sekce vložit; název komponentu,
 *     za který se má komponent vložit; název elementu, za který se má elementu vložit
 * before, b (String): název sekce, před kterou se má sekce vložit; název komponentu,
 *     před který se má komponent vložit; název elementu, před který se má elementu vložit
 * after-component, ac (String): název komponentu, za který se má vložit element
 * before-component, bc (String): název komponentu, před který se má vložit element
 * after-element, ae (String): název elementu, za který se má vložit komponent
 * before-element, be (String): název elementu, před který se má vložit komponent
 *
 * from (String): zdrojový soubor
 * to (String): soubory, které se mají upravit oddělené čárkou (výchozí "*.html")
 *
 * run, r (String): kód, který se spustí pomocí eval po přepsání/vložení elementu;
 *     - --replace: k dispozici jsou proměnné $before (kód před změnou) a $after
 *       (po změně)
 *     - --after, --before: k dispozici jsou proměnné $target (cílový element)
 *       a $inserted (vložený element)
 * each, (flag): přepíše elementy jeden po druhém
 *     (první nalezený ve zdrojovým souboru nahradí první nalezený v upravovaném)
 * x-comment, xc (flag): nehledat uzavírací element
 * x-nl (flag): nepřídávat volný řádek mezi vložený a cílový element.
 *     Pouze pro --before a --after.
 * nl (flag):  přidat volný řádek na opačné straně vkládaného elementu.
 *    Pouze pro --before a --after.
 * format, f (String): výsledná podoba kódu po vložení/přepsání elementu,
 *    pro správné vložení volných řádků
 *    -> co bude před ním a co za ním; Hodnoty se oddělují znakem: |.
 *    - C = komponent
 *    - S = sekce
 *    - E = element
 *    -> např: "C|E" = před bude komponent, za element
 *    Pouze pro --replace/before/after-element, --replace/before/after-component.
 *
 * save-dir (String): název (pod)složky pro uložení HTML souborů
 * clear (flag): odstranit předchozí uložené dokumenty
 * last (flag): zachovat pouze poslední uložené dokumenty
 *
 * Seznam modulů: gulp yarg gulp-replace gulp-cheerio
 */

//"jQuery pro Node.js"
const cheerio = requireModule("gulp-cheerio");

gulp.task("copy", () => {

    if (yargs.argv.last && !yargs.argv.clear) {

        preserveOnlyLastHTMLSave();
    }

    if (yargs.argv.clear) {

        clearHTMLSave();
    }

    let from = yargs.argv.from,
        to = yargs.argv.to || "*.html",

        source = yargs.argv.component || yargs.argv.c || yargs.argv.section || yargs.argv.s || yargs.argv.element || yargs.argv.e,
        replace = yargs.argv.replace || yargs.argv.r, //nahradit jiný element/sekci/komponent než source
        replaceComponent = yargs.argv.replaceComponent || yargs.argv.rc, //nahradit komponent elementem
        replaceElement = yargs.argv.replaceElement || yargs.argv.re, //nahradit element komponentem
        before = yargs.argv.before || yargs.argv.b, //vložit sekci před sekci / komponent před komponent / element před element
        after = yargs.argv.after || yargs.argv.a, //vložit sekci za sekci / komponent za komponent / element za element
        beforeComponent = yargs.argv.beforeComponent || yargs.argv.bc, //vložit element před komponent
        afterComponent = yargs.argv.afterComponent || yargs.argv.ac, //vložit element za komponent
        beforeElement = yargs.argv.beforeElement || yargs.argv.be, //vložit komponent před element
        afterElement = yargs.argv.afterElement || yargs.argv.ae, //vložit komponent za element

        //--element
        each = yargs.argv.each, //nahrazovat způsobem první nalezený ve from nahradí první nalezený v to
        run = yargs.argv.run || yargs.argv.r, //spustit kód po přepsání
        noClosingComment = yargs.argv.xComment || yargs.argv.xc, //nahradit bez ukončujícího komentáře
        noNewLine = yargs.argv.xNl, //nepřidávat nový řádek
        oppositeNewLine = yargs.argv.nl, //přidat nový řádek i na opačné straně

        saveDir = yargs.argv.saveDir || Date.now(),

        filesToRewrite = [
            ...to.split(",").map(toFile => path.resolve(PATHS.HTML_INPUT, toFile.trim())),
        ];

        if (to.match(/\*.html/)) {

            filesToRewrite.push("!" + path.resolve(PATHS.HTML_INPUT, from));
        }

    //spouštět gReplace pouze pro první nalzený komponent/sekci
    let gReplaceRun = false;

    //přepsat/vložit component <!--––––––––– ** COMPONENT ** –––––––––-->?
    if (yargs.argv.component || yargs.argv.c) {

        if (replaceElement || afterElement || beforeElement) {

            gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
                //najít obsah pro vložení
                .pipe(
                    gReplace(getHTMLComponentRegExp(source), match => {

                        if (gReplaceRun) {

                            return;
                        }

                        gReplaceRun = true;

                        if (replaceElement) {

                            replaceHTMLElementWithComponent(filesToRewrite, replaceElement, match, saveDir);

                        } else {

                            insertHTMLComponentNextToElement(filesToRewrite, !!beforeElement, beforeElement || afterElement, match, saveDir);
                        }
                    }
                ));

        } else if (after || before) {

            gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
                //najít obsah pro vložení
                .pipe(
                    gReplace(getHTMLComponentRegExp(source), match => {

                        if (gReplaceRun) {

                            return;
                        }

                        gReplaceRun = true;

                        insertHTMLComponent(filesToRewrite, !!before, before || after, match, saveDir);
                    })
                );

            } else {

                 gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
                //najít obsah pro přepsání a přepsat
                .pipe(
                    gReplace(getHTMLComponentRegExp(source), match => {

                        if (gReplaceRun) {

                            return;
                        }

                        gReplaceRun = true;

                        replaceHTMLComponent(filesToRewrite, replace || source, match, saveDir);
                    })
                );
        }

    //přepsat/vložit sekci <!--———————————— SECTION ————————————-->?
    } else if (yargs.argv.section || yargs.argv.s) {

        if (after || before) {

            gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
                //najít obsah pro vložení
                .pipe(
                    gReplace(getHTMLSectionRegExp(source), (match, startTag, content) => {

                        if (gReplaceRun) {

                            return;
                        }

                        gReplaceRun = true;

                        insertHTMLSection(filesToRewrite, !!before, before || after, startTag + content, saveDir);
                    })
                );

        } else {

            gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
            //najít obsah pro přepsání a přepsat
                .pipe(
                    gReplace(getHTMLSectionRegExp(source), (match, startTag, content) => {

                        if (gReplaceRun) {

                            return;
                        }

                        gReplaceRun = true;

                        replaceHTMLSection(filesToRewrite, replace || source, startTag + content, saveDir);
                    })
                );
        }

    //přepsat/vložit element?
    } else if (yargs.argv.element || yargs.argv.e) {

        if (afterComponent || beforeComponent || replaceComponent) {

            gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
                .pipe(
                    cheerio({
                        run: $ => {
                            let $content = $(source),
                                comment = noClosingComment ? null: findClosingComment($content),
                                content = $.html($content);

                            comment = comment ? $.html(comment) : null;

                            if (replaceComponent) {

                                replaceHTMLComponentWithElement(filesToRewrite, replaceComponent, content, comment, saveDir);

                            } else {

                                insertHTMLElementNextToComponent(filesToRewrite, !!beforeComponent, beforeComponent || afterComponent, content, comment, saveDir);
                            }
                        },
                        parserOptions: {
                            normalizeWhitespace: false,
                            decodeEntities: false
                        }
                    })
                );

        } else if (after || before) {

            gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
                .pipe(
                    cheerio({
                        run: $ => insertHTMLElement(filesToRewrite, !!before, source, before || after, $(source), !!each, run, !noClosingComment, noNewLine, oppositeNewLine, saveDir),
                        parserOptions: {
                            normalizeWhitespace: false,
                            decodeEntities: false
                        }
                    })
                );

        } else {

            gulp.src(path.resolve(PATHS.HTML_INPUT, from), {base: "./"})
                .pipe(
                    cheerio({
                        run: $ => replaceHTMLElement(filesToRewrite, source, replace, $(source), !!each, run, saveDir),
                        parserOptions: {
                            normalizeWhitespace: false,
                            decodeEntities: false
                        }
                    })
                );
        }
    }
});

/* Vrátí RegExp pro nalezení komponentu.
 *
 * componentName (String): název komponentu
 * whiteSpace (Boolean): včetně mezer
 */
function getHTMLComponentRegExp(componentName, whiteSpace) {

    let startTag = `<!--––––––––– \\*\\* ${componentName} \\*\\* –––––––––-->`,
        endTag = `<!--––––––––– \\/\\/ ${componentName} \\/\\/ –––––––––-->`;

    return whiteSpace ? new RegExp(`([\\s]*${startTag})([\\s\\S]*?)(${endTag}[\\s]*)`, "gi") : new RegExp(`(${startTag})([\\s\\S]*?)(${endTag})`, "gi");
}

/* Vrátí RegExp pro nalezení sekce.
 *
 * sectionName (String): název sekce
 */
function getHTMLSectionRegExp(sectionName) {

    let startTag = `<!--———————————— ${sectionName} ————————————-->`,
        //sekce končí začátkem jiné nebo uzavíracím elementem head nebo body
        endTag = `(?:<!--————————————)|(?:<\/(?:head|body)>)`;

    return new RegExp(`(${startTag})([\\s\\S]*?)(${endTag})`, "gi");
}

/* Přepíše komponent ve vybranách souborech.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * componentName (String): název komponentu
 * content (String): nahrazovaný text
 *     (včetně otevíracího a uzavíracího komentáře)
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function replaceHTMLComponent(filesToRewrite, componentName, content, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //přepsat obsah
        .pipe(
            gReplace(getHTMLComponentRegExp(componentName), () => content)
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Vloží komponent do vybraných souborů před nebo za nějaký komponent.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * insertBefore (Boolean): true = vložet před komponent;
 *     false = vložit za komponent
 * componentName (String): název komponentu,
 *     před/za který se má komponent vložit
 * content (String): vkládaný komponent
 *     (včetně otevíracího a uzavíracího komentáře)
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function insertHTMLComponent(filesToRewrite, insertBefore, componentName, content, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //vložit komponent
        .pipe(
            gReplace(getHTMLComponentRegExp(componentName), match => {

                //odsazení vkládaného komponentu
                let contentIndent = getComponentIndentation(content),

                    //odsazení obsahu cílového komponentu
                    matchIndent = getComponentIndentation(match);

                //nahradit odsazení vkládaného komponentu odsazením cílového komponentuu
                content = changeIndentation(content, contentIndent, matchIndent);

                if (insertBefore) {

                    return `${content}\n\n\n${matchIndent}${match}`;
                }

                return `${match}\n\n\n${matchIndent}${content}`;
            })
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Přepíše sekce ve vybranách souborech.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * sectionName (String): název sekce
 * content (String): nahrazovaný text
 *     (bez uzavírací značky - konec head nebo body nebo začátek jiné sekce)
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function replaceHTMLSection(filesToRewrite, sectionName, content, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //přepsat obsah
        .pipe(
            gReplace(getHTMLSectionRegExp(sectionName), (match, s, c, endTag) => (endTag.match(/head|body/) ? content.replace(/\n[ ]*$/, "\n") : content) + endTag)
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Vloží sekci do vybraných souborů před nebo za nějakou sekci.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * insertBefore (Boolean): true = vložet před sekci;
 *     false = vložit za sekci
 * componentName (String): název sekce,
 *     před/za kterou se má sekce vložit
 * content (String): vkládaná sekce
 *     (bez uzavírací značky - konec head nebo body nebo začátek jiné sekce)
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function insertHTMLSection(filesToRewrite, insertBefore, sectionName, content, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //vložit sekci
        .pipe(
            gReplace(getHTMLSectionRegExp(sectionName), (match, startTag, matchContent, endTag) => {

                if (insertBefore) {

                    return `${content}${match}`;
                }

                return `${startTag}${matchContent}${endTag.match(/head|body/) ? "\t" : ""}${endTag.match(/head|body/) ? content.replace(/\n[ ]*$/, "\n") : content}${endTag}`;
            })
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Přepíše elementy ve vybraných souborech.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * selector (String): selektor elementů
 * replaceSelector (String): selektor elementů,
 *     pokud se má přepsat jiný element než "selector"
 * $content (Object): nahrazované zdrojové elementy
 * useEach (Boolean): přepisovat postupně
 * runCode (String): kód spouštěný pomocí eval po přepsání
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function replaceHTMLElement(filesToRewrite, selector, replaceSelector, $content, useEach, runCode, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //upravit obsah
        .pipe(cheerio({
            run: ($, file) => {

                //úprava odsazení moc nedává smysl, ale funguje to líp než bez toho

                if (useEach) {

                    $(replaceSelector || selector).each((index, element) => {

                        let $before = $(element),

                            beforeIndent = getElementIndentation($, $before),
                            contentIndent = getElementIndentation($, $content.eq(index)),

                            contentHTML = $.html($content.eq(index));

                        if (runCode) {

                            let $after = $.load(contentHTML, {
                                normalizeWhitespace: false,
                                decodeEntities: false
                            }).root().children();

                            eval(runCode);

                            contentHTML = $.html($after.eq(0));
                        }

                        contentHTML = changeIndentation(contentHTML, contentIndent, beforeIndent);

                        $before.replaceWith(contentHTML);
                    });

                } else {

                    let $before = $(replaceSelector || selector),

                        beforeIndent = getElementIndentation($, $before.eq(0)),
                        contentIndent = getElementIndentation($, $content.eq(0)),

                        contentHTML = $.html($content.eq(0));

                    if (runCode) {

                        let $after = $.load(contentHTML, {
                            normalizeWhitespace: false,
                            decodeEntities: false
                        }).root().children();

                        eval(runCode);

                        contentHTML = $.html($after.eq(0));
                    }

                    contentHTML = changeIndentation(contentHTML, contentIndent, beforeIndent);

                    $before.replaceWith(contentHTML);
                }
            },
            parserOptions: {
                normalizeWhitespace: false,
                decodeEntities: false
            }
        }))
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Vloží element do vybraných souborů před nebo za nějaký element.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * insertBefore (Boolean): true = vložet před element;
 *     false = vložit za element
 * selector (String): selektor elementů
 * targetSelector (String): selektor elementu, před/za který se má
 *     element vložit
 * $content (Object): vkládané zdrojové elementy
 * useEach (Boolean): přepisovat postupně
 * runCode (String): kód spouštěný pomocí eval po přepsání
 * useClosingComment (Boolean): vložit včetně uzavíracího komentáře
 * noNewLine (Boolean): nevkládat volný řádek (při --after se vloží
 *     volný řádek před vkládaný element; při --before za něj)
 * oppositeNewLine (Boolean): vložit volný řádek i na druhou stranu
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function insertHTMLElement(filesToRewrite, insertBefore, selector, targetSelector, $content, useEach, runCode, useClosingComment, noNewLine, oppositeNewLine, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //upravit obsah
        .pipe(cheerio({
            run: ($, file) => {

                $(targetSelector).each((index, target) => {

                    runInsertHTMLElement($, target, index, useEach ? index : 0, selector, insertBefore, $content, useClosingComment, noNewLine, oppositeNewLine, runCode);
                });
            },
            parserOptions: {
                normalizeWhitespace: false,
                decodeEntities: false
            }
        }))
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

function runInsertHTMLElement($, target, tIndex, index, selector, insertBefore, $content, useClosingComment, noNewLine, oppositeNewLine, runCode) {

    if (!$content.eq(index).length) {

        return;
    }

    let $target = $(target),

        placeHTML = $.html($target),
        contentHTML = $.html($content.eq(index)),

        //odsazení vkládaného element
        contentIndent = getElementIndentation($, $content.eq(index)),
        //odsazení cílového elementu
        placeIndent = getElementIndentation($, $target);

    if (runCode) {

        let $inserted = $.load(contentHTML, {
            normalizeWhitespace: false,
            decodeEntities: false
        }).root().children();

        eval(runCode);

        contentHTML = $.html($inserted.eq(0));
    }

    //nahradit odsazení vkládaného elementu odsazením cílového elementu
    contentHTML = changeIndentation(contentHTML, contentIndent, placeIndent);

    //přidat případný uzavírací komentář
    let closingComment = useClosingComment ? findClosingComment($content.eq(index)) : null;

    if (closingComment) {

        contentHTML += "\n" + placeIndent + $.html(closingComment);
    }

    if (insertBefore) {

        $target.replaceWith(
            (oppositeNewLine ? "\n" + placeIndent : "") + contentHTML + (noNewLine ? "\n" : "\n\n") + placeIndent + placeHTML
        );

    } else {

        //pokud má cílový element uzavírací komentář -> nahradit pomocí tohoto komentáře (kvůli chybě ve volných řádcích)
        let comment = findClosingComment($target);

        if (comment) {

            let $comment = $target.parent().contents().filter(function() { return this === comment; });

            $comment.replaceWith(
                $.html($comment) + (noNewLine ? "\n" : "\n\n") + placeIndent + contentHTML + (oppositeNewLine ? "\n" : "")
            );
        } else {

            $target.replaceWith(
                placeHTML + (noNewLine ? "\n" : "\n\n") + placeIndent + contentHTML + (oppositeNewLine ? "\n" : "")
            );
        }
    }
}

/* Vloží element do vybraných souborů před nebo za nějaký komponent.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * insertBefore (Boolean): true = vložet před komponent;
 *     false = vložit za komponent
 * componentName (String): název komponentu
 * content (String): vkládaný obsah (element)
 * comment (String): případný uzavírací komentář
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function insertHTMLElementNextToComponent(filesToRewrite, insertBefore, componentName, content, comment, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //vložit element
        .pipe(
            gReplace(getHTMLComponentRegExp(componentName, true), function (match) {

                let contentHTML = content,

                    //odsazení vkládaného elementu
                    contentIndent = getElementIndentation(null, contentHTML),
                    //odsazení obsahu cílového komponentu
                    matchIndent = getComponentIndentation(match);

                contentIndent = contentIndent ? contentIndent[1] || "" : "";

                //nahradit odsazení vkládaného elementu odsazením cílového komponentuu
                contentHTML = changeIndentation(contentHTML, contentIndent, matchIndent);

                //přidat případný uzavírací komentář
                contentHTML = contentHTML + (comment ? `\n${matchIndent}${comment}` : "");

                if (insertBefore) {

                    return (prevHTMLWillBe("C|S") ? "\n" : "") + `\n\n${matchIndent}${contentHTML}${matchIndent}${match}`;
                }

                return `${match.replace(/\s*$/, "")}\n\n\n${matchIndent}${contentHTML}\n\n${(nextHTMLWillBe("C|S") ? "\n" : "") + match.match(/\n([ ]*?)$/)[1]}`;
            })
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Vloží element do vybraných souborů místo nějakého komponentu.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * componentName (String): název komponentu
 * content (String): vkládaný obsah (element)
 * comment (String): případný uzavírací komentář
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function replaceHTMLComponentWithElement(filesToRewrite, componentName, content, comment, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //vložit element
        .pipe(
            gReplace(getHTMLComponentRegExp(componentName, true), function (match) {

                let contentHTML = content,

                    //odsazení vkládaného elementu
                    contentIndent = getElementIndentation(null, contentHTML),
                    //odsazení obsahu cílového komponentu
                    matchIndent = getComponentIndentation(match);

                //nahradit odsazení vkládaného elementu odsazením cílového komponentuu
                contentHTML = changeIndentation(contentHTML, contentIndent, matchIndent);

                //přidat případný uzavírací komentář
                contentHTML = contentHTML + (comment ? `\n${matchIndent}${comment}` : "");

                return `\n\n${(prevHTMLWillBe("C|S") ? "\n" : "")}${matchIndent}${contentHTML}\n\n${(nextHTMLWillBe("C|S") ? "\n" : "") + match.match(/\n([ ]*?)$/)[1]}`;
            })
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Vloží komponent do vybraných souborů před nebo za nějaký element.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * insertBefore (Boolean): true = vložet před element;
 *     false = vložit za element
 * selector (String): selektor elementu
 * content (String): vkládaný obsah (komponent)
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function insertHTMLComponentNextToElement(filesToRewrite, insertBefore, selector, content, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //vložit element
        .pipe(
            cheerio({
                run: $ => {

                    let $target = $(selector),

                        targetHTML = $.html($target.eq(0)),
                        contentHTML = content,

                        //odsazení vkládaného komponentu
                        contentIndent = getComponentIndentation(contentHTML),
                        //odsazení cílového elementu
                        targetIndent = getElementIndentation($, $target);

                    //nahradit odsazení vkládaného elementu odsazením cílového elementu
                    contentHTML = changeIndentation(contentHTML, contentIndent, targetIndent);

                    if (insertBefore) {

                        $target.replaceWith(
                            (prevHTMLWillBe("C|S") ? "" : "\n" + targetIndent) + contentHTML + "\n\n\n" + targetIndent + targetHTML
                        );

                    } else {

                        //pokud má cílový element uzavírací komentář -> nahradit pomocí tohoto komentáře (kvůli chybě ve volných řádcích)
                        let comment = findClosingComment($target.eq(0));

                        if (comment) {

                            let $comment = $target.eq(0).parent().contents().filter(function() { return this === comment; });

                            $comment.replaceWith(
                                $.html($comment) + "\n\n\n" + targetIndent + contentHTML + (nextHTMLWillBe("S|C") ? "" : "\n")
                            );
                        } else {

                            $target.replaceWith(
                                targetHTML + "\n\n\n" + targetIndent + contentHTML + (nextHTMLWillBe("S|C") ? "" : "\n")
                            );
                        }
                    }

                },
                parserOptions: {
                    normalizeWhitespace: false,
                    decodeEntities: false
                }
            })
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Vloží kokmponent do vybraných souborů místo nějakého elementu.
 *
 * filesToRewrite (Array): pole souborů pro přepsání
 * selector (String): selektor elementu
 * content (String): vkládaný obsah (element)
 * saveDir (String): název složky pro uložení aktuálních souborů
 */
function replaceHTMLElementWithComponent(filesToRewrite, selector, content, saveDir) {

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${saveDir}`))
        )
        //vložit element
        .pipe(
            cheerio({
                run: $ => {

                    let $target = $(selector),

                        contentHTML = content,

                        //odsazení vkládaného komponentu
                        contentIndent = getComponentIndentation(contentHTML),
                        //odsazení cílového elementu
                        targetIndent = getElementIndentation($, $target);

                    //nahradit odsazení vkládaného komponentu odsazením cílového elementu
                    contentHTML = changeIndentation(contentHTML, contentIndent, targetIndent);

                    //pokud má cílový element uzavírací komentář -> nahradit pomocí tohoto komentáře (kvůli chybě ve volných řádcích)
                    let comment = findClosingComment($target.eq(0));

                    if (comment) {

                        let $comment = $target.eq(0).parent().contents().filter(function() { return this === comment; });

                        $target.replaceWith(
                            (prevHTMLWillBe("C|S") ? "" : "\n" + targetIndent) + contentHTML
                        );

                        $comment.remove();

                    } else {

                        $target.replaceWith(
                            (prevHTMLWillBe("C|S") ? "" : "\n" + targetIndent) + contentHTML + (nextHTMLWillBe("C|S") ? "" : "\n")
                        );
                    }
                },
                parserOptions: {
                    normalizeWhitespace: false,
                    decodeEntities: false
                }
            })
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
}

/* Najde první komentář za elementem.
 *
 * $el (Cheerio Object): element
 */
function findClosingComment($el) {

    let next = $el[0].next;

    while (next && next.type !== "tag") {

        if (next.type === "comment") {

            if (next.data.match(/^––––––––– \*\* |^––––––––– \/\/ |^———————————— /)) {

                return null;
            }

            return next.data.match(/\s*\/[.#]/) ? next: null;
        }

        next = next.next;
    }

    return null;
}

/* Zjistí odsazení elementu.
 *
 * $ (Function): Cheerio
 * $element (Cheerio Object): element
 */
function getElementIndentation($, $elementOrHTMLString) {

    let indent;

    if ($ && typeof $elementOrHTMLString !== "string") {

        indent = $.html($elementOrHTMLString.eq(0)).match(
            new RegExp(`\\n([ ]*?)<\\/${$elementOrHTMLString.eq(0)[0].name}>$`, "i")
        );

    } else if (typeof $elementOrHTMLString === "string") {

        indent = $elementOrHTMLString.match(
            new RegExp(`\\n([ ]*?)<\\/[a-z-]+>$`, "i")
        );
    }

    indent = indent ? indent[1] || "" : "";

    //pokud není odsazení, jedná se nejspíše o jednořádkový element -> zjistit u rodičovského
    if ($ && typeof $elementOrHTMLString !== "string" && !indent && $elementOrHTMLString.eq(0).parent().length) {

        indent = $.html($elementOrHTMLString.eq(0).parent()).match(
            new RegExp(`\\n([ ]*?)<\\/${$elementOrHTMLString.eq(0).parent()[0].name}>$`, "i")
        );

        indent = indent ? (indent[1] + "    ") || "    " : "    ";
    }

    return indent;
}

/* Zjistí odsazení komponentu.
 *
 * component (String): komponent
 */
function getComponentIndentation(component) {

    let indent = component.match(
        new RegExp(`\\n([ ]*?)<!--–––––––––${component.split(/<!--–––––––––/).pop().replace(/(\/|\|)/g, "\\$1")}$`, "i")
    );

    indent = indent ? indent[1] || "" : "";

    return indent;
}

/* Přepíše odsazení kódu.
 *
 * string (String): upravovaný kód
 * fromIndent (String): odsazení upravovaného kódu (mezery)
 * toIndent (String): požadované odsazení (mezery)
 */
function changeIndentation(string, fromIndent, toIndent) {

    return string.replace(new RegExp(`\\n${fromIndent}`, "g"), `\n${toIndent}`);
}

/* Zjistí zadaný stav obsahu před vkládaným obsahem.
 *
 * type (String): C (komponent), S (sekce), E (element);
 *    oddělené |
 */
function prevHTMLWillBe(type) {

    let format = yargs.argv.format || yargs.argv.f;

    if (!format) {

        return undefined;
    }

    format = format.split("|");

    let prev = format[0] || "";

    return !!prev.match(new RegExp(type, "i"));
}

/* Zjistí zadaný stav obsahu za vkládaným obsahem.
 *
 * type (String): C (komponent), S (sekce), E (element);
 *    oddělené |
 */
function nextHTMLWillBe(type) {

    let format = yargs.argv.format || yargs.argv.f;

    if (!format) {

        return undefined;
    }

    format = format.split("|");

    let next = format[1] || "";

    return !!next.match(new RegExp(type, "i"));
}

/* --------------------------------- EDIT --------------------------------- */


/* Editace HTML souborů pomocí cheerio.js ("jQuery pro Node.js").
 *
 * Argumentem --files se nastaví soubory pro editaci a argument --run se pak
 * spustí pomocí eval, kde je k dispozici funkce $ a objekt File (Gulp).
 *
 * Protože dochází k přepsání produkčních HTML souborů, pri úpravě se vytvoří
 * složka PATHS.HTML_SAVE, do které se zkopíruje aktuální stav. (Složku je možné
 * odstranit taskem clearsave. Poslední uložený stav lze zachovat pmocí
 * clearsave --last.)
 *
 * Je také možné použít argument --last pro zachování pouze posledního uložení
 * nebo argument --clear pro odstranění všech přechozích. Argumentem --save-dir
 * lze nastavit název (pod)složky.
 *
 * Příklad — přidat elementům .link atribut target="_blank":
 * gulp edit --files *.html --run '$(".link").attr("target", "_blank")'
 *
 * Upozornění: Cheerio nijak neformátuje výsledné úpravy. Zároveň ale může
 * rozbít formátování SVG.
 *
 * Argumenty:
 * files, f (String): soubory, které se mají upravit oddělené čárkou
 *     (výchozí "*.html")
 * run, r (String): kód cheerio, který se spustí pomocí eval
 * save-dir (String): název (pod)složky pro uložení HTML souborů
 * clear (flag): odstranit předchozí uložené dokumenty
 * last (flag): zachovat pouze poslední uložené dokumenty
 *
 * Web cheerio.js: https://cheerio.js.org/
 *
 * Seznam modulů: yarg gulp gulp-cheerio
 */

gulp.task("edit", () => {

    if (yargs.argv.last && !yargs.argv.clear) {

        preserveOnlyLastHTMLSave();
    }

    if (yargs.argv.clear) {

        clearHTMLSave();
    }

    let files = yargs.argv.files || yargs.argv.f || "*.html",
        run = yargs.argv.run || yargs.argv.r,

        filesToRewrite = files.split(",").map(toFile => path.resolve(PATHS.HTML_INPUT, toFile.trim()));

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${yargs.argv.saveDir || Date.now()}`))
        )
        //upravit obsah
        .pipe(cheerio({
            run: ($, file) => eval(run),
            parserOptions: {
                normalizeWhitespace: false,
                decodeEntities: false
            }
        }))
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );
});


/* --------------------------------- HTMLSAVE --------------------------------- */


/* Uloží všechny HTML soubory do PATHS.HTML_SAVE.
 * !!! Funkční pouze pro PATHS.HTML_INPUT.
 *
 * Argumenty:
 * dir (String) - název složky
 *
 * Seznam modulů: gulp fse yargs
 */

gulp.task("htmlsave", () => {

    let dir = `${yargs.argv.dir || Date.now()}`;

    gulp.src(path.resolve(PATHS.HTML_INPUT, "*.html"))
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, dir))
        );
});

/* Vrátí zpět poslední změny nebo změny ze složky vybrané v --dir.
 * !!! Funkční pouze pro PATHS.HTML_INPUT.
 *
 * Argumenty:
 * dir (String) - název složky
 *
 * Seznam modulů: gulp fse yargs
 */

gulp.task("recoversave", () => {

    let dirName = String(yargs.argv.dir || getNewestDirName());

    if (dirName && fs.statSync(path.resolve(PATHS.HTML_SAVE, dirName)).isDirectory()) {

        gulp.src(path.resolve(PATHS.HTML_SAVE, dirName, "*.html"))
            .pipe(
                gulp.dest(path.resolve(PATHS.HTML_INPUT))
            );
    }
});

/* Odstraní složku PATHS.HTML_SAVE nebo zachová pouze poslední uložení.
 * !!! Funkční pouze pro PATHS.HTML_INPUT.
 *
 * Argumenty:
 * last (flag) - zachovat poslední uložení
 *
 * Seznam modulů: gulp fse yargs
 */

gulp.task("clearsave", () => {

    if (yargs.argv.last) {

        preserveOnlyLastHTMLSave();

        return;
    }

    clearHTMLSave();
});

/* Zachová poslední uložení a zbytek odstraní.
 */
function preserveOnlyLastHTMLSave() {

    //Existuje složka s uloženými soubory?
    if (fs.statSync(path.resolve(PATHS.HTML_SAVE)).isDirectory()) {

        let subdirs = fs.readdirSync(path.resolve(PATHS.HTML_SAVE)),
            newestDirName = getNewestDirName();

        //odstranit starší než newestDir
        subdirs.forEach(name => name === newestDirName ? null: fse.removeSync(path.resolve(PATHS.HTML_SAVE, name)));
    }
}

/* Odstraní celou složku PATHS.HTML_SAVE.
 */
function clearHTMLSave() {

    fse.removeSync(path.resolve(PATHS.HTML_SAVE));
}

/* Vrátí název nejnovější složky.
 */
function getNewestDirName() {

    //Existuje složka s uloženými soubory?
    if (fs.statSync(path.resolve(PATHS.HTML_SAVE)).isDirectory()) {

        let subdirs = fs.readdirSync(path.resolve(PATHS.HTML_SAVE)),

            newestDir = {
                name: null,
                birthtimeMs: 0
            };

        //najdi nejnovější podsložku
        subdirs.forEach(name => {

            let stat = fs.statSync(path.resolve(PATHS.HTML_SAVE, name));

            if (stat.isDirectory() && (newestDir.name === null || stat.birthtimeMs > newestDir.birthtimeMs)) {

                newestDir.name = name;
                newestDir.birthtimeMs = stat.birthtimeMs;
            }
        });

        return newestDir.name;
    }

    return "";
}

/* --------------------------------- CSS --------------------------------- */


/* Spojuje CSS soubory podle /dev/load-css.js (PATHS.CSS_LOAD).
 * V tomto souboru je objekt FILES, kde se pro každý název souboru přiřadí
 * pole spojovaných souborů. Výsledné soubory se pak vytvoří do složky
 * PATHS.CSS_OUTPUT. (Bude zde minifikovaná i neminifikovaná verze.)
 *
 * Task také vytvoří soubor pro načítání souborů pomocí @import pro
 * testování webu s vypnutým JS do složky PATHS.CSS_IMPORT.
 *
 * Seznam modulů: gulp gulp-rename gulp-concat gulp-clean-css
 * gulp-rewrite-css
 * */

/*Minifikace CSS.*/
const cleanCSS = requireModule("gulp-clean-css");
/*Přepsání URL v CSS souborech.*/
const rewriteCSS = requireModule("gulp-rewrite-css");

gulp.task("css", () => {

    //Načte soubor /dev/load-css.js
    let cssLoad = requireUncached(path.resolve(PATHS.CSS_LOAD));

    for (let file in cssLoad.files) {

        let filesForFile = cssLoad.files[file];

        //Pokud je seznam souborů prázdné pole nebo null,
        //předchozí spojení se odstraní
        if (!filesForFile || !filesForFile.length) {

            removeEmptyCSSFiles(file);

            continue;
        }

        //Vytvoří spojené soubory do výstupní složky (PATHS.CSS_OUTPUT)
        generateCSSBuild(file, filesForFile);

        //Vytvoří soubor načítající CSS pomocí @import
        //pro testování při vypnutém JS
        generateCSSImport(file, filesForFile);
    }
});

/* Spojí soubory z files do souboru file a soubor vytvoří
 * do výstupní složky pro CSS (PATHS.CSS_OUTPUT).
 *
 * file (String): název výsledného souboru
 * files (Array[String]): pole vsupních souborů
 */
function generateCSSBuild(file, files) {

    gulp.src(files.map(file => path.resolve(file)))
        //přepsat URL externích zdrojů (obrázků) v CSS,
        //protože výstup je jinde než vývojové soubory
        .pipe(rewriteCSS({
            destination: PATHS.CSS_OUTPUT,
            adaptPath: function(ctx) {

                //ignorovat URL uvnitř SVG kódu
                if (ctx.targetFile.match(/%3C%2Fsvg%3E/)) {

                    return false;
                }

                return path.join(path.relative(ctx.destinationDir, ctx.sourceDir), ctx.targetFile);
            }
        }))
        //spojit soubory
        .pipe(concat(file))
        //vytovřít výstup
        .pipe(
            gulp.dest(path.resolve(PATHS.CSS_OUTPUT))
        )
        //minifikovat
        .pipe(cleanCSS({
            compatibility: "ie8,-properties.zeroUnits"
        }))
        //přidat příponu .min
        .pipe(rename(path => path.basename = `${file.split(/\//).pop().replace(/\.css$/, "")}.min`))
        //vytovřít výstup
        .pipe(
            gulp.dest(path.resolve(PATHS.CSS_OUTPUT))
        );
}

/* Odstraní soubou file ve výstupní složce pro CSS
 * a soubor ve výstupní složce pro @import.
 *
 * file (String): název souboru pro odstranění*/
function removeEmptyCSSFiles(file) {

    if (fs.existsSync(path.resolve(PATHS.CSS_OUTPUT, file))) {

        fs.unlinkSync(path.resolve(PATHS.CSS_OUTPUT, file));
        fs.unlinkSync(path.resolve(PATHS.CSS_OUTPUT, file.replace(/.css$/, ".min.css")));
    }

    if (fs.existsSync(path.resolve(PATHS.CSS_IMPORT, file))) {

        fs.unlinkSync(path.resolve(PATHS.CSS_IMPORT, file));
    }
}

/* Vygeneruje soubor pro načítání CSS pomocí @import
 * pro testování webu s vypnutým JS při vývoji.
 *
 * file (String): název výsledného souboru
 * files (Array[String]): pole vsupních souborů
 */
function generateCSSImport(file, files) {

    //vytvořit složku, pokud neexistuje
    if (!fs.existsSync(PATHS.CSS_IMPORT)) {

        fs.mkdirSync(PATHS.CSS_IMPORT);
    }

    //úroveň vnoření výstupní složky pro vytvoření správné URL
    let importPrefix = PATHS.CSS_IMPORT.replace(/^\/|\/$/g, "").split("/").length,

        //vytvořit obsahu souboru
        importContent = files.map(file => `@import url("${"../".repeat(importPrefix)}${file}");`).join("\n");

    //vytvořit soubor
    gFile(file, importContent, {src: true})
        .pipe(gulp.dest(PATHS.CSS_IMPORT));
}


/* --------------------------------- COMP --------------------------------- */


/* Vygeneruje soubor se základním kódem pro vytvoření CSS komponentu.
 *
 * Argumenty:
 * name, n (String): název komponentu
 * sections, section, s (String): sekce komponentu (Elementy podle BEM)
 * x-mq (flag): nevkládat základní @media breakpointy
 *     (založené na x-desktop apod.)
 * x-colors (flag): nevkládat základní základní barvy
 *     (založené na color-primary apod.)
 * dir, d (String): složka pro vytvoření souboru
 *     (relativní k PATHS.CSS_COMPONENTS)
 * rewrite (flag): přepsat existující komponent
 * mq-source (String): zdrojový soubor @media (Výchozí: utility.css;
 *     regexp počítá s tím, že uvnitř jsou třídy x-desktop apod.
 *     Nějaký souboru musí být existovat.)
 *
 * Seznam modulů: gulp gulp-file yargs gulp-replace
 */

gulp.task("comp", () => {

    let name = yargs.argv.name || yargs.argv.n || "component",

        dir = path.resolve(PATHS.CSS_COMPONETS, yargs.argv.dir || yargs.argv.d || ""),
        fileName = `${name}.css`;

    //pokud komponent existuje a není vynucené přepsání, ukončit
    if (!yargs.argv.rewrite && fs.existsSync(path.resolve(dir, fileName))) {

        console.log(`Component ${fileName} already exists! To rewrite use --rewrite.`);

        return;
    }

    const MQ_SOURCE = path.resolve(PATHS.CSS_FILES, yargs.argv.mqSource || "utility.css");

    let sections = yargs.argv.sections || yargs.argv.section || yargs.argv.s || "", //sekce komponentu
        mq = !yargs.argv.xMq, //vložit @media breakpointy
        color = !yargs.argv.xColor; //vložit barvy

    gulp.src(MQ_SOURCE)
        .pipe(
            //obsah dokumentu
            gReplace(/[\s\S]*/, (match) => {

                //najít @media breakpointy
                let media = mq ? match.match(/(@media[^}{]+?\{)(?:\s*html \.x-(?:desktop|tablet|mobile))/g) : [];

                media = media ? media.map(item => item.replace(/\{[\s\S]*/, "{}")) : [];

                let colors = color ? match.match(/\.color([0-9]+|-[a-z-]+)[^\{]+{[^\}]+}/g) : [];

                let colorNames = colors.map(color => color.match(/\.color-([a-z-]+)/i)).map((color, c) => color ? color[1] : colors[c].match(/.color([0-9]+)/)[1]);

                colors = colors.map(color => color.split("{")[1].replace(/[;}]/g, "").split(":")[1].trim());

                colors = colors.map((color, c) => `${colorNames[c]}: ${color}`);

                let template = getCSSComponentTemplate(name, sections.split(",").filter(item => item.trim().length), media, colors);

                //vytvořit soubor
                file(fileName, template, {src: true})
                    .pipe(gulp.dest(dir));
            })
        );

});

/* Vrátí text pro vytvoření CSS komponentu.
 *
 * name (String): název komponentu
 * subheads (Array[String]): sekce
 * media (Array[String]): seznam @media
 * colors (Array[String]): seznam barev
 */
function getCSSComponentTemplate(name, subheads, media, colors) {

    const HEADER1_BAR = `/*====================================================================*/`;
    const HEADER2_BAR = `/*--------------------------------------------------------------------*/`;

    let sections = [
        getCSSComponentHeaderSectionTemplate(HEADER1_BAR, name.trim()),
        ...subheads.map(subhead => getCSSComponentHeaderSectionTemplate(HEADER2_BAR, subhead.trim(), name.trim()))
    ];

    return sections.join("\n\n") + "\n\n" + media.join("\n") + (colors && colors.length ? "\n\n/* Barvy:\n * " + colors.join("\n * ") + "\n */" : "");
}

/* Vrátí text pro vytvoření sekce CSS komponentu.
 *
 * barTemplate (String): oddělující čára
 * name (String): název sekce
 * parent (String): název rodičovské sekce
 */
function getCSSComponentHeaderSectionTemplate(barTemplate, name, parent) {

    //polovina délky oddělující čáry - název - 2 mezery - /* a */
    let namePaddingLength = ((barTemplate.length - 6) - name.length) / 2,
        header = `${barTemplate}\n/*${"-".repeat(Math.floor(namePaddingLength))} ${name.toUpperCase()} ${"-".repeat(Math.ceil(namePaddingLength))}*/\n${barTemplate}`,

        //první selektor
        firstRule = `.${parent ? `${parent}__` : ""}${name} {\n\n}`;

    return `${header}\n\n${firstRule}`;
}


/* --------------------------------- JS --------------------------------- */


/* Spojuje JS soubory podle /dev/load-js.js (PATHS.JS_LOAD).
 * V tomto souboru je objekt FILES, kde se pro každý název souboru přiřadí
 * pole spojovaných souborů. Výsledné soubory se pak vytvoří do složky
 * PATHS.JS_OUTPUT. (Bude zde minifikovaná i neminifikovaná verze.)
 *
 * Seznam modulů: gulp gulp-rename gulp-uglify gulp-concat
 * */

/*Minifikace JS.*/
const uglify = requireModule("gulp-uglify");

gulp.task("js", () => {

    //Načte soubor /dev/load-js.js
    let jsLoad = requireUncached(path.resolve(PATHS.JS_LOAD));

    for (let file in jsLoad.files) {

        let filesForFile = jsLoad.files[file];

        //Pokud je seznam souborů prázdné pole nebo null,
        //předchozí spojení se odstraní
        if (!filesForFile || !filesForFile.length) {

            removeEmptyJSFiles(file);

            continue;
        }

        //Vytvoří spojené soubory do výstupní složky (PATHS.JS_OUTPUT)
        generateJSBuild(file, filesForFile);
    }
});

/* Spojí soubory z files do souboru file a soubor vytvoří
 * do výstupní složky pro JS (PATHS.JS_OUTPUT).
 *
 * file (String): název výsledného souboru
 * files (Array[String]): pole vsupních souborů
 */
function generateJSBuild(file, files) {

    gulp.src(files.map(file => path.resolve(file)))
        //spojit soubory
        .pipe(concat(file))
        //vytvořit výstup
        .pipe(
            gulp.dest(path.resolve(PATHS.JS_OUTPUT))
        )
        //minifikovat
        .pipe(uglify())
        //přidat příponu .min
        .pipe(rename(path => path.basename = `${file.split(/\//).pop().replace(/\.js$/, "")}.min`))
        //vytvořit výstup
        .pipe(
            gulp.dest(path.resolve(PATHS.JS_OUTPUT))
        );
}

/* Odstraní soubou file ve výstupní složce pro JS.
 *
 * file (String): název souboru pro odstranění*/
function removeEmptyJSFiles(file) {

    if (fs.existsSync(path.resolve(PATHS.JS_OUTPUT, file))) {

        fs.unlinkSync(path.resolve(PATHS.JS_OUTPUT, file));
        fs.unlinkSync(path.resolve(PATHS.JS_OUTPUT, file.replace(/.js$/, ".min.js")));
    }
}


/* --------------------------------- MOD --------------------------------- */


/* Vygeneruje soubor se základním kódem pro vytvoření JS modulu.
 *
 * Argumenty:
 * name, n (String): název modulu
 * dir, d (String): složka pro vytvoření souboru (relativní k PATHS.JS_MODULES)
 * ns (String): název jmenného prostoru
 * x-jq (String): bez jQuery
 * objects, object, o (String): objekty na začátku modulu oddělené čárkou
 *     - c  = CLASS
 *     - i  = ID
 *     - d  = DATA
 *     - a  = ATTR
 *     - s  = SELECTOR
 *     - ev = EVENT
 *     - o  = OPTION
 *     - e  = ELEMENT
 * globals, global, g (String): globální sdílené proměnné
 *     - w = $win
 *     - d = $doc
 *     - h = $html
 *     - b = $body
 *     - t = $t
 * rewrite (flag): přepsat existující modul
 *
 * Seznam modulů: gulp gulp-file yargs
 */

const file = requireModule("gulp-file");
const gFile = file;

gulp.task("mod", () => {

    let name = yargs.argv.name || yargs.argv.n || "Module";

    name = name.charAt(0).toUpperCase() + name.slice(1);

    let dir = path.resolve(PATHS.JS_MODULES, yargs.argv.dir || yargs.argv.d || ""),
        fileName = `${name}.js`;

    //pokud modul existuje a není vynucené přepsání, ukončit
    if (!yargs.argv.rewrite && fs.existsSync(path.resolve(dir, fileName))) {

        console.log(`Module ${fileName} already exists! To rewrite use --rewrite.`);

        return;
    }

    const GLOBAL_VARS = {
        w: "$win",
        d: "$doc",
        h: "$html",
        b: "$body",
        t: "$t"
    };

    const MODULE_VARS = {
        c:  "CLASS",
        i:  "ID",
        d:  "DATA",
        a:  "ATTR",
        s:  "SELECTOR",
        ev: "EVENT",
        o:  "OPTION",
        e:  "ELEMENT",
    };

    const GLOBAL_VARS_ORDER = Object.keys(GLOBAL_VARS);
    const MODULE_VARS_ORDER = Object.keys(MODULE_VARS);

    let ns = yargs.argv.ns || "MJNS",
        jquery = !yargs.argv.xJq,

        globalVars = (yargs.argv.globals || yargs.argv.global || yargs.argv.g || "")
            .split(",") //rozdělit podle čárky
            .filter(item => item.trim().length) //odstranit prázdné položky
            .sort((a, b) => //seřadit podle GLOBAL_VARS_ORDER
                GLOBAL_VARS_ORDER.indexOf(a.trim().toLowerCase()) - GLOBAL_VARS_ORDER.indexOf(b.trim().toLowerCase())
            )
            .map(item => GLOBAL_VARS[item.trim().toLowerCase()]), //prevést na skutečné názvy

        moduleVars = (yargs.argv.objects || yargs.argv.object || yargs.argv.o || "")
            .split(",") //rozdělit podle čárky
            .filter(item => item.trim().length) //odstranit prázdné položky
            .sort((a, b) => //seřadit podle MODULE_VARS_ORDER
                MODULE_VARS_ORDER.indexOf(a.trim().toLowerCase()) - MODULE_VARS_ORDER.indexOf(b.trim().toLowerCase())
            )
            .sort(a => MODULE_VARS[a.trim().toLowerCase()] ? -1 : 1) //vlastní zařadit na konec
            .map(item => MODULE_VARS[item.trim().toLowerCase()] || item.trim()); //prevést na skutečné názvy

    //používají-li se sdílené proměnné, potřebujeme jQeury
    if (globalVars.length) {

        jquery = true;
    }

    let template = getJSModuleTemplate(ns, name, jquery, globalVars, moduleVars);

        //vytvořit soubor
    return file(fileName, template, { src: true })
        //uložit soubor
        .pipe(gulp.dest(dir));
});

/* Vrátí text pro vytvoření JS modulu.
 *
 * ns (String): název jmenného prostoru
 * name (String): název modulu
 * usejQuery (Boolean): použit jQuery,
 * useGlobalVars (Array[String]): sdílené globální proměnné
 * useModuleVars (Array[String]): objekty modulu
 */
function getJSModuleTemplate(ns, name, usejQuery, useGlobalVars, useModuleVars) {

    const GLOBAL_VARS = {
        "$win" : "$(window)",
        "$doc" : "$(document)",
        "$html" : "$(document.documentElement)",
        "$body" : "$(document.body)",
        "$t" : "(function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])))"
    };

    //některé sdílené globální proměnné používají globální objekty -> co přidat do /*global X*/
    const GLOBAL_VARS_TO_GLOBAL = {
        "$win" : "window",
        "$doc" : "document",
        "$html" : "document",
        "$body" : "document"
    };

    const LINT = `/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/`;

    let globalVars = useGlobalVars.length ? `\n${useGlobalVars.map(item => `    ns.${item} = ns.${item} || ${GLOBAL_VARS[item]};`).join("\n")}\n` : "",

        globalItems = [usejQuery ? "jQuery" : "", ...useGlobalVars.map(item => GLOBAL_VARS_TO_GLOBAL[item] || "")].filter(item => item.length).join(", "),
        global = globalItems.length ? `\n/*global ${globalItems}*/` : "",

        moduleVars = `var ${useModuleVars.map((item, i) => `${i ? "\n\n            " : ""}${item} = {

            },`).join("") + (useModuleVars.length ? "\n\n            " : "")}init = function () {

            };`,

        moduleWrapper = `(function (ns${usejQuery ? ", $" : ""}) {
    ${globalVars}
    ns.${name} = (function () {

        ${moduleVars.trim()}

        return {
            init: init
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("${ns}"))${usejQuery ? ", jQuery" : ""}));`;

    return `${LINT}${global}\n\n${moduleWrapper}`;
}


/* --------------------------------- GENERATE --------------------------------- */


/* Vygeneruje statický kód pomocí generátoru definovaného v HTML/CSS souborech
 * pomocí komentářů na základě šablony a dat.
 *
 * !!! Použití na vlastní nebezpečí! Zejména se vyhněte používání vnořených
 *     generátorů.
 *
 *
 * Podporované šablonovací enginy:
 * Twig, HTML (výchozí)
 * Po doinstalování přislušných modulů: Handlebars, EJS
 *
 * Podporované formáty data:
 * YAML (výchozí), JSON, CSV, XML
 *
 *
 * Definice generátoru (HTML):
 *
 * Inline definice:
 *
 * <!-- GENERATE: NÁZEV | JAZYK_INLINE_ŠABLONY | FORMÁT_DAT? | DALŠÍ_NASTAVENÍ?
 *     ====
 *     ŠABLONA
 *     ====
 *     DATA?
 * -->
 * ...obsah...
 * <!-- /GENERATE: NÁZEV -->
 *
 * Inline definice šablony a dat se oddělují minimálně čtyřmi znaky "=", musí být
 * odsazené čtyřmi mezerami a být na samostatném řádku.
 *
 * Také je možné použít soubory (nastavení cest v /dev/PATHS.js):
 *
 * <!-- GENERATE: NÁZEV | SOUBOR_ŠABLONY | SOUBOR_DAT? | DALŠÍ_NASTAVENÍ? -->
 * ...obsah...
 * <!-- /GENERATE: NÁZEV -->
 *
 * Cesty k souborům začínající znakem "/" jsou relativní ke kořenové složce.
 *
 * Je možné použít kombinaci inline definice a souborů. Při použítí soboru pro
 * data je možné specifikovat inline blok s rozšiřujícími daty.
 *
 * Formát dat a šablony se zjistí z přípony souboru.
 *
 * ! Názvy generátorů nesmí obsahovat mezery (musí odpovídat [A-Za-z0-9-_]+).
 * ! Názvy souborů nesmí obsahovat mezery.
 * ! Je nutné dodržovat správné odsazení (viz výše).
 * ! Pro CSS se použijí CSS komentáře, jinak je vše stejné.
 *
 * Specifická nastavení pro CSV data:
 * <!-- GENERATE: SECTION | tpl.twig | data.csv | DELIMITER? | ZPŮSOB_KONVERZE? | UVOZOVKY? -->
 *
 * DELIMITER - odělovač dat; výchozí ,
 * ZPŮSOB_KONVERZE - možnosti
 *     - COLUMN: použije metodu "toColumnArray" modulu "csvjson"
 *     - SCHEMA: použije metodu "toSchemaObject" modulu "csvjson"
 *     - OBJECT: použije metodu "toObject" modulu "csvjson" (výchozí)
 *     - v případě OBJECT a SCHEMA se data (získané pole) přidají k vlastnosti "data"
 * UVOZOVKY - výchozí "
 *
 * Např.:
 * <!-- GENERATE: SECTION | tpl.twig | data.csv | ; | COLUMN | ' -->
 *
 * Specifická nastavení pro XML data:
 * <!-- GENERATE: SECTION | tpl.twig | data.xml | KOŘENOVÝ_ELEMENT? | VŽDY_VYTOVŘIT_POLE? -->
 *
 * KOŘENOVÝ_ELEMENT - hodnota ROOT nastaví vlasntost modulu "xml2js" "explicitRoot na true
 *     - Přidat do dat i kořenový element?
 * VŽDY_VYTOVŘIT_POLE - hodnota ARRAY nastaví vlasntost modulu "xml2js" "explicitArray" na true
 *     - Vyvořit v datech pole i v případě jednoho elementu?
 *
 * Např.:
 * <!-- GENERATE: SECTION | tpl.twig | data.xml | NOROOT | ARRAY -->
 *
 *
 * Pokud je potřeba přidat v inline definicích komentář (komentáře v HTML a CSS
 * nelze zanořovat), je možné použít následující zápis:
 * =GC= obsah komentáře =/GC=
 *
 * Protože šablonovací enginy vytvářejí nechtěné řádky, je možné je odstranit pomocí
 * následujícího označení:
 * =GX=
 *
 *
 * Příklad:
 * <!-- GENERATE: LIST | TWIG | data.json
 *     ====
 *     <ul>
 *         =GX= {% for key, value in items %}
 *         <li class="item{% if key == active %} active{% endif %}">{{value}}</li>
 *         =GC= /.item =/GC=
 *         =GX= {% endfor %}
 *     </ul>
 *     ====
 *     { "active": 2 }
 * ->
 * ...obsah...
 * <!-- GENERATE: LIST -->
 *
 *
 * V obsahu generátoru je možné označit sekce, které se mají vložit jako kód do dat
 * pro vygenerování šablony:
 * <!-- CONTENT: SOME-NAME -->
 * <p>obsah</p>
 * <!-- /CONTENT: SOME-NAME -->
 *
 * Tyto sekce pak budou v šabloně k dispozici v CONTENT.SOME_NAME.
 *
 * ! Název nesmí obsahovat mezery (musí odpovídat [A-Za-z0-9-_]+).
 *   Znaky "-" budou nahrazeny znaky "_".
 *
 * To se hodí potřebujeme-li vygenerovat nějaký kód, který má ale v každém souboru
 * vlastní specifický obsah.
 *
 * Např.:
 * page1.html
 * <!-- GENERATE: CODE | tpl.twig -->
 *
 * <section>
 *
 *     <!-- CONTENT: TITLE -->
 *
 *     <h1>Page 1</h1>
 *
 *     <!-- /CONTENT: TITLE -->
 *
 * </section>
 *
 * <!-- /GENERATE: CODE -->
 *
 * page2.html
 * <!-- GENERATE: CODE | tpl.twig -->
 *
 * <section>
 *
 *     <!-- CONTENT: TITLE -->
 *
 *     <h1>Page 2</h1>
 *
 *     <!-- /CONTENT: TITLE -->
 *
 * </section>
 *
 * <!-- /GENERATE: CODE -->
 *
 * tpl.twig
 * <section>
 *
 *     {{CONTENT.TITLE}}
 *
 * </section>
 *
 * Pokud bychom upravili šablonu tak, že bychom {{CONTENT.TITLE}} vnořili
 * do dalšího elemenu (nebo naopak vyjmuli), odsazení obsahu v nově vygenerovaném
 * kódu by bylo chybné. Proto můžeme tuto změnu ručně zadat do příkazu pomocí
 * --indent ve formátu "NÁZEV:POČET_MEZER,NÁZEV:POČET_MEZER", tedy například
 * --indent "TITLE:4" (v případě, že jsem obsah zanořili do dalšího elementu).
 *
 * Argumenty:
 * files, f (String): soubory oddělené čárkou, u kterých se mají spustit
 *     generátory; v případě použití "--css" je cesta relativní k PATHS.CSS_FILES
 *     jinak k PATHS.HTML_INPUT. (Výchozí *.html nebo *.css podle módu.)
 *     Soubory začínající "/" jsou relativní ke kořenové složce.
 *     Bez použití --css nebo --html se mód detekuje podle přípony prvního souboru.
 * generators, g (String): názvy generátorů oddělené čárkou
 * indent, i (String): změna odsazení obsahu v šabloně ve formátu
 *     "NÁZEV:POČET_MEZER,NÁZEV2:POČET_MEZER" (viz výše)
 * css (Flag): vynucení CSS módu
 * html (Flag): vynucení HTML módu
 * x-nested (Flag): nespouštět vnořené generátory
 * log-data (Flag): zobrazit data v konzoli
 *
 * Seznam modulů: gulp gulp-replace yargs xml2js yamljs csvjson
 * Seznam volitelných modulů: twig ejs handlebars
 */

const twig = requireModule("twig"),
      ejs = requireModule("ejs"), //není součástí package.json
      handlebars = requireModule("handlebars"), //není součástí package.json

      XML = requireModule("xml2js"),
      YAML = requireModule("yamljs"),
      CSV = requireModule("csvjson");

const GENERATOR_OPTIONS = {
        TAGS: {
            REMOVE_LINE: "=GX=",
            COMMENT_START: "=GC=",
            COMMENT_END: "=/GC="
        },

        INDENTATION: 4,
        TEMPLATE_LANG: "HTML",
        DATA_FORMAT: "YAML",

        CSV: {
            DELIMITER: ",",
            QUOTE: "\"",
            METHOD: "OBJECT"
        },

        XML: {
            ROOT: false,
            ARRAY: false
        }
    },

    CSV_METHOD = {
        COLUMN: "toColumnArray",
        SCHEMA: "toSchemaObject",
        OBJECT: "toObject"
    };

//cache pro již jednou použité soubory (data, šablony)
let generatorFileCache = {};


gulp.task("generate", () => {

    let css = typeof yargs.argv.css !== "undefined",
        html = typeof yargs.argv.html !== "undefined",

        files = yargs.argv.files || yargs.argv.f || (css ? "*.css" : "*.html"),
        generators = yargs.argv.generators || yargs.argv.g,

        nested = typeof yargs.argv.xNested === "undefined",

        logData = typeof yargs.argv.logData !== "undefined",

        indent = (yargs.argv.indent || yargs.argv.i || "").split(",").map(item => item.split(":")),

        filesToRewrite = files.split(",").map(toFile => toFile.trim()),
        useGenerators = generators ? generators.split(",") : [];

    if (!css && !html && filesToRewrite && filesToRewrite.length) {

        css = !!filesToRewrite[0].match(/\.css$/);
        html = !css;
    }

    css = css || !html;

    filesToRewrite = filesToRewrite.map(toFile => path.join(
        toFile.match(/^\/|^\\/) ?
            process.cwd():
            path.resolve(css ? PATHS.CSS_FILES: PATHS.HTML_INPUT),
        toFile));

    gulp.src(filesToRewrite, {base: "./"})
        //uložit aktuální soubory
        .pipe(
            gulp.dest(path.resolve(PATHS.HTML_SAVE, `${yargs.argv.saveDir || Date.now()}`))
        )
        //upravit obsah
        .pipe(
            gReplace(css ? getCSSGeneratorRegExp(useGenerators) : getHTMLGeneratorRegExp(useGenerators), generatorReplace)
        )
        //přepsat soubory
        .pipe(
            gulp.dest("./")
        );

    /* Provede nahrazení aktuálního obsahu vygenerovaným.
     *
     * Funkce se používá jako druhý argument String.prototype.replace.
     */
    function generatorReplace(match, startSpace, generator, generatorName, content, endGenerator) {

        let options = getGeneratorOptions(generator, startSpace, css);

        //pokud se vyskytla chyba, přeskočit
        if (options.skip) {

            console.log("Generator " + generatorName + " skipped!");

            return match;
        }

        let defaultData = {
            CURRENT_FILE: path.basename(this.file.history[0]),
            CONTENT: generatorGetContent(content, indent, css)
        };

        let data = getGeneratorData(options, defaultData, logData);

        content = getGeneratorOutput(options, data);

        content = generatorRemoveLines(content);

        if (!options.useTemplateFile) {

            content = generatorReplaceComments(content, css);

            content = content + options.indent;
        }

        //spustit vnořené generátory
        if (nested) {

            content = content.replace(css ? getCSSGeneratorRegExp(): getHTMLGeneratorRegExp(), generatorReplace.bind(this));
        }

        if (content.match(/^\s+$/)) {

            content = "";
        }

        return startSpace + generator + "\n" + options.indent + content + "\n" + options.indent + endGenerator;
    }
});

/* Vrátí RegExp pro nalezení generátoru v HTML.
 *
 * generatorNames? (Array[String]): pole názvů generátorů
 */
function getHTMLGeneratorRegExp(generatorNames) {

    let generatorStart, generatorContentPlusEnd;

    if (generatorNames && generatorNames.length) {

        generatorStart = `(\\n\\s*?)(<!--\\s*GENERATE:\\s*(\\b${generatorNames.join("\\b|\\b")}\\b)[\\s\\S]*?-->)`;
        generatorContentPlusEnd = `([\\s\\S]*?)(<!--\\s*\\/GENERATE:\\s*(?:\\b${generatorNames.join("\\b|\\b")}\\b)\\s*-->)`;

    } else {

        generatorStart = `(\\n\\s*?)(<!--\\s*GENERATE:\\s*([A-Z0-9-_]+?)[\\s\\S]*?-->)`;
        generatorContentPlusEnd = `([\\s\\S]*?)(<!--\\s*\\/GENERATE:\\s*(?:\\3)\\s*-->)`;
    }

    return new RegExp(generatorStart + generatorContentPlusEnd, "gmi");
}

/* Vrátí RegExp pro nalezení generátoru v CSS.
 *
 * generatorNames? (Array[String]): pole názvů generátorů
 */
function getCSSGeneratorRegExp(generatorNames) {

    let generatorStart, generatorContentPlusEnd;

    if (generatorNames && generatorNames.length) {

        generatorStart = `(\\n\\s*?)(\\/\\*\\s*GENERATE:\\s*(\\b${generatorNames.join("\\b|\\b")}\\b)[\\s\\S]*?\\*\\/)`;
        generatorContentPlusEnd = `([\\s\\S]*?)(\\/\\*\\s*\\/GENERATE:\\s*(?:\\b${generatorNames.join("\\b|\\b")}\\b)\\s*\\*\\/)`;

    } else  {

        generatorStart = `(\\n\\s*?)(\\/\\*\\s*GENERATE:\\s*([A-Z0-9-_]+?)[\\s\\S]*?\\*\\/)`;
        generatorContentPlusEnd = `([\\s\\S]*?)(\\/\\*\\s*\\/GENERATE:\\s*(?:\\3)\\s*\\*\\/)`;
    }

    return new RegExp(generatorStart + generatorContentPlusEnd, "gmi");
}

/* Upravý odsazení šablony, aby odsazení odpovídalo definici generátoru.
 *
 * template (String): šablona
 * fromFile (Boolean): je šablona získaná ze souboru (a ne z inline komentáře)?
 * indentation (String): odsazení definice generátoru (mezery)
 */
function fixTemplateIndentation(template, fromFile, indentation) {

    if (fromFile) {

        return template.replace(new RegExp("\\n", "g"), "\n" + indentation);
    }

    return template.replace(new RegExp("\\n" + " ".repeat(GENERATOR_OPTIONS.INDENTATION), "g"), "\n");
}

/* Vrátí obsah, který se má přidat do dat pro generování šablony.
 * Označeno komentáři <!-- CONTENT: NAME --> <!-- /CONTENT: NAME -->.
 *
 * content (String): aktuální obsah
 * indent (Array[Array]): nastavení ručního odsazení obsahu
 * css (Boolean): zdroj je CSS
 */
function generatorGetContent(content, indent, css) {

    let result = {},

        contents = css ?
            content.match(/\/\*\s*CONTENT:\s*([A-Z0-9-_]+?)\s*\*\/[\s\S]*?\/\*\s*\/CONTENT:\s*\1\s*\*\//gi):
            content.match(/<!--\s*CONTENT:\s*([A-Z0-9-_]+?)\s*-->[\s\S]*?<!--\s*\/CONTENT:\s*\1\s*-->/gi);

    if (contents) {

        contents.forEach(function (content) {

            let name = css ?
                content.match(/\/\*\s*CONTENT:\s*([A-Z0-9-_]+?)\s*\*\//i)[1]:
                content.match(/<!--\s*CONTENT:\s*([A-Z0-9-_]+?)\s*-->/i)[1];

            if (indent) {

                indent.forEach(item => {

                    if (name.toLowerCase() === item[0].toLowerCase()) {

                        let spaces = parseInt(item[1]);

                        if (spaces > 0) {

                            content = content.replace(/\n/g, "\n" + " ".repeat(spaces));

                        } else if (spaces < 0) {

                            content = content.replace(new RegExp("\\n" + " ".repeat(Math.abs(spaces)), "g"), "\n");
                        }
                    }
                });
            }

            result[name.replace(/-/g, "_")] = content;
        });
    }

    return result;
}

/* Vrátí nastavení generátoru.
 *
 * generator (String): definice generátoru
 * startSpace (String): prázdné místo před definicí (pro zjištění odsazení)
 * css (Boolean): zdroj je CSS
 */
function getGeneratorOptions(generator, startSpace, css) {

    let generatorGeneralData = generator.split("|") //rozedělit jednotlivá nastavení
            .map(
                item => {

                    let option = item.replace(css ? "*/": "-->", "").match(/[^\s]+/i);

                    return option ? option[0]: ""; // získat nastavení z textu za oddělovačem
                }
            ),
        generatorTemplateData;

    let options = {
        useTemplateFile: generatorGeneralData[1] && generatorGeneralData[1].indexOf(".") !== -1, //obsahuje-li nastavení tečku -> jedná se o soubor
        useDataFile: generatorGeneralData[2] && generatorGeneralData[2].indexOf(".") !== -1, //obsahuje-li nastavení tečku -> jedná se o soubor

        template: "",
        data: "",
        templateLang: GENERATOR_OPTIONS.TEMPLATE_LANG,
        dataFormat: GENERATOR_OPTIONS.DATA_FORMAT,

        indent: (startSpace.split("\n").pop() || "").replace("\n", ""), //najít poslední řádek = odsazení před generátorem

        csv: {},
        xml: {}
    };

    if (options.useTemplateFile) {

        //zjistit formát podle přípony souboru
        options.templateLang = generatorGeneralData[1] ? generatorGeneralData[1].match(/\.([a-z]*)/i)[1] || options.templateLang : options.templateLang;

        try {

            let filePath = path.join(
                    generatorGeneralData[1].match(/^\/|^\\/) ? process.cwd(): path.resolve(PATHS.GENERATOR_TEMPLATES),
                    generatorGeneralData[1]
                ),
                file = generatorFileCache[filePath] || fs.readFileSync(filePath);

            generatorFileCache[filePath] = file;

            options.template = file ? "\n" + file.toString() + "\n" : "";

        } catch (e) {

            console.log("File " + generatorGeneralData[1] + " not found!");

            options.skip = true;
        }
    } else {

        options.templateLang = generatorGeneralData[1] || options.templateLang;
    }

    if (options.useDataFile) {

        //zjistit formát podle přípony souboru
        options.dataFormat = generatorGeneralData[2] ? generatorGeneralData[2].match(/\.([a-z]*)/i)[1] || options.dataFormat : options.dataFormat;

        try {

            let filePath = path.join(
                    generatorGeneralData[2].match(/^\/|^\\/) ? process.cwd(): path.resolve(PATHS.GENERATOR_TEMPLATES_DATA),
                    generatorGeneralData[2]
                ),
                file = generatorFileCache[filePath] || fs.readFileSync(filePath);

            generatorFileCache[filePath] = file;

            options.data = file ? file.toString() : "";

        } catch (e) {

            console.log("File " + generatorGeneralData[2] + " not found!");

            options.skip = true;
        }
    } else {

        options.dataFormat = generatorGeneralData[2] || options.dataFormat;
    }

    if (options.dataFormat.match(/csv/i)) {

        options.csv.delimiter = generatorGeneralData[3] || GENERATOR_OPTIONS.CSV.DELIMITER;
        options.csv.method = generatorGeneralData[4] || GENERATOR_OPTIONS.CSV.METHOD;
        options.csv.quote = generatorGeneralData[5] || GENERATOR_OPTIONS.CSV.QUOTE;
    }

    if (options.dataFormat.match(/xml/i)) {

        options.xml.root = generatorGeneralData[3] ? generatorGeneralData[3] === "ROOT" : GENERATOR_OPTIONS.XML.ROOT;
        options.xml.array = generatorGeneralData[4] ? generatorGeneralData[4] === "ARRAY" : GENERATOR_OPTIONS.XML.ARRAY;
    }

    if (!options.useTemplateFile) {

        generatorTemplateData = generator.replace(css ? /\n[^\n]*?\*\/$/ : /\n[^\n]*?-->$/, "")
            .split(/(?:\n)[^\n]*?====+[^\n]*?(?:\n)/);

        options.template = generatorTemplateData[1] ? "\n" + generatorTemplateData[1] + "\n" : "";
    }

    if (options.template) {

        options.template = fixTemplateIndentation(options.template, options.useTemplateFile, options.indent);

        if (!options.template.match(/\r\n$/)) {

            options.template = options.template.replace(/\n$/, "\r\n");
        }
    }

    generatorTemplateData = generator.replace(css ? /\n[^\n]*?\*\/$/ : /\n[^\n]*?-->$/, "")
        .split(/(?:\n)[^\n]*?====+[^\n]*?(?:\n)/);

    //pokud se používá soubor s daty, pak inline-data použít jako rozšíření dat v souboru
    options[options.useDataFile ? "extendData" : "data"] = (generatorTemplateData[options.useTemplateFile ? 1 : 2] || "").trim();

    //upravit odsazení kvůli formátům, které jsou na něm závislé (YAML)
    options[options.useDataFile ? "extendData" : "data"] =
        options[options.useDataFile ? "extendData" : "data"]
            .replace(
                new RegExp("\\n" + options.indent + " ".repeat(GENERATOR_OPTIONS.INDENTATION), "g"), "\n"
            );

    return options;
}

/* Nahradí komentáře specifikované v generátoru.
 * Např.: =GC=komentář=/GC= => <!--komentář-->
 *
 * content (String): vygenerovaný obsah
 * css (Boolean): zdroj je CSS
 */
function generatorReplaceComments(content, css) {

    if (css) {

        return content.replace(new RegExp(GENERATOR_OPTIONS.TAGS.COMMENT_END, "g"), "*/")
            .replace(new RegExp(GENERATOR_OPTIONS.TAGS.COMMENT_START, "g"), "/*");
    }

    return content.replace(new RegExp(GENERATOR_OPTIONS.TAGS.COMMENT_END, "g"), "-->")
        .replace(new RegExp(GENERATOR_OPTIONS.TAGS.COMMENT_START, "g"), "<!--");
}

/* Odstraní označené řádky (řádky s "=GX=").
 *
 * content (String): vygenerovaný obsah
 */
function generatorRemoveLines(content) {

    return content.replace(new RegExp("\\r?\\n?(^.*" + GENERATOR_OPTIONS.TAGS.REMOVE_LINE + ".*$)", "gm"), "");
}

/* Vytvoří data pro šablonovací engine podle definice generátoru.
 *
 * options (Object): nastavení generátoru
 * defaultData (Object): výchozí/globální data
 * log (Boolean): zobrazit data v konzoli
 */
function getGeneratorData(options, defaultData, log) {

    let data = {},
        extendData = {};

    switch ((options.dataFormat || "").trim().toLowerCase()) {

        case "json":

            if (options.data) {

                data = JSON.parse(options.data);
            }

            if (options.extendData) {

                extendData = JSON.parse(options.extendData);
            }

            break;

        case "yaml":
        case "yml":

            if (options.data) {

                data = YAML.parse(options.data);
            }

            if (options.extendData) {

                extendData = YAML.parse(options.extendData);
            }

            break;

        case "csv":

            if (options.data) {

                data = CSV[CSV_METHOD[options.csv.method]](options.data, {
                    delimiter: options.csv.delimiter,
                    quote: options.csv.quote
                });
            }

            if (options.extendData) {

                extendData = CSV[CSV_METHOD[options.csv.method]](options.extendData, {
                    delimiter: options.csv.delimiter,
                    quote: options.csv.quote
                });
            }

            break;

        case "xml":

            let xmlOptions = {
                explicitArray: options.xml.array,
                explicitRoot: options.xml.root
            };

            if (options.data) {

                XML.parseString(options.data, xmlOptions, function (err, result) {
                    data = result;
                });
            }

            if (options.extendData) {

                XML.parseString(options.extendData, xmlOptions, function (err, result) {
                    extendData = result;
                });
            }

            break;
    }

    if (data instanceof Array) {

        data = { data: data };
    }

    if (extendData instanceof Array) {

        extendData = { data: extendData };
    }

    let result = Object.assign(defaultData, data, extendData);

    if (log) {

        console.log(result);
    }

    return result;
}

/* Vygeneruje kód pomocí šablonovacího enginu.
 *
 * options (Object): nastavení generátoru
 * data (Object): data pro šablonu
 */
function getGeneratorOutput(options, data) {

    if (!options.template) {

        return "";
    }

    switch ((options.templateLang || "").trim().toLowerCase()) {

        case "twig":

            let twigTemplate = twig.twig({
                data: options.template
            });

            return twigTemplate.render(data);

        case "ejs":

            return ejs.render(options.template, data);

        case "hbs":

            let hbsTemplate = handlebars.compile(options.template);

            return hbsTemplate(data);

        case "htm":
        case "html":

            return options.template;
    }
}


/* --------------------------------- SVG-SPRITE --------------------------------- */


/* Vytvoří SVG sprite. Vstupy a výstupy lze nastavit v /dev/PATHS.js.
 * Soubory budou dostupné pod ID, které se vytvoří z názvu souboru a prefixu
 * icon-.
 *
 * Seznam modulů: gulp gulp-svg-sprite
 */

const svgSprite = requireModule("gulp-svg-sprite");

gulp.task("svg", () => {

    gulp.src(`${PATHS.SVG_INPUT}/*.svg`)
        .pipe(svgSprite({
            shape: {
                spacing: {
                    padding: 0
                },
                id: {
                    //prefix názvů (search.svg -> #icon-search)
                    generator: "icon-%s"
                }
            },
            mode: {
                symbol: true,
                view: {
                    bust: false
                }
            },
            svg: {
                xmlDeclaration: false,
                doctypeDeclaration: false,
                namespaceIDs: true,
                dimensionAttributes: true,
                rootAttributes: {
                    style: "display: none;"
                }
            }
        }))
        .pipe(gulp.dest(PATHS.SVG_OUTPUT));
});


/* --------------------------------- CRITICAL-CSS --------------------------------- */


/* Vytvoří Critical CSS.
 *
 * Zdrojové HTML soubory a výstup lze nastavit v /dev/PATHS.js.
 *
 * Argumenty:
 * width (Number): šířka viewportu
 * height (Number): výška viewportu
 * inline (flag): vložit do HTML souborů
 *
 * Seznam modulů: gulp critical yargs
 */

const critical = requireModule("critical");

gulp.task("critical", () => {

    let width = Number(yargs.argv.width) || 1024,
        height = Number(yargs.argv.height) || 1024,
        inline = Boolean(yargs.argv.inline);

    //vytvořit složku PATHS.CRITICAL_OUTPUT, pokud neexistuje
    if (!fs.existsSync(PATHS.CRITICAL_OUTPUT)) {

        fs.mkdirSync(PATHS.CRITICAL_OUTPUT);
    }

    //načíst HTML soubory
    let pages = (function () {

        let files = fs.readdirSync(PATHS.HTML_INPUT);

        return files.filter(file => file.match(/.html$/));

    }());

    //pro každý soubor vytvořit Critical CSS
    pages.forEach(page => {

        critical.generate({
            dest: inline ? `${PATHS.CRITICAL_OUTPUT}/${page}` : `${PATHS.CRITICAL_OUTPUT}/${page}.min.css`,
            inline: inline,
            src: page,
            minify: true,
            width: width,
            height: height
        });
    });
});


/* --------------------------------- IMAGES-OPTIMIZATION --------------------------------- */


/* Optimalizuje obrázky ze složky PATHS.IMG_INPUT.
 *
 * Vstupní a výstupní složku lze nastavit v /dev/PATHS.js.
 *
 * Argumenty:
 * jpg-quality (Number): Kvalita výsledných JPG
 *
 * Seznam modulů: gulp gulp-imagemin imagemin-mozjpeg yargs
 */

const imagemin = requireModule("gulp-imagemin");
const imageminMozjpeg = requireModule("imagemin-mozjpeg");

gulp.task("images", () => {

    let jpgQuality = Number(yargs.argv.jpgQuality) || 65;

    gulp.src([`${PATHS.IMG_INPUT}/**/*.{png,jpg,gif,svg}`])
        .pipe(imagemin([
            //pluginy pro optimalizaci
            imagemin.svgo(),
            imagemin.gifsicle(),
            imageminMozjpeg({
                quality: jpgQuality,
                progressive: true
            }),
            imagemin.optipng({
                optimizationLevel: 5
            }),
        ]))
        .pipe(
            gulp.dest(path.resolve(PATHS.IMG_OUTPUT))
        );
});
