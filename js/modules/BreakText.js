/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery*/

(function (ns, $) {

    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.BreakText = (function () {

        var CLASS = {
                text: "text",
                word: "word",
                letter: "letter",
                space: "space",

                nowrap: "nowrap",

                screenReadersAndPrint: "visually-hidden",
                hideForPrint: "x-print",

                wordsOnly: "js-break-text--words-only",
                broken: "js-break-text--broken"
            },

            SELECTOR = {
                nowrap: "." + CLASS.nowrap,

                items: ".js-break-text"
            },

            wrapLetter = function (letter, num) {

                return "<span class=\"" + CLASS.letter + " " + (CLASS.letter + num) + "\" style=\"display: inline-block;\">" + letter + "</span>";
            },

            getWhiteSpace = function (num) {

                return "<span class=\"" + CLASS.space + " " + (CLASS.space + num) + "\"> </span>";
            },

            breakWord = function (word, num, wordsOnly) {

                var wordData = [],
                    l = 0;

                wordData.push("<span class=\"" + CLASS.word + " " + (CLASS.word + num) + "\" style=\"display: inline-block;\">");

                if (!wordsOnly) {

                    for (l; l < word.length; l++) {

                        wordData.push(wrapLetter(word[l], l + 1));
                    }
                } else {

                    wordData.push(word);
                }

                wordData.push("</span>");

                return wordData.join("");
            },

            breakText = function (text, indexFrom, wordsOnly) {

                var words = text.split(/\s+|\u00A0/),

                    wordsCount = 0,
                    textData = [],
                    w = 0;

                for (w; w < words.length; w++) {

                    if (words[w].length) {

                        textData = textData.concat(breakWord(words[w], indexFrom + wordsCount + 1, wordsOnly));

                        wordsCount++;
                    }

                    if (w < words.length - 1) {

                        textData.push(getWhiteSpace(indexFrom + wordsCount));
                    }
                }

                return {
                    content: textData.join(""),
                    wordsCount: wordsCount
                };
            },

            process = function (el, wordsOnly, indexFrom, firstRun) {

                wordsOnly = wordsOnly || ns.$t(el).hasClass(CLASS.wordsOnly);
                indexFrom = indexFrom || 0;

                if (firstRun) {

                    el.innerHTML = el.innerHTML.trim();
                }

                var childNodes = Array.prototype.slice.call(el.childNodes);

                childNodes = childNodes.map(function (node) {

                    var result;

                    if (node.nodeType === node.ELEMENT_NODE) {

                        result = process(node, wordsOnly, indexFrom);

                        indexFrom = result.nextIndex;

                        var nodeName = node.nodeName.toLowerCase(),
                            classAttr = node.className ? " class=\"" + node.className + "\"": "";

                        return "<" + nodeName + classAttr + ">" + result.content + "</" + nodeName + ">";

                    } else {

                        result = breakText(node.textContent, indexFrom, wordsOnly);

                        indexFrom += result.wordsCount;

                        return result.content;
                    }
                });

                return {
                    content: childNodes.join(""),
                    nextIndex: indexFrom
                };
            },

            makeAccessible = function (el, brokenContent) {

                ns.$t(el).find("span" + SELECTOR.nowrap).each(function () {
                    this.outerHTML = this.innerHTML;
                });

                return [
                    "<span class=\"" + CLASS.screenReadersAndPrint + "\">",
                        el.innerHTML.trim(),
                    "</span>",
                    "<span class=\"" + CLASS.text + " " + CLASS.hideForPrint + "\" role=\"presentation\" aria-hidden=\"true\">",
                        brokenContent,
                    "</span>"
                ].join("");
            },

            processElement = function (el, wordsOnly) {

                if (ns.$t(el).hasClass(CLASS.broken)) {

                    return;
                }

                var result = process(el, wordsOnly, 0, true);

                result.content = makeAccessible(el, result.content);

                ns.$t(el)
                    .addClass(CLASS.broken)
                    .html(result.content);
            },

            processElements = function (els, wordsOnly) {

                var length = els.length,
                    i = 0;

                for (i; i < length; i++) {

                    processElement(els[i], wordsOnly);
                }
            },

            init = function () {

                var items = document.querySelectorAll(SELECTOR.items);

                processElements(items);
            };

        return {
            EL: {
                ALL: 0,
                SPACE: 1,
                WORD: 2,
                LETTER: 3,
                WORD_SPACE: 4,
                LETTER_SPACE: 5
            },

            init: init,

            processElement: processElement,
            processElements: processElements,

            getEls: function (fromEl, elType) {

                switch (elType) {

                    case ns.BreakText.EL.SPACE:
                        return Array.prototype.slice.call(fromEl.querySelectorAll("." + CLASS.text + " ." + CLASS.space));

                    case ns.BreakText.EL.WORD:
                        return Array.prototype.slice.call(fromEl.querySelectorAll("." + CLASS.text + " ." + CLASS.word));

                    case ns.BreakText.EL.LETTER:
                        return Array.prototype.slice.call(fromEl.querySelectorAll("." + CLASS.text + " ." + CLASS.letter));

                    case ns.BreakText.EL.WORD_SPACE:
                        return Array.prototype.slice.call(fromEl.querySelectorAll("." + CLASS.text + " ." + CLASS.word + ", ." + CLASS.text + " ." + CLASS.space));

                    case ns.BreakText.EL.LETTER_SPACE:
                        return Array.prototype.slice.call(fromEl.querySelectorAll("." + CLASS.text + " ." + CLASS.letter + ", ." + CLASS.text + " ." + CLASS.space));

                    default:
                        return Array.prototype.slice.call(fromEl.querySelectorAll("." + CLASS.text + " ." + CLASS.letter + ", ." + CLASS.text + " ." + CLASS.word + ", ." + CLASS.text + " ." + CLASS.space));

                }
            },

            isBroken: function (el) {

                return ns.$t(el).hasClass(CLASS.broken);
            }
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
