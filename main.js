#!/usr/bin/env node

var fs = require('fs')
var _ = require('underscore')._
var winston = require('winston')

var waudconvert = require('./waudconvert')

var optimist = require('optimist')
    .options('output', {
        alias: 'o'
        , 'default': 'waudconvert'
        , describe: 'Output folder.'
    })
    .options('export', {
        alias: 'e'
        , 'default': 'm4a'
        , describe: 'Export format'
    })
    .options('log', {
        alias: 'l'
        , 'default': 'info'
        , describe: 'Log level (debug, info, notice, warning, error).'
    })
    .options('bitrate', {
        alias: 'b'
        , 'default': 128
        , describe: 'Bit rate. Works for: ac3, mp3, mp4, m4a, ogg.'
    })
    .options('vbr', {
        alias: 'v'
        , 'default': -1
        , describe: 'VBR [0-9]. Works for: mp3. -1 disables VBR.'
    })
    .options('samplerate', {
        alias: 'r'
        , 'default': 44100
        , describe: 'Sample rate.'
    })
    .options('channels', {
        alias: 'c'
        , 'default': 1
        , describe: 'Number of channels (1=mono, 2=stereo).'
    })
    .options('help', {
        alias: 'h'
        , describe: 'Show this help message.'
    })

var argv = optimist.argv
var opts = _.extend({}, argv)

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
    colorize: true
    , level: argv.log
    , handleExceptions: false
})
winston.debug('Parsed arguments', argv)

opts.logger = winston

opts.bitrate = parseInt(argv.bitrate, 10)
opts.samplerate = parseInt(argv.samplerate, 10)
opts.channels = parseInt(argv.channels, 10)
opts.vbr = parseInt(argv.vbr, 10)

var files = _.uniq(argv._)

if (argv.help || !files.length) {
    if (!argv.help) {
        winston.error('No input files specified.')
    }
    winston.info('Usage: waudconvert [options] *.mp3')
    winston.info(optimist.help())
    process.exit(1)
}

waudconvert(files, opts, function(err, obj) {
    if (err) {
        winston.error(err)
        process.exit(0)
    }
    var jsonfile = opts.output + '.json'
    fs.writeFileSync(jsonfile, JSON.stringify(obj, null, 2))
    winston.info('Exported json OK', { file: jsonfile })
    winston.info('All done')
})