/** 
 * 🌈 UNIVERSAL ENGINE: RAINBOWS v0.3.5
 * Hardware-Accelerated Dynamic Glow Matrix & Layout Canvas Scaler
 * (c)2006-2012 Gunther Voet | Integrated for VisualMIX
 */

const RainbowEngine = {
    // Current application-wide runtime state
    state: {
        activeSpeed: 15,
        isActive: true,
        globalBlur: 6,
        globalOpacity: 0.75
    },

    /**
     * Initializes the dynamic canvas listeners and boots the layout trackers.
     */
    init: function(config = {}) {
        this.state.activeSpeed = config.speed || this.state.activeSpeed;
        this.state.globalBlur = config.blur !== undefined ? config.blur : this.state.globalBlur;
        this.state.globalOpacity = config.opacity !== undefined ? config.opacity : this.state.globalOpacity;
        
        this.applyGlobalHardwareVariables();
        console.log("🌈 RainbowEngine: Dynamic vinyl gloss matrices fully armed and active.");
    },

    /**
     * Programmatically sets the CSS Variables to control the canvas without re-writing stylesheets.
     */
    applyGlobalHardwareVariables: function() {
        const root = document.documentElement;
        if (!root) return;
        root.style.setProperty('--rainbow-speed', `${this.state.activeSpeed}s`);
        root.style.setProperty('--rainbow-blur', `${this.state.globalBlur}px`);
        root.style.setProperty('--rainbow-opacity', this.state.globalOpacity);
    },

    /**
     * Dynamically shifts the speed of the layout loop, mimicking a vinyl pitch slider slider.
     * @param {number} seconds - The loop cycle duration. Lower numbers = faster spin.
     */
    setPitchSpeed: function(seconds) {
        this.state.activeSpeed = seconds;
        this.applyGlobalHardwareVariables();
    },

    /**
     * Instantly activates or mutes the dynamic glow overlay tracks.
     */
    toggleGlowDeck: function() {
        this.state.isActive = !this.state.isActive;
        const root = document.documentElement;
        if (root) {
            root.style.setProperty('--rainbow-opacity', this.state.isActive ? this.state.globalOpacity : '0');
        }
    }
};

// Auto-boot if the environment lifecycle is ready
document.addEventListener("DOMContentLoaded", () => {
    RainbowEngine.init();
});
