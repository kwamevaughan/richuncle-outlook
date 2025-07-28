import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import TooltipIconButton from "@/components/TooltipIconButton";

const LanguageSwitch = ({ mode, showLabel = false }) => {
  const dropdownRef = useRef(null);
  const selectRef = useRef(null);
  const initialLoadRef = useRef(true);
  const googleTranslateElRef = useRef(null);

  const languages = [
    { name: "English", flag: "flag:us-1x1", code: "en" },
    { name: "French", flag: "flag:fr-1x1", code: "fr" },
    { name: "Akan", flag: "flag:gh-1x1", code: "ak" },
  ];

  const toastMessages = {
    en: "Translated to English",
    fr: "Traduit en Français",
    sw: "Umetafsiriwa kwa Kiswahili",
    ar: "تمت الترجمة إلى العربية",
    ha: "An fassara zuwa Hausa",
    ak: "Wɔakyerɛ aseɛ kɔ Akan",
  };

  const detectInitialLanguage = () => {
    // Safe check for browser environment
    if (typeof window === "undefined") return "English";

    const saved = window.localStorage.getItem("selectedLanguage");
    if (saved) return saved;

    // Only access navigator in browser environment
    const browserLang = window.navigator.language.toLowerCase();
    const match = languages.find((lang) => browserLang.startsWith(lang.code));
    const defaultLang = match ? match.name : "English";

    window.localStorage.setItem("selectedLanguage", defaultLang);
    return defaultLang;
  };

  // Initialize state with a function to prevent execution during SSR
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isOpen, setIsOpen] = useState(false);
  const [widgetInitialized, setWidgetInitialized] = useState(false);
  const [useFallbackUI, setUseFallbackUI] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Set the initial language after component mounts (client-side only)
  useEffect(() => {
    setSelectedLanguage(detectInitialLanguage());
  }, []);

  // Load Google Translate script safely
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Cleanup any previous initialization
    if (window.googleTranslateElementInit) {
      delete window.googleTranslateElementInit;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src="//translate.google.com/translate_a/element.js"]'
    );

    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    // Create a new script element
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      console.error("Failed to load translation script");
      toast.error("Failed to load translation service");
      setUseFallbackUI(true);
    };

    // Define the callback before adding the script
    window.googleTranslateElementInit = () => {
      try {
        setScriptLoaded(true);
      } catch (error) {
        console.error("Script initialization error:", error);
      }
    };

    // Add script to document
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  // Initialize Google Translate Widget
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !scriptLoaded ||
      !googleTranslateElRef.current
    )
      return;

    try {
      // Make sure we don't initialize twice
      if (googleTranslateElRef.current.childNodes.length > 0) {
        setWidgetInitialized(true);
        return;
      }

      // Initialize the widget
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: languages.map((l) => l.code).join(","),
          layout:
            window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
          autoDisplay: false,
        },
        googleTranslateElRef.current.id
      );

      setWidgetInitialized(true);
    } catch (error) {
      console.error("Widget initialization error:", error);
      toast.error("Translation service initialization failed");
      setUseFallbackUI(true);
    }
  }, [scriptLoaded, languages]);

  // Detect select box from Google Translate
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !widgetInitialized ||
      !googleTranslateElRef.current
    )
      return;

    const observer = new MutationObserver(() => {
      const select = googleTranslateElRef.current.querySelector("select");
      if (select) {
        selectRef.current = select;
        observer.disconnect();
      }
    });

    observer.observe(googleTranslateElRef.current, {
      childList: true,
      subtree: true,
    });

    const timeout = setTimeout(() => {
      if (!selectRef.current) {
        console.warn("Translation service select not found");
        toast.error("Translation service unavailable. Using default UI.");
        setUseFallbackUI(true);
        observer.disconnect();
      }
    }, 5000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [widgetInitialized]);

  // Apply selected language
  useEffect(() => {
    if (typeof window === "undefined" || !selectRef.current) return;

    const match = languages.find((lang) => lang.name === selectedLanguage);
    if (match) {
      try {
        selectRef.current.value = match.code;
        const event = new Event("change");
        selectRef.current.dispatchEvent(event);

        // Only show toast on user initiated language changes, not initial load
        if (!initialLoadRef.current) {
          toast.success(toastMessages[match.code]);
        } else {
          initialLoadRef.current = false;
        }
      } catch (error) {
        console.error("Error applying language:", error);
      }
    }
  }, [selectRef.current, selectedLanguage]);

  // Close dropdown when clicked outside
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide Google Translate banner
  useEffect(() => {
    if (typeof window === "undefined") return;

    const style = document.createElement("style");
    style.textContent = `
      .goog-te-banner-frame {
        display: none !important;
      }
      #goog-gt-tt {
        display: none !important;
      }
      .goog-te-gadget {
        font-size: 0 !important;
      }
      .goog-te-menu-value span:first-child {
        display: none;
      }
      .goog-te-menu-frame {
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.name);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("selectedLanguage", language.name);
    }
    setIsOpen(false);

    if (useFallbackUI) {
      toast.success(toastMessages[language.code]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden Translate container */}
      <div
        id="google_translate_element"
        ref={googleTranslateElRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          height: "0",
          overflow: "hidden",
          top: "-9999px",
          left: "-9999px",
        }}
      />

      {showLabel ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-2 rounded-lg text-sm transition-all cursor-pointer min-h-[44px] ${
            mode === "dark"
              ? "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
              : "text-gray-500 hover:text-blue-800 hover:bg-gray-50"
          }`}
        >
          <Icon
            icon={
              languages.find((lang) => lang.name === selectedLanguage)?.flag ||
              languages[0].flag
            }
            className="h-5 w-5 rounded-full"
          />
          <span>Language</span>
        </button>
      ) : (
        <TooltipIconButton
          label={<span className={mode === "dark" ? "text-white" : "text-black"}>Change Language</span>}
          mode={mode}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/50 hover:-mt-1 transition-all duration-500"
        >
          <Icon
            icon={
              languages.find((lang) => lang.name === selectedLanguage)?.flag ||
              languages[0].flag
            }
            className="h-6 w-6 rounded-full"
          />
        </TooltipIconButton>
      )}

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
            mode === "dark"
              ? "bg-gray-800 text-white"
              : "bg-white text-[#231812]"
          }`}
        >
          {languages.map((language) => (
            <button
              key={language.name}
              onClick={() => handleLanguageSelect(language)}
              className={`flex items-center w-full px-4 py-2 text-left hover:bg-opacity-10 hover:bg-gray-500 ${
                selectedLanguage === language.name
                  ? "bg-opacity-5 bg-gray-500"
                  : ""
              }`}
            >
              <Icon
                icon={language.flag}
                className="h-6 w-6 mr-2 rounded-full"
              />
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitch;
