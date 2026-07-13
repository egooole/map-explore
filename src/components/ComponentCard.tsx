import { useTranslation } from "react-i18next";

export interface ComponentSpec {
  id: string;
  nameKey: string;
  descriptionKey: string;
  previewType: "bubble" | "marker" | "route";
  tokens: Record<string, string>;
}

interface ComponentCardProps {
  spec: ComponentSpec;
}

function TokenTable({ tokens }: { tokens: Record<string, string> }) {
  const { t } = useTranslation();
  return (
    <table className="TokenTable" aria-label={t("manual.tokens")}>
      <tbody>
        {Object.entries(tokens).map(([key, value]) => (
          <tr key={key}>
            <th scope="row">{key}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ComponentPreview({ type }: { type: ComponentSpec["previewType"] }) {
  return (
    <div className={`ComponentPreview ComponentPreview--${type}`} aria-hidden="true">
      <div className="ComponentPreview__grid" />
      {type === "bubble" ? (
        <div className="ComponentPreview__bubble">
          <span />
          <div>
            <b />
            <i />
          </div>
        </div>
      ) : null}
      {type === "marker" ? <div className="ComponentPreview__marker" /> : null}
      {type === "route" ? <div className="ComponentPreview__route" /> : null}
    </div>
  );
}

export function ComponentCard({ spec }: ComponentCardProps) {
  const { t } = useTranslation();

  return (
    <article className="ComponentCard">
      <div className="ComponentCard__preview">
        <span>{t("manual.preview")}</span>
        <ComponentPreview type={spec.previewType} />
      </div>
      <div className="ComponentCard__body">
        <header>
          <h2>{t(spec.nameKey)}</h2>
          <p>{t(spec.descriptionKey)}</p>
        </header>
        <h3>{t("manual.tokens")}</h3>
        <TokenTable tokens={spec.tokens} />
      </div>
    </article>
  );
}
