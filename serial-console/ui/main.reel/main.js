/**
 * @module ui/main.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {

    token: {
        value: null
    },

    enterDocument: {
        value: function() {
            this.token = window.location.hash.slice(1);
        }
    }
});
