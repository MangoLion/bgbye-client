// modelsInfo.js
const ModelsInfo = {
    bria: { 
        displayName: 'Bria RMBG1.4', 
        shortName: "Bria",
        sourceUrl: 'https://huggingface.co/briaai/RMBG-1.4', 
        apiUrlVar: 'VITE_BRIA_URL'
    },
    rmbg2: { 
        displayName: 'Bria RMBG2.0', 
        shortName: "RMBG2.0",
        sourceUrl: 'https://huggingface.co/briaai/RMBG-2.0', 
        apiUrlVar: 'VITE_RMBG2_URL'
    },
    inspyrenet: { 
        displayName: 'InSPyReNet', 
        shortName: "InSPyRe",
        sourceUrl: 'https://github.com/plemeri/transparent-background/tree/main', 
        apiUrlVar: 'VITE_INSPYRENET_URL'
    },
    u2net: { 
        displayName: 'U2Net', 
        shortName: "U2Net",
        sourceUrl: 'https://github.com/OPHoperHPO/image-background-remove-tool#%EF%B8%8F-how-does-it-work', 
        apiUrlVar: 'VITE_U2NET_URL'
    },
    u2netp: { 
        displayName: 'U2Net-Lite', 
        shortName: "U2Net-S",
        sourceUrl: 'https://github.com/danielgatis/rembg?tab=readme-ov-file#models', 
        apiUrlVar: 'VITE_U2NETP_URL'
    },
    sam: { 
        displayName: 'SAM', 
        shortName: "SAM",
        sourceUrl: 'https://github.com/danielgatis/rembg?tab=readme-ov-file#models', 
        apiUrlVar: 'VITE_SAM_URL'
    },
    silueta: { 
        displayName: 'Silueta', 
        shortName: "Silueta",
        sourceUrl: 'https://github.com/danielgatis/rembg?tab=readme-ov-file#models', 
        apiUrlVar: 'VITE_SILUETA_URL'
    },
    tracer: { 
        displayName: 'Tracer-B7', 
        shortName: "Tracer",
        sourceUrl: 'https://github.com/OPHoperHPO/image-background-remove-tool#%EF%B8%8F-how-does-it-work', 
        apiUrlVar: 'VITE_TRACER_URL'
    },
    basnet: { 
        displayName: 'BASNet', 
        shortName: "BASNet",
        sourceUrl: 'https://github.com/OPHoperHPO/image-background-remove-tool#%EF%B8%8F-how-does-it-work', 
        apiUrlVar: 'VITE_BASNET_URL'
    },
    deeplab: { 
        displayName: 'DeepLabV3', 
        shortName: "DeepLab",
        sourceUrl: 'https://github.com/OPHoperHPO/image-background-remove-tool#%EF%B8%8F-how-does-it-work', 
        apiUrlVar: 'VITE_DEEPLAB_URL'
    },
    u2net_human_seg: { 
        displayName: 'U2Net Human', 
        shortName: "U2Net🧍",
        sourceUrl: 'https://github.com/danielgatis/rembg?tab=readme-ov-file#models', 
        apiUrlVar: 'VITE_U2NET_HUMAN_SEG_URL'
    },
    ormbg: { 
        displayName: 'Open RMBG',
        shortName: "ORMBG",
        sourceUrl: 'https://huggingface.co/schirrmacher/ormbg', 
        apiUrlVar: 'VITE_ORMBG_URL'
    },
    'isnet-general-use': { 
        displayName: 'ISNET-DIS', 
        shortName: "DIS",
        sourceUrl: 'https://github.com/danielgatis/rembg?tab=readme-ov-file#models', 
        apiUrlVar: 'VITE_ISNET_GENERAL_URL'
    },
    'isnet-anime': { 
        displayName: 'ISNET-Anime', 
        shortName: "Anime",
        sourceUrl: 'https://github.com/danielgatis/rembg?tab=readme-ov-file#models', 
        apiUrlVar: 'VITE_ISNET_ANIME_URL'
    },
    'birefnet': { 
        displayName: 'BiRefNet', 
        shortName: "BiRefNet",
        sourceUrl: 'https://github.com/ZhengPeng7/BiRefNet', 
        apiUrlVar: 'VITE_BIREFNET_URL'
    }
};

export default ModelsInfo;
