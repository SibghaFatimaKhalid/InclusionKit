# Semester Project Proposal Form
**Department of Software Engineering**  
**Faculty of Engineering, Science & Technology (FEST)**  
**Batch:** 2023 | **Semester:** 5th (Fall 2026) | **Course:** Human-Computer Interaction (HCI)

---

### FYP / Project Title:
**InclusionKit:** An Accessible Assistive Web Toolkit Integrating WCAG 2.1 AAA Two-Way Conversational Voice Navigation and Procedural Cross-Modal Tactile-Acoustic Emulation (HCI Topics 3 & 8)

---

### Domain:
Human-Computer Interaction (HCI), Assistive Computing, Universal Design, Web Accessibility (W3C WCAG 2.1 / WAI-ARIA), Multimodal Interfaces & Cross-Modal Sensory Substitution.

---

### Nature of Project:
- [x] **New Project**
- [ ] Industrial Collaboration
- [ ] Funded Project
- [ ] Extension of Existing Project
- [x] Academic & Assistive Computing Research

---

### Problem Statement:
Digital exclusion remains a pervasive challenge across modern interactive web applications, particularly in e-commerce interfaces. Over 1.3 billion individuals globally live with significant visual, motor, auditory, or cognitive disabilities. Current mainstream web applications suffer from four foundational accessibility bottlenecks:

1. **Failure of Multimodal Independence (WCAG 1.4.1):** Most commercial shopping sites rely exclusively on visual color swatches to denote product finishes without geometric or textual cues, rendering them unidentifiable to individuals with Color Vision Deficiencies (Protanopia, Deuteranopia, Tritanopia, Achromatopsia).
2. **Absence of Hardware-Free Tactile Emulation:** Standard web browsers lack direct control over physical vibration motors or haptic actuators. Users with sensory and cognitive impairments receive zero physical feedback during digital state boundaries (e.g., reaching maximum purchase limits or stepper bounds).
3. **Fragile and Error-Prone Hands-Free Interaction:** Conventional voice controls are either cloud-dependent, introduce heavy network latency, or frequently crash due to ambient room noise, mic breathing, and regional pronunciation variations. Furthermore, screen readers require steep learning curves, leaving motor-impaired and low-vision users stranded.
4. **Cognitive Overload for Neurodivergent Readers:** Fixed typography, dense tracking, and lack of line-isolation tools induce severe visual stress and character inversion for individuals with dyslexia, ADHD, and reading fatigue.

Without a unified, zero-dependency client-side system, developers are forced to choose between complex third-party paid overlays (which fail WCAG compliance) or completely neglecting assistive accommodations.

---

### Proposed Solution:
**InclusionKit** is a zero-build, client-side, production-grade assistive software framework designed to solve these barriers by operationalizing **HCI Topic 3 (Inclusive Design for Accessibility)** and **HCI Topic 8 (Visual Haptic & Tactile Emulation)**:

1. **Two-Way Conversational Voice Architecture & "Point-to-Speak" Hover-to-Read Engine:**
   - Real-time continuous hands-free speech recognition (Web Speech API) with an intelligent noise-filtering and pronunciation-tolerant intent matching engine that handles accents and ambient noise.
   - Interactive **Hover-to-Read Mode:** As users glide their mouse across the interface, elements (headings, buttons, swatches, prices, reviews) are visually highlighted with accessible outlines and read aloud dynamically via conversational Text-to-Speech (TTS).
   - Instant speech dismissal (`"Stop speaking"` / `"Silence"`), smooth viewport scrolling, and full e-commerce checkout navigation via voice.

2. **Procedural Cross-Modal Acoustic-Tactile Engine (Topic 8):**
   - Synthesizes tactile sensory feedback **without external MP3 files or physical vibration hardware**. Native Web Audio API oscillators and biquad filters procedurally emulate mechanical spring compression (`.tactile-bump`), radial surface shockwaves (`.haptic-ripple`), and boundary collision recoils at limits (0 to 5 quantity bounds).
   - Generates synthetic continuous acoustic masking noise (Rain/Pink noise) to enhance cognitive focus for users with ADHD and sensory processing disorders.

