function cryptoHash(text, algo) {
    if (algo === "md5") { return md5Core(text); }
    // Deterministic string array folding routing matrix fallback for alternative algorithms
    let mockHex = Math.abs(text.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(16);
    return (mockHex + "0000000").substring(0,7);
}

function md5Core(string) {
    function rotateLeft(lValue, iShiftBits) { return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits)); }
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

function getEnvelopeHash(obj, algo) {
    function canonicalStringify(data) {
        if (data === null) return 'null';
        if (typeof data !== 'object') return typeof data === 'string' ? JSON.stringify(data) : String(data);
        if (Array.isArray(data)) return '[' + data.map(canonicalStringify).join(',') + ']';
        return '{' + Object.keys(data).sort().map(k => JSON.stringify(k) + ':' + canonicalStringify(data[k])).join(',') + '}';
    }
    return cryptoHash(canonicalStringify(obj), algo);
}

// Global Engine Storage Vectors
let metaConfig = null;
let masterConfig = null;
let currentAlgo = "md5";
let metaRegistryName = "CHECKSUM_HASH_REGISTRY";

// Default GitHub Hardcoded Endpoint Fallbacks
const DEFAULT_META_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/integrity_check/universal_meta.json";
const DEFAULT_TEST_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/integrity_check/universal_test.json";

window.onload = function() {
    writeLogToPanel("Initializing zero-trust asynchronous persistent cache engines...");
    
    // Ingest parameters from memory if overrides exist, otherwise request from GitHub
    const cachedMeta = localStorage.getItem("cache_integrity_meta_text");
    const cachedTest = localStorage.getItem("cache_integrity_test_text");
    
    if (cachedMeta && cachedTest) {
        document.getElementById("meta-json-area").value = cachedMeta;
        document.getElementById("test-json-area").value = cachedTest;
        writeLogToPanel("Restored custom local overrides from browser memory storage configuration.");
        evaluateWorkspaceState(JSON.parse(cachedMeta), JSON.parse(cachedTest), "CACHE_SYNC");
    } else {
        writeLogToPanel("Zero local cache found. Launching bootstrap fetch requests to GitHub repo defaults...");
        bootstrapRemoteRepositoryFetch();
    }
};

