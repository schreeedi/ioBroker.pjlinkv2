'use strict';

/*
 * PJLink Adapter V2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const adapterName = require('./package.json').name.split('.').pop();

var iporhost, port, password, polltime, protocol;
var av_mute;
var powerState;

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
        this.log.info('Starting PJLink V2 Adapter...');
        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:

// Device Properties (defined by admin interface)
    if (this.config.myiporhost) {
        iporhost = this.config.myiporhost;
        port = this.config.myport;
        polltime = this.config.mypolltime;
        password = this.config.mysecret;
        protocol = this.config.myprotocol;
        this.log.info('Trying to connect to:' + iporhost + ' on port:' + port);
    } else {
        return;
    }
        
// Start creating objects....
        // Create Control Objects
        this.log.debug('Create Object .on');
        await this.setObjectNotExistsAsync('on', {
            type: 'state',
            common: {name: 'Switch device on/off', type: 'boolean', role: 'state', read: true, write: true},
            native: {},
        });

        this.log.debug('Create Object .inputSource');
        await this.setObjectNotExistsAsync('inputSource', {
            type: 'state',
            common: {name: 'Input Source', type: 'number', role: 'state', read: true, write: true},
            native: {},
        });

        this.log.debug('Create Object .muteAudio');
        await this.setObjectNotExistsAsync('muteAudio', {
            type: 'state',
            common: {name: 'Turn audio mute on/off', type: 'boolean', role: 'button', read: true, write: true},
            native: {},
        });

        this.log.debug('Create Object .muteVideo');
        await this.setObjectNotExistsAsync('muteVideo', {
            type: 'state',
            common: {name: 'Turn video mute on/off', type: 'boolean', role: 'button', read: true, write: true},
            native: {},
        });

        this.log.debug('Create Object .muteAV');
        await this.setObjectNotExistsAsync('muteAV', {
            type: 'state',
            common: {name: 'Turn audio and video mute on/off', type: 'boolean', role: 'button', read: true, write: true},
            native: {},
        });

        // Create Info Objects
        this.log.debug('Create Object .info.isPower');
        await this.setObjectNotExistsAsync('info.isPower', {
            type: 'state',
            common: {name: 'Device power state', type: 'number', role: 'state', read: true, write: false,
                states: {"0": "Off", "1": "On", "2": "CoolDown", "3": "WarmUp"},
            },
            native: {},
        });

        this.log.debug('Create Object .info.name');
        await this.setObjectNotExistsAsync('info.name', {
            type: 'state',
            common: {name: 'Projector Name', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.vendor');
        await this.setObjectNotExistsAsync('info.vendor', {
            type: 'state',
            common: {name: 'Manufacturer information', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.model');
        await this.setObjectNotExistsAsync('info.model', {
            type: 'state',
            common: {name: 'Model information', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.inputSources');
        await this.setObjectNotExistsAsync('info.inputSources', {
            type: 'state',
            common: {name: 'Available input sources', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.isInput');
        await this.setObjectNotExistsAsync('info.isInput', {
            type: 'state',
            common: {name: 'Current input source', type: 'number', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.isInputName');
        await this.setObjectNotExistsAsync('info.isInputName', {
            type: 'state',
            common: {name: 'Current input source Name', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.error');
        await this.setObjectNotExistsAsync('info.error', {
            type: 'state',
            common: {name: 'Current error state', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });
        
        this.log.debug('Create Object .info.errorText');
        await this.setObjectNotExistsAsync('info.errorText', {
            type: 'state',
            common: {name: 'Error state text', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.class');
        await this.setObjectNotExistsAsync('info.class', {
            type: 'state',
            common: {name: 'PJLink Class#', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.other');
        await this.setObjectNotExistsAsync('info.other', {
            type: 'state',
            common: {name: 'Other information (i.e. current resolution)', type: 'string', role: 'indicator', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.connection');
        await this.setObjectNotExistsAsync('info.connection', {
            type: 'state',
            common: {name: 'If connected to device', type: 'boolean', role: 'indicator.connection', read: true, write: false},
            native: {},
        });

       await this.setObjectNotExistsAsync('info.audioMute', {
            type: 'state',
            common: {name: 'Current audio mute state', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.debug('Create Object .info.audioMute');
        await this.setObjectNotExistsAsync('info.videoMute', {
            type: 'state',
            common: {name: 'Current video mute state', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        this.log.debug('Create Object .info.videoMute');

        // just because some projectors have two lamps...
        this.log.debug('Create Object .info.lightingHours#1');
        await this.setObjectNotExistsAsync('info.lightingHours#1', {
            type: 'state',
            common: {name: 'Lighting hours for lamp #1', type: 'string', role: 'state', read: true, write: false},
            native: {},
        });

        this.log.debug('Create Object .info.lampOn#1');
        await this.setObjectNotExistsAsync('info.lampOn#1', {
            type: 'state',
            common: {name: 'State for lamp #1', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
        
        this.log.debug('Create Object .info.lightingHours#2');
        await this.setObjectNotExistsAsync('info.lightingHours#2', {
            type: 'state',
            common: {name: 'Lighting hours for lamp #2', type: 'string', role: 'state', read: true, write: false},
            native: {},
        });
        
        this.log.debug('Create Object .info.lampOn#2');
        await this.setObjectNotExistsAsync('info.lampOn#2', {
            type: 'state',
            common: {name: 'State for lamp #1', type: 'boolean', role: 'state', read: true, write: false},
            native: {},
        });
// end of creating objects

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        //this.subscribeStates('power_state');

        // Subscriptions
        this.subscribeStates('on');
        this.subscribeStates('inputSource');
//        this.subscribeStates('muteAudio');
//        this.subscribeStates('muteVideo');
//         this.subscribeStates('muteAV');

// Fetching initial information
        pjlink(iporhost, port, password, "%1CLSS ?", (result) => {
            this.setStateAsync('info.class', {val: result, ack: true});
            this.log.debug('Initial fetching info.class = ' + result);
            // Throw log entry if class1 is selected but class2 supported and vice versa
            if (result != protocol) {
                this.log.warn(`PJLink Class${protocol} ist configured, but device returns Class ${result}. Consider changing your config.`);
            } else {
                this.log.info(`Communication with ${iporhost} established, using PJLink Class${protocol} protocol.`);
            }

            pjlink(iporhost, port, password, "%1NAME ?", (result) => {
                this.setStateAsync('info.name', {val: result, ack: true});
                this.log.debug('Initial fetching info.name = ' + result);

                pjlink(iporhost, port, password, "%1INF1 ?", (result) => {
                    this.setStateAsync('info.vendor', {val: result, ack: true});
                    this.log.debug('Initial fetching info.vendor = ' + result);

                    pjlink(iporhost, port, password, "%1INF2 ?", (result) => {
                        this.setStateAsync('info.model', {val: result, ack: true});
                        this.log.debug('Initial fetching info.model = ' + result);

                        pjlink(iporhost, port, password, "%1INFO ?", (result) => {
                            this.setStateAsync('info.other', {val: result, ack: true});
                            this.log.debug('Initial fetching info.other = ' + result);

                          pjlink(iporhost, port, password, "%1INST ?", (result) => {
                              this.setStateAsync('info.inputSources', {val: result, ack: true});
                              this.log.debug('Initial fetching info.inputSources = ' + result);                            

                            pjlink(iporhost, port, password, "%1LAMP ?", (result) => {
                                let getLamps = result.split (' ')
                                this.log.debug('Initial fetching lamp information: ' + getLamps);

                                if (getLamps.length === 2) {     // legth of 2 means, two parameters for one lamp
                                    this.setStateAsync('info.lightingHours#1', {val: getLamps[0], ack: true});
                                    this.log.debug('set lightingHours for Lamp#1 ' + getLamps[0]);
                                    this.setStateAsync('info.lampOn#1', {val: getLamps[1] ? true : false , ack: true});
                                    this.log.debug('set lampOn for Lamp#1 ' + (getLamps[1] ? true : false));
                                } else {                     // if there are 2 lamps....
                                    this.setStateAsync('info.lightingHours#2', {val: getLamps[2], ack: true});
                                    this.log.debug('set lightingHours for Lamp#2 ' + getLamps[2]);
                                    this.setStateAsync('info.lampOn#2', {val: getLamps[3] ? true : false, ack: true});
                                    this.log.debug('set lampOn for Lamp#2 ' + (getLamps[3] ? true : false));
                                }
                            });
                           });
                        });
                    });
                });
            });
        });
// End of fetching initials information

// Start fetching current states
        setInterval(() => {
            // get power state and check connectivity
            pjlink(iporhost, port, password, "%1POWR ?", (result) => {
                this.log.debug('By interval: check connectivity and power state = ' + result);

                if (result == 'Error: Device not responding'){
                    this.setStateAsync('info.connection', {val: false, ack: true});
                    return;
                } else {
                    this.setStateAsync('info.connection', {val: true, ack: true});
                }
                if (result == 'ERR3') {this.log.error('Power toggle result in Unavailable time (ERR3)'); }
                if (result == 'ERR4') {this.log.error('Power toggle result in Projector/Display failure (ERR4)'); }

                // device on or off
                result = parseInt(result,10);
                this.setStateAsync('info.isPower', {val: result, ack: true});
                
                if (result === 1) {powerState = 'on';
                          this.setStateAsync('on', {val: true, ack: true});
                    }
                if (result === 0) {powerState = 'off';
                          this.setStateAsync('on', {val: false, ack: true}); 
                          // schöner machen!!!
                          this.setStateAsync('info.isInput', {val: 0, ack: true});
                          this.setStateAsync('info.isInputName', {val: 'none', ack: true});
                          this.setStateAsync('inputSource', {val: 0, ack: false});
                        return;
                    } 
                this.log.debug('By interval: PowerState = ' + powerState)
                
                // get error Status
                pjlink(iporhost, port, password, "%1ERST ?", (result) => {
                    this.setStateAsync('info.error', {val: result, ack: true});
                    this.log.debug('By interval: fetching info.error = '+result);
                    this.setStateAsync('info.errorText', {val: translateErrorState(result), ack: true});

                    // get input state
                    pjlink(iporhost, port, password, "%1INPT ?", (result) => {
                        this.log.debug('By interval: fetching info.isInput = ' + result);
                        // this is not perfect - but it works!!!
                        this.setStateAsync('info.isInput', {val: parseInt(result,10), ack: true});
                        this.setStateAsync('info.isInputName', {val: translateInputName(result), ack: true});
                        this.setStateAsync('inputSource', {val: parseInt(result,10), ack: false});
                
                        // get Audio / Video mute state
                        pjlink(iporhost, port, password, "%1AVMT ?", (result) => {
                            this.log.debug('By interval: check AVMT = ' + result);
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
        clearInterval();
        try {
            callback();
        } catch (e) {
            callback();
        }
    }

// React on state changes (which state was changed > state, state value > state.val)
    onStateChange(id, state) {
        if (state) {
            // Power state switch (on / off)
            if(id.includes(".on")) {
                
                // true = on
                if (state.val === true) {
                    pjlink(iporhost, port, password, `%1POWR 1`, (result) => {
                        this.log.debug('OnChange: Send POWR 1 to device = ' + result);
                        if (result != 'OK') {this.log.error('Power On result: ' + result); }
                    });
                } else {
                    pjlink(iporhost, port, password, `%1POWR 0`, (result) => {
                        this.log.debug('OnChange: Send POWR 0 to device = ' + result);
                        if (result != 'OK') {this.log.error('Power Off result: ' + result); }
                    });
                }
            }
        
            // Input changed
            if(id.includes(".inputSource")) {
                if (powerState === 'on') {
                    pjlink(iporhost, port, password, '%1INPT ' + state.val, (result) => {
                        this.log.debug("OnChange: input source = " + state.val + ' result: ' + result);
                    });
                }
            }

    // mute_AV changed - not working correctly, properbly only with my device???

//           if(id.includes(".muteAV")) {
 //               if (av_mute === 31) {
 //                   pjlink(iporhost, port, password, '%1AVMT 30', (result) => {
 //                       this.log.debug("OnChange: Audio & Video Mute off = " + result);
 //                   });
 //               } else {
 //                   pjlink(iporhost, port, password, '%1AVMT 31', (result) => {
 //                       this.log.debug("OnChange: Audio & Video Mute on = " + result);
 //                   });
 //               }
 //           }

            // muteAudio changed
 //           if(id.includes(".muteAudio")) {
 //               if (state.val) {
 //                   this.log.debug('OnChange: muteAudio / current AVMT state = ' + av_mute);
 //                   switch (av_mute) {
 //                       case 31: // videoMute on, audioMute on
 //                           this.setStateAsync('info.audioMute', {val: false, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 10', (result) => {
 //                               av_mute = 10;
 //                               this.log.debug('OnChange: set AVMT to 10 = ' + result);
 //                           });
 //                           break;
 //                       case 30: // videoMute off, audioMute off
 //                           this.setStateAsync('info.audioMute', {val: true, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 21', (result) => {
 //                               av_mute = 20;
 //                               this.log.debug('OnChange: set AVMT to 21 = ' + result);
 //                               if (result != 'OK') {this.log.error('muteAudio result: ' + result); }
 //                           });
 //                           break;
 //                       case 21: // audioMute on
 //                           this.setStateAsync('info.audioMute', {val: false, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 20', (result) => {
 //                               av_mute = 20;
 //                               this.log.debug('OnChange: set AVMT to 20 = ' + result);
 //                           });
 //                           break;
 //                       case 20: // audioMute off
 //                           this.setStateAsync('info.audioMute', {val: true, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 21', (result) => {
 //                               av_mute = 21;
 //                               this.log.debug('OnChange: set AVMT to 21 = ' + result);
 //                               if (result != 'OK') {this.log.error('muteAudio result: ' + result); }
 //                           });
 //                   }
 //               }
 //           }

            // mute_Video changed
 //           if(id.includes(".muteVideo")) {
 //               if (state.val) {
 //                   this.log.debug('OnChange: Current AVMT state = ' + av_mute + ' set to = ' + state.val);
 //                   switch (av_mute) {
 //                       case 31: // videoMute on, audioMute on
 //                           this.setStateAsync('info.videoMute', {val: false, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 21', (result) => {
 //                               av_mute = 21;
 //                               this.log.debug('OnChange: set AVMT to 21 = ' + result);
 //                           });
 //                           break;
 //                       case 30: // videoMute off, audioMute off
 //                           this.setStateAsync('info.videoMute', {val: true, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 11', (result) => {
 //                               av_mute = 10;
 //                               this.log.debug('OnChange: set AVMT to 11 = ' + result);
 //                               if (result != 'OK') {this.log.error('muteVideo result: ' + result); }
 //                           });
 //                           break;
 //                       case 11: // videoMute on
 //                           this.setStateAsync('info.videoMute', {val: false, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 10', (result) => {
 //                               av_mute = 10;
 //                               this.log.debug('OnChange: set AVMT to 10 = ' + result);
 //                           });
 //                           break;
 //                       case 10: // videoMute off
 //                           this.setStateAsync('info.videoMute', {val: true, ack: true});
 //                           pjlink(iporhost, port, password, '%1AVMT 11', (result) => {
 //                               av_mute = 11;
 //                               this.log.debug('OnChange: set AVMT to 11 = ' + result);
 //                               if (result != 'OK') {this.log.error('muteVideo result: ' + result); }
 //                           });
 //                   }
 //               }
 //           }

        }
    }
    // End of react on changes
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



// Some translations...
function translateErrorState (n) {
    var errorText;

    switch (n.substr(0,1)) {
     case '0':
        errorText = errorText + 'Fan OK, ';
        break;
     case '1':
        errorText = errorText + 'Fan Warning, ';
        break;
     case '2':
        errorText = errorText + 'Fan Error, ';
    }
    
    switch (n.substr(1,1)) {
     case '0':
        errorText = errorText + 'Lamp OK, ';
        break;
     case '1':
        errorText = errorText + 'Lamp Warning, ';
        break;
     case '2':
        errorText = errorText + 'Lamp Error, ';
    }

    switch (n.substr(2,1)) {
     case '0':
        errorText = errorText + 'Temperature OK, ';
        break;
     case '1':
        errorText = errorText + 'Temperature Warning, ';
        break;
     case '2':
        errorText = errorText + 'Temperature Error, ';
    }

    switch (n.substr(3,1)) {
     case '0':
        errorText = errorText + 'Cover open OK, ';
        break;
     case '1':
        errorText = errorText + 'Cover open Warning, ';
        break;
     case '2':
        errorText = errorText + 'Cover open Error, ';
    }

    switch (n.substr(4,1)) {
     case '0':
        errorText = errorText + 'Filter OK, ';
        break;
     case '1':
        errorText = errorText + 'Filter Warning, ';
        break;
     case '2':
        errorText = errorText + 'Filter Error, ';
    }

    switch (n.substr(5,1)) {
     case '0':
        errorText = errorText + 'Other OK';
        break;
     case '1':
        errorText = errorText + 'Other Warning';
        break;
     case '2':
        errorText = errorText + 'Other Error';
    }
 return (errorText);
}


// Hardwired... should be moved to admin interface!!!
function translateInputName(n) {
    switch (n) {
        case '0':
            return 'none';
            break;
        case '11':
            return 'S-Video';
            break;
        case '21':
            return 'VGA 1';
            break;
        case '22':
            return 'VGA 2';
             break;            
        case '31':
            return 'HDMI 1';
            break;
        case '32':
            return 'HDMI 2';
            break;
        case '41':
            return 'USB';
            break;
        case '51':
            return 'Network';
            break;
    }
}
