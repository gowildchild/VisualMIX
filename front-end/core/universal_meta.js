/**
 * VISUALMIX CORE - META
 * (c)2007-2012 Gunther Voet | Universal Decoupled Logic Core
 * Location: front_end/core/universal_meta.js
 */

let metaConfig = null;
let masterConfig = null;
let currentAlgo = "md5";
let metaRegistryName = "CHECKSUM_HASH_REGISTRY";

const DEFAULT_META_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/tools/integrity/universal_meta.json";
const DEFAULT_TEST_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/tools/integrity/universal_test.json";

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
    triggerRemoteUrlFetchSync();
};

function initializeStaticDropdownMenus() {
    const metaSelect = document.getElementById("meta-source-select");
    const testSelect = document.getElementById("test-source-select");
    
    if (metaSelect && metaSelect.options.length === 0) {
        const options = [
            ["JSON_FILE", "JSON_FILE"],
            ["URL", "URL"],
            ["INPUT", "INPUT"],
            ["DIRECT", "DIRECT"]
        ];
        options.forEach(([val, txt]) => metaSelect.options.add(new Option(txt, val)));
    }
    if (testSelect && testSelect.options.length === 0) {
        const options = [
            ["json_src_challenge", "json_src_challenge"],
            ["json_src_integrity", "json_src_integrity"],
            ["URL", "URL"],
            ["INPUT", "INPUT"],
            ["DIRECT", "DIRECT"]
        ];
        options.forEach(([val, txt]) => testSelect.options.add(new Option(txt, val)));
    }
}

function populateDynamicDropdown(elementId, itemsArray) {
    const select = document.getElementById(elementId);
    if (!select) return;
    select.innerHTML = "";
    itemsArray.forEach(item => {
        select.options.add(new Option(item, item));
    });
}

function togglePanelNodeVisibility(panelType) {
    if (panelType === 'meta') {
        const mode = document.getElementById("meta-source-select").value;
        localStorage.setItem("cache_meta_source_mode", mode);
        writeLogToPanel(`Meta Ingestion Option Selected: [${mode}]`);

        const urlField = document.getElementById("meta-url-container");
        const inputField = document.getElementById("meta-input-container");

        if (urlField && inputField) {
            urlField.className = (mode === "URL") ? "panel" : "hidden-node";
            inputField.className = "panel"; 
        }
        
        if (mode === "JSON_FILE" || mode === "DIRECT") {
            triggerRemoteUrlFetchSync();
        }

    } else if (panelType === 'source') {
        const mode = document.getElementById("test-source-select").value;
        localStorage.setItem("cache_test_source_mode", mode);
        writeLogToPanel(`Source Ingestion Option Selected: [${mode}]`);

        const urlField = document.getElementById("test-url-container");
        const inputField = document.getElementById("test-input-container");

        if (urlField && inputField) {
            urlField.className = (mode === "URL") ? "panel" : "hidden-node";
            inputField.className = "panel";
        }

        if (mode === "json_src_challenge" || mode === "json_src_integrity" || mode === "DIRECT") {
            triggerRemoteUrlFetchSync();
        }
    }
}

function handleActionStrategySwap() {
    const activeStrategy = document.getElementById("action-strategy-select").value;
    const testSourceSelect = document.getElementById("test-source-select");
    
    writeLogToPanel(`Verification action strategy mode flipped to: ${activeStrategy}`);
    
    if (testSourceSelect) {
        if (activeStrategy === "CHALLENGE") {
            testSourceSelect.value = "json_src_challenge";
        } else if (activeStrategy === "INTEGRITY") {
            testSourceSelect.value = "json_src_integrity";
        }
        localStorage.setItem("cache_test_source_mode", testSourceSelect.value);
    }
    
    triggerRemoteUrlFetchSync();
}

function toggleSourceInterfaceVisibility(panelType) {
    togglePanelNodeVisibility(panelType);
}

function syncPanelData(panelType) {
    writeLogToPanel(`Sync event triggered for target panel: ${panelType}`);
    triggerRemoteUrlFetchSync();
}

