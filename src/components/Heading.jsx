import { useTranslation } from "react-i18next";
import logo from "../assets/logo.png"; 

export const Heading = () => {
  const { t } = useTranslation();
return(
    <>
    <div className="neon-bg">
    <img src={logo} alt="App Logo"  />

        <p>{t('booking.megaAdventureTagline')}</p>
        <p className="age-alert">{t('booking.ageAlert')}</p>
    </div>

    </>
);

}