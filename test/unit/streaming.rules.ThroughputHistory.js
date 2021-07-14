import ThroughputHistory from '../../src/streaming/rules/ThroughputHistory';
import Settings from '../../src/core/Settings';
import Constants from '../../src/streaming/constants/Constants';

const expect = require('chai').expect;

const context = {};

let throughputHistory;
let settings = Settings(context).getInstance();

const httpRequests = [
    {
        'type': 'MediaSegment',
        'url': 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1024x576_2500k/bbb_30fps_1024x576_2500k_1.m4v',
        'trequest': new Date('2021-07-14T12:18:49.000Z'), // time the request started
        'tresponse': new Date('2021-07-14T12:18:49.020Z'), // time the first byte was received
        'responsecode': 200,
        'trace': [
            {
                's': new Date('2021-07-14T12:18:49.000Z'), //lastTraceTime. For first element equal to request start time
                'd': 20, // Duration: Difference between event.time/currentTime and lastTraceTime:  event.time ? event.time : currentTime.getTime() - lastTraceTime.getTime(),
                'b': [
                    50000 // loaded bytes - loadedBytesFromLastProgressEvent -> How many bytes have been loaded in this progress iteration
                ]
            },
            {
                's': new Date('2021-07-14T12:18:49.020Z'),
                'd': 200,
                'b': [
                    700000
                ]
            },
            {
                's': new Date('2021-07-14T12:18:49.220Z'),
                'd': 300,
                'b': [
                    200000
                ]
            }
        ],
        '_stream': 'video',
        '_tfinish': new Date('2021-07-14T12:18:49.520Z'),
        '_mediaduration': 4,
        '_quality': 0,
        '_serviceLocation': 'https://dash.akamaized.net/akamai/bbb_30fps/'
    },
    {
        'type': 'MediaSegment',
        'url': 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1024x576_2500k/bbb_30fps_1024x576_2500k_1.m4v',
        'trequest': new Date('2021-07-14T12:18:49.000Z'), // time the request started
        'tresponse': new Date('2021-07-14T12:18:49.020Z'), // time the first byte was received
        'responsecode': 200,
        'trace': [
            {
                's': new Date('2021-07-14T12:18:49.000Z'), //lastTraceTime. For first element equal to request start time
                'd': 20, // Duration: Difference between event.time/currentTime and lastTraceTime:  event.time ? event.time : currentTime.getTime() - lastTraceTime.getTime(),
                'b': [
                    50000 // loaded bytes - loadedBytesFromLastProgressEvent -> How many bytes have been loaded in this progress iteration
                ]
            },
            {
                's': new Date('2021-07-14T12:18:49.020Z'),
                'd': 200,
                'b': [
                    200000
                ]
            },
            {
                's': new Date('2021-07-14T12:18:49.220Z'),
                'd': 300,
                'b': [
                    80000
                ]
            }
        ],
        '_stream': 'video',
        '_tfinish': new Date('2021-07-14T12:18:49.520Z'),
        '_mediaduration': 4,
        '_quality': 0,
        '_serviceLocation': 'https://dash.akamaized.net/akamai/bbb_30fps/'
    },
    {
        'type': 'MediaSegment',
        'url': 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1024x576_2500k/bbb_30fps_1024x576_2500k_1.m4v',
        'trequest': new Date('2021-07-14T12:18:49.000Z'), // time the request started
        'tresponse': new Date('2021-07-14T12:18:49.020Z'), // time the first byte was received
        'responsecode': 200,
        'trace': [
            {
                's': new Date('2021-07-14T12:18:49.000Z'), //lastTraceTime. For first element equal to request start time
                'd': 20, // Duration: Difference between event.time/currentTime and lastTraceTime:  event.time ? event.time : currentTime.getTime() - lastTraceTime.getTime(),
                'b': [
                    100000 // loaded bytes - loadedBytesFromLastProgressEvent -> How many bytes have been loaded in this progress iteration
                ]
            },
            {
                's': new Date('2021-07-14T12:18:49.020Z'),
                'd': 200,
                'b': [
                    400000
                ]
            },
            {
                's': new Date('2021-07-14T12:18:49.220Z'),
                'd': 300,
                'b': [
                    100000
                ]
            }
        ],
        '_stream': 'video',
        '_tfinish': new Date('2021-07-14T12:18:49.520Z'),
        '_mediaduration': 4,
        '_quality': 0,
        '_serviceLocation': 'https://dash.akamaized.net/akamai/bbb_30fps/'
    }
];
const expectedThroughputs = [{ a: 15200, h: 15200 }, { a: 5280, h: 5280 }, { a: 9600, h: 9600 }];
const expectedCombinedThroughputs = { a: 10026, h: 8348 };


describe('ThroughputHistory', function () {

    beforeEach(() => {
        throughputHistory = ThroughputHistory(context).create({
            settings: settings
        });
    })

    afterEach(() => {
        settings.reset();
    })


    it('push new throughput record', () => {
        throughputHistory.push('video', httpRequests[0], true);
    });

    it('push single throughput records and calculate average throughput based on arithmetic mean', () => {
        let averageThroughputs = [];
        for (let i = 0; i < httpRequests.length; i++) {
            throughputHistory.reset();
            throughputHistory.push('video', httpRequests[i], true);
            averageThroughputs.push(throughputHistory.getAverageThroughput('video', false));
        }

        expect(averageThroughputs).to.eql(expectedThroughputs.map(entry => entry.a));
    });

    it('push multiple throughput records and calculate average throughput based on arithmetic mean', () => {
        for (let i = 0; i < httpRequests.length; i++) {
            throughputHistory.push('video', httpRequests[i], true);
        }
        const averageThroughput = throughputHistory.getAverageThroughput('video', false);
        expect(parseInt(averageThroughput)).to.equal(expectedCombinedThroughputs.a);
    });

    it('push single throughput records and calculate average throughput based on harmonic mean', () => {
        settings.update({
            streaming: {
                abr: {
                    throughputHistory: {
                        meanThroughputCalculationMode: Constants.HARMONIC_MEAN
                    }
                }
            }
        })
        let averageThroughputs = [];
        for (let i = 0; i < httpRequests.length; i++) {
            throughputHistory.reset();
            throughputHistory.push('video', httpRequests[i], true);
            averageThroughputs.push(throughputHistory.getAverageThroughput('video', false));
        }

        expect(averageThroughputs).to.eql(expectedThroughputs.map(entry => entry.h));
    });

    it('push multiple throughput records and calculate average throughput based on harmonic mean', () => {
        settings.update({
            streaming: {
                abr: {
                    throughputHistory: {
                        meanThroughputCalculationMode: Constants.HARMONIC_MEAN
                    }
                }
            }
        })
        for (let i = 0; i < httpRequests.length; i++) {
            throughputHistory.push('video', httpRequests[i], true);
        }
        const averageThroughput = throughputHistory.getAverageThroughput('video', false);
        expect(parseInt(averageThroughput)).to.equal(expectedCombinedThroughputs.h);
    });

});