function triggerRemoteUrlFetchSync() {
    setVisualLedStatus("blue", "Processing Data Bus");
    
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
function handleTypingState(panelType) {
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
    } catch(e) {}
}

function processLocalTestOverride() {
    const testText = document.getElementById("test-json-area").value;
    try {
        const parsedTest = JSON.parse(testText);
        localStorage.setItem("cache_integrity_test_text", testText);
        if (metaConfig) evaluateWorkspaceState(metaConfig, parsedTest);
    } catch(e) {}
}

function handleManualAlgoOverride() {
    if (!metaConfig || !masterConfig) return;
    metaConfig.INTEGRITY_META_PROFILE.selected_algorithm = document.getElementById("algo-select").value;
    document.getElementById("meta-json-area").value = JSON.stringify(metaConfig, null, 2);
    processLocalMetaOverride();
}

function applyBitmaskPolicyConstraints(optionsBlock) {
    const bitmaskString = optionsBlock.bitmask || optionsBlock.default?.bitmask || "0x00000000";
    const maskVal = parseInt(bitmaskString, 16);
    const byte0_meta = maskVal & 0xFF;
    
    if (byte0_meta === 0) {
        writeLogToPanel("🚨 SECURITY POLICY NOTICE: Access blocked by active bitmask decree.");
        setVisualLedStatus("red", "Access Denied");
        document.getElementById('workspace-action-zone').className = "hidden-node";
        return;
    }
    
    populateDynamicDropdown("meta-source-select", optionsBlock.meta || ["JSON_FILE", "URL", "INPUT", "DIRECT"]);
    populateDynamicDropdown("test-source-select", optionsBlock.source || ["json_src_challenge", "json_src_integrity", "URL", "INPUT", "DIRECT"]);
    populateDynamicDropdown("action-strategy-select", optionsBlock.action || ["CHALLENGE", "INTEGRITY"]);
    populateDynamicDropdown("check-syntax-select", optionsBlock.check || ["MD5:CATEGORY_A"]);
}

function handleVerificationSyntaxSwap() {
    writeLogToPanel(`Syntax check parameter profile variant mapped: ${document.getElementById("check-syntax-select").value}`);
}

function generateAndShowChallenge() {
    if (!masterConfig) return;
    
    let challenge = JSON.parse(JSON.stringify(masterConfig));
    const strategy = document.getElementById("action-strategy-select").value;
    
    if (strategy === "CHALLENGE" && challenge.SYSTEM_BASELINE_CONFIG) {
        if (challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName]) delete challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName];
        if (challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_HASH_REGISTRY"]) delete challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_HASH_REGISTRY"];
        if (challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_MD5HASH_REGISTRY"]) delete challenge.SYSTEM_BASELINE_CONFIG["CHECKSUM_MD5HASH_REGISTRY"];
    }
    
    document.getElementById('challenge-output').value = JSON.stringify(challenge, null, 2);
}
function getCleanShortKey(longKey) {
    let parts = longKey.split("_");
    if (parts.length >= 2 && parts[0] === "CATEGORY") {
        return parts[0] + "_" + parts[1];
    }
    return longKey.replace("CATEGORY_", "");
}

function computeDetailedTextDiff(expectedStr, incomingStr) {
    let expLines = expectedStr.split("\n");
    let incLines = incomingStr.split("\n");
    let maxLines = Math.max(expLines.length, incLines.length);
    let diffLog = "";

    for (let i = 0; i < maxLines; i++) {
        let eLine = expLines[i] !== undefined ? expLines[i] : null;
        let iLine = incLines[i] !== undefined ? incLines[i] : null;

        if (eLine !== iLine) {
            let lineNum = i + 1;
            diffLog += `<div style="margin-top: 6px; border-left: 2px solid var(--red); padding-left: 6px;">`;
            diffLog += `<b>📍 Line ${lineNum} Drift:</b><br/>`;

            if (eLine === null) {
                diffLog += `<span class="diff-add">[+] Added line: ${escapeHtml(iLine)}</span>`;
            } else if (iLine === null) {
                diffLog += `<span class="diff-del">[-] Deleted line: ${escapeHtml(eLine)}</span>`;
            } else {
                let charOffset = 1;
                let maxChars = Math.max(eLine.length, iLine.length);
                for (let c = 0; c < maxChars; c++) {
                    if (eLine[c] !== iLine[c]) { charOffset = c + 1; break; }
                }
                diffLog += `<span class="diff-del">Expected: ${escapeHtml(eLine)}</span><br/>`;
                diffLog += `<span class="diff-add">Incoming (Char ${charOffset}): ${escapeHtml(iLine)}</span>`;
            }
            diffLog += `</div>`;
        }
    }
    return diffLog;
}

