$(function () {
    let testStrengthTimeout = null;
    let copyTextTimeout = null;

    const vm = new Vue({
        el: '#app',
        data: {
            password: '',
            type: 'password',
            length: 18,
            numWords: 4,
            capitalize: true,
            includeNumber: true,
            wordSeparator: '-',
            uppercase: true,
            lowercase: true,
            numbers: true,
            special: true,
            avoidAmbiguous: true,
            crackTime: null,
            scoreNumber: null,
        },
        computed: {
            coloredPassword() {
                return colorizePassword(this.password);
            },
            score() {
                if (this.scoreNumber < 2) {
                    return 'very weak';
                } else if (this.scoreNumber < 3) {
                    return 'weak';
                } else if (this.scoreNumber < 4) {
                    return 'good';
                } else {
                    return 'strong';
                }
            },
            scoreClass() {
                if (this.scoreNumber < 2) {
                    return 'text-danger';
                } else if (this.scoreNumber < 3) {
                    return 'text-warning';
                } else if (this.scoreNumber < 4) {
                    return 'text-info';
                } else {
                    return 'text-success';
                }
            },
        },
        watch: {
            async type(newValue) {
                await this.generate();
            },
            async length(newValue) {
                await this.generate();
            },
            async numWords(newValue) {
                await this.generate();
            },
            async includeNumber(newValue) {
                await this.generate();
            },
            async capitalize(newValue) {
                await this.generate();
            },
            async uppercase(newValue) {
                await this.generate();
            },
            async lowercase(newValue) {
                await this.generate();
            },
            async numbers(newValue) {
                await this.generate();
            },
            async avoidAmbiguous(newValue) {
                await this.generate();
            },
            async special(newValue) {
                await this.generate();
            },
            async password(newValue) {
                if (testStrengthTimeout != null) {
                    clearTimeout(testStrengthTimeout);
                }
                testStrengthTimeout = setTimeout(() => {
                    this.testStrength();
                    testStrengthTimeout = null;
                }, 50)
            },
        },
        methods: {
            async generate() {
                const self = this;
                self.password = await generatePassword({
                    type: self.type,
                    length: self.length,
                    numWords: self.numWords,
                    includeNumber: self.includeNumber,
                    capitalize: self.capitalize,
                    ambiguous: !self.avoidAmbiguous,
                    number: self.numbers,
                    uppercase: self.uppercase,
                    lowercase: self.lowercase,
                    special: self.special,
                });
            },
            copy() {
                copyToClipboard(this.password);
                if (copyTextTimeout != null) {
                    clearTimeout(copyTextTimeout);
                }
                const copyText = $("#copy-button span");
                copyText.text("Copied!");
                copyTextTimeout = setTimeout(() => {
                    copyText.fadeOut(() => {
                        copyText.text("Copy to Clipboard").show();
                        copyTextTimeout = null;
                    });
                }, 500);
            },
            testStrength() {
                const self = this;
                self.result = zxcvbn(self.password, ['bitwarden', 'bit', 'warden']);
                if (self.result != null) {
                    self.crackTime = self.result.crack_times_display.offline_slow_hashing_1e4_per_second;
                    self.scoreNumber = self.result.score;
                } else {
                    self.scoreNumber = null;
                    self.crackTime = null;
                }
            },
        },
    });

    vm.generate();
});

const DefaultOptions = {
    length: 18,
    ambiguous: true,
    number: true,
    minNumber: 2,
    uppercase: true,
    minUppercase: 2,
    lowercase: true,
    minLowercase: 2,
    special: true,
    minSpecial: 2,
    type: 'password',
    numWords: 3,
    wordSeparator: '-',
    capitalize: true,
    includeNumber: true,
};

