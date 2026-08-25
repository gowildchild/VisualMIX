////////////////////
// VisualMIX Meta Java v0.0.4
// (c)2007-2026 by Gunther Voet
   ////////////////////////////// 

let metaConfig = null;
let masterConfig = null;
let currentAlgo = "md5";
let metaRegistryName = "CHECKSUM_HASH_REGISTRY";

const DEFAULT_META_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/integrity_check/universal_meta.json";
const DEFAULT_TEST_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/integrity_check/universal_test.json";

window.onload = function() {
    writeLogToPanel("Initializing zero-trust asynchronous persistent cache engines...");
    
    // 1. Ingest configuration parameters from memory if overrides exist
    if (localStorage.getItem("cache_meta_source_mode")) {
        document.getElementById("meta-source-select").value = localStorage.getItem("cache_meta_source_mode");
    }
    if (localStorage.getItem("cache_test_source_mode")) {
        document.getElementById("test-source-select").value = localStorage.getItem("cache_test_source_mode");
    }
    if (localStorage.getItem("cache_meta_custom_url")) {
        document.getElementById("meta-url-field").value = localStorage.getItem("cache_meta_custom_url");
    }
    if (localStorage.getItem("cache_test_custom_url")) {
        document.getElementById("test-url-field").value = localStorage.getItem("cache_test_custom_url");
    }

    // 2. Trigger a hard initial bootstrap file retrieval pass
    triggerRemoteUrlFetchSync();
};