/**
 * 🔬 DYNAMIC STRUCT-AGNOSTIC MINORITY REPORT ENGINE
 * Completely decoupled from specific schema keys. Recursively audits ANY JSON structural 
 * payload array, matching and hashing dynamic dictionary fields on the fly.
 */
function executeCryptographicVerificationDiff() {
    const inputArea = document.getElementById('session-input').value.trim();
    const reportPanel = document.getElementById('report-panel');
    if (!inputArea || !masterConfig) { alert("Missing target data arrays."); return; }
    
    reportPanel.className = "panel glow-bottom-right";
    let incoming;
    try {
        let text = inputArea; if (!text.startsWith("{")) { text = "{" + text + "}"; }
        incoming = JSON.parse(text);
    } catch(e) {
        setVisualLedStatus("orange", "Faulty Intercept");
        reportPanel.innerHTML = "<h3>❌ CRITICAL DATA DISCONNECT: Pasted payload is structurally corrupt.</h3>";
        return;
    }

    // 🔍 Line-by-Line Character Diff Engine Tracker
    function computeDetailedTextDiff(expectedStr, incomingStr, label) {
        let expLines = String(expectedStr).split("\n");
        let incLines = String(incomingStr).split("\n");
        let maxLines = Math.max(expLines.length, incLines.length);
        let diffLog = "";

        for (let i = 0; i < maxLines; i++) {
            let eLine = expLines[i] !== undefined ? expLines[i] : null;
            let iLine = incLines[i] !== undefined ? incLines[i] : null;

            if (eLine !== iLine) {
                let lineNum = i + 1;
                diffLog += `<div style="margin-top: 6px; border-left: 2px solid var(--red); padding-left: 6px; font-family: monospace; font-size: 11px;">`;
                diffLog += `<b>📍 Line ${lineNum} Drift [${label}]:</b><br/>`;

                if (eLine === null) {
                    diffLog += `<span style="color:var(--green)">[+] Added: ${escapeHtml(iLine)}</span>`;
                } else if (iLine === null) {
                    diffLog += `<span style="color:var(--red)">[-] Deleted: ${escapeHtml(eLine)}</span>`;
                } else {
                    let charOffset = 1;
                    let maxChars = Math.max(eLine.length, iLine.length);
                    for (let c = 0; c < maxChars; c++) {
                        if (eLine[c] !== iLine[c]) { charOffset = c + 1; break; }
                    }
                    diffLog += `<span style="color:var(--red)">Expected (Char ${charOffset}): ${escapeHtml(eLine)}</span><br/>`;
                    diffLog += `<span style="color:var(--green)">Incoming (Char ${charOffset}): ${escapeHtml(iLine)}</span>`;
                }
                diffLog += `</div>`;
            }
        }
        return diffLog;
    }

    // 🧭 Universal Structure Crawer: Flattens any incoming JSON object tree into pure hashable string key/value pairs
    function flattenStructureMap(obj, prefix = "", targetMap = {}) {
        if (obj === null || obj === undefined) return targetMap;
        
        if (typeof obj !== "object") {
            targetMap[prefix] = obj;
            return targetMap;
        }

        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                let cleanKey = prefix ? `${prefix}.${key}` : key;
                // If it's a structural leaf or source string block, anchor it
                if (typeof obj[key] !== "object" || obj[key] === null) {
                    targetMap[cleanKey] = obj[key];
                } else {
                    flattenStructureMap(obj[key], cleanKey, targetMap);
                }
            }
        }
        return targetMap;
    }

    // Map structural topologies for both your expected baseline and your target inputs
    const masterMap = flattenStructureMap(masterConfig);
    const incomingMap = flattenStructureMap(incoming);

    let htmlReport = "<h2>MINORITY REPORT (UNIVERSAL STRUCT ENGINE)</h2>";
    let codeDiffs = "", overallPassed = true;
    let tableHtml = "<table><tr><th>Target Structural Node Pathway</th><th>Expected Baseline Value / Hash</th><th>Incoming Payload Value / Hash</th><th>Status Matrix Monitoring</th></tr>";

    // Sort key paths deterministically to preserve matrix lines mapping symmetry
    const uniqueKeys = Array.from(new Set([...Object.keys(masterMap), ...Object.keys(incomingMap)])).sort();

    uniqueKeys.forEach(pathKey => {
        // Skip metadata configuration block headers to clean the terminal display logs
        if (pathKey.includes("visualmixMeta") || pathKey.includes("INTEGRITY_META_PROFILE")) return;

        const valExpected = masterMap[pathKey] !== undefined ? String(masterMap[pathKey]) : null;
        const valIncoming = incomingMap[pathKey] !== undefined ? String(incomingMap[pathKey]) : null;

        // Dynamic algorithm loop assignment hashes text nodes if they span multi-line modules
        const hashExpected = valExpected && valExpected.includes("\n") ? getCryptoHash(valExpected, currentAlgo) : valExpected;
        const hashIncoming = valIncoming && valIncoming.includes("\n") ? getCryptoHash(valIncoming, currentAlgo) : valIncoming;

        const isMatch = hashExpected === hashIncoming;
        if (!isMatch) overallPassed = false;

        const stateColor = isMatch ? "green" : "red";
        const stateLabel = isMatch ? "OK" : "MUTATED";

        // Generate line-by-character structural diff tracing blocks if code drifts are captured
        if (!isMatch && valExpected && valIncoming) {
            codeDiffs += `<h3>📍 Node Path Shift Trapped: ${pathKey}</h3>`;
            codeDiffs += `<div style="background: var(--bg-input); padding: 8px; border-radius: 4px; margin-bottom:10px;">${computeDetailedTextDiff(valExpected, valIncoming, pathKey)}</div>`;
        }

        // 🔘 HARD-WELDED: Pure Round, Shiny Gloss Indicator Fixtures Injecting into Table Row Arrays
        tableHtml += `<tr>
            <td><code style="color:var(--accent); font-size:11px;">${pathKey}</code></td>
            <td style="color:${isMatch?'var(--green)':'var(--red)'}; font-family:monospace; max-width:180px; overflow:hidden; text-overflow:ellipsis;">${hashExpected || 'NULL/MISSING'}</td>
            <td style="font-family:monospace; max-width:180px; overflow:hidden; text-overflow:ellipsis;">${hashIncoming || 'NULL/MISSING'}</td>
            <td>
                <span class="led-container" style="display:inline-flex; align-items:center; gap: 6px;">
                    <div class="led-fixture fx-round fx-shiny led-c-${stateColor}" style="width:12px; height:12px;"></div>
                    <span style="color:var(--${stateColor}); font-size:11px; font-weight:bold;">${stateLabel}</span>
                </span>
            </td>
        </tr>`;
    });
    tableHtml += "</table>";

    setVisualLedStatus(overallPassed ? "green" : "red", overallPassed ? "Verified Pass" : "Script Faulty");

    htmlReport += `<div style="margin-bottom:12px;"><b>Operational Compliance Boundary Status:</b> <span class="badge ${overallPassed?'badge-pass':'badge-fail'}">${overallPassed?'100% PERFECT':'DECAY DRIFT TRAPPED'}</span></div>` + tableHtml;
    if (codeDiffs) htmlReport += "<h2>🚨 LINE-LEVEL SYNTAX GAP DELTAS</h2>" + codeDiffs;

    reportPanel.innerHTML = htmlReport;
    writeLogToPanel(`Universal Audit executed. Verdict Status: ${overallPassed ? 'PASS' : 'REJECTED_DRIFT'}`);
    
    if (typeof applyLiveTelemetryCalibration === "function") {
        applyLiveTelemetryCalibration();
    }
}


