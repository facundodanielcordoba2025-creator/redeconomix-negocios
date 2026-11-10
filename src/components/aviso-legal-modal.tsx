'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Scale, FileText, CheckCircle2, X } from "lucide-react";
import { SURGERY_SPECIALTY_REQUIREMENTS } from '@/data/surgeries';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  isAccepted?: boolean;
}

export function LegalNoticeModal({
  isOpen,
  onOpenChange,
  onAccept,
  isAccepted: initialAccepted = false,
}: LegalNoticeModalProps) {
  const [hasAccepted, setHasAccepted] = useState(initialAccepted);

  const handleConfirm = () => {
    if (onAccept) onAccept();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden max-w-[95vw] sm:max-w-2xl focus:outline-none max-h-[90vh] flex flex-col">
        {/* Header Rojo Sólido Oficial */}
        <div className="bg-[#FF0000] p-6 text-center text-white relative shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-[#FF0000] shadow-lg mb-2">
            <Scale className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
            Aviso Legal y Condiciones
          </DialogTitle>
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/90 mt-1">
            Marco Normativo Ley 17.418 • Ley 24.240 • Ley 25.506
          </p>
        </div>

        {/* Contenido Legal Completo */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold text-slate-600 space-y-1">
            <p>
              <strong className="text-slate-900 font-black">Tomador:</strong> RedEconomiX S.A.
            </p>
            <p>
              <strong className="text-slate-900 font-black">Asegurados:</strong> Personas físicas adheridas a través de la plataforma o aplicación móvil oficial de RedEconomiX Bienestar.
            </p>
            <p>
              <strong className="text-slate-900 font-black">Marco Regulatorio:</strong> Conforme a las Leyes de la República Argentina N° 17.418 (Ley de Seguros), N° 24.240 (Defensa del Consumidor), N° 25.506 (Firma Digital / Electrónica), N° 25.326 (Protección de Datos Personales) y Código Civil y Comercial de la Nación.
            </p>
          </div>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              1. Integración Contractual y Objeto
            </h4>
            <p className="text-slate-600">
              El presente documento regula de forma indivisible el acceso, el uso de la plataforma y la adhesión a los programas de asistencia y coberturas de RedEconomiX Bienestar (Plan Esencial y Plan Total), incluyendo coberturas por Invalidez Temporal (aplicada a prestación alimentaria), Muerte Accidental, Invalidez Total y Permanente por Accidente o Enfermedad, y reintegros o servicios de asistencia médica complementaria.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              2. Perfeccionamiento por Aceptación Electrónica
            </h4>
            <p className="text-slate-600">
              Conforme a los artículos 286, 288 y concordantes del Código Civil y Comercial de la Nación y la Ley Nacional N° 25.506, la manifestación de voluntad y el consentimiento se perfeccionan válidamente mediante la marcación de la casilla de verificación («checkbox») y la confirmación digital desde el dispositivo del usuario, poseyendo idéntica eficacia y fuerza obligatoria que la firma manuscrita.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              3. Actualización de Importes (IPC)
            </h4>
            <p className="text-slate-600">
              El valor de la cuota mensual de adhesión al plan se actualizará periódicamente conforme a la variación del Índice de Precios al Consumidor (IPC) publicado oficialmente por el Instituto Nacional de Estadística y Censos (INDEC). El ajuste será automático de pleno derecho tomando como referencia el último índice disponible, garantizando el equilibrio económico del fondo prestacional y la intangibilidad del valor real de las coberturas.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              4. Prestación Alimentaria (Canasta de Alimentos) y Sustituciones
            </h4>
            <p className="text-slate-600">
              La prestación alimentaria consiste en la provisión directa de una caja cerrada con veintiséis (26) alimentos esenciales de primeras marcas nacionales ante el reposo médico o la incapacidad laboral temporal continua del titular por un período mayor a treinta (30) días corridos, derivados de un accidente o una enfermedad inculpable.
            </p>
            <p className="text-slate-600 bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-xs font-medium text-amber-950">
              <strong className="font-black text-amber-900">Política de Sustitución:</strong> Ante quiebre de existencias («stock») o falta transitoria de suministro en fábrica de alguno de los productos que componen la canasta, RedEconomiX se reserva la facultad de sustituir dicho artículo por otro de idénticas o superiores características nutricionales y comerciales, preservando siempre el estándar de primera línea del beneficio.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              5. Denuncia de Siniestro y Documentación Requerida
            </h4>
            <p className="text-slate-600">
              El asegurado o sus derechohabientes deberán denunciar el hecho que motiva la solicitud dentro del plazo perentorio de tres (3) días hábiles de acaecido el siniestro o extendido el certificado médico de reposo (Art. 46, Ley N° 17.418), debiendo acompañar:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li>Copia legible del Documento Nacional de Identidad (DNI) de frente y dorso.</li>
              <li>Certificado médico original emitido con membrete oficial, fecha, diagnóstico claro, firma, sello y matrícula provincial o nacional del profesional actuante.</li>
              <li>Constancia médica que indique con precisión los días de reposo o incapacidad prescriptos (mínimo exigible: reposo mayor a treinta (30) días para la canasta de alimentos).</li>
              <li>Historia clínica y estudios complementarios de diagnóstico (ecografías, radiografías, informes quirúrgicos) en caso de solicitud de aportes por cirugías o internación.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              6. Régimen Regulatorio del Catálogo de 668 Intervenciones Quirúrgicas
            </h4>
            <p className="text-slate-600">
              La edad límite de ingreso para coberturas asistenciales y reposo temporal es de dieciocho (18) a sesenta y cuatro (64) años (con permanencia hasta los sesenta y cinco (65) años cumplidos). Para coberturas indemnizatorias por fallecimiento accidental rige desde los dieciocho (18) hasta los setenta y nueve (79) años (con permanencia hasta los ochenta (80) años cumplidos).
            </p>
            <p className="text-slate-600">
              <strong>Naturaleza del Beneficio:</strong> La asistencia para cualquiera de las seiscientas sesenta y ocho (668) intervenciones quirúrgicas del catálogo oficial consiste en un <strong>Aporte Económico Posoperatorio liquidado en seis (6) cuotas mensuales consecutivas</strong>, destinado a solventar gastos de convalecencia, medicamentos y reposo del paciente. RedEconomiX no constituye una empresa de medicina prepaga ni asume responsabilidad por el acto médico quirúrgico, el cual es libremente contratado por el paciente con su prestador o centro de salud habilitado.
            </p>
            
            <div className="bg-red-50 border border-red-200/80 p-3 rounded-xl text-xs font-medium text-red-950 space-y-1">
              <strong className="font-black text-red-900 uppercase block">Cláusula de Preexistencias (Filtro Excluyente Absoluto):</strong>
              <p>
                No se cubrirán bajo ningún concepto los beneficios que sean consecuencia directa o indirecta de patologías o condiciones preexistentes a la fecha de inicio de la vigencia de la cobertura para cada asegurado. Se entienden por condiciones preexistentes aquellas enfermedades, lesiones o anomalías diagnosticadas, estudiadas, tratadas o sintomáticas con anterioridad al ingreso formal a la red. RedEconomiX se reserva el derecho de requerir y auditar la historia clínica previa del asegurado en sanatorios, hospitales y obras sociales.
              </p>
            </div>

            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
              <li><strong>Exclusión Absoluta de Fines Estéticos o Cosméticos:</strong> Quedan terminantemente excluidas todas las intervenciones practicadas con fines de embellecimiento, estéticos, cosméticos, de modelado corporal o voluptuarios (rinoplastias estéticas, mamoplastias de aumento sin secuela oncológica, liposucción, dermolipectomía estética, etc.). Solo se admiten cirugías reconstructivas o reparadoras originadas de forma directa e inmediata por traumatismos graves o ablaciones oncológicas con dictamen pericial.</li>
              <li><strong>Régimen Especial de Cirugía Bariátrica y Tratamiento de la Obesidad:</strong> Por constituir patologías de evolución crónica preexistente, las intervenciones bariátricas (manga gástrica, «bypass» gástrico, colocación o extracción de balón intragástrico) exigen una carencia ininterrumpida obligatoria de doce (12) meses en el plan, un índice de masa corporal (IMC) superior a 40 (o 35 con comorbilidades severas) y acreditación fehaciente del protocolo multidisciplinario clínico previo.</li>
              <li><strong>Períodos de Carencia Escalonados Obligatorios:</strong> 
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Intervenciones Quirúrgicas Generales: Sesenta (60) días de permanencia activa ininterrumpida.</li>
                  <li>Maternidad, Parto y Cesárea: Trescientos (300) días de carencia ininterrumpida (diez (10) meses continuos con cuota al día previos al parto).</li>
                  <li>Trasplantes de Órganos Vitales: Ciento veinte (120) días de carencia.</li>
                  <li>Prótesis y Materiales de Osteosíntesis: Sesenta (60) días de carencia.</li>
                  <li>Prácticas Médicas y Estudios de Diagnóstico: Sesenta (60) días de carencia.</li>
                </ul>
              </li>
              <li><strong>Estructura del Nomenclador de 668 Cirugías en 17 Especialidades:</strong> La nómina oficial abarca intervenciones agrupadas en diecisiete (17) especialidades médicas: Maternidad (Parto/Cesárea), Bariátrica, Alta Complejidad/Trasplantes, Cirugía Plástica Reparadora, Cardiovascular, Traumatología y Prótesis, Digestivo, Mastología, Dermatología Quirúrgica, Oftalmología, Otorrinolaringología, Sistema Nervioso, Urología, Ginecología, Tórax, Endocrinología y Linfático. Cada intervención tiene asociada en la plataforma su carencia específica (desde sesenta (60) días hasta doce (12) meses en bariátrica y trescientos (300) días en parto), sus filtros clínicos (exclusión de estética, exigencia de IMC o biopsia) y su documentación probatoria obligatoria, no admitiéndose reclamos fuera de dichos requisitos taxativos.</li>
              <li><strong>Documentación Médica Excluyente para Liquidar las Seis (6) Cuotas:</strong> Para la autorización y acreditación mensual del aporte posoperatorio es requisito indispensable presentar: 
                <br />1) <em>Protocolo Quirúrgico Original</em> con firma, sello y matrícula provincial o nacional del cirujano jefe y del médico anestesiólogo; 
                <br />2) <em>Epicrisis u Hoja de Alta Sanatorial</em> oficial con membrete del establecimiento médico, diagnóstico posoperatorio y fechas de ingreso y egreso; 
                <br />3) <em>Informe de Anatomía Patológica (Biopsia)</em> en toda intervención que implique extirpación o resección de tejidos o neoplasias; 
                <br />4) <em>Factura electrónica fiscal clase «B» o «C» con CAE y código QR</em> por honorarios o gastos sanatoriales a nombre del titular con su correspondiente DNI.
              </li>
              <li><strong>Regla de Unicidad de Acto Quirúrgico y Límite Anual:</strong> Rige un tope máximo de una (1) intervención quirúrgica indemnizable por año calendario por persona asegurada. Si en un mismo acto quirúrgico o internación se realizan múltiples procedimientos nomenclados, se liquidará única y exclusivamente la intervención de mayor valor de la tabla oficial de 668 cirugías, no acumulándose los importes.</li>
            </ul>

            {/* Cuadro Oficial de Requisitos, Carencias y Documentación por Especialidad (668 Cirugías) */}
            <div className="mt-3 bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Cuadro Oficial de Requisitos y Carencias por Especialidad (Nómina de 668 Cirugías)
                </h5>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                La siguiente tabla taxativa reglamenta las condiciones exigibles para cada una de las 668 intervenciones cubiertas:
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="p-2 whitespace-nowrap">Especialidad</th>
                      <th className="p-2 whitespace-nowrap">Cirugías</th>
                      <th className="p-2 whitespace-nowrap">Carencia</th>
                      <th className="p-2 min-w-[150px]">Filtro y Exclusión</th>
                      <th className="p-2 min-w-[170px]">Documentación Médica Excluyente</th>
                      <th className="p-2 min-w-[150px]">Auditoría Centralizada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {SURGERY_SPECIALTY_REQUIREMENTS.map((m) => (
                      <tr key={m.category} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900 whitespace-nowrap">
                          {m.category}
                        </td>
                        <td className="p-2 whitespace-nowrap font-bold text-slate-600">
                          {m.count}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded font-black text-[9px] uppercase bg-slate-100 text-slate-800">
                            {m.carencia}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600">
                          {m.filtro}
                        </td>
                        <td className="p-2">
                          <ul className="list-disc pl-3 space-y-0.5 text-[9px] text-slate-600">
                            {m.documentos.map((d, dIdx) => (
                              <li key={dIdx}>{d}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-2 text-slate-500 text-[9px]">
                          {m.auditoria}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              7. Reintegros de Farmacia y Combustible (Facturación Fiscal, CAE y Topes)
            </h4>
            <p className="text-slate-600">
              <strong>Farmacias (25% - Tope $100.000 mensual):</strong> Reintegro del veinticinco por ciento (25%) de los consumos farmacéuticos hasta un tope máximo mensual de $100.000. Se admite una (1) solicitud por mes calendario mediante comprobante fiscal con factura electrónica clase «B» o «C» con CAE y código QR emitido por farmacia habilitada con fecha del mes en curso. Para medicamentos bajo prescripción médica, es obligatorio adjuntar la orden médica oficial con diagnóstico, firma, sello y matrícula profesional. Quedan excluidos artículos de perfumería o cosmética general que no constituyan medicamentos ni insumos sanitarios. La acreditación en la cuenta bancaria (CBU/Alias) declarada se efectuará dentro de las cuarenta y ocho (48) horas hábiles posteriores a la aprobación de la auditoría.
            </p>
            <p className="text-slate-600">
              <strong>Combustible Axion Energy (10% - Tope $100.000 mensual):</strong> Reintegro del diez por ciento (10%) de consumos exclusivamente en combustible (nafta, gasoil o GNC) en estaciones Axion Energy de todo el país, hasta un tope máximo de $100.000 mensuales. Es requisito excluyente presentar factura electrónica clase «B» o «C» con CAE y código QR emitida por estación de servicio oficial Axion o ticket validado a través de la aplicación oficial ON Axion a nombre del titular. En la factura debe constar el DNI del titular o la patente del automotor declarado en su Declaración Jurada (DDJJ). Quedan expresamente excluidos consumos en tiendas de conveniencia («Spot!»), cafetería, lubricantes sueltos, aditivos y accesorios. La solicitud mensual unificada se presentará entre el día veinticinco (25) y el último día de cada mes calendario; la liquidación en cuenta bancaria se realizará dentro de los primeros cinco (5) días hábiles del mes subsiguiente.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              8. Reintegro de Transporte y Movilidad (Respaldos Oficiales)
            </h4>
            <p className="text-slate-600">
              Reintegro del quince por ciento (15%) mensual en gastos acumulados de transporte público (colectivos, trenes, subtes), peajes y plataformas de movilidad (Uber, Cabify, DiDi), disponible a partir del tercer (3.er) mes ininterrumpido de membresía activa.
            </p>
            <p className="text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
              <strong className="text-slate-900 font-bold">Respaldo Excluyente:</strong> No se liquidarán reintegros por mera manifestación verbal o tickets no nominales. Se exige el resumen oficial de movimientos de la tarjeta SUBE descargado desde el portal oficial argentina.gob.ar/sube o de la aplicación móvil oficial SUBE a nombre del titular, pasajes terrestres de media o larga distancia nominados con DNI, o facturas electrónicas con CAE y código QR emitidas por empresas de transporte de pasajeros o plataformas autorizadas a nombre del titular. La carga de comprobantes se realiza del veinticinco (25) al último día de cada mes; el pago por transferencia bancaria se efectuará dentro de los primeros cinco (5) días hábiles del mes subsiguiente.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              9. Reposición de Documentos, Llaves y Pertenencias (Exclusivo por Robo)
            </h4>
            <p className="text-slate-600">
              Cobertura económica de hasta $50.000 por evento (con un tope máximo de un (1) evento por año calendario) ante la sustracción ilegítima por <strong>robo con violencia o intimidación en las personas</strong> de documentos personales (DNI, pasaporte, cédula), llaves y cerradura del hogar, herramientas de trabajo declaradas u objetos de uso personal (bolso, mochila o cartera).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Denuncia Policial Obligatoria:</strong> Radicada ante la autoridad policial competente dentro de las cuarenta y ocho (48) horas hábiles de acaecido el hecho, consignando fecha, hora, lugar exacto y detalle exhaustivo de lo sustraído. Queda taxativamente excluido en todos los casos el hurto simple (sustracción sin violencia ni fuerza en las cosas), así como pérdidas, extravíos, olvidos o descuidos en la vía pública o transporte.</li>
              <li><strong>Alcance Material de la Cobertura:</strong> La asistencia por bolso, mochila o herramientas cubre el costo de reposición física del contenedor o del instrumental laboral homologado. <strong>No cubre bajo ningún concepto dinero en efectivo sustraído, cheques, títulos valores, joyas, alhajas ni equipos de telefonía celular</strong> (estos últimos cuentan con cobertura tecnológica específica en meses posteriores).</li>
              <li><strong>Facturación con Datos Excluyentes:</strong> Se debe presentar factura electrónica legal clase «B» o «C» con CAE y código QR (de cerrajería, aranceles oficiales de RENAPER/Registro Automotor, o comercio formal de reposición de herramientas o bolso). En el cuerpo de dicha factura debe figurar obligatoriamente: <strong>nombre y apellido completos, número de DNI del usuario y el domicilio fijado en su Declaración Jurada (DDJJ)</strong>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              10. Cobertura de Rotura Accidental de Cristales (Hasta $50.000 por categoría)
            </h4>
            <p className="text-slate-600">
              Asistencia económica de hasta $50.000 ante rotura accidental (con un límite de un (1) evento por año calendario por categoría):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Anteojos:</strong> Receta médica oftalmológica + fotografía clara del cristal roto + factura legal de óptica habilitada con DNI del titular o familiar adherido.</li>
              <li><strong>Vehículos:</strong> Cédula de identificación vehicular (cédula verde) o título a nombre del titular + fotografía del cristal colocado en el vehículo con dominio/patente visible + factura de taller o vidriería donde figure expresamente el dominio/patente.</li>
              <li><strong>Comercio:</strong> Constancia de habilitación municipal o inscripción ante la AFIP en el domicilio comercial registrado + fotografías del cristal dañado + factura oficial de reposición.</li>
              <li><strong>Vivienda:</strong> Constancia de domicilio declarado bajo DDJJ por el socio + fotografías del cristal dañado + factura oficial de vidriería o carpintería.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              11. Accidentes Personales, Gastos Médicos y Odontología Infantil
            </h4>
            <p className="text-slate-600">
              <strong>Accidentes en Vía Pública (Titular $75.000 / Familia $50.000):</strong> Asistencia económica de reintegro ante traumatismos corporales externos, súbitos y violentos acaecidos en la vía pública. Requiere certificado de atención médica de guardia hospitalaria emitido dentro de las cuarenta y ocho (48) horas del hecho, prescripción de curaciones o fármacos y facturas electrónicas clase «B» o «C» con CAE y código QR de farmacia o centro médico a nombre del beneficiario atendido. Quedan terminantemente excluidos siniestros ocurridos bajo efectos de estupefacientes o alcoholemia positiva, participación voluntaria en riñas, deportes de alto riesgo o carreras de velocidad, y afecciones médicas o patologías preexistentes. Límite: un (1) evento por año calendario para el titular y un (1) evento por año calendario para el grupo familiar registrado.
            </p>
            <p className="text-slate-600">
              <strong>Accidentes en el Hogar (Titular $40.000 / Familia $50.000):</strong> Asistencia ante traumatismos domésticos imprevistos (cortes, quemaduras térmicas, caídas accidentales) acaecidos de forma estricta en la vivienda fijada bajo Declaración Jurada (DDJJ) por el socio. Requiere constancia médica de guardia de urgencia indicando el traumatismo doméstico y comprobantes fiscales de farmacia o curaciones con DNI y coincidencia del domicilio de la DDJJ. Límite: un (1) evento por año calendario.
            </p>
            <p className="text-slate-600">
              <strong>Odontología Básica para Menores ($50.000):</strong> Para hijos menores de dieciocho (18) años declarados en la DDJJ familiar. Cubre exclusivamente consultas de urgencia por odontalgia aguda, operatoria dental básica (arreglos de caries simples con composite), extracciones dentarias simples y aplicaciones preventivas de flúor. <strong>Tope máximo de hasta $50.000 en un único reclamo anual no fraccionable por grupo familiar</strong>. Requiere ficha clínica u odontograma oficial con diagnóstico de la pieza tratada, firma y sello con matrícula del odontólogo actuante, más factura oficial clase «B» o «C» con DNI del menor. Quedan expresamente excluidos tratamientos de ortodoncia, ortopedia maxilar, prótesis fijas o removibles, implantes oseointegrados y estética dental o blanqueamientos.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              12. Emergencias del Hogar (Cerrajería, Plomería y Fugas de Gas - Hasta $25.000 por rubro)
            </h4>
            <p className="text-slate-600">
              Asistencia económica de reintegro de hasta $25.000 ante emergencias domésticas imprevistas (con un límite de un (1) evento por año calendario por cada rubro):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Cerrajería y Plomería ($25.000):</strong> Reparaciones urgentes por rotura de cerradura de acceso principal que impida la entrada o salida de la vivienda, o rotura imprevista de cañerías de agua con desborde o filtración activa en el domicilio fijado en DDJJ. Se exige factura electrónica fiscal clase «B» o «C» con CAE y código QR donde figure: <strong>nombre y apellido, DNI del titular y el domicilio fijado en DDJJ</strong>, más registro fotográfico antes y después de la reparación. Excluye obras nuevas, remodelaciones o mantenimiento estético.</li>
              <li><strong>Reparación de Fugas de Gas ($25.000):</strong> Reparación de fugas imprevistas en cañerías o llaves de paso de gas en el domicilio fijado en DDJJ. Por rigurosa seguridad pública y normativa técnica del ENARGAS, la reparación debe ser realizada por un <strong>gasista matriculado habilitado</strong>, debiendo consignar en la factura oficial clase «B» o «C» su número de matrícula oficial y categoría. Excluye compra o instalación de nuevos artefactos (cocinas, termotanques) o ampliaciones de red.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              13. Robos en Extracciones de Efectivo (Sucursal, Cajeros Automáticos y Comercios - $50.000)
            </h4>
            <p className="text-slate-600">
              Cobertura económica indemnizatoria de hasta $50.000 (o el monto extraído si fuere menor) ante la sustracción ilegítima por <strong>robo con violencia o intimidación con armas</strong> del dinero en efectivo retirado por el titular (con un límite de un (1) evento por año calendario):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Robo en Extracción por Sucursal Bancaria:</strong> Ocurrido dentro de la sucursal o en un radio perimetral de doscientos (200) metros de la entidad bancaria, dentro de los sesenta (60) minutos posteriores a la extracción por ventanilla. Requiere adjuntar el comprobante oficial de caja bancaria a nombre del titular y copia de la denuncia policial efectuada dentro de las veinticuatro (24) horas de acaecido el hecho.</li>
              <li><strong>Robo en Extracción por Cajero Automático (ATM):</strong> Ocurrido en el recinto del cajero o a no más de cien (100) metros de distancia, dentro de los treinta (30) minutos de realizada la extracción. Requiere comprobante o ticket emitido por el cajero automático de la red (Banelco/Link) con tarjeta de débito del titular y denuncia policial radicada dentro de las veinticuatro (24) horas del hecho.</li>
              <li><strong>Robo en Extracción en Comercios Adheridos («Cashback»):</strong> Ocurrido al salir del local o a no más de cien (100) metros de distancia, dentro de los treinta (30) minutos de la operación. Requiere ticket fiscal comercial oficial con la leyenda discriminada de <strong>«Retiro de Efectivo» o «Cashback»</strong> realizada con la tarjeta de débito del titular, y denuncia policial radicada dentro de las veinticuatro (24) horas del hecho.</li>
            </ul>
            <p className="text-slate-600 text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <strong>Exclusiones Terminantes:</strong> Quedan excluidos hurtos por descuido o pérdidas, estafas informáticas, secuestros virtuales, retenciones de tarjeta en cajeros por fallas operativas o reclamos que no cuenten con el ticket bancario o comercial original coincidente en fecha y hora.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              14. Acceso al Programa de Financiamiento a Tasas Mínimas (Casa, Auto o Moto)
            </h4>
            <p className="text-slate-600">
              El beneficio de acceso a financiación subsidiada a tasas mínimas para adquisición de vivienda (Casa) o vehículos (Auto o Moto) se desbloquea a partir del sexto (6.°) mes ininterrumpido de membresía activa con cuota al día, bajo las siguientes condiciones de elegibilidad y evaluación de riesgo:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Sujeción a Evaluación Crediticia y Calificación:</strong> El otorgamiento del crédito no es automático; está sujeto a análisis de solvencia patrimonial, capacidad de repago demostrable (relación cuota/ingreso máxima del 30%) y aprobación final por el comité financiero de RedEconomiX.</li>
              <li><strong>Destino Específico y Garantía Real:</strong> Los fondos se asignan de forma exclusiva e irrevocable a la compra del bien registrable seleccionado, debiendo constituirse hipoteca en primer grado sobre el inmueble o prenda con registro sobre el vehículo automotor o motovehículo a inscribirse en el Registro correspondiente. No se otorgan préstamos en efectivo de libre disponibilidad.</li>
              <li><strong>Requisitos de Empleo:</strong> Empleados públicos o privados bajo relación de dependencia requieren un mínimo de cinco (5) años de antigüedad laboral continuada demostrable con recibos de sueldo y constancia de libre de inhibiciones. Trabajadores independientes o no registrados requieren al menos un (1) año de antigüedad en la plataforma y presentación de fiador o codeudor solidario con solvencia acreditada o bien inmueble libre de gravámenes en garantía.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              15. Reparaciones Menores, Seguridad Electrónica y Daño de Celular
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Reparaciones Menores a Domicilio ($75.000):</strong> Asistencia económica para resolver fallas eléctricas imprevistas (cortocircuitos, disyuntor averiado), desperfectos de aberturas o filtraciones de mampostería en la vivienda fijada en DDJJ. Excluye obras nuevas, pintura integral, remodelaciones estéticas o compra de electrodomésticos. Requiere factura electrónica fiscal clase «B» o «C» con CAE y código QR detallando materiales y mano de obra con nombre, DNI del titular y domicilio fijado en DDJJ, más fotografías antes y después del arreglo. Límite: un (1) evento por año calendario.</li>
              <li><strong>Seguridad de Hogar / Reparación de Cámaras ($50.000):</strong> Asistencia para el servicio técnico y recambio de componentes dañados de sistemas de videovigilancia preexistentes (CCTV, DVR, cableado o cámaras) en el domicilio declarado. Excluye instalación de sistemas nuevos desde cero o locales comerciales. Requiere factura de servicio técnico oficial con DNI y domicilio de DDJJ. Límite: un (1) evento por año calendario.</li>
              <li><strong>Daño Accidental de Celular ($75.000):</strong> Reintegro ante rotura accidental física o quiebre de pantalla o módulo táctil por impacto o caída involuntaria del teléfono móvil del titular. Excluye fallas de software, desgaste normal de batería, equipos obsoletos sin línea activa o daños por humedad intencional. Requiere factura electrónica fiscal clase «B» o «C» de servicio técnico habilitado donde conste en el cuerpo: <strong>nombre, DNI, marca, modelo y número de IMEI (15 dígitos) del equipo reparado</strong>, junto con fotografía de la pantalla rota y fotografía del equipo reparado encendido mostrando el código *#06#. Límite: un (1) evento por año calendario.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              16. Coberturas Indemnizatorias por Incendio (Vivienda y Comercio)
            </h4>
            <p className="text-slate-600">
              Protección económica indemnizatoria ante daños materiales provocados por la acción directa del fuego en la vivienda familiar fijada en DDJJ o en el local comercial adherido y registrado a nombre del titular:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Incendio Parcial 25% ($100.000):</strong> Daños estructurales o de contenido verificados en al menos un ambiente o dependencia del inmueble (hasta un cuarto de la superficie total).</li>
              <li><strong>Incendio Parcial 50% ($200.000):</strong> Afectación destructiva verificada de al menos la mitad de los ambientes o de las mercaderías o maquinarias del inmueble.</li>
              <li><strong>Incendio Total ($500.000):</strong> Destrucción total o inhabitabilidad definitiva y ruina declarada por autoridades técnicas competentes.</li>
            </ul>
            <p className="text-slate-600 text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <strong>Requisitos Formales y Exclusiones:</strong> Es condición indispensable adjuntar el <strong>acta o informe técnico oficial emitido por el Cuerpo de Bomberos de la jurisdicción</strong> (Policía o Bomberos Voluntarios) y peritaje donde conste la fecha, hora, causa técnica del fuego, domicilio exacto y magnitud del daño. En comercios se exige habilitación municipal o constancia de inscripción ante la AFIP activa y coincidente. Quedan expresamente excluidos siniestros provocados con dolo o culpa grave del asegurado, sobrecargas eléctricas por conexiones clandestinas, pirotecnia o almacenamiento ilegal de sustancias inflamables. Límite: una (1) indemnización por siniestro por año calendario.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              17. Cobertura de Movilidad (Robo de Motos y Daños a Terceros - Mes 7)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Robo de Motos ($200.000):</strong> Asistencia económica de reintegro ante el robo total del motovehículo del titular mediante violencia en las personas o fuerza en las cosas. Requisitos excluyentes: El rodado debe estar registrado en la DDJJ automotor previa al siniestro y a nombre del titular o cónyuge. Se debe adjuntar copia de la denuncia policial oficial radicada dentro de las cuarenta y ocho (48) horas hábiles y constancia de <strong>Denuncia de Robo radicada ante la DNRPA (Dirección Nacional del Registro de la Propiedad Automotor)</strong>. Excluye hurtos por dejar la moto sin medidas de seguridad o la llave colocada. Límite: un (1) evento por año calendario.</li>
              <li><strong>Daños a Terceros ($200.000):</strong> Asistencia económica complementaria ante daños materiales involuntarios causados a vehículos o bienes de terceros en siniestros viales en la vía pública protagonizados por el automotor o moto del titular registrado en la DDJJ. Requisitos excluyentes: Licencia de conducir habilitante vigente, comprobante de seguro automotor obligatorio al día (Ley Nacional de Tránsito N° 24.449) y constancia de denuncia formal de siniestro ante la compañía aseguradora más el acta de choque policial labrada dentro de las setenta y dos (72) horas del hecho. Quedan excluidos siniestros bajo efectos de alcohol, sustancias o competencias de velocidad. Límite: un (1) evento por año calendario.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              18. Estabilidad Laboral y Mantenimiento Vehicular (Mes 8)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Fondo de Desempleo ($200.000 - Exclusivo Plan Total):</strong> Asistencia de pago único ante despido intempestivo para socios del Plan Total con un mínimo de ocho (8) meses ininterrumpidos en el plan. Requisito de elegibilidad: Relación de dependencia formal con al menos dos (2) años continuos de antigüedad laboral en la misma empresa (aportes acreditados en el Sistema Integrado Previsional Argentino - SIPA/AFIP). Causal excluyente: Despido sin justa causa (Art. 245 de la Ley de Contrato de Trabajo N° 20.744) acreditado mediante Carta Documento original o telegrama colacionado de despido (TCL) más la constancia de baja emitida por la AFIP. Quedan terminantemente excluidas renuncias voluntarias, retiros consensuados, finalización de contratos a plazo fijo o despidos disciplinarios con justa causa (Art. 242 LCT). Límite: una (1) prestación cada veinticuatro (24) meses.</li>
              <li><strong>Reparación de Vehículo ($100.000):</strong> Asistencia económica ante rotura mecánica o eléctrica grave de motor, caja de velocidades, embrague, sistema de frenos o tren delantero que impida la tracción del automóvil o motovehículo registrado en DDJJ a nombre del socio. Requiere factura electrónica fiscal clase «B» o «C» de taller mecánico habilitado con CAE detallando diagnóstico y en el cuerpo: nombre, DNI del titular y domicilio fijado en la DDJJ. Excluye mantenimiento de rutina, cambio de neumáticos, lubricantes o modificaciones estéticas. Límite: un (1) evento por año calendario.</li>
              <li><strong>Remolque Vehicular ($50.000):</strong> Reintegro ante gastos de traslado por grúa o auxilio mecánico por avería o accidente en la vía pública a una distancia mayor a diez (10) kilómetros del domicilio fijado en la DDJJ. Requiere factura electrónica clase «B» o «C» con CAE de empresa de remolque habilitada con indicación de dominio/patente, origen y destino del traslado. Límite: un (1) evento por año calendario.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              19. Tecnología y Dispositivos (Robo de Celular y Computadora Portátil - Meses 9 y 10)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Robo de Celular ($150.000 - Mes 9):</strong> Asistencia económica ante sustracción por robo con violencia o intimidación en la vía pública o transporte. Requisitos obligatorios: Denuncia policial oficial radicada dentro de las cuarenta y ocho (48) horas hábiles, <strong>certificado oficial de bloqueo de línea y de equipo por código IMEI emitido por la empresa de telefonía o el ENACOM</strong>, y factura legal clase «B» o «C» de compra de equipo de reposición con nombre, DNI del titular y domicilio fijado en la DDJJ. Quedan excluidos extravíos, pérdidas o hurtos simples sin violencia. Límite: un (1) evento por año calendario.</li>
              <li><strong>Robo de Notebook ($200.000 - Mes 10):</strong> Asistencia ante robo con fuerza en las cosas o violencia en las personas de computadora portátil de uso laboral o de estudio del titular. Requiere denuncia policial detallando marca, modelo y número de serie («Serial Number»), y factura electrónica fiscal clase «B» o «C» de reposición con nombre, DNI y domicilio fijado en la DDJJ. Excluye olvidos o descuidos en lugares públicos. Límite: un (1) evento por año calendario.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              20. Protección Mayor e Invalidez (Mes 10)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Invalidez Permanente ($500.000):</strong> Indemnización de pago único ante invalidez total y permanente sobrevenida derivada de accidente o enfermedad, dictaminada con una pérdida de capacidad laborativa superior al 66% por la Comisión Médica Central (Superintendencia de Riesgos del Trabajo - SRT/ANSES) o junta médica judicial homologada. Quedan estrictamente excluidas minusvalías o patologías preexistentes al ingreso del socio.</li>
              <li><strong>Invalidez Temporaria ($250.000):</strong> Asistencia económica ante reposo o incapacidad física temporal ininterrumpida mayor a cuarenta y cinco (45) días corridos prescripta por médico especialista como derivación directa de un accidente o una enfermedad aguda inculpable. Requiere historia clínica completa, imágenes diagnósticas concluyentes y certificados médicos oficiales con firma, sello y matrícula.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              21. Subsidios Extraordinarios por Eventos Familiares (Meses 10, 11 y 12)
            </h4>
            <p className="text-slate-600 text-xs">
              Los subsidios familiares por acontecimientos de vida del Plan Total rigen con estricta exigencia de permanencia ininterrumpida previa con cuota al día:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Kit Nacimiento ($500.000 en 2 cuotas de $250.000 + Caja de Leche durante 6 meses - Mes 10):</strong> Requiere diez (10) meses continuos de antigüedad activa previos al parto. Partida oficial de nacimiento con fecha posterior al cumplimiento del décimo (10.°) mes.</li>
              <li><strong>Kit Casamiento ($500.000 - Mes 11):</strong> Requiere once (11) meses de antigüedad activa previos al matrimonio civil. Acta o libreta de matrimonio oficial con fecha posterior al cumplimiento del undécimo (11.°) mes.</li>
              <li><strong>Kit Adopción ($500.000 en 2 cuotas de $250.000 - Mes 12):</strong> Requiere doce (12) meses (un año) continuos previos a la sentencia judicial definitiva de adopción.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              22. Beneficios de Nivel Premium Anual (Mes 12)
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Aporte Jubilatorio y Previsión Social ($250.000):</strong> Asistencia extraordinaria anual de pago único para regularización de aportes previsionales (moratorias previsionales ANSES, Régimen de Monotributo o Cajas de Previsión Profesional) para asociados con un (1) año ininterrumpido con cuota al día, presentando el correspondiente Volante Electrónico de Pago (VEP) o boleta cancelada.</li>
              <li><strong>Asistencia por Mudanza ($100.000):</strong> Reintegro por cambio definitivo de residencia familiar del titular. Requiere nuevo contrato de locación timbrado o título de propiedad/certificado de domicilio y factura legal clase «B» o «C» con CAE de empresa de mudanzas o flete habilitada con nombre, DNI y origen/destino coincidentes. Límite: un (1) evento por año calendario.</li>
              <li><strong>Asistencia para Alquiler ($200.000) y Asistencia para Madres Solteras ($200.000):</strong> Subsidio extraordinario para solventar el canon locativo habitacional. Requiere contrato formal de locación vigente a nombre del titular y comprobante fiscal de pago. En el caso del beneficio para madres solteras, se exige acreditación fehaciente de hijos menores de edad a cargo exclusivo sin cónyuge ni conviviente declarado en la DDJJ. Límite: un (1) evento por año calendario.</li>
              <li><strong>Roturas de Hogar ($50.000) y Pintura ($50.000):</strong> Reintegros para adquisición de materiales y mano de obra de mantenimiento en la vivienda familiar fijada en la DDJJ. Para la asistencia en pintura se requiere factura clase «B» o «C» de pinturería comercial por pintura látex blanca y registro fotográfico de la vivienda pintada. Límite: un (1) evento por año calendario por vivienda.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              23. Cobertura de Enfermedades Graves (Nómina Taxativa)
            </h4>
            <p className="text-slate-600">
              Asistencia económica de pago único ante el <strong>primer diagnóstico</strong> de una enfermedad grave sobrevenida con posterioridad a la afiliación (Titular $400.000 / Familiar adherido $300.000). Para eliminar ambigüedades subjetivas, la cobertura comprende taxativa y exclusivamente:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
              <li><strong>Cáncer:</strong> Neoplasias malignas invasivas confirmadas por biopsia anatomopatológica concluyente.</li>
              <li><strong>Infarto Agudo de Miocardio:</strong> Con elevación de enzimas cardíacas y alteraciones electrocardiográficas concluyentes.</li>
              <li><strong>Accidente Cerebrovascular (ACV):</strong> Con secuela o déficit neurológico persistente evaluado por médico neurólogo.</li>
              <li><strong>Insuficiencia Renal Crónica Terminal:</strong> Con requerimiento obligatorio de diálisis peritoneal o hemodiálisis permanente.</li>
              <li><strong>Trasplante de Órganos Vitales:</strong> Corazón, pulmón, hígado, riñón o médula ósea.</li>
            </ul>
            <p className="text-slate-600 text-xs">
              Quedan terminantemente excluidas todas las afecciones preexistentes al ingreso del socio y los cuadros clínicos habituales no incluidos en esta nómina taxativa.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              24. Sorteos Mensuales de Ropa de Trabajo y Beneficios Plan Total
            </h4>
            <p className="text-slate-600">
              <strong>Sorteos Mensuales de Ropa de Trabajo:</strong> Participan exclusivamente los asociados activos con cuota al día pertenecientes a las Fuerzas Armadas o de Seguridad (uniforme táctico + calzado), Salud (ambo sanitario premium) y Docencia (guardapolvo oficial + kit escolar), acreditando su labor mediante credencial funcional o recibo salarial oficial.
            </p>
            <p className="text-slate-600">
              <strong>Beneficios Plan Total:</strong> El Regalo de Cumpleaños aplica para el titular y su grupo familiar primario declarado bajo DDJJ (con un límite de un (1) cónyuge y hasta cinco (5) hijos menores de dieciocho (18) años). El Desayuno Sorpresa Aniversario para dos personas se adjudica anualmente a miembros del Plan Total que cuenten con grupo familiar registrado y un mínimo de tres (3) meses de antigüedad ininterrumpida.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              25. Protección de Datos Personales (Ley 25.326)
            </h4>
            <p className="text-slate-600">
              El titular presta consentimiento libre, expreso e informado para que RedEconomiX procese y archive sus datos personales y médicos con la exclusiva finalidad de administrar la cobertura, coordinar la logística y auditar las prestaciones, bajo rigurosos protocolos de confidencialidad y seguridad informática.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              26. Revocación y Derecho de Arrepentimiento
            </h4>
            <p className="text-slate-600">
              Conforme al Art. 34 de la Ley 24.240 y la Resolución 424/2020 de la Secretaría de Comercio Interior, el socio tiene derecho a revocar la suscripción o dar de baja el servicio en cualquier momento desde su panel de usuario o comunicándose formalmente con la empresa, sin costos de cancelación ni penalidades.
            </p>
          </section>
        </div>

        {/* Footer de Aceptación */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
          <div className="flex items-start space-x-2.5">
            <Checkbox
              id="legal-accept-checkbox"
              checked={hasAccepted}
              onCheckedChange={(checked) => setHasAccepted(checked === true)}
              className="mt-0.5 h-4 w-4 border-slate-300 data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000]"
            />
            <label
              htmlFor="legal-accept-checkbox"
              className="text-[11px] font-bold text-slate-700 leading-snug cursor-pointer select-none"
            >
              Declaro haber leído, comprendido y aceptado en su totalidad el <strong>Aviso Legal</strong>, Bases y Condiciones y Política de Privacidad de RedEconomiX Bienestar conforme a la Ley 25.506.
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              disabled={!hasAccepted}
              onClick={handleConfirm}
              className={`flex-1 h-11 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                hasAccepted
                  ? 'bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-md shadow-red-500/25 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Aceptar Políticas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
