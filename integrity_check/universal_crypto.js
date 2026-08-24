function interpretAsSignedDecimal(valueInput, maxBits = 32) {
    let val = BigInt(parseAnyToDecimal(valueInput));
    let bits = BigInt(maxBits);
    let mask = (1n << bits) - 1n;
    let cleanVal = val & mask;
    let signBit = 1n << (bits - 1n);
    
    if (cleanVal & signBit) {
        cleanVal = cleanVal - (1n << bits);
    }
    return cleanVal.toString(10);
}

function swapEndianness(valueInput, maxBits = 32) {
    let val = BigInt(parseAnyToDecimal(valueInput));
    let byteCount = maxBits / 8;
    if (byteCount < 1) byteCount = 1;
    
    let hex = val.toString(16);
    let targetLen = byteCount * 2;
    while (hex.length < targetLen) hex = "0" + hex;
    
    let swappedHex = "";
    for (let i = targetLen - 2; i >= 0; i -= 2) {
        swappedHex += hex.substring(i, i + 2);
    }
    return "0x" + swappedHex;
}

function rotateLeft(value, shiftBits, maxBits = 32) {
    if (maxBits === 32) {
        return (value << shiftBits) | (value >>> (32 - shiftBits));
    }
    const mask = (1 << maxBits) - 1;
    const cleanVal = value & mask;
    const shift = shiftBits % maxBits;
    return ((cleanVal << shift) | (cleanVal >>> (maxBits - shift))) & mask;
}

function rotateRight(value, shiftBits, maxBits = 32) {
    if (maxBits === 32) {
        return (value >>> shiftBits) | (value << (32 - shiftBits));
    }
    const mask = (1 << maxBits) - 1;
    const cleanVal = value & mask;
    const shift = shiftBits % maxBits;
    return ((cleanVal >>> shift) | (cleanVal << (maxBits - shift))) & mask;
}

function bitShiftLeft(value, shiftBits, maxBits = 32) {
    if (maxBits === 32) {
        return value << shiftBits;
    }
    const mask = (1 << maxBits) - 1;
    return (value << shiftBits) & mask;
}

function bitShiftRightLogical(value, shiftBits, maxBits = 32) {
    if (maxBits === 32) {
        return value >>> shiftBits;
    }
    const mask = (1 << maxBits) - 1;
    return (value & mask) >>> shiftBits;
}

function invertBits(valueInput, maxBits = 32) {
    let val = BigInt(parseAnyToDecimal(valueInput));
    let bits = BigInt(maxBits);
    let mask = (1n << bits) - 1n;
    return (~val & mask).toString(10);
}

function bitShiftRightArithmetic(value, shiftBits, maxBits = 32) {
    if (maxBits === 32) {
        return value >> shiftBits; // Signed right shift (preserves sign bit)
    }
    const mask = (1 << maxBits) - 1;
    let cleanVal = value & mask;
    const signBit = 1 << (maxBits - 1);
    if (cleanVal & signBit) {
        cleanVal |= ~mask;
    }
    return (cleanVal >> shiftBits) & mask;
}

function convertWayHEX(valueInput, maxBits = 16, padZero = true) {
    let clean = String(valueInput).trim().replace(/[\s_,]/g, "").toLowerCase();
    if (!clean) return "0x" + (padZero ? "0".repeat(Math.ceil(maxBits / 4)) : "0");

    let isHex = clean.startsWith("0x") || /[a-f]/.test(clean);
    if (clean.startsWith("0x")) clean = clean.substring(2);

    let decimalValue;
    try {
        // If it's already hex, decode from base 16. If not, treat input as incoming base 10 decimal.
        decimalValue = BigInt(isHex ? "0x" + clean : clean);
    } catch (e) {
        decimalValue = 0n;
    }

    let mask = (1n << BigInt(maxBits)) - 1n;
    let rawOutput = (decimalValue & mask).toString(16);

    if (padZero) {
        let expectedLen = Math.ceil(Number(maxBits) / 4);
        while (rawOutput.length < expectedLen) rawOutput = "0" + rawOutput;
    }
    return "0x" + rawOutput;
}

