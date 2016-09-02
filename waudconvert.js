var fs = require('fs')
var path = require('path')
var async = require('async')
var _ = require('underscore')._

var defaults = {
    output: "sprite",
    path: "",
    export: "m4a",
    format: null,
    bitrate: 128,
    vbr: -1,
    samplerate: 44100,
    channels: 1,
    logger: {
        debug: function () {
        },
        info: function () {
        },
        log: function () {
        }
    }
};

module.exports = function (files) {
    if (files.length === 1 && files[0].indexOf("*.") > -1) {
        var filesList = files[0].split(/[\/\\]/);
        var extension;
        var basePath = "./";
        if (filesList.length > 1) {
            var lastElement = filesList.pop();
            extension = lastElement.substring(1, lastElement.length);
            basePath = filesList.join("/");
        }
        else extension = filesList[0].substring(1, filesList[0].length);

        files = [];
        getRecursiveFiles(basePath);
    }

    var opts = {}, callback = function () {
    };

    if (arguments.length == 2) {
        callback = arguments[1];
    }
    else if (arguments.length >= 3) {
        opts = arguments[1];
        callback = arguments[2];
    }

    if (!files || !files.length) return callback(new Error("No input files specified."));

    opts = _.extend({}, defaults, opts);

    var wavArgs = ["-ar", opts.samplerate, "-ac", opts.channels, "-f", "s16le"];
    var tempFile;

    if (/[\/\\]/.test(inputFolder.substring(inputFolder.length - 1, inputFolder.length))) inputFolder = inputFolder.substring(0, inputFolder.length - 1);

    spawn("ffmpeg", ["-version"]).on("exit", function (code) {
        if (code) {
            callback(new Error("ffmpeg was not found on your path"));
        }
        processFiles();
    });

    function getRecursiveFiles(folder) {
        try {
            var dirfiles = fs.readdirSync(folder);
            for (var i = 0; i < dirfiles.length; i++) {
                var stats = fs.statSync(folder + "/" + dirfiles[i]);
                if (stats.isDirectory()) getRecursiveFiles(folder + "/" + dirfiles[i]);
                else {
                    var name = folder + "/" + dirfiles[i];
                    if (dirfiles[i].indexOf(extension) > -1) files.push(name);
                }
            }
        }
        catch (e) {
            console.log("can't read directory - " + folder);
        }
    }

    function mktemp(prefix) {
        var tmpdir = require("os").tmpDir() || ".";
        return path.join(tmpdir, prefix + "." + Math.random().toString().substr(2));
    }

    function spawn(name, opt) {
        opts.logger.debug("Spawn", {cmd: [name].concat(opt).join(" ")});
        return require("child_process").spawn(name, opt);
    }

    function pad(num, size) {
        var str = num.toString();
        while (str.length < size) {
            str = "0" + str;
        }
        return str;
    }

    function makeRawAudioFile(src, cb) {
        var dest = mktemp("temp");

        opts.logger.debug("Start processing", {file: src});

        fs.exists(src, function (exists) {
            if (exists) {
                var ffmpeg = spawn("ffmpeg", ["-i", path.resolve(src)]
                    .concat(wavArgs).concat("pipe:"));
                ffmpeg.stdout.pipe(fs.createWriteStream(dest, {flags: "w"}));
                ffmpeg.on("exit", function (code, signal) {
                    if (code) {
                        return cb({
                            msg: "File could not be added",
                            file: src,
                            retcode: code,
                            signal: signal
                        });
                    }
                    cb(null, dest);
                })
            }
            else {
                cb({msg: "File does not exist", file: src});
            }
        });
    }

    function appendFile(name, src, dest, cb) {
        var size = 0;
        var reader = fs.createReadStream(src);
        var writer = fs.createWriteStream(dest, {
            flags: "a"
        });
        reader.on("data", function (data) {
            size += data.length;
        });
        reader.on("close", function () {
            var originalDuration = size / opts.samplerate / opts.channels / 2;
            opts.logger.info("File added OK", {file: src, duration: originalDuration});
            cb();
        });
        reader.pipe(writer);
    }

    function exportFile(src, dest, ext, opt, store, cb) {
        var outfile = dest + "." + ext;
        spawn("ffmpeg", ["-y", "-ar", opts.samplerate, "-ac", opts.channels, "-f", "s16le", "-i", src]
            .concat(opt).concat(outfile))
            .on("exit", function (code, signal) {
                if (code) {
                    return cb({
                        msg: "Error exporting file",
                        format: ext,
                        retcode: code,
                        signal: signal
                    });
                }

                opts.logger.info("Exported " + ext + " OK", {file: outfile});
                cb();
            });
    }

    function processFiles() {
        var formats = {
            aiff: []
            , wav: []
            , ac3: ["-acodec", "ac3", "-ab", opts.bitrate + "k"]
            , mp3: ["-ar", opts.samplerate, "-f", "mp3"]
            , mp4: ["-ab", opts.bitrate + "k"]
            , m4a: ["-ab", opts.bitrate + "k"]
            , ogg: ["-acodec", "libvorbis", "-f", "ogg", "-ab", opts.bitrate + "k"]
        };

        if (opts.vbr >= 0 && opts.vbr <= 9) {
            formats.mp3 = formats.mp3.concat(["-aq", opts.vbr]);
        }
        else {
            formats.mp3 = formats.mp3.concat(["-ab", opts.bitrate + "k"]);
        }

        if (opts.export.length) {
            formats = opts.export.split(",").reduce(function (memo, val) {
                if (formats[val]) {
                    memo[val] = formats[val];
                }
                return memo;
            }, {});
        }

        var i = 0;
        if (!fs.existsSync(opts.output)) {
            require("mkdirp").sync(opts.output);
            async.forEachSeries(files, function (file, cb) {
                i++;
                makeRawAudioFile(file, function (err, tmp) {
                    if (err) {
                        return cb(err);
                    }

                    function tempProcessed() {
                        fs.unlinkSync(tmp);
                        cb();
                    }

                    var name = path.basename(file).replace(/\.[a-zA-Z0-9]+$/, "");
                    tempFile = mktemp("temp");
                    opts.logger.debug("Created temporary file", {file: tempFile});
                    appendFile(name, tmp, tempFile, function (err) {
                        tempProcessed();
                    })

                    async.forEachSeries(Object.keys(formats), function (ext, cb) {
                        opts.logger.debug("Start export", {format: ext});
                        exportFile(tempFile, opts.output + "/" + name, ext, formats[ext], true, cb);
                    }, function (err) {});
                })
            }, function (err) {
                if (err) {
                    console.log(err);
                    return callback(new Error("Error adding file"));
                }
            });
        }

    }
}