async function generatePassword(options) {
    // overload defaults with given options
    const o = Object.assign({}, DefaultOptions, options);

    if (o.type === 'passphrase') {
        return generatePassphrase(options);
    }

    // sanitize
    sanitizePasswordLength(o, true);

    const minLength = o.minUppercase + o.minLowercase + o.minNumber + o.minSpecial;
    if (o.length < minLength) {
        o.length = minLength;
    }

    const positions = [];
    if (o.lowercase && o.minLowercase > 0) {
        for (let i = 0; i < o.minLowercase; i++) {
            positions.push('l');
        }
    }
    if (o.uppercase && o.minUppercase > 0) {
        for (let i = 0; i < o.minUppercase; i++) {
            positions.push('u');
        }
    }
    if (o.number && o.minNumber > 0) {
        for (let i = 0; i < o.minNumber; i++) {
            positions.push('n');
        }
    }
    if (o.special && o.minSpecial > 0) {
        for (let i = 0; i < o.minSpecial; i++) {
            positions.push('s');
        }
    }
    while (positions.length < o.length) {
        positions.push('a');
    }

    // shuffle
    await shuffleArray(positions);

    // build out the char sets
    let allCharSet = '';

    let lowercaseCharSet = 'abcdefghijkmnopqrstuvwxyz';
    if (o.ambiguous) {
        lowercaseCharSet += 'l';
    }
    if (o.lowercase) {
        allCharSet += lowercaseCharSet;
    }

    let uppercaseCharSet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (o.ambiguous) {
        uppercaseCharSet += 'IO';
    }
    if (o.uppercase) {
        allCharSet += uppercaseCharSet;
    }

    let numberCharSet = '23456789';
    if (o.ambiguous) {
        numberCharSet += '01';
    }
    if (o.number) {
        allCharSet += numberCharSet;
    }

    const specialCharSet = '!@#$%^&*-_/=?+.';
    if (o.special) {
        allCharSet += specialCharSet;
    }

    let password = '';
    for (let i = 0; i < o.length; i++) {
        let positionChars;
        switch (positions[i]) {
            case 'l':
                positionChars = lowercaseCharSet;
                break;
            case 'u':
                positionChars = uppercaseCharSet;
                break;
            case 'n':
                positionChars = numberCharSet;
                break;
            case 's':
                positionChars = specialCharSet;
                break;
            case 'a':
                positionChars = allCharSet;
                break;
            default:
                break;
        }

        const randomCharIndex = await randomNumber(0, positionChars.length - 1);
        password += positionChars.charAt(randomCharIndex);
    }

    return password;
}

async function generatePassphrase(options) {
    const o = Object.assign({}, DefaultOptions, options);

    if (o.numWords == null || o.numWords <= 2) {
        o.numWords = DefaultOptions.numWords;
    }
    if (o.wordSeparator == null || o.wordSeparator.length === 0 || o.wordSeparator.length > 1) {
        o.wordSeparator = ' ';
    }
    if (o.capitalize == null) {
        o.capitalize = false;
    }
    if (o.includeNumber == null) {
        o.includeNumber = false;
    }

    const listLength = EEFLongWordList.length - 1;
    const wordList = new Array(o.numWords);
    for (let i = 0; i < o.numWords; i++) {
        const wordIndex = await randomNumber(0, listLength);
        if (o.capitalize) {
            wordList[i] = capitalize(EEFLongWordList[wordIndex]);
        } else {
            wordList[i] = EEFLongWordList[wordIndex];
        }
    }

    if (o.includeNumber) {
        await appendRandomNumberToRandomWord(wordList);
    }
    return wordList.join(o.wordSeparator);
}

// Helpers

async function randomNumber(min, max) {
    let rval = 0;
    const range = max - min + 1;
    const bitsNeeded = Math.ceil(Math.log2(range));
    if (bitsNeeded > 53) {
        throw new Error('We cannot generate numbers larger than 53 bits.');
    }

    const bytesNeeded = Math.ceil(bitsNeeded / 8);
    const mask = Math.pow(2, bitsNeeded) - 1;
    // 7776 -> (2^13 = 8192) -1 == 8191 or 0x00001111 11111111

    // Fill a byte array with N random numbers
    const byteArray = new Uint8Array(randomBytes(bytesNeeded));

    let p = (bytesNeeded - 1) * 8;
    for (let i = 0; i < bytesNeeded; i++) {
        rval += byteArray[i] * Math.pow(2, p);
        p -= 8;
    }

    // Use & to apply the mask and reduce the number of recursive lookups
    // tslint:disable-next-line
    rval = rval & mask;

    if (rval >= range) {
        // Integer out of acceptable range
        return randomNumber(min, max);
    }

    // Return an integer that falls within the range
    return min + rval;
}