function convertWayBIN(valueInput, maxBits = 16, padZero = true) {
    let clean = String(valueInput).trim().replace(/[\s_,]/g, "").toLowerCase();
    if (!clean) return "0b" + (padZero ? "0".repeat(maxBits) : "0");

    let isBin = clean.startsWith("0b") || (/^[01]+$/.test(clean) && clean.length > 4); 
    if (clean.startsWith("0b")) clean = clean.substring(2);

    let decimalValue;
    try {
        decimalValue = isBin ? BigInt("0b" + clean) : BigInt(clean);
    } catch (e) {
        // Fallback rule: if string contains absolute numbers but failed, parse strictly as characters
        decimalValue = BigInt(parseInt(clean, isBin ? 2 : 10) || 0);
    }

    let mask = (1n << BigInt(maxBits)) - 1n;
    let rawOutput = (decimalValue & mask).toString(2);

    if (padZero) {
        while (rawOutput.length < Number(maxBits)) rawOutput = "0" + rawOutput;
    }
    return "0b" + rawOutput;
}

function convertWayOCT(valueInput, maxBits = 16, padZero = true) {
    let clean = String(valueInput).trim().replace(/[\s_,]/g, "").toLowerCase();
    if (!clean) return "0o" + (padZero ? "0".repeat(Math.ceil(maxBits / 3)) : "0");

    let isOct = clean.startsWith("0o") || (/^[0-7]+$/.test(clean) && (clean.startsWith("0") || clean.length > 3));
    if (clean.startsWith("0o")) clean = clean.substring(2);

    let decimalValue;
    try {
        decimalValue = isOct ? BigInt("0o" + clean) : BigInt(clean);
    } catch (e) {
        decimalValue = BigInt(parseInt(clean, isOct ? 8 : 10) || 0);
    }

    let mask = (1n << BigInt(maxBits)) - 1n;
    let rawOutput = (decimalValue & mask).toString(8);

    if (padZero) {
        let expectedLen = Math.ceil(Number(maxBits) / 3);
        while (rawOutput.length < expectedLen) rawOutput = "0" + rawOutput;
    }
    return "0o" + rawOutput;
}

function convertWayDEC(valueInput, maxBits = 16) {
    let clean = String(valueInput).trim().replace(/[\s_,]/g, "").toLowerCase();
    if (!clean) return "0";

    let decimalValue;
    try {
        if (clean.startsWith("0x")) decimalValue = BigInt(clean);
        else if (clean.startsWith("0b")) decimalValue = BigInt(clean);
        else if (clean.startsWith("0o")) decimalValue = BigInt(clean);
        else if (/[a-f]/.test(clean)) decimalValue = BigInt("0x" + clean);
        else decimalValue = BigInt(clean);
    } catch (e) {
        decimalValue = 0n;
    }

    let mask = (1n << BigInt(maxBits)) - 1n;
    return (decimalValue & mask).toString(10); // Base 10 outputs never pad zeros
}

