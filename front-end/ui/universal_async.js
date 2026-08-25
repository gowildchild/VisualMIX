let metaConfig = null;
let masterConfig = null;
let currentAlgo = "md5";
let metaRegistryName = "CHECKSUM_HASH_REGISTRY";

// Active Runtime Variable State Matrices
let archWidth = 32;
let systemStateRegisterMap = {}; 
let activeComponentKey = "";

const DEFAULT_META_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/tools/integrity/universal_meta.json";
const DEFAULT_TEST_URL = "https://raw.githubusercontent.com/gowildchild/VisualMIX/refs/heads/main/tools/integrity/universal_test.json";

window.addEventListener("DOMContentLoaded", () => {
    writeLogToPanel("Initializing zero-trust asynchronous persistent cache engines...", "local-log");
    
    // Ingest parameters programmatically from local cache layers
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
});

function initializeStaticDropdownMenus() {
    const metaSelect = document.getElementById("meta-source-select");
    const testSelect = document.getElementById("test-source-select");
    const actionSelect = document.getElementById("action-strategy-select");
    
    if (metaSelect && metaSelect.options.length === 0) {
        ["JSON_FILE", "URL", "INPUT", "DIRECT"].forEach(t => metaSelect.options.add(new Option(t, t)));
    }
    if (testSelect && testSelect.options.length === 0) {
        ["json_meta_challenge", "json_meta_integrity", "URL", "INPUT", "DIRECT"].forEach(t => testSelect.options.add(new Option(t, t)));
    }
    if (actionSelect && actionSelect.options.length === 0) {
        ["CHALLENGE", "INTEGRITY"].forEach(t => actionSelect.options.add(new Option(t, t)));
    }
}

function triggerRemoteUrlFetchSync() {
    setVisualLedStatus("blue", "Processing Data Bus");
    initializeStaticDropdownMenus();

    const metaMode = document.getElementById("meta-source-select").value || "JSON_FILE";
    const testMode = document.getElementById("test-source-select").value || "json_meta_challenge";
    
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

    writeLogToPanel("Executing data network sync stream loops via dynamic fetch pipeline...", "local-log");
    
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
            writeLogToPanel(`❌ Data Sync Failed: ${err.message}`, "local-log");
            setVisualLedStatus("red", "Config Faulty");
            const statusEl = document.getElementById('file-status');
            if (statusEl) statusEl.innerHTML = "⚠️ Configuration synchronization dropped. Manual text fallback active.";
        });
}

function togglePanelNodeVisibility(panelType) {
    if (panelType === 'meta') {
        const mode = document.getElementById("meta-source-select").value;
        localStorage.setItem("cache_meta_source_mode", mode);
        writeLogToPanel(`Meta Ingestion Option Selected: [${mode}]`, "local-log");

        const urlField = document.getElementById("meta-url-container");
        if (urlField) {
            urlField.className = (mode === "URL") ? "panel" : "hidden-node";
        }
        
        if (mode === "JSON_FILE" || mode === "DIRECT") {
            triggerRemoteUrlFetchSync();
        }
    } else if (panelType === 'source') {
        const mode = document.getElementById("test-source-select").value;
        localStorage.setItem("cache_test_source_mode", mode);
        writeLogToPanel(`Source Ingestion Option Selected: [${mode}]`, "local-log");

        const urlField = document.getElementById("test-url-container");
        if (urlField) {
            urlField.className = (mode === "URL") ? "panel" : "hidden-node";
        }

        if (mode === "json_meta_challenge" || mode === "json_meta_integrity" || mode === "DIRECT") {
            triggerRemoteUrlFetchSync();
        }
    }
    applyLiveTelemetryCalibration();
}

function handleActionStrategySwap() {
    const activeStrategy = document.getElementById("action-strategy-select").value;
    const testSourceSelect = document.getElementById("test-source-select");
    
    writeLogToPanel(`Verification action strategy mode flipped to: ${activeStrategy}`, "local-log");
    
    if (testSourceSelect) {
        if (activeStrategy === "CHALLENGE") {
            testSourceSelect.value = "json_meta_challenge";
        } else if (activeStrategy === "INTEGRITY") {
            testSourceSelect.value = "json_meta_integrity";
        }
        localStorage.setItem("cache_test_source_mode", testSourceSelect.value);
    }
    
    triggerRemoteUrlFetchSync();
}

