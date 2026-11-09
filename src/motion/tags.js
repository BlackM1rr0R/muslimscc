// as="…" → uyğun m.* komponenti (LazyMotion strict ilə yalnız m.* işlədilir).
import { m } from 'motion/react'

const TAGS = {
  div: m.div, section: m.section, article: m.article, aside: m.aside, header: m.header, footer: m.footer,
  ul: m.ul, ol: m.ol, li: m.li, span: m.span, p: m.p, h1: m.h1, h2: m.h2, h3: m.h3, figure: m.figure,
  a: m.a, button: m.button, main: m.main, nav: m.nav, blockquote: m.blockquote,
}
export const mTag = (as = 'div') => TAGS[as] || m.div
