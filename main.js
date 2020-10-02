'use strict';

/*
 * PJLink Adapter V2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

var iporhost, port, password, polltime, protocol;

iporhost = '192.168.1.13';
port = '4352';
password = '';
polltime = 5000;
protocol = 1;

var av_mute;
var powerState;

// Load your modules here, e.g.:
// const fs = require("fs");

const pjlink = require(__dirname + '/lib/pjlink');

class pjlinkv2 extends utils.Adapter {

    /*
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super(Object.assign(options || {}, {
            name: 'pjlinkv2',
            systemConfig: true,
        }));

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /*
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        this.log.info(`Starting PJLink V2...`);
        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:

        // this.log.info('config option1: ' + this.config.option1);
        // this.log.info('config option2: ' + this.config.option2);

        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */
// Start creating objects....
        // Create Control Objects
        await this.setObjectNotExistsAsync('on', {
            type: 'state',
            common: {name: 'Turn device on/off', type: 'boolean', role: 'button', read: true, write: true},
            native: {},
        });
        this.log.silly('Create Object .on');
        await this.setObjectNotExistsAsync('inputSource', {
            type: 'state',
            common: {name: 'Input Source', type: 'number', role: 'state', read: true, write: true},
            native: {},
        });
        this.log.silly('Create Object .inputSource');
        await this.setObjectNotExistsAsync('muteAudio', {
            type: 'state',
            common: {name: 'Turn audio mute on/off', type: 'boolean', role: 'button', read: true, write: true},
            native: {},
        });
        this.log.silly('Create Object .muteAudio');
        await this.setObjectNotExistsAsync('muteVideo', {
            type: 'state',
            common: {name: 'Turn video mute on/off', type: 'boolean', role: 'button', read: true, write: true},
            native: {},
        });
        this.log.silly('Create Object .muteVideo');
        await this.setObjectNotExistsAsync('muteAV', {
            type: 'state',
            common: {name: 'Turn audio and video mute on/off', type: 'boolean', role: 'button', read: true, write: true},
            native: {},
        });
        this.log.silly('Create Object .muteAV');

        // Create Info Objects
        await this.setObjectNotExistsAsync('info.isPower', {
            type: 'state',
            common: {name: 'Device power state', type: 'number', role: 'state', read: true, write: false,
                states: {"0": "Off", "1": "On", "2": "CoolDown", "3": "WarmUp"},
            },
            native: {},
        });
        this.log.silly('Create Object .info.isPower');
        await this.setObjectNotExistsAsync('info.name', {
            type: 'state',
            common: {name: 'Projector Name', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.name');
        await this.setObjectNotExistsAsync('info.vendor', {
            type: 'state',
            common: {name: 'Manufacturer information', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.vendor');
        await this.setObjectNotExistsAsync('info.model', {
            type: 'state',
            common: {name: 'Model information', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.model');
        await this.setObjectNotExistsAsync('info.inputSources', {
            type: 'state',
            common: {name: 'Available input sources', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.inputSources');
        await this.setObjectNotExistsAsync('info.isInput', {
            type: 'state',
            common: {name: 'Current input source', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.isInput');
        await this.setObjectNotExistsAsync('info.error', {
            type: 'state',
            common: {name: 'Current error state', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.error');
        await this.setObjectNotExistsAsync('info.errorText', {
            type: 'state',
            common: {name: 'Error state text', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.errorText');
        await this.setObjectNotExistsAsync('info.class', {
            type: 'state',
            common: {name: 'PJLink Class#', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.class');
        await this.setObjectNotExistsAsync('info.other', {
            type: 'state',
            common: {name: 'Other information (i.e. current resolution)', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.other');
        await this.setObjectNotExistsAsync('info.connection', {
            type: 'state',
            common: {name: 'If connected to device', type: 'boolean', role: 'indicator.connection', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.connection');
        await this.setObjectNotExistsAsync('info.audioMute', {
            type: 'state',
            common: {name: 'Current audio mute state', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.audioMute');
        await this.setObjectNotExistsAsync('info.videoMute', {
            type: 'state',
            common: {name: 'Current video mute state', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.videoMute');

        // just because some projectors have two lamps...
        await this.setObjectNotExistsAsync('info.lightingHours#1', {
            type: 'state',
            common: {name: 'Lighting hours for lamp #1', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.lightingHours#1');
        await this.setObjectNotExistsAsync('info.lampOn#1', {
            type: 'state',
            common: {name: 'State for lamp #1', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.lampOn#1');

        await this.setObjectNotExistsAsync('info.lightingHours#2', {
            type: 'state',
            common: {name: 'Lighting hours for lamp #2', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.lightingHours#2');
        await this.setObjectNotExistsAsync('info.lampOn#2', {
            type: 'state',
            common: {name: 'State for lamp #1', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.silly('Create Object .info.lampOn#2');
// end of creating objects

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        //this.subscribeStates('power_state');

        // Subscriptions
        this.subscribeStates('on');
        this.subscribeStates('inputSource');
        this.subscribeStates('muteAudio');
        this.subscribeStates('muteVideo');
        this.subscribeStates('muteAV');

        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates('lights.*');
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates('*');

        /*
            setState examples
            you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        //await this.setStateAsync('testVariable', true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        //await this.setStateAsync('power_state', { val: true, ack: true });

// Fetching initial information
        // Fetching some initial device information
        pjlink(iporhost, port, password, "%1CLSS ?", (result) => {
            this.setStateAsync('info.class', {val: result, ack: true});
            this.log.silly('Initial fetching info.class = ' + result);
            // Throw log entry if class1 is selected but class2 supported and vice versa
            if (result != protocol) {
                this.log.warn(`PJLink Class#${protocol} ist configured, but device supports Class#${result}. Consider changing your config.`);
            }

            pjlink(iporhost, port, password, "%1NAME ?", (result) => {
                this.setStateAsync('info.name', {val: result, ack: true});
                this.log.silly('Initial fetching info.name = ' + result);

                pjlink(iporhost, port, password, "%1INF1 ?", (result) => {
                    this.setStateAsync('info.vendor', {val: result, ack: true});
                    this.log.silly('Initial fetching info.vendor = ' + result);

                    pjlink(iporhost, port, password, "%1INF2 ?", (result) => {
                        this.setStateAsync('info.model', {val: result, ack: true});
                        this.log.silly('Initial fetching info.model = ' + result);

                        pjlink(iporhost, port, password, "%1INFO ?", (result) => {
                            this.setStateAsync('info.other', {val: result, ack: true});
                            this.log.silly('Initial fetching info.other = ' + result);

                            pjlink(iporhost, port, password, "%1LAMP ?", (result) => {
                                let getLamps = result.split (' ')
                                this.log.silly('Initial fetching lamp information: ' + getLamps);

                                if (getLamps.length === 2) {     // legth of 2 means, two parameters for one lamp
                                    this.setStateAsync('info.lightingHours#1', {val: getLamps[0], ack: true});
                                    this.log.silly('set lightingHours for Lamp#1 ' + getLamps[0]);
                                    this.setStateAsync('info.lampOn#1', {val: getLamps[1] ? true : false , ack: true});
                                    this.log.silly('set lampOn for Lamp#1 ' + (getLamps[1] ? true : false));
                                } else {                     // if there are 2 lamps....
                                    this.setStateAsync('info.lightingHours#2', {val: getLamps[2], ack: true});
                                    this.log.silly('set lightingHours for Lamp#2 ' + getLamps[2]);
                                    this.setStateAsync('info.lampOn#2', {val: getLamps[3], ack: true});
                                    this.log.silly('set lampOn for Lamp#2 ' + getLamps[3]);
                                }
                            });
                        });
                    });
                });
            });
        });

// End of fetching initials information

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        //await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

        // examples for the checkPassword/checkGroup functions
        //let result = await this.checkPasswordAsync('admin', 'iobroker');
        //this.log.info('check user admin pw iobroker: ' + result);

        //result = await this.checkGroupAsync('admin', 'admin');
        //this.log.info('check group user admin group admin: ' + result);

// Start fetching current states
        setInterval(() => {
            // get power state
            pjlink(iporhost, port, password, "%1POWR ?", (result) => {
                this.log.silly('By interval: check connectivity and power state = ' + result);
                if (result >= 0 && result <= 3) {
                    this.setStateAsync('info.connection', {val: true, ack: true});
                    this.setStateAsync('info.isPower', {val: result, ack: true});
                } else {
                    this.setStateAsync('info.connection', {val: false, ack: true});
                }
                if (result === 1) {powerState = 'on';} else {powerState = 'off';}
                this.log.silly('By interval: PowerState = ' + powerState);

                // get error Status
                pjlink(iporhost, port, password, "%1ERST ?", (result) => {
                    this.setStateAsync('info.error', {val: result, ack: true});
                    this.log.silly('By interval: fetching info.error = '+result);
                    var errorText = '';
                    switch (result.substr(0,1)) {
                        case '0':
                            errorText = errorText + 'Fan OK, ';
                            break;
                        case '1':
                            errorText = errorText + 'Fan Warning, ';
                            this.log.warn('Fan Warning!');
                            break;
                        case '2':
                            errorText = errorText + 'Fan Error, ';
                            this.log.error('Fan Error');
                    }
                    switch (result.substr(1,1)) {
                        case '0':
                            errorText = errorText + 'Lamp OK, ';
                            break;
                        case '1':
                            errorText = errorText + 'Lamp Warning, ';
                            this.log.warn('Lamp Warning!');
                            break;
                        case '2':
                            errorText = errorText + 'Lamp Error, ';
                            this.log.error('Lamp Error!');
                    }
                    switch (result.substr(2,1)) {
                        case '0':
                            errorText = errorText + 'Temperature OK, ';
                            break;
                        case '1':
                            errorText = errorText + 'Temperature Warning, ';
                            this.log.warn('Temperature Warning!');
                            break;
                        case '2':
                            errorText = errorText + 'Temperature Error, ';
                            this.log.error('Temperature Error!');
                    }
                    switch (result.substr(3,1)) {
                        case '0':
                            errorText = errorText + 'Cover open OK, ';
                            break;
                        case '1':
                            errorText = errorText + 'Cover open Warning, ';
                            this.log.warn('Cover open Warning!');
                            break;
                        case '2':
                            errorText = errorText + 'Cover open Error, ';
                            this.log.error('Cover open Error!');
                    }
                    switch (result.substr(4,1)) {
                        case '0':
                            errorText = errorText + 'Filter OK, ';
                            break;
                        case '1':
                            errorText = errorText + 'Filter Warning, ';
                            this.log.warn('Filter Warning!');
                            break;
                        case '2':
                            errorText = errorText + 'Filter Error, ';
                            this.log.error('Fan Error!');
                    }
                    switch (result.substr(5,1)) {
                        case '0':
                            errorText = errorText + 'Other OK';
                            break;
                        case '1':
                            errorText = errorText + 'Other Warning';
                            this.log.warn('Other Warning!');
                            break;
                        case '2':
                            errorText = errorText + 'Other Error';
                            this.log.error('Other Error!');
                    }
                    this.setStateAsync('info.errorText', {val: errorText, ack: true});

                    // get input states
                    pjlink(iporhost, port, password, "%1INPT ?", (result) => {
                        this.log.silly('By interval: fetching info.isInput = ' + result);
                        this.setStateAsync('info.isInput', {val: result, ack: true});

                        pjlink(iporhost, port, password, "%1AVMT ?", (result) => {
                            this.log.silly('By interval: check AVMT = ' + result);
                            switch (result) {
                                case '31':
                                    this.setStateAsync('info.videoMute', {val: true, ack: true});
                                    this.setStateAsync('info.audioMute', {val: true, ack: true});
                                    av_mute = 31;
                                    break;
                                case '30':
                                    this.setStateAsync('info.videoMute', {val: false, ack: true});
                                    this.setStateAsync('info.audioMute', {val: false, ack: true});
                                    av_mute = 30;
                                    break;
                                case '21':
                                    this.setStateAsync('info.videoMute', {val: false, ack: true});
                                    this.setStateAsync('info.audioMute', {val: true, ack: true});
                                    av_mute = 21;
                                    break;
                                case '20':
                                    this.setStateAsync('info.videoMute', {val: false, ack: true});
                                    this.setStateAsync('info.audioMute', {val: false, ack: true});
                                    av_mute = 20;
                                    break;
                                case '11':
                                    this.setStateAsync('info.videoMute', {val: true, ack: true});
                                    this.setStateAsync('info.audioMute', {val: false, ack: true});
                                    av_mute = 11;
                                    break;
                                case '10':
                                    this.setStateAsync('info.videoMute', {val: false, ack: true});
                                    this.setStateAsync('info.audioMute', {val: false, ack: true});
                                    av_mute = 10;
                            }

                        });
                    });
                });
            });
        }, polltime);
    }

    /*
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with 'this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /*
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    /*onStateChange(id, state) {
       if (state) {
           // The state was changed
           this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
       } else {
           // The state was deleted
           this.log.info(`state ${id} deleted`);
       }
   }*/

// React on state changes (which state was changed > state, state value > state.val)
    onStateChange(id, state) {
        if (state) {
            // Power state changed
            if(id.includes(".on")) {
                if (state.val) {
                    pjlink(iporhost, port, password, `%1POWR ?`, (power) => {
                        this.log.silly('OnChange: Current power state = ' + power);
                        if (power === '0') {
                            pjlink(iporhost, port, password, `%1POWR 1`, (result) => {
                                this.log.silly('OnChange: Send POWR 1 to device = ' + result);
                            });
                        }
                        if (power === '1') {
                            pjlink(iporhost, port, password, `%1POWR 0`, (result) => {
                                this.log.silly('OnChange: Send POWR 1 to device = ' + result);
                            });
                        }
                    });
                }
            }

            // Input changed
            if(id.includes(".inputSource")) {
                if (powerState === 'on') {
                    pjlink(iporhost, port, password, '%1INPT ' + state.val, (result) => {
                        this.log.silly("OnChange: input source = " + result);
                    });
                }
            }

            // mute_AV changed
            if(id.includes(".muteAV")) {
                if (av_mute === 31) {
                    pjlink(iporhost, port, password, '%1AVMT 30', (result) => {
                        this.log.silly("OnChange: Audio & Video Mute off = " + result);
                    });
                } else {
                    pjlink(iporhost, port, password, '%1AVMT 31', (result) => {
                        this.log.silly("OnChange: Audio & Video Mute on = " + result);
                    });
                }
            }

            // muteAudio changed
            if(id.includes(".muteAudio")) {
                if (state.val) {
                    this.log.silly('OnChange: muteAudio / current AVMT state = ' + av_mute);
                    switch (av_mute) {
                        case 31: // videoMute on, audioMute on
                            this.setStateAsync('info.audioMute', {val: false, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 10', (result) => {
                                av_mute = 10;
                                this.log.silly('OnChange: set AVMT to 10 = ' + result);
                            });
                            break;
                        case 30: // videoMute off, audioMute off
                            this.setStateAsync('info.audioMute', {val: true, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 21', (result) => {
                                av_mute = 20;
                                this.log.silly('OnChange: set AVMT to 21 = ' + result);
                            });
                            break;
                        case 21:
                            this.setStateAsync('info.audioMute', {val: false, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 20', (result) => {
                                av_mute = 20;
                                this.log.silly('OnChange: set AVMT to 20 = ' + result);
                            });
                            break;
                        case 20:
                            this.setStateAsync('info.audioMute', {val: true, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 21', (result) => {
                                av_mute = 21;
                                this.log.silly('OnChange: set AVMT to 21 = ' + result);
                            });
                    }
                }
            }

            // mute_Video changed
            if(id.includes(".muteVideo")) {
                if (state.val) {
                    this.log.silly('OnChange: Current AVMT state = ' + av_mute);
                    switch (av_mute) {
                        case 31: // videoMute on, audioMute on
                            this.setStateAsync('info.videoMute', {val: false, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 21', (result) => {
                                av_mute = 21;
                                this.log.silly('OnChange: set AVMT to 21 = ' + result);
                            });
                            break;
                        case 30: // videoMute off, audioMute off
                            this.setStateAsync('info.videoMute', {val: true, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 11', (result) => {
                                av_mute = 10;
                                this.log.silly('OnChange: set AVMT to 11 = ' + result);
                            });
                            break;
                        case 11:
                            this.setStateAsync('info.videoMute', {val: false, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 10', (result) => {
                                av_mute = 10;
                                this.log.silly('OnChange: set AVMT to 10 = ' + result);
                            });
                            break;
                        case 10:
                            this.setStateAsync('info.videoMute', {val: true, ack: true});
                            pjlink(iporhost, port, password, '%1AVMT 11', (result) => {
                                av_mute = 11;
                                this.log.silly('OnChange: set AVMT to 11 = ' + result);
                            });
                    }
                }
            }


            // Debug (what was changed)
            // this.log.silly('state ${id} changed: ${state.val} (ack = ${state.ack})');
        }
    }
// End of react on changes

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === 'object' && obj.message) {
    //         if (obj.command === 'send') {
    //             // e.g. send email or pushover or whatever
    //             this.log.info('send command');

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    //         }
    //     }
    // }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /*
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new pjlinkv2(options);
} else {
    // otherwise start the instance directly
    new pjlinkv2();
}