function switchConfigurationTab(targetTab) {
    const btnMeta = document.getElementById("tab-btn-meta");
    const btnSource = document.getElementById("tab-btn-source");
    const viewMeta = document.getElementById("view-segment-meta");
    const viewSource = document.getElementById("view-segment-source");
    
    if (!btnMeta || !btnSource || !viewMeta || !viewSource) return;

    if (targetTab === 'meta') {
        btnMeta.className = ""; btnSource.className = "secondary";
        viewMeta.className = ""; viewSource.className = "hidden-node";
        writeLogToPanel("Workspace View: Toggled Master Meta Parameter configuration array display.", "local-log");
    } else {
        btnMeta.className = "secondary"; btnSource.className = "";
        viewMeta.className = "hidden-node"; viewSource.className = "";
        writeLogToPanel("Workspace View: Toggled Protected Source blueprint asset configuration array display.", "local-log");
    }
    applyLiveTelemetryCalibration();
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
    
    // Auto-detect root structure containers (e.g. existentialCore, UNIVERSAL_META_BITS)
    const detectedRoots = Object.keys(masterConfig);
    if (detectedRoots.length > 0) {
        activeComponentKey = detectedRoots[0];
    }
    
    switchConfigurationTab('meta');
    syncDynamicMatrixInterfaceView(true);
    setVisualLedStatus("green", "Ready to Verify");
    generateAndShowChallenge();
}

function syncDynamicMatrixInterfaceView(syncInputs = true) {
    const reportPanel = document.getElementById('report-panel');
    
    if (!activeComponentKey || !masterConfig[activeComponentKey]) {
        reportPanel.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding-top: 40px;">No configuration components parsed.</p>`;
        return;
    }

    const activeStateValue = systemStateRegisterMap[activeComponentKey] || 0n;
    const workingSchemaItems = masterConfig[activeComponentKey];

    // Introspect active schema nodes and determine bit indices via base-2 math logic
    const activeBitIndexCache = {};
    Object.keys(workingSchemaItems).forEach(elementKey => {
        const itemRecord = workingSchemaItems[elementKey];
        if (!itemRecord.value) return;
        
        const numericVal = BigInt(itemRecord.value);
        // Bitmask power-of-2 validation check to identify independent flags
        const isSingularBitFlag = numericVal > 0n && (numericVal & (numericVal - 1n)) === 0n;
        
        if (isSingularBitFlag) {
            let trackingIdx = 0; let tempShiftVal = numericVal;
            while (tempShiftVal > 1n) { tempShiftVal >>= 1n; trackingIdx++; }
            activeBitIndexCache[trackingIdx] = {
                key: elementKey,
                type: itemRecord.type || "BIT",
                meta: itemRecord
            };
        }
    });

    // Detect widest index bit boundary requested in parsed schema payload
    const sortedFoundBits = Object.keys(activeBitIndexCache).map(Number).sort((a,b)=>b-a);
    const maximumIndexSet = sortedFoundBits.length > 0 ? sortedFoundBits[0] : 0;
    
    // Scale register boundary width step structures gracefully up to 256 bits
    archWidth = maximumIndexSet >= 128 ? 256 : maximumIndexSet >= 64 ? 128 : maximumIndexSet >= 32 ? 64 : 32;
    
    const bitGridContainer = document.createElement('div');
    bitGridContainer.className = "grid-32";
    bitGridContainer.style.marginBottom = "15px";

    // Build the cells backwards from highest index bit down to position zero
    for (let i = archWidth - 1; i >= 0; i--) {
        const cellNode = document.createElement('div');
        const isCurrentBitSet = (activeStateValue & (1n << BigInt(i))) !== 0n;
        const targetMetaInfo = activeBitIndexCache[i];

        let typeAestheticClass = targetMetaInfo ? `type-${targetMetaInfo.type.toUpperCase()}` : '';
        cellNode.className = `bit-cell ${isCurrentBitSet ? 'active' : ''} ${typeAestheticClass}`;
        cellNode.innerHTML = `<div>${isCurrentBitSet ? '1' : '0'}</div><div class="bit-num">${i}</div>`;
        
        if (targetMetaInfo) {
            cellNode.title = `[${targetMetaInfo.type}] ${targetMetaInfo.key}\n${targetMetaInfo.meta.comment || ''}`;
        }

        cellNode.onclick = () => {
            if (systemStateRegisterMap[activeComponentKey] === undefined) systemStateRegisterMap[activeComponentKey] = 0n;
            systemStateRegisterMap[activeComponentKey] ^= (1n << BigInt(i));
            
            // Mask value to fit architecture width constraints
            const hardwareMask = (1n << BigInt(archWidth)) - 1n;
            systemStateRegisterMap[activeComponentKey] &= hardwareMask;
            
            syncDynamicMatrixInterfaceView(true);
            writeLogToPanel(`Bit matrix segment index point [${i}] toggled via grid matrix click.`, "local-log");
        };
        bitGridContainer.appendChild(cellNode);
    }

    // Isolate and swap the grid element inside the master config box container
    const targetWorkspaceCard = document.getElementById('configuration-workspace');
    const existingMatrixGrid = targetWorkspaceCard.querySelector('.grid-32');
    if (existingMatrixGrid) existingMatrixGrid.remove();
    
    const innerHeadlineElement = targetWorkspaceCard.querySelector('div');
    innerHeadlineElement.parentNode.insertBefore(bitGridContainer, innerHeadlineElement.nextSibling);

    renderPolymorphicForensicLedgerReport(activeStateValue, workingSchemaItems, activeBitIndexCache);
    renderIsolatedByteBreakdownField(activeStateValue);
}

