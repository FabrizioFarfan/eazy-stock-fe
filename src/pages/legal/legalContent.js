// Textos legales de Eazy Stock (15-oct-2026). Fabrizio Farfan sacó su Partita IVA
// (Einzelunternehmer, Kleinunternehmer § 19 UStG) en Berlín y la web necesita, por ley
// alemana, un Impressum (§ 5 DDG) y una Datenschutzerklärung (DSGVO). Las dos tienen
// versión alemana (vinculante: el Impressum es el texto que dictó el asesor) + español
// e inglés como traducción de cortesía para nuestros usuarios (16-oct-2026).
// Datos: Contabo GmbH es el hoster (servidor en la UE); no hay analítica ni rastreo;
// localStorage solo técnico (sesión, idioma, menú) → sin banner de cookies. Desde el 30-oct-2026 hay estadísticas de visitas
// propias SIN cookies ni almacenamiento (punto 10 de la privacidad; analytics/Tracker.jsx + AnalyticsService en el API).
// 22-oct-2026 (antes de cobrar con Stripe): TÉRMINOS Y CONDICIONES (/terminos) en
// es/de/en — renovación automática, cancelación, reembolsos, solo lectura al vencer,
// datos — y la Datenschutz suma la sección «Pagos (Stripe)» que exige la DSGVO.

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
export const PRIVACY_UPDATED = { de: 'Stand: 30. Oktober 2026', es: 'Última actualización: 30 de octubre de 2026', en: 'Last updated: October 30, 2026' }

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
        'Eazy Stock ist ein Inventar-, Verkaufs- und Kundenkredit-System für kleine Geschäfte. Wir erheben nur die Daten, die für den Betrieb des Dienstes nötig sind. Wir setzen keine Analyse-, Tracking- oder Werbe-Tools von Dritten ein und verkaufen keine Daten; auf den öffentlichen Seiten zählen wir Besuche nur mit einem eigenen Werkzeug ohne Cookies (siehe Abschnitt 10).',
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
        'Die Verarbeitung erfolgt zur Durchführung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Die Daten bleiben gespeichert, solange Ihr Konto besteht; danach werden sie gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen. Sie können Ihr Konto jederzeit selbst in der App oder im Web unter „Einstellungen › Konto löschen“ löschen (oder uns an die oben genannte Adresse schreiben). Das Konto wird dann 30 Tage lang pausiert – melden Sie sich in dieser Zeit wieder an, wird die Löschung abgebrochen – und danach mit allen Daten des Geschäfts gelöscht.',
        'Wenn Sie Ihre E-Mail-Adresse ändern, speichern wir zusätzlich die bisherige Adresse und das Datum der Änderung, solange das Konto besteht, um Ihr Konto zu schützen (z. B. um Ihnen helfen zu können, falls jemand die Adresse ohne Ihre Erlaubnis geändert hat). Sie werden zusammen mit dem Konto gelöscht. Grundlage ist Art. 6 Abs. 1 lit. f DSGVO.',
        'Steuernummer nach der Löschung: Wird ein Konto endgültig gelöscht, bewahren wir von der Steuernummer des Geschäfts (RUC, NIT, CUIT, RFC usw.) nur eine verschlüsselte Kennung auf – einen mit einem geheimen Schlüssel berechneten HMAC-SHA256-Wert, aus dem sich die Nummer nicht zurückgewinnen lässt – sowie das Löschdatum. Mehr nicht: weder die Nummer noch den Namen des Geschäfts noch das Konto. Die Kennung dient ausschließlich dazu, den Missbrauch der kostenlosen Testphase zu verhindern: Wer sich innerhalb dieser 3 Jahre mit dieser Steuernummer erneut registriert, kann Eazy Stock nutzen, aber ohne kostenlose Testphase. Grundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Verhinderung des Missbrauchs der Testphase). Wir bewahren sie 3 Jahre ab der Löschung auf und löschen sie danach.',
      ] },
      { h: '7. Daten, die Sie in Eazy Stock eingeben (Auftragsverarbeitung)', p: [
        'In der Anwendung erfassen Sie Daten Ihres Geschäfts: Produkte, Bestände, Verkäufe, Kassenabschlüsse, Angebote, Kunden (Name, Telefon, Kundenkredit), Lieferanten und Mitarbeiter. Für diese Daten sind Sie als Inhaber des Geschäfts der Verantwortliche im Sinne der DSGVO; wir verarbeiten sie ausschließlich in Ihrem Auftrag als Auftragsverarbeiter (Art. 28 DSGVO), um Ihnen den Dienst bereitzustellen.',
        'Wir nutzen diese Daten nicht für eigene Zwecke, geben sie nicht an Dritte weiter und werten sie nicht aus, außer in anonymisierter Form zur Verbesserung des Dienstes. Es werden regelmäßige Sicherungskopien (Backups) auf Servern in der EU angelegt. Einen Vertrag über Auftragsverarbeitung stellen wir Ihnen auf Anfrage zur Verfügung.',
      ] },
      { h: '8. WhatsApp-Links und Freigabe von PDF-Dokumenten', p: [
        'Eazy Stock bietet Schaltflächen, um Angebote, Kontoauszüge oder Zahlungserinnerungen per WhatsApp an Ihre Kunden zu senden. Dabei öffnet sich lediglich ein Link zu WhatsApp (wa.me) mit dem vorbereiteten Text; die Übermittlung erfolgt erst, wenn Sie sie in WhatsApp selbst bestätigen. Wir übertragen keine Daten automatisch an WhatsApp/Meta. Für die Verarbeitung durch WhatsApp gelten die Datenschutzhinweise der WhatsApp Ireland Limited.',
        'PDF-Dokumente (Angebote, Bestellungen, Kontoauszüge) werden in Ihrem Browser erzeugt und nur dort gespeichert oder geteilt, wo Sie es veranlassen.',
      ] },
      { h: '9. Push-Benachrichtigungen (mobile App)', p: [
        'Wenn Sie sich in der Eazy-Stock-App anmelden, speichern wir das Benachrichtigungs-Token Ihres Telefons zusammen mit dem Betriebssystem (iOS oder Android), der App-Version, der Zeitzone und dem Zeitpunkt der letzten Nutzung. Wir verwenden es nur, um Ihnen Hinweise zu Ihrem Geschäft zu senden (z. B. niedriger Bestand oder bald ablaufende Produkte). Im Web verwenden wir keine Push-Benachrichtigungen.',
        'Die Hinweise werden über Firebase Cloud Messaging von Google (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) und auf dem iPhone über den Benachrichtigungsdienst von Apple (Apple Distribution International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Irland) zugestellt. Diese Anbieter können Daten in den USA verarbeiten; sie stützen sich dafür auf die Standardvertragsklauseln der Europäischen Kommission und das EU-US Data Privacy Framework.',
        'Grundlage ist die Durchführung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Ob Hinweise auf dem Telefon angezeigt werden, entscheiden Sie in den Einstellungen des Telefons und können es jederzeit ändern. Das Token wird gelöscht, wenn Sie sich auf diesem Telefon abmelden oder die Löschung Ihres Kontos beantragen.',
      ] },
      { h: '10. Eigene Besuchsstatistik ohne Cookies; kein Tracking, keine Werbung', p: [
        'Auf den öffentlichen Seiten von eazy-stock.com (Startseite, Tarife, Registrierung …) zählen wir Besuche mit einem eigenen Werkzeug auf unserem Server, ohne Dritte: welche Seiten aufgerufen und welche Schaltflächen angeklickt werden, das Land (im Moment des Aufrufs aus der IP-Adresse ermittelt, die IP-Adresse wird nicht gespeichert), die Geräteart, die Sprache und von welcher Website der Besuch kommt (nur deren Domain sowie die utm-Angaben des Links). Um einen Besucher nur einmal pro Tag zu zählen, wird ein Code mit einem zufälligen Schlüssel gebildet, der jeden Tag wechselt und nicht gespeichert wird: Er erlaubt weder, Sie an einem anderen Tag wiederzuerkennen, noch, Sie zu identifizieren. Dafür setzen wir keine Cookies und speichern nichts auf Ihrem Gerät; es findet keine Profilbildung statt, und die Daten werden nicht weitergegeben. Nicht gezählt wird, wer angemeldet ist oder in seinem Browser „Do Not Track“ bzw. „Global Privacy Control“ aktiviert hat. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, die Nutzung unserer Website zu verstehen und sie zu verbessern). Die Daten werden nach 13 Monaten gelöscht.',
        'Es werden keine Web-Analyse-Dienste Dritter (z. B. Google Analytics), keine Social-Media-Plugins, keine eingebetteten Videos und keine Werbenetzwerke eingesetzt. Deshalb zeigen wir auch kein Cookie-Banner.',
      ] },
      { h: '11. Zahlungen (Stripe)', p: [
        'Kartenzahlungen für die kostenpflichtigen Pläne von Eazy Stock werden über Stripe abgewickelt (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin 2, Irland). Beim Bezahlen geben Sie Ihre Kartendaten in ein Formular von Stripe ein; wir selbst sehen und speichern Ihre Kartennummer zu keinem Zeitpunkt.',
        'Stripe verarbeitet dafür die Kartendaten, Betrag und Währung, Ihren Namen und Ihre E-Mail-Adresse sowie technische Daten wie die IP-Adresse, um die Zahlung auszuführen und Betrug zu verhindern. Wir speichern lediglich Ihre Kundenkennung bei Stripe, den gewählten Plan, den Status des Abonnements (aktiv, abgelaufen, gekündigt) und das Datum der letzten Zahlung.',
        'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Durchführung des Abonnementvertrags) sowie Art. 6 Abs. 1 lit. c DSGVO (steuer- und handelsrechtliche Pflicht zur Aufbewahrung von Zahlungsbelegen). Stripe kann Daten in Länder außerhalb der Europäischen Union übermitteln, insbesondere in die USA; Grundlage dafür sind die Standardvertragsklauseln der Europäischen Kommission. Näheres in der Datenschutzerklärung von Stripe: https://stripe.com/privacy.',
        'Stripe sendet Ihnen für jede Abbuchung eine Quittung per E-Mail. Wenn Sie per Überweisung oder Yape bezahlen, trägt unser Team die Zahlung manuell ein; in diesem Fall speichern wir nur Datum, Betrag und Zahlungsweg.',
      ] },
      { h: '12. Ihre Rechte', p: [
        'Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Verarbeitung (Art. 15 DSGVO) sowie ein Recht auf Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO).',
        `Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden: ${LEGAL_ENTITY.email}.`,
      ] },
      { h: '13. Änderungen dieser Datenschutzerklärung', p: [
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
        'Eazy Stock es un sistema de inventario, ventas y fiado para tiendas pequeñas. Solo recogemos los datos necesarios para que el servicio funcione. No usamos herramientas de analítica, rastreo ni publicidad de terceros, y no vendemos datos; en las páginas públicas solo contamos visitas con una herramienta propia sin cookies (ver el punto 10).',
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
        'El tratamiento se hace para ejecutar el contrato de uso (art. 6.1.b RGPD). Los datos se conservan mientras exista tu cuenta; después se borran, salvo obligación legal de conservarlos. Puedes borrar tu cuenta tú mismo en cualquier momento en la app o en la web, en Ajustes › Eliminar mi cuenta (o escribiéndonos al correo de arriba). La cuenta queda en pausa 30 días —si vuelves a entrar en ese plazo, el borrado se cancela— y después se borra con todos los datos del negocio.',
        'Si cambias tu correo, guardamos también el correo anterior y la fecha del cambio mientras exista la cuenta, para protegerla (por ejemplo, para poder ayudarte si alguien lo cambió sin tu permiso). Se borran junto con la cuenta. Base: art. 6.1.f RGPD.',
        'Documento fiscal tras el borrado: cuando una cuenta se borra definitivamente, del documento fiscal de su negocio (RUC, NIT, CUIT, RFC…) conservamos solo un identificador cifrado —una huella HMAC-SHA256 calculada con una clave secreta, de la que no se puede sacar el número— y la fecha del borrado. Nada más: ni el número, ni el nombre del negocio, ni la cuenta. Sirve únicamente para evitar abusos de la prueba gratis: quien se registre otra vez con ese documento en esos 3 años puede usar Eazy Stock, pero sin prueba gratis. Base: art. 6.1.f RGPD (interés legítimo en evitar el uso abusivo de la prueba gratis). Lo conservamos 3 años desde el borrado y después lo borramos.',
      ] },
      { h: '7. Datos que cargas en Eazy Stock (encargo de tratamiento)', p: [
        'En la aplicación registras datos de tu negocio: productos, stock, ventas, cierres de caja, cotizaciones, clientes (nombre, teléfono, fiado), proveedores y empleados. De esos datos el responsable eres tú, como dueño del negocio; nosotros los tratamos solo por encargo tuyo, como encargado del tratamiento (art. 28 RGPD), para prestarte el servicio.',
        'No usamos esos datos para fines propios, no los cedemos a terceros y no los analizamos salvo de forma anonimizada para mejorar el servicio. Hacemos copias de seguridad periódicas en servidores de la UE. Si lo necesitas, te facilitamos un contrato de encargo de tratamiento.',
      ] },
      { h: '8. Enlaces de WhatsApp y PDF compartidos', p: [
        'Eazy Stock tiene botones para enviar cotizaciones, estados de cuenta o recordatorios de pago por WhatsApp a tus clientes. Solo se abre un enlace a WhatsApp (wa.me) con el texto preparado; el envío ocurre cuando tú lo confirmas en WhatsApp. No transmitimos nada automáticamente a WhatsApp/Meta. Al tratamiento por parte de WhatsApp se aplican las políticas de WhatsApp Ireland Limited.',
        'Los PDF (cotizaciones, pedidos, estados de cuenta) se generan en tu navegador y solo se guardan o comparten donde tú lo decidas.',
      ] },
      { h: '9. Notificaciones push (app móvil)', p: [
        'Cuando entras con la app de Eazy Stock, guardamos el token de notificaciones de tu teléfono, junto con el sistema (iOS o Android), la versión de la app, la zona horaria y la última vez que la usaste. Lo usamos solo para enviarte avisos de tu negocio (por ejemplo, stock bajo o productos por vencer). En la web no usamos notificaciones push.',
        'Los avisos se envían a través de Firebase Cloud Messaging de Google (Google Ireland Limited, Gordon House, Barrow Street, Dublín 4, Irlanda) y, en iPhone, del servicio de notificaciones de Apple (Apple Distribution International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Irlanda). Estos proveedores pueden tratar datos en Estados Unidos; para ello se apoyan en las cláusulas contractuales tipo de la Comisión Europea y en el EU-US Data Privacy Framework.',
        'Base legal: la ejecución del contrato de uso (art. 6.1.b RGPD). Si los avisos se muestran o no en tu teléfono lo decides tú en los ajustes del teléfono, y puedes cambiarlo cuando quieras. El token se borra al cerrar sesión en ese teléfono y al pedir el borrado de la cuenta.',
      ] },
      { h: '10. Estadísticas de visitas propias, sin cookies; sin rastreo ni publicidad', p: [
        'En las páginas públicas de eazy-stock.com (portada, planes, registro…) contamos visitas con una herramienta propia, en nuestro servidor y sin terceros: qué páginas se ven, en qué botones se hace clic, el país (sacado de la dirección IP en el momento, sin guardarla), el tipo de dispositivo, el idioma y desde qué sitio se llega (solo su dominio y las etiquetas utm del enlace). Para contar a cada visitante una sola vez al día se calcula un código con una clave aleatoria que cambia cada día y no se guarda: no sirve para reconocerte otro día ni para identificarte. No usamos cookies ni guardamos nada en tu dispositivo para esto, no se crean perfiles y estos datos no se comparten. No se cuenta a quien tiene la sesión iniciada ni a quien activa «Do Not Track» o «Global Privacy Control» en su navegador. Base legal: art. 6.1.f RGPD (interés legítimo en saber cómo se usa nuestra web para mejorarla). Los datos se borran a los 13 meses.',
        'No hay servicios de analítica de terceros (por ejemplo Google Analytics), ni plugins de redes sociales, ni vídeos incrustados, ni redes publicitarias. Por eso no mostramos un banner de cookies.',
      ] },
      { h: '11. Pagos (Stripe)', p: [
        'Los pagos con tarjeta de los planes de Eazy Stock los procesa Stripe (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublín 2, Irlanda). Cuando pagas, escribes los datos de tu tarjeta en un formulario de Stripe; nosotros nunca vemos ni guardamos el número de tu tarjeta.',
        'Para ello Stripe trata los datos de la tarjeta, el importe y la moneda, tu nombre y tu correo, y datos técnicos como la dirección IP, para ejecutar el pago y prevenir el fraude. Nosotros guardamos solo tu identificador de cliente en Stripe, el plan contratado, el estado de la suscripción (activa, vencida, cancelada) y la fecha del último pago.',
        'Base legal: art. 6.1.b RGPD (ejecución del contrato de suscripción) y art. 6.1.c RGPD (obligación fiscal y contable de conservar los registros de pago). Stripe puede transferir datos a países fuera de la Unión Europea, en particular a Estados Unidos; para ello se apoya en las cláusulas contractuales tipo de la Comisión Europea. Más información en la política de privacidad de Stripe: https://stripe.com/privacy.',
        'Stripe te envía por correo el recibo de cada cobro. Si pagas por transferencia o Yape, nuestro equipo registra el pago a mano; en ese caso guardamos solo la fecha, el importe y el medio de pago.',
      ] },
      { h: '12. Tus derechos', p: [
        'Tienes derecho, en todo momento y gratis, a saber qué datos personales tuyos guardamos, de dónde vienen, a quién se envían y para qué (art. 15 RGPD), y derecho a rectificación (art. 16), supresión (art. 17), limitación del tratamiento (art. 18), portabilidad (art. 20) y oposición (art. 21 RGPD).',
        `Para ejercerlos o para cualquier otra pregunta sobre tus datos, escríbenos a ${LEGAL_ENTITY.email}.`,
      ] },
      { h: '13. Cambios en esta política', p: [
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
        'Eazy Stock is an inventory, sales and store-credit system for small shops. We only collect the data needed to run the service. We use no third-party analytics, tracking or advertising tools and we do not sell data; on the public pages we only count visits with our own cookie-free tool (see section 10).',
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
        'Processing is carried out to perform the usage contract (Art. 6(1)(b) GDPR). Data is kept as long as your account exists and is then deleted unless a legal retention duty applies. You can delete your account yourself at any time in the app or on the web under Settings › Delete my account (or by writing to the address above). The account is then paused for 30 days — if you log in again during that time, the deletion is cancelled — and afterwards it is deleted together with all business data.',
        'If you change your email address, we also keep the previous address and the date of the change for as long as the account exists, to protect your account (for example, to help you if someone changed it without your permission). They are deleted together with the account. Legal basis: Art. 6(1)(f) GDPR.',
        'Tax ID after deletion: when an account is permanently deleted, of its business tax ID (RUC, NIT, CUIT, RFC, etc.) we keep only an encrypted identifier — an HMAC-SHA256 value computed with a secret key, from which the number cannot be recovered — and the deletion date. Nothing else: neither the number, nor the business name, nor the account. It serves only to prevent abuse of the free trial: anyone who registers again with that tax ID within those 3 years can use Eazy Stock, but without a free trial. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in preventing abuse of the free trial). We keep it for 3 years from the deletion and then delete it.',
      ] },
      { h: '7. Data you enter in Eazy Stock (processing on your behalf)', p: [
        'In the application you record your business\'s data: products, stock, sales, cash closings, quotes, customers (name, phone, store credit), suppliers and employees. For that data you, as the business owner, are the controller under the GDPR; we process it solely on your behalf as processor (Art. 28 GDPR) to provide the service.',
        'We do not use that data for our own purposes, do not share it with third parties and do not analyse it except in anonymised form to improve the service. Regular backups are kept on servers in the EU. A data processing agreement is available on request.',
      ] },
      { h: '8. WhatsApp links and shared PDF documents', p: [
        'Eazy Stock offers buttons to send quotes, account statements or payment reminders to your customers via WhatsApp. This only opens a WhatsApp link (wa.me) with the prepared text; the message is sent only when you confirm it in WhatsApp. We transmit nothing to WhatsApp/Meta automatically. WhatsApp Ireland Limited\'s privacy policy applies to its processing.',
        'PDF documents (quotes, purchase orders, statements) are generated in your browser and are only saved or shared where you choose.',
      ] },
      { h: '9. Push notifications (mobile app)', p: [
        'When you log in to the Eazy Stock app, we store your phone\'s notification token together with the operating system (iOS or Android), the app version, the time zone and the time of last use. We use it only to send you notices about your business (for example low stock or products about to expire). We do not use push notifications on the web.',
        'Notices are delivered through Google\'s Firebase Cloud Messaging (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland) and, on iPhone, through Apple\'s notification service (Apple Distribution International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Ireland). These providers may process data in the United States; they rely on the European Commission\'s standard contractual clauses and the EU-US Data Privacy Framework.',
        'Legal basis: performance of the usage contract (Art. 6(1)(b) GDPR). Whether notices are shown on your phone is up to you in the phone\'s settings, and you can change it at any time. The token is deleted when you log out on that phone and when you request deletion of your account.',
      ] },
      { h: '10. Our own cookie-free visit statistics; no tracking, no advertising', p: [
        'On the public pages of eazy-stock.com (home, plans, sign-up …) we count visits with our own tool, on our own server and without third parties: which pages are viewed, which buttons are clicked, the country (derived from the IP address at that moment; the IP address is not stored), the device type, the language and which website the visit comes from (only its domain, plus the link\'s utm tags). To count each visitor only once a day, a code is computed with a random key that changes every day and is never stored: it cannot recognise you on another day or identify you. We set no cookies and store nothing on your device for this, no profiling takes place and this data is not shared. People who are signed in, or who enable “Do Not Track” or “Global Privacy Control” in their browser, are not counted. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in understanding how our website is used in order to improve it). The data is deleted after 13 months.',
        'We use no third-party web analytics (such as Google Analytics), no social media plugins, no embedded videos and no advertising networks. That is why we show no cookie banner.',
      ] },
      { h: '11. Payments (Stripe)', p: [
        'Card payments for Eazy Stock\'s paid plans are processed by Stripe (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin 2, Ireland). When you pay, you enter your card details in a form provided by Stripe; we never see or store your card number.',
        'For this purpose Stripe processes the card details, the amount and currency, your name and email, and technical data such as the IP address, in order to execute the payment and prevent fraud. We store only your Stripe customer identifier, the plan you chose, the subscription status (active, expired, cancelled) and the date of the last payment.',
        'Legal basis: Art. 6(1)(b) GDPR (performance of the subscription contract) and Art. 6(1)(c) GDPR (tax and accounting duty to keep payment records). Stripe may transfer data to countries outside the European Union, in particular to the United States; it relies on the European Commission\'s standard contractual clauses for this. More in Stripe\'s privacy policy: https://stripe.com/privacy.',
        'Stripe emails you a receipt for every charge. If you pay by bank transfer or Yape, our team records the payment manually; in that case we store only the date, the amount and the payment method.',
      ] },
      { h: '12. Your rights', p: [
        'You have the right, at any time and free of charge, to information about your stored personal data, its origin and recipients and the purpose of processing (Art. 15 GDPR), as well as the rights to rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and objection (Art. 21 GDPR).',
        `For these and any other questions about personal data, contact us at ${LEGAL_ENTITY.email}.`,
      ] },
      { h: '13. Changes to this policy', p: [
        'We may update this privacy policy so that it always meets current legal requirements or reflects changes to our services, for example when new features are introduced. The new version applies from your next visit.',
      ] },
    ],
  },
}

