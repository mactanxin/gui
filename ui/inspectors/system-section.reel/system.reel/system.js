/**
 * @module ui/system.reel
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    Model = require("core/model/model").Model;

/**
 * @class System
 * @extends Component
 */
exports.System = Component.specialize(/** @lends System# */ {

    systemGeneralData: {
        value: null
    },

    systemAdvancedData: {
        value: null
    },

    systemDatasetData: {
        value: null
    },

    consoleData: {
        value: null
    },

    datasetOptions: {
        value: []
    },

    enterDocument: {
        value: function(isFirstTime) {
            var self = this,
                loadingPromises = [];
            if(isFirstTime) {
                this.isLoading = true;
                loadingPromises.push(
                    this.application.systemAdvancedService.getSystemAdvanced().then(function(consoleData) {
                        self.systemAdvancedData = consoleData;
                    }),
                    this.application.dataService.fetchData(Model.SystemGeneral).then(function(systemGeneral) {
                        self.systemGeneralData = systemGeneral[0];
                    }),
                    this.application.systemDatasetService.getBootpoolConfig().then(function(bootPool){
                        self.datasetOptions.push({label:"Boot Pool", value:bootPool["id"]});
                    }),
                    this.application.systemDatasetService.getSystemDatasetPool().then(function(systemDatasetPool) {
                        self.systemDatasetData = systemDatasetPool.pool;
                    }),
                    this.application.storageService.listVolumes().then(function(volumesList) {
                        for (var i = 0; i < volumesList.length; i++) {
                            self.datasetOptions.push({label:volumesList[i]["id"], value:volumesList[i]["id"]});
                        }
                    })
                );
                Promise.all(loadingPromises).then(function() {
                    self._snapshotDataObjectsIfNecessary()
                    this.isLoading = false;
                });
            }
        }
    },

    save: {
        value: function() {
            var savingPromises = [];
            savingPromises.push(
                this.application.dataService.saveDataObject(this.systemGeneralData),
                this.application.dataService.saveDataObject(this.systemAdvancedData),
                this.application.systemService.changeBootPool(this.systemDatasetData)
            );
            return Promise.all(savingPromises);
        }
    },

    revert: {
        value: function() {
            this.systemGeneralData.hostname = this._systemGeneralData.hostname;
            this.systemGeneralData.syslog_server = this._systemGeneralData.syslog_server;
            this.systemAdvancedData.powerd = this._systemAdvancedData.powerd;
            this.systemAdvancedData.uploadcrash = this._systemAdvancedData.uploadcrash;
            this.systemAdvancedData.motd = this._systemAdvancedData.motd;
            this.systemDatasetData = this._systemDatasetData;
        }
    },

    _snapshotDataObjectsIfNecessary: {
        value: function() {
            if (!this._systemGeneralData) {
                this._systemGeneralData = this.application.dataService.clone(this.systemGeneralData);
            }
            if (!this._systemAdvancedData) {
                this._systemAdvancedData = this.application.dataService.clone(this.systemAdvancedData);
            }
            if (!this._systemDatasetData) {
                this._systemDatasetData = this.application.dataService.clone(this.systemDatasetData);
            }
        }
    }
});