function flattenStructureMap(obj, prefix = "", targetMap = {}) {
    if (obj === null || obj === undefined) return targetMap;
    if (typeof obj !== "object") { targetMap[prefix] = obj; return targetMap; }
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            let cleanKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] !== "object" || obj[key] === null) targetMap[cleanKey] = obj[key];
            else flattenStructureMap(obj[key], cleanKey, targetMap);
        }
    }
    return targetMap;
}

function executeCryptographicVerificationDiff() {
    const inputArea = document.getElementById('session-input').value.trim();
    const reportPanel = document.getElementById('report-panel');
    if (!inputArea || !masterConfig) { alert("Missing snapshot data configurations."); return; }
    
    let incoming;
    try {
        let text = inputArea; if (!text.startsWith("{")) { text = "{" + text + "}"; }
        incoming = JSON.parse(text);
    } catch(e) {
        setVisualLedStatus("orange", "Faulty Intercept");
        reportPanel.innerHTML = "<h2>❌ CRITICAL CONNECTOR FAULT: Data snapshot stream is corrupted.</h2>";
        return;
    }

    const masterMap = flattenStructureMap(masterConfig);
    const incomingMap = flattenStructureMap(incoming);

    let htmlReport = "<h2>🔬 LIVE ZERO-TRUST MINORITY REPORT (TRUE CRYPTO ENGINE)</h2>";
    let codeDiffs = "", overallPassed = true;
    let tableHtml = "<table><tr><th>Target Structural Node Pathway</th><th>Expected Baseline Hash</th><th>Incoming Payload Hash</th><th>Status Matrix Monitoring</th></tr>";

    const uniqueKeys = Array.from(new Set([...Object.keys(masterMap), ...Object.keys(incomingMap)])).sort();
    
    uniqueKeys.forEach(pathKey => {
        if (pathKey.includes("visualmixMeta") || pathKey.includes("INTEGRITY_META_PROFILE")) return;

        const valExpected = masterMap[pathKey] !== undefined ? String(masterMap[pathKey]) : null;
        const valIncoming = incomingMap[pathKey] !== undefined ? String(incomingMap[pathKey]) : null;

        let hashExpected = "NULL"; let hashIncoming = "NULL";

        // TRUE CRYPTOGRAPHIC HOOKS: Character-by-character validation passing down to universal_crypto.js
        if (valExpected) {
            if (currentAlgo.toLowerCase() === "sha256" && typeof hashSHA256 === "function") hashExpected = hashSHA256(valExpected);
            else if (currentAlgo.toLowerCase() === "sha1" && typeof hashSHA1 === "function") hashExpected = hashSHA1(valExpected);
            else if (typeof hashMD5 === "function") hashExpected = hashMD5(valExpected);
            else hashExpected = valExpected.substring(0, 8) + "...";
        }
        if (valIncoming) {
            if (currentAlgo.toLowerCase() === "sha256" && typeof hashSHA256 === "function") hashIncoming = hashSHA256(valIncoming);
            else if (currentAlgo.toLowerCase() === "sha1" && typeof hashSHA1 === "function") hashIncoming = hashSHA1(valIncoming);
            else if (typeof hashMD5 === "function") hashIncoming = hashMD5(valIncoming);
            else hashIncoming = valIncoming.substring(0, 8) + "...";
        }

        const isMatch = hashExpected === hashIncoming;
        if (!isMatch) overallPassed = false;

        const stateColor = isMatch ? "green" : "red";
        const stateLabel = isMatch ? "FOUND AND OK" : "MUTATED DRIFT";

        if (!isMatch && valExpected && valIncoming) {
            codeDiffs += `<h3 class="font-monospace text-warning mt-3">📍 Node Path Shift Trapped: ${pathKey}</h3>`;
            codeDiffs += `<div style="background: var(--bg-input); padding: 8px; border-radius: 4px; margin-bottom:10px;">${computeDetailedTextDiff(valExpected, valIncoming, pathKey)}</div>`;
        }

        tableHtml += `<tr>
            <td><code style="color:var(--accent); font-size:11px;">${pathKey}</code></td>
            <td style="color:${isMatch?'var(--green)':'var(--red)'}; font-family:monospace;">${hashExpected}</td>
            <td style="font-family:monospace;">${hashIncoming}</td>
            <td>
                <span class="led-container">
                    <div class="led-fixture fx-round fx-shiny led-c-${stateColor}" style="width:12px; height:12px;"></div>
                    <span style="color:var(--${stateColor}); font-size:11px; font-weight:bold; margin-left:6px;">${stateLabel}</span>
                </span>
            </td>
        </tr>`;
    });
    tableHtml += "</table>";

    setVisualLedStatus(overallPassed ? "green" : "red", overallPassed ? "Verified Pass" : "Script Faulty");
    htmlReport += `<div style="margin-bottom:12px; font-size:12px;"><b>Operational Compliance Status:</b> <span class="badge ${overallPassed?'badge-pass':'badge-fail'}">${overallPassed?'100% PERFECT':'DECAY DRIFT TRAPPED'}</span> <span class="badge bg-dark border text-primary font-weight-bold p-1 uppercase" style="font-size:10px;">${currentAlgo.toUpperCase()} Engine</span></div>` + tableHtml;
    
    if (codeDiffs) htmlReport += "<h2 class='h5 font-monospace text-danger border-danger mt-3'>🚨 LINE-LEVEL SYNTAX GAP DELTAS</h2>" + codeDiffs;
    reportPanel.innerHTML = htmlReport;
    writeLogToPanel(`Universal Matrix Cryptographic Audit complete. Engine Result: ${overallPassed ? 'PASS' : 'REJECTED_DRIFT'}`, "local-log");
    applyLiveTelemetryCalibration();
}

