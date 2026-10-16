// Textos legales de Eazy Stock (15-oct-2026). Fabrizio Farfan sacó su Partita IVA
// (Einzelunternehmer, Kleinunternehmer § 19 UStG) en Berlín y la web necesita, por ley
// alemana, un Impressum (§ 5 DDG) y una Datenschutzerklärung (DSGVO). Las dos tienen
// versión alemana (vinculante: el Impressum es el texto que dictó el asesor) + español
// e inglés como traducción de cortesía para nuestros usuarios (16-oct-2026).
// Datos: Contabo GmbH es el hoster (servidor en la UE); no hay analítica ni rastreo;
// localStorage solo técnico (sesión, idioma, menú) → sin banner de cookies.

export const LEGAL_ENTITY = {
  name: 'Fabrizio Farfan',
  brand: 'Eazy Life',
  street: 'Sprengelstraße 7',
  city: '13353 Berlin',
  country: 'Deutschland',
  phone: '+49 155 11384643',
  email: 'kontakt.eazylife@gmail.com',
}

/**
 * Impressum (§ 5 DDG). El alemán es el texto que dictó el asesor y el único con
 * valor legal; las versiones en español e inglés son una traducción de cortesía
 * para nuestros usuarios (Frank, 16-oct-2026: «¿por qué el Impressum solo en
 * alemán si la privacidad cambia de idioma?»). Misma pestaña que la Datenschutz.
 */
