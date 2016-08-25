var Component = require("montage/ui/component").Component,
    BackendBridge = require('core/websocket/backend-bridge'),
    WebSocketClient = require("core/websocket/websocket-client").WebSocketClient,
    WebSocketConfiguration = require("core/websocket/websocket-configuration").WebSocketConfiguration,
    Terminal = require('xterm/src/xterm');

/**
 * @class Console
 * @extends Component
 */
exports.Console = Component.specialize({
    _term: {
        value: null
    },

    _client: {
        value: null
    },

    _defaultBackendBridge: {
        value: null
    },

    _isFirstMessage: {
        value: true
    },

    _areEventsRegistered: {
        value: false
    },

    token: {
        value: null
    },

    enterDocument: {
        value: function(isFirstTime) {
            var self = this;
            if (!this._client || !this._client.isConnected) {
                this._connect();
            }
            this._cancelResizeHandler = window.addEventListener("resize", function() { self.needsDraw = true; });
        }
    },

    exitDocument: {
        value: function() {
            if (typeof this._cancelResizeHandler === "function") {
                this._cancelResizeHandler();
                this._cancelResizeHandler = null;
            }
        }
    },

    draw: {
        value: function() {
            this._resizeTerminal();
        }
    },

    handleWebSocketMessage: {
        value: function(event) {
            var data = event.detail;
            try {
                JSON.parse(data);
            } catch (e) {
                var self = this,
                    reader = new FileReader();
                reader.addEventListener('loadend', function() {
                    self._term.write(reader.result);
                    if (self._isFirstMessage) {
                        self._isFirstMessage = false;
                        self.needsDraw = true;
                    }
                });
                reader.readAsBinaryString(data);
            }
        }
    },

    handleWebSocketClose: {
        value: function() {
            if (this._inDocument) {
                this._connect();
            }
        }
    },

    _connect: {
        value: function() {
            var self = this;
            this._client = new WebSocketClient().initWithUrl(WebSocketConfiguration.configuration.get(WebSocketConfiguration.KEYS.URL));
            this._client.responseType = WebSocketClient.RESPONSE_TYPE.BINARY_BLOB;
            this._defaultBackendBridge = BackendBridge.defaultBackendBridge;
            this._client.connect().then(function() {
                if (!self._term) {
                    self._term = new Terminal({
                        cols: 80,
                        rows: 25,
                        screenKeys: true
                    });
                    self._term.open(self.terminalElement);
                }
            }).then(function() {
                if (!self._areEventsregistered) {
                    self._term.on('data', function(data) {
                        self._client.sendMessage(data);
                    });
                    self._areEventsregistered = true;
                }
                self._client.addEventListener('webSocketMessage', self, false);
                self._client.addEventListener('webSocketClose', self, false);
                self._client.sendMessage(JSON.stringify({token: self.token}));
            });
        }
    },

    _resizeTerminal: {
        value: function() {
            if (this._term) {
                var line = this._term.children[0],
                    container = this.terminalElement.parentElement,
                    lines = Math.floor(container.offsetHeight / line.offsetHeight) - 2,
                    columns = this._getColumns();
                this._term.resize(columns, lines);
                this._term.options.geometry = this._term.geometry = [columns, lines];
            }
        }
    },

    _getColumns: {
        value: function() {
            var fontSize = Number(getComputedStyle(this._term.children[0], "").fontSize.match(/(\d*(\.\d*)?)px/)[1]);
            this.terminalElement.firstElementChild.style.display = 'none';
            var currentWidth = this.terminalElement.getBoundingClientRect().width;
            this.terminalElement.firstElementChild.style.display = 'block';
            this._oldWidth = currentWidth;
            return Math.floor(currentWidth / fontSize * 1.6) - 4;
        }
    }
});
