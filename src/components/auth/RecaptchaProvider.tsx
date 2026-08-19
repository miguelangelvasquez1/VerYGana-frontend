'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface RecaptchaProviderProps {
    children: React.ReactNode;
}

export default function RecaptchaProvider({
                                              children,
                                          }: RecaptchaProviderProps) {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
        throw new Error(
            'NEXT_PUBLIC_RECAPTCHA_SITE_KEY no está configurada'
        );
    }

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={siteKey}
            scriptProps={{
                async: true,
                defer: true,
                appendTo: 'head',
            }}
        >
            {children}
        </GoogleReCaptchaProvider>
    );
}