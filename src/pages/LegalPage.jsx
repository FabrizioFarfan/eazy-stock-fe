import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useLang, useT } from '../i18n'
import { Navbar, Footer } from './LandingPage'
import { PageHero, usePublicPage } from './landing/site'
import { IMPRESSUM, IMPRESSUM_LANGS, PRIVACY, PRIVACY_LANGS, PRIVACY_UPDATED, TERMS, TERMS_LANGS, TERMS_UPDATED, LEGAL_ENTITY } from './legal/legalContent'

/**
 * Páginas legales (15-oct-2026): Fabrizio sacó su Partita IVA en Berlín y por ley
 * alemana la web necesita /impressum (§ 5 DDG) y /datenschutz (DSGVO); las dos en
 * alemán vinculante + es/en de cortesía con pestañas (16-oct-2026). Van enlazadas en el footer de la web pública,
 * en el login y al pie de Ajustes. Paso previo a la pasarela de pagos.
 * 22-oct-2026: /terminos (Términos y condiciones, español vinculante + en/de) para
 * cobrar suscripciones con Stripe: renovación, cancelación, reembolsos, solo lectura.
 */

function Prose({ children }) {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">{children}</div>
    </section>
  )
}

/** Pestañas de idioma de las páginas legales (misma pieza en /impressum y /datenschutz). */
function LangTabs({ langs, code, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-white/15 bg-white/5 p-1" role="tablist" aria-label="Sprache / Idioma">
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          role="tab"
          aria-selected={l.code === code}
          onClick={() => onChange(l.code)}
          className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors ${l.code === code ? 'bg-white text-gray-900 shadow' : 'text-slate-300 hover:text-white'}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

/** Idioma inicial de una página legal: navegador en alemán → alemán (vinculante); si no, el de la web si tiene versión, y si no el `fallback`. */
function useLegalLang(docs, lang, fallback = 'de') {
  return useState(() => {
    const nav = (typeof navigator !== 'undefined' && navigator.language || '').slice(0, 2).toLowerCase()
    if (nav === 'de') return 'de'
    return docs[lang] ? lang : fallback
  })
}

/** Cuerpo de un documento por secciones (Datenschutz y Términos comparten la pieza). */
function Sections({ sections }) {
  return (
    <div className="space-y-10">
      {sections.map((s) => (
        <div key={s.h}>
          <h2 className="mb-3 text-lg font-bold text-gray-900">{s.h}</h2>
          {s.p.map((p, j) => <p key={j} className="mt-3 text-[15px] leading-relaxed text-gray-700">{p}</p>)}
        </div>
      ))}
    </div>
  )
}

/** /impressum — § 5 DDG. Alemán vinculante (texto del asesor) + es/en de cortesía, con pestañas como la Datenschutz. */
export function ImpressumPage() {
  const t = useT()
  const { lang } = useLang()
  const [code, setCode] = useLegalLang(IMPRESSUM, lang)
  const doc = IMPRESSUM[code]
  usePublicPage({
    title: 'Impressum — Eazy Stock',
    description: t('Impressum de Eazy Stock: datos del responsable según § 5 DDG.'),
    path: '/impressum',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero kicker={doc.kicker} title={doc.title} sub={doc.sub}>
        <LangTabs langs={IMPRESSUM_LANGS} code={code} onChange={setCode} />
      </PageHero>
      <Prose>
        {doc.note && <p className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{doc.note}</p>}
        <div className="space-y-8">
          {doc.blocks.map((b, i) => (
            <div key={i}>
              {b.h && <h2 className="mb-2 text-base font-bold text-gray-900">{b.h}</h2>}
              {b.lines && (
                <p className="text-[15px] leading-relaxed text-gray-700">
                  {b.lines.map((l, j) => <span key={j} className="block">{l}</span>)}
                </p>
              )}
              {b.p && b.p.map((p, j) => <p key={j} className="mt-2 text-[15px] leading-relaxed text-gray-700">{p}</p>)}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-sm text-gray-700">
            <a href={`mailto:${LEGAL_ENTITY.email}`} className="inline-flex items-center gap-2 font-semibold hover:text-blue-600"><Mail size={15} /> {LEGAL_ENTITY.email}</a>
            <a href={`tel:${LEGAL_ENTITY.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-semibold hover:text-blue-600"><Phone size={15} /> {LEGAL_ENTITY.phone}</a>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/datenschutz" className="text-sm font-semibold text-blue-600 hover:underline">{t('Política de privacidad')} →</Link>
            <Link to="/terminos" className="text-sm font-semibold text-blue-600 hover:underline">{t('Términos y condiciones')} →</Link>
          </div>
        </div>
      </Prose>
      <Footer />
    </div>
  )
}

/** /datenschutz — DSGVO. Arranca en el idioma de la web si tiene versión, si no en alemán. */
export function PrivacyPage() {
  const t = useT()
  const { lang } = useLang()
  const [code, setCode] = useLegalLang(PRIVACY, lang)
  const doc = PRIVACY[code]
  usePublicPage({
    title: `${doc.title} — Eazy Stock`,
    description: t('Qué datos trata Eazy Stock, para qué, dónde se alojan y qué derechos tienes (DSGVO / RGPD).'),
    path: '/datenschutz',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero kicker="Datenschutz" title={doc.title} sub={PRIVACY_UPDATED[code]}>
        <LangTabs langs={PRIVACY_LANGS} code={code} onChange={setCode} />
      </PageHero>
      <Prose>
        <p className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{doc.note}</p>
        <Sections sections={doc.sections} />
        <div className="mt-12 flex flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <a href={`mailto:${LEGAL_ENTITY.email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600"><Mail size={15} /> {LEGAL_ENTITY.email}</a>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/impressum" className="text-sm font-semibold text-blue-600 hover:underline">Impressum →</Link>
            <Link to="/terminos" className="text-sm font-semibold text-blue-600 hover:underline">{t('Términos y condiciones')} →</Link>
          </div>
        </div>
      </Prose>
      <Footer />
    </div>
  )
}

/**
 * /terminos — Términos y condiciones (22-oct-2026). Arranca en el idioma de la web
 * (es/en/de); si no hay versión (italiano), en español, que es la que vale.
 */
export function TermsPage() {
  const t = useT()
  const { lang } = useLang()
  const [code, setCode] = useLegalLang(TERMS, lang, 'es')
  const doc = TERMS[code]
  usePublicPage({
    title: `${doc.title} — Eazy Stock`,
    description: t('Cómo funciona la suscripción a Eazy Stock: planes, pago, renovación, cancelación, reembolsos y qué pasa con tus datos.'),
    path: '/terminos',
  })
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <PageHero kicker={doc.kicker} title={doc.title} sub={TERMS_UPDATED[code]}>
        <LangTabs langs={TERMS_LANGS} code={code} onChange={setCode} />
      </PageHero>
      <Prose>
        <p className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{doc.note}</p>
        <Sections sections={doc.sections} />
        <div className="mt-12 flex flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <a href={`mailto:${LEGAL_ENTITY.email}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600"><Mail size={15} /> {LEGAL_ENTITY.email}</a>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/datenschutz" className="text-sm font-semibold text-blue-600 hover:underline">{t('Política de privacidad')} →</Link>
            <Link to="/impressum" className="text-sm font-semibold text-blue-600 hover:underline">Impressum →</Link>
          </div>
        </div>
      </Prose>
      <Footer />
    </div>
  )
}
