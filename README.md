# waudconvert [![npm version](https://badge.fury.io/js/waudconvert.svg)](https://www.npmjs.com/package/waudconvert)

Utility to convert audio files from one format to another.

### Installation

```
npm install -g waudconvert
```

### Dependencies

You need `FFmpeg` framework and `ogg` codecs to use **`waudconvert`**.

Install on OSX using `brew`:

```
brew install ffmpeg --with-theora --with-libogg --with-libvorbis
```

### Usage

```
waudconvert --loop loop --autoplay loop  -o assets/sprite -e m4a assets/*.mp3
```

### Help

```
waudsprite --help
info: Usage: waudsprite [options] *.mp3
info: Options:
  --output, -o      Name for the output files.                                   [default: "sprite"]
  --path, -u        Path for files to be used on final JSON.                     [default: ""]
  --export, -e      Limit exported file types. Comma separated extension list.   [default: "ogg,m4a,mp3,ac3"]
  --log, -l         Log level (debug, info, notice, warning, error).             [default: "info"]
  --autoplay, -a    Autoplay sprite name.                                        [default: null]
  --loop            Loop sprite name, can be passed multiple times.              [default: null]
  --gap, -g         Silence gap between sounds (in seconds).                     [default: 1]
  --minlength, -m   Minimum sound duration (in seconds).                         [default: 0]
  --bitrate, -b     Bit rate. Works for: ac3, mp3, mp4, m4a, ogg.                [default: 128]
  --vbr, -v         VBR [0-9]. Works for: mp3. -1 disables VBR.                  [default: -1]
  --samplerate, -r  Sample rate.                                                 [default: 44100]
  --channels, -c    Number of channels (1=mono, 2=stereo).                       [default: 1]
  --rawparts, -p    Include raw slices(for Web Audio API) in specified formats.  [default: ""]
  --help, -h        Show this help message.
```

### Licensing Information

<a rel="license" href="http://opensource.org/licenses/MIT">
<img alt="MIT license" height="40" src="http://upload.wikimedia.org/wikipedia/commons/c/c3/License_icon-mit.svg" /></a>

This content is released under the [MIT](http://opensource.org/licenses/MIT) License.

### Contributor Code of Conduct ###

[Code of Conduct](https://github.com/CoralineAda/contributor_covenant) is adapted from [Contributor Covenant, version 1.4](http://contributor-covenant.org/version/1/4)
