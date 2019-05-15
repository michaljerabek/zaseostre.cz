/*jslint indent: 4, white: true, nomen: true, regexp: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window, document, history*/

(function (ns, $) {

    ns.$win = ns.$win || $(window);
    ns.$doc = ns.$doc || $(document);
    ns.$t = ns.$t || (function ($t) { return function (e) { $t[0] = e; return $t; }; }($([null])));

    ns.SectionNavigator = (function () {

        var CLASS = {
                currentSection: "section--current"
            },

            SELECTOR = {
                link: ".section__link"
            },

            EVENT = {
                change: "SectionNavigator__change"
            },

            SUBSECTION_DIV = "__",

            sections = {},

            shouldPushStateToHistory = false,

            initialSectionId = null,
            currentSectionId = null,
            hidingSectionId = null,
            sectionToShowId = null,
            subsectionToShowId = null,

            getFullId = function (sectionId, subsectionId) {

                return sectionId + (subsectionId ? SUBSECTION_DIV + subsectionId: "");
            },

            getCurrentSubsectionId = function () {

                return window.location.hash.replace("#", "").split(SUBSECTION_DIV)[1] || null;
            },

            registerSection = function (section) {

                if (section && section.getId && section.get$Element && section.show && section.hide) {

                    sections[section.getId()] = section;

                    if (section.get$Element().hasClass(CLASS.currentSection)) {

                        currentSectionId = section.getId();
                        initialSectionId = currentSectionId;

                        return;
                    }

                    section.get$Element().hide();

                } else {

                    throw "Implement all required methods: getId, get$Element, hide, show!";
                }
            },

            showSectionToShow = function () {

                if (sectionToShowId && sections[sectionToShowId]) {

                    sections[sectionToShowId]
                        .get$Element()
                        .addClass(CLASS.currentSection);

                    if (shouldPushStateToHistory) {

                        var id = getFullId(sectionToShowId, subsectionToShowId);

                        if (!history.state || (history.state && history.state.id !== id)) {

                            history.pushState({id: id}, null, "#" + id);
                        }
                    }

                    currentSectionId = sectionToShowId;

                    var currentSubsectionId = subsectionToShowId;

                    sections[sectionToShowId]
                        .show(subsectionToShowId)
                        .done(function () {

                            if (sectionToShowId !== currentSectionId) {

                                hideCurrentSection();

                                return;
                            }

                            sectionToShowId = null;
                            subsectionToShowId = null;
                        });

                    var sectionData = currentSectionId.split(SUBSECTION_DIV);

                    ns.$win.trigger(EVENT.change, {
                        section: sectionData[0],
                        subsection: currentSubsectionId,
                        fullId: currentSectionId
                    });
                }
            },

            hideCurrentSection = function () {

                if (currentSectionId && sections[currentSectionId]) {

                    hidingSectionId = currentSectionId;

                    sections[currentSectionId]
                        .hide(sectionToShowId, subsectionToShowId)
                        .done(function () {

                            sections[currentSectionId]
                                .get$Element()
                                .removeClass(CLASS.currentSection);

                            hidingSectionId = null;

                            showSectionToShow();
                        });
                }
            },

            navigateToSectionById = function (sectionId) {

                var sectionData = sectionId.split(SUBSECTION_DIV);

                if (sectionData[0] === currentSectionId && currentSectionId !== hidingSectionId) {

                    if (sections[sectionData[0]].showSubsection) {

                        if (shouldPushStateToHistory) {

                            if (!history.state || (history.state && history.state.id !== sectionId)) {

                                history.pushState({id: sectionId}, null, "#" + sectionId);
                            }
                        }

                        sections[sectionData[0]].showSubsection(sectionData[1]);

                        ns.$win.trigger(EVENT.change, {
                            section: sectionData[0],
                            subsection: sectionData[1],
                            fullId: sectionId
                        });
                    }

                    return;
                }

                if (sections[sectionData[0]]) {

                    if (!sectionToShowId) {

                        sectionToShowId = sectionData[0];
                        subsectionToShowId = sectionData[1];

                        hideCurrentSection();

                        return;
                    }

                    sectionToShowId = sectionData[0];
                    subsectionToShowId = sectionData[1];
                }
            },

            navigateToSectionByLink = function (linkEl) {

                var sectionId = (linkEl.href || "").split("#")[1];

                navigateToSectionById(sectionId);
            },

            goToSection = function (sectionId) {

                shouldPushStateToHistory = true;

                navigateToSectionById(sectionId);
            },

            initEvents = function () {

                ns.$doc.on("click." + ns, SELECTOR.link, function (event) {

                    event.preventDefault();

                    shouldPushStateToHistory = true;

                    navigateToSectionByLink(event.currentTarget);
                });

                ns.$win.on("popstate." + ns, function () {

                    shouldPushStateToHistory = false;

                    navigateToSectionById(
                        window.location.hash ? window.location.hash.replace("#", ""): initialSectionId
                    );
                });
            },

            isCurrent = function (section) {

                if (section) {

                    return currentSectionId === section.getId();
                }

                return null;
            },

            init = function () {

                initEvents();

                if (window.location.hash && window.location.hash !== "#" + initialSectionId) {

                    navigateToSectionById(window.location.hash.replace("#", ""));
                }
            };

        return {
            init: init,

            registerSection: registerSection,
            isCurrent: isCurrent,

            goToSection: goToSection,

            getFullId: getFullId,
            getCurrentSubsectionId: getCurrentSubsectionId,

            getSubsectionDivider: function () {

                return SUBSECTION_DIV;
            }
        };

    }());

}((function (ns) { window[ns] = window[ns] || { toString: function () { return ns; } }; return window[ns]; }("MJNS")), jQuery));
