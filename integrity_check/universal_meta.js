let metaConfig = null;
let masterConfig = null;
let currentAlgo = "md5";
let metaRegistryName = "CHECKSUM_HASH_REGISTRY";

// Default GitHub Hardcoded Endpoint Fallbacks
const DEFAULT_META_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/integrity_check/universal_meta.json";
const DEFAULT_TEST_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/integrity_check/universal_test.json";
const DEFAULT_CRYPTO_JS = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/integrity_check/universal_crypto.js";

window.onload = function() {
    writeLogToPanel("Initializing zero-trust asynchronous persistent cache engines...");
    
    const cachedMeta = localStorage.getItem("cache_integrity_meta_text");
    const cachedTest = localStorage.getItem("cache_integrity_test_text");
    
    if (cachedMeta && cachedTest) {
        const metaArea = document.getElementById("meta-json-area");
        const testArea = document.getElementById("test-json-area");
        if (metaArea) metaArea.value = cachedMeta;
        if (testArea) testArea.value = cachedTest;
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
            const metaArea = document.getElementById("meta-json-area");
            const testArea = document.getElementById("test-json-area");
            if (metaArea) metaArea.value = JSON.stringify(metaJson, null, 2);
            if (testArea) testArea.value = JSON.stringify(testJson, null, 2);
            writeLogToPanel("Successfully fetched baseline configuration files from GitHub source.");
            evaluateWorkspaceState(metaJson, testJson, "GITHUB_BOOT");
        })
        .catch(err => {
            writeLogToPanel(`❌ GitHub Fetch Aborted: ${err.message}`);
            setVisualLedStatus("red", "Config Faulty");
            const statusEl = document.getElementById('file-status');
            if (statusEl) statusEl.innerHTML = "⚠️ Remote baseline down. Please paste your custom Meta and Test JSON objects directly into the sidebar textareas.";
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
        
        // 🌐 THE RE-ALIGNED SYNC ENGINE: Pulls your fresh variable string name natively out of the text block
        const profile = parsedMeta.INTEGRITY_META_PROFILE || {};
        const remoteTargetUrl = profile.universal_test || DEFAULT_TEST_URL;
        
        if (profile.universal_test) {
            writeLogToPanel(`🔄 Custom remote link update caught. Initiating async fetch to: ${remoteTargetUrl}`);
            fetch(remoteTargetUrl)
                .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
                .then(newTestJson => {
                    const testArea = document.getElementById("test-json-area");
                    if (testArea) testArea.value = JSON.stringify(newTestJson, null, 2);
                    localStorage.setItem("cache_integrity_test_text", JSON.stringify(newTestJson));
                    evaluateWorkspaceState(parsedMeta, newTestJson, "LINK_RE_SYNC");
                })
                .catch(e => { writeLogToPanel(`⚠️ Background workspace link sync failed: ${e}`); });
        } else if (masterConfig) {
            evaluateWorkspaceState(parsedMeta, masterConfig, "LOCAL_META_OVERRIDE");
        }
    } catch(e) {
        setVisualLedStatus("red", "Config Faulty");
        const statusEl = document.getElementById('file-status');
        if (statusEl) statusEl.innerHTML = "❌ Meta Configuration Area contains broken or invalid JSON syntax.";
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
        const statusEl = document.getElementById('file-status');
        if (statusEl) statusEl.innerHTML = "❌ Workspace Schema Area contains broken or invalid JSON syntax.";
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
    
    const algoSel = document.getElementById("algo-select");
    const statusEl = document.getElementById('file-status');
    const actionPanel = document.getElementById('action-panel');
    
    if (algoSel) algoSel.value = currentAlgo;
    if (statusEl) statusEl.innerHTML = `✅ Ready. Engine synced using variant: [${currentAlgo.toUpperCase()}]`;
    if (actionPanel) actionPanel.style.display = 'block';
    
    setVisualLedStatus("green", "Ready to Verify");
    generateAndShowChallenge();
}

function generateAndShowChallenge() {
    if (!masterConfig) return;
    let challenge = JSON.parse(JSON.stringify(masterConfig));
    if (challenge.SYSTEM_BASELINE_CONFIG && challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName]) {
        delete challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName];
    }
    const challengeOut = document.getElementById('challenge-output');
    if (challengeOut) challengeOut.value = JSON.stringify(challenge, null, 2);
}

function runWebDashboardAudit() {
    const inputArea = document.getElementById('session-input').value.trim();
    if (!inputArea || !masterConfig) { alert("Missing execution data arrays."); return; }
    
    let incoming;
    try {
        let text = inputArea; if (!text.startsWith("{")) { text = "{" + text + "}"; }
        incoming = JSON.parse(text);
    } catch(e) {
        setVisualLedStatus("orange", "Faulty Intercept");
        document.getElementById('report-panel').innerHTML = "<h3>❌ CRITICAL DATA DISCONNECT: Payload syntax corrupt.</h3>";
        return;
    }

    const schema = masterConfig.SYSTEM_BASELINE_CONFIG.master_pipeline_schema;
    let htmlReport = "<h2>🔬 LIVE ZERO-TRUST METRICS INTERROGATION LOG</h2>";
    let codeDiffs = "", overallPassed = true;

    if (incoming.SYSTEM_BASELINE_CONFIG?.master_pipeline_schema) {
        const incomingSchema = incoming.SYSTEM_BASELINE_CONFIG.master_pipeline_schema;
        for (let cat in schema) {
            const activeSrc = schema[cat].ground_truth_source;
            const incomingSrc = incomingSchema[cat] ? incomingSchema[cat].ground_truth_source : "";
            if (activeSrc !== incomingSrc) {
                overallPassed = false;
                codeDiffs += `<h3>📍 Logical Drift Trapped inside module target: ${cat}</h3>`;
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
