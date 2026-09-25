'use client'
import { useEffect, useState } from 'react'
import { api, fmtDate } from '@/lib/api'
import { Shell, useAccount } from '@/components/Shell'
import u from '@/components/ui.module.css'

type Row = { id: number; email: string; name: string; organization: string | null; role: string; emailVerifiedAt: string | null; createdAt: string; lastLoginAt: string | null; tickets: number; requests: number }

function Directory() {
  const { staff } = useAccount()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [q, setQ] = useState('')
  useEffect(() => { if (staff) api<{ users: Row[] }>('/api/staff/users').then((r) => setRows(r.ok ? r.data.users : [])) }, [staff])
  if (!staff) return <div className={u.panel}><p className={u.empty}>This page is for TensaCo staff.</p></div>
  if (!rows) return <p className={u.muted}>Loading…</p>
  const shown = rows.filter((r) => !q || `${r.name} ${r.email} ${r.organization ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className={u.panel}>
      <div className={u.panelHead}><input className={u.search} placeholder="Search name, email or organization" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /><span className={u.muted}>{shown.length} of {rows.length}</span></div>
      <div className={u.tableWrap}><table className={u.table}>
        <thead><tr><th>Name</th><th>Organization</th><th>Email</th><th>Tickets</th><th>Requests</th><th>Joined</th><th>Last sign-in</th></tr></thead>
        <tbody>{shown.map((r) => (
          <tr key={r.id}>
            <td>{r.name} {r.role === 'staff' && <span className={u.tag}>Staff</span>}</td>
            <td className={u.muted}>{r.organization ?? '—'}</td>
            <td><a href={`mailto:${r.email}`}>{r.email}</a>{!r.emailVerifiedAt && <div className={u.muted}>Unverified</div>}</td>
            <td className={u.id}>{r.tickets}</td>
            <td className={u.id}>{r.requests}</td>
            <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(r.createdAt)}</td>
            <td className={`${u.muted} ${u.nowrap}`}>{fmtDate(r.lastLoginAt)}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  )
}

export default function Customers() {
  return <Shell title="Customers" crumbs={[{ label: 'Administration' }, { label: 'Customers' }]} description="Every TensaCo account. Staff access is granted in the database (see the repository README)."><Directory /></Shell>
}
