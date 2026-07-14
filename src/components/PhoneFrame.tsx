import { BatteryFull, Copy, Signal, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MapCategory, MapTheme, WorkbenchLanguage } from "../store/workbenchStore";
import type { MapControlsState } from "../types";
import { MapCanvas } from "./MapCanvas";

interface PhoneFrameProps {
  mapCategory: MapCategory;
  lang: WorkbenchLanguage;
  mapTheme: MapTheme;
  controls: MapControlsState;
}

function BusinessCard() {
  const { t } = useTranslation();
  return (
    <article className="BusinessCard">
      <header>
        <h2>{t("useCase.deliveredRange")}</h2>
        <p>{t("useCase.status")}</p>
      </header>
      <div className="BusinessCard__tracking">
        <div>
          <strong>{t("useCase.carrier")}</strong>
          <span>{t("useCase.trackingNo")}</span>
        </div>
        <button aria-label={t("useCase.copy")} type="button">
          <Copy size={16} />
        </button>
      </div>
      <footer>
        <div className="BusinessCard__thumbs" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <strong>{t("useCase.goodsCount")}</strong>
      </footer>
    </article>
  );
}

export function PhoneFrame({ mapCategory, lang, mapTheme, controls }: PhoneFrameProps) {
  const { t } = useTranslation();

  return (
    <section className="PhoneFrame">
      <div className="PhoneFrame__status">
        <span>{t("useCase.phoneTime")}</span>
        <div aria-hidden="true">
          <Signal size={14} />
          <Wifi size={14} />
          <BatteryFull size={16} />
        </div>
      </div>
      <div className="PhoneFrame__screen">
        <MapCanvas compact controls={controls} lang={lang} mapCategory={mapCategory} mapTheme={mapTheme} />
        <BusinessCard />
      </div>
    </section>
  );
}
