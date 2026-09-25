import { Hero } from '@/components/launch/Hero'
import { Light } from '@/components/launch/Light'
import { MachineSection } from '@/components/launch/Machine'
import { World } from '@/components/launch/World'
import { Latest } from '@/components/launch/Latest'

export default function Page() {
  return (
    <main>
      <Hero />
      <Light />
      <MachineSection />
      <World />
      <Latest />
    </main>
  )
}