function computeDetailedTextDiff(expectedStr, incomingStr, label) {
    let expLines = String(expectedStr).split("\n"); let incLines = String(incomingStr).split("\n");
    let maxLines = Math.max(expLines.length, incLines.length); let diffLog = "";
    for (let i = 0; i < maxLines; i++) {
        let eLine = expLines[i] !== undefined ? expLines[i] : null; let iLine = incLines[i] !== undefined ? incLines[i] : null;
        if (eLine !== iLine) {
            let lineNum = i + 1;
            diffLog += `<div style="margin-top: 6px; border-left: 2px solid var(--red); padding-left: 6px; font-family: monospace; font-size: 11px;"><b>📍 Line ${lineNum} Drift [${label}]:</b><br/>`;
            if (eLine === null) diffLog += `<span style="color:var(--green)">[+] Added line: ${escapeHtml(iLine)}</span>`;
            else if (iLine === null) diffLog += `<span style="color:var(--red)">[-] Deleted line: ${escapeHtml(eLine)}</span>`;
            else diffLog += `<span style="color:var(--red)">Expected: ${escapeHtml(eLine)}</span><br/><span style="color:var(--green)">Incoming: ${escapeHtml(iLine)}</span>`;
            diffLog += `</div>`;
        }
    }
    return diffLog;
}