function evaluateWorkspaceState(metaJson, testJson) {
    metaConfig = metaJson;
    masterConfig = testJson;
    
    const profile = metaConfig.INTEGRITY_META_PROFILE || {};
    currentAlgo = profile.selected_algorithm || "md5";
    metaRegistryName = profile.target_registry_key || "CHECKSUM_HASH_REGISTRY";
    
    applyBitmaskPolicyConstraints(profile.options || {});
    
    const algoSel = document.getElementById("algo-select");
    const statusEl = document.getElementById('file-status');
    
    if (algoSel) algoSel.value = currentAlgo;
    if (statusEl) statusEl.innerHTML = `✅ Configuration Synced. Local system vectors active.`;
    
    switchConfigurationTab('meta');
    renderInitialBaselineMetricsLedger();
    setVisualLedStatus("green", "Ready to Verify");
    generateAndShowChallenge();
}

function renderInitialBaselineMetricsLedger() {
    const reportPanel = document.getElementById('report-panel');
    if (!reportPanel || !masterConfig) return;

    const schema = masterConfig.SYSTEM_BASELINE_CONFIG?.master_pipeline_schema;
    if (!schema) return;

    let htmlReport = "<h2>🔬 Dynamic Baseline Local Metrics Ledger</h2>";
    htmlReport += "<table><tr><th>Target Component</th><th>Expected Signature</th><th>Status Matrix Monitoring</th></tr>";

    const categories = Object.keys(schema).sort();
    categories.forEach(longKey => {
        let shortKey = longKey.replace("CATEGORY_", "").split("_");
        const envelope = schema[longKey];
        const trueSrc = getCryptoHash(envelope.ground_truth_source, currentAlgo);
        
        htmlReport += `<tr>
            <td><b>${shortKey}</b> <span style="font-size:10px; color:var(--text-muted); display:block;">${envelope.component_name || 'Module'}</span></td>
            <td><code style="color:var(--green)">${trueSrc}</code></td>
            <td>
                <span class="led-container" style="display:inline-flex; align-items:center;">
                    <div class="led-fixture fx-round fx-shiny led-c-green" style="width:10px; height:12px; margin-right:6px;"></div>
                    <span style="color:var(--green); font-size:11px; font-weight:bold;">FOUND AND OK</span>
                </span>
            </td>
        </tr>`;
    });
    
    htmlReport += "</table>";
    reportPanel.innerHTML = htmlReport;
}

function switchConfigurationTab(targetTab) {
    const btnMeta = document.getElementById("tab-btn-meta");
    const btnSource = document.getElementById("tab-btn-source");
    const viewMeta = document.getElementById("view-segment-meta");
    const viewSource = document.getElementById("view-segment-source");
    
    if (!btnMeta || !btnSource || !viewMeta || !viewSource) return;

    if (targetTab === 'meta') {
        btnMeta.className = ""; 
        btnSource.className = "secondary";
        viewMeta.className = "";
        viewSource.className = "hidden-node";
        writeLogToPanel("Workspace View: Toggled Master Meta Parameter configuration array display.");
    } else {
        btnMeta.className = "secondary";
        btnSource.className = "";
        viewMeta.className = "hidden-node";
        viewSource.className = "";
        writeLogToPanel("Workspace View: Toggled Protected Source blueprint asset configuration array display.");
    }
}

function executeFactoryResetPurge() {
    localStorage.clear();
    writeLogToPanel("Purging persistent memory cache. Re-bootstrapping to repository defaults.");
    location.reload();
}

function escapeHtml(text) { 
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

