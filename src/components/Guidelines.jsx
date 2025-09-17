import React from "react";
import { useTranslation } from "react-i18next";
import guideline1 from "../assets/guideline/guideline1.png";
import guideline2 from "../assets/guideline/guideline2.png";
import guideline3 from "../assets/guideline/guideline3.png";
import guideline4 from "../assets/guideline/guideline4.png";

const items = [
    {
        title: "Children Under 2 Years",
        text: "No ticket is needed to access the venue.",
        img: guideline1, //replace the image according to need
    },
    {
        title: "Children Under 12 Years",
        text: "Must be accompanied by an adult. The accompanying adult also needs a ticket.",
        img: guideline2, // replace with your image
    },
    {
        title: "Socks",
        text: "Socks are mandatory throughout the entire venue.",
        img: guideline3,
    },
    {
        title: "Pregnant Women",
        text: "For safety reasons, pregnant individuals are not allowed to access the inflatables.",
        img: guideline4, // replace with your image
    },
];

const Guidelines = () => {
    const { t } = useTranslation();
    
    const items = [
        {
            title: t('guidelines.childrenUnder2'),
            text: t('guidelines.childrenUnder2Text'),
            img: guideline1,
        },
        {
            title: t('guidelines.childrenUnder12'),
            text: t('guidelines.childrenUnder12Text'),
            img: guideline2,
        },
        {
            title: t('guidelines.socks'),
            text: t('guidelines.socksText'),
            img: guideline3,
        },
        {
            title: t('guidelines.pregnantWomen'),
            text: t('guidelines.pregnantWomenText'),
            img: guideline4,
        },
    ];
    
    return (
        <div className="guidelines-container">
            <div className="guideline-card">
                {items.map((item, idx) => (
                    <div className="rules" key={idx}>
                        <img
                            src={item.img}
                            alt={item.title}
                            className="guideline-img"
                        />
                        <div className="label">{item.title}</div>
                        <p className="text">{item.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Guidelines;