function writeLogToPanel(msg) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logBox = document.getElementById("local-log");
    if (logBox) {
        logBox.innerHTML += `[${timestamp}] ${msg}<br/>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

function initializeStaticDropdownMenus() {
    // Populate standard choices dynamically so the UI stays responsive before json completes loading
    const metaSelect = document.getElementById("meta-source-select");
    const testSelect = document.getElementById("test-source-select");
    
    if (metaSelect && metaSelect.options.length === 0) {
        const options = [
            ["GITHUB", "Standard GitHub Repo Baseline"],
            ["URL", "Custom Remote URL Input"],
            ["MANUAL", "Manual Raw Input Snippet Area"]
        ];
        options.forEach(([val, txt]) => metaSelect.options.add(new Option(txt, val)));
    }
    if (testSelect && testSelect.options.length === 0) {
        const options = [
            ["GITHUB", "Standard GitHub Repo Baseline"],
            ["URL", "Custom Remote URL Input"],
            ["MANUAL", "Manual Raw Input Snippet Area"]
        ];
        options.forEach(([val, txt]) => testSelect.options.add(new Option(txt, val)));
    }
}

function toggleSourceInterfaceVisibility(panelType) {
    if (panelType === 'meta') {
        const mode = document.getElementById("meta-source-select").value;
        localStorage.setItem("cache_meta_source_mode", mode);
        document.getElementById("meta-url-container").className = (mode === "URL") ? "panel" : "hidden-node";
        document.getElementById("meta-input-container").className = (mode === "MANUAL") ? "panel" : "hidden-node";
    } else if (panelType === 'source') {
        const mode = document.getElementById("test-source-select").value;
        localStorage.setItem("cache_test_source_mode", mode);
        document.getElementById("test-url-container").className = (mode === "URL") ? "panel" : "hidden-node";
        document.getElementById("test-input-container").className = (mode === "MANUAL") ? "panel" : "hidden-node";
    }
}

function syncPanelData(panelType) {
    writeLogToPanel(`Sync event triggered for target panel: ${panelType}`);
    triggerRemoteUrlFetchSync();
}

function triggerRemoteUrlFetchSync() {
    setVisualLedStatus("orange", "Fetching Stores");
    
    const metaMode = document.getElementById("meta-source-select").value;
    const testMode = document.getElementById("test-source-select").value;
    
    let metaTargetUrl = DEFAULT_META_URL;
    let testTargetUrl = DEFAULT_TEST_URL;
    
    if (metaMode === "URL") {
        const customUrl = document.getElementById("meta-url-field").value.trim();
        if (customUrl) { metaTargetUrl = customUrl; localStorage.setItem("cache_meta_custom_url", customUrl); }
    }
    if (testMode === "URL") {
        const customUrl = document.getElementById("test-url-field").value.trim();
        if (customUrl) { testTargetUrl = customUrl; localStorage.setItem("cache_test_custom_url", customUrl); }
    }

    writeLogToPanel("Executing data network sync stream loops via dynamic fetch pipeline...");
    
    Promise.all([fetch(metaTargetUrl), fetch(testTargetUrl)])
        .then(([metaRes, testRes]) => {
            if (!metaRes.ok || !testRes.ok) throw new Error("HTTP Endpoint Connection Drop.");
            return Promise.all([metaRes.json(), testRes.json()]);
        })
        .then(([metaJson, testJson]) => {
            document.getElementById("meta-json-area").value = JSON.stringify(metaJson, null, 2);
            document.getElementById("test-json-area").value = JSON.stringify(testJson, null, 2);
            localStorage.setItem("cache_integrity_meta_text", JSON.stringify(metaJson));
            localStorage.setItem("cache_integrity_test_text", JSON.stringify(testJson));
            evaluateWorkspaceState(metaJson, testJson);
        })
        .catch(err => {
            writeLogToPanel(`❌ Data Sync Failed: ${err.message}`);
            setVisualLedStatus("red", "Config Faulty");
            const statusEl = document.getElementById('file-status');
            if (statusEl) statusEl.innerHTML = "⚠️ Configuration synchronization dropped. Manual text fallback active.";
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

function handleTypingState(panelType) {
    // Soft intercept logic: trigger orange LED while editing is actively happening to signal unverified changes
    setVisualLedStatus("orange", "Typing State");
    if (panelType === 'meta') {
        processLocalMetaOverride();
    } else {
        processLocalTestOverride();
    }
}

function processLocalMetaOverride() {
    const metaText = document.getElementById("meta-json-area").value;
    try {
        const parsedMeta = JSON.parse(metaText);
        localStorage.setItem("cache_integrity_meta_text", metaText);
        if (masterConfig) evaluateWorkspaceState(parsedMeta, masterConfig);
    } catch(e) {
        // Validation boundary catches incomplete text strings silently until typing halts
    }
}

function processLocalTestOverride() {
    const testText = document.getElementById("test-json-area").value;
    try {
        const parsedTest = JSON.parse(testText);
        localStorage.setItem("cache_integrity_test_text", testText);
        if (metaConfig) evaluateWorkspaceState(metaConfig, parsedTest);
    } catch(e) {
        // Validation boundary catches incomplete text strings silently until typing halts
    }
}

function handleManualAlgoOverride() {
    if (!metaConfig || !masterConfig) return;
    metaConfig.INTEGRITY_META_PROFILE.selected_algorithm = document.getElementById("algo-select").value;
    document.getElementById("meta-json-area").value = JSON.stringify(metaConfig, null, 2);
    processLocalMetaOverride();
}

function executeFactoryResetPurge() {
    localStorage.clear();
    writeLogToPanel("Purging persistent memory cache. Re-bootstrapping to repository defaults.");
    location.reload();
}

function evaluateWorkspaceState(metaJson, testJson) {
    metaConfig = metaJson;
    masterConfig = testJson;
    
    const profile = metaConfig.INTEGRITY_META_PROFILE || {};
    currentAlgo = profile.selected_algorithm || "md5";
    metaRegistryName = profile.target_registry_key || "CHECKSUM_HASH_REGISTRY";
    
    // Sync bitmask evaluation policy constraints
    applyBitmaskPolicyConstraints(profile.options || {});
    
    document.getElementById("algo-select").value = currentAlgo;
    document.getElementById('file-status').innerHTML = `✅ Ready. Synced using variant: [${currentAlgo.toUpperCase()}]`;
    document.getElementById('workspace-action-zone').className = "action-grid";
    
    setVisualLedStatus("green", "Ready to Verify");
    generateAndShowChallenge();
}

function applyBitmaskPolicyConstraints(optionsBlock) {
    const bitmaskString = optionsBlock.bitmask || optionsBlock.default?.bitmask || "0x00000000";
    const maskVal = parseInt(bitmaskString, 16);
    
    // Parse individual bytes using bitwise right shifts and masks
    const byte0_meta   = maskVal & 0xFF;
    
    // Policy rule: If Byte 0 is completely zero, lock the configuration dashboard panels out
    if (byte0_meta === 0) {
        writeLogToPanel("🚨 SECURITY POLICY NOTICE: Access blocked by active bitmask decree.");
        setVisualLedStatus("red", "Access Denied");
        document.getElementById('workspace-action-zone').className = "hidden-node";
    }
    
    // Populate selectors natively out of the options profile array variables inside your manifest
    populateDynamicDropdown("action-strategy-select", optionsBlock.action || ["CHALLENGE", "INTEGRITY"]);
    populateDynamicDropdown("check-syntax-select", optionsBlock.check || ["MD5:CATEGORY_A"]);
}

function populateDynamicDropdown(elementId, itemsArray) {
    const select = document.getElementById(elementId);
    if (!select) return;
    select.innerHTML = "";
    itemsArray.forEach(item => {
        select.options.add(new Option(item, item));
    });
}

function handleActionStrategySwap() {
    writeLogToPanel(`Verification action strategy mode flipped to: ${document.getElementById("action-strategy-select").value}`);
    generateAndShowChallenge();
}

function handleVerificationSyntaxSwap() {
    writeLogToPanel(`Syntax check parameter profile variant mapped: ${document.getElementById("check-syntax-select").value}`);
}

function generateAndShowChallenge() {
    if (!masterConfig) return;
    
    let challenge = JSON.parse(JSON.stringify(masterConfig));
    const strategy = document.getElementById("action-strategy-select").value;
    
    // CHALLENGE Mode Execution: Clear out target registry arrays completely
    if (strategy === "CHALLENGE" && challenge.SYSTEM_BASELINE_CONFIG) {
        if (challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName]) delete challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName];
        if (challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_HASH_REGISTRY"]) delete challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_HASH_REGISTRY"];
        if (challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_MD5HASH_REGISTRY"]) delete challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_MD5HASH_REGISTRY"];
    }
    
    document.getElementById('challenge-output').value = JSON.stringify(challenge, null, 2);
}

function exportSettingsJsonFile() {
    if (!metaConfig) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metaConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "check_integrity_meta_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    writeLogToPanel("Exported configuration profile JSON settings file successfully.");
}

function executeCryptographicVerificationDiff() {
    const inputArea = document.getElementById('session-input').value.trim();
    const reportPanel = document.getElementById('report-panel');
    if (!inputArea || !masterConfig) { alert("Missing target data arrays."); return; }
    
    reportPanel.className = "panel";
    let incoming;
    try {
        let text = inputArea; if (!text.startsWith("{")) { text = "{" + text + "}"; }
        incoming = JSON.parse(text);
    } catch(e) {
        setVisualLedStatus("orange", "Faulty Intercept");
        reportPanel.innerHTML = "<h3>❌ CRITICAL DATA DISCONNECT: Pasted clipboard snapshot is structurally corrupt.</h3>";
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
                codeDiffs += `<h3>📍 Logical Drift Trapped inside target block logic module: ${cat}</h3>`;
                codeDiffs += `<pre><span class="diff-del">${escapeHtml(activeSrc)}</span>\n\n<span class="diff-add">${escapeHtml(incomingSrc)}</span></pre>`;
            }
        }
    }

    let incomingRegistry = incoming[metaRegistryName] || incoming["CHECKSUM_HASH_REGISTRY"] || incoming["CHECKSUM_MD5HASH_REGISTRY"] || incoming.SYSTEM_BASELINE_CONFIG?.[metaRegistryName] || incoming;
    let tableHtml = "<table><tr><th>Target Field Group</th><th>Calc Source</th><th>Expected</th><th>Calc Env</th><th>Expected</th><th>Status</th></tr>";
    
    const categories = Object.keys(schema).sort();
    categories.forEach(longKey => {
        let shortKey = longKey.replace("CATEGORY_", "").split("_");
        const envelope = schema[longKey];
        
        // Dynamic library resolution loops linking to universal_crypto.js
        const trueSrc = getCryptoHash(envelope.ground_truth_source, currentAlgo);
        const trueEnv = getEnvelopeHash(envelope, currentAlgo);
        
        const fileHashes = incomingRegistry[shortKey] || incomingRegistry[longKey] || {};
        const providedSrc = fileHashes.src || ""; const providedEnv = fileHashes.envelope || "";
        
        let srcMatch = trueSrc === providedSrc, envMatch = trueEnv === providedEnv;
        if (!srcMatch || !envMatch) overallPassed = false;

        tableHtml += `<tr><td><b>${shortKey}</b></td><td style="color:${srcMatch?'#3fb950':'#f85149'}">${trueSrc}</td><td>${providedSrc || 'MISSING'}</td><td style="color:${envMatch?'#3fb950':'#f85149'}">${trueEnv}</td><td>${providedEnv || 'MISSING'}</td><td><span class="badge ${srcMatch && envMatch ? 'badge-pass':'badge-fail'}">${srcMatch && envMatch ? 'PASSED':'MUTATED'}</span></td></tr>`;
    });
    tableHtml += "</table>";

    setVisualLedStatus(overallPassed ? "green" : "red", overallPassed ? "Verified Pass" : "Script Faulty");

    htmlReport += `<div><b>Operational Compliance Boundary:</b> <span class="badge ${overallPassed?'badge-pass':'badge-fail'}">${overallPassed?'100% PERFECT':'DECAY DRIFT TRAPPED'}</span></div>` + tableHtml;
    if (codeDiffs) htmlReport += "<h2>🚨 LINE-LEVEL SYNTAX GAP DELTAS</h2>" + codeDiffs;

    if (!overallPassed) {
        let fixedRegistry = `    "${metaRegistryName}": {\n`;
        categories.forEach((k, idx) => {
            let shortKey = k.replace("CATEGORY_", "").split("_");
            fixedRegistry += `      "${shortKey}": { "src": "${getCryptoHash(schema[k].ground_truth_source, currentAlgo)}", "envelope": "${getEnvelopeHash(schema[k], currentAlgo)}" }${idx < categories.length - 1 ? ',':''}\n`;
        });
        fixedRegistry += "    }";
        htmlReport += "<h2>🔧 TRUE RE-SYNCHRONIZED CHECKSUM REGISTER BLOCK:</h2>" + `<pre>${fixedRegistry}</pre>`;
    }
    
    reportPanel.innerHTML = htmlReport;
    writeLogToPanel(`Audit executed. Verdict Status: ${overallPassed ? 'PASS' : 'REJECTED_DRIFT'}`);
}
function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
