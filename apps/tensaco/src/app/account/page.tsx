'use client'
import Link from 'next/link'
import { fmtDate } from '@/lib/api'
import { Portal, SERVICE_NAMES, Status, useAccount } from '@/components/portal/Portal'
import u from '@/components/portal/ui.module.css'

function Overview() {
  const { account } = useAccount()
  const open = account.tickets.filter((t) => t.status !== 'resolved')
  return (
    <>
      <div className={u.cards}>
        <Link href="/account/support/" className={u.card}><b>{open.length}</b><span>Open support conversations</span></Link>
        <Link href="/account/services/" className={u.card}><b>{account.requests.length}</b><span>Service requests</span></Link>
        <Link href="/account/applications/" className={u.card}><b>{account.applications.length}</b><span>Job applications</span></Link>
      </div>
      <div className={u.panel}>
        <h2>Recent support</h2>
        {account.tickets.length === 0
          ? <p className={u.empty}>No conversations yet. <Link href="/account/support/">Contact customer success</Link>.</p>
          : <table className={u.table}><tbody>{account.tickets.slice(0, 5).map((t) => (
              <tr key={t.id}><td><Link href={`/account/support/ticket/?id=${t.id}`}>{t.subject}</Link></td><td><Status value={t.status} /></td><td className={u.muted}>{fmtDate(t.updatedAt)}</td></tr>
            ))}</tbody></table>}
      </div>
      <div className={u.panel}>
        <h2>Service requests</h2>
        {account.requests.length === 0
          ? <p className={u.empty}>No requests yet. <Link href="/account/services/">Request PHASER compute or TensorCode services</Link>.</p>
          : <table className={u.table}><tbody>{account.requests.slice(0, 5).map((r) => (
              <tr key={r.id}><td><Link href={`/account/services/request/?id=${r.id}`}>{SERVICE_NAMES[r.service]}</Link></td><td><Status value={r.status} /></td><td className={u.muted}>{fmtDate(r.createdAt)}</td></tr>
            ))}</tbody></table>}
      </div>
    </>
  )
}

export default function AccountHome() {
  return <Portal title="Overview"><Overview /></Portal>
}