3. **Dynamic Adaptability Engine & Multi-Sensory Swatches (Topic 3):**
   - Live SVG color deficiency simulation filters paired with distinct geometric shape indicators (Circle Obsidian, Square Chalk, Triangle Coral, Diamond Azure) ensuring 100% identification under complete monochrome/grayscale conditions.
   - Solid 18:1 AAA High-Contrast Mode (`data-contrast="high"`) with dedicated hover state luminosity preservation.
   - Dynamic typography scaling (100% to 200%), OpenDyslexic weighted-base fonts, Atkinson Hyperlegible braille typography, and an interactive Reading Ruler line-guide.

4. **Self-Contained Offline PWA & Examiner Live Inspector:**
   - Zero console errors, offline Service Worker (`sw.js`) caching, high-visibility WCAG 2.4.11 focus rings, keyboard switch navigation (`V`, `C`, `F`, `?`, `Esc`), and a real-time DOM WCAG Live Inspector with examiner viva cheat sheets.

---

### Scope of the Project:

#### In-Scope:
- Full client-side WCAG 2.1 Level AA and AAA automated conformance.
- Voice-driven hands-free navigation across all e-commerce actions (scrolling, variant selection, quantity steppers, cart drawer, checkout modal, tab panels).
- Hover-to-Read screen reader cursor emulation with debounced speech synthesis.
- Procedural Web Audio API sound synthesis (ticks, chimes, confirmation, rain masking noise).
- SVG matrix color vision filters (Protanopia, Deuteranopia, Tritanopia, Achromatopsia).
- Specialized fonts (OpenDyslexic, Atkinson Hyperlegible) with letter-spacing and line-height controls.
- Keyboard single-key switch access and focus trap management across all dialogs.
- Progressive Web App (PWA) offline capability and GitHub Pages production deployment.

#### Out-of-Scope:
- Server-side credit card banking transactions (simulated via accessible validation modal).
- Native iOS/Android native app store packaging (designed as a responsive progressive web platform).
- Physical external hardware actuator drivers (the project specifically emulates haptics via cross-modal substitution).

---

### Development / Research Methodology:
The project adopts a hybrid **User-Centered Design (UCD)** and **Iterative Agile Methodology** structured around the **POUR Framework (Perceivable, Operable, Understandable, Robust)**:

1. **Empirical WCAG 2.1 AAA Accessibility Auditing:** Auditing target components against Success Criteria 1.1.1 (Non-text content), 1.4.1 (Use of color), 1.4.3/1.4.6 (Contrast ratios), 2.1.1/2.1.2 (Keyboard operability & focus traps), 2.4.7/2.4.11 (Focus appearance), and 2.5.5 (Target size $\ge 44\times 44\text{px}$).
2. **Cross-Modal Sensory Substitution Formulation:** Mathematical modeling of micro-squash transforms ($0.96\times$ scale), radial dispersion damping curves, and dual-tone procedural square/sine wave frequency synthesis (800Hz / 400Hz).
3. **Speech Recognition Intent Clustering:** Developing a multi-layer fuzzy dictionary with noise-rejection heuristics, conversational token matching, and audio echo cancellation during TTS playback.
4. **Performance & Resiliency Testing:** Stress-testing offline service worker caching, event-loop debounce timing (250ms–600ms), and zero-external-dependency builds.

---

### Resources Involved:
- **Programming Languages & Frameworks:** HTML5 (Semantic), Vanilla JavaScript (ES6+ Modular Architecture), Tailwind CSS (Utility Styling), CSS Custom Properties (Design Tokens).
- **Web Platform APIs:** Web Speech API (`SpeechRecognition`, `SpeechSynthesis`), Web Audio API (`AudioContext`, `BiquadFilterNode`, `OscillatorNode`), Service Worker API, Cache API.
- **Development Tools:** Visual Studio Code, Git & GitHub, Google Chrome DevTools (Lighthouse Accessibility Audit, Rendering tab, Sensor Emulation).
- **Assistive Software Compatibility:** NVDA, Windows Narrator, Apple VoiceOver, Keyboard Switch Access.

---

