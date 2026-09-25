'use client'
import Link from 'next/link'
import { useState } from 'react'
import { fmtDate } from '@/lib/api'
import { CATEGORY_NAMES, Shell, Status, useAccount } from '@/components/Shell'
import u from '@/components/ui.module.css'

const TABS = [['active', 'Active'], ['open', 'Open'], ['awaiting_customer', 'Awaiting customer'], ['resolved', 'Resolved'], ['all', 'All']] as const

function Inbox() {
  const { account, staff } = useAccount()
  const [tab, setTab] = useState<string>('active')
  const [q, setQ] = useState('')
  const all = account.tickets
  const match = (status: string, key: string) => key === 'all' || (key === 'active' ? status !== 'resolved' : status === key)
  const rows = all.filter((t) => match(t.status, tab) && (!q || `${t.subject} ${t.customer} #${t.id}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <div className={u.panel}>
      <div className={u.tabs} role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {k === 'awaiting_customer' && !staff ? 'Awaiting your reply' : l}<span>{all.filter((t) => match(t.status, k)).length}</span>
          </button>
        ))}
      </div>
      {staff && <div className={u.pad} style={{ paddingBottom: 0 }}><input className={u.search} placeholder="Search subject, customer or #" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /></div>}
      {rows.length === 0 ? <p className={u.empty}>{all.length === 0 ? <>No conversations yet. <Link href="/support/new/">Start one</Link></> : 'Nothing here.'}</p> : (
        <div className={u.tableWrap} style={staff ? { marginTop: 14 } : undefined}><table className={u.table}>
          <thead><tr><th>ID</th><th>Subject</th>{staff && <th>Customer</th>}<th>Topic</th><th>Status</th><th>Opened</th><th>Updated</th></tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.id}>
              <td className={u.id}>#{t.id}</td>
              <td><Link href={`/support/ticket/?id=${t.id}`}>{t.subject}</Link></td>
              {staff && <td className={u.muted}>{t.customer}</td>}
              <td className={u.muted}>{CATEGORY_NAMES[t.category] ?? t.category}</td>
              <td><Status value={t.status} staff={staff} /></td>
              <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(t.createdAt)}</td>
              <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(t.updatedAt)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  )
}

export default function Support() {
  return (
    <Shell title="Support" crumbs={[{ label: 'Support' }]} description="Conversations with TensaCo customer success. We reply here and by email."
      actions={<Link href="/support/new/" className={u.btn}>New conversation</Link>}>
      <Inbox />
    </Shell>
  )
}
