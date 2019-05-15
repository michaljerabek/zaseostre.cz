/*jslint indent: 4, white: true, unparam: true, node: true, browser: true, devel: true, nomen: true, plusplus: true, regexp: true, sloppy: true, vars: true*/
/*global jQuery, window*/

jQuery(function () {

    if (window.MJNS.Fullscreen) {

        window.MJNS.Fullscreen.init();
    }

    if (window.MJNS.SectionIntro) {

        window.MJNS.SectionIntro.init();
    }

    if (window.MJNS.SectionDisclaimer) {

        window.MJNS.SectionDisclaimer.init();
    }

    if (window.MJNS.SectionGeneralInfo) {

        window.MJNS.SectionGeneralInfo.init();
    }

    if (window.MJNS.SectionExercises) {

        window.MJNS.SectionExercises.init(function () {

            if (window.MJNS.SectionExerciseRelax) {

                window.MJNS.SectionExerciseRelax.init();
            }

            if (window.MJNS.SectionExerciseTable) {

                window.MJNS.SectionExerciseTable.init();
            }

            if (window.MJNS.SectionExerciseAccommodation) {

                window.MJNS.SectionExerciseAccommodation.init();
            }

            if (window.MJNS.SectionExerciseEyeExercises) {

                window.MJNS.SectionExerciseEyeExercises.init();
            }
        });
    }

    if (window.MJNS.SectionOutro) {

        window.MJNS.SectionOutro.init();
    }

    if (window.MJNS.SectionNavigator) {

        window.MJNS.SectionNavigator.init();
    }
});
