const config = {
        empresa: import.meta.env.VITE_EMPRESA_GLOBAL  || window.env?.VITE_EMPRESA_GLOBAL || 'DEFAULT',
        delegacion: import.meta.env.VITE_DELEGACION_GLOBAL  || window.env?.VITE_DELEGACION_GLOBAL || 'DEFAULT',
        backgroundColor: import.meta.env.VITE_BACKGROUND_COLOR  || window.env?.VITE_BACKGROUND_COLOR || 'DEFAULT',
        backgroundColorOptions: import.meta.env.VITE_BACKGROUND_COLOR_OPTIONS  || window.env?.VITE_BACKGROUND_COLOR_OPTIONS || 'DEFAULT',
        textColor: import.meta.env.VITE_TEXT_COLOR  || window.env?.VITE_TEXT_COLOR || 'DEFAULT',
        textColorVersion: import.meta.env.VITE_TEXT_COLOR_VERSION  || window.env?.VITE_TEXT_COLOR_VERSION || 'DEFAULT',
        textColorDatetime: import.meta.env.VITE_TEXT_COLOR_DATETIME  || window.env?.VITE_TEXT_COLOR_DATETIME || 'DEFAULT',
        versionPrefix: import.meta.env.VITE_TAG_VERSION_PREFIX  || window.env?.VITE_TAG_VERSION_PREFIX || 'DEFAULT',
        versionSuffix: import.meta.env.VITE_TAG_VERSION_SUFFIX  || window.env?.VITE_TAG_VERSION_SUFFIX || 'DEFAULT',
        url: import.meta.env.VITE_HOST_GLOBAL  || window.env?.VITE_HOST_GLOBAL || 'DEFAULT',
        tenantId: import.meta.env.VITE_TENANT_ID  || window.env?.VITE_TENANT_ID || false,
        clientId: import.meta.env.VITE_CLIENT_ID  || window.env?.VITE_CLIENT_ID || false,
        clientSecret: import.meta.env.VITE_CLIENT_SECRET  || window.env?.VITE_CLIENT_SECRET || false,
    };

export default config;
