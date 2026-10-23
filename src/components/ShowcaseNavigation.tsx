import { useEffect, useState } from "react";
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

function isWorkbenchLanguage(value: string | null): value is WorkbenchLanguage {
  return value === "zh" || value === "en";
}

export function ShowcaseNavigation() {
  const { i18n, t } = useTranslation();
  const { lang, setLang } = useWorkbenchStore();
  const [activeSection, setActiveSection] = useState(showcaseSections[0].id);

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

        if (nextSection) setActiveSection(nextSection.target.id as typeof activeSection);
      },
      { rootMargin: "-24% 0px -64% 0px", threshold: [0, 0.01] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

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

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${sectionId}`);
  };

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

      <nav className="ShowcaseSectionNav" aria-label={t("home.navigation.sectionAria")}>
        {showcaseSections.map((section) => {
          const active = activeSection === section.id;
          return (
            <button
              aria-current={active ? "location" : undefined}
              aria-label={t(section.labelKey)}
              className={active ? "is-active" : ""}
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              type="button"
            >
              <span className="ShowcaseSectionNav__label">{t(section.labelKey)}</span>
              <span className="ShowcaseSectionNav__line" aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    </>
  );
}
