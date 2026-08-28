import { CheckCircle2, Download, FileText, PackageCheck, TerminalSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WorkbenchPageHeader } from "../components/WorkbenchPageHeader";

const guideStepKeys = ["read", "choose", "apply"] as const;
const guideSkillKeys = ["mapComponents", "figmaImport", "localPreview"] as const;
const guideResourceKeys = ["componentManual", "useCases", "tokenTable"] as const;

export function GuideScene() {
  const { t } = useTranslation();

  return (
    <section className="GuideScene">
      <WorkbenchPageHeader description={t("guide.description")} title={t("guide.title")} />

      <div className="GuideScene__layout">
        <section className="GuidePanel GuidePanel--primary">
          <div className="GuidePanel__title">
            <FileText size={18} />
            <div>
              <h2>{t("guide.sections.workflow.title")}</h2>
              <p>{t("guide.sections.workflow.description")}</p>
            </div>
          </div>

          <ol className="GuideSteps">
            {guideStepKeys.map((key, index) => (
              <li key={key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{t(`guide.steps.${key}.title`)}</strong>
                  <p>{t(`guide.steps.${key}.description`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="GuidePanel GuideInstall">
          <div className="GuidePanel__title">
            <TerminalSquare size={18} />
            <div>
              <h2>{t("guide.sections.install.title")}</h2>
              <p>{t("guide.sections.install.description")}</p>
            </div>
          </div>

          <div className="GuideCodeBlock">
            <span>{t("guide.install.commandLabel")}</span>
            <code>{t("guide.install.command")}</code>
          </div>

          <ul className="GuideCheckList">
            <li>
              <CheckCircle2 size={16} />
              <span>{t("guide.install.checkSkill")}</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>{t("guide.install.checkLocal")}</span>
            </li>
          </ul>
        </aside>
      </div>

      <section className="GuidePanel">
        <div className="GuidePanel__title">
          <PackageCheck size={18} />
          <div>
            <h2>{t("guide.sections.skills.title")}</h2>
            <p>{t("guide.sections.skills.description")}</p>
          </div>
        </div>

        <div className="GuideSkillGrid">
          {guideSkillKeys.map((key) => (
            <article className="GuideSkillCard" key={key}>
              <div>
                <strong>{t(`guide.skills.${key}.name`)}</strong>
                <p>{t(`guide.skills.${key}.description`)}</p>
              </div>
              <button type="button">
                <Download size={15} />
                {t("guide.skills.download")}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="GuidePanel">
        <div className="GuidePanel__title">
          <FileText size={18} />
          <div>
            <h2>{t("guide.sections.resources.title")}</h2>
            <p>{t("guide.sections.resources.description")}</p>
          </div>
        </div>

        <div className="GuideResourceList">
          {guideResourceKeys.map((key) => (
            <article key={key}>
              <strong>{t(`guide.resources.${key}.title`)}</strong>
              <span>{t(`guide.resources.${key}.description`)}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
