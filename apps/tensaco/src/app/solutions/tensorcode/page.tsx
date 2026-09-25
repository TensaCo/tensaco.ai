import type { Metadata } from 'next'
import Link from 'next/link'
import { MEDIA } from '@/data/media'
import { Band, Card, Hero, Split, Stats } from '@/components/Blocks'

export const metadata: Metadata = { title: 'TensorCode — Accountable AI software', description: 'TensorCode builds trainable programs your team can check, correct and own.' }

export default function TensorCode() {
  return (
    <>
      <Hero media={MEDIA.coding} eyebrow="Solutions · TensorCode" title="AI your team can check, correct and own."
        lead="TensorCode lets engineering teams build AI features from trainable programs, improve them with reviewed feedback, and ship them as artifacts they fully control.">
        <div className="btn-row">
          <a href="https://tensorcode.dev" className="btn btn-primary">Visit tensorcode.dev</a>
          <a href="https://tensorcode.dev/docs/" className="btn btn-ghost">Read the documentation</a>
        </div>
      </Hero>

      <section className="section">
        <div className="wrap">
          <Split media={MEDIA.execTeam} eyebrow="The challenge" title="AI decisions your organization has to stand behind.">
            <p>AI now makes and shapes decisions inside business software. When a model is a black box, nobody can explain an outcome, correct a mistake, or prove what changed.</p>
            <p>TensorCode makes learned behaviour something a team can inspect, review, retrain and own.</p>
          </Split>
        </div>
      </section>

      <section className="section mist">
        <div className="wrap">
          <p className="eyebrow">Capabilities</p>
          <h2 className="h2" style={{ marginBottom: 48 }}>From prototype to accountable production.</h2>
          <div className="grid-3">
            <Card media={MEDIA.whiteboard} title="Composable operations"><p>Build programs from encoders, scorers and decoders, or start from complete tools: Investigator, Planner, Decision, Chatbot and Scene.</p></Card>
            <Card media={MEDIA.screens} title="Reviewed feedback"><p>Collect corrections with explicit provenance and train on them. Tracing records which operation produced which value.</p></Card>
            <Card media={MEDIA.office} title="Artifacts you own"><p>Save results as data-only artifacts (configuration plus weights) that reload in a fresh process, from the Hugging Face Hub, or in the other language.</p></Card>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Stats items={[
            { value: 'Python', label: 'reference implementation', note: 'pip install tensorcode' },
            { value: 'TypeScript', label: 'matching port', note: 'npm install tensorcode' },
            { value: '0.4', label: 'alpha release', note: 'APIs may change between alphas' },
            { value: 'Open', label: 'source', note: 'github.com/TensaCo' },
          ]} />
        </div>
      </section>

      <Band media={MEDIA.handshake} title="Bring accountable AI into your products.">
        <div className="btn-row"><Link href="/contact/" className="btn btn-primary">Talk to our team</Link><a href="https://tensorcode.dev" className="btn btn-ghost">tensorcode.dev</a></div>
      </Band>
    </>
  )
}
