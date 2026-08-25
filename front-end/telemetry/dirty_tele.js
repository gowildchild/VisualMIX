/** 
 * * TELEMETRY ROUTINES v0.3
 *** Quick-n-Dirty Telemetry            VisualMIX/front_end/telemetry/dirty_tele.js
 ** (c)2006-2012 Gunther Voet
**/

/**
 * Appends a localized, formatted event string to any target scrolling terminal node.
 * @param {string} msg - The text payload string to write out to the screen.
 * @param {string} targetBoxId - The explicit HTML element ID of the log box container.
 */
function writeLogToPanel(msg, targetBoxId = "local-log") {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logBox = document.getElementById(targetBoxId);
    if (logBox) {
        logBox.innerHTML += `[${timestamp}] ${msg}<br/>`;
        logBox.scrollTop = logBox.scrollHeight;
    }
}

/**
 * Handles synchronous visual state mappings across status text bars and cockpit grid layouts.
 * Supports framework state maps: green, orange, red, blue, yellow, and pink.
 * @param {string} color - The state key name indicator string target.
 * @param {string} labelText - The message to display beside the primary system LED.
 * @param {string} primaryLedId - The explicit HTML element ID of the header status LED.
 * @param {string} statusTextId - The explicit HTML element ID of the header status label text.
 */
function setVisualLedStatus(color, labelText, primaryLedId = "status-led", statusTextId = "status-text") {
    const led = document.getElementById(primaryLedId);
    const text = document.getElementById(statusTextId);
    
    // Symmetrical framework hexadecimal hex color string mapper mapping arrays
    const colorHexMap = { 
        "green": "#3fb950", 
        "orange": "#d29922", 
        "red": "#f85149", 
        "blue": "#2f81f7", 
        "yellow": "#f1e05a", 
        "pink": "#ff79c6" 
    };
    const targetColor = colorHexMap[color] || "#e1e7f0";

    if (led) {
        // Clear old tracking style attributes completely and preserve base class tokens
        led.className = "led-fixture";
        led.classList.add("led-c-" + color);
        
        // Re-enforce manual calibration layers dynamically if active inside your workspace environment
        if (typeof applyLiveTelemetryCalibration === "function") {
            applyLiveTelemetryCalibration();
        }
    }
    
    if (text) {
        text.innerHTML = labelText;
        text.style.color = targetColor;
    }
    
    // Dynamic Cockpit Grid Proximity Glow Fallback Router Interceptor
    const panels = [
        { id: "configuration-workspace", baseClass: "panel glow-top-left" },
        { id: "panel-box-4",             baseClass: "panel glow-bottom-left" },
        { id: "workspace-action-zone",   baseClass: "panel glow-top-right" },
        { id: "report-panel",            baseClass: "panel glow-bottom-right" }
    ];

    panels.forEach(p => {
        const el = document.getElementById(p.id);
        if (el) {
            el.className = `${p.baseClass} state-${color}`;
            const header = el.querySelector("h2");
            if (header) {
                header.style.color = targetColor;
                header.style.transition = "color 0.3s ease";
            }
        }
    });
}

/**
 * Downloads a deep serialization pass of any configuration object array directly from client browser memory.
 * @param {object} configObject - The dataset layout dictionary parameters profile to serialize.
 * @param {string} fallbackFileName - The filename string target written to local disk.
 */
function exportSettingsJsonFile(configObject, fallbackFileName = "visualmix_profile_backup.json") {
    if (!configObject) {
        writeLogToPanel("⚠️ Export Execution Aborted: Data profile stream target is null or uninitialized.");
        return;
    }
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configObject, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", fallbackFileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        writeLogToPanel(`✅ Successfully exported configuration profile file payload to: [${fallbackFileName}]`);
    } catch (e) {
        writeLogToPanel(`❌ Critical Exception caught during data payload file output export sequence: ${e.message}`);
    }
}