function renderPolymorphicForensicLedgerReport(state, rawItems, computedBitMap) {
    const reportPanel = document.getElementById('report-panel');
    let htmlReport = "<h2>🔬 LIVE ZERO-TRUST MINORITY REPORT (UNIVERSAL STRUCT ENGINE)</h2>";
    let listHtml = "<div class='list-group list-group-flush font-monospace'>";
    let criticalAlertFired = false; let warningFired = false;

    Object.keys(computedBitMap).forEach(bitIndex => {
        if (parseInt(bitIndex) >= archWidth) return;
        const record = computedBitMap[bitIndex]; const isTriggered = (state & (1n << BigInt(bitIndex))) !== 0n;
        if (isTriggered && record.type === 'CANARY') criticalAlertFired = true;
        if (isTriggered && record.type === 'THREAT') warningFired = true;

        let props = "";
        Object.keys(record.meta).forEach(subKey => {
            if (!["value", "expr", "type"].includes(subKey) && record.meta[subKey]) {
                props += `<div class="text-muted small mt-1"><span class="text-capitalize fw-bold">${subKey}:</span> ${record.meta[subKey]}</div>`;
            }
        });
        listHtml += `<div class="list-group-item p-2 ${isTriggered?'bg-dark-subtle border-start border-3 border-success':''}" style="font-size:0.7rem; background: transparent; border-bottom: 1px solid var(--border);"><div class="d-flex justify-content-between align-items-center"><span class="fw-bold text-primary">BIT_${bitIndex}: ${record.key}</span><span class="badge bg-secondary badge-mono">${record.type}</span></div>${props}</div>`;
    });

    Object.keys(computedBitMap).forEach(bitIndex => {
        if (parseInt(bitIndex) >= archWidth) return;
        const record = computedBitMap[bitIndex]; 
        const isTriggered = (state & (1n << BigInt(bitIndex))) !== 0n;
        if (isTriggered && record.type === 'CANARY') criticalAlertFired = true;
        if (isTriggered && record.type === 'THREAT') warningFired = true;

        let props = "";
        Object.keys(record.meta).forEach(subKey => {
            if (!["value", "expr", "type"].includes(subKey) && record.meta[subKey]) {
                props += `<div class="text-muted small mt-1"><span class="text-capitalize fw-bold">${subKey}:</span> ${record.meta[subKey]}</div>`;
            }
        });
        listHtml += `<div class="list-group-item p-2 ${isTriggered?'bg-dark-subtle border-start border-3 border-success':''}" style="font-size:0.7rem; background: transparent; border-bottom: 1px solid var(--border);"><div class="d-flex justify-content-between align-items-center"><span class="fw-bold text-primary">BIT_${bitIndex}: ${record.key}</span><span class="badge bg-secondary badge-mono">${record.type}</span></div>${props}</div>`;
    });

    Object.keys(rawItems).forEach(elementKey => {
        const dataItem = rawItems[elementKey]; 
        const rawVal = BigInt(dataItem.value);
        const isSingleBit = rawVal > 0n && (rawVal & (rawVal - 1n)) === 0n;
        if (!isSingleBit && rawVal !== 0n) {
            const isSignatureMatched = (state & rawVal) === rawVal;
            if (isSignatureMatched && dataItem.type === 'CANARY') criticalAlertFired = true;
            let props = "";
            Object.keys(dataItem).forEach(subKey => {
                if (!["value", "expr", "type"].includes(subKey)) props += `<div class="text-muted small mt-1"><span class="text-capitalize fw-bold">${subKey}:</span> ${dataItem[subKey]}</div>`;
            });
            listHtml += `<div class="list-group-item p-2 ${isSignatureMatched?'bg-dark-subtle border-start border-3 border-warning':''}" style="font-size:0.7rem; background: transparent; border-bottom: 1px solid var(--border);"><div class="d-flex justify-content-between align-items-center"><span class="fw-bold text-warning">💥 SIGNATURE: ${elementKey}</span><span class="badge badge-mono bg-dark text-warning border border-warning">${dataItem.type || 'COMPOSITE'}</span></div>${props}</div>`;
        }
    });

    const ledColor = criticalAlertFired ? "red" : warningFired ? "orange" : "green";
    setVisualLedStatus(ledColor, criticalAlertFired ? "CRITICAL CANARY BREAK" : warningFired ? "ACTIVE REGISTERS WARNING" : "WORKSPACE CONFIG NOMINAL");
    if (Object.keys(rawItems).length === 0) reportPanel.innerHTML = htmlReport + `<p style="color: var(--text-muted); text-align: center; padding-top: 40px;">No metadata parameters discovered.</p>`;
    else reportPanel.innerHTML = htmlReport + listHtml + "</div>";
    applyLiveTelemetryCalibration();
}

