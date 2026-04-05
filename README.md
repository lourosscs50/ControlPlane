# ControlPlane

**Unified operator control plane for real-time decision visibility, execution tracing, and cross-system observability across SignalForge, ChronoFlow, and A.I.L.**

---

## Overview

ControlPlane is the operator-facing system for observing and understanding activity across a distributed platform.

It provides a unified interface to:

- View decisions across systems
- Trace execution flows end-to-end
- Understand how signals, rules, intelligence, and workflows interact
- Navigate between related system entities without losing context

This is a **read-only control system** focused on clarity, traceability, and operational insight.

---

## Architecture Role

ControlPlane sits on top of the platform:

- **SignalForge** → detection and rule-based decisions  
- **ChronoFlow** → workflow orchestration and execution  
- **A.I.L. (AI Intelligence Layer)** → intelligence and decision augmentation  

**Model:**

Core → produces truth  
A.I.L. → produces intelligence  
ControlPlane → produces operator visibility  

---

## Key Features

### Unified Decision Visibility
- Cross-system decision list (SignalForge + A.I.L.)
- Shared decision model
- Consistent rendering across systems

### Cross-System Trace Timeline
- End-to-end timeline across:
  - signals
  - rules
  - alerts
  - executions
  - intelligence decisions
- Honest correlation (no inferred relationships)

### Execution Visibility
- ChronoFlow execution detail integration
- Linked navigation between decisions and executions

### A.I.L. Integration
- Decision visibility aligned with platform model
- Bounded execution metadata (no raw prompts or memory exposure)

---

## Principles

- **Read-only by design**
- **No hidden logic in the UI**
- **No fake correlations**
- **Backend is the source of truth**
- **Operator clarity over convenience**

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS

---

## Status

Active development.

ControlPlane is evolving alongside:
- SignalForge
- ChronoFlow
- A.I.L.

---

## License

Apache License 2.0
