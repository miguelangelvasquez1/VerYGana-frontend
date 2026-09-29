import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones | Ver y Gana",
  description:
    "Términos y Condiciones para Usuarios de VERYGANA. Versión 1 — Vigencia: octubre de 2026.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] text-white px-6 py-5 flex items-center gap-4">
        <Link href="/">
          <Image src="/logos/logoDorado.png" alt="Ver y Gana" width={40} height={40} />
        </Link>
        <span className="font-bold text-lg">Ver y Gana</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Portada */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-[#0b1440] mb-2">
            Términos y Condiciones para Usuarios VERYGANA
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Ecosistema Tecnológico de Activación Comercial Basado en Gamificación,
            Inteligencia Comercial, Fidelización e Incentivos Promocionales
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
            <span>Versión: <strong className="text-gray-600">1</strong></span>
            <span>Última actualización: <strong className="text-gray-600">septiembre de 2026</strong></span>
            <span>Vigencia: <strong className="text-gray-600">octubre de 2026</strong></span>
          </div>
          <p className="mt-4 text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Los presentes Términos y Condiciones regulan el acceso, registro, permanencia y
            utilización de la plataforma tecnológica VERYGANA por parte de sus usuarios.
            Se recomienda leer cuidadosamente este documento antes de registrarse o utilizar
            cualquiera de las funcionalidades de la plataforma.
          </p>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <TermsContent />
        </div>

        {/* Volver */}
        <div className="mt-8 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm text-[#03548C] font-semibold hover:underline"
          >
            ← Volver al registro
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-bold text-[#0b1440] uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-[#03548C] mb-1">{title}</h3>
      <div className="text-sm text-gray-700 space-y-2">{children}</div>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-[#0b1440] bg-gray-50 border border-gray-200 rounded px-3 py-1.5 inline-block my-1">
      {children}
    </p>
  );
}

function TermsContent() {
  return (
    <>
      <Section title="Capítulo 1: Aceptación de los Términos y Condiciones">
        <Sub title="1.1. Objeto y alcance">
          <p>Los presentes Términos y Condiciones regulan el registro, acceso, permanencia y utilización de la plataforma tecnológica VERYGANA por parte de sus Usuarios, así como las relaciones jurídicas, comerciales, promocionales y tecnológicas que puedan surgir con ocasión de su participación dentro del Ecosistema VERYGANA.</p>
          <p>Podrán complementar estos Términos y Condiciones, entre otros: la Política de Tratamiento de Datos Personales; las Condiciones Particulares de campañas promocionales; las reglas específicas de juegos y actividades de gamificación; las condiciones aplicables a Llaves Promocionales y demás beneficios; las condiciones de los Beneficios de Conectividad; y los demás documentos que sean puestos a disposición del Usuario.</p>
        </Sub>
        <Sub title="1.2. Aceptación libre, previa e informada">
          <p>La aceptación deberá realizarse de manera libre, previa, expresa e informada mediante el mecanismo electrónico habilitado por la Plataforma. Al aceptar, el Usuario declara que ha tenido la oportunidad razonable de consultar los Términos, comprende que regulan su relación con VERYGANA, y que su aceptación electrónica podrá quedar registrada como Evidencia Digital.</p>
          <Rule>ACEPTAR LOS TÉRMINOS ≠ RENUNCIAR A DERECHOS IRRENUNCIABLES</Rule>
        </Sub>
        <Sub title="1.3. Momento de aceptación">
          <p>Los presentes Términos se entenderán aceptados cuando el Usuario complete válidamente el mecanismo electrónico dispuesto por VERYGANA. Para crear y activar una Cuenta de Usuario será necesaria la aceptación válida de los documentos obligatorios vigentes al momento del registro.</p>
        </Sub>
        <Sub title="1.6. Modificaciones">
          <p>VERYGANA podrá modificar estos Términos cuando resulte necesario. Las nuevas disposiciones producirán efectos hacia el futuro y no podrán utilizarse para modificar retroactivamente Operaciones Perfeccionadas ni desconocer derechos irrenunciables.</p>
          <Rule>NUEVA REGLA ≠ MODIFICACIÓN RETROACTIVA AUTOMÁTICA</Rule>
        </Sub>
      </Section>

      <Section title="Capítulo 2: Principios del Ecosistema VERYGANA">
        <p className="text-sm mb-4">VERYGANA es una plataforma tecnológica de activación comercial que integra herramientas de gamificación, beneficios promocionales, mecanismos de fidelización e interacción entre Usuarios y Empresarios.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ["2.1 Buena fe", "Todos los participantes deberán actuar de buena fe, suministrando información verdadera y utilizando las funcionalidades de acuerdo con su finalidad legítima."],
            ["2.2 Legalidad", "Todas las actividades deberán ajustarse a la Constitución Política de Colombia y la legislación aplicable."],
            ["2.3 Transparencia", "VERYGANA procurará que las reglas esenciales sean informadas de manera clara, suficiente, comprensible y oportuna."],
            ["2.4 Equilibrio contractual", "Las relaciones deberán preservar un equilibrio razonable entre los derechos y obligaciones de los participantes."],
            ["2.11 Seguridad e integridad", "VERYGANA podrá implementar medidas técnicas y organizacionales razonables para proteger la Plataforma, las Cuentas y las operaciones."],
            ["2.12 Separación beneficios/dinero", "Los beneficios promocionales no constituyen dinero, depósito, ahorro, inversión, crédito ni instrumento financiero."],
          ].map(([t, d]) => (
            <div key={t} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-[#03548C] mb-1">{t}</p>
              <p className="text-xs text-gray-600">{d}</p>
            </div>
          ))}
        </div>
        <Rule>ALERTA ≠ FRAUDE CONFIRMADO — MEDIDA PREVENTIVA ≠ SANCIÓN DEFINITIVA</Rule>
      </Section>

      <Section title="Capítulo 5: Registro, Creación y Administración de la Cuenta de Usuario">
        <Sub title="5.1. Requisito de registro">
          <p>Para completar el registro, la persona deberá: ser persona natural mayor de dieciocho (18) años; contar con capacidad legal; suministrar información verdadera, completa y actualizada; completar las verificaciones de identidad y seguridad; y aceptar expresamente los presentes Términos y Condiciones.</p>
          <Rule>REGISTRO INICIADO ≠ CUENTA ACTIVA</Rule>
        </Sub>
        <Sub title="5.2. Mayoría de edad y exclusión de menores">
          <p>VERYGANA está destinada exclusivamente a personas naturales mayores de dieciocho (18) años. Los niños, niñas y adolescentes no podrán registrarse, crear o utilizar una Cuenta de Usuario. La gratuidad de una actividad no elimina esta restricción.</p>
          <p>La autorización, consentimiento o supervisión de un padre, madre o representante legal no habilita a un menor para registrarse o utilizar VERYGANA mientras la Plataforma mantenga la edad mínima de dieciocho (18) años.</p>
          <Rule>AUTORIZACIÓN PARENTAL ≠ AUTORIZACIÓN PARA REGISTRAR A UN MENOR</Rule>
        </Sub>
        <Sub title="5.3. Declaración y verificación de mayoría de edad">
          <p>Al completar el registro, la persona declara que ha cumplido dieciocho (18) años, que la fecha de nacimiento suministrada es verdadera, y que los datos de identificación utilizados le pertenecen legítimamente.</p>
          <Rule>ALERTA DE EDAD ≠ MINORÍA DE EDAD CONFIRMADA</Rule>
        </Sub>
        <Sub title="5.4. Tratamiento de Cuentas utilizadas por menores">
          <p>Cuando se confirme que una Cuenta pertenece o está siendo utilizada por un menor, VERYGANA podrá terminarla. La terminación no convertirá beneficios internos en dinero, ni eliminará Operaciones Perfeccionadas, garantías, reclamaciones pendientes ni obligaciones legales.</p>
          <p>Cuando la persona alcance los dieciocho (18) años, podrá solicitar un nuevo registro. El nuevo registro no reactivará beneficios vencidos.</p>
        </Sub>
        <Sub title="5.7. Cuenta única">
          <p>Por regla general, cada Usuario podrá mantener una sola Cuenta activa. La detección de registros similares podrá dar lugar a verificación, pero no constituirá por sí sola fraude confirmado.</p>
          <Rule>POSIBLE DUPLICIDAD ≠ FRAUDE CONFIRMADO</Rule>
        </Sub>
        <Sub title="5.8. Estados de la Cuenta">
          <p>La Cuenta podrá atravesar los siguientes estados: registro iniciado · pendiente de aceptación · pendiente de verificación · pendiente de activación · activa · restringida preventivamente · suspendida · terminada.</p>
        </Sub>
        <Sub title="5.11. Cambio de número telefónico">
          <p>El cambio de número no implicará la creación de una nueva Cuenta. Una vez validado el cambio, se conservarán la antigüedad, Llaves, Puntos, Oportunidades, Participaciones, Categoría, Ranking, Mascota, compras y reclamaciones. El cambio no revive beneficios vencidos ni convierte al Usuario en Nuevo Usuario Beneficiario.</p>
          <Rule>CAMBIO DE NÚMERO ≠ NUEVA CUENTA — CAMBIO DE NÚMERO ≠ NUEVO USUARIO BENEFICIARIO</Rule>
        </Sub>
        <Sub title="5.16. Efectos de la suspensión o terminación">
          <p>La restricción, suspensión o terminación de una Cuenta no eliminará automáticamente Operaciones Perfeccionadas, obligaciones pendientes, garantías, reclamaciones, devoluciones ni obligaciones relativas a datos personales.</p>
          <Rule>TERMINACIÓN DE LA CUENTA ≠ EXTINCIÓN AUTOMÁTICA DE DERECHOS IRRENUNCIABLES</Rule>
        </Sub>
      </Section>

      <Section title="Capítulo 7: Derechos y Obligaciones del Usuario">
        <p className="text-sm mb-4">El Usuario gozará de todos los derechos reconocidos en estos Términos, en las Condiciones Particulares y en la legislación colombiana, incluyendo los derechos reconocidos por las normas sobre protección al consumidor, comercio electrónico y protección de datos personales.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Información clara, suficiente y oportuna",
            "Libre elección y participación voluntaria",
            "Trato equitativo y criterios objetivos",
            "Calidad, idoneidad y seguridad",
            "Protección frente a publicidad engañosa",
            "Corrección de errores y Trazabilidad",
            "Presentar peticiones, quejas y reclamaciones",
            "Protección de datos personales",
            "Solicitar la cancelación de la Cuenta",
            "Ejercicio de derechos sin represalias",
          ].map((d) => (
            <div key={d} className="flex items-center gap-2 text-xs text-gray-700">
              <span className="text-[#03548C] font-bold">✓</span> {d}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Capítulo 8: Naturaleza Jurídica de las Llaves Promocionales">
        <Sub title="8.2. Naturaleza exclusivamente promocional">
          <p>Las Llaves Promocionales no constituyen dinero, moneda de curso legal, depósito, ahorro, inversión, crédito, título valor ni instrumento financiero. No generan intereses ni son redimibles en efectivo.</p>
          <Rule>LLAVES PROMOCIONALES ≠ DINERO</Rule>
        </Sub>
        <Sub title="8.4. Sin equivalencia monetaria fija">
          <p>Las Llaves no poseen una tasa de cambio fija, universal, irrevocable o garantizada frente al peso colombiano ni frente a ninguna otra moneda.</p>
          <Rule>REFERENCIA EN PESOS ≠ VALOR MONETARIO FIJO DE LAS LLAVES</Rule>
        </Sub>
      </Section>

      <Section title="Capítulos 9–12: Llaves — Obtención, Administración y Uso">
        <div className="space-y-2 text-sm">
          <p><strong>Capítulo 9:</strong> Las Llaves se originan únicamente mediante actividades, campañas o mecanismos expresamente habilitados. La participación en Juegos Promocionales ordinarios no está condicionada al pago de dinero.</p>
          <p><strong>Capítulo 10:</strong> VERYGANA administra las Llaves con Trazabilidad, estados diferenciados (pendiente, disponible, reservado, utilizado, vencido) y Libro Mayor de Llaves.</p>
          <p><strong>Capítulo 11:</strong> Las Llaves se utilizan exclusivamente en las funcionalidades habilitadas. Su uso no implica retiro de dinero ni renuncia a garantías del consumidor.</p>
          <p><strong>Capítulo 12:</strong> En operaciones ordinarias, la Porción en Llaves puede cubrir hasta el 50% del valor. El Copago es la parte en dinero a cargo del Usuario.</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["LLAVES ≠ DINERO", "VENCIMIENTO ≠ SANCIÓN", "SIMULACIÓN ≠ REDENCIÓN", "RESERVA ≠ CONSUMO"].map((r) => (
            <Rule key={r}>{r}</Rule>
          ))}
        </div>
      </Section>

      {/* Pie */}
      <div className="mt-10 pt-6 border-t border-gray-100 text-xs text-gray-400 text-center space-y-1">
        <p>Versión 1 · Última actualización: septiembre de 2026 · Entrada en vigencia: octubre de 2026</p>
        <p>Este documento puede actualizarse. La versión vigente siempre estará disponible en esta página.</p>
      </div>
    </>
  );
}
