import { useTranslation } from "react-i18next";

export const Footer = () => {
    const { t } = useTranslation();
    
    return(
        <>
        <footer>
            <div className="footer-text">
                <p>
                Copyright 2025 Mega Jump - {t('footer.allRightsReserved')}
                </p>
            </div>
        </footer>
        </>
    );
}