function convertWayFormat(valueInput, fromRadix = null, toRadix = null, maxBits = 16, padZero = true) {
    let cleanIn = String(valueInput).trim().replace(/[\s_,]/g, "").toLowerCase();
    if (!cleanIn) return "0";

    // 1. Auto-Detect source format if not explicitly passed
    let detectedFrom = "DEC";
    if (!fromRadix) {
        if (cleanIn.startsWith("0x") || /[a-f]/.test(cleanIn)) detectedFrom = "HEX";
        else if (cleanIn.startsWith("0b")) detectedFrom = "BIN";
        else if (cleanIn.startsWith("0o")) detectedFrom = "OCT";
        else detectedFrom = "DEC";
    } else {
        detectedFrom = String(fromRadix).toUpperCase().trim();
    }

    // 2. Auto-Detect target destination format (Toggle rule)
    let detectedTo = "HEX";
    if (!toRadix) {
        detectedTo = (detectedFrom === "HEX") ? "DEC" : "HEX";
    } else {
        detectedTo = String(toRadix).toUpperCase().trim();
    }

    // Normalise keywords to standardized labels
    const formatMap = { "DEC": "DEC", "10": "DEC", "HEX": "HEX", "16": "HEX", "BIN": "BIN", "2": "BIN", "OCT": "OCT", "8": "OCT" };
    let srcMode = formatMap[detectedFrom] || "DEC";
    let destMode = formatMap[detectedTo] || "HEX";

    // 3. Structural Re-routing Matrix: Convert non-decimal inputs to temporary base 10 BigInt strings first
    let intermediateDecimalStr = "";
    if (srcMode === "HEX") {
        intermediateDecimalStr = convertWayDEC(cleanIn.startsWith("0x") ? cleanIn : "0x" + cleanIn, maxBits);
    } else if (srcMode === "BIN") {
        intermediateDecimalStr = convertWayDEC(cleanIn.startsWith("0b") ? cleanIn : "0b" + cleanIn, maxBits);
    } else if (srcMode === "OCT") {
        intermediateDecimalStr = convertWayDEC(cleanIn.startsWith("0o") ? cleanIn : "0o" + cleanIn, maxBits);
    } else {
        intermediateDecimalStr = cleanIn; // Already Base 10
    }

    // 4. Forceful Execution Output Routing via the new, un-clipped specialized modules
    if (destMode === "HEX") {
        return convertWayHEX(intermediateDecimalStr, maxBits, padZero);
    } else if (destMode === "BIN") {
        return convertWayBIN(intermediateDecimalStr, maxBits, padZero);
    } else if (destMode === "OCT") {
        return convertWayOCT(intermediateDecimalStr, maxBits, padZero);
    } else {
        return convertWayDEC(intermediateDecimalStr, maxBits);
    }
}


function getCryptoHash(text, algo) {
    const targetAlgo = String(algo).toLowerCase().trim();
    if (targetAlgo === "sha256") return hashSHA256(text);
    if (targetAlgo === "sha1") return hashSHA1(text);
    return hashMD5(text); // Default fallback engine
}

function hashMD5(string) {
    function addUnsigned(lX, lY) {
        let lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000); lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000); lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        } else return (lResult ^ lX8 ^ lY8);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }
    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    let x = [];
    let lMessageLength = string.length;
    let lNumberOfWords = (((lMessageLength + 4) - ((lMessageLength + 4) % 64)) / 64 + 1) * 16;
    let lWordArray = Array(lNumberOfWords); let lByteCount = 0;
    while (lByteCount < lMessageLength) {
        let lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        let lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
        lByteCount++;
    }
    let lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << ((lByteCount % 4) * 8));
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    x = lWordArray;
    let k, AA, BB, CC, DD, a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    let S11=7, S12=12, S13=17, S14=22, S21=5, S22=9, S23=14, S24=20;
    let S31=4, S32=11, S33=16, S34=23, S41=6, S42=10, S43=15, S44=21;
    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478); d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB); b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF); d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613); b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8); d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1); b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122); d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E); b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562); d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51); b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D); d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681); b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6); d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87); b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905); d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9); b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942); d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122); b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44); d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60); b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6); d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085); b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039); d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8); b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = II(a, b, c, d, x[k + 0], S41, 0xF4292244); d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7); b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3); d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D); b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F); d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k + 6], S43, 0xA3014314); b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82); d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
        c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB); b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    let WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
    for (let lValue of [a,b,c,d]) {
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
    }
    return WordToHexValue.substring(0, 7);
}

