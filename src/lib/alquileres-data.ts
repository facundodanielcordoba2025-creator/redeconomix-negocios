export interface AlquilerProperty {
  id: string;
  title: string;
  type: 'departamento' | 'casa' | 'ph' | 'local' | 'duplex';
  location: string;
  price: number; // priceDailyUSD for backward compatibility
  priceMonthlyARS: number;
  priceMonthlyUSD: number;
  priceDailyARS: number;
  priceDailyUSD: number;
  bedrooms: number;
  bathrooms: number;
  size: number;
  description: string;
  images: string[];
  amenities: string[];
  status: 'disponible' | 'reservado' | 'ocupado' | 'mantenimiento';
  ownerName: string;
  scoringRequired: number;
  isAmoblada: boolean;
  hasFlexOption: boolean;
  investorPool?: {
    totalRequired: number;
    collected: number;
    investorsCount: number;
    annualYield: number; // e.g. 0.12 (12%)
  };
}

export interface ScoringProfile {
  score: number;
  level: 'Excelente' | 'Muy Bueno' | 'Bueno' | 'Regular' | 'Riesgoso';
  metrics: {
    punctuality: number; // 0-100
    damages: number; // 0-100 (100 is no damages)
    payments: number; // 0-100
    compliance: number; // 0-100
  };
  history: {
    id: string;
    date: string;
    event: string;
    scoreEffect: number;
  }[];
}

export interface InvestorPool {
  id: string;
  propertyTitle: string;
  location: string;
  totalRequired: number;
  collected: number;
  annualYield: number;
  flexPrice: number;
  status: 'activo' | 'completado' | 'buscando';
}

export const MOCK_ALQUILERES_PROPERTIES: AlquilerProperty[] = [
  {
    id: 'prop-1',
    title: 'Departamento de Lujo en Tres Cerritos',
    type: 'departamento',
    location: 'Av. Reyes Católicos 1400, Tres Cerritos, Salta Capital',
    price: 20, // Daily USD
    priceMonthlyARS: 480000,
    priceMonthlyUSD: 480,
    priceDailyARS: 20000, // (480000 * 1.25) / 30
    priceDailyUSD: 20,    // (480 * 1.25) / 30
    bedrooms: 1,
    bathrooms: 1,
    size: 45,
    description: 'Exclusivo departamento amoblado en el corazón de Tres Cerritos. Cuenta con amplio balcón con vista panorámica a los cerros, cochera cubierta y equipamiento premium de alta gama. Seguridad y tranquilidad absoluta en la mejor zona residencial de Salta.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600'
    ],
    amenities: ['WiFi Fibra 300Mb', 'Aire Acondicionado', 'Balcón Panorámico', 'Cochera Cubierta', 'Amoblado de Lujo'],
    status: 'disponible',
    ownerName: 'Clara Domínguez',
    scoringRequired: 75,
    isAmoblada: true,
    hasFlexOption: true,
    investorPool: {
      totalRequired: 45000000,
      collected: 41250000,
      investorsCount: 38,
      annualYield: 14.5
    }
  },
  {
    id: 'prop-2',
    title: 'Casa de Campo con Parque y Piscina en San Lorenzo',
    type: 'casa',
    location: 'Calle Los Ceibos 300, Villa San Lorenzo, Salta',
    price: 35, // Daily USD
    priceMonthlyARS: 840000,
    priceMonthlyUSD: 840,
    priceDailyARS: 35000, // (840000 * 1.25) / 30
    priceDailyUSD: 35,    // (840 * 1.25) / 30
    bedrooms: 3,
    bathrooms: 2,
    size: 175,
    description: 'Hermosa residencia colonial moderna rodeada de naturaleza y yungas salteñas. Gran living comedor con chimenea, quincho techado con asador de primera calidad, parque con piscina climatizada. Ideal para desconectarse y disfrutar de la tranquilidad.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=600'
    ],
    amenities: ['Jardín de 1000m²', 'Piscina Climatizada', 'Quincho con Asador', 'Chimenea a Leña', 'Cochera Doble'],
    status: 'disponible',
    ownerName: 'Marcelo Rossi',
    scoringRequired: 80,
    isAmoblada: true,
    hasFlexOption: true,
    investorPool: {
      totalRequired: 110000000,
      collected: 110000000,
      investorsCount: 92,
      annualYield: 12.8
    }
  },
  {
    id: 'prop-3',
    title: 'PH Colonial Reciclado en el Centro de Salta',
    type: 'ph',
    location: 'Balcarce 800, Microcentro, Salta Capital',
    price: 16, // Daily USD
    priceMonthlyARS: 384000,
    priceMonthlyUSD: 384,
    priceDailyARS: 16000, // (384000 * 1.25) / 30
    priceDailyUSD: 16,    // (384 * 1.25) / 30
    bedrooms: 2,
    bathrooms: 1,
    size: 80,
    description: 'PH histórico restaurado a nuevo conservando sus techos altos con bovedilla, pisos calcáreos originales y carpintería de madera noble. Cuenta con un hermoso patio central con aljibe y plantas aromáticas. Excelente ubicación a pocas cuadras de la plaza principal.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=600'
    ],
    amenities: ['Patio Colonial', 'Pisos Calcáreos', 'WiFi Alta Velocidad', 'Cocina Equipada', 'Apto Mascotas'],
    status: 'disponible',
    ownerName: 'Facundo Córdoba',
    scoringRequired: 70,
    isAmoblada: true,
    hasFlexOption: true
  },
  {
    id: 'prop-4',
    title: 'Local Comercial Estratégico sobre Paseo Güemes',
    type: 'local',
    location: 'Av. Belgrano 200, Paseo Güemes, Salta Capital',
    price: 45, // Daily USD
    priceMonthlyARS: 1080000,
    priceMonthlyUSD: 1080,
    priceDailyARS: 45000, // (1080000 * 1.25) / 30
    priceDailyUSD: 45,    // (1080 * 1.25) / 30
    bedrooms: 0,
    bathrooms: 2,
    size: 115,
    description: 'Imponente local comercial en la zona gastronómica y de paseo más exclusiva de Salta. Gran vidriera de doble altura, planta libre con barra de atención instalada y subsuelo apto para depósito. Totalmente habilitado para cafetería de especialidad, restó-bar o local de indumentaria.',
    images: [
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=600',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600'
    ],
    amenities: ['Vidriera Doble Altura', 'Instalación Comercial', 'Paseo Gastronómico', 'Alarma y Seguridad', 'Planta PB + Subsuelo'],
    status: 'reservado',
    ownerName: 'Grupo FRAMAB S.A.',
    scoringRequired: 85,
    isAmoblada: true,
    hasFlexOption: false,
    investorPool: {
      totalRequired: 180000000,
      collected: 154000000,
      investorsCount: 145,
      annualYield: 16.2
    }
  },
  {
    id: 'prop-5',
    title: 'Duplex Moderno con Vista al Cerro San Bernardo',
    type: 'duplex',
    location: 'Macrocentro, Salta Capital',
    price: 26, // Daily USD
    priceMonthlyARS: 624000,
    priceMonthlyUSD: 624,
    priceDailyARS: 26000, // (624000 * 1.25) / 30
    priceDailyUSD: 26,    // (624 * 1.25) / 30
    bedrooms: 2,
    bathrooms: 2,
    size: 90,
    description: 'Moderno duplex amoblado con excelente iluminación natural. Planta baja con living comedor, cocina integrada y patio interno. Planta alta con dormitorios equipados y balcón terraza con inmejorables vistas directas al cerro San Bernardo y al teleférico.',
    images: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=600',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600'
    ],
    amenities: ['Balcón con Vista al Cerro', 'Patio Privado', 'Asador Propio', 'Complejo de Duplex', 'Estacionamiento'],
    status: 'disponible',
    ownerName: 'Sofía Guevara',
    scoringRequired: 72,
    isAmoblada: true,
    hasFlexOption: true,
    investorPool: {
      totalRequired: 62000000,
      collected: 62000000,
      investorsCount: 51,
      annualYield: 13.9
    }
  },
  {
    id: 'prop-6',
    title: 'Monoambiente Estudiantil en El Huaico',
    type: 'departamento',
    location: 'Barrio El Huaico, Salta Capital',
    price: 13, // Daily USD
    priceMonthlyARS: 312000,
    priceMonthlyUSD: 312,
    priceDailyARS: 13000, // (312000 * 1.25) / 30
    priceDailyUSD: 13,    // (312 * 1.25) / 30
    bedrooms: 1,
    bathrooms: 1,
    size: 35,
    description: 'Práctico y moderno monoambiente ubicado en zona norte, a pocos metros de la Universidad Católica de Salta (UCASAL) y de la Escuela de Música. Ideal para estudiantes y jóvenes profesionales. Equipado con anafe eléctrico, aire acondicionado y balcón.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600'
    ],
    amenities: ['WiFi de Alta Velocidad', 'Cercanía Universidades', 'Aire Acondicionado', 'Balcón al Contrafrente', 'Bajas Expensas'],
    status: 'disponible',
    ownerName: 'Lautaro Gómez',
    scoringRequired: 65,
    isAmoblada: true,
    hasFlexOption: true
  }
];

export const MOCK_USER_SCORING: ScoringProfile = {
  score: 86,
  level: 'Excelente',
  metrics: {
    punctuality: 95,
    damages: 90,
    payments: 98,
    compliance: 95
  },
  history: [
    {
      id: 'sc-1',
      date: '10/05/2026',
      event: 'Pago puntual del alquiler anticipado',
      scoreEffect: 2
    },
    {
      id: 'sc-2',
      date: '15/04/2026',
      event: 'Inspección bimestral sin daños detectados',
      scoreEffect: 3
    },
    {
      id: 'sc-3',
      date: '01/03/2026',
      event: 'Renovación de contrato flexible 15 días antes',
      scoreEffect: 5
    },
    {
      id: 'sc-4',
      date: '12/12/2025',
      event: 'Demora leve de 24 horas en el reporte de pago',
      scoreEffect: -2
    }
  ]
};

export const MOCK_INVESTOR_POOLS: InvestorPool[] = [
  {
    id: 'pool-1',
    propertyTitle: 'Estudio de Lujo Flex en Palermo SoHo',
    location: 'Palermo, CABA',
    totalRequired: 45000000,
    collected: 41250000,
    annualYield: 14.5,
    flexPrice: 380000,
    status: 'buscando'
  },
  {
    id: 'pool-2',
    propertyTitle: 'Casa Familiar con Parque y Pileta',
    location: 'Lomas de Zamora, GBA',
    totalRequired: 110000000,
    collected: 110000000,
    annualYield: 12.8,
    flexPrice: 650000,
    status: 'completado'
  },
  {
    id: 'pool-3',
    propertyTitle: 'Moderno Duplex Cohete con Vista a las Sierras',
    location: 'Luján de Cuyo, Mendoza',
    totalRequired: 62000000,
    collected: 62000000,
    annualYield: 13.9,
    flexPrice: 490000,
    status: 'activo'
  },
  {
    id: 'pool-4',
    propertyTitle: 'Local Comercial de Alta Exposición',
    location: 'Belgrano, CABA',
    totalRequired: 180000000,
    collected: 154000000,
    annualYield: 16.2,
    flexPrice: 950000,
    status: 'buscando'
  }
];

export interface AlquilerBlogArticle {
  id: string;
  title: string;
  description: string;
  image: string;
  tag: string;
  readTime: string;
  content: string;
}