### Final Outcome / Deliverables:
1. **Production Web Application:** Live, fully operational platform deployed at [https://ahmerkhanniazi.github.io/HCI-Inclusion-Kit/](https://ahmerkhanniazi.github.io/HCI-Inclusion-Kit/).
2. **Modular Codebase:** Clean, linted, zero-dependency codebase (`state.js`, `voiceEngine.js`, `acousticEngine.js`, `visualHaptics.js`, `colorFilters.js`, `typography.js`, `wcagInspector.js`, `ecommerceDemo.js`, `app.js`).
3. **Interactive WCAG Inspector & Viva Defense Guide:** Built-in interactive rubric with examiner demonstration scripts and instant criterion inspection.
4. **Progressive Web App Package:** Offline Service Worker (`sw.js`), Web App Manifest (`manifest.json`), and custom SVG vector icons.
5. **Academic Viva Documentation:** Complete system architecture diagrams, user testing logs, and compliance mapping.

---

### Learning Outcomes:
- Mastery of W3C WCAG 2.1 AA/AAA compliance, WAI-ARIA authoring practices, and accessible focus management.
- Deep comprehension of multimodal interaction, cross-modal sensory substitution, and browser-based haptic emulation.
- Practical engineering proficiency with client-side Web Audio synthesis and Web Speech recognition.
- Architectural design of modular, event-driven, zero-build software architectures for low-resource environments.

---

### Industrial Support (if any):
Academic Open-Source Assistive Technology Initiative (W3C Web Accessibility Guidelines Initiative reference).

---

### FYP / Project Team Members:

| S. No. | Name of the Student | IU Regn No | CGPA | Signature |
| :---: | :--- | :---: | :---: | :---: |
| 1 | **Ahmer Khan Niazi** | *IU Regn No* | *CGPA* | ____________________ |
| 2 | **Saad Gul Channa** | 65921 | 2.57 | ____________________ |

---

### Details of Supervisor / Industrial Advisor:

| Role | Name | Designation & Department | Contact No. | Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Supervisor** | **Dr. Rizwan Munir** | Assistant Professor (CS) | +92 3456550019 | ____________________ |
| **Co-Supervisor** *(if any)* | | | | |
| **Industrial Advisor** *(if any)* | | | | |

---

### Project Milestones & Weekly Schedule (32-Week Roadmap):

| S. No. | Weeks | Milestones | Deliverables |
| :---: | :--- | :--- | :--- |
| **1** | Week 1–2 | Literature review on Web Accessibility, WCAG 2.1 AAA standards, target user personas, problem definition, and SRS freeze. | Project Proposal, SRS, WCAG Success Criteria Mapping. |
| **2** | Week 3–4 | Architecture design of the Adaptability Engine; design tokens formulation; semantic HTML5 wireframing. | High-fidelity UI mockup; baseline HTML layout; initial color contrast audit. |
| **3** | Week 5–6 | Color Vision Deficiency Simulation engine; SVG matrix filters implementation; multi-cue geometric swatch components. | `colorFilters.js`, SVG colorblind matrix, accessible swatch components. |
| **4** | Week 7–9 | Specialized typography system (OpenDyslexic, Atkinson Hyperlegible, dynamic font zoom 100%–200%, letter spacing). | `typography.js`, scalable CSS token architecture. |
| **5** | Week 10–13 | Visual Haptics and Tactile Emulation engine (mechanical spring travel, radial shockwaves, boundary collision recoil). | `visualHaptics.js`, CSS keyframe physics animations. |
| **6** | Week 14–16 | Procedural Acoustic Engine (Web Audio API synthetic click ticks, chimes, confirmation tones, ADHD rain masking noise). | `acousticEngine.js`, semester prototype demonstration. |
| **7** | Week 17–20 | Two-Way Voice System: Web Speech API STT/TTS engine, continuous microphone control, floating badge, and ARIA announcer. | `voiceEngine.js`, live spoken transcript component. |
| **8** | Week 21–25 | Point-to-Speak "Hover-to-Read" mode; noise-filtering and pronunciation-tolerant intent matching; full-site voice control. | Complete hands-free site navigation, Hover-to-Read engine. |
| **9** | Week 26–29 | Accessible e-commerce showcase (cart side-drawer, checkout modal, focus traps, keyboard switch navigation `V`, `C`, `F`, `?`, `Esc`). | `ecommerceDemo.js`, `app.js`, interactive WCAG inspector. |
| **10** | Week 30–32 | PWA offline capability (`sw.js`, `manifest.json`), cross-browser testing, user evaluation, final thesis report, and viva presentation. | Production deployment on GitHub Pages, Final Project Package. |

---

### Project Schedule Gantt Chart:

```
Task / Milestone                              W02  W06  W10  W14  W18  W22  W26  W30  W32
-----------------------------------------------------------------------------------------
1. Lit Review, WCAG 2.1 AAA Scope Freeze     [====]
2. Adaptability Engine Architecture & Design       [====]
3. SVG Color Vision Deficiency Simulation               [====]
4. Specialized Typography & Text Resizing                    [====]
5. Visual Haptic & Tactile Emulation                              [====]
6. Procedural Acoustic Sensory Audio Engine                            [====]
7. Two-Way Speech STT/TTS Voice System                                      [====]
8. Hover-to-Read & Noise-Tolerant Engine                                         [====]
9. E-Commerce Showcase, Drawer & Focus Traps                                          [====]
10. PWA Offline Caching, Audits & Viva Package                                             [===]
-----------------------------------------------------------------------------------------
```

---

### FYP / Project to Sustainable Development Goals (SDGs) Mapping:

| SDGs | Mapping | Description |
| :--- | :---: | :--- |
| **SDG 01. No poverty** | | |
| **SDG 02. Zero hunger** | | |
| **SDG 03. Good health and well-being** | **✓** | Promotes mental well-being and reduces sensory stress for neurodivergent and visually impaired users through calming acoustic masking noise and eye-strain reduction tools. |
| **SDG 04. Quality education** | **✓** | Supports accessible digital literacy, providing OpenDyslexic typography and reading guides that facilitate equal learning opportunities for individuals with dyslexia and ADHD. |
| **SDG 05. Gender equality** | | |
| **SDG 06. Clean water and sanitation** | | |
| **SDG 07. Affordable and clean energy** | | |
| **SDG 08. Decent work and economic growth** | | |
| **SDG 09. Industry, innovation, and infrastructure** | **✓** | Introduces novel cross-modal sensory substitution algorithms and a zero-dependency, open-source assistive framework for modern web infrastructure. |
| **SDG 10. Reduced inequalities** | **✓** | Directly aligns with Target 10.2 by empowering persons with disabilities, ensuring equal digital access and independent shopping capabilities without financial or hardware barriers. |
| **SDG 11. Sustainable cities and communities** | **✓** | Contributes to inclusive public web services and accessible digital public spaces for aging populations and people with permanent, temporary, or situational impairments. |
| **SDG 12. Responsible consumption and production** | | |
| **SDG 13. Climate action** | | |
| **SDG 14. Life below water** | | |
| **SDG 15. Life on land** | | |
| **SDG 16. Peace, justice and strong institutions** | | |
| **SDG 17. Partnerships for the goals** | | |

---

### FYP / Project to Complex Computing Problem (CCP) Mapping:

| CCP Attribute | WP Characteristic | Project Mapping (How Addressed in InclusionKit) |
| :--- | :--- | :--- |
| **Depth of knowledge required** | **WP1:** One or more of ACM Knowledge Areas | Requires deep expertise in Human-Computer Interaction (HCI), Digital Signal Processing (Web Audio API), Natural Language Processing / Speech Recognition (Web Speech API), W3C WAI-ARIA standards, and browser event concurrency. |
| **Range of conflicting requirements** | **WP2:** Wide-ranging or conflicting technical/computing issues | Balancing high auditory fidelity against browser performance; zero-latency continuous voice listening without microphone audio feedback loops; 18:1 high contrast mode without visual text degradation on dynamic hover states. |
| **Depth of analysis required** | **WP3:** No obvious solution | Cross-modal sensory substitution has no standardized browser API for haptic actuators. Synthesizing physical sensation through synchronous visual squash-and-stretch and procedural audio oscillators required custom empirical modeling. |
| **Familiarity of issues** | **WP4:** Involve infrequently encountered issues | Real-time speech recognition in noisy environments without cloud backends frequently causes infinite abort loops; handling continuous audio input across regional accents required custom heuristic intent clustering. |
| **Extent of applicable codes** | **WP5:** Outside problems encompassed by standards & codes | While WCAG 2.1 sets criteria, it does not prescribe implementation code. The project pioneers procedural acoustic masking and point-to-speak cursor engines that exceed existing baseline industry specifications. |
| **Extent of stakeholder involvement** | **WP6:** Diverse groups of stakeholders with varying needs | Caters to diverse user groups with conflicting needs: low-vision users requiring high contrast, photosensitive users requiring reduced motion, dyslexic users requiring weighted fonts, and motor-impaired users needing switch/voice navigation. |
| **Interdependence** | **WP7:** Many component parts or sub-problems | The voice recognizer, TTS synthesizer, visual haptic trigger, acoustic engine, state management, focus trap controllers, and service worker offline cache are tightly coupled and must execute synchronously without race conditions. |

---

### For Office Use Only:

| Status | Verification |
| :--- | :--- |
| **[ ] Proposal Approved** | **[ ] Not Approved** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **[ ] Returned for Clarification / Modification** |

**Comments (if any):**  
____________________________________________________________________________________________________  
____________________________________________________________________________________________________  

**Project Serial No.:** ____________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Date:** ____________________  

<br>

______________________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ______________________________________  
**Signature FYP Coordinator** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Signature Chairperson**  

<br>

______________________________________  
**Signature Associate Dean / Dean**  

---

### Annexure – A: Knowledge Areas in ACM Mapping

| # | ACM Knowledge Area | InclusionKit Project Mapping |
| :-: | :--- | :--- |
| **1** | **AL – Algorithms and Complexity** | Fuzzy phonetic intent matching algorithms; debounced event throttling (250ms/600ms); Levenshtein string distance heuristics for speech recognition. |
| **2** | **AR – Architecture and Organization** | Modular namespaced architecture (`window.InclusionKit.*`) enabling loose coupling and zero-build execution across browsers. |
| **3** | **CN – Computational Science** | Mathematical modeling of procedural acoustic waveforms (sine/square oscillators, low-pass biquad frequency cutoff at 800Hz, exponential decay curves). |
| **4** | **DS – Discrete Structures** | DOM tree traversal algorithms; circular keyboard focus trap loops (`firstFocusable` $\leftrightarrow$ `lastFocusable`) for modal accessibility. |
| **5** | **GV – Graphics and Visualization** | SVG color matrix manipulation for colorblindness emulation (Protanopia, Deuteranopia, Tritanopia, Achromatopsia live matrix filters). |
| **6** | **HCI – Human-Computer Interaction** | **Core Pillar (Topics 3 & 8):** Inclusive design, universal accessibility (WCAG 2.1 AAA), cross-modal sensory substitution, and assistive cognitive tools. |
| **7** | **IAS – Information Assurance & Security** | Client-side execution ensuring user speech transcripts, cursor telemetry, and accessibility preferences never leave the local browser. |
| **8** | **IM – Information Management** | Persistent client-side preference storage via `localStorage` and Service Worker Cache API for complete offline operability. |
| **9** | **IS – Intelligent Systems** | Conversational intent classification; Web Speech recognition with adaptive noise filtering and acoustic echo cancellation. |
| **10** | **NC – Networking and Communication** | Service worker offline request interception, asset pre-caching with `Promise.allSettled`, and resilient progressive web delivery. |
| **11** | **OS – Operating Systems** | Integration with native operating system accessibility layers (Windows Narrator, macOS VoiceOver) and hardware switch devices. |
| **12** | **PBD – Platform-based Development** | Cross-platform web development utilizing modern Web APIs (Web Speech, Web Audio, Service Workers, DOM Level 3 Events). |
| **13** | **PD – Parallel and Distributed Computing** | Asynchronous audio processing threads via Web Audio API and non-blocking background workers in Service Worker threads. |
| **14** | **PL – Programming Languages** | Modern ECMAScript (ES6+) asynchronous patterns (`async/await`, Promises, arrow functions, closures, custom event dispatchers). |
| **15** | **SDF – Software Development Fundamentals** | Clean separation of concerns, defensive programming, automated console error interceptors, and strict input validation. |
| **16** | **SE – Software Engineering** | Comprehensive WCAG compliance testing, user flow verification, Git version control, and production deployment pipeline. |
| **17** | **SF – Systems Fundamentals** | Managing audio hardware channels, CPU cycle conservation during speech synthesis, and memory garbage collection stability. |
| **18** | **SP – Social Issues & Professional Practice** | Direct promotion of digital equity, non-discriminatory universal access, ethical assistive engineering, and dignity for persons with disabilities. |
