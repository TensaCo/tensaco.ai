/**
 * Open positions on /careers. `id` is the URL slug and the value stored with each application (D1 `applications.job_id`).
 * The Worker (worker/careers.ts) only accepts applications for ids listed here, plus 'general'.
 */
export type Department = 'Optics & Photonics' | 'Hardware' | 'Research' | 'Software' | 'Go-to-Market' | 'Operations'

export interface Job {
  id: string
  title: string
  department: Department
  product: 'PHASER' | 'TensorCode' | 'TensaCo'
  location: string
  type: 'Full-time' | 'Internship' | 'Contract'
  level: string
  summary: string
  responsibilities: string[]
  qualifications: string[]
  preferred: string[]
}

const REMOTE = 'Remote (United States)'
const LAB = 'On-site / hybrid (United States)'

export const JOBS: Job[] = [
  {
    id: 'optical-systems-engineer', title: 'Optical Systems Engineer', department: 'Optics & Photonics', product: 'PHASER', location: LAB, type: 'Full-time', level: 'Senior',
    summary: 'Design and build the free-space optical cavity at the heart of PHASER, from simulation to the first bench prototype.',
    responsibilities: ['Design the recurrent optical cavity: relay optics, couplers, mirrors and the modulator stack', 'Translate simulator results into alignment tolerances, loss budgets and a buildable layout', 'Assemble, align and characterize bench prototypes', 'Work with research to close the loop between measured and simulated behaviour'],
    qualifications: ['Degree in optics, physics, electrical engineering or equivalent experience', '5+ years designing and building free-space optical systems', 'Hands-on alignment of multi-element optical setups', 'Fluency with an optical design or wave-propagation tool'],
    preferred: ['Experience with spatial light modulators or holography', 'Laser cavity or resonator experience', 'Python for automation and data analysis'],
  },
  {
    id: 'photonics-research-scientist', title: 'Photonics Research Scientist', department: 'Research', product: 'PHASER', location: LAB, type: 'Full-time', level: 'Staff',
    summary: 'Lead research on optical computation: recurrent optical dynamics, nonlinearities and the physics of energy per operation.',
    responsibilities: ['Set the research agenda for PHASER’s computational capabilities', 'Design experiments, in simulation and on the bench, and report results rigorously', 'Develop models of noise, loss and gain that predict real hardware', 'Publish and present findings'],
    qualifications: ['PhD in physics, optics, electrical engineering or a related field', 'A record of research in photonics, nonlinear optics or optical computing', 'Strong numerical modeling skills'],
    preferred: ['Experience with optical neural networks or reservoir computing', 'Semiconductor gain media or saturable absorbers', 'Experience bringing research to a prototype'],
  },
  {
    id: 'laser-gain-media-engineer', title: 'Laser and Gain Media Engineer', department: 'Optics & Photonics', product: 'PHASER', location: LAB, type: 'Full-time', level: 'Mid–Senior',
    summary: 'Own the gain stage that keeps light circulating in PHASER: amplification, saturation and stability over millions of round trips.',
    responsibilities: ['Select, integrate and characterize gain media and pump sources', 'Measure gain saturation and noise, and feed them back into the simulator', 'Design the thermal and electrical environment for stable operation'],
    qualifications: ['Experience with semiconductor optical amplifiers, fiber or solid-state gain media', 'Laser safety practice and laboratory experience', 'Degree in physics, optics or electrical engineering'],
    preferred: ['Experience with thin-film or vertical-cavity gain structures', 'Pump diode drivers and thermal control'],
  },
  {
    id: 'optomechanical-engineer', title: 'Optomechanical Engineer', department: 'Hardware', product: 'PHASER', location: LAB, type: 'Full-time', level: 'Mid–Senior',
    summary: 'Design the mechanical and thermal structure that holds PHASER’s optics to sub-wavelength stability.',
    responsibilities: ['Design mounts, cages and enclosures for the optical stack', 'Model and control thermal drift and vibration', 'Produce drawings and work with machine shops and suppliers'],
    qualifications: ['Mechanical engineering degree or equivalent experience', 'CAD proficiency and experience designing precision mechanisms', 'Tolerance analysis for optical assemblies'],
    preferred: ['Vacuum or thermal enclosure design', 'Rapid prototyping with 3D printing and extrusion systems'],
  },
  {
    id: 'high-speed-electronics-engineer', title: 'High-Speed Electronics Engineer', department: 'Hardware', product: 'PHASER', location: LAB, type: 'Full-time', level: 'Senior',
    summary: 'Build the modulator drive and photodetector readout electronics that move data into and out of PHASER at optical rates.',
    responsibilities: ['Design modulator drivers, detector front ends and data acquisition', 'Select and integrate ADCs, DACs and FPGAs', 'Characterize bandwidth, noise and energy per sample'],
    qualifications: ['5+ years designing high-speed analog or mixed-signal hardware', 'PCB design and bring-up experience', 'Experience with FPGA-based data acquisition'],
    preferred: ['Experience above 10 GHz', 'Optical transceivers or coherent receivers'],
  },
  {
    id: 'fpga-engineer', title: 'FPGA Engineer', department: 'Hardware', product: 'PHASER', location: REMOTE, type: 'Full-time', level: 'Mid–Senior',
    summary: 'Write the gateware that programs PHASER’s modulators and turns detector samples into results.',
    responsibilities: ['Develop FPGA designs for modulator control and readout', 'Build host interfaces and drivers', 'Verify timing and throughput against the system budget'],
    qualifications: ['Experience with Verilog/SystemVerilog or VHDL', 'High-speed serial interfaces', 'Hardware verification practice'],
    preferred: ['PCIe host interfaces', 'Real-time signal processing'],
  },
  {
    id: 'ml-research-engineer-optical', title: 'Machine Learning Research Engineer, Optical Computing', department: 'Research', product: 'PHASER', location: REMOTE, type: 'Full-time', level: 'Senior',
    summary: 'Map neural networks and algorithms onto PHASER’s physics, and prove where optical computation wins.',
    responsibilities: ['Design training methods for physical and optical neural networks', 'Build fair digital baselines and measure against them', 'Develop compilers from models to modulator programs'],
    qualifications: ['Strong background in deep learning and numerical optimization', 'Experience with PyTorch or JAX', 'Rigorous experimental practice'],
    preferred: ['Physics-aware or differentiable simulation', 'Recurrent networks or reservoir computing'],
  },
  {
    id: 'simulation-engineer', title: 'Simulation Engineer', department: 'Research', product: 'PHASER', location: REMOTE, type: 'Full-time', level: 'Mid–Senior',
    summary: 'Extend PHASER’s wave-optics simulator: faster, more physical and validated against hardware.',
    responsibilities: ['Develop propagation, gain and noise models in the simulator', 'Accelerate simulations on GPUs', 'Build validation suites that compare simulation with measurement'],
    qualifications: ['Experience with scientific computing and numerical methods', 'TypeScript or Python, and GPU programming', 'Fourier optics or wave-propagation fundamentals'],
    preferred: ['WebGPU/WebGL or CUDA', 'Experience maintaining an open-source simulator'],
  },
  {
    id: 'senior-software-engineer-tensorcode-python', title: 'Senior Software Engineer, TensorCode (Python)', department: 'Software', product: 'TensorCode', location: REMOTE, type: 'Full-time', level: 'Senior',
    summary: 'Build the reference implementation of TensorCode: trainable programs, reviewed feedback and portable artifacts.',
    responsibilities: ['Design and implement TensorCode’s core operations and tools', 'Own training, tracing and artifact formats', 'Work with users to take TensorCode from alpha to 1.0'],
    qualifications: ['5+ years building production Python libraries', 'Experience with PyTorch and model training', 'Care for API design, testing and documentation'],
    preferred: ['Open-source maintainer experience', 'Safetensors, Hugging Face Hub integration'],
  },
  {
    id: 'software-engineer-tensorcode-typescript', title: 'Software Engineer, TensorCode (TypeScript)', department: 'Software', product: 'TensorCode', location: REMOTE, type: 'Full-time', level: 'Mid',
    summary: 'Keep the TypeScript port of TensorCode at parity with Python and make it the best way to ship AI features on the web.',
    responsibilities: ['Implement TensorCode operations in TypeScript', 'Maintain file-format and behaviour parity with Python', 'Build examples and integrations for web and Node.js'],
    qualifications: ['3+ years of TypeScript in production', 'Experience with numerical or ML code in JavaScript', 'Strong testing habits'],
    preferred: ['WebGPU or WASM', 'Experience with cross-language parity testing'],
  },
  {
    id: 'developer-relations-engineer', title: 'Developer Relations Engineer', department: 'Go-to-Market', product: 'TensorCode', location: REMOTE, type: 'Full-time', level: 'Mid–Senior',
    summary: 'Help engineering teams succeed with TensorCode through documentation, examples and direct support.',
    responsibilities: ['Write guides, tutorials and reference documentation', 'Build example applications and integrations', 'Represent developers’ needs to the product team'],
    qualifications: ['Engineering background and strong writing', 'Experience with Python and TypeScript', 'Comfort presenting to technical audiences'],
    preferred: ['Experience in developer tools or ML platforms'],
  },
  {
    id: 'platform-engineer', title: 'Platform Engineer', department: 'Software', product: 'TensaCo', location: REMOTE, type: 'Full-time', level: 'Senior',
    summary: 'Run the infrastructure behind TensaCo’s products, research and customer services.',
    responsibilities: ['Operate cloud and edge infrastructure, CI/CD and data pipelines', 'Build the systems behind customer accounts and service requests', 'Own reliability, security and cost'],
    qualifications: ['5+ years in infrastructure or platform engineering', 'Experience with Cloudflare, AWS or GCP', 'Security-minded operational practice'],
    preferred: ['Experience with GPU clusters', 'Infrastructure as code'],
  },
  {
    id: 'head-of-partnerships', title: 'Head of Partnerships, AI Infrastructure', department: 'Go-to-Market', product: 'TensaCo', location: REMOTE, type: 'Full-time', level: 'Director',
    summary: 'Build TensaCo’s relationships with data-centre operators, hardware partners and research institutions.',
    responsibilities: ['Develop design-partner and pilot programs for PHASER and TensorCode', 'Negotiate letters of intent, pilots and partnership agreements', 'Bring customer requirements into product planning'],
    qualifications: ['8+ years in partnerships or enterprise sales in infrastructure, semiconductors or AI', 'Relationships across data-centre or hyperscaler ecosystems', 'Ability to explain deep technology simply'],
    preferred: ['Technical degree', 'Experience at an early-stage hardware company'],
  },
  {
    id: 'technical-program-manager', title: 'Technical Program Manager, Hardware', department: 'Operations', product: 'PHASER', location: LAB, type: 'Full-time', level: 'Senior',
    summary: 'Run the program that takes PHASER from simulation to bench prototype to first systems.',
    responsibilities: ['Plan and track hardware milestones across optics, electronics and research', 'Manage suppliers, lead times and budgets', 'Keep engineering, partners and leadership aligned'],
    qualifications: ['5+ years managing hardware programs', 'Experience with suppliers and long-lead components', 'Engineering background'],
    preferred: ['Photonics or semiconductor programs'],
  },
  {
    id: 'research-intern-optical-computing', title: 'Research Intern, Optical Computing', department: 'Research', product: 'PHASER', location: REMOTE, type: 'Internship', level: 'Intern',
    summary: 'Work on an open research question in optical computation with the PHASER team for a summer or semester.',
    responsibilities: ['Own a research project with a mentor', 'Run simulations and analyze results', 'Write up and present your findings'],
    qualifications: ['Enrolled in a degree in physics, optics, EE, CS or mathematics', 'Programming experience in Python or TypeScript'],
    preferred: ['Coursework in optics or machine learning'],
  },
  {
    id: 'software-engineering-intern', title: 'Software Engineering Intern', department: 'Software', product: 'TensorCode', location: REMOTE, type: 'Internship', level: 'Intern',
    summary: 'Ship real features in TensorCode’s Python or TypeScript implementation.',
    responsibilities: ['Implement and test features with a mentor', 'Improve documentation and examples', 'Present your work at the end of the internship'],
    qualifications: ['Enrolled in a computer science or related degree', 'Experience with Python or TypeScript'],
    preferred: ['Machine learning coursework'],
  },
]

export const DEPARTMENTS = [...new Set(JOBS.map((j) => j.department))]
export const jobById = (id: string) => JOBS.find((j) => j.id === id)
