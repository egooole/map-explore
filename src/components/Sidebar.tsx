import { BookOpen, Check, Globe2, Languages, Map, MapPinned, Play, Route } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import i18n from "../i18n";
import {
  MapCategory,
  useWorkbenchStore,
  WorkbenchLanguage,
  WorkbenchView,
} from "../store/workbenchStore";

interface SidebarNavItemProps {
  icon: ReactNode;
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}

function SidebarNavItem({ icon, label, description, active, onClick }: SidebarNavItemProps) {
  return (
    <button className={`SidebarNavItem ${active ? "is-active" : ""}`} onClick={onClick} type="button">
      <span className="SidebarNavItem__bar" />
      <span className="SidebarNavItem__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="SidebarNavItem__copy">
        <span>{label}</span>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="SidebarNavItem__check" aria-hidden="true">
        <Check size={12} />
      </span>
    </button>
  );
}

interface SidebarNavGroupProps {
  title: string;
  children: ReactNode;
}

function SidebarNavGroup({ title, children }: SidebarNavGroupProps) {
  return (
    <section className="SidebarNavGroup" aria-label={title}>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

const viewPaths: Record<WorkbenchView, string> = {
  browse: "/browse",
  "use-case": "/use-case",
  manual: "/manual",
};

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { view, mapCategory, lang, setView, setMapCategory, setLang } = useWorkbenchStore();

  const handleView = (nextView: WorkbenchView) => {
    setView(nextView);
    if (location.pathname !== viewPaths[nextView]) {
      navigate(viewPaths[nextView]);
    }
  };

  const handleCategory = (nextCategory: MapCategory) => {
    setMapCategory(nextCategory);
  };

  const handleLang = (nextLang: WorkbenchLanguage) => {
    setLang(nextLang);
    i18n.changeLanguage(nextLang);
    document.documentElement.lang = nextLang === "zh" ? "zh-CN" : "en";
  };

  return (
    <aside className="Sidebar">
      <header className="SidebarHeader">
        <div className="SidebarHeader__logo" aria-hidden="true">
          <MapPinned size={22} />
        </div>
        <div>
          <h1>{t("app.productName")}</h1>
          <p>{t("app.tagline")}</p>
        </div>
      </header>

      <nav className="Sidebar__nav" aria-label={t("app.productName")}>
        <SidebarNavGroup title={t("sidebar.viewGroup")}>
          <SidebarNavItem
            active={view === "browse"}
            description={t("sidebar.items.browse.description")}
            icon={<Map size={18} />}
            label={t("sidebar.items.browse.label")}
            onClick={() => handleView("browse")}
          />
          <SidebarNavItem
            active={view === "use-case"}
            description={t("sidebar.items.useCase.description")}
            icon={<Play size={18} />}
            label={t("sidebar.items.useCase.label")}
            onClick={() => handleView("use-case")}
          />
          <SidebarNavItem
            active={view === "manual"}
            description={t("sidebar.items.manual.description")}
            icon={<BookOpen size={18} />}
            label={t("sidebar.items.manual.label")}
            onClick={() => handleView("manual")}
          />
        </SidebarNavGroup>

        <SidebarNavGroup title={t("sidebar.mapCategoryGroup")}>
          <SidebarNavItem
            active={mapCategory === "entity"}
            description={t("sidebar.items.entity.description")}
            icon={<Globe2 size={18} />}
            label={t("sidebar.items.entity.label")}
            onClick={() => handleCategory("entity")}
          />
          <SidebarNavItem
            active={mapCategory === "visualization"}
            description={t("sidebar.items.visualization.description")}
            icon={<Route size={18} />}
            label={t("sidebar.items.visualization.label")}
            onClick={() => handleCategory("visualization")}
          />
        </SidebarNavGroup>

        <SidebarNavGroup title={t("sidebar.languageGroup")}>
          <SidebarNavItem
            active={lang === "zh"}
            description={t("sidebar.items.zh.description")}
            icon={<Languages size={18} />}
            label={t("sidebar.items.zh.label")}
            onClick={() => handleLang("zh")}
          />
          <SidebarNavItem
            active={lang === "en"}
            description={t("sidebar.items.en.description")}
            icon={<Languages size={18} />}
            label={t("sidebar.items.en.label")}
            onClick={() => handleLang("en")}
          />
        </SidebarNavGroup>
      </nav>

      <footer className="SidebarFooter">
        <span>{t("app.version")}</span>
        <a href="mailto:feedback@example.com">{t("app.feedback")}</a>
      </footer>
    </aside>
  );
}
