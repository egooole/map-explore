import { useTranslation } from "react-i18next";
import { ComponentCard, ComponentSpec } from "../components/ComponentCard";
import componentSpecs from "../config/componentSpecs.json";

const specs = componentSpecs as unknown as ComponentSpec[];

export function ManualScene() {
  const { t } = useTranslation();

  return (
    <section className="ManualScene">
      <header className="ManualScene__header">
        <h1>{t("manual.title")}</h1>
        <p>{t("manual.intro")}</p>
      </header>
      <div className="ManualScene__grid">
        {specs.map((spec) => (
          <ComponentCard key={spec.id} spec={spec} />
        ))}
      </div>
    </section>
  );
}