/**
 * Términos y condiciones (22-oct-2026, antes de cobrar suscripciones con Stripe).
 * El ESPAÑOL es la versión que vale (el cliente es el dueño de negocio hispanohablante);
 * alemán e inglés son traducciones de cortesía. Ley alemana, fuero Berlín (como en
 * EAZY PROJECT). Datos: suscripción por dueño, mensual/anual, PEN en Perú y USD fuera,
 * tarjeta por Stripe (primer cobro al terminar la prueba) o pago manual (transferencia/Yape), gratis
 * hasta el 15-dic-2026, después 30 días gratis; sin descuento de lanzamiento ni fundadores (27-oct-2026);
 * al vencer → SOLO LECTURA, nada se borra.
 */
export const TERMS_UPDATED = { de: 'Stand: 29. Oktober 2026', es: 'Última actualización: 29 de octubre de 2026', en: 'Last updated: October 29, 2026' }

export const TERMS_LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
]

export const TERMS = {
  es: {
    title: 'Términos y condiciones',
    kicker: 'Términos',
    note: 'Esta versión en español es la que vale. Las versiones en inglés y alemán son traducciones de cortesía.',
    sections: [
      { h: '1. Quiénes somos y qué cubren estos términos', p: [
        'Eazy Stock es un sistema de inventario, ventas y fiado para negocios pequeños. Lo ofrece Eazy Life Company; el titular legal figura en el Aviso legal (Impressum). En estos términos «nosotros» es Eazy Life Company y «tú» es el dueño del negocio que abre la cuenta.',
        'Estos términos valen para la web eazy-stock.com y para la aplicación Eazy Stock. Al crear una cuenta los aceptas. Si no estás de acuerdo con algo, no crees la cuenta o escríbenos antes.',
      ] },
      { h: '2. Para quién es Eazy Stock', p: [
        'Eazy Stock es una herramienta para negocios (uso profesional), no para consumidores. Para abrir una cuenta tienes que tener al menos 18 años y actuar para un negocio propio o para una empresa que te haya autorizado.',
        'La cuenta es del dueño del negocio. El dueño puede dar acceso a sus empleados; todo lo que hagan dentro de la app cuenta como hecho por el negocio.',
      ] },
      { h: '3. Tu cuenta', p: [
        'Los datos que das al registrarte tienen que ser verdaderos (nombre, correo, nombre y país del negocio). Si cambian, actualízalos en Ajustes.',
        'La contraseña es tuya: no la compartas. Si crees que alguien entró a tu cuenta sin permiso, cámbiala y avísanos.',
        'Según tu plan puedes manejar uno o varios negocios con la misma cuenta.',
      ] },
      { h: '4. Planes y precios', p: [
        'Eazy Stock funciona por suscripción por dueño de negocio, con plan mensual o anual. Los precios y lo que incluye cada plan están en la página de planes y dentro de la app.',
        'Los precios se muestran en soles (PEN) si tu negocio está en Perú y en dólares (USD) en el resto de países. El precio que ves es el que pagas.',
      ] },
      { h: '5. Prueba gratis', p: [
        'Hasta el 15 de diciembre de 2026 Eazy Stock es gratis para todos y no pedimos tarjeta.',
        'Quien se registre después de la promoción tiene 30 días gratis, sin tarjeta. Mientras la promoción esté vigente, sus condiciones se pueden consultar en la página de planes.',
      ] },
      { h: '6. Cómo se paga', p: [
        'Con tarjeta: el pago lo procesa Stripe (Stripe Payments Europe, Ltd., Dublín, Irlanda). Nosotros no vemos ni guardamos el número de tu tarjeta. El primer cobro con tarjeta se hace el día en que termina tu prueba gratis y después se renueva en esa misma fecha de cada período (cada mes, cada trimestre o cada año, según el período que elijas).',
        'Pago manual: si lo prefieres, puedes pagar por transferencia bancaria o Yape. Nuestro equipo registra el pago a mano y tu suscripción queda activa cuando lo recibimos.',
        'Comprobantes: si pagas con tarjeta, Stripe te envía un recibo por correo. Por ahora no emitimos factura ni boleta electrónica peruana (SUNAT). Si la necesitas para tu contabilidad, escríbenos antes de contratar.',
      ] },
      { h: '7. Renovación automática', p: [
        'La suscripción se renueva sola al final de cada período (mes o año) con el mismo plan, salvo que la canceles antes de que termine el período.',
        'Si el cobro con tarjeta falla, lo intentamos de nuevo y te avisamos por correo. Si no se puede cobrar, la cuenta pasa a solo lectura (ver punto 10).',
      ] },
      { h: '8. Cancelación', p: [
        'Puedes cancelar cuando quieras desde Ajustes o escribiéndonos. La cancelación es efectiva al final del período que ya pagaste: hasta entonces sigues usando Eazy Stock con normalidad y no se te vuelve a cobrar.',
      ] },
      { h: '9. Reembolsos y cambios de precio', p: [
        'No devolvemos el dinero de un período que ya empezó. La excepción es un error nuestro (por ejemplo, un cobro duplicado o un cobro después de cancelar): en ese caso te lo devolvemos completo.',
        'Podemos cambiar los precios avisándote con al menos 30 días por correo o dentro de la app. Un cambio de precio nunca afecta a un período que ya pagaste: se aplica a partir de la siguiente renovación. Si no estás de acuerdo, puedes cancelar antes de que entre en vigor.',
      ] },
      { h: '10. Qué pasa si la suscripción vence sin pagar', p: [
        'Si tu suscripción vence y no hay pago, tu cuenta pasa a solo lectura: puedes entrar, ver todo y exportar tus datos, pero no registrar ventas ni cambiar nada. No se borra nada.',
        'Cuando vuelves a pagar, la cuenta se reactiva con todos tus datos tal como estaban.',
        'Si no quieres seguir, puedes borrar tu cuenta tú mismo en la app o en la web, en Ajustes › Eliminar mi cuenta (o pedírnoslo por correo). La cuenta queda en pausa 30 días: si vuelves a entrar en ese plazo, el borrado se cancela; si no, se borran tu cuenta y todos los datos de tu negocio.',
      ] },
      { h: '11. Tus datos', p: [
        'Los datos que cargas en Eazy Stock (productos, ventas, clientes, proveedores, empleados) son tuyos. Nosotros los guardamos y procesamos solo para prestarte el servicio, como encargados del tratamiento. No los vendemos ni los usamos para otros fines.',
        'Puedes exportar tus datos en cualquier momento. Si borras la cuenta, borramos los datos de tu negocio, salvo lo que la ley nos obligue a conservar (por ejemplo, los registros de pagos) y un identificador cifrado de tu documento fiscal, que guardamos 3 años solo para evitar abusos de la prueba gratis: si te registras otra vez con ese documento en ese plazo, puedes usar Eazy Stock, pero sin prueba gratis. Los detalles están en la Política de privacidad.',
        'Cómo tratamos los datos personales está explicado en la Política de privacidad.',
      ] },
      { h: '12. Uso correcto', p: [
        'Usa Eazy Stock solo para gestionar tu negocio y dentro de la ley. No puedes revender el servicio, intentar acceder a datos de otros negocios, copiar la aplicación ni sobrecargar o atacar el sistema.',
        'Si detectamos un uso que daña el servicio o a otros usuarios, podemos suspender la cuenta. Te avisaremos y podrás explicarlo, salvo que haya que actuar de inmediato por seguridad.',
      ] },
      { h: '13. Disponibilidad y responsabilidad', p: [
        'Hacemos lo posible para que Eazy Stock esté disponible todo el tiempo y hacemos copias de seguridad periódicas. Aun así puede haber cortes por mantenimiento, actualizaciones o fallos ajenos a nosotros. Avisaremos de los mantenimientos planificados cuando sea posible.',
        'Eazy Stock te ayuda a llevar tu inventario y tus ventas, pero los números que salen dependen de lo que tú registras. Comprueba tus datos y guarda tus propios comprobantes: la app no sustituye a tu contador ni a tus obligaciones fiscales.',
        'Respondemos sin límite por dolo, negligencia grave y daños a la vida, el cuerpo o la salud. Por negligencia leve respondemos solo si incumplimos una obligación esencial del contrato y, en ese caso, solo por el daño previsible y típico de este tipo de servicio. Fuera de esos casos no respondemos.',
      ] },
      { h: '14. Cambios en estos términos', p: [
        'Podemos actualizar estos términos, por ejemplo al añadir funciones o planes nuevos o por cambios legales. Te avisaremos con al menos 30 días por correo o dentro de la app. Si no estás de acuerdo, puedes cancelar antes de que entren en vigor; si sigues usando Eazy Stock después de esa fecha, se aplican los términos nuevos.',
      ] },
      { h: '15. Ley aplicable y jurisdicción', p: [
        'Estos términos se rigen por la ley alemana. Para cualquier disputa son competentes los tribunales de Berlín (Alemania).',
        'Si alguna parte de estos términos no fuera válida, el resto sigue en pie.',
      ] },
      { h: '16. Contacto', p: [
        `¿Dudas sobre tu suscripción, un cobro o estos términos? Escríbenos a ${LEGAL_ENTITY.email}.`,
      ] },
    ],
  },
  en: {
    title: 'Terms and conditions',
    kicker: 'Terms',
    note: 'The Spanish version is the binding one. This translation is provided for convenience.',
    sections: [
      { h: '1. Who we are and what these terms cover', p: [
        'Eazy Stock is an inventory, sales and store-credit system for small businesses. It is offered by Eazy Life Company; the legal owner is named in the Legal notice (Impressum). In these terms "we" means Eazy Life Company and "you" means the business owner who opens the account.',
        'These terms apply to the website eazy-stock.com and to the Eazy Stock application. By creating an account you accept them. If you disagree with anything, do not create the account or write to us first.',
      ] },
      { h: '2. Who Eazy Stock is for', p: [
        'Eazy Stock is a tool for businesses (professional use), not for consumers. To open an account you must be at least 18 years old and act for your own business or for a company that has authorised you.',
        'The account belongs to the business owner. The owner may give access to employees; everything they do inside the app counts as done by the business.',
      ] },
      { h: '3. Your account', p: [
        'The details you give when registering must be true (name, email, business name and country). If they change, update them in Settings.',
        'Your password is yours: do not share it. If you think someone accessed your account without permission, change it and let us know.',
        'Depending on your plan you can manage one or several businesses with the same account.',
      ] },
      { h: '4. Plans and prices', p: [
        'Eazy Stock works as a subscription per business owner, with a monthly or an annual plan. Prices and what each plan includes are shown on the plans page and inside the app.',
        'Prices are shown in soles (PEN) if your business is in Peru and in US dollars (USD) in all other countries. The price you see is the price you pay.',
      ] },
      { h: '5. Free trial', p: [
        'Until 15 December 2026 Eazy Stock is free for everyone and we do not ask for a card.',
        'Anyone who registers after the promotion gets 30 days free, with no card. While the promotion runs, its conditions can be checked on the plans page.',
      ] },
      { h: '6. How you pay', p: [
        'By card: payments are processed by Stripe (Stripe Payments Europe, Ltd., Dublin, Ireland). We never see or store your card number. The first card charge is made on the day your free trial ends, and it then renews on that same date every period (every month, quarter or year, depending on the period you choose).',
        'Manual payment: if you prefer, you can pay by bank transfer or Yape. Our team records the payment manually and your subscription is active once we receive it.',
        'Receipts: if you pay by card, Stripe emails you a receipt. For now we do not issue Peruvian electronic invoices or receipts (SUNAT). If you need one for your accounting, write to us before subscribing.',
      ] },
      { h: '7. Automatic renewal', p: [
        'The subscription renews automatically at the end of each period (month or year) on the same plan, unless you cancel before the period ends.',
        'If a card charge fails, we retry and notify you by email. If the charge cannot be collected, the account switches to read-only (see section 10).',
      ] },
      { h: '8. Cancellation', p: [
        'You can cancel at any time from Settings or by writing to us. Cancellation takes effect at the end of the period you have already paid for: until then you keep using Eazy Stock as usual and you are not charged again.',
      ] },
      { h: '9. Refunds and price changes', p: [
        'We do not refund a period that has already started. The exception is a mistake on our side (for example a duplicate charge or a charge after you cancelled): in that case we refund it in full.',
        'We may change prices with at least 30 days\' notice by email or inside the app. A price change never affects a period you have already paid for: it applies from the next renewal. If you disagree, you can cancel before it takes effect.',
      ] },
      { h: '10. What happens if the subscription expires unpaid', p: [
        'If your subscription expires and no payment is received, your account switches to read-only: you can log in, see everything and export your data, but you cannot record sales or change anything. Nothing is deleted.',
        'When you pay again, the account is reactivated with all your data exactly as it was.',
        'If you do not want to continue, you can delete your account yourself in the app or on the web under Settings › Delete my account (or ask us by email). The account is paused for 30 days: if you log in again during that time, the deletion is cancelled; otherwise your account and all your business data are deleted.',
      ] },
      { h: '11. Your data', p: [
        'The data you enter in Eazy Stock (products, sales, customers, suppliers, employees) is yours. We store and process it only to provide the service, as a processor on your behalf. We do not sell it or use it for other purposes.',
        'You can export your data at any time. If you delete the account, we delete your business data, except what the law requires us to keep (for example payment records) and an encrypted identifier of your tax ID, which we keep for 3 years only to prevent abuse of the free trial: if you register again with that tax ID within that time, you can use Eazy Stock, but without a free trial. Details are in the Privacy policy.',
        'How we handle personal data is explained in the Privacy policy.',
      ] },
      { h: '12. Acceptable use', p: [
        'Use Eazy Stock only to manage your business and within the law. You may not resell the service, try to access other businesses\' data, copy the application, or overload or attack the system.',
        'If we detect use that harms the service or other users, we may suspend the account. We will notify you and give you the chance to explain, unless immediate action is needed for security.',
      ] },
      { h: '13. Availability and liability', p: [
        'We do our best to keep Eazy Stock available at all times and we make regular backups. Even so, there may be interruptions due to maintenance, updates or failures beyond our control. We will announce planned maintenance where possible.',
        'Eazy Stock helps you keep track of your inventory and sales, but the figures it shows depend on what you record. Check your data and keep your own receipts: the app does not replace your accountant or your tax obligations.',
        'We are liable without limit for intent, gross negligence and injury to life, body or health. For slight negligence we are liable only if we breach an essential contractual obligation and, in that case, only for the foreseeable damage typical of this kind of service. Beyond these cases we are not liable.',
      ] },
      { h: '14. Changes to these terms', p: [
        'We may update these terms, for example when adding new features or plans or because of legal changes. We will notify you at least 30 days in advance by email or inside the app. If you disagree, you can cancel before they take effect; if you keep using Eazy Stock after that date, the new terms apply.',
      ] },
      { h: '15. Governing law and jurisdiction', p: [
        'These terms are governed by German law. The courts of Berlin (Germany) have jurisdiction over any dispute.',
        'If any part of these terms is invalid, the rest remains in force.',
      ] },
      { h: '16. Contact', p: [
        `Questions about your subscription, a charge or these terms? Write to us at ${LEGAL_ENTITY.email}.`,
      ] },
    ],
  },
  de: {
    title: 'Allgemeine Geschäftsbedingungen',
    kicker: 'AGB',
    note: 'Maßgeblich ist die spanische Fassung. Diese Übersetzung dient dem Verständnis.',
    sections: [
      { h: '1. Wer wir sind und was diese Bedingungen regeln', p: [
        'Eazy Stock ist ein Inventar-, Verkaufs- und Kundenkredit-System für kleine Geschäfte. Anbieter ist Eazy Life Company; der rechtliche Inhaber ist im Impressum genannt. In diesen Bedingungen bedeutet „wir“ Eazy Life Company und „Sie“ den Geschäftsinhaber, der das Konto eröffnet.',
        'Diese Bedingungen gelten für die Website eazy-stock.com und für die Anwendung Eazy Stock. Mit der Eröffnung eines Kontos akzeptieren Sie sie. Wenn Sie mit etwas nicht einverstanden sind, eröffnen Sie kein Konto oder schreiben Sie uns vorher.',
      ] },
      { h: '2. Für wen Eazy Stock ist', p: [
        'Eazy Stock ist ein Werkzeug für Unternehmen (gewerbliche Nutzung), nicht für Verbraucher. Um ein Konto zu eröffnen, müssen Sie mindestens 18 Jahre alt sein und für ein eigenes Geschäft oder für ein Unternehmen handeln, das Sie dazu ermächtigt hat.',
        'Das Konto gehört dem Geschäftsinhaber. Der Inhaber kann seinen Mitarbeitern Zugang geben; alles, was diese in der App tun, gilt als Handlung des Geschäfts.',
      ] },
      { h: '3. Ihr Konto', p: [
        'Die Angaben bei der Registrierung müssen wahr sein (Name, E-Mail, Name und Land des Geschäfts). Ändern sie sich, aktualisieren Sie sie in den Einstellungen.',
        'Das Passwort gehört Ihnen: Geben Sie es nicht weiter. Wenn Sie glauben, dass jemand ohne Erlaubnis auf Ihr Konto zugegriffen hat, ändern Sie es und informieren Sie uns.',
        'Je nach Plan können Sie mit demselben Konto ein oder mehrere Geschäfte verwalten.',
      ] },
      { h: '4. Pläne und Preise', p: [
        'Eazy Stock wird als Abonnement pro Geschäftsinhaber angeboten, mit monatlichem oder jährlichem Plan. Die Preise und der Umfang jedes Plans stehen auf der Seite „Pläne“ und in der App.',
        'Die Preise werden in Soles (PEN) angezeigt, wenn Ihr Geschäft in Peru ist, und in US-Dollar (USD) in allen anderen Ländern. Der angezeigte Preis ist der Preis, den Sie zahlen.',
      ] },
      { h: '5. Kostenlose Testphase', p: [
        'Bis zum 15. Dezember 2026 ist Eazy Stock für alle kostenlos, und wir verlangen keine Karte.',
        'Wer sich nach der Aktion registriert, erhält 30 Tage kostenlos, ohne Karte. Solange die Aktion läuft, sind ihre Bedingungen auf der Seite „Pläne“ einsehbar.',
      ] },
      { h: '6. Bezahlung', p: [
        'Per Karte: Die Zahlung wird von Stripe abgewickelt (Stripe Payments Europe, Ltd., Dublin, Irland). Wir sehen und speichern Ihre Kartennummer nicht. Die erste Kartenabbuchung erfolgt an dem Tag, an dem Ihre kostenlose Testphase endet, und verlängert sich danach jeweils am selben Datum jedes Zeitraums (monatlich, vierteljährlich oder jährlich, je nach gewähltem Zeitraum).',
        'Manuelle Zahlung: Auf Wunsch können Sie per Banküberweisung oder Yape zahlen. Unser Team trägt die Zahlung manuell ein; Ihr Abonnement ist aktiv, sobald die Zahlung bei uns eingegangen ist.',
        'Belege: Bei Kartenzahlung sendet Ihnen Stripe eine Quittung per E-Mail. Derzeit stellen wir keine peruanischen elektronischen Rechnungen oder Belege (SUNAT) aus. Wenn Sie diese für Ihre Buchhaltung brauchen, schreiben Sie uns vor Vertragsabschluss.',
      ] },
      { h: '7. Automatische Verlängerung', p: [
        'Das Abonnement verlängert sich am Ende jedes Zeitraums (Monat oder Jahr) automatisch um denselben Plan, sofern Sie es nicht vor Ablauf des Zeitraums kündigen.',
        'Schlägt eine Kartenabbuchung fehl, versuchen wir es erneut und benachrichtigen Sie per E-Mail. Kann der Betrag nicht eingezogen werden, wechselt das Konto in den Nur-Lese-Modus (siehe Punkt 10).',
      ] },
      { h: '8. Kündigung', p: [
        'Sie können jederzeit in den Einstellungen oder per E-Mail kündigen. Die Kündigung wird zum Ende des bereits bezahlten Zeitraums wirksam: Bis dahin nutzen Sie Eazy Stock ganz normal weiter, und es wird nichts mehr abgebucht.',
      ] },
      { h: '9. Erstattungen und Preisänderungen', p: [
        'Für einen bereits begonnenen Zeitraum erstatten wir kein Geld. Ausnahme ist ein Fehler unsererseits (z. B. eine doppelte Abbuchung oder eine Abbuchung nach der Kündigung): In diesem Fall erstatten wir den Betrag vollständig.',
        'Wir können die Preise mit einer Frist von mindestens 30 Tagen per E-Mail oder in der App ändern. Eine Preisänderung betrifft nie einen bereits bezahlten Zeitraum: Sie gilt ab der nächsten Verlängerung. Wenn Sie nicht einverstanden sind, können Sie vor dem Inkrafttreten kündigen.',
      ] },
      { h: '10. Was passiert, wenn das Abonnement unbezahlt abläuft', p: [
        'Läuft Ihr Abonnement ab und geht keine Zahlung ein, wechselt Ihr Konto in den Nur-Lese-Modus: Sie können sich anmelden, alles ansehen und Ihre Daten exportieren, aber keine Verkäufe erfassen und nichts ändern. Es wird nichts gelöscht.',
        'Sobald Sie wieder zahlen, wird das Konto mit allen Daten genau so reaktiviert, wie sie waren.',
        'Wenn Sie nicht weitermachen möchten, können Sie Ihr Konto selbst in der App oder im Web unter „Einstellungen › Konto löschen“ löschen (oder uns per E-Mail darum bitten). Das Konto wird 30 Tage lang pausiert: Melden Sie sich in dieser Zeit wieder an, wird die Löschung abgebrochen; andernfalls werden Ihr Konto und alle Daten Ihres Geschäfts gelöscht.',
      ] },
      { h: '11. Ihre Daten', p: [
        'Die Daten, die Sie in Eazy Stock erfassen (Produkte, Verkäufe, Kunden, Lieferanten, Mitarbeiter), gehören Ihnen. Wir speichern und verarbeiten sie ausschließlich zur Erbringung des Dienstes als Auftragsverarbeiter. Wir verkaufen sie nicht und nutzen sie nicht für andere Zwecke.',
        'Sie können Ihre Daten jederzeit exportieren. Wenn Sie das Konto löschen, löschen wir die Daten Ihres Geschäfts, mit Ausnahme dessen, was wir gesetzlich aufbewahren müssen (z. B. Zahlungsbelege), und einer verschlüsselten Kennung Ihrer Steuernummer, die wir 3 Jahre lang nur aufbewahren, um den Missbrauch der kostenlosen Testphase zu verhindern: Registrieren Sie sich innerhalb dieser Zeit erneut mit dieser Steuernummer, können Sie Eazy Stock nutzen, aber ohne kostenlose Testphase. Einzelheiten stehen in der Datenschutzerklärung.',
        'Wie wir personenbezogene Daten verarbeiten, erklärt die Datenschutzerklärung.',
      ] },
      { h: '12. Zulässige Nutzung', p: [
        'Nutzen Sie Eazy Stock nur zur Verwaltung Ihres Geschäfts und im Rahmen der Gesetze. Sie dürfen den Dienst nicht weiterverkaufen, nicht versuchen, auf Daten anderer Geschäfte zuzugreifen, die Anwendung nicht kopieren und das System nicht überlasten oder angreifen.',
        'Stellen wir eine Nutzung fest, die dem Dienst oder anderen Nutzern schadet, können wir das Konto sperren. Wir benachrichtigen Sie und geben Ihnen Gelegenheit zur Stellungnahme, es sei denn, aus Sicherheitsgründen ist sofortiges Handeln nötig.',
      ] },
      { h: '13. Verfügbarkeit und Haftung', p: [
        'Wir bemühen uns, Eazy Stock jederzeit verfügbar zu halten, und erstellen regelmäßig Sicherungskopien. Dennoch kann es zu Unterbrechungen durch Wartung, Updates oder Störungen kommen, die außerhalb unseres Einflusses liegen. Geplante Wartungen kündigen wir nach Möglichkeit an.',
        'Eazy Stock hilft Ihnen, Ihr Inventar und Ihre Verkäufe zu führen; die angezeigten Zahlen hängen jedoch davon ab, was Sie erfassen. Prüfen Sie Ihre Daten und bewahren Sie Ihre eigenen Belege auf: Die App ersetzt weder Ihren Steuerberater noch Ihre steuerlichen Pflichten.',
        'Wir haften unbeschränkt bei Vorsatz, grober Fahrlässigkeit sowie bei Schäden an Leben, Körper oder Gesundheit. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen Vertragspflicht und in diesem Fall nur für den vorhersehbaren, vertragstypischen Schaden. Im Übrigen ist die Haftung ausgeschlossen.',
      ] },
      { h: '14. Änderungen dieser Bedingungen', p: [
        'Wir können diese Bedingungen aktualisieren, z. B. bei neuen Funktionen oder Plänen oder aufgrund rechtlicher Änderungen. Wir informieren Sie mindestens 30 Tage im Voraus per E-Mail oder in der App. Wenn Sie nicht einverstanden sind, können Sie vor dem Inkrafttreten kündigen; nutzen Sie Eazy Stock nach diesem Datum weiter, gelten die neuen Bedingungen.',
      ] },
      { h: '15. Anwendbares Recht und Gerichtsstand', p: [
        'Für diese Bedingungen gilt deutsches Recht. Gerichtsstand für alle Streitigkeiten ist Berlin (Deutschland).',
        'Sollte ein Teil dieser Bedingungen unwirksam sein, bleibt der Rest wirksam.',
      ] },
      { h: '16. Kontakt', p: [
        `Fragen zu Ihrem Abonnement, einer Abbuchung oder diesen Bedingungen? Schreiben Sie uns an ${LEGAL_ENTITY.email}.`,
      ] },
    ],
  },
}