export const ALQUILER_BLOG_ARTICLES: AlquilerBlogArticle[] = [
  {
    id: 'art-1',
    title: 'Calculadora del alquiler: calculá el aumento por IPC o ICL',
    description: '¿Te aumentó el alquiler y no sabés si está bien calculado? Aprendé a verificarlo con el IPC o el ICL, paso a paso',
    image: 'https://http2.mlstatic.com/D_NQ_851994-MLA110424238123_042026-V.jpg',
    tag: 'Calculadora',
    readTime: '4 min de lectura',
    content: `INMUEBLES

CALCULADORA DE ALQUILER

ALQUILER

IPC

ICL

Para calcular un aumento mediante el IPC o el ICL, el procedimiento consiste en dividir el valor del índice de la fecha actual o del mes de vencimiento, por el valor del índice de la fecha de inicio o del último ajuste. El resultado de esa división es un coeficiente que, al multiplicarse por el monto original del

, te va a dar el nuevo valor actualizado.


## ¿Cómo calcular el aumento de alquiler con el IPC o ICL?

Para calcular el nuevo monto, tenés que hacer lo siguiente: 1. Dividí el valor del índice del mes actual por el del mes anterior. El resultado es el coeficiente de ajuste.

2. Multiplicá ese número por el

vigente.

3. El resultado es el nuevo monto de

.

Al aplicar este método, el precio del contrato se mantiene actualizado según la realidad económica vigente.

Por ejemplo, si tomamos un

base ficticio de $300.000 y el coeficiente resultante de la división de los índices es de 1,10, el cálculo será $300.000×1,10. Esto arroja un nuevo monto total de $330.000 para el mes entrante. Este caso muestra un incremento del 10% que se traslada directamente al pago mensual.

Usá siempre las fuentes oficiales del Banco Central o el INDEC para obtener los valores exactos de cada jornada. Al realizar la cuenta, se recomienda conservar el número exacto, incluidos decimales, para asegurar que el resultado final sea preciso.

Persona haciendo cálculos con una maqueta de una casa sobre su escritorio


## ¿Qué es el IPC para calcular el aumento de alquiler?

Para que ese cálculo tenga sentido, conviene entender qué está midiendo el índice que elegiste. Empezamos por el IPC, que hoy es el más usado en los contratos nuevos.

El Índice de Precios al Consumidor (IPC) es un indicador económico que mide la evolución de los precios de los bienes y servicios que consume habitualmente una familia. En el ámbito inmobiliario, se utiliza como la referencia estándar para actualizar el costo de la renta.

Su función es actuar como un mecanismo de ajuste por inflación, permitiendo que el valor del

mantenga su poder adquisitivo real frente al aumento generalizado del costo de vida, evitando así que el monto pactado originalmente quede desactualizado con el paso del tiempo.

Es una herramienta que busca el equilibrio contractual, ya que ofrece un parámetro oficial y transparente que impide incrementos arbitrarios por parte del arrendador, brindando cierta previsibilidad económica tanto al dueño como al inquilino.


## ¿Cuáles son los errores más comunes al calcular el aumento del alquiler?

Ya con el índice claro, el siguiente paso es asegurarse de aplicarlo bien. Estos son los errores que más se repiten al hacer el cálculo. El primero es uno de los más habituales y es equivocarse de fecha. Por ejemplo: si tu contrato se firmó el 15 de enero, el índice que tenés que tomar para el ajuste es el del 15, no el del 1 de ese mes. Parece un detalle menor, pero en momentos de inflación mensual elevada esa diferencia de dos semanas puede significar varios miles de pesos.

Otro error es no distinguir entre el índice mensual y el acumulado. Las calculadoras de

suelen resolver esto automáticamente, pero si lo hacés a mano, asegurate de no estar sumando porcentajes de forma lineal (10% + 10% no es 20%, es 21% por el efecto compuesto).

Recomendación: chequeá siempre que el índice que estás mirando sea el nacional y no uno provincial, a menos que tu contrato especifique lo contrario. El IPC que se usa generalmente para los contratos es el de cobertura nacional que publica el INDEC.

Persona con una calculadora sobre los planos de una propiedad


## ¿Qué cambió para los inquilinos con la derogación de la Ley de Alquileres?

Para entender por qué hoy conviene dominar este cálculo más que nunca, hay que saber qué cambió en las reglas de los contratos. Desde la derogación de la Ley de

a través del DNU 70/2023, el mercado inmobiliario argentino cambió las reglas rotundamente. Ya no existe una única regla de juego para todos; ahora, la libertad contractual permite que las partes elijan cómo y cada cuánto actualizar el precio.

En este contexto, aparecieron dos grandes protagonistas que tenés que conocer al detalle: el ICL (Índice de Contratos de Locación) y el IPC (Índice de Precios al Consumidor). Si bien antes el ICL era el estándar obligatorio para contratos de vivienda, hoy muchos propietarios prefieren volcarse al IPC, que mide directamente la inflación minorista.

Entender la diferencia entre ambos es vital. El ICL es un promedio que combina la inflación y los salarios, mientras que el IPC mide únicamente el aumento de los precios. Cuando los salarios suben más que la inflación, el ICL genera ajustes más altos que el IPC. En el escenario inverso, el IPC refleja mejor la pérdida de poder adquisitivo. Para un inquilino, en períodos de alta inflación con salarios que no la siguen, el ICL puede resultar más conveniente.


## ¿Cada cuánto me pueden aumentar el alquiler?

Saber la frecuencia del ajuste es clave, pero el

es solo una parte de lo que vas a pagar cada mes. Antes, los aumentos eran anuales por ley. Hoy, eso quedó en el pasado. La periodicidad del ajuste se negocia entre inquilino y dueño al momento de firmar.

Lo más común que estamos viendo son ajustes cada tres o cuatro meses. Algunos contratos incluso plantean ajustes bimestrales, aunque suelen ser para casos muy específicos o valores iniciales más bajos.

Es clave que en el contrato quede bien claro si el ajuste es acumulativo o si siempre se toma como base el valor inicial del contrato. En la mayoría de los casos actuales, los ajustes son acumulativos: el aumento de junio se aplica sobre el precio que pagaste en mayo, no sobre el de enero. Esto genera un efecto de “bola de nieve” que hay que seguir de cerca con la calculadora en mano.


## ¿Qué otros gastos se suman todos los meses al alquiler?

Si bien el

suele representar el monto de dinero más significativo, al momento de usar una calculadora y proyectar tus gastos hay otros costos que tenés que incluir:

* Expensas ordinarias y extraordinarias: Tené en cuenta que se pagan todos los meses y no tiene un costo fijos sino que varía mes a mes de acuerdo a los gastos del edificio.
* Servicios públicos: La luz, el gas y el agua están sufriendo quitas de subsidios. Te recomendamos le consultes al propietario cuánto consumió los meses previos y cuál fue el gasto de cada factura.
* Tasas municipales: Dependiendo de la zona, el ABL o tasas similares pueden estar a cargo de una u otra parte. Leé bien el contrato.
Tener este mapeo completo te permite negociar mejor. Si ves que las expensas subieron un 50% en dos meses, quizás tenés un argumento sólido para pedirle al dueño que el ajuste del

no sea tan agresivo en la próxima ventana de actualización.


## ¿Cómo negociar el ajuste del alquiler?

Con ese mapa de gastos en la mano, estás en condiciones de negociar con información real antes de firmar. Si estás alquilando y te toca renovar o estás por firmar un contrato nuevo, la información es tu mejor herramienta. Antes de la reunión, consultá los valores del ICL en el BCRA y del IPC en el INDEC y hacé el cálculo vos mismo con los datos de tu contrato.

Fijate cuánto hubiera aumentado tu alquiler en los últimos 6 meses si hubieras usado ICL frente a IPC. Llevá esos números a la mesa. A veces, los propietarios prefieren un inquilino cumplidor que cuide la propiedad antes que cobrar un 5% más y arriesgarse a tener el

vacío dos meses.

Podés proponer topes de aumento o cláusulas gatillo. Por ejemplo: “Ajustamos por IPC, pero con un techo del 20% trimestral”. En el mercado de hoy, todo es conversable si hay voluntad de ambas partes para llegar a un acuerdo justo.


## ¿Qué documentación tengo que pedir si me aumentan el alquiler?

Calcular bien el aumento es la mitad del trabajo. La otra mitad es dejar constancia de que ese cálculo se aplicó correctamente. Cada vez que el

suba, tenés que exigir documentación que lo respalde.

En el recibo debe figurar claramente que el monto corresponde al mes X, que incluye el ajuste pactado según la cláusula Y del contrato, y debe estar firmado por el locador o su representante legal. Guardar estos comprobantes te sirve como respaldo ante cualquier reclamo futuro.


### Claves para calcular el ajuste de tu contrato de alquiler

Entender cómo se calcula el incremento del

mes a mes es la diferencia entre ser un espectador de tus gastos o un administrador eficiente de tu economía. Ya sea que te rijas por el ICL o el IPC, lo fundamental es la transparencia y el seguimiento constante de los indicadores oficiales.

No dejes que la complejidad de los índices te abrume. Con las herramientas digitales disponibles hoy y un conocimiento sólido de las cláusulas de tu contrato, podés prever los aumentos con total exactitud y evitar sorpresas desagradables al final del mes.

Encontrá una propiedad, calculá cuánto va a salir de

y gestioná el contrato con la tranquilidad de hacer una transacción con conocimiento, transparencia y claridad.`
  },
  {
    id: 'art-2',
    title: 'Contrato de alquiler en Argentina: todo lo que necesitás saber',
    description: 'La Ley 27.737 reformó los contratos de alquiler en Argentina, cambiando derechos y responsabilidades clave.',
    image: 'https://http2.mlstatic.com/D_NQ_629336-MLA81288199384_122024-V.jpg',
    tag: 'Contratos',
    readTime: '6 min de lectura',
    content: `La Ley 27.737 reformó los contratos de alquiler en Argentina, cambiando derechos y responsabilidades clave.

ALQUILER

PROPIEDADES

En este artículo, exploraremos todos los aspectos fundamentales que necesitás conocer sobre los contratos de alquiler en Argentina: desde los fundamentos legales y financieros, hasta los detalles prácticos como las garantías y los ajustes. Nuestro objetivo es proporcionarte una guía completa para que puedas manejar cualquier situación relacionada con el alquiler de una propiedad en el país, ya sea como locador o locatario.


## Fundamentos legales y estructura del contrato de alquiler


### Normativa vigente sobre alquileres en Argentina

El marco legal para los contratos de alquiler en Argentina se encuentra establecido en el Código Civil y Comercial, específicamente en los artículos 1187 al 1223. Además, desde este año, la Ley 27.737 introdujo una serie de modificaciones clave.

En primer lugar, se modificó la duración mínima del contrato. Para inmuebles destinados a vivienda, no hay una duración mínima, como si lo había en la normativa anterior, por lo que se pueden firmar contratos por dos o tres meses.

La segunda modificación importante es acerca de la actualización del valor del alquiler. Los ajustes pueden acordarse con el inquilino, con plazos de tres o seis meses utilizando un índice combinado que considera la inflación (IPC) y el aumento salarial (RIPTE).

Por último, los contratos deben contar con un registro obligatorio ante la ARCA. Todos los contratos deben ser registrados por el locador en la Agencia de Recaudación y Control Aduanero (ARCA).

Estas disposiciones buscan equilibrar la relación entre locadores e inquilinos, ofreciendo mayor previsibilidad para ambas partes. Sin embargo, la normativa también ha generado debate debido a las dificultades que enfrentan los propietarios para calcular ajustes adecuados o recuperar sus propiedades en caso de incumplimiento.


### Estructura y requisitos esenciales del contrato

Un contrato de alquiler debe ser formalizado por escrito, y su contenido debe cumplir con ciertos requisitos básicos:

* Identificación de las partes: el contrato debe incluir los datos completos del locador y el locatario, incluyendo nombres, apellidos, DNI y domicilios legales.
* Objeto del contrato: debe especificarse claramente el inmueble que se alquila, incluyendo su dirección y una descripción detallada.
* Duración: como se mencionó, para viviendas no hay un plazo mínimo obligatorio sino que será acordado entre las partes. En el caso de inmuebles comerciales, el plazo mínimo es de 3 años.
* Monto del alquiler: el contrato debe establecer el monto inicial del alquiler, la periodicidad de los pagos y la moneda en la que se abonará.
* Garantías: es importante detallar el tipo de garantía exigida al locatario, que puede ser un depósito en efectivo, una garantía propietaria, un seguro de caución o incluso un aval bancario.
La formalización escrita no solo es una exigencia legal, sino que también protege los derechos de ambas partes. Ante cualquier conflicto, el contrato sirve como documento probatorio en caso de intervención judicial.


### Importancia de la formalización escrita

Aunque en algunos casos se han celebrado contratos verbales, estos no son recomendables debido a la falta de respaldo legal. Según el artículo 1188 del Código Civil y Comercial, cualquier contrato de alquiler debe estar documentado por escrito, especialmente si tiene una duración superior a tres meses. La ausencia de un contrato escrito puede generar problemas legales y desacuerdos entre las partes.

Además, al registrar el contrato en la ARCA, las partes obtienen beneficios como mayor transparencia en las transacciones y la posibilidad de deducir el alquiler en el caso del inquilino que paga el Impuesto a las Ganancias.


## Condiciones financieras y ajustes


### Cláusulas sobre el pago del alquiler

El pago del alquiler es uno de los elementos centrales de cualquier contrato. Las cláusulas relacionadas con este aspecto deben ser claras y precisas para evitar malos entendidos.

La periodicidad del pago debe quedar establecida en el contrato. El alquiler se abona generalmente de forma mensual.

El contrato debe dejar establecida la moneda de pago. En Argentina, el alquiler suele pactarse en pesos. Sin embargo, en algunos casos, especialmente en propiedades de alto valor, se acuerda en dólares. La normativa establece que el locatario tiene derecho a pagar en pesos al tipo de cambio oficial si así lo desea.

También es importante que el documento incluya el método de pago previamente pactado. Aunque los pagos en efectivo son comunes, cada vez más contratos incorporan transferencias bancarias como método preferido por su practicidad y trazabilidad.


### Ajustes de alquiler: índices y periodicidad

Uno de los cambios más relevantes introducidos por la Ley 27.737 es la obligatoriedad de realizar ajustes anuales utilizando un coeficiente que se obtiene de comparar la menor variación entre el Coeficiente de Variación Salarial (CVS) y el Coeficiente de Estabilización de Referencia (CER). Este cálculo busca evitar los incrementos abruptos y dar previsibilidad al inquilino.

Por ejemplo, si el alquiler inicial es de $50.000 y el ICL semestral indica un aumento del 40%, el nuevo alquiler será de $70.000. Este mecanismo permite una actualización acorde a las variables económicas del país, aunque no siempre es suficiente para cubrir los costos de mantenimiento del inmueble.


### Garantías y depósitos

Otro aspecto fundamental son las garantías y los depósitos, que protegen al locador frente a posibles incumplimientos.

En cuanto al depósito en garantía, la ley estipula que no puede superar el equivalente a un mes de alquiler por cada año de contrato. Al finalizar el contrato, el locador debe devolver este monto actualizado al último valor del alquiler mensual, salvo que existan deudas o daños comprobables en el inmueble.

Por garantía también podemos interpretar el aval que el inquilino ofrece en caso que no se cumpla con los pagos. El método más común sigue siendo la garantía propietaria, donde un tercero solidariamente ofrece una propiedad a su nombre, pero otras opciones como el seguro de caución han ganado popularidad debido a su flexibilidad. Estas alternativas permiten a más personas acceder a un alquiler sin depender de otra persona que intervenga en su lugar.

Las cláusulas relacionadas con las garantías y depósitos deben estar claramente especificadas en el contrato, evitando ambigüedades que puedan generar conflictos futuros.


## Obligaciones y derechos de las partes


### Responsabilidades del locador y locatario

En un contrato de alquiler, tanto el locador como el locatario tienen derechos y obligaciones que deben cumplir para garantizar una relación contractual saludable. La normativa establece lo siguiente:

Es obligación del locador entregar el inmueble en condiciones adecuadas, garantizando que el inmueble sea habitable o apto para el uso convenido al momento de la entrega.

El mantenimiento estructural del inmueble (como problemas de plomería, electricidad o filtraciones) es responsabilidad del locador, salvo que el daño sea ocasionado por el inquilino. Responder por reparaciones mayores que no se desprendan del uso cotidiano es obligación del propietario.

Una vez entregado el inmueble, el locador debe respetar la privacidad del locatario. No se puede ingresar a la vivienda sin el consentimiento del inquilino, salvo situaciones de emergencia.

Por otra parte, es obligación del locatario pagar el alquiler en tiempo y forma. Es fundamental que el inquilino cumpla con el pago según lo establecido en el contrato.

También conservar el inmueble en buen estado. El inquilino debe mantener el inmueble limpio y realizar reparaciones menores derivadas del uso normal como cambios de luces o ajustes de griferías. Ante cualquier problema grave en el inmueble, el locatario debe avisar de daños o problemas al locador para que este pueda resolverlo.

En resumen, el locador tiene derecho a recibir el pago del alquiler según el contrato, exigir el cumplimiento de las normas pactadas y recuperar el inmueble al finalizar el contrato. Mientras que los derechos del locatario incluyen disfrutar del inmueble sin interferencias, exigir reparaciones necesarias y rescindir el contrato bajo ciertas condiciones.


### Modificación y rescisión del contrato

Si alguna de las partes desea modificar el contrato, esto debe hacerse por escrito y con el acuerdo mutuo. En cuanto a la rescisión anticipada, el locatario tiene el derecho de finalizar el contrato después de cumplir seis meses de alquiler, siempre que notifique con al menos un mes de antelación. Dependiendo del momento de la rescisión, podría aplicarse una indemnización de un mes y medio de alquiler si la rescisión ocurre antes del primer año y un mes de alquiler si sucede después del primer año.


### Condiciones de desalojo

La Ley 27.737 de alquileres en Argentina establece que el locador puede iniciar un desalojo si el inquilino no devuelve el inmueble después de que se cumpla el plazo de intimación de pago o finalice el contrato. El locador es responsable de los gastos y costas de la acción judicial.

En caso que se proceda a la devolución del inmueble, el locador no puede negarse a recibir las llaves del inmueble ni condicionar su entrega. Si lo hace, el inquilino puede consignarlas judicialmente ante el juez. Si el inquilino consigna las llaves dentro de los 10 días hábiles posteriores a la notificación al locador, no debe pagar el alquiler de esos días.


## Registro, impuestos y procedimientos adicionales


### Registro obligatorio de contratos de alquiler ante la ARCA

Como mencionamos, los contratos de alquiler deben ser registrados ante la Agencia de Recaudación y Control Aduanero (ARCA). Esta medida tiene como objetivo aumentar la transparencia en el mercado y garantizar el cumplimiento de las obligaciones fiscales. Tanto el locador como el locatario pueden realizar el registro, aunque la responsabilidad primaria recae en el locador. El procedimiento se realiza de manera digital a través de la página oficial de la ARCA (ex AFIP).


### Implicancias fiscales para las partes

Para el locador:

* El monto percibido por el alquiler puede estar sujeto al Impuesto a las Ganancias, dependiendo del régimen fiscal al que esté inscripto.
* Si el locador es propietario de más de una propiedad, también podría estar alcanzado por el Impuesto a los Bienes Personales.
Para el locatario:

* En ciertos casos, el inquilino puede deducir un porcentaje del monto del alquiler del Impuesto a las Ganancias, siempre que se trate de su vivienda única y que el contrato esté registrado.

### Procedimientos en caso de incumplimientos

Cuando surgen conflictos entre locador y locatario, las opciones incluyen:

* Mediación: en muchas provincias, se promueve la mediación como una alternativa rápida y económica para resolver disputas.
* Intervención judicial: en casos graves, como incumplimientos reiterados o desalojo, es necesario acudir a la justicia. Este proceso puede ser largo y costoso, por lo que se recomienda agotar las vías conciliatorias antes de llegar a esta instancia.

## Conclusión

Entender los contratos de alquiler en Argentina bajo la normativa vigente es fundamental para evitar malentendidos y proteger los derechos tanto de inquilinos como de propietarios. Desde los fundamentos legales hasta los detalles financieros y fiscales, este artículo ha cubierto los aspectos más relevantes para ayudarte a negociar y firmar un contrato de alquiler con confianza.

Como recomendación final, es ideal contar con el asesoramiento de un abogado o profesional inmobiliario antes de firmar cualquier contrato. Además, asegúrate de leer y comprender cada cláusula para evitar sorpresas a futuro.


## Preguntas frecuentes


### ¿Cómo son los nuevos contratos de alquiler en 2024?

Los contratos siguen regidos por la Ley de Alquileres 27.737 y DNU modificatorio, que no establece una duración mínima, ajustes anuales y registro obligatorio en la ARCA. Se espera que continúen las discusiones legislativas para ajustar ciertos aspectos de la normativa.


### ¿Qué tener en cuenta al firmar un contrato de alquiler?

Verificá que todos los términos estén claramente establecidos, incluyendo el monto del alquiler, los ajustes, las garantías y las responsabilidades de cada parte. Además, asegurate de que el contrato esté registrado ante la ARCA.


### ¿Qué cosas debe tener un contrato de alquiler?

Un contrato debe incluir la identificación de las partes, descripción del inmueble, duración, monto del alquiler, método de pago, cláusulas de ajuste y las garantías. También debe estar firmado por ambas partes.


### ¿Qué revisar en un contrato de alquiler?

Antes de firmar, revisa que no haya cláusulas abusivas, que la descripción del inmueble sea precisa y que los términos financieros sean claros. También es importante confirmar que el contrato esté en conformidad con la normativa vigente.`
  },
  {
    id: 'art-3',
    title: 'Decreto 70/2023 DNU: la desregulación de alquileres en el Boletín Oficial',
    description: 'El DNU 70/2023, publicado el 21 de diciembre de 2023, derogó la Ley de Alquileres e instauró la absoluta libertad de contratación en pesos o dólares.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200',
    tag: 'Boletín Oficial',
    readTime: '6 min de lectura',
    content: `El DNU 70/2023, publicado en el Boletín Oficial el 21 de diciembre de 2023 (y en vigencia desde el 29 de diciembre de 2023), introdujo modificaciones fundamentales y un giro histórico de desregulación en el régimen de alquileres en la República Argentina.

Este aviso oficial establece las bases de la desregulación económica para el mercado de viviendas e inmuebles comerciales bajo la órbita de la absoluta libertad de contratación entre las partes.

Para acceder al documento original completo, podés consultar el aviso oficial en el siguiente enlace:
[Boletín Oficial de la República Argentina - Aviso 301122/20231221](https://www.boletinoficial.gob.ar/detalleAviso/primera/301122/20231221)


## Decreto 70/2023: Puntos claves sobre los contratos de alquiler

A continuación se detallan los artículos principales que modificaron el Código Civil y Comercial de la Nación y derogaron las normativas previas (Leyes N.º 27.551 y N.º 27.737):


### 1. Derogación de la Ley de Alquileres (Artículo 249)

El DNU derogó en su totalidad la anterior Ley de Alquileres. Esto significa que dejaron de regir las restricciones estatales impuestas para los contratos, tales como los índices obligatorios de indexación anual o semestral, la imposibilidad de acordar aumentos libres y las trabas para definir plazos específicos de alquiler.


### 2. Modificación de las obligaciones de dar dinero (Artículo 250)

Se modificó el artículo 765 del Código Civil y Comercial de la Nación, estableciendo un cambio sustancial en la moneda de pago:
* **Cumplimiento estricto en la moneda pactada:** Si el contrato de alquiler se firma en una moneda determinada (sea de curso legal en pesos, o moneda extranjera como dólares estadounidenses o euros), el inquilino debe abonar exactamente en esa moneda pactada.
* **Prohibición de pesificación forzosa:** El inquilino no tiene derecho a exigir el pago del equivalente en pesos al tipo de cambio oficial, sino que está obligado a entregar la moneda especificada.
* **Límite de intervención judicial:** Los jueces no pueden modificar la moneda ni la forma de pago establecida voluntariamente en el contrato de alquiler.


### 3. Libertad absoluta de plazos (Artículo 251)

Se derogaron los plazos mínimos legales de contratación que limitaban a los contratos a un mínimo de tres años:
* **Acuerdo libre entre las partes:** El propietario y el inquilino pueden pactar libremente el plazo que deseen (por ejemplo, 1 mes, 6 meses, 1 año, 2 años, etc.).
* **Plazos supletorios de la ley:** En caso de que no se estipule ningún plazo en el contrato de alquiler escrito, la ley establece de forma supletoria los siguientes plazos de referencia:
  * **Destino de vivienda permanente:** 2 años.
  * **Destino comercial o industrial:** 3 años.
  * **Otros destinos (turístico u oficina):** El plazo convenido por las partes.


### 4. Flexibilidad en las actualizaciones e índices (Artículo 252)

Se habilitó a las partes a pactar con total libertad el mecanismo de indexación que mejor se adapte a sus necesidades mutuas:
* **Elección libre de índices:** Se puede acordar el uso de cualquier índice público o privado, como el **IPC (Índice de Precios al Consumidor)**, el **ICL (Índice para Contratos de Locación)**, el **CER**, el **UVA**, o incluso precios de referencia de bienes o commodities.
* **Periodicidad de los ajustes:** Las partes pueden pactar la frecuencia de los aumentos (mensuales, bimestrales, trimestrales, semestrales, etc.), con la única limitación de que el período no sea inferior a un mes.


### 5. Depósitos y Garantías flexibles

Ya no existen límites regulatorios que topen el depósito en garantía a un solo mes de alquiler ni exigencias cerradas sobre el tipo de fianza aceptada. El monto del depósito, su moneda de constitución (pesos o dólares) y las condiciones de su restitución al finalizar la locación se definen íntegramente por libre voluntad de las partes contratantes.


### 6. Contratos previos y vigencia temporal

Es sumamente importante destacar que todas las disposiciones del Decreto 70/2023 aplican de forma exclusiva a los contratos celebrados a partir de su vigencia (29 de diciembre de 2023). Cualquier contrato de alquiler que haya sido firmado con anterioridad a esa fecha se rige de manera ultra-activa por la legislación que estaba vigente al momento de su celebración (sea la Ley 27.551 o la Ley 27.737) hasta la fecha de finalización o rescisión formal de ese contrato de origen.

Este marco promueve un dinamismo renovado en el mercado inmobiliario, multiplicando la oferta disponible de inmuebles y permitiendo a propietarios e inquilinos diseñar contratos a la medida de sus capacidades y requerimientos individuales.

Para constatar y relevar el texto completo del decreto emitido por el Poder Ejecutivo, visitá el registro público oficial del Boletín Oficial en:
[https://www.boletinoficial.gob.ar/detalleAviso/primera/301122/20231221](https://www.boletinoficial.gob.ar/detalleAviso/primera/301122/20231221)`
  },
  {
    id: 'art-5',
    title: 'Requisitos para alquilar una propiedad en Argentina',
    description: 'La Ley de Alquileres N.º 27.737 establece ajustes semestrales y condiciones para contratos desde 2024.',
    image: 'https://http2.mlstatic.com/D_NQ_798570-MLA80788901316_112024-V.jpg',
    tag: 'Requisitos',
    readTime: '5 min de lectura',
    content: `La Ley de Alquileres N.º 27.737 establece ajustes semestrales y condiciones para contratos desde 2024.

ALQUILER

PROPIEDADES

En los últimos años, el mercado de alquileres en Argentina ha experimentado importantes transformaciones debido a la implementación de la Ley de Alquileres N.º 27.737, promulgada en 2023. Este marco normativo establece ajustes semestrales, sin duración mínima de contratos para aquellos firmados a partir de 2024. Las constantes fluctuaciones económicas, como la inflación y la dolarización de algunos contratos, han hecho que el panorama para los inquilinos sea complejo.

Entender los requisitos es fundamental para evitar malentendidos, garantizar el cumplimiento de los derechos y obligaciones y proteger la inversión, tanto para quien alquila como para quien ofrece una propiedad en alquiler. En este artículo abordaremos en detalle los elementos que deben cumplir tanto inquilinos como propietarios para garantizar una relación contractual segura y transparente.


## Requisitos básicos: todo lo que debe cumplir un inquilino


### 1. Requisitos personales

El primer paso para alquilar una propiedad es demostrar la capacidad legal para firmar el contrato y cumplir con sus términos. Esto incluye ser mayor de edad, solo los mayores de 18 años pueden asumir las responsabilidades legales de un alquiler. Además, se debe presentar un DNI o pasaporte vigente. Para los ciudadanos argentinos, el Documento Nacional de Identidad es obligatorio. Los extranjeros deben presentar su pasaporte o documentación equivalente.


### 2. Demostración de ingresos

Los propietarios buscan asegurar que el inquilino tenga los recursos necesarios para cubrir el alquiler mensual. Por ello, se solicita presentar recibos de ingresos, en el caso de trabajadores en relación de dependencia o constancias de ingresos independientes, los profesionales autónomos deben presentar declaraciones juradas de ganancias o comprobantes de facturación.


### 3. Garantías: el respaldo clave del contrato

Las garantías son fundamentales para proteger a los propietarios ante posibles incumplimientos. Entre las opciones más comunes se encuentran:

* Garantía propietaria: respaldada por una propiedad inmueble que actúa como aval. Generalmente debe estar en la misma jurisdicción que el alquiler.
* Seguro de caución: una alternativa moderna que permite a los inquilinos prescindir de una propiedad de respaldo, pagando una prima anual a una aseguradora.
* Aval bancario: aunque menos común, esta opción es utilizada en alquileres de mayor valor o contratos comerciales.

### 4. Depósito de garantía y costos iniciales

El depósito de garantía es obligatorio y suele equivaler a uno o dos meses de alquiler. Este monto cubre posibles daños o deudas al finalizar el contrato. Además, al momento de firmar se deben considerar otros costos como el pago del primer mes, generalmente requerido al inicio, y los honorarios inmobiliarios que en algunas provincias son asumidos por los inquilinos; en otras, como CABA, los cubren los propietarios.


## Duración y regulación del contrato


### Ley de alquileres: pilares fundamentales

La Ley de Alquileres establece normas claras para contratos residenciales.

En cuanto a la duración mínima del contrato, el DNU 70/2023 determinó que los contratos de alquiler no deben tener un plazo mínimo de duración.

Los contratos de alquiler determinan ajustes trimestrales con el Índice para Contratos de Locación (ICL), que combina la inflación (IPC) y los salarios (RIPTE).

Además, se determina que todos los contratos deben estar registrados obligatoriamente a través de la inscripción en la ARCA, lo que permite a los inquilinos deducir el 40% del alquiler en el Impuesto a las Ganancias.


## Requisitos para alquilar una propiedad en Argentina


### Obligaciones de propietarios e inquilinos

El Código Civil y Comercial regula los derechos y responsabilidades de ambas partes:

* Propietarios: Entregar la propiedad en condiciones aptas para ser habitada. Realizar reparaciones necesarias por desgaste natural o problemas estructurales.
* Entregar la propiedad en condiciones aptas para ser habitada.
* Realizar reparaciones necesarias por desgaste natural o problemas estructurales.
* Inquilinos: Abonar el alquiler en tiempo y forma. Mantener la propiedad en buen estado, y devolverla tal como fue entregada.
* Abonar el alquiler en tiempo y forma.
* Mantener la propiedad en buen estado, y devolverla tal como fue entregada.

### Renovación y finalización del contrato

Para finalizar un contrato de manera anticipada, el inquilino debe informar al propietario con al menos 30 días de anticipación, según establece la Ley de Alquileres. En casos de rescisión anticipada, pueden aplicarse penalidades según lo estipulado en el contrato.

Si ambas partes están de acuerdo, el contrato puede renovarse. Esto implica un nuevo acuerdo sobre el alquiler, respetando las normativas legales vigentes.


### Recomendaciones clave para el inquilino

Antes de firmar, es fundamental realizar una revisión del contrato y comprender todas las cláusulas, incluyendo las relacionadas con el pago, ajustes y responsabilidades.

También recomendamos documentar el estado de la propiedad, realizando un inventario inicial detallado, con fotografías, puede evitar conflictos al final del contrato.

Si tienes dudas, consultar a un abogado profesional puede asesorarte sobre tus derechos y obligaciones.

Por último, siempre es aconsejable mantener un historial de pagos. Esto será útil en caso de necesitar referencias futuras.


### Legalidades y contratos: marco normativo y buenas prácticas

El contrato de alquiler es el documento que formaliza la relación entre propietario e inquilino. En Argentina, está regulado principalmente por el Código Civil y Comercial y por la Ley de Alquileres N.º 27.737. Cumplir con los aspectos legales asegura que ambas partes tengan claridad sobre sus derechos y obligaciones.

La normativa actual establece ciertos parámetros que deben respetarse en cualquier contrato de alquiler residencial. La duración del contrato, las condiciones de pago donde las partes deben acordar un único monto mensual y el plazo para abonar, y la modalidad de ajuste que se acuerde entre las partes.

En el caso de contratos comerciales, las condiciones pueden variar. Por ejemplo, la duración mínima tampoco está regulada pero se permite mayor flexibilidad en los ajustes del alquiler.


### Registro de contratos y beneficios fiscales

Con la normativa actual, los contratos de alquiler deben ser registrados obligatoriamente ante la ARCA (Agencia de Recaudación y Control Aduanero). Este registro otorga beneficios tanto a inquilinos como a propietarios:

Para los inquilinos, el registro otorga la posibilidad de deducir hasta el 40% del alquiler en el Impuesto a las Ganancias, lo que representa un ahorro significativo para quienes están en relación de dependencia.

Para los propietarios, por su parte, permite legalizar la regularización de los ingresos obtenidos, evitando posibles sanciones por omisión de información fiscal.

El registro debe realizarse dentro de los 15 días hábiles posteriores a la firma del contrato. Es un trámite sencillo que puede realizarse a través del sitio web de la ARCA.


## Proceso de finalización y renovación del contrato


### Finalización anticipada del contrato

La ley permite al inquilino rescindir el contrato antes de su vencimiento, siempre que se respete la notificación previa, informando al propietario con al menos 30 días de anticipación.

Y establece la normativa de la indemnización. Si el contrato tiene menos de seis meses, el propietario puede exigir una penalidad equivalente a 1.5 meses de alquiler. Si han pasado más de seis meses, la penalidad se reduce a 1 mes de alquiler.

En casos de incumplimiento por parte del propietario (como falta de mantenimiento esencial o violaciones al contrato), el inquilino puede rescindir sin penalidad, previa consulta legal.


### Renovación del contrato

La renovación de un contrato implica negociar nuevos términos, especialmente el monto del alquiler. Aunque la Ley de Alquileres no obliga a las partes a renovar bajo las mismas condiciones, en la práctica es común que inquilinos y propietarios mantengan la relación si no existen inconvenientes previos.

Se recomienda iniciar las negociaciones al menos 60 días antes del vencimiento del contrato para evitar períodos de incertidumbre.


## Consideraciones finales y recomendaciones


### Qué verificar antes de firmar

Antes de comprometerse con un alquiler, los inquilinos deben tomar ciertas precauciones para protegerse de futuros inconvenientes.

En primer lugar, es fundamental revisar la documentación del propietario. Asegúrate de que la persona que alquila sea el titular o cuente con un poder notarial válido.

Leer el contrato detenidamente permite identificar posibles cláusulas abusivas, como penalidades desproporcionadas o restricciones no justificadas.

Como mencionamos anteriormente, verificar el estado de la propiedad, preferiblemente con el propietario o responsable de la inmobiliaria presente, para documentar cualquier desperfecto previo.

Una vez firmado el contrato, es importante guardar recibos y comprobantes de pago. Desde los pagos iniciales hasta los mensuales, conservar toda la documentación es clave para evitar conflictos.

Volvemos a recomendarte consultar a un abogado o escribano si tienes dudas legales.


### La importancia de la inspección y el inventario

A lo largo de este artículo recomendamos en varias oportunidades hacer una inspección previa, acompañada de un inventario detallado, para evitar conflictos al finalizar el contrato. Aquí algunos aspectos clave:

* Condiciones de muebles y electrodomésticos: si la propiedad se alquila amoblada, verifica el estado y funcionamiento de cada elemento.
* Estado de paredes, techos y pisos: documentar manchas, grietas o cualquier otro daño existente protegerá a ambas partes.
* Registro fotográfico o en video: complementar el inventario con imágenes proporciona evidencia irrefutable en caso de disputas.

### Recursos adicionales y asesoramiento

En Argentina, existen diversas instituciones y organismos que ofrecen recursos y asesoramiento sobre alquileres

La ARCA te puede facilitar información sobre el registro de contratos y beneficios fiscales.

La defensoría del inquilino, por su parte, brinda apoyo gratuito en conflictos relacionados con alquileres. Deberás consultar de acuerdo a tu jurisdicción cuáles son los organismos locales.

Finalmente, es importante que tengas presente que tanto el colegio de escribanos como las inmobiliarias pueden facilitar el proceso contractual y garantizar su legalidad.


## Conclusión

El alquiler de una propiedad en Argentina puede ser un proceso desafiante, pero contar con la información adecuada facilita enormemente la experiencia para ambas partes. Conocer los requisitos legales, cumplir con la documentación necesaria y entender los derechos y obligaciones de inquilinos y propietarios no solo permite prevenir conflictos, sino también establecer una relación contractual sólida y transparente.

El contexto del mercado inmobiliario actual, sumado a las disposiciones de la Ley de Alquileres, otorga a los inquilinos mayor estabilidad, mientras que los propietarios también cuentan con herramientas legales para proteger sus intereses. Sin embargo, este equilibrio sólo es posible si ambas partes se informan correctamente y cumplen con las normativas vigentes.

En resumen, tanto los propietarios como los inquilinos tienen un papel clave en mantener la integridad del mercado de alquileres en Argentina. Este artículo busca ser una guía práctica para ayudar a todos los involucrados a navegar con éxito este aspecto crucial del mercado inmobiliario.


## Preguntas frecuentes


### 1. ¿Qué documentación necesito para alquilar?

Para alquilar una propiedad en Argentina, necesitarás:

* DNI o pasaporte vigente: esto acredita tu identidad como inquilino.
* Comprobantes de ingresos: recibos de sueldo, certificación de ingresos o declaraciones juradas que demuestren tu solvencia económica.
* Garantía aceptada: puede ser una garantía propietaria, un seguro de caución, un aval bancario o una garantía personal, según lo que acuerdes con el propietario.
* Depósito de garantía: generalmente equivale a un mes de alquiler, aunque puede variar según las condiciones del contrato.
Es importante verificar qué requisitos específicos solicita cada propietario o inmobiliaria, ya que pueden variar ligeramente.


### 2. ¿Qué se le pide a un inquilino para alquilar?

Además de la documentación básica, los inquilinos deben cumplir con ciertas condiciones:

* Mayoría de edad: sólo personas mayores de 18 años pueden firmar contratos.
* Capacidad de pago comprobada: asegurarte de que tus ingresos sean suficientes para cubrir el monto del alquiler y los gastos asociados.
* Cumplimiento de las condiciones del contrato: esto incluye el pago puntual del alquiler y el mantenimiento de la propiedad en buen estado.

### 3. ¿Qué requisitos necesito para hacer un contrato de alquiler?

Los requisitos esenciales para formalizar un contrato son:

* Un contrato escrito que detalle los términos y condiciones del alquiler.
* El registro del contrato ante la AFIP, obligatorio desde el año 2021.
* Documentación de ambas partes (DNI del inquilino y propietario).
* Especificación de las garantías y depósitos acordados.
Asegúrate de que el contrato esté redactado de manera clara y que cumpla con la normativa vigente para evitar problemas legales.


### 4. ¿Qué se necesita para un contrato de alquiler?

Un contrato de alquiler debe incluir los siguientes puntos clave:

* Identificación de las partes: datos completos del propietario e inquilino.
* Descripción de la propiedad: ubicación, características y condiciones actuales del inmueble.
* Duración del contrato: según la ley, debe ser de un mínimo de tres años para propiedades residenciales.
* Monto del alquiler y forma de pago: detalle del importe mensual y los ajustes anuales.
* Garantías y depósitos: especificación del tipo de garantía y condiciones de devolución del depósito.
* Derechos y obligaciones: deberes de ambas partes según el Código Civil y Comercial.
Un contrato bien estructurado protege tanto al inquilino como al propietario y es la base para una relación contractual exitosa.`
  },
  {
    id: 'art-8',
    title: 'Todo sobre los contratos de alquiler en Argentina: guía completa y actualizada',
    description: 'Los contratos de alquiler en Argentina regulan derechos y obligaciones, adaptándose a un mercado competitivo.',
    image: 'https://http2.mlstatic.com/D_NQ_603411-MLA80028059138_102024-V.jpg',
    tag: 'Contratos',
    readTime: '7 min de lectura',
    content: `Los contratos de alquiler en Argentina regulan derechos y obligaciones, adaptándose a un mercado competitivo.

ALQUILER

PROPIEDADES


## Encuentra tu alquiler

Por lo tanto, a fin de explicar con más profundidad este tema tan complejo, a continuación, vamos a brindarte toda la información relevante al respecto de los alquileres. Este artículo busca ser una guía exhaustiva para comprender todos los aspectos legales y prácticos relacionados con el alquiler, así como los impactos de estos cambios sociales y económicos en las ciudades principales.


## Definición y naturaleza del contrato de alquiler

El contrato de alquiler es un acuerdo legal mediante el cual una persona (inquilino) adquiere el derecho de uso de un inmueble de propiedad de otra persona (propietario) a cambio de una renta mensual. Esta figura está regulada por el Código Civil y Comercial de Argentina, que establece los lineamientos generales que deben seguirse en cualquier acuerdo de locación.

Es importante hacer la distinción entre un contrato de alquiler convencional, que suele tener una duración mínima de 1 año (antes eran 3 años con la ley de alquileres), y un alquiler temporario, que puede durar desde algunos días hasta seis meses. Este último es muy común en el ámbito turístico, sobre todo en ciudades como Buenos Aires, donde se ha experimentado un aumento en los alquileres temporarios debido a la gentrificación, lo que ha provocado una disminución de la oferta de alquileres de largo plazo para residentes.


## Componentes clave de un contrato de alquiler

Un contrato de alquiler debe incluir varios elementos esenciales para asegurar que ambas partes estén protegidas legalmente y que sus derechos y obligaciones estén claramente definidos. Los componentes más importantes son:

* Identificación de las partes: debe especificarse quién es el propietario y quién es el inquilino, incluyendo detalles personales y datos de contacto de ambos.
* Descripción del inmueble: es fundamental que el contrato detalle el inmueble objeto de alquiler, incluyendo su ubicación exacta, características y, si corresponde, el inventario de bienes muebles en caso de alquileres amoblados.
* Duración del contrato: la ley argentina establece que los contratos de alquiler de vivienda deben tener una duración mínima de 1 año, aunque hay excepciones para alquileres comerciales o temporales.
* Monto del alquiler y forma de pago: el contrato debe especificar el importe mensual que el inquilino deberá abonar y la forma en que se realizará dicho pago (transferencia bancaria, efectivo, etc.). En la situación actual, los ajustes del alquiler se convienen entre el locador y el locatario (aunque hay una clara relación de desigualdad de poder) y deben respetar los índices legales permitidos por la normativa vigente.
* Depósito en garantía: este depósito suele equivaler a un mes de alquiler (aunque algunas inmobiliarias pueden pedir hasta 3 meses) y tiene el propósito de cubrir cualquier posible daño que el inquilino pueda causar al inmueble. Es reembolsado al final del contrato si no se presentan deudas o desperfectos.
* Cláusulas especiales: los contratos pueden incluir cláusulas que contemplen, por ejemplo, la posibilidad de tener mascotas, el uso de espacios comunes o las responsabilidades sobre el mantenimiento del inmueble.

## Derechos y obligaciones

Ambas partes, tanto inquilinos como propietarios, tienen derechos y obligaciones que deben cumplir durante el período de vigencia del contrato. Entender estos puntos es esencial para evitar conflictos y para proteger sus intereses. A continuación, lo detallamos mejor:

* Obligaciones del inquilino: el inquilino está obligado a pagar el alquiler en tiempo y forma, mantener el inmueble en buen estado y cumplir con las responsabilidades pactadas en el contrato, como abonar los servicios y expensas cuando corresponda (aunque el inquilino no debe pagar las expensas extraordinarias ni los gastos fuera de lo habitual).
* Obligaciones del propietario: el propietario debe entregar el inmueble en condiciones óptimas y encargarse de las reparaciones estructurales o necesarias que no sean causadas por mal uso del inquilino. También tiene la obligación de respetar la privacidad del inquilino y no ingresar al inmueble sin previo acuerdo o notificación.
* Derechos protegidos por la ley: ambos están protegidos por la legislación vigente. Los propietarios tienen derecho a exigir el pago del alquiler y el mantenimiento del inmueble, mientras que los inquilinos tienen el derecho a vivir en un lugar habitable y protegido de incrementos abusivos del alquiler (aunque esto a veces no se respeta).

## Modificaciones y ajustes en el contrato

En Argentina, las modificaciones y ajustes en los contratos de alquiler son un aspecto clave para mantener la relación equilibrada entre inquilinos y propietarios. Estos ajustes suelen estar relacionados con la actualización del valor del alquiler, un tema especialmente importante en un contexto de inflación creciente, como el que ha vivido el país en los últimos años. La Ley de Alquileres anterior establecía que las actualizaciones de los montos debían realizarse anualmente y de acuerdo con índices predefinidos, para evitar abusos y garantizar la equidad entre las partes. Sin embargo, en la actualidad, esto está librado a la voluntad de los propietarios y las inmobiliarias, que son quienes dictaminan las condiciones y los inquilinos pueden aceptarlas o no.

Uno de los principales índices utilizados para estos ajustes es el Índice para Contratos de Locación (ICL), que fue introducido en la Ley de Alquileres de 2020. Este índice combina dos variables importantes: el Índice de Precios al Consumidor (IPC) y la Remuneración Imponible Promedio de los Trabajadores Estables (RIPTE).


### Índice de Precios al Consumidor (IPC)

El IPC mide la evolución de los precios de una canasta de bienes y servicios representativa del consumo de los hogares. Es un indicador fundamental para reflejar la inflación en el país y es calculado mensualmente por el Instituto Nacional de Estadística y Censos (INDEC). Al ser uno de los componentes del ICL, el IPC juega un papel crucial en los ajustes de los contratos de alquiler, ya que permite que el valor del alquiler se actualice en función de la inflación real que experimenta la economía argentina.

Por ejemplo, si la inflación ha sido alta durante el año, el IPC reflejará ese incremento en los precios, y el alquiler podrá ajustarse en consecuencia para mantener el equilibrio entre el poder adquisitivo del inquilino y las ganancias del propietario.


### Remuneración Imponible Promedio de los Trabajadores Estables (RIPTE)

El segundo componente del ICL es el RIPTE, que mide la evolución de los salarios de los trabajadores formales. Este índice es importante porque se busca que los aumentos en el valor del alquiler no solo sigan la inflación, sino que también sean coherentes con la capacidad de pago de los inquilinos, que generalmente se mide a través de los salarios. El RIPTE asegura que los ajustes del alquiler sean sostenibles para los inquilinos, ya que toma en cuenta la evolución de sus ingresos.

La combinación del IPC y del RIPTE en el ICL busca un balance justo para ambas partes: que los propietarios no pierdan poder adquisitivo debido a la inflación, pero que los inquilinos no se vean desbordados por aumentos que superen sus incrementos salariales.


### Otros índices y formas de ajuste

Aunque el ICL es el índice más comúnmente utilizado desde la implementación de la ya derogada Ley de Alquileres, algunas situaciones pueden permitir el uso de otros índices, siempre que ambas partes lo acuerden y que el ajuste sea anual. En contratos comerciales o de alquileres temporarios, por ejemplo, las partes tienen más libertad para negociar los términos de actualización.

Algunas de las alternativas que se pueden emplear son:

* Índice de la Cámara Argentina de la Construcción (CAC): este índice se utiliza principalmente en contratos relacionados con el sector de la construcción, como en alquileres de locales comerciales o terrenos. Mide los costos de la construcción y puede ser utilizado como una referencia para ajustar los valores de los alquileres, en particular cuando el inmueble alquilado está vinculado a proyectos de construcción o infraestructura.
* Ajustes por inflación acordados entre partes: en algunos casos, el propietario y el inquilino pueden acordar cláusulas de ajuste basadas en índices de inflación específicos o hasta en porcentajes fijos predeterminados. Sin embargo, es importante recalcar que estos acuerdos deben respetar la ley y deben registrarse adecuadamente para evitar disputas futuras. Además de que generalmente suelen ser bastante desfavorables para los inquilinos, que están sujetos a una relación asimétrica de poder.

### Contexto económico y ajustes en los alquileres

El contexto económico argentino, caracterizado por una alta inflación y una economía inestable, ha hecho que los ajustes de los alquileres sean un tema delicado tanto para inquilinos como para propietarios. En un año típico, los índices de inflación en Argentina pueden variar significativamente, afectando los costos de vida y, por ende, el valor del alquiler.

Los propietarios suelen estar preocupados por mantener el valor de su propiedad en términos reales, mientras que los inquilinos buscan que los incrementos sean razonables y acordes con su capacidad de pago. De allí la importancia de contar con índices como el ICL, que permite que los ajustes sean automáticos, justos y basados en datos concretos.

En resumen, los ajustes de los contratos de alquiler en Argentina están diseñados para reflejar tanto la inflación como los cambios en los salarios de los trabajadores. El IPC y el RIPTE son los principales índices utilizados para este propósito, aunque en algunos casos particulares se pueden aplicar otros mecanismos de ajuste, siempre y cuando se respeten los lineamientos legales y se garantice la equidad entre ambas partes. Estos ajustes anuales, semestrales, trimestrales o incluso mensuales ayudan a estabilizar el mercado de alquileres, protegiendo los intereses de inquilinos y propietarios en un contexto económico complicado como el actual.


## Resolución y renovación de contratos

La resolución de un contrato de alquiler puede darse de manera anticipada si ambas partes están de acuerdo. El inquilino puede rescindir el contrato notificando al propietario con un plazo de tres meses de antelación. En caso de que el propietario quiera finalizar el contrato antes de tiempo, necesitará una justificación legal adecuada para hacerlo.

Cuando un contrato llega a su fin, la renovación suele implicar la firma de un nuevo contrato, con condiciones actualizadas, incluyendo la nueva renta ajustada según los índices legales.


## Aspectos legales y registro

Desde la promulgación de la Ley de Alquileres en 2020, es obligatorio registrar los contratos de alquiler en la Administración Federal de Ingresos Públicos (AFIP). Este registro garantiza una mayor transparencia y otorga tanto a inquilinos como a propietarios la posibilidad de acceder a mecanismos de resolución de conflictos más efectivos.

No registrar un contrato puede acarrear sanciones para el propietario, y además limita sus derechos legales en caso de querer reclamar judicialmente algún incumplimiento por parte del inquilino.


## Gentrificación en grandes ciudades

La gentrificación es un fenómeno que ha afectado gravemente el mercado de alquiler en ciudades argentinas como Ciudad Autónoma de Buenos Aires, Córdoba Capital y Rosario. Este proceso ocurre cuando barrios que históricamente eran de clase media o baja experimentan un aumento en los precios de los inmuebles debido a inversiones y desarrollos, lo que provoca el desplazamiento de los residentes originales.

En Buenos Aires, por ejemplo, barrios como Palermo y Villa Crespo han visto un aumento significativo en los precios de alquiler debido a la llegada de proyectos inmobiliarios de lujo. Este fenómeno, aunque genera beneficios económicos para algunos sectores, crea un impacto negativo en las clases trabajadoras que no pueden seguir costeando los alquileres crecientes.

En Córdoba y Rosario, la gentrificación ha comenzado a notarse en zonas cercanas al centro, donde desarrolladores han lanzado proyectos de alto costo que no están al alcance de los residentes tradicionales. Esta situación ha generado tensiones en el mercado de alquiler, donde la oferta de propiedades accesibles se ha reducido notablemente.


## Conflictos comunes y resolución

Los conflictos más frecuentes en los contratos de alquiler incluyen el atraso en los pagos del alquiler, la falta de mantenimiento por parte del propietario o desacuerdos sobre el depósito en garantía. Para resolver estos problemas, la mejor opción es el diálogo y, en caso necesario, recurrir a instancias de mediación o asesoramiento legal.

Además, tanto los inquilinos como los propietarios pueden acudir a entidades de defensa del consumidor y a organismos oficiales para resolver sus disputas de manera pacífica.


## Consejos prácticos para inquilinos y propietarios

A la hora de firmar un contrato de alquiler, es esencial tomar precauciones que permitan evitar problemas futuros. Algunos consejos incluyen:

* Inspección previa: revisar cuidadosamente el estado del inmueble antes de firmar el contrato y documentar cualquier daño preexistente.
* Contrato claro y detallado: asegurarse de que el contrato incluya todas las cláusulas necesarias, como la forma de pago, duración del alquiler y derechos sobre el uso del inmueble.
* Selección adecuada: tanto inquilinos como propietarios deben realizar una investigación previa para garantizar que la otra parte sea confiable.

## Conclusión

El contrato de alquiler es una herramienta esencial para garantizar una relación equilibrada entre inquilinos y propietarios. En un contexto de mercados cambiantes, como el actual en Argentina, donde la gentrificación está modificando los patrones de oferta y demanda, es aún más importante estar bien informado sobre los derechos y obligaciones que establece la ley. Un contrato bien estructurado y claro es la mejor protección contra posibles conflictos.

Para quienes buscan mayor claridad sobre los contratos de alquiler, es recomendable consultar a profesionales del derecho inmobiliario y recurrir a recursos en línea que ofrezcan información legal actualizada. Además, estar al tanto de los cambios en el mercado, como la gentrificación, los cambios en materia fiscal, los índices de actualización del valor de los alquileres y los cambios en los términos de los contratos puede ayudar a tomar decisiones más informadas sobre dónde y cómo alquilar.


## Preguntas frecuentes:


### ¿Cómo debe hacer un contrato de alquiler?

Para hacer un contrato de alquiler, es fundamental que incluya la identificación de las partes (propietario e inquilino), una descripción del inmueble, la duración del contrato, el monto del alquiler, la forma de pago, el depósito en garantía y cláusulas adicionales sobre mantenimiento, mascotas y otras condiciones acordadas.


### ¿Cómo funciona un contrato de alquiler?

Un contrato de alquiler regula la relación entre el propietario y el inquilino, estableciendo las obligaciones y derechos de ambas partes. El propietario ofrece el inmueble a cambio de un pago mensual, mientras el inquilino tiene el derecho de usar la propiedad durante un tiempo determinado, sujeto a cumplir las condiciones del acuerdo.


### ¿Cuál es el tiempo mínimo de un contrato de alquiler?

En Argentina, el tiempo mínimo de un contrato de alquiler para vivienda es de tres años, según la Ley de Alquileres vigente. En casos de alquileres comerciales o temporarios, la duración puede variar, siendo estos últimos más flexibles en cuanto a plazos, dependiendo del acuerdo entre las partes.


### ¿Quién paga los gastos de contrato de alquiler?

Los gastos del contrato de alquiler, como los honorarios del escribano o inmobiliaria, generalmente son responsabilidad del inquilino. Sin embargo, algunos costos, como los impuestos o el mantenimiento de áreas comunes, pueden ser compartidos o pagados por el propietario, según lo que se estipule en el contrato y la normativa vigente.`
  },
  {
    id: 'art-9',
    title: 'Comisión para alquiler: ¿cuánto cobra una inmobiliaria por administrar una propiedad?',
    description: 'Antes de alquilar un inmueble, es importante conocer cuáles son los honorarios de las inmobiliarias por su gestión.',
    image: 'https://http2.mlstatic.com/D_NQ_721849-MLA96739887963_102025-V.jpg',
    tag: 'Comisiones',
    readTime: '5 min de lectura',
    content: `Antes de alquilar un inmueble, es importante conocer cuáles son los honorarios de las inmobiliarias por su gestión. Descubrí cómo se calcula la comisión, qué incluye y cómo comparar opciones en Mercado Libre Inmuebles.


## Comisión para alquiler: ¿cuánto cobra una inmobiliaria por administrar una propiedad?

. En general, cubre la búsqueda y selección de inquilinos, la gestión de documentación, el cobro mensual y el seguimiento del estado de la propiedad.

La comisión inmobiliaria cubre la gestión del contrato y la administración mensual del alquiler. Crédito: Pexels.

En Mercado Libre Inmuebles se pueden encontrar propiedades publicadas directamente por dueños y también por inmobiliarias, lo que permite comparar costos y servicios antes de cerrar un acuerdo.


### Cuánto cobra una inmobiliaria por administrar una propiedad

En la mayoría de los casos, las inmobiliarias cobran una comisión inicial equivalente a uno o dos meses de alquiler, más un porcentaje mensual que ronda entre el 3% y el 6% del valor del contrato.

La regulación varía según la provincia, ya que algunas jurisdicciones establecen topes o límites al cobro de honorarios al inquilino.

En los

, por ejemplo, la Ley N.º 5859 prohíbe que las inmobiliarias cobren comisión a los inquilinos para viviendas, por lo que los honorarios deben ser asumidos por el propietario.

En otras zonas del país, los honorarios suelen dividirse entre ambas partes o ajustarse por acuerdo.

En Mercado Libre Inmuebles, se puede verificar fácilmente qué propiedades están gestionadas por inmobiliarias y cuáles son

, lo que permite elegir la alternativa que mejor se adapte al presupuesto y al nivel de servicio buscado.

Las comisiones pueden variar según el tipo de inmueble, la ubicación y los servicios incluidos en la administración. Crédito: Unsplash.


### Qué incluye la administración de una propiedad

Los servicios de administración suelen cubrir:

* Gestión de cobro mensual: recepción y transferencia del pago del inquilino.
* Control de mantenimiento: coordinación de reparaciones o servicios.
* Rendición contable: envío de reportes de cobros y gastos.
* Renovación o rescisión de contratos: con actualización de documentación.
* Representación legal o técnica: en caso de reclamos o inspecciones.
El propietario puede optar por una administración integral o parcial. En Mercado Libre Inmuebles se observan tanto inmobiliarias que ofrecen gestión completa como aquellas que solo realizan la intermediación inicial en, por ejemplo,

.

Los servicios de administración pueden incluir mantenimiento, cobro y gestión legal del contrato. Crédito: Pexels.


### Cómo calcular la comisión inmobiliaria

Para estimar los costos, es importante diferenciar entre comisión inicial (por la búsqueda del inquilino y firma del contrato) y honorarios de administración (por el seguimiento mensual).

Un ejemplo práctico:

* Si encontrás una casa en alquiler en CABA por $400.000 mensuales, la comisión inicial podría rondar los $400.000–$800.000.
* La administración mensual, en cambio, se ubicaría entre $12.000 y $24.000, dependiendo del servicio contratado.
Estos valores pueden variar si la inmobiliaria ofrece

, garantía propietaria o mantenimiento integral.


### Cierre

Antes de firmar un contrato, conviene solicitar el detalle completo de los honorarios y servicios incluidos.

Cada inmobiliaria puede ofrecer un esquema distinto, y en Mercado Libre Inmuebles se pueden comparar miles de publicaciones con administración profesional o directa, para tomar una decisión informada.

Explorá todas las opciones de departamentos y

y elegí la forma de gestión que mejor se adapte a tus necesidades.


### Preguntas frecuentes

¿Quién paga la comisión inmobiliaria en un alquiler?En la Ciudad de Buenos Aires, la ley establece que la paga el propietario. En otras provincias, puede ser compartida o acordada entre las partes.

¿Cuánto cobra una inmobiliaria por administrar una propiedad?En promedio, entre el 3% y el 6% del valor mensual del alquiler, más una comisión inicial que puede equivaler a uno o dos meses del contrato.

¿Conviene contratar una inmobiliaria para administrar un alquiler?Depende del tiempo disponible del propietario y del tipo de inmueble. Las inmobiliarias ofrecen respaldo legal y gestión completa, lo que facilita el seguimiento de cobros y mantenimiento.


### Artículos relacionados

* ¿Dónde comprar departamentos baratos en CABA para alquilar a estudiantes?
* Alquilar en Chacarita: por qué es el barrio más cool y codiciado por los jóvenes
* Comprar y alquilar en Caballito: ¿por qué se convirtió en el barrio estrella que lidera las búsquedas?
Autor: Donato del Blanco

Licenciado en Periodismo y Tecnologías de la Comunicación por la Universidad de Concepción del Uruguay (UCU) y Técnico Superior en Periodismo por el Colegio Universitario de Periodismo (CUP). Cuenta con experiencia en medios digitales y producción de contenidos enfocados en actualidad, sociedad, tecnología y tendencias.`
  },
  {
    id: 'art-11',
    title: '¿Cómo saber a cuánto me va a subir el alquiler?',
    description: 'Actualmente, existen distintas modalidades de aumento de alquiler. ¿Cuáles son las más utilizadas y cómo calcularlas?',
    image: 'https://http2.mlstatic.com/D_NQ_986982-MLA92129283995_092025-V.jpg',
    tag: 'Aumentos',
    readTime: '5 min de lectura',
    content: `Actualmente, existen distintas modalidades de aumento de alquiler. ¿Cuáles son las más utilizadas y cómo calcularlas?


## ¿Cómo saber a cuánto me va a subir el alquiler?

Hoy los contratos se pactan libremente y con acuerdo entre las partes

Saber a cuánto va a subir el alquiler depende del contrato firmado, la fecha de inicio y la referencia utilizada para la actualización.

Hoy conviven distintas modalidades de actualización del precio de alquiler:

* aumento por ICL (Índice de Contratos de Locación)
* aumento por inflación (IPC)
* aumento por el coeficiente de Casa Propia
En esta nota explicamos cómo saber cuánto puede aumentar el alquiler, qué pasa con los precios en septiembre de 2025 y qué fórmulas hay que aplicar para calcularlo.

no siempre es tarea sencilla. Si bien los aumentos son más moderados que años anteriores y el stock de alquileres aumentó tras la implementación del DNU 70/23, para los inquilinos es un desafío hacerle frente a los gastos que implica un alquiler.

Ahora bien, tras la derogación de la ley de alquileres, el mercado evidenció diversos cambios:

* Hoy en los contratos se puede pactar libremente la periodicidad y fórmula de ajuste.
* Muchos contratos anteriores aún se rigen por el esquema del ICL del Banco Central, que combina inflación y salarios.
* Otros se actualizan directamente por inflación (IPC), de acuerdo con lo que pactaron las partes.
* En algunos contratos se aplica la fórmula de Casa Propia, originalmente creada para créditos hipotecarios UVA, que ajusta por salarios (RIPTE).
En septiembre los precios de los alquileres muestran:

* Subas por encima de la inflación acumulada en nuevas publicaciones.
* Una brecha entre contratos viejos y nuevos: quienes firmaron en 2022 o 2023 con ICL enfrentan aumentos anuales más fuertes que los contratos nuevos que ajustan con frecuencia trimestral o semestral.

#### Cómo calcular el aumento del alquiler según el ICL

El Índice de Contratos de Locación (ICL) fue creado por el Banco Central y combina la evolución de la inflación (IPC) y de los salarios (RIPTE). Hasta la derogación de la Ley de Alquileres, este índice se utilizaba de manera obligatoria para contratos de vivienda.

Si tu contrato de alquiler se actualiza por ICL, estos son los pasos para calcularlo:

* Consultá el ICL publicado por el Banco Central en la fecha de inicio de tu contrato.
* Buscá el valor del ICL en la fecha en que corresponde la actualización.
* Para conocer cuánto aumentará el alquiler, se debe realizar la siguiente cuenta:
* tomar el índice actual y dividirlo por el valor del índice de cuando comenzó el contrato.
* Esa cifra debe multiplicarse por el valor del alquiler y dará como resultado el monto que el inquilino deberá pagar durante el próximo año hasta que vuelva a actualizarse.

#### Cómo calcular el aumento del alquiler según la inflación

Muchos contratos de alquiler se actualizan por IPC, el índice que mide la inflación. La mayoría se actualiza cada tres o cuatro meses, pero pueden hacerlo con otra periodicidad.

Pasos para calcularlo:

* Revisá el contrato y confirmá cada cuánto se actualiza el precio.
* Identificá el IPC acumulado en ese período. El INDEC publica la inflación mensual y anual.
* Aplicá la fórmula: Nuevo alquiler = alquiler inicial × (1 + inflación del primer mes) × (1 + inflación del segundo mes) × (1 + inflación del tercer mes).
De esta manera, para quienes firmaron contratos con ajuste cada tres meses, el aumento de septiembre se calculará con el último índice publicado por el INDEC -julio de 2025-, por lo que el incremento será del 5,52%. En números concretos: si el alquiler es de $600.000, el nuevo valor a pagar en septiembre será de aproximadamente $633.113.

La derogación de la ley de alquileres reconfiguró el mercado, no sólo en los precios, sino también en la cantidad de inmuebles en oferta


#### Cómo calcular el aumento del alquiler según Casa Propia

El sistema Casa Propia surgió para créditos hipotecarios y luego comenzó a utilizarse en algunos contratos de alquiler como mecanismo alternativo. Este índice ajusta en base a la variación de los salarios (RIPTE), evitando que el incremento se dispare con la inflación.

Para calcularlo:

* Consultá el valor del índice Casa Propia al inicio del contrato.
* Buscá el valor en la fecha de actualización.
* En internet existen múltiples opciones de calculadoras automáticas de inflación acumulada que toman como referencia los datos publicados por el Indec (esto aplica para todos los métodos de ajuste)
Por ejemplo, si se pactó un ajuste trimestral, para un alquiler de $640.400 iniciado en junio de 2025, que debe ajustarse en septiembre, se usará el plazo de tres meses. Dado que la inflación acumulada en ese período fue de 6,01%, el valor a pagar pasaría a ser de $678.933,38 por mes.


#### Actualización anual del alquiler: qué tener en cuenta

Aunque muchos contratos firmados desde 2023 eligen ajustes más frecuentes (cada 3 ó 6 meses), todavía existen casos en los que la actualización es anual. Esto implica:

* El incremento se aplica una sola vez por año, lo que da previsibilidad al inquilino.
* El riesgo es que, en contextos de alta inflación, el aumento anual puede resultar muy elevado de golpe.
* Conviene preparar el presupuesto con antelación para no sorprenderse con la nueva cifra.
Algunos consejos prácticos:

* Verificá la cláusula de actualización: puede ser por ICL, IPC, Casa Propia u otra fórmula pactada.
* Consultá las publicaciones oficiales: el Banco Central y el INDEC publican los índices de referencia.
* Calculá con anticipación el monto para evitar atrasos o conflictos con el propietario.
* Negociá si el aumento resulta excesivo: en algunos casos, los propietarios aceptan un acuerdo intermedio para asegurar la continuidad del inquilino.
Conocer cómo es el contrato de alquiler es fundamental para saber el tipo de aumento que tendrá el inquilino

Saber a cuánto va a subir el alquiler depende de qué contrato tenés y qué índice lo regula. Actualmente, conviven tres esquemas principales: el ICL del Banco Central, la inflación (IPC) y el índice Casa Propia basado en salarios. La clave está en leer el contrato, identificar el índice aplicable y calcular con anticipación el nuevo monto. Así, podrás organizar tus finanzas, prever gastos y evitar sorpresas en un mercado inmobiliario que sigue mostrando tensiones y cambios constantes.


#### Preguntas frecuentes

Los alquileres pueden actualizarse por ICL, IPC o Casa Propia.

Para calcular el ajuste de un alquiler por IPC, hay que tomar el valor actual del contrato y actualizarlo según la variación acumulada del Índice de Precios al Consumidor publicada por el INDEC. En la práctica, se multiplica el monto del alquiler por el porcentaje de inflación acumulada en los meses que marca la cláusula del contrato.

Andrea Glikman es periodista especializada en temas de Real Estate. Es Licenciada en Comunicación Social por la Universidad Austral y periodista egresada en TEA. A lo largo de su carrera, trabajó en diversos medios, radiales y digitales. Desde 2011 escribe en un prestigioso medio económico, donde cubre temas del mercado inmobiliario y negocios.`
  },
  {
    id: 'art-12',
    title: 'Guía para alquilar una propiedad en Argentina: consejos y estrategias clave',
    description: 'Una propiedad bien mantenida, limpia y con reparaciones al día se alquila más rápido.',
    image: 'https://http2.mlstatic.com/D_NQ_914618-MLA81054220005_112024-V.jpg',
    tag: 'Consejos',
    readTime: '5 min de lectura',
    content: `Una propiedad bien mantenida, limpia y con reparaciones al día se alquila más rápido.

ALQUILER

PROPIEDADES

Si sos propietario, esta guía es para vos. Acá te vamos a ayudar a entender y optimizar cada etapa del proceso, desde la preparación del inmueble hasta la firma del contrato.


## Preparación de la propiedad para el alquiler

Siempre son más atractivas aquellas propiedades que están bien mantenidas. Según expertos del sector inmobiliario, la primera impresión es clave: una casa limpia, ordenada y con una estética acorde casi seguro que será alquilada más rápidamente que aquella que no cuenta con dichas características. Algunas acciones de preparación incluyen:

* Reparaciones esenciales: verificar que no hayan canillas que gotean, enchufes rotos ni problemas de humedad visibles.
* Limpieza profunda: mostrar el inmueble siempre limpio, incluyendo todos los espacios, las ventanas, las cortinas y las alfombras.
* Pintura y decoración: utilizar colores claros y neutros para maximizar la percepción de amplitud y luminosidad.

### Adaptación para inquilinos modernos

Incluir servicios modernos, como conexión a internet de alta velocidad o electrodomésticos eficientes, puede hacer que tu propiedad destaque en un mercado sumamente competitivo. También podés considerar la instalación de medidas de seguridad como cámaras o cerraduras inteligentes, sobre todo en propiedades urbanas.


### Documentación y aspectos legales básicos

En Argentina, con la derogación reciente de la ley 27.551, la cual establecía que los contratos de alquiler debían tener un plazo mínimo de dos años y cumplir con ciertos requisitos legales (como especificar el valor en pesos), prima la libertad de las partes a la hora de acordar. Ya no hay plazo mínimo legal ni requisitos respecto de la moneda o plazos de actualización.

En cuanto a los documentos, los más importantes son:

* Título de propiedad.
* Certificados de pago de impuestos y servicios.
* Un contrato claro que defina derechos y responsabilidades tanto del propietario como del inquilino.

## Estrategias de marketing y publicación efectiva del alquiler

Para destacar entre todas las propiedades puestas en alquiler, es clave crear un anuncio atractivo y profesional, que incluya:

* Fotografías de alta calidad: contar con imágenes bien iluminadas que muestren los espacios desde sus mejores ángulos es fundamental.
* Tour virtual: esta es una herramienta cada vez más utilizada, especialmente después de la pandemia, para simular una visita sin necesidad de traslados.
* Descripciones claras y honestas: incluye detalles sobre la ubicación, tamaño, características, espacios comunes (como pileta o gimnasio), y especificaciones como si se aceptan mascotas o no.

### Elección del canal adecuado

En Argentina, plataformas como Mercado Libre Inmuebles son ideales para llegar a un público más amplio. También podés promocionar a través de redes sociales como Facebook que, a través de Marketplace, permiten interactuar directamente con los interesados. Además, para aquellos propietarios que prefieren delegar el manejo de las negociaciones y los contratos, las inmobiliarias tradicionales son una gran alternativa.


### Precios competitivos

A la hora de fijar un precio, investigar el mercado local y tener en cuenta factores como la ubicación, la oferta y la demanda, y las características de la propiedad para establecer un precio adecuado. Un precio realista atrae más interesados y reduce los tiempos de vacancia.


## Gestión de visitas y selección de inquilinos

Mostrar el inmueble en las mejores condiciones aumenta las posibilidades de alquilarlo. Antes de cada visita, asegurate de:

* Ventilar la propiedad para eliminar olores y mejorar el ambiente.
* Iluminar los espacios con luz natural o artificial para destacar las áreas esenciales.
* Tener a mano toda la documentación que puedas necesitar, como planos o reglamentos del edificio.

### Interacción con los interesados

Recibir a los potenciales inquilinos de manera cordial y estar predispuesto a responder todas las preguntas puede ayudar a generar confianza y a acelerar la decisión por parte de los interesados. Proporcionar detalles sobre el contrato y las condiciones del alquiler.


### Criterios para seleccionar inquilinos

Algunos criterios para minimizar riesgos y evitar problemas con los inquilinos incluyen:

* Solicitar referencias laborales y de alquileres previos.
* Verificar recibos de sueldo o comprobantes de ingresos.
* Evaluar opciones de garantías propietarias o seguros de caución.

## Aspectos legales y cierre del contrato

El contrato de alquiler es el documento más importante, se realiza ante escribano público y debe incluir:

* Duración del contrato (no hay mínimo legal, si no se establece en el contrato, se da por sentado que dura dos años).
* Valor del alquiler y forma de actualización.
* Responsabilidades de mantenimiento, especificando las expensas ordinarias y extraordinarias.
* Cláusulas de rescisión anticipada, detallando los costos asociados si alguna de las partes decide finalizar el contrato antes de tiempo.

### Depósitos y seguros adicionales

El depósito de garantía, que en la mayoría de los casos es equivalente a un mes de alquiler, debe ser manejado con transparencia. En el caso de utilizar seguros de caución, es importante explicarle al inquilino las ventajas y requisitos de este método.


### Resolución de conflictos

Establecer reglas claras desde un principio para manejar quejas o problemas, como reparaciones o desacuerdos sobre el contrato. Esto puede consistir en la designación de un administrador o la utilización de servicios de mediación, como los ofrecidos por colegios de corredores inmobiliarios.


## Consejos finales para una relación armoniosa

Un buen propietario no solo busca alquilar su propiedad, sino también construir una relación positiva con sus inquilinos. Esto se construye a través de:

* Comunicación efectiva y buena predisposición a la hora de resolver problemas.
* Mantenimiento continuo de la propiedad, incluyendo revisiones periódicas para asegurar que todo funcione correctamente.
* Flexibilidad para atender necesidades específicas del inquilino, como cambios en el contrato.

## Preguntas frecuentes

A continuación, respondemos a una serie de preguntas que a menudo suelen surgir al momento de poner en alquiler una propiedad.


### ¿Qué sucede si el inquilino incumple el contrato?

Si el inquilino incumple el contrato, podés iniciar acciones legales, como el desalojo tras notificaciones adecuadas. Sin embargo, te recomiendo buscar soluciones amigables antes de llegar a esta instancia, que puede ser bastante ardua.


### ¿Cuántos meses de alquiler se pueden pedir por adelantado?

Solo se puede pedir un mes de alquiler como depósito y hasta dos meses por adelantado. Sin embargo, si el inquilino quiere, puede pagar todo el contrato por adelantado. Esto debe quedar especificado en el contrato.


### ¿Cómo se ajusta el precio del alquiler durante el contrato?

Las actualizaciones deben ser pactadas por las partes en el contrato, según los índices elegidos (ya no es necesario utilizar el ICL).


### ¿Qué pasa si el inquilino daña la propiedad?

En el contrato se debe añadir una cláusula que indique cómo se manejan las partes en caso de daños en la propiedad. En la mayoría de los casos se pacta que el propietario se quede con el depósito de garantía para solventar esos gastos, siempre y cuando que ellos no correspondan al uso y desgaste habitual de la vivienda.


### ¿Puedo vender la casa que está en alquiler?

Si, es muy común poner en venta casas que están en alquiler, pero hay que tener en cuenta algunas consideraciones:

El contrato de alquiler sigue estando vigente por más que la casa cambie de propietario, es decir, el nuevo dueño tiene que respetar los términos del contrato en cuanto a duración y condiciones pactadas. Además se debe informar al inquilino de que la casa fue puesta a la venta y puede tener prioridad para comprarla si le interesa la misma. Las visitas deben ser coordinadas con el inquilino para que se respete su privacidad y sus tiempos y en caso de que se concrete la venta se lo debe notificar.


### ¿Quién es responsable de pagar el ABL y las expensas?

Las expensas ordinarias siempre corren a cargo del inquilino, pero lo que son las expensas extraordinarias y los impuestos ABL (alumbrado, barrido y limpieza) son responsabilidad del propietario.


### ¿Es obligatorio realizar el contrato de alquiler ante un escribano público?

No es obligatorio pero realizar el contrato ante un escribano público brinda seguridad y solvencia jurídica al acto realizado y de esa manera evitar futuros inconvenientes legales.


### ¿Cuánto tiempo tengo para devolver el depósito de garantía?

El depósito debe ser devuelto al inquilino al finalizar el contrato, siempre que la propiedad esté en las condiciones pactadas. Normalmente, se devuelve dentro de los 30 días posteriores a la entrega del inmueble.`
  },
  {
    id: 'art-13',
    title: 'Departamentos en alquiler baratos: zonas y precios Argentina',
    description: 'Conocé los barrios con alquileres más accesibles en CABA, GBA, Córdoba y Rosario, con precios y consejos clave.',
    image: 'https://http2.mlstatic.com/D_NQ_867816-MLA111031340522_052026-V.jpg',
    tag: 'Precios',
    readTime: '6 min de lectura',
    content: `INMUEBLES

DEPARTAMENTO

ALQUILER

MONOAMBIENTE

AMUEBLADO

SALTA

Los departamentos en alquiler más baratos de Argentina se concentran en Villa Lugano, Floresta y Liniers dentro de CABA, en los cordones sur y oeste del Gran Buenos Aires (Avellaneda, Lanús, Morón), y en barrios universitarios del interior como Alberdi (Córdoba) y Echesortu (Rosario).

Pareja joven colocando un sillón al lado de una ventana en su nuevo departamento.

Según el último informe del Instituto de Estadística y Censos porteño (Idecba), un dos ambientes en Villa Lugano promedia $643.142, frente a los $757.091 de Núñez. La clave: priorizar barrios bien conectados pero alejados del corredor norte y de las zonas de alta demanda turística.

En Mercado Libre Inmuebles, la oferta en estas zonas ha crecido, permitiendo a inquilinos y familias encontrar unidades de dos ambientes por debajo del promedio del mercado nacional.

Entender el mapa de precios actual requiere analizar no solo el valor del canon locativo, sino también el impacto de las expensas y los servicios. A continuación, presentamos una guía detallada de las zonas más accesibles y consejos oficiales para asegurar un alquiler barato sin resignar seguridad.


## ¿Cuáles son los barrios más baratos para alquilar en CABA?

Dentro de CABA, los barrios del sur y el oeste lideran el ranking de los departamentos en alquiler más baratos, destacándose Villa Lugano, Mataderos y Pompeya con valores significativamente menores a la media de la ciudad.

Estas zonas, aunque alejadas del microcentro porteño, cuentan con acceso directo mediante el Metrobús y diversas líneas de colectivos, lo que las hace ideales para trabajadores que necesitan movilidad pero tienen un presupuesto ajustado.

Por otro lado, barrios con una fuerte impronta residencial como Floresta y Villa Luro ofrecen monoambientes y departamentos de 2 ambientes con expensas reducidas, un factor determinante en el costo final mensual.

En 2026, la tendencia de "barrios de cercanía" ha revalorizado estas zonas, donde los comercios de barrio permiten un costo de vida más bajo que en áreas como Palermo o Recoleta.


## ¿Dónde alquilar barato en el Gran Buenos Aires?

En el Gran Buenos Aires, los alquileres más accesibles se concentran en el Cordón Sur (Avellaneda y Lanús) y el Cordón Oeste (Morón y Tres de Febrero). Son partidos con fuerte tradición residencial, alta proporción de hogares inquilinos según el Censo 2022 del INDEC y una oferta de departamentos que escapa al perfil de torres premium que predomina en el Corredor Norte. Esta combinación tracciona valores por debajo del promedio del conurbano.

* En la Zona Sur, Avellaneda y Wilde funcionan como puerta de entrada al conurbano: a pocos minutos del microcentro porteño vía Puente Pueyrredón y con conexión directa por el ferrocarril Roca.
* La Zona Oeste ofrece otra dinámica: en Ramos Mejía y Haedo la oferta se distribuye entre departamentos modernos cerca de las estaciones y unidades más económicas en las calles internas, alejadas de los polos comerciales.
* La Zona Norte, históricamente la más cara del conurbano por la concentración de countries y torres premium en Olivos y Tigre, sostiene bolsones de oferta accesible en partidos como Vicente López interior (Munro, Carapachay) y San Martín (José León Suárez, Villa Ballester).
Te puede interesar: Requisitos para alquilar un departamento en Argentina en 2026.


## ¿Qué barrios elegir para alquilar barato en Córdoba y Rosario?

En Córdoba Capital, Alberdi y Alto Alberdi concentran buena parte de la oferta universitaria de la ciudad: limitan con la Ciudad Universitaria de la UNC, donde estudian más de 130.000 personas según datos oficiales de la universidad. Esa demanda estudiantil sostenida traccionó durante décadas un parque inmobiliario dominado por monoambientes y unidades de un dormitorio, formato que naturalmente queda en la franja más accesible del mercado por su menor superficie.

En Rosario, Echesortu y la zona aledaña a la Terminal de Ómnibus mantienen una oferta accesible por características muy distintas entre sí. Echesortu es un barrio residencial consolidado de baja altura, con predominio de PHs y departamentos en edificios antiguos sin amenities, lo que reduce tanto el canon como las expensas. La zona de la Terminal, en cambio, compensa su menor demanda residencial —al tratarse de un sector de paso— con valores por debajo del promedio céntrico. En ambas ciudades del interior, además, una porción significativa de las publicaciones proviene de propietarios particulares, lo que suele abrir margen para conversar las condiciones de ingreso al contrato.

Living comedor con vista al pasillo del dormitorio de un departamento de un ambiente con balcón en alquiler en el barrio Echesortu, Rosario.


## ¿Cuánto cuesta alquilar en los barrios más accesibles de CABA?

En CABA, la diferencia entre los barrios más accesibles y los premium puede superar los $150.000 mensuales para un mismo tipo de unidad. Según el Instituto de Estadística y Censos de la Ciudad (Idecba), durante el primer trimestre de 2026 el alquiler promedio de un departamento de dos ambientes en la ciudad se ubicó en $721.267.

En la franja más accesible aparecen Barracas, con un promedio de $606.953, seguido por San Cristóbal ($617.667), Liniers ($618.347), Constitución ($628.051) y Floresta ($641.077). Todos estos barrios quedan por debajo de la media porteña y comparten un perfil común: predominio de edificios antiguos, oferta consolidada y menor concentración de torres con amenities.

En el otro extremo, Palermo promedia $721.773 y Núñez alcanza $757.091 para el mismo tipo de unidad, traccionados por la concentración de construcciones nuevas, mayor superficie promedio y la creciente proporción de publicaciones nominadas en dólares en el corredor norte.

Estos valores corresponden a departamentos usados de 43 m² promedio según el relevamiento oficial, y funcionan como referencia: dentro de cada barrio, el precio final de cada unidad varía según antigüedad, estado, piso, orientación y expensas.


## ¿Cuánto pesan las expensas en el costo total del alquiler?

Al comparar departamentos para alquilar, el valor del canon es solo una parte de la ecuación: las expensas pueden mover de forma significativa el costo final que vas a pagar cada mes. La regla práctica es simple: cuantos más servicios e instalaciones comunes tiene el edificio, más altas son las expensas. Los edificios de estilo o antiguos sin ascensor, conocidos como "por escalera", suelen ubicarse en la franja más baja porque no sostienen seguridad 24 horas, pileta, gimnasio ni salones de usos múltiples (SUM). En el otro extremo, las torres modernas con amenities y personal permanente trasladan a las expensas todo ese costo operativo.

Si tu prioridad es bajar el gasto mensual total, una estrategia útil es filtrar por edificios con pocas unidades y sin amenities: menos vecinos significan menos personal de portería y menos infraestructura común que mantener. Conocé más sobre propiedades con bajas expensas y dónde encontrarlas antes de definir tu búsqueda.


## ¿Cómo encontrar oportunidades de alquiler en Mercado Libre?

Utilizar los filtros de "Precio Máximo" y "Ubicación" de forma combinada en la plataforma de Mercado Libre es la técnica más efectiva para encontrar departamentos que acaban de ser publicados con valores de oportunidad. La velocidad de respuesta es clave: los alquileres baratos suelen tener una alta rotación y se señan en las primeras 48 horas de publicación.

Además, te recomendamos:

* Activar alertas: Recibí notificaciones cada vez que entre una unidad en tu barrio de interés.
* Verificar la antigüedad de la publicación: Las publicaciones con más de 15 días pueden ser negociables si el propietario tiene urgencia.
* Consultar por la garantía: Muchas veces, ofrecer un seguro de caución agiliza la operación y permite acceder a departamentos cuyos dueños no aceptan garantías propietarias de otras provincias.
Te puede interesar: Seguro de caución: cómo funciona y por qué lo necesitan los inquilinos.


## Cómo filtrar las publicaciones para ver primero las más baratas?

Mercado Libre Inmuebles permite ordenar los resultados por precio para que las opciones más económicas aparezcan al inicio del listado. El recorrido es directo: ingresá a la categoría Inmuebles > Departamentos > Alquiler, elegí la provincia o localidad que te interesa y, en la barra superior de resultados, seleccioná el orden "Menor precio". De un vistazo vas a ver qué barrios concentran la oferta más accesible y a qué valores arrancan las publicaciones del día.

Una buena práctica es abrir cada publicación que te interese en una pestaña nueva: así podés comparar entre varias unidades sin perder el listado original ni los filtros que ya configuraste. Combiná este orden con los filtros de cantidad de ambientes, rango de precios y superficie mínima para refinar la búsqueda y descartar publicaciones que no se ajusten a tu presupuesto.

Cocina integrada al living comedor de un departamento de un ambiente en alquiler en Alto Alberdi, Córdoba.


## ¿Cómo decidir el alquiler que más te conviene?

El mercado de alquileres argentino ofrece más opciones accesibles de lo que muchos inquilinos creen: barrios como Villa Lugano, Avellaneda o Alberdi permiten encontrar unidades dignas por debajo del promedio. Si ya estás listo para arrancar la búsqueda, en Mercado Libre Inmuebles podés filtrar por zona, precio y tipo de unidad para encontrar la opción que mejor se ajuste a tu presupuesto.


### ¿Conviene alquilar por dueño directo o por inmobiliaria?

Alquilar por dueño directo permite evitar el pago de comisión inmobiliaria, que suele estar a cargo del inquilino al firmar el contrato. La contracara es que el inquilino asume mayor responsabilidad en la revisión del contrato, la verificación de la titularidad del inmueble y la gestión de garantías. Quienes alquilan por primera vez suelen encontrar más respaldo en una inmobiliaria matriculada, aunque el costo de ingreso sea más alto.


### ¿Conviene firmar el contrato en pesos o en dólares?

En 2026, una porción creciente de la oferta en CABA, especialmente en el corredor norte, se publica en dólares. Según el Idecba, durante el primer trimestre del año, el 27,6% de las publicaciones de alquiler en la ciudad estuvo nominada en moneda extranjera, con picos del 45% en Palermo. Los contratos en pesos suelen incluir ajustes periódicos por índice (IPC o ICL), mientras que los contratos en dólares fijan el valor del canon en moneda dura. La conveniencia depende de la fuente de ingresos del inquilino: quienes cobran en pesos suelen preferir contratos en pesos para no exponerse al tipo de cambio.


### ¿Qué garantías se aceptan habitualmente para alquilar?

Las garantías más frecuentes son la propietaria (un tercero ofrece un inmueble como respaldo), el seguro de caución (una póliza que reemplaza la garantía propietaria mediante el pago de una prima) y el recibo de sueldo o monotributo del inquilino. Cada propietario o inmobiliaria define qué tipo de garantía acepta, por lo que conviene consultar antes de avanzar con una visita. El seguro de caución suele ser la opción más accesible para inquilinos que no cuentan con una garantía propietaria en la misma jurisdicción.`
  },
  {
    id: 'art-14',
    title: 'Cómo calcular el aumento del alquiler en Argentina y evitar sorpresas',
    description: '¿No sabés cuánto va a subir tu alquiler? Te explicamos el cálculo paso a paso, con ejemplos reales.',
    image: 'https://http2.mlstatic.com/D_NQ_879662-MLA111031382106_052026-V.jpg',
    tag: 'Calculadora',
    readTime: '5 min de lectura',
    content: `INMUEBLES

DEPARTAMENTO

ALQUILER

3 AMBIENTES

RENOVADO

CHACO

Si estás alquilando o estás por firmar un contrato, la primera pregunta que surge es inevitable: ¿cuánto me va a subir el

? En Argentina, la respuesta depende de qué índice está pactado en el contrato —ICL, IPC u otro—, de la frecuencia de actualización y del momento económico. En esta guía te explicamos cómo hacer el cálculo paso a paso, con ejemplos concretos, para que puedas proyectar lo que vas a pagar y tomar decisiones con información.


## Encontrá departamentos en alquiler en Argentina


## Cómo se calcula el aumento del alquiler paso a paso

Para entender cuánto va a subir un

, lo primero es ver cómo está definido el ajuste en el contrato. Hoy en Argentina no hay un único sistema: algunos contratos usan índices (como inflación), otros fijan aumentos en porcentajes y, en algunos casos, se pactan directamente en dólares.

Cuando el contrato usa un índice, el cálculo es bastante directo: el

se actualiza según cuánto subió ese indicador en el período acordado.

Por ejemplo: si hoy pagás $200.000 y el índice que se aplica subió un 80% en un año, el nuevo

se calcula así: $200.000 × 1,80 = $360.000. Es decir, pasarías a pagar $360.000 a partir del ajuste.

En acuerdos con aumentos más frecuentes, por ejemplo, cada 3 o 6 meses, el mecanismo es el mismo, pero aplicado a períodos más cortos. Si en 6 meses el índice sube un 30%, el cálculo sería: $200.000 × 1,30 = $260.000

Cuando el contrato usa un índice como el ICL o el IPC, el cálculo es un paso más: en lugar de multiplicar por un porcentaje fijo, se divide el valor actual del índice por el valor que tenía al inicio del período. Por ejemplo, si el ICL valía 1.000 cuando arrancó tu contrato y hoy vale 1.800, el coeficiente de ajuste es 1,80. Entonces: $200.000 × 1,80 = $360.000. El resultado es el mismo que en el ejemplo anterior, pero acá el porcentaje no está dado de antemano: lo calculás vos con los valores oficiales que publica el Banco Central en su sitio web.

También existen casos donde el aumento ya está definido desde el inicio. Por ejemplo: $200.000 los primeros 6 meses, $260.000 los siguientes 6 meses y $320.000 el segundo año. En estos casos no hay que calcular nada: el valor ya está fijado en el contrato.

Para facilitar este cálculo, existen herramientas como la calculadora oficial del Gobierno de la Ciudad de Buenos Aires, que permite estimar el nuevo valor del

según el índice correspondiente.

Ahora bien, más allá de la fórmula, lo importante es entender qué índice se está usando, porque de eso depende cuánto va a subir realmente el

.


## Qué índice se usa para actualizar el alquiler en Argentina

El índice es lo que termina definiendo cuánto va a subir el alquiler en la práctica. Dos contratos con el mismo valor inicial pueden terminar en montos distintos según cómo se ajuste. Por eso, entender cómo se redacta y qué cláusulas incluye también es parte del análisis al momento de

.

Por ejemplo, si comparás dos casos sobre un

$200.000:

* Con un ajuste ligado a la inflación que sube un 80% en un año, pasás a $360.000.
* Con un aumento fijo del 50%, pasás a $300.000.
La diferencia es grande, incluso partiendo del mismo punto. La diferencia es grande, incluso partiendo del mismo punto. En general, hoy aparecen tres esquemas principales y los contratos toman como referencia indicadores como el Índice de Contratos de Locación (ICL), que combina inflación y salarios, o el Índice de Precios al Consumidor (IPC), que mide la inflación.

En este escenario, lo importante es entender que si estos índices suben, el

también va a acompañar esa tendencia:

* Ajustes por inflación o similares: siguen la suba de precios, por lo que en contextos inflacionarios los aumentos suelen ser más altos.
* Contratos en dólares: el valor se mantiene en esa moneda, pero en pesos puede variar según el tipo de cambio.
* Aumentos predefinidos: ya están fijados desde el inicio, lo que da previsibilidad, aunque no siempre refleja lo que pasa en la economía.
A estos dos índices se suma un tercero que aplica a un grupo específico de contratos: el Coeficiente Casa Propia. Este esquema rige para acuerdos firmados entre octubre y diciembre de 2023, en el período de transición entre la vieja ley de

y el DNU que la derogó. Si tu contrato es de esa franja, el ajuste no se calcula por ICL ni por IPC, sino por este coeficiente, que toma como referencia la evolución de los salarios. Para saber si te aplica, revisá la fecha de inicio del contrato y la cláusula de actualización.

Entender esto es lo que permite pasar del cálculo teórico a una estimación concreta de cuánto vas a pagar. Y ahí aparece otra duda clave: cada cuánto se aplican estos aumentos.

Dos personas calculando los gastos de alquiler de su departamento en la mesa de la cocina.


## Cada cuánto aumenta un alquiler

La frecuencia del aumento depende del contrato. Puede ser mensual,

, semestral o anual, y eso cambia mucho el impacto en el bolsillo.

En acuerdos con ajustes más frecuentes, los aumentos suelen ser más graduales, pero acumulativos. En cambio, cuando el ajuste es anual, el salto suele ser más fuerte porque concentra toda la variación en un solo momento.

No es solo una cuestión de cuándo aumenta, sino de cómo se distribuye ese aumento. En contratos con ajustes más espaciados, el incremento suele concentrarse en un solo momento y se siente como un salto fuerte. En cambio, cuando los ajustes son más frecuentes, el impacto se reparte en varios tramos y el valor va subiendo de forma más constante.

Con esto claro, se puede avanzar a algo más concreto: cómo estimar cuánto vas a terminar pagando en la práctica.


## Cómo estimar cuánto vas a pagar realmente de alquiler

Para tener una idea real del costo, no alcanza con mirar el valor inicial: hay que proyectar cómo va a evolucionar el

a lo largo del contrato. Esto implica tomar ese precio de entrada y aplicar los aumentos según el índice y la frecuencia acordada.

Más que hacer una cuenta exacta, lo importante es armar una proyección simple que te permita responder algo concreto: cuánto vas a pagar dentro de unos meses y cómo puede seguir subiendo.

Un buen punto de partida es calcular al menos tres momentos: el valor actual, el valor después del primer ajuste y una estimación hacia mitad o fin de contrato. Con eso ya podés ver si el

se mantiene dentro de lo que podés pagar o si empieza a quedar desfasado.

También es útil mirar el comportamiento reciente del índice que se aplica. Si viene subiendo fuerte, es probable que los próximos ajustes sigan esa tendencia. No es una certeza, pero sirve como referencia para no proyectar a ciegas.

En este punto, usar

como las del Gobierno de la Ciudad de Buenos Aires ayuda a bajar esto a números concretos. Estas plataformas permiten cargar el valor inicial del alquiler, la fecha de inicio del contrato y el tipo de ajuste, y a partir de eso estimar cuánto podría aumentar en el tiempo.

Ahora bien, incluso con el cálculo hecho, hay errores bastante comunes que pueden hacer que el

termine siendo más caro de lo esperado.


## Errores comunes al calcular el aumento del alquiler

Uno de los errores más frecuentes es mirar solo el valor inicial sin proyectar los aumentos. Esto puede dar una falsa sensación de accesibilidad.

Otro problema es no entender qué índice se aplica o cómo funciona. Firmar sin tener claro este punto puede generar sorpresas cuando llega el momento del ajuste.

También es común no considerar el contexto económico: en períodos de alta inflación, los aumentos pueden ser mucho más altos de lo que se esperaba al inicio del contrato.

A esto se suma un error bastante habitual: no prestar atención a la frecuencia de los aumentos. Un mismo índice puede tener impactos distintos según se aplique de forma anual o en períodos más cortos, lo que cambia cómo evoluciona el valor mes a mes.

Evitar estos errores no requiere ser experto, sino tener la información clara antes de firmar. Y para cerrar, hay algunas dudas puntuales que suelen aparecer siempre.

Profesional revisando el cálculo del aumento de su alquiler con una calculadora y un cuaderno.


## Entender cómo se calcula el aumento del alquiler permite tomar mejores decisiones

El mercado de

en Argentina atraviesa un momento dinámico, con cambios en las condiciones de los contratos y en la forma en que se aplican los aumentos. Más allá del contexto, entender cómo se calcula el ajuste permite moverse con más claridad y evitar decisiones apresuradas.

No se trata solo de encontrar un

que cierre hoy, sino de evaluar cómo va a evolucionar en el tiempo. El tipo de índice, la frecuencia de los aumentos y las condiciones del contrato son factores que pueden marcar una diferencia importante en lo que terminás pagando.

Si ya estás buscando

o querés comparar opciones antes de firmar, en Mercado Libre Inmuebles podés filtrar por precio, zona y tipo de contrato. Explorar distintas alternativas con información clara te permite llegar a la negociación con una referencia real del mercado


### ¿Qué pasa si el contrato no especifica el índice de ajuste?

Si el

no aclara qué índice se usa ni cada cuánto se actualiza el alquiler, no se puede aplicar ningún aumento adicional hasta que finalice el período acordado o ambas partes renegocien las condiciones por escrito. En la práctica, esto puede beneficiar al inquilino en el corto plazo, pero también genera incertidumbre para ambas partes. Por eso, antes de firmar, es fundamental revisar que la cláusula de actualización esté redactada con claridad: índice, frecuencia y fecha de inicio del primer ajuste.


### ¿El aumento se calcula siempre sobre el valor inicial?

No. En la mayoría de los casos, el ajuste se aplica sobre el último valor actualizado. Es decir, los aumentos se van acumulando. Por eso, aunque los porcentajes parezcan moderados, el monto final puede crecer bastante con el tiempo.


### ¿Se puede negociar el tipo de ajuste?

Sí. En muchos casos, las condiciones del contrato se pueden acordar entre las partes antes de firmar, y el tipo de ajuste es uno de los puntos más importantes a definir. En la práctica, lo que se puede negociar no es solo el índice, sino también la frecuencia y la forma. Ahora bien, el margen de negociación depende del mercado. En contextos con alta demanda, suele haber menos flexibilidad.`
  }
];
