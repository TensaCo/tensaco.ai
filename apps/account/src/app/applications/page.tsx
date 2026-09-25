'use client'
import Link from 'next/link'
import { useState } from 'react'
import { fmtDate, SITE } from '@/lib/api'
import { Shell, Status, useAccount } from '@/components/Shell'
import u from '@/components/ui.module.css'

const TABS = [['all', 'All'], ['received', 'Received'], ['reviewing', 'Under review'], ['interviewing', 'Interviewing'], ['offer', 'Offer'], ['closed', 'Closed']] as const

function Apps() {
  const { account, staff } = useAccount()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const all = account.applications
  const rows = all.filter((a) => (tab === 'all' || a.status === tab) && (!q || `${a.name} ${a.email} ${a.jobTitle}`.toLowerCase().includes(q.toLowerCase())))
  if (!staff) {
    return (
      <div className={u.panel}>
        {all.length === 0 ? <p className={u.empty}>You haven’t applied to a position yet. <a href={`${SITE}/careers/`}>See open positions</a></p> : (
          <div className={u.tableWrap}><table className={u.table}>
            <thead><tr><th>Position</th><th>Status</th><th>Applied</th></tr></thead>
            <tbody>{all.map((a) => (
              <tr key={a.id}><td>{a.jobId === 'general' ? a.jobTitle : <a href={`${SITE}/careers/${a.jobId}/`}>{a.jobTitle}</a>}</td><td><Status value={a.status} /></td><td className={`${u.muted} ${u.nowrap}`}>{fmtDate(a.createdAt)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    )
  }
  return (
    <div className={u.panel}>
      <div className={u.tabs} role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}<span>{all.filter((a) => k === 'all' || a.status === k).length}</span></button>)}
      </div>
      <div className={u.pad} style={{ paddingBottom: 0 }}><input className={u.search} placeholder="Search name, email or position" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /></div>
      {rows.length === 0 ? <p className={u.empty}>Nothing here.</p> : (
        <div className={u.tableWrap} style={{ marginTop: 14 }}><table className={u.table}>
          <thead><tr><th>ID</th><th>Applicant</th><th>Position</th><th>Status</th><th>Applied</th></tr></thead>
          <tbody>{rows.map((a) => (
            <tr key={a.id}>
              <td className={u.id}>#{a.id}</td>
              <td><Link href={`/applications/view/?id=${a.id}`}>{a.name}</Link><div className={u.muted}>{a.email}</div></td>
              <td>{a.jobTitle}</td>
              <td><Status value={a.status} /></td>
              <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(a.createdAt)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  )
}


export default function Applications() {
  return (
    <Shell title="Applications" crumbs={[{ label: 'Applications' }]}
      description="Job applications to TensaCo. Applications sent with your account email appear here; we email you when their status changes."
      actions={<a href={`${SITE}/careers/`} className={`${u.btn} ${u.ghost}`}>Open positions</a>}>
      <Apps />
    </Shell>
  )
}