export const IMPRESSUM_LANGS = [
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

const IMPRESSUM_IDENTITY = [
  LEGAL_ENTITY.name,
  `${LEGAL_ENTITY.brand} (Geschäftsbezeichnung)`,
  LEGAL_ENTITY.street,
  LEGAL_ENTITY.city,
  LEGAL_ENTITY.country,
]

export const IMPRESSUM = {
  de: {
    title: 'Impressum',
    kicker: 'Rechtliche Hinweise',
    sub: 'Angaben zum Anbieter von eazy-stock.com nach deutschem Recht (§ 5 DDG).',
    note: null,
    blocks: [
      { h: 'Angaben gemäß § 5 DDG', lines: IMPRESSUM_IDENTITY },
      { h: 'Kontakt', lines: [`Telefon: ${LEGAL_ENTITY.phone}`, `E-Mail: ${LEGAL_ENTITY.email}`] },
      { p: [
        'Eazy Life ist eine Geschäftsbezeichnung von Fabrizio Farfan, Einzelunternehmer.',
        'Umsatzsteuer: Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
      ] },
      { h: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV', lines: [`${LEGAL_ENTITY.name}, Anschrift wie oben`] },
      { h: 'Verbraucherstreitbeilegung', p: [
        'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
      ] },
    ],
  },
  es: {
    title: 'Aviso legal (Impressum)',
    kicker: 'Aviso legal',
    sub: 'Datos del responsable de eazy-stock.com según la ley alemana (§ 5 DDG).',
    note: 'Traducción de cortesía. La versión alemana («Deutsch») es la única con valor legal.',
    blocks: [
      { h: 'Datos según el § 5 de la DDG (ley alemana de servicios digitales)', lines: IMPRESSUM_IDENTITY },
      { h: 'Contacto', lines: [`Teléfono: ${LEGAL_ENTITY.phone}`, `Correo: ${LEGAL_ENTITY.email}`] },
      { p: [
        'Eazy Life es el nombre comercial de Fabrizio Farfan, empresario individual.',
        'IVA: según el § 19 de la UStG (régimen de pequeño empresario) no se cobra IVA.',
      ] },
      { h: 'Responsable del contenido según el § 18 (2) del MStV', lines: [`${LEGAL_ENTITY.name}, dirección indicada arriba`] },
      { h: 'Resolución de litigios de consumo', p: [
        'No estamos dispuestos ni obligados a participar en procedimientos de resolución de litigios ante una junta arbitral de consumo.',
      ] },
    ],
  },
  en: {
    title: 'Legal notice (Impressum)',
    kicker: 'Legal notice',
    sub: 'Details of the provider of eazy-stock.com under German law (§ 5 DDG).',
    note: 'Courtesy translation. Only the German version ("Deutsch") is legally binding.',
    blocks: [
      { h: 'Information pursuant to § 5 DDG (German Digital Services Act)', lines: IMPRESSUM_IDENTITY },
      { h: 'Contact', lines: [`Phone: ${LEGAL_ENTITY.phone}`, `Email: ${LEGAL_ENTITY.email}`] },
      { p: [
        'Eazy Life is the trade name of Fabrizio Farfan, sole proprietor.',
        'VAT: in accordance with § 19 UStG (small business scheme) no VAT is charged.',
      ] },
      { h: 'Responsible for content pursuant to § 18 (2) MStV', lines: [`${LEGAL_ENTITY.name}, address as above`] },
      { h: 'Consumer dispute resolution', p: [
        'We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.',
      ] },
    ],
  },
}

/** Fecha de la Datenschutz; se muestra en cada idioma. */
export const PRIVACY_UPDATED = { de: 'Stand: 15. Oktober 2026', es: 'Última actualización: 15 de octubre de 2026', en: 'Last updated: October 15, 2026' }

export const PRIVACY_LANGS = [
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

const ADDRESS = `${LEGAL_ENTITY.name} · ${LEGAL_ENTITY.brand} · ${LEGAL_ENTITY.street} · ${LEGAL_ENTITY.city} · ${LEGAL_ENTITY.country}`

export const PRIVACY = {
  de: {
    title: 'Datenschutzerklärung',
    note: 'Rechtlich maßgeblich ist die deutsche Fassung.',
    sections: [
      { h: '1. Datenschutz auf einen Blick', p: [
        'Die folgenden Hinweise geben einen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie die Website eazy-stock.com besuchen oder die Anwendung Eazy Stock nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.',
        'Eazy Stock ist ein Inventar-, Verkaufs- und Kundenkredit-System für kleine Geschäfte. Wir erheben nur die Daten, die für den Betrieb des Dienstes nötig sind. Wir setzen keine Analyse-, Tracking- oder Werbe-Tools ein und verkaufen keine Daten.',
      ] },
      { h: '2. Verantwortlicher', p: [
        `Verantwortlicher für die Datenverarbeitung auf dieser Website ist: ${ADDRESS}.`,
        `Telefon: ${LEGAL_ENTITY.phone} · E-Mail: ${LEGAL_ENTITY.email}`,
        'Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet.',
      ] },
      { h: '3. Hosting', p: [
        'Diese Website und die Anwendung werden auf Servern der Contabo GmbH, Aschauer Straße 32a, 81549 München, Deutschland, betrieben. Die Server befinden sich in der Europäischen Union. Die Daten, die beim Besuch anfallen (siehe Server-Logfiles), werden auf den Servern des Hosters verarbeitet.',
        'Die Nutzung des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren Nutzern (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Angebots (Art. 6 Abs. 1 lit. f DSGVO). Mit dem Hoster besteht ein Vertrag über Auftragsverarbeitung (Art. 28 DSGVO).',
      ] },
      { h: '4. Allgemeine Hinweise und Pflichtinformationen', p: [
        'SSL- bzw. TLS-Verschlüsselung: Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers mit „https://“ beginnt.',
        'Widerruf Ihrer Einwilligung: Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.',
        'Widerspruchsrecht (Art. 21 DSGVO): Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, haben Sie jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, Widerspruch gegen die Verarbeitung einzulegen.',
        'Beschwerderecht bei der Aufsichtsbehörde: Im Falle von Verstößen gegen die DSGVO steht Ihnen ein Beschwerderecht bei einer Aufsichtsbehörde zu. Zuständig für uns ist die Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin.',
        'Recht auf Datenübertragbarkeit: Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.',
      ] },
      { h: '5. Datenerfassung auf dieser Website', p: [
        'Server-Logfiles: Der Hoster erhebt und speichert automatisch Informationen in Server-Logfiles, die Ihr Browser übermittelt: Browsertyp und -version, verwendetes Betriebssystem, aufgerufene Seite, Uhrzeit der Anfrage und IP-Adresse. Diese Daten werden nicht mit anderen Datenquellen zusammengeführt und nach kurzer Zeit gelöscht. Grundlage ist Art. 6 Abs. 1 lit. f DSGVO (technisch fehlerfreie Darstellung und Sicherheit der Website).',
        'Cookies und lokaler Speicher: Wir setzen keine Tracking- oder Werbe-Cookies. Die Anwendung speichert im lokalen Speicher Ihres Browsers (localStorage) ausschließlich technisch notwendige Daten: Ihr Anmelde-Token (Sitzung), die gewählte Sprache und Darstellungseinstellungen des Menüs. Diese Daten sind für die Funktion des Dienstes erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. b und f DSGVO); eine Einwilligung ist dafür nicht erforderlich. Sie können sie jederzeit über die Einstellungen Ihres Browsers löschen.',
        `Kontakt per E-Mail oder Telefon: Wenn Sie uns per E-Mail oder Telefon kontaktieren, werden Ihre Angaben (Name, E-Mail-Adresse, Inhalt der Anfrage) zur Bearbeitung der Anfrage bei uns gespeichert. Grundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung oder Durchführung eines Vertrags) bzw. Art. 6 Abs. 1 lit. f DSGVO. Die Daten bleiben bei uns, bis Sie uns zur Löschung auffordern oder der Zweck entfällt.`,
      ] },
      { h: '6. Registrierung und Nutzerkonto', p: [
        'Um Eazy Stock zu nutzen, legen Sie ein Konto an. Dabei verarbeiten wir: Name, E-Mail-Adresse, Passwort (nur als Hash gespeichert), Name und Land/Währung Ihres Geschäfts sowie optional Telefonnummer und Logo. Außerdem speichern wir Anmeldezeitpunkte und die von Ihnen in der Anwendung ausgeführten Aktionen (z. B. wer einen Verkauf registriert hat), weil dies Teil der Funktion des Dienstes ist.',
        'Die Verarbeitung erfolgt zur Durchführung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Die Daten bleiben gespeichert, solange Ihr Konto besteht; danach werden sie gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen. Die Löschung Ihres Kontos können Sie jederzeit per E-Mail an die oben genannte Adresse verlangen.',
      ] },
      { h: '7. Daten, die Sie in Eazy Stock eingeben (Auftragsverarbeitung)', p: [
        'In der Anwendung erfassen Sie Daten Ihres Geschäfts: Produkte, Bestände, Verkäufe, Kassenabschlüsse, Angebote, Kunden (Name, Telefon, Kundenkredit), Lieferanten und Mitarbeiter. Für diese Daten sind Sie als Inhaber des Geschäfts der Verantwortliche im Sinne der DSGVO; wir verarbeiten sie ausschließlich in Ihrem Auftrag als Auftragsverarbeiter (Art. 28 DSGVO), um Ihnen den Dienst bereitzustellen.',
        'Wir nutzen diese Daten nicht für eigene Zwecke, geben sie nicht an Dritte weiter und werten sie nicht aus, außer in anonymisierter Form zur Verbesserung des Dienstes. Es werden regelmäßige Sicherungskopien (Backups) auf Servern in der EU angelegt. Einen Vertrag über Auftragsverarbeitung stellen wir Ihnen auf Anfrage zur Verfügung.',
      ] },
      { h: '8. WhatsApp-Links und Freigabe von PDF-Dokumenten', p: [
        'Eazy Stock bietet Schaltflächen, um Angebote, Kontoauszüge oder Zahlungserinnerungen per WhatsApp an Ihre Kunden zu senden. Dabei öffnet sich lediglich ein Link zu WhatsApp (wa.me) mit dem vorbereiteten Text; die Übermittlung erfolgt erst, wenn Sie sie in WhatsApp selbst bestätigen. Wir übertragen keine Daten automatisch an WhatsApp/Meta. Für die Verarbeitung durch WhatsApp gelten die Datenschutzhinweise der WhatsApp Ireland Limited.',
        'PDF-Dokumente (Angebote, Bestellungen, Kontoauszüge) werden in Ihrem Browser erzeugt und nur dort gespeichert oder geteilt, wo Sie es veranlassen.',
      ] },
      { h: '9. Keine Analyse-Tools, kein Tracking, keine Werbung', p: [
        'Auf eazy-stock.com werden keine Web-Analyse-Dienste (z. B. Google Analytics), keine Social-Media-Plugins, keine eingebetteten Videos und keine Werbenetzwerke eingesetzt. Es findet keine Profilbildung statt. Deshalb zeigen wir auch kein Cookie-Banner.',
      ] },
      { h: '10. Zahlungen', p: [
        'Derzeit werden kostenpflichtige Pläne per Rechnung und Überweisung abgerechnet; Zahlungsdaten werden nicht über die Website verarbeitet. Sobald wir einen Online-Zahlungsdienstleister einbinden, ergänzen wir diese Erklärung um die entsprechenden Angaben (Anbieter, Datenkategorien, Rechtsgrundlage) und informieren registrierte Nutzer.',
      ] },
      { h: '11. Ihre Rechte', p: [
        'Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Verarbeitung (Art. 15 DSGVO) sowie ein Recht auf Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO).',
        `Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden: ${LEGAL_ENTITY.email}.`,
      ] },
      { h: '12. Änderungen dieser Datenschutzerklärung', p: [
        'Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen, z. B. bei der Einführung neuer Funktionen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.',
      ] },
    ],
  },
  es: {
    title: 'Política de privacidad',
    note: 'La versión alemana (Datenschutzerklärung) es la jurídicamente vinculante. Esta traducción es para que la entiendas.',
    sections: [
      { h: '1. La privacidad de un vistazo', p: [
        'Aquí te explicamos qué pasa con tus datos personales cuando visitas eazy-stock.com o usas la aplicación Eazy Stock. Datos personales son todos los que permiten identificarte.',
        'Eazy Stock es un sistema de inventario, ventas y fiado para tiendas pequeñas. Solo recogemos los datos necesarios para que el servicio funcione. No usamos herramientas de analítica, rastreo ni publicidad, y no vendemos datos.',
      ] },
      { h: '2. Responsable del tratamiento', p: [
        `El responsable del tratamiento de datos en esta web es: ${ADDRESS}.`,
        `Teléfono: ${LEGAL_ENTITY.phone} · Correo: ${LEGAL_ENTITY.email}`,
        'El responsable es la persona física o jurídica que, sola o junto con otras, decide los fines y medios del tratamiento de datos personales.',
      ] },
      { h: '3. Alojamiento (hosting)', p: [
        'Esta web y la aplicación funcionan en servidores de Contabo GmbH, Aschauer Straße 32a, 81549 Múnich, Alemania. Los servidores están en la Unión Europea. Los datos que se generan al visitar la web (ver registros del servidor) se procesan en los servidores del proveedor.',
        'Usamos este proveedor para cumplir el contrato con nuestros usuarios (art. 6.1.b RGPD) y por nuestro interés legítimo en ofrecer el servicio de forma segura, rápida y eficiente (art. 6.1.f RGPD). Tenemos con él un contrato de encargo de tratamiento (art. 28 RGPD).',
      ] },
      { h: '4. Información general y obligatoria', p: [
        'Cifrado SSL/TLS: por seguridad y para proteger la transmisión de contenidos confidenciales, esta web usa cifrado SSL/TLS. Lo reconoces porque la dirección empieza por «https://».',
        'Revocar tu consentimiento: muchos tratamientos solo son posibles con tu consentimiento expreso. Puedes revocarlo en cualquier momento; lo tratado hasta entonces sigue siendo lícito.',
        'Derecho de oposición (art. 21 RGPD): si el tratamiento se basa en el art. 6.1.e o f RGPD, puedes oponerte en cualquier momento por motivos relacionados con tu situación particular.',
        'Derecho a reclamar ante la autoridad de control: si crees que incumplimos el RGPD, puedes reclamar ante una autoridad de protección de datos. La nuestra es la Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlín.',
        'Derecho a la portabilidad: puedes pedir que los datos que tratamos de forma automatizada con tu consentimiento o para cumplir un contrato se te entreguen, a ti o a un tercero, en un formato común legible por máquina.',
      ] },
      { h: '5. Recogida de datos en esta web', p: [
        'Registros del servidor: el proveedor de alojamiento recoge automáticamente información que tu navegador envía: tipo y versión del navegador, sistema operativo, página visitada, hora de la solicitud y dirección IP. No se cruzan con otras fuentes y se borran al poco tiempo. Base: art. 6.1.f RGPD (funcionamiento correcto y seguridad de la web).',
        'Cookies y almacenamiento local: no usamos cookies de rastreo ni publicidad. La aplicación guarda en el almacenamiento local de tu navegador (localStorage) solo datos técnicamente necesarios: tu token de sesión, el idioma elegido y la configuración del menú. Son imprescindibles para que el servicio funcione (§ 25.2.2 TDDDG, art. 6.1.b y f RGPD), por eso no hace falta consentimiento. Puedes borrarlos cuando quieras desde tu navegador.',
        'Contacto por correo o teléfono: si nos escribes o llamas, guardamos tus datos (nombre, correo, contenido de la consulta) para atenderla. Base: art. 6.1.b RGPD (preparación o ejecución de un contrato) o art. 6.1.f RGPD. Los conservamos hasta que nos pidas borrarlos o desaparezca el motivo.',
      ] },
      { h: '6. Registro y cuenta de usuario', p: [
        'Para usar Eazy Stock creas una cuenta. Tratamos: nombre, correo, contraseña (guardada solo como hash), nombre y país/moneda de tu negocio y, opcionalmente, teléfono y logo. También guardamos las horas de inicio de sesión y las acciones que haces en la app (por ejemplo, quién registró una venta), porque forman parte del servicio.',
        'El tratamiento se hace para ejecutar el contrato de uso (art. 6.1.b RGPD). Los datos se conservan mientras exista tu cuenta; después se borran, salvo obligación legal de conservarlos. Puedes pedir el borrado de tu cuenta en cualquier momento escribiendo al correo de arriba.',
      ] },
      { h: '7. Datos que cargas en Eazy Stock (encargo de tratamiento)', p: [
        'En la aplicación registras datos de tu negocio: productos, stock, ventas, cierres de caja, cotizaciones, clientes (nombre, teléfono, fiado), proveedores y empleados. De esos datos el responsable eres tú, como dueño del negocio; nosotros los tratamos solo por encargo tuyo, como encargado del tratamiento (art. 28 RGPD), para prestarte el servicio.',
        'No usamos esos datos para fines propios, no los cedemos a terceros y no los analizamos salvo de forma anonimizada para mejorar el servicio. Hacemos copias de seguridad periódicas en servidores de la UE. Si lo necesitas, te facilitamos un contrato de encargo de tratamiento.',
      ] },
      { h: '8. Enlaces de WhatsApp y PDF compartidos', p: [
        'Eazy Stock tiene botones para enviar cotizaciones, estados de cuenta o recordatorios de pago por WhatsApp a tus clientes. Solo se abre un enlace a WhatsApp (wa.me) con el texto preparado; el envío ocurre cuando tú lo confirmas en WhatsApp. No transmitimos nada automáticamente a WhatsApp/Meta. Al tratamiento por parte de WhatsApp se aplican las políticas de WhatsApp Ireland Limited.',
        'Los PDF (cotizaciones, pedidos, estados de cuenta) se generan en tu navegador y solo se guardan o comparten donde tú lo decidas.',
      ] },
      { h: '9. Sin analítica, sin rastreo, sin publicidad', p: [
        'En eazy-stock.com no hay servicios de analítica web (por ejemplo Google Analytics), ni plugins de redes sociales, ni vídeos incrustados, ni redes publicitarias. No se crean perfiles. Por eso tampoco mostramos un banner de cookies.',
      ] },
      { h: '10. Pagos', p: [
        'Por ahora los planes de pago se facturan por transferencia; no se procesan datos de pago a través de la web. Cuando integremos una pasarela de pago en línea, completaremos esta política con los datos correspondientes (proveedor, categorías de datos, base legal) e informaremos a los usuarios registrados.',
      ] },
      { h: '11. Tus derechos', p: [
        'Tienes derecho, en todo momento y gratis, a saber qué datos personales tuyos guardamos, de dónde vienen, a quién se envían y para qué (art. 15 RGPD), y derecho a rectificación (art. 16), supresión (art. 17), limitación del tratamiento (art. 18), portabilidad (art. 20) y oposición (art. 21 RGPD).',
        `Para ejercerlos o para cualquier otra pregunta sobre tus datos, escríbenos a ${LEGAL_ENTITY.email}.`,
      ] },
      { h: '12. Cambios en esta política', p: [
        'Podemos adaptar esta política para que cumpla siempre la ley vigente o para reflejar cambios en nuestros servicios, por ejemplo al añadir funciones nuevas. En tu próxima visita se aplicará la versión nueva.',
      ] },
    ],
  },
  en: {
    title: 'Privacy policy',
    note: 'The German version (Datenschutzerklärung) is the legally binding one. This translation is provided for convenience.',
    sections: [
      { h: '1. Privacy at a glance', p: [
        'This notice explains what happens to your personal data when you visit eazy-stock.com or use the Eazy Stock application. Personal data is any data that can identify you personally.',
        'Eazy Stock is an inventory, sales and store-credit system for small shops. We only collect the data needed to run the service. We use no analytics, tracking or advertising tools and we do not sell data.',
      ] },
      { h: '2. Controller', p: [
        `The controller responsible for data processing on this website is: ${ADDRESS}.`,
        `Phone: ${LEGAL_ENTITY.phone} · Email: ${LEGAL_ENTITY.email}`,
        'The controller is the natural or legal person who, alone or jointly with others, decides on the purposes and means of processing personal data.',
      ] },
      { h: '3. Hosting', p: [
        'This website and the application run on servers of Contabo GmbH, Aschauer Straße 32a, 81549 Munich, Germany. The servers are located in the European Union. Data generated when you visit (see server log files) is processed on the hosting provider\'s servers.',
        'We use this provider to fulfil our contract with our users (Art. 6(1)(b) GDPR) and in our legitimate interest in a secure, fast and efficient service (Art. 6(1)(f) GDPR). A data processing agreement (Art. 28 GDPR) is in place with the provider.',
      ] },
      { h: '4. General and mandatory information', p: [
        'SSL/TLS encryption: for security and to protect confidential content in transit, this site uses SSL/TLS encryption. You can recognise it by the "https://" at the start of the address.',
        'Withdrawing consent: many processing operations are only possible with your express consent. You can withdraw it at any time; processing carried out before withdrawal remains lawful.',
        'Right to object (Art. 21 GDPR): where processing is based on Art. 6(1)(e) or (f) GDPR, you may object at any time on grounds relating to your particular situation.',
        'Right to lodge a complaint: if you believe we breach the GDPR, you may complain to a supervisory authority. Ours is the Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin, Germany.',
        'Right to data portability: you may ask that data we process automatically on the basis of your consent or a contract be handed over to you or a third party in a common, machine-readable format.',
      ] },
      { h: '5. Data collection on this website', p: [
        'Server log files: the hosting provider automatically collects information your browser sends: browser type and version, operating system, page requested, time of the request and IP address. It is not merged with other sources and is deleted after a short time. Legal basis: Art. 6(1)(f) GDPR (correct operation and security of the site).',
        'Cookies and local storage: we use no tracking or advertising cookies. The application stores in your browser\'s local storage (localStorage) only technically necessary data: your session token, the chosen language and menu display settings. They are required for the service to work (§ 25(2)(2) TDDDG, Art. 6(1)(b) and (f) GDPR), so no consent is needed. You can delete them at any time from your browser settings.',
        'Contact by email or phone: if you contact us, we store your details (name, email, content of the request) to handle it. Legal basis: Art. 6(1)(b) GDPR (preparing or performing a contract) or Art. 6(1)(f) GDPR. We keep them until you ask us to delete them or the purpose no longer applies.',
      ] },
      { h: '6. Registration and user account', p: [
        'To use Eazy Stock you create an account. We process: name, email, password (stored only as a hash), your business\'s name and country/currency and, optionally, phone and logo. We also store login times and the actions you perform in the app (for example who recorded a sale), as they are part of the service.',
        'Processing is carried out to perform the usage contract (Art. 6(1)(b) GDPR). Data is kept as long as your account exists and is then deleted unless a legal retention duty applies. You can request deletion of your account at any time by email to the address above.',
      ] },
      { h: '7. Data you enter in Eazy Stock (processing on your behalf)', p: [
        'In the application you record your business\'s data: products, stock, sales, cash closings, quotes, customers (name, phone, store credit), suppliers and employees. For that data you, as the business owner, are the controller under the GDPR; we process it solely on your behalf as processor (Art. 28 GDPR) to provide the service.',
        'We do not use that data for our own purposes, do not share it with third parties and do not analyse it except in anonymised form to improve the service. Regular backups are kept on servers in the EU. A data processing agreement is available on request.',
      ] },
      { h: '8. WhatsApp links and shared PDF documents', p: [
        'Eazy Stock offers buttons to send quotes, account statements or payment reminders to your customers via WhatsApp. This only opens a WhatsApp link (wa.me) with the prepared text; the message is sent only when you confirm it in WhatsApp. We transmit nothing to WhatsApp/Meta automatically. WhatsApp Ireland Limited\'s privacy policy applies to its processing.',
        'PDF documents (quotes, purchase orders, statements) are generated in your browser and are only saved or shared where you choose.',
      ] },
      { h: '9. No analytics, no tracking, no advertising', p: [
        'eazy-stock.com uses no web analytics services (such as Google Analytics), no social media plugins, no embedded videos and no advertising networks. No profiling takes place. That is why we show no cookie banner.',
      ] },
      { h: '10. Payments', p: [
        'Paid plans are currently billed by invoice and bank transfer; no payment data is processed through the website. Once we integrate an online payment provider, we will add the relevant details (provider, data categories, legal basis) to this policy and inform registered users.',
      ] },
      { h: '11. Your rights', p: [
        'You have the right, at any time and free of charge, to information about your stored personal data, its origin and recipients and the purpose of processing (Art. 15 GDPR), as well as the rights to rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21 GDPR).',
        `For these and any other questions about personal data, contact us at ${LEGAL_ENTITY.email}.`,
      ] },
      { h: '12. Changes to this policy', p: [
        'We may update this privacy policy so that it always meets current legal requirements or reflects changes to our services, for example when new features are introduced. The new version applies from your next visit.',
      ] },
    ],
  },
}
