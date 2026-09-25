'use client'
import Link from 'next/link'
import { fmtDate } from '@/lib/api'
import { Portal, Status, useAccount } from '@/components/portal/Portal'
import u from '@/components/portal/ui.module.css'

function Apps() {
  const { account } = useAccount()
  return (
    <div className={u.panel}>
      <h2>Your applications</h2>
      {account.applications.length === 0
        ? <p className={u.empty}>You haven’t applied to a position yet. <Link href="/careers/">See open positions</Link>.</p>
        : <table className={u.table}>
            <thead><tr><th>Position</th><th>Status</th><th>Applied</th></tr></thead>
            <tbody>{account.applications.map((a) => (
              <tr key={a.id}><td>{a.jobId === 'general' ? a.jobTitle : <Link href={`/careers/${a.jobId}/`}>{a.jobTitle}</Link>}</td><td><Status value={a.status} /></td><td className={u.muted}>{fmtDate(a.createdAt)}</td></tr>
            ))}</tbody>
          </table>}
      <p className={u.muted} style={{ marginTop: 16 }}>Applications submitted with your account email appear here.</p>
    </div>
  )
}

export default function Applications() {
  return <Portal title="Applications"><Apps /></Portal>
}
