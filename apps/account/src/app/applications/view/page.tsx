'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { api, fmtDateTime, param, SITE } from '@/lib/api'
import { Shell, Status, STATUS_NAMES } from '@/components/Shell'
import { Icon } from '@/components/Icon'
import f from '@/components/forms.module.css'
import u from '@/components/ui.module.css'

type A = {
  application: {
    id: number; jobId: string; jobTitle: string; name: string; email: string; status: string; createdAt: string
    phone?: string | null; location?: string | null; linkedin?: string | null; website?: string | null; workAuthorization?: string | null
    coverLetter?: string | null; resumeName?: string | null; resumeSize?: number | null; hasResume?: boolean; country?: string | null; source?: string | null; userId?: number | null
  }
  staff: boolean
}

const link = (v: string | null | undefined) => (v ? <a href={/^https?:\/\//.test(v) ? v : `https://${v}`} target="_blank" rel="noopener noreferrer">{v}</a> : '—')

function View({ r, reload }: { r: A; reload: () => void }) {
  const a = r.application
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const x = await api<{ error?: string }>(`/api/applications/${a.id}`, { method: 'PATCH', json: { status: new FormData(e.currentTarget).get('status') } })
    setMsg(x.ok ? { ok: true, text: 'Saved. The applicant is emailed when the status changes.' } : { ok: false, text: x.data.error ?? 'Could not save.' })
    reload()
  }
  return (
    <div className={u.grid2}>
      <div>
        <div className={u.panel}>
          <div className={u.panelHead}><h2>Applicant</h2><Status value={a.status} /></div>
          <dl className={u.dl}>
            <dt>Name</dt><dd>{a.name}</dd>
            <dt>Email</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd>
            {r.staff && <>
              <dt>Phone</dt><dd>{a.phone ?? '—'}</dd>
              <dt>Location</dt><dd>{a.location ?? '—'}{a.country ? ` (${a.country})` : ''}</dd>
              <dt>LinkedIn</dt><dd>{link(a.linkedin)}</dd>
              <dt>Website</dt><dd>{link(a.website)}</dd>
              <dt>Work authorization</dt><dd>{a.workAuthorization ?? '—'}</dd>
              <dt>Account</dt><dd>{a.userId ? 'Signed in when applying' : 'No account'}</dd>
            </>}
          </dl>
        </div>
        {r.staff && <div className={u.panel}><div className={u.panelHead}><h2>Cover letter</h2></div><p className={u.pad} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{a.coverLetter || <span className={u.muted}>None provided.</span>}</p></div>}
      </div>
      <div>
        <div className={u.panel}>
          <div className={u.panelHead}><h2>Application</h2></div>
          <dl className={u.dl}>
            <dt>Position</dt><dd>{a.jobId === 'general' ? a.jobTitle : <a href={`${SITE}/careers/${a.jobId}/`}>{a.jobTitle}</a>}</dd>
            <dt>Reference</dt><dd>#{a.id}</dd>
            <dt>Applied</dt><dd>{fmtDateTime(a.createdAt)}</dd>
          </dl>
          {r.staff && a.hasResume && (
            <div className={u.pad} style={{ borderTop: '1px solid var(--line)' }}>
              <a className={`${u.btn} ${u.ghost}`} href={`/api/applications/${a.id}/resume`}><Icon name="download" size={16} />Résumé{a.resumeName ? ` · ${a.resumeName}` : ''}</a>
            </div>
          )}
        </div>
        {r.staff && (
          <div className={u.panel}>
            <div className={u.panelHead}><h2>Status</h2><span className={u.tag}>Staff</span></div>
            <form className={`${f.form} ${u.pad}`} onSubmit={save}>
              {msg && <p className={msg.ok ? f.success : f.error} role="status">{msg.text}</p>}
              <select name="status" defaultValue={a.status} className={f.select} aria-label="Status">
                {['received', 'reviewing', 'interviewing', 'offer', 'closed'].map((s) => <option key={s} value={s}>{STATUS_NAMES[s]}</option>)}
              </select>
              <div className={f.actions}><button className={f.submit}>Save</button></div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ApplicationPage() {
  const [r, setR] = useState<A | null>(null)
  const [missing, setMissing] = useState(false)
  const load = useCallback(() => { api<A>(`/api/applications/${param('id')}`).then((x) => (x.ok ? setR(x.data) : setMissing(x.status !== 401))) }, [])
  useEffect(load, [load])
  const title = r ? `${r.application.name} · ${r.application.jobTitle}` : missing ? 'Application not found' : 'Application'
  return (
    <Shell title={title} crumbs={[{ label: 'Applications', href: '/applications/' }, { label: r ? `#${r.application.id}` : '…' }]}>
      {missing ? <div className={u.panel}><p className={u.empty}>This application could not be found. <Link href="/applications/">Back to applications</Link></p></div>
        : !r ? <p className={u.muted}>Loading…</p> : <View r={r} reload={load} />}
    </Shell>
  )
}