function randomBytes(length) {
    const arr = new Uint8Array(length);
    window.crypto.getRandomValues(arr);
    return arr.buffer;
}

async function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = await randomNumber(0, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function appendRandomNumberToRandomWord(wordList) {
    if (wordList == null || wordList.length <= 0) {
        return;
    }
    const index = await randomNumber(0, wordList.length - 1);
    const num = await randomNumber(0, 9);
    wordList[index] = wordList[index] + num;
}

function sanitizePasswordLength(options, forGeneration) {
    let minUppercaseCalc = 0;
    let minLowercaseCalc = 0;
    let minNumberCalc = options.minNumber;
    let minSpecialCalc = options.minSpecial;

    if (options.uppercase && options.minUppercase <= 0) {
        minUppercaseCalc = 1;
    } else if (!options.uppercase) {
        minUppercaseCalc = 0;
    }

    if (options.lowercase && options.minLowercase <= 0) {
        minLowercaseCalc = 1;
    } else if (!options.lowercase) {
        minLowercaseCalc = 0;
    }

    if (options.number && options.minNumber <= 0) {
        minNumberCalc = 1;
    } else if (!options.number) {
        minNumberCalc = 0;
    }

    if (options.special && options.minSpecial <= 0) {
        minSpecialCalc = 1;
    } else if (!options.special) {
        minSpecialCalc = 0;
    }

    // This should never happen but is a final safety net
    if (!options.length || options.length < 1) {
        options.length = 10;
    }

    const minLength = minUppercaseCalc + minLowercaseCalc + minNumberCalc + minSpecialCalc;
    // Normalize and Generation both require this modification
    if (options.length < minLength) {
        options.length = minLength;
    }

    // Apply other changes if the options object passed in is for generation
    if (forGeneration) {
        options.minUppercase = minUppercaseCalc;
        options.minLowercase = minLowercaseCalc;
        options.minNumber = minNumberCalc;
        options.minSpecial = minSpecialCalc;
    }
}

function copyToClipboard(text) {
    let win = window;
    let doc = window.document;
    if (win.clipboardData && win.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        win.clipboardData.setData('Text', text);
    } else if (doc.queryCommandSupported && doc.queryCommandSupported('copy')) {
        const textarea = doc.createElement('textarea');
        textarea.textContent = text;
        // Prevent scrolling to bottom of page in MS Edge.
        textarea.style.position = 'fixed';
        let copyEl = doc.body;
        // For some reason copy command won't work when modal is open if appending to body
        if (doc.body.classList.contains('modal-open')) {
            copyEl = doc.body.querySelector('.modal');
        }
        copyEl.appendChild(textarea);
        textarea.select();
        try {
            // Security exception may be thrown by some browsers.
            doc.execCommand('copy');
        } catch (e) {
            // tslint:disable-next-line
            console.warn('Copy to clipboard failed.', e);
        } finally {
            copyEl.removeChild(textarea);
        }
    }
}

function colorizePassword(password) {
    let colorizedPassword = '';
    for (let i = 0; i < password.length; i++) {
        let character = password[i];
        let isSpecial = false;
        // Sanitize HTML first.
        switch (character) {
            case '&':
                character = '&amp;';
                isSpecial = true;
                break;
            case '<':
                character = '&lt;';
                isSpecial = true;
                break;
            case '>':
                character = '&gt;';
                isSpecial = true;
                break;
            case ' ':
                character = '&nbsp;';
                isSpecial = true;
                break;
            default:
                break;
        }
        let type = 'letter';
        if (isSpecial || character.match(/[^\w ]/)) {
            type = 'special';
        } else if (character.match(/\d/)) {
            type = 'number';
        }
        colorizedPassword += '<span class="password-' + type + '">' + character + '</span>';
    }
    return colorizedPassword;
}
