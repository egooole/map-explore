import { useCallback, useEffect, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { useTranslation } from "react-i18next";
import { useWorkbenchStore, type WorkbenchLanguage } from "../store/workbenchStore";

const showcaseSections = [
  { id: "home", labelKey: "home.navigation.home" },
  { id: "context", labelKey: "home.navigation.context" },
  { id: "capabilities", labelKey: "home.navigation.capabilities" },
  { id: "components", labelKey: "home.navigation.components" },
  { id: "use-cases", labelKey: "home.navigation.cases" },
  { id: "get-started", labelKey: "home.navigation.start" },
] as const;

type ShowcaseSectionId = (typeof showcaseSections)[number]["id"];

const NAV_ENTER_DELAY = 60;
const NAV_LEAVE_DELAY = 150;
const SCROLL_LOCK_FALLBACK = 1000;

function isWorkbenchLanguage(value: string | null): value is WorkbenchLanguage {
  return value === "zh" || value === "en";
}

export function ShowcaseNavigation() {
  const { i18n, t } = useTranslation();
  const { lang, setLang } = useWorkbenchStore();
  const [activeSection, setActiveSection] = useState<ShowcaseSectionId>(showcaseSections[0].id);
  const [hoveredSection, setHoveredSection] = useState<ShowcaseSectionId | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const scrollFallbackRef = useRef<number | null>(null);
  const scrollEndHandlerRef = useRef<(() => void) | null>(null);
  const lockRef = useRef(false);

  const syncActiveSection = useCallback(() => {
    const targetLine = window.innerHeight * 0.32;
    const nearestSection = showcaseSections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))
      .sort(
        (sectionA, sectionB) =>
          Math.abs(sectionA.getBoundingClientRect().top - targetLine) -
          Math.abs(sectionB.getBoundingClientRect().top - targetLine),
      )[0];

    if (nearestSection) setActiveSection(nearestSection.id as ShowcaseSectionId);
  }, []);

  const clearScrollLockListeners = useCallback(() => {
    if (scrollFallbackRef.current) {
      window.clearTimeout(scrollFallbackRef.current);
      scrollFallbackRef.current = null;
    }
    if (scrollEndHandlerRef.current) {
      window.removeEventListener("scrollend", scrollEndHandlerRef.current);
      scrollEndHandlerRef.current = null;
    }
  }, []);

  const unlockSectionTracking = useCallback(() => {
    clearScrollLockListeners();
    lockRef.current = false;
    syncActiveSection();
  }, [clearScrollLockListeners, syncActiveSection]);

  useEffect(() => {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    const storedLanguage = window.localStorage.getItem("map-lab-showcase-language");
    const initialLanguage = isWorkbenchLanguage(queryLanguage)
      ? queryLanguage
      : isWorkbenchLanguage(storedLanguage)
        ? storedLanguage
        : lang;

    setLang(initialLanguage);
    void i18n.changeLanguage(initialLanguage);
    document.documentElement.lang = initialLanguage === "zh" ? "zh-CN" : "en";
  }, [i18n, lang, setLang]);

  useEffect(() => {
    const sections = showcaseSections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const visibleSections = new Map<string, IntersectionObserverEntry>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.set(entry.target.id, entry);
          else visibleSections.delete(entry.target.id);
        });

        const nextSection = [...visibleSections.values()].sort((a, b) => {
          const distanceA = Math.abs(a.boundingClientRect.top - window.innerHeight * 0.32);
          const distanceB = Math.abs(b.boundingClientRect.top - window.innerHeight * 0.32);
          return distanceA - distanceB;
        })[0];

        if (lockRef.current) return;
        if (nextSection) setActiveSection(nextSection.target.id as ShowcaseSectionId);
      },
      { rootMargin: "-24% 0px -64% 0px", threshold: [0, 0.01] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      clearScrollLockListeners();
    },
    [clearScrollLockListeners],
  );

  const changeLanguage = (nextLanguage: WorkbenchLanguage) => {
    if (nextLanguage === lang) return;

    setLang(nextLanguage);
    void i18n.changeLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage === "zh" ? "zh-CN" : "en";
    window.localStorage.setItem("map-lab-showcase-language", nextLanguage);

    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLanguage);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const scrollToSection = (sectionId: ShowcaseSectionId) => {
    const section = document.getElementById(sectionId);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    clearScrollLockListeners();
    setActiveSection(sectionId);
    lockRef.current = true;

    const handleScrollEnd = () => unlockSectionTracking();
    scrollEndHandlerRef.current = handleScrollEnd;
    window.addEventListener("scrollend", handleScrollEnd, { once: true });
    scrollFallbackRef.current = window.setTimeout(unlockSectionTracking, SCROLL_LOCK_FALLBACK);

    section?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${sectionId}`);
  };

  const handleNavPointerEnter = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    openTimerRef.current = window.setTimeout(() => {
      setIsExpanded(true);
      openTimerRef.current = null;
    }, NAV_ENTER_DELAY);
  };

  const handleNavPointerLeave = () => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsExpanded(false);
      setHoveredSection(null);
      closeTimerRef.current = null;
    }, NAV_LEAVE_DELAY);
  };

  const handleNavFocus = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setIsExpanded(true);
  };

  const handleNavBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    handleNavPointerLeave();
  };

  const indicatorSection = isExpanded && hoveredSection ? hoveredSection : activeSection;
  const indicatorIndex = showcaseSections.findIndex(({ id }) => id === indicatorSection);

  return (
    <>
      <div className="ShowcaseLanguage" role="group" aria-label={t("home.navigation.languageAria")}>
        <button aria-pressed={lang === "zh"} className={lang === "zh" ? "is-active" : ""} onClick={() => changeLanguage("zh")} type="button">
          中
        </button>
        <span aria-hidden="true" />
        <button aria-pressed={lang === "en"} className={lang === "en" ? "is-active" : ""} onClick={() => changeLanguage("en")} type="button">
          EN
        </button>
      </div>

      <nav
        className={`ShowcaseSectionNav${isExpanded ? " is-expanded" : ""}`}
        aria-label={t("home.navigation.sectionAria")}
        onBlur={handleNavBlur}
        onFocus={handleNavFocus}
        onPointerEnter={handleNavPointerEnter}
        onPointerLeave={handleNavPointerLeave}
      >
        <span
          className="ShowcaseSectionNav__indicator"
          style={{ "--section-index": indicatorIndex } as CSSProperties}
          aria-hidden="true"
        />
        {showcaseSections.map((section, index) => {
          const active = activeSection === section.id;
          const hovered = isExpanded && hoveredSection === section.id;
          return (
            <button
              aria-current={active ? "location" : undefined}
              aria-label={t(section.labelKey)}
              className={`${active ? "is-active" : ""}${hovered ? " is-hovered" : ""}`}
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              onFocus={() => setHoveredSection(section.id)}
              onPointerEnter={() => setHoveredSection(section.id)}
              type="button"
            >
              <span
                className="ShowcaseSectionNav__label"
                style={{ "--i": index } as CSSProperties}
              >
                {t(section.labelKey)}
              </span>
              <span className="ShowcaseSectionNav__line" aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    </>
  );
}
