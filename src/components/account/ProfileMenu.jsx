// Başlıqdakı hesab menyusunda profil seçicisi (yalnız profillər açıqdırsa; HeaderAccount tənbəl yükləyir)
import { pickUi } from '../../utils/uiText'
import { readRegistry, activeId, switchProfile } from '../../utils/profiles'
import { PRF } from './familyText'
import ProfileAvatar from './ProfileAvatar'
import '../../styles/ReadTogether.css'

export default function ProfileMenu({ lang, manageHref, onManage }) {
  const t = pickUi(PRF, lang, 'en')
  const reg = readRegistry()
  if (!reg) return null
  const active = activeId()
  return (
    <div className="hdr-profiles" role="group" aria-label={t.menu} data-testid="hdr-profiles">
      <span className="hdr-profiles__label" aria-hidden="true">{t.menu}</span>
      {reg.list.map((p) => (
        <button key={p.id} type="button" className="hdr-account-menu__item" aria-pressed={p.id === active}
          onClick={() => { if (p.id !== active && switchProfile(p.id)) window.location.reload() }}>
          <ProfileAvatar profile={p} size="sm" /> <bdi>{p.name}</bdi>{p.id === active ? ' ✓' : ''}
        </button>
      ))}
      <a className="hdr-account-menu__item" href={manageHref} onClick={onManage}>{t.manage}</a>
    </div>
  )
}