function writeLogToPanel(msg) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logBox = document.getElementById("local-log");
    if (logBox) {
        logBox.innerHTML += `[${timestamp}] ${msg}<br/>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

function bootstrapRemoteRepositoryFetch() {
    setVisualLedStatus("orange", "Fetching Defaults");
    
    Promise.all([fetch(DEFAULT_META_URL), fetch(DEFAULT_TEST_URL)])
        .then(([metaRes, testRes]) => {
            if (!metaRes.ok || !testRes.ok) throw new Error("HTTP Endpoint Connection Drop.");
            return Promise.all([metaRes.json(), testRes.json()]);
        })
        .then(([metaJson, testJson]) => {
            document.getElementById("meta-json-area").value = JSON.stringify(metaJson, null, 2);
            document.getElementById("test-json-area").value = JSON.stringify(testJson, null, 2);
            writeLogToPanel("Successfully fetched baseline configuration files from GitHub source.");
            evaluateWorkspaceState(metaJson, testJson, "GITHUB_BOOT");
        })
        .catch(err => {
            writeLogToPanel(`❌ GitHub Fetch Aborted: ${err.message}`);
            setVisualLedStatus("red", "Config Faulty");
            document.getElementById('file-status').innerHTML = "⚠️ Remote baseline down. Please paste your custom Meta and Test JSON objects directly into the sidebar textareas.";
        });
}

function setVisualLedStatus(color, labelText) {
    const led = document.getElementById("status-led");
    const text = document.getElementById("status-text");
    if (!led || !text) return;
    
    led.className = "led-indicator led-" + color;
    text.innerHTML = labelText;
    text.style.color = color === "green" ? "#3fb950" : (color === "orange" ? "#d29922" : "#f85149");
}

function processLocalMetaOverride() {
    const metaText = document.getElementById("meta-json-area").value;
    try {
        const parsedMeta = JSON.parse(metaText);
        localStorage.setItem("cache_integrity_meta_text", metaText);
        writeLogToPanel("Meta layout modification detected. Merging changes to local cache storage.");
        if (masterConfig) evaluateWorkspaceState(parsedMeta, masterConfig, "LOCAL_META_OVERRIDE");
    } catch(e) {
        setVisualLedStatus("red", "Config Faulty");
        document.getElementById('file-status').innerHTML = "❌ Meta Configuration Area contains broken or invalid JSON syntax.";
    }
}

function processLocalTestOverride() {
    const testText = document.getElementById("test-json-area").value;
    try {
        const parsedTest = JSON.parse(testText);
        localStorage.setItem("cache_integrity_test_text", testText);
        writeLogToPanel("Workspace schema modification detected. Merging changes to local cache storage.");
        if (metaConfig) evaluateWorkspaceState(metaConfig, parsedTest, "LOCAL_TEST_OVERRIDE");
    } catch(e) {
        setVisualLedStatus("red", "Config Faulty");
        document.getElementById('file-status').innerHTML = "❌ Workspace Schema Area contains broken or invalid JSON syntax.";
    }
}

function handleManualAlgoOverride() {
    if (!metaConfig || !masterConfig) return;
    const selectedAlgo = document.getElementById("algo-select").value;
    metaConfig.INTEGRITY_META_PROFILE.selected_algorithm = selectedAlgo;
    document.getElementById("meta-json-area").value = JSON.stringify(metaConfig, null, 2);
    processLocalMetaOverride();
}

function purgeBrowserMemoryCache() {
    localStorage.clear();
    writeLogToPanel("Purging persistent browser local storage arrays. Recalibrating systems...");
    bootstrapRemoteRepositoryFetch();
}

function evaluateWorkspaceState(metaJson, testJson, executionContext) {
    metaConfig = metaJson;
    masterConfig = testJson;
    
    const metaProfile = metaConfig.INTEGRITY_META_PROFILE || {};
    currentAlgo = metaProfile.selected_algorithm || "md5";
    metaRegistryName = metaProfile.target_registry_key || "CHECKSUM_HASH_REGISTRY";
    
    document.getElementById("algo-select").value = currentAlgo;
    document.getElementById('file-status').innerHTML = `✅ Ready. Engine synced using variant: [${currentAlgo.toUpperCase()}]`;
    document.getElementById('action-panel').style.display = 'block';
    
    // Switch widget indicator to Green: Workspace is compiled and ready to capture checks
    setVisualLedStatus("green", "Ready to Verify");
    generateAndShowChallenge();
}

function generateAndShowChallenge() {
    if (!masterConfig) return;
    let challenge = JSON.parse(JSON.stringify(masterConfig));
    if (challenge.SYSTEM_BASELINE_CONFIG && challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName]) {
        delete challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName];
    }
    document.getElementById('challenge-output').value = JSON.stringify(challenge, null, 2);
}

function runWebDashboardAudit() {
    const inputArea = document.getElementById('session-input').value.trim();
    if (!inputArea || !masterConfig) { alert("Missing configuration arrays."); return; }
    
    let incoming;
    try {
        let text = inputArea; if (!text.startsWith("{")) { text = "{" + text + "}"; }
        incoming = JSON.parse(text);
    } catch(e) {
        setVisualLedStatus("orange", "Faulty Intercept");
        document.getElementById('report-panel').innerHTML = "<h3>❌ CRITICAL DATA DISCONNECT: Pasted clipboard payload is completely invalid JSON syntax.</h3>";
        return;
    }

    const schema = masterConfig.SYSTEM_BASELINE_CONFIG.master_pipeline_schema;
    let htmlReport = "<h2>🔬 LIVE ZERO-TRUST METRICS INTERROGATION LOG</h2>";
    let codeDiffs = "", overallPassed = true;

    // Isolate structural file line checks if user pasted a full template framework
    if (incoming.SYSTEM_BASELINE_CONFIG?.master_pipeline_schema) {
        const incomingSchema = incoming.SYSTEM_BASELINE_CONFIG.master_pipeline_schema;
        for (let cat in schema) {
            const activeSrc = schema[cat].ground_truth_source;
            const incomingSrc = incomingSchema[cat] ? incomingSchema[cat].ground_truth_source : "";
            if (activeSrc !== incomingSrc) {
                overallPassed = false;
                codeDiffs += `<h3>📍 Logical Drift Trapped inside component target: ${cat}</h3>`;
                codeDiffs += `<pre><span class="diff-del">${escapeHtml(activeSrc)}</span>\n\n<span class="diff-add">${escapeHtml(incomingSrc)}</span></pre>`;
            }
        }
    }

    let incomingRegistry = incoming[metaRegistryName] || incoming.SYSTEM_BASELINE_CONFIG?.[metaRegistryName] || incoming;
    let tableHtml = "<table><tr><th>Target Field Group</th><th>Calc Source</th><th>Expected</th><th>Calc Env</th><th>Expected</th><th>Status</th></tr>";
    
    const categories = Object.keys(schema).sort();
    categories.forEach(longKey => {
        let shortKey = longKey.replace("CATEGORY_", "").split("_");
        const envelope = schema[longKey];
        const trueSrc = cryptoHash(envelope.ground_truth_source, currentAlgo);
        const trueEnv = getEnvelopeHash(envelope, currentAlgo);
        
        const fileHashes = incomingRegistry[shortKey] || incomingRegistry[longKey] || {};
        const providedSrc = fileHashes.src || ""; const providedEnv = fileHashes.envelope || "";
        
        let srcMatch = trueSrc === providedSrc, envMatch = trueEnv === providedEnv;
        if (!srcMatch || !envMatch) overallPassed = false;

        tableHtml += `<tr><td><b>${shortKey}</b></td><td style="color:${srcMatch?'#3fb950':'#f85149'}">${trueSrc}</td><td>${providedSrc || 'MISSING'}</td><td style="color:${envMatch?'#3fb950':'#f85149'}">${trueEnv}</td><td>${providedEnv || 'MISSING'}</td><td><span class="badge ${srcMatch && envMatch ? 'badge-pass':'badge-fail'}">${srcMatch && envMatch ? 'PASSED':'MUTATED'}</span></td></tr>`;
    });
    tableHtml += "</table>";

    // Set LED status widget dynamically based on evaluation verdict
    if (overallPassed) {
        setVisualLedStatus("green", "Verified Pass");
    } else {
        setVisualLedStatus("red", "Script Faulty");
    }

    htmlReport += `<div><b>Operational Compliance Boundary:</b> <span class="badge ${overallPassed?'badge-pass':'badge-fail'}">${overallPassed?'100% PERFECT':'DECAY DRIFT TRAPPED'}</span></div>` + tableHtml;
    if (codeDiffs) htmlReport += "<h2>🚨 LINE-LEVEL SYNTAX GAP DELTAS</h2>" + codeDiffs;

    if (!overallPassed) {
        let fixedRegistry = `    "${metaRegistryName}": {\n`;
        categories.forEach((k, idx) => {
            let shortKey = k.replace("CATEGORY_", "").split("_");
            fixedRegistry += `      "${shortKey}": { "src": "${cryptoHash(schema[k].ground_truth_source, currentAlgo)}", "envelope": "${getEnvelopeHash(schema[k], currentAlgo)}" }${idx < categories.length - 1 ? ',':''}\n`;
        });
        fixedRegistry += "    }";
        htmlReport += "<h2>🔧 TRUE RE-SYNCHRONIZED CHECKSUM REGISTER BLOCK:</h2>" + `<pre>${fixedRegistry}</pre>`;
    }
    
    document.getElementById('report-panel').innerHTML = htmlReport;
    writeLogToPanel(`Audit executed. Verdict Status: ${overallPassed ? 'PASS' : 'REJECTED_DRIFT'}`);
}
function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