function renderIsolatedByteBreakdownField(state) {}

function applyLiveTelemetryCalibration() {
    const fixtureGeometry = document.getElementById("ctrl-led-fixture").value;
    const telemetryActivity = document.getElementById("ctrl-led-blink").value;
    const luminousFlux = document.getElementById("ctrl-led-bright").value;
    const boundaryOpacity = document.getElementById("ctrl-panel-op").value;

    document.querySelectorAll(".led-fixture").forEach(led => {
        const activeColorClass = Array.from(led.classList).find(c => c.startsWith("led-c-")) || "led-c-green";
        led.className = `led-fixture ${fixtureGeometry} ${luminousFlux} ${activeColorClass}`;
        if (telemetryActivity === "led-blink" && activeColorClass !== "led-c-green") led.classList.add("led-blink");
    });
    document.querySelectorAll(".panel").forEach(p => {
        const activeStateClass = Array.from(p.classList).find(c => c.startsWith("state-")) || "state-green";
        const baseGlowClass = Array.from(p.classList).find(c => c.startsWith("glow-")) || "";
        p.className = `panel ${baseGlowClass} ${boundaryOpacity} ${activeStateClass}`;
    });
}

function setVisualLedStatus(color, labelText, primaryLedId = "status-led", statusTextId = "status-text") {
    const led = document.getElementById(primaryLedId); 
    const text = document.getElementById(statusTextId);
    const colorHexMap = { "green": "#3fb950", "orange": "#d29922", "red": "#f85149", "blue": "#2f81f7", "yellow": "#f1e05a", "pink": "#ff79c6" };
    if (led) { led.className = "led-fixture"; led.classList.add("led-c-" + color); }
    if (text) { text.innerHTML = labelText; text.style.color = colorHexMap[color] || "#e1e7f0"; }
    ["configuration-workspace", "panel-box-4", "workspace-action-zone", "report-panel"].forEach(id => {
        const el = document.getElementById(id);
        if (el) { const currentClasses = Array.from(el.classList).filter(c => !c.startsWith("state-")); el.className = currentClasses.join(" ") + " state-" + color; }
    });
}

function renderInitialBaselineMetricsLedger() {}

function applyBitmaskPolicyConstraints(optionsBlock) {
    populateDynamicDropdown("meta-source-select", optionsBlock.meta || ["JSON_FILE", "URL", "INPUT", "DIRECT"]);
    populateDynamicDropdown("test-source-select", optionsBlock.source || ["json_meta_challenge", "json_meta_integrity", "URL", "INPUT", "DIRECT"]);
    populateDynamicDropdown("action-strategy-select", optionsBlock.action || ["CHALLENGE", "INTEGRITY"]);
}

function generateAndShowChallenge() {
    if (!masterConfig) return; 
    let challenge = JSON.parse(JSON.stringify(masterConfig));
    const strategy = document.getElementById("action-strategy-select").value;
    if (strategy === "CHALLENGE" && challenge.SYSTEM_BASELINE_CONFIG) {
        if (challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName]) delete challenge.SYSTEM_BASELINE_CONFIG[metaRegistryName];
    }
    document.getElementById('challenge-output').value = JSON.stringify(challenge, null, 2);
}

function triggerProfileBackupExport() { 
    if (masterConfig) exportSettingsJsonFile(masterConfig, "visualmix_profile_backup.json"); 
}

function exportSettingsJsonFile(configObject, fallbackFileName = "visualmix_profile_backup.json") {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configObject, null, 2));
        const downloadAnchor = document.createElement('a'); 
        downloadAnchor.setAttribute("href", dataStr); 
        downloadAnchor.setAttribute("download", fallbackFileName);
        document.body.appendChild(downloadAnchor); 
        downloadAnchor.click(); 
        downloadAnchor.remove();
        writeLogToPanel(`✅ Successfully exported profile payload: [${fallbackFileName}]`, "local-log");
    } catch (e) { 
        writeLogToPanel(`❌ Critical File Output Export Exception: ${e.message}`, "local-log"); 
    }
}

function executeFactoryResetPurge() { 
    localStorage.clear(); 
    writeLogToPanel("Purging persistent memory cache. Re-bootstrapping to repository defaults.", "local-log"); 
    location.reload(); 
}