function hashSHA1(string) {
    function f(t, b, c, d) {
        if (t < 20) return (b & c) | ((~b) & d);
        if (t < 40) return b ^ c ^ d;
        if (t < 60) return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d;
    }
    function rol(num, cnt) { return (num << num) | (num >>> (32 - cnt)); }
    let s = string.replace(/\r\n/g, "\n");
    let x = [];
    for (let i = 0; i < s.length; i++) x[i >> 2] |= s.charCodeAt(i) << (24 - (i % 4) * 8);
    let len = s.length * 8;
    x[len >> 5] |= 0x80 << (24 - len % 32);
    x[(((len + 64) >> 9) << 4) + 15] = len;
    let w = Array(80), a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476, e = 0xC3D2E1F0;
    for (let i = 0; i < x.length; i += 16) {
        let olda = a, oldb = b, oldc = c, oldd = d, olde = e;
        for (let j = 0; j < 80; j++) {
            if (j < 16) w[j] = x[i + j] || 0;
            else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            let t = (rol(a, 5) + f(j, b, c, d) + e + w[j] + (j < 20 ? 0x5A827999 : j < 40 ? 0x6ED9EBA1 : j < 60 ? 0x8F1BBCDC : 0xCA62C1D6)) | 0;
            e = d; d = c; c = rol(b, 30); b = a; a = t;
        }
        a = (a + olda) | 0; b = (b + oldb) | 0; c = (c + oldc) | 0; d = (d + oldd) | 0; e = (e + olde) | 0;
    }
    let out = "";
    for (let val of [a,b,c,d,e]) out += ("00000000" + (val >>> 0).toString(16)).substr(-8);
    return out.substring(0, 7);
}

function hashSHA256(string) {
    function S(X, n) { return (X >>> n) | (X << (32 - n)); }
    function R(X, n) { return X >>> n; }
    function Ch(x, y, z) { return (x & y) ^ (~x & z); }
    function Maj(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); }
    function Sigma0(x) { return S(x, 2) ^ S(x, 13) ^ S(x, 22); }
    function Sigma1(x) { return S(x, 6) ^ S(x, 11) ^ S(x, 25); }
    function sigma0(x) { return S(x, 7) ^ S(x, 18) ^ R(x, 3); }
    function sigma1(x) { return S(x, 17) ^ S(x, 19) ^ R(x, 10); }
    let s = string.replace(/\r\n/g, "\n");
    let blocks = [];
    for (let i = 0; i < s.length; i++) blocks[i >> 2] |= s.charCodeAt(i) << (24 - (i % 4) * 8);
    let len = s.length * 8;
    blocks[len >> 5] |= 0x80 << (24 - len % 32);
    let wordCount = (((len + 64) >> 9) << 4) + 16;
    while (blocks.length < wordCount) blocks.push(0);
    blocks[wordCount - 1] = len;
    let K = [
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    let HASH = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    let W = Array(64);
    for (let i = 0; i < blocks.length; i += 16) {
        let a = HASH[0], b = HASH[1], c = HASH[2], d = HASH[3], e = HASH[4], f = HASH[5], g = HASH[6], h = HASH[7];
        for (let j = 0; j < 64; j++) {
            if (j < 16) W[j] = blocks[i + j] || 0;
            else W[j] = (sigma1(W[j - 2]) + W[j - 7] + sigma0(W[j - 15]) + W[j - 16]) | 0;
            let T1 = (h + Sigma1(e) + Ch(e, f, g) + K[j] + W[j]) | 0;
            let T2 = (Sigma0(a) + Maj(a, b, c)) | 0;
            h = g; g = f; f = e; e = (d + T1) | 0; d = c; c = b; b = a; a = (T1 + T2) | 0;
        }
        HASH[0] = (HASH[0] + a) | 0; HASH[1] = (HASH[1] + b) | 0; HASH[2] = (HASH[2] + c) | 0; HASH[3] = (HASH[3] + d) | 0;
        HASH[4] = (HASH[4] + e) | 0; HASH[5] = (HASH[5] + f) | 0; HASH[6] = (HASH[6] + g) | 0; HASH[7] = (HASH[7] + h) | 0;
    }
    let out = "";
    for (let val of HASH) out += ("00000000" + (val >>> 0).toString(16)).substr(-8);
    return out.substring(0, 7);
}

function getEnvelopeHash(obj, algo) {
    function canonicalStringify(data) {
        if (data === null) return 'null';
        if (typeof data !== 'object') return typeof data === 'string' ? JSON.stringify(data) : String(data);
        if (Array.isArray(data)) return '[' + data.map(canonicalStringify).join(',') + ']';
        return '{' + Object.keys(data).sort().map(k => JSON.stringify(k) + ':' + canonicalStringify(data[k])).join(',') + '}';
    }
    return getCryptoHash(canonicalStringify(obj), algo);
}
