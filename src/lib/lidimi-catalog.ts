export interface LidimiProduct {
  id: string;
  name: string;
  costML: number;
  costOfficial: number;
  img: string;
  category: 'LINTERNAS' | 'AUDIO' | 'OTROS' | 'SMART TV' | 'CELULARES' | 'NOTEBOOKS' | 'GAMING' | 'HOGAR';
  description: string;
  sourceUrlML: string;
  sourceUrlOfficial: string;
}

export const LIDIMI_CATALOG: LidimiProduct[] = [
  {
    id: "cel-ip16pm",
    name: "Apple iPhone 16 Pro Max 256GB Black Titanium",
    costML: 2450000,
    costOfficial: 2700000,
    img: "https://www.apple.com/newsroom/images/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/article/Apple-iPhone-16-Pro-hero-240909_inline.jpg.large.jpg",
    category: "CELULARES",
    description: "Lo último de Apple con botón de control de cámara y chip A18 Pro.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip16p",
    name: "Apple iPhone 16 Pro 128GB Desert Titanium",
    costML: 1850000,
    costOfficial: 2050000,
    img: "https://www.apple.com/newsroom/images/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/article/Apple-iPhone-16-Pro-finish-lineup-240909_big.jpg.large.jpg",
    category: "CELULARES",
    description: "Titanio de grado aeroespacial y rendimiento Pro.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ss-cel-s24u",
    name: "Samsung Galaxy S24 Ultra 256GB Titanium Black",
    costML: 1950000,
    costOfficial: 2150000,
    img: "https://images.samsung.com/is/image/samsung/assets/es/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-kv.jpg?imbypass=true",
    category: "CELULARES",
    description: "Inteligencia artificial integrada, S-Pen y cámara de 200MP.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip16",
    name: "Apple iPhone 16 128GB Teal",
    costML: 1250000,
    costOfficial: 1400000,
    img: "https://www.apple.com/newsroom/images/2024/09/apple-introduces-iphone-16-and-iphone-16-plus/article/Apple-iPhone-16-finish-lineup-240909_big.jpg.large.jpg",
    category: "CELULARES",
    description: "Cámara Ultra Wide de 48MP y control de acción.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip16plus",
    name: "Apple iPhone 16 Plus 128GB Pink",
    costML: 1450000,
    costOfficial: 1600000,
    img: "https://www.apple.com/newsroom/images/2024/09/apple-introduces-iphone-16-and-iphone-16-plus/article/Apple-iPhone-16-lineup-240909_big.jpg.large.jpg",
    category: "CELULARES",
    description: "Pantalla más grande y batería de larga duración.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ldm-l675a",
    name: "Linterna Tactica Led Lidimi Ld-l675a 60W Zoom",
    costML: 54800,
    costOfficial: 66249,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_788036-MLA106304150570_022026-E.webp",
    category: "LINTERNAS",
    description: "Luz blanca super potente 60Watts con Zoom y Rompevidrios integrado.",
    sourceUrlML: "https://www.mercadolibre.com.ar/linterna-tactica-led-lidimi-ld-l675a-luz-blanca-super-potente-60watts-zoom-rompevidrios/p/MLA47041432",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-L675A"
  },
  {
    id: "ldm-l1409",
    name: "Linterna Táctica Recargable 3000lm Lidimi LD-L1409",
    costML: 49900,
    costOfficial: 51100,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_759264-MLA100940900688_122025-E.webp",
    category: "LINTERNAS",
    description: "Linterna táctica recargable de 3000 lúmenes con carga USB.",
    sourceUrlML: "https://www.mercadolibre.com.ar/linterna-tactica-recargable-3000lm-led-usb-lidimi-ld-l1409-exterior/p/MLA63188404",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-L1409"
  },
  {
    id: "ldm-l461a",
    name: "Linterna Táctica 30w Led 2000m Lidimi LD-L461A",
    costML: 52800,
    costOfficial: 51700,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_848867-MLA84941444778_052025-E.webp",
    category: "LINTERNAS",
    description: "Doble luz Blanca/Roja, alcance de 2000 metros, 30W de potencia.",
    sourceUrlML: "https://www.mercadolibre.com.ar/linterna-tactica-30w-led-2000m-recargable-negro-luz-blancorojo-lidimi-ld-l461a/p/MLA50515362",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-L461A"
  },
  {
    id: "ldm-s854",
    name: "Parlante Portátil Lidimi LD-S854 60W RGB",
    costML: 148500,
    costOfficial: 145700,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_693524-MLA106860219727_022026-E.webp",
    category: "AUDIO",
    description: "Parlante de alta potencia 60W con radio, luces LED y sonido envolvente.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-portatil-lidimi-ld-s854-60w-radio-led-potente-variado/p/MLA65433233",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-S854"
  },
  {
    id: "ldm-s845",
    name: "Parlante Portátil Bluetooth Lidimi LD-S845",
    costML: 104900,
    costOfficial: 99700,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_624654-MLA89161246307_082025-E.webp",
    category: "AUDIO",
    description: "Diseño rugoso Negro/Naranja, ideal para exteriores con gran potencia.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-portatil-bluetooth-lidimi-ld-s845-color-negro-con-naranja/p/MLA53227101",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-S845"
  },
  {
    id: "ldm-s625",
    name: "Parlante Inalámbrico Lidimi LD-S625 20W",
    costML: 62600,
    costOfficial: 0,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_688517-MLA100014297323_122025-E.webp",
    category: "AUDIO",
    description: "Compacto pero potente (20W), con manos libres y conexión estable BT.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-inalambrico-lidimi-ld-s625-20w-negro-bluetooth-manos-libres/p/MLA48479504",
    sourceUrlOfficial: ""
  },
  {
    id: "ldm-s684",
    name: "Parlante Portatil Lidimi D-S684 300W",
    costML: 529600,
    costOfficial: 518700,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_675992-MLA109291895335_032026-E.webp",
    category: "AUDIO",
    description: "Bestia de sonido de 300W con función Powerbank integrada.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-portatil-lidimi-ds684-super-potente-300w-powerbank/up/MLAU3695132434",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-S684"
  },
  {
    id: "ldm-s866",
    name: "Parlante Potente Lidimi LD-S866 80W",
    costML: 163700,
    costOfficial: 177200,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_945354-MLA103345576824_012026-E.webp",
    category: "AUDIO",
    description: "Alta calidad de audio con 80W reales para eventos y fiestas.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-portatil-potente-alta-calidad-lidimi-lds866-80w/up/MLAU3689374811",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-S866"
  },
  {
    id: "ldm-s846",
    name: "Parlante Lidimi Super Potente S846 300W",
    costML: 498900,
    costOfficial: 509700,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_800866-MLA107178049631_022026-E.webp",
    category: "AUDIO",
    description: "Máxima potencia de 300W, ideal para grandes espacios.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-portatil-lidimi-super-potente-s846-300w-powerbank/up/MLAU3704448571",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-S846"
  },
  {
    id: "ldm-s860",
    name: "Parlante Portatil Lidimi LD-S860 Bluetooth",
    costML: 34200,
    costOfficial: 34999,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_702977-MLA109926811073_042026-E.webp",
    category: "AUDIO",
    description: "Excelente relación calidad-precio para uso diario.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-portatil-lidimi-lds860--bluetooth/up/MLAU3683160011",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-S860"
  },
  {
    id: "ldm-s835",
    name: "Parlante Portatil Lidimi LD-S835 Alta Calidad",
    costML: 194000,
    costOfficial: 190000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_992436-MLA102797057399_122025-E.webp",
    category: "AUDIO",
    description: "Audio cristalino y construcción premium de larga duración.",
    sourceUrlML: "https://www.mercadolibre.com.ar/parlante-portatil-lidimi-lds835-potente-alta-calidad/up/MLAU3689207696",
    sourceUrlOfficial: "https://lidimi.com.ar/search/?q=LD-S835"
  },
  {
    id: "oc-tv-ph50",
    name: "Smart TV Philco 50\" UHD 4K Vidaa",
    costML: 489999,
    costOfficial: 520000,
    img: "https://images.fravega.com/f1000/27b1eae90c8e1ff1009e188d2fdcb83b.jpg",
    category: "SMART TV",
    description: "Resolución 4K Ultra HD, sistema Vidaa TV, procesador quad-core.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "oc-tv-tcl43",
    name: "Smart TV TCL 43\" QLED FHD Google TV",
    costML: 419999,
    costOfficial: 450000,
    img: "https://aws-obg-image-lb-2.tcl.com/content/dam/brandsite/product/tv/p/p755/id/8.jpg?t=1702889809457&w=800",
    category: "SMART TV",
    description: "Google TV integrado, tecnología QLED para colores vibrantes.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ap-cel-15pm",
    name: "Apple iPhone 15 Pro Max (256 GB)",
    costML: 1879999,
    costOfficial: 2100000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_692695-MLA71782298710_092023-E.webp",
    category: "CELULARES",
    description: "El primer iPhone con USB-C y acabado de titanio. Legendario.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ap-cel-15",
    name: "Apple iPhone 15 (128 GB)",
    costML: 1499999,
    costOfficial: 1650000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_832104-MLA71783321584_092023-E.webp",
    category: "CELULARES",
    description: "Dynamic Island y cámara de 48MP. Salto generacional en color.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ap-cel-14",
    name: "Apple iPhone 14 (128 GB)",
    costML: 1179999,
    costOfficial: 1300000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_753104-MLA51741513223_092022-E.webp",
    category: "CELULARES",
    description: "Confiable, con detección de choques y SOS satelital. Gran valor.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ap-cel-13",
    name: "Apple iPhone 13 (128 GB)",
    costML: 999999,
    costOfficial: 1150000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_881104-MLA47781743040_102021-E.webp",
    category: "CELULARES",
    description: "Gran salto en batería y rendimiento con chip A15 Bionic.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ap-cel-12",
    name: "Apple iPhone 12 (128 GB)",
    costML: 898000,
    costOfficial: 1050000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_723104-MLA43792036496_102020-E.webp",
    category: "CELULARES",
    description: "El diseño clásico que trajo el 5G y MagSafe. Pantalla OLED.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ss-cel-s24",
    name: "Samsung Galaxy S24 (256 GB)",
    costML: 1278960,
    costOfficial: 1400000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_927161-MLA74246835263_012024-E.webp",
    category: "CELULARES",
    description: "Formato compacto con potencia Galaxy AI. Ideal para una mano.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ss-cel-a55",
    name: "Samsung Galaxy A55 5G (128 GB)",
    costML: 950000,
    costOfficial: 1100000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_603848-MLA75533139369_042024-E.webp",
    category: "CELULARES",
    description: "Pantalla Super AMOLED y diseño premium en metal y vidrio.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ss-cel-a35",
    name: "Samsung Galaxy A35 5G (128 GB)",
    costML: 850000,
    costOfficial: 980000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_609459-MLA75533139367_042024-E.webp",
    category: "CELULARES",
    description: "Equilibrio perfecto para el uso diario con respaldo Samsung.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "mt-cel-e50p",
    name: "Motorola Edge 50 Pro Pantone",
    costML: 949999,
    costOfficial: 1100000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_934967-MLA75836485121_042024-E.webp",
    category: "CELULARES",
    description: "Pantalla validada por Pantone, carga de 125W y diseño exclusivo.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "mt-cel-g84",
    name: "Motorola Moto G84 pOLED",
    costML: 489999,
    costOfficial: 550000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_779357-MLA71627018329_092023-E.webp",
    category: "CELULARES",
    description: "El favorito de la gama media con pantalla pOLED a 120Hz.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "mt-cel-g54",
    name: "Motorola Moto G54 5G",
    costML: 389999,
    costOfficial: 450000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_881357-MLA71627018327_092023-E.webp",
    category: "CELULARES",
    description: "Excelente opción económica con conectividad 5G real.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "oc-gam-ps5",
    name: "Consola PlayStation 5 Digital 1TB",
    costML: 1199999,
    costOfficial: 1399999,
    img: "https://gmedia.playstation.com/is/image/SIEPDC/playstation-5-digital-edition-hero-light-background?fmt=png-alpha&wid=800",
    category: "GAMING",
    description: "La cima del gaming. 1TB SSD, incluye Astrobot y GT7. Versión Digital.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ml-gam-switch",
    name: "Nintendo Switch OLED (Neon Blue/Red)",
    costML: 539999,
    costOfficial: 580000,
    img: "https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/c_scale,w_500/ncom/en_US/switch/site-design-update/overview/switch-hero",
    category: "GAMING",
    description: "Pantalla OLED de 7 pulgadas, colores vibrantes y contraste nítido.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ml-gam-xboxs",
    name: "Xbox Series S 512GB Digital",
    costML: 885099,
    costOfficial: 950000,
    img: "https://assets.xboxservices.com/assets/66/70/6670868f-514e-4f1b-80a5-e01865c36357.png",
    category: "GAMING",
    description: "Rendimiento de nueva generación en la consola más pequeña de Xbox.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ml-gam-xboxx-1tb",
    name: "Microsoft Xbox Series X 1TB SSD (Negro)",
    costML: 1316457,
    costOfficial: 1450000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_809285-MLA96417564024_102025-E.webp",
    category: "GAMING",
    description: "La consola más potente de la historia. 12 teraflops, 4K nativo y hasta 120 FPS.",
    sourceUrlML: "https://listado.mercadolibre.com.ar/xbox-series-x",
    sourceUrlOfficial: ""
  },
  {
    id: "cel-s23fe",
    name: "Samsung Galaxy S23 FE 128GB Graphite",
    costML: 850000,
    costOfficial: 950000,
    img: "https://http2.mlstatic.com/D_Q_NP_803848-MLA72088017363_102023-E.webp",
    category: "CELULARES",
    description: "La potencia de la serie S al mejor precio.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-a15",
    name: "Samsung Galaxy A15 128GB Azul Oasis",
    costML: 380000,
    costOfficial: 420000,
    img: "https://http2.mlstatic.com/D_Q_NP_703848-MLA74088017365_012024-E.webp",
    category: "CELULARES",
    description: "Pantalla Super AMOLED y batería para todo el día.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-a05",
    name: "Samsung Galaxy A05 64GB Silver",
    costML: 250000,
    costOfficial: 280000,
    img: "https://http2.mlstatic.com/D_Q_NP_803848-MLA74088017367_012024-E.webp",
    category: "CELULARES",
    description: "Económico y fiable con gran pantalla de 6.7\".",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-motog24",
    name: "Motorola Moto G24 128GB Pink",
    costML: 320000,
    costOfficial: 360000,
    img: "https://http2.mlstatic.com/D_Q_NP_903848-MLA75533139363_042024-E.webp",
    category: "CELULARES",
    description: "Diseño elegante y sonido Dolby Atmos.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-motog04",
    name: "Motorola Moto G04 64GB Orange",
    costML: 210000,
    costOfficial: 240000,
    img: "https://http2.mlstatic.com/D_Q_NP_103848-MLA75533139365_042024-E.webp",
    category: "CELULARES",
    description: "Sencillo, rápido y con un color increíble.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-xi14u",
    name: "Xiaomi 14 Ultra 512GB Black",
    costML: 2850000,
    costOfficial: 3100000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_635292-MLA75464115167_032024-E.webp",
    category: "CELULARES",
    description: "Cámara Leica de nivel profesional y potencia extrema.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-xi-rn13p",
    name: "Xiaomi Redmi Note 13 Pro 5G 256GB",
    costML: 950000,
    costOfficial: 1050000,
    img: "https://http2.mlstatic.com/D_Q_NP_703848-MLA74088017363_012024-E.webp",
    category: "CELULARES",
    description: "Cámara de 200MP y carga ultra rápida.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-xi-rn13",
    name: "Xiaomi Redmi Note 13 128GB Midnight Black",
    costML: 650000,
    costOfficial: 720000,
    img: "https://http2.mlstatic.com/D_Q_NP_903848-MLA74088017361_012024-E.webp",
    category: "CELULARES",
    description: "El rey de la gama media con pantalla AMOLED 120Hz.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip15p",
    name: "Apple iPhone 15 Pro 128GB Natural Titanium",
    costML: 1650000,
    costOfficial: 1800000,
    img: "https://http2.mlstatic.com/D_Q_NP_692695-MLA71782298710_092023-E.webp",
    category: "CELULARES",
    description: "Titanio aeroespacial y botón de acción.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip11",
    name: "Apple iPhone 11 64GB White",
    costML: 650000,
    costOfficial: 720000,
    img: "https://http2.mlstatic.com/D_Q_NP_881104-MLA47781743040_102021-E.webp",
    category: "CELULARES",
    description: "Un clásico que sigue rindiendo al máximo.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-s21fe",
    name: "Samsung Galaxy S21 FE 128GB Lavender",
    costML: 580000,
    costOfficial: 650000,
    img: "https://http2.mlstatic.com/D_Q_NP_803848-MLA72088017361_102023-E.webp",
    category: "CELULARES",
    description: "Diseño premium y cámaras de nivel profesional.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-a54",
    name: "Samsung Galaxy A54 5G 128GB Lemon",
    costML: 720000,
    costOfficial: 790000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_608236-MLA54923145139_042023-E.webp",
    category: "CELULARES",
    description: "Resistencia al agua y gran pantalla nocturna.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-motog52",
    name: "Motorola Moto G52 128GB Charcoal",
    costML: 280000,
    costOfficial: 310000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_613567-MLA50923145139_072022-E.webp",
    category: "CELULARES",
    description: "Pantalla pOLED y carga TurboPower.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-motoe13",
    name: "Motorola Moto E13 64GB Aurora Green",
    costML: 180000,
    costOfficial: 200000,
    img: "https://http2.mlstatic.com/D_Q_NP_103848-MLA75533139365_042024-E.webp",
    category: "CELULARES",
    description: "Básico, eficiente y con sonido Dolby Atmos.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-xi-13t",
    name: "Xiaomi 13T 256GB Black",
    costML: 1250000,
    costOfficial: 1400000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_813217-MLA72621415139_112023-E.webp",
    category: "CELULARES",
    description: "Cámara Leica y pantalla de 144Hz.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-xi-poco-f6",
    name: "Xiaomi Poco F6 Pro 512GB White",
    costML: 1850000,
    costOfficial: 2050000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_913217-MLA76621415139_052024-E.webp",
    category: "CELULARES",
    description: "Potencia bruta para gaming y carga de 120W.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-xi-poco-x6",
    name: "Xiaomi Poco X6 Pro 256GB Yellow",
    costML: 950000,
    costOfficial: 1050000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_713217-MLA74621415139_022024-E.webp",
    category: "CELULARES",
    description: "El mejor rendimiento en su rango de precio.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip15p-256",
    name: "Apple iPhone 15 Pro 256GB Blue Titanium",
    costML: 1850000,
    costOfficial: 2050000,
    img: "https://http2.mlstatic.com/D_Q_NP_692695-MLA71782298710_092023-E.webp",
    category: "CELULARES",
    description: "Más espacio para tus videos en ProRes.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip14p",
    name: "Apple iPhone 14 Pro 128GB Space Black",
    costML: 1350000,
    costOfficial: 1500000,
    img: "https://http2.mlstatic.com/D_Q_NP_753104-MLA51741513223_092022-E.webp",
    category: "CELULARES",
    description: "Introdujo la Dynamic Island y Always-On display.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-s22u",
    name: "Samsung Galaxy S22 Ultra 256GB Burgundy",
    costML: 980000,
    costOfficial: 1100000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_708236-MLA49923145139_022022-E.webp",
    category: "CELULARES",
    description: "El primer S con S-Pen integrado.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-motoredge40",
    name: "Motorola Edge 40 Neo 256GB Black",
    costML: 650000,
    costOfficial: 720000,
    img: "https://http2.mlstatic.com/D_Q_NP_934967-MLA75836485121_042024-E.webp",
    category: "CELULARES",
    description: "Diseño delgado y protección IP68.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-xi-r12",
    name: "Xiaomi Redmi 12 128GB Sky Blue",
    costML: 350000,
    costOfficial: 390000,
    img: "https://http2.mlstatic.com/D_Q_NP_103848-MLA75533139365_042024-E.webp",
    category: "CELULARES",
    description: "Gran pantalla y diseño de cristal premium.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-ip13m",
    name: "Apple iPhone 13 Mini 128GB Midnight",
    costML: 850000,
    costOfficial: 950000,
    img: "https://http2.mlstatic.com/D_Q_NP_881104-MLA47781743040_102021-E.webp",
    category: "CELULARES",
    description: "Potencia Pro en el tamaño más cómodo.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "cel-s20fe",
    name: "Samsung Galaxy S20 FE 5G 128GB Cloud Navy",
    costML: 450000,
    costOfficial: 510000,
    img: "https://http2.mlstatic.com/D_Q_NP_803848-MLA72088017361_102023-E.webp",
    category: "CELULARES",
    description: "Un clásico eterno con pantalla de 120Hz.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-ip15pl",
      name: "Apple iPhone 15 Plus 128GB Pink",
      costML: 1350000,
      costOfficial: 1500000,
      img: "https://http2.mlstatic.com/D_Q_NP_832104-MLA71783321584_092023-E.webp",
      category: "CELULARES",
      description: "Pantalla grande y batería inmejorable.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-s24u-512",
      name: "Samsung Galaxy S24 Ultra 512GB Titanium Gray",
      costML: 2450000,
      costOfficial: 2700000,
      img: "https://http2.mlstatic.com/D_Q_NP_2X_813456-MLA74088017361_012024-E.webp",
      category: "CELULARES",
      description: "Máximo almacenamiento para tu creatividad con IA.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-motog34",
      name: "Motorola Moto G34 5G 128GB Blue",
      costML: 380000,
      costOfficial: 430000,
      img: "https://http2.mlstatic.com/D_Q_NP_2X_913456-MLA74923145139_022024-E.webp",
      category: "CELULARES",
      description: "Conectividad 5G al alcance de todos.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-xi-14",
      name: "Xiaomi 14 256GB Jade Green",
      costML: 1850000,
      costOfficial: 2050000,
      img: "https://http2.mlstatic.com/D_Q_NP_803848-MLA75533139361_042024-E.webp",
      category: "CELULARES",
      description: "Compacto, potente y con óptica Leica Summilux.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-ip14pl",
      name: "Apple iPhone 14 Plus 128GB Blue",
      costML: 1150000,
      costOfficial: 1300000,
      img: "https://http2.mlstatic.com/D_Q_NP_753104-MLA51741513223_092022-E.webp",
      category: "CELULARES",
      description: "La mejor batería de la generación 14.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-ip16pl",
      name: "Apple iPhone 16 Plus 256GB Pink",
      costML: 2150000,
      costOfficial: 2350000,
      img: "https://http2.mlstatic.com/D_Q_NP_2X_709459-MLA79391036497_092024-E.webp",
      category: "CELULARES",
      description: "Pantalla grande y el nuevo chip A18 para un rendimiento estelar.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-moto-razr50",
      name: "Motorola Razr 50 Ultra 512GB Blue",
      costML: 1450000,
      costOfficial: 1600000,
      img: "https://http2.mlstatic.com/D_Q_NP_934967-MLA75836485121_042024-E.webp",
      category: "CELULARES",
      description: "El icónico plegable con la pantalla externa más grande.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-xi-a3",
      name: "Xiaomi Redmi A3 64GB Black",
      costML: 185000,
      costOfficial: 210000,
      img: "https://http2.mlstatic.com/D_Q_NP_103848-MLA75533139365_042024-E.webp",
      category: "CELULARES",
      description: "Elegancia y eficiencia al alcance de todos.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-ip15-256",
      name: "Apple iPhone 15 256GB Black",
      costML: 1650000,
      costOfficial: 1800000,
      img: "https://http2.mlstatic.com/D_Q_NP_832104-MLA71783321584_092023-E.webp",
      category: "CELULARES",
      description: "Dynamic Island y ahora con más almacenamiento.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-s24fe-128",
      name: "Samsung Galaxy S24 FE 128GB Mint",
      costML: 1150000,
      costOfficial: 1300000,
      img: "https://http2.mlstatic.com/D_Q_NP_803848-MLA72088017363_102023-E.webp",
      category: "CELULARES",
      description: "La experiencia Galaxy AI completa en un color fresco.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-motog85",
      name: "Motorola Moto G85 5G 256GB Gray",
      costML: 580000,
      costOfficial: 650000,
      img: "https://http2.mlstatic.com/D_Q_NP_779357-MLA71627018329_092023-E.webp",
      category: "CELULARES",
      description: "Pantalla curva y diseño premium para la gama media.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-xi-13u",
      name: "Xiaomi 13 Ultra 512GB Olive Green",
      costML: 2150000,
      costOfficial: 2400000,
      img: "https://http2.mlstatic.com/D_Q_NP_803848-MLA75533139361_042024-E.webp",
      category: "CELULARES",
      description: "Un hito en la fotografía móvil con sensores de 1 pulgada.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-ip12-64",
      name: "Apple iPhone 12 64GB Blue",
      costML: 750000,
      costOfficial: 850000,
      img: "https://http2.mlstatic.com/D_Q_NP_723104-MLA43792036496_102020-E.webp",
      category: "CELULARES",
      description: "Un clásico con 5G y diseño atemporal.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
      id: "cel-a25",
      name: "Samsung Galaxy A25 5G 128GB Black",
      costML: 480000,
      costOfficial: 530000,
      img: "https://http2.mlstatic.com/D_Q_NP_2X_913217-MLA74621415139_022024-E.webp",
      category: "CELULARES",
      description: "Pantalla fluida y conectividad 5G accesible.",
      sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ml-mic-sma",
    name: "Microondas Smartlife 20L Manual Negro",
    costML: 169999,
    costOfficial: 185000,
    img: "https://http2.mlstatic.com/D_Q_NP_821115-MLA44030704453_112020-E.webp",
    category: "HOGAR",
    description: "Control manual robusto, ideal para uso intensivo y durabilidad.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ml-mic-att",
    name: "Microondas Atma Matt Black 20L",
    costML: 210000,
    costOfficial: 235000,
    img: "https://http2.mlstatic.com/D_Q_NP_2X_711115-MLA44030704453_112020-E.webp",
    category: "HOGAR",
    description: "Estética Premium en negro mate, panel digital con múltiples funciones.",
    sourceUrlML: "", sourceUrlOfficial: ""
  },
  {
    id: "ldm-nb-l5",
    name: "Notebook Lenovo IdeaPad 15.6\" i5 16GB 512GB",
    costML: 1250000,
    costOfficial: 1350000,
    img: "https://images.fravega.com/f1000/f6256ea2b28257b1b7f37bcc129b5fb6.jpg",
    category: "NOTEBOOKS",
    description: "Rendimiento excepcional para trabajo y estudio con procesador Intel i5 y 16GB de RAM.",
    sourceUrlML: "", sourceUrlOfficial: ""
  }
];
