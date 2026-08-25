/**
 * 🗺️ UNIVERSAL ENGINE: TEMPLATES & LANGUAGES v0.1
 * Dynamic Multi-Language Layout Router & Template Ingestion Matrix
 * (c)2006-2012 Gunther Voet | VisualMIX/front-end/ui/engine_templates.js
 */

const TemplateEngine = {
    // Current application state configuration data
    config: {
        activeLanguage: "en",
        fallbackLanguage: "en",
        availableLanguages: ["en", "nl", "fr", "de"]
    },

    // Symmetrical Translation Matrix Arrays
    dictionaries: {
        en: {
            console_title: "Zero-Trust Console | VisualMIX",
            sandbox_title: "Bitshift Love | VisualMIX",
            ready_status: "Ready to Verify",
            busy_status: "Processing Data Bus",
            fault_status: "Script Faulty"
        },
        nl: {
            console_title: "VisualMIX | Zero-Trust Console",
            sandbox_title: "Bitshift Sandbox Motor",
            ready_status: "Gereed voor Verificatie",
            busy_status: "Databus Verwerken",
            fault_status: "Script Foutief"
        }
    },

    /**
     * Initializes the template state and synchronizes language selections from cookies.
     */
    init: function() {
        // Read custom language preference out of your cookie tracking arrays if present
        if (typeof getCookie === "function") {
            const savedLang = getCookie("visualmix_language_scope");
            if (savedLang && this.config.availableLanguages.includes(savedLang)) {
                this.config.activeLanguage = savedLang;
            }
        }
        this.applyLanguageTranslationsToDOM();
    },

    /**
     * Loops through the HTML DOM and updates strings matching the localization data targets.
     */
    applyLanguageTranslationsToDOM: function() {
        const currentDictionary = this.dictionaries[this.config.activeLanguage] || this.dictionaries[this.config.fallbackLanguage];
        
        // Surgically targets semantic localization tags inside your page views
        document.querySelectorAll("[data-vm-translate]").forEach(element => {
            const translationKey = element.getAttribute("data-vm-translate");
            if (currentDictionary[translationKey]) {
                element.textContent = currentDictionary[translationKey];
            }
        });
        
        if (typeof writeLogToPanel === "function") {
            writeLogToPanel(`🌐 Translation Engine: Swapped template layout language to [${this.config.activeLanguage.toUpperCase()}]`);
        }
    },

    /**
     * Updates the language cookie configuration scope and flash-reloads the view layout.
     */
    setLanguage: function(langCode) {
        if (!this.config.availableLanguages.includes(langCode)) return;
        this.config.activeLanguage = langCode;
        document.cookie = `visualmix_language_scope=${langCode}; max-age=${60*60*24*365}; path=/`;
        this.applyLanguageTranslationsToDOM();
    }
};

// Hook initialization safely to the global lifecycle thread
document.addEventListener("DOMContentLoaded", () => {
    TemplateEngine.init();
});
