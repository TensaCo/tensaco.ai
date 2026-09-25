'use client'
import Link from 'next/link'
import { fmtDate } from '@/lib/api'
import { CATEGORY_NAMES, SERVICE_NAMES, Shell, Status, useAccount } from '@/components/Shell'
import u from '@/components/ui.module.css'

function Overview() {
  const { account, staff } = useAccount()
  const t = account.tickets, r = account.requests, a = account.applications
  const waiting = staff ? t.filter((x) => x.status === 'open').length : t.filter((x) => x.status === 'awaiting_customer').length
  const active = r.filter((x) => ['submitted', 'in_review'].includes(x.status)).length
  const cards = [
    { href: '/support/', label: staff ? 'Open conversations' : 'Conversations awaiting you', value: waiting, note: `${t.length} total` },
    { href: '/services/', label: staff ? 'Requests to review' : 'Active service requests', value: active, note: `${r.length} total` },
    { href: '/applications/', label: staff ? 'Applications' : 'Job applications', value: a.length, note: staff ? `${a.filter((x) => x.status === 'received').length} not yet reviewed` : 'with your email' },
    { href: '/profile/', label: 'Email', value: account.user.emailVerifiedAt ? 'Verified' : 'Unverified', note: account.user.email },
  ]
  return (
    <>
      <div className={u.cards}>
        {cards.map((c) => <Link key={c.href} href={c.href} className={u.card}><span>{c.label}</span><b>{c.value}</b><small>{c.note}</small></Link>)}
      </div>
      <div className={u.grid2}>
        <div className={u.panel}>
          <div className={u.panelHead}><h2>Recent support</h2><Link href="/support/">View all</Link></div>
          {t.length === 0 ? <p className={u.empty}>No conversations yet. <Link href="/support/new/">Contact customer success</Link></p> : (
            <div className={u.tableWrap}><table className={u.table}>
              <tbody>{t.slice(0, 6).map((x) => (
                <tr key={x.id}>
                  <td className={u.id}>#{x.id}</td>
                  <td><Link href={`/support/ticket/?id=${x.id}`}>{x.subject}</Link>{staff && <div className={u.muted}>{x.customer}</div>}</td>
                  <td className={u.muted}>{CATEGORY_NAMES[x.category] ?? x.category}</td>
                  <td><Status value={x.status} staff={staff} /></td>
                  <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(x.updatedAt)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
        <div className={u.panel}>
          <div className={u.panelHead}><h2>Service requests</h2><Link href="/services/">View all</Link></div>
          {r.length === 0 ? <p className={u.empty}>No requests yet. <Link href="/services/new/">Request a service</Link></p> : (
            <table className={u.table}><tbody>{r.slice(0, 6).map((x) => (
              <tr key={x.id}><td><Link href={`/services/request/?id=${x.id}`}>{SERVICE_NAMES[x.service] ?? x.service}</Link><div className={u.muted}>{staff ? x.customer : fmtDate(x.createdAt)}</div></td><td><Status value={x.status} /></td></tr>
            ))}</tbody></table>
          )}
        </div>
      </div>
    </>
  )
}

export default function Home() {
  return (
    <Shell title="Overview" description="Your TensaCo support conversations, service requests and applications."
      actions={<><Link href="/support/new/" className={`${u.btn} ${u.ghost}`}>New conversation</Link><Link href="/services/new/" className={u.btn}>Request a service</Link></>}>
      <Overview />
    </Shell>
  )
}
