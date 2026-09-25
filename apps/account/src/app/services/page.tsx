'use client'
import Link from 'next/link'
import { useState } from 'react'
import { fmtDate } from '@/lib/api'
import { SERVICE_NAMES, Shell, Status, useAccount } from '@/components/Shell'
import u from '@/components/ui.module.css'

const TABS = [['all', 'All'], ['submitted', 'Submitted'], ['in_review', 'In review'], ['approved', 'Approved'], ['waitlisted', 'Waitlisted'], ['declined', 'Declined']] as const

function Requests() {
  const { account, staff } = useAccount()
  const [tab, setTab] = useState('all')
  const all = account.requests
  const rows = all.filter((r) => tab === 'all' || r.status === tab)
  return (
    <div className={u.panel}>
      <div className={u.tabs} role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}<span>{all.filter((r) => k === 'all' || r.status === k).length}</span></button>)}
      </div>
      {rows.length === 0 ? <p className={u.empty}>{all.length === 0 ? <>No requests yet. <Link href="/services/new/">Request PHASER compute or TensorCode services</Link></> : 'Nothing here.'}</p> : (
        <div className={u.tableWrap}><table className={u.table}>
          <thead><tr><th>ID</th><th>Service</th>{staff && <th>Customer</th>}<th>Organization</th><th>Status</th><th>Submitted</th><th>Updated</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td className={u.id}>#{r.id}</td>
              <td><Link href={`/services/request/?id=${r.id}`}>{SERVICE_NAMES[r.service] ?? r.service}</Link></td>
              {staff && <td className={u.muted}>{r.customer}</td>}
              <td className={u.muted}>{r.organization ?? '—'}</td>
              <td><Status value={r.status} /></td>
              <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(r.createdAt)}</td>
              <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(r.updatedAt)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  )
}

export default function Services() {
  return (
    <Shell title="Service requests" crumbs={[{ label: 'Service requests' }]} description="Access to PHASER compute and research, and TensorCode deployment and training."
      actions={<Link href="/services/new/" className={u.btn}>Request a service</Link>}>
      <Requests />
    </Shell>
  )
}
