import s from './AuthCard.module.css'

export function AuthSide() {
  return (
    <aside className={s.side} aria-hidden="true">
      <img src="/media/photo/office-interior-1200.jpg" alt="" />
      <div className={s.sideBody}>
        <h2>The TensaCo customer portal</h2>
        <ul>
          <li>Reach our customer success team</li>
          <li>Request PHASER compute and TensorCode services</li>
          <li>Track your requests and applications</li>
        </ul>
      </div>
    </aside>
  )
}
