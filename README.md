# Syncora — Web Application for Organizational Project & Team Management

<div align="center">

![Syncora Banner](https://img.shields.io/badge/Syncora-Project%20Management-4F46E5?style=for-the-badge)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://web-application-for-organizational.vercel.app/)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-Academic-blue?style=for-the-badge)

**A centralized SaaS platform for SMEs — unifying Task Management, Real-time Chat, AI Productivity, and HR Attendance in a single workspace.**

[Live Demo](https://web-application-for-organizational.vercel.app/)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Role-Based Access Control](#-role-based-access-control)
- [Team](#-team)

---

## Overview

**Syncora** is a comprehensive SaaS-based project management and collaboration platform built for Small and Medium Enterprises (SMEs). It solves the critical challenge of tool fragmentation — where teams rely on Zalo/Messenger for chat, Excel/Google Sheets for task tracking, and separate HR software for attendance — by consolidating everything into one secure, multi-tenant workspace.

> 🔗 **Live Application:** [https://web-application-for-organizational.vercel.app/](https://web-application-for-organizational.vercel.app/)

### Why Syncora?

| Problem | Syncora's Solution |
|---|---|
| Scattered tools (chat, tasks, HR) | Single unified SaaS platform |
| Enterprise PM tools too complex/expensive for SMEs | Lightweight, intuitive UI with fair pricing |
| No AI assistance in affordable tools | Built-in AI Magic Subtasks & Daily Brief |
| No HR integration in task managers | IP-based attendance check-in + reporting |
| Data silos across teams | Multi-tenant architecture with strict data isolation |

---

## Key Features

### Authentication & Onboarding
- Email/password registration and login
- Google OAuth 2.0 single sign-on
- 6-digit invite code system with manager approval workflow
- Free vs. Premium plan management (Stripe-powered)

### Core Task Management
- **Kanban Board** with four columns: Backlog → Todo → In Progress → Done
- Drag-and-drop task reordering via floating-point indexing algorithm
- Full Task CRUD with priority levels, deadlines, and assignee selection
- Project-scoped custom labels for task categorization
- File attachments and external resource links per task

### Real-time Collaboration
- **Project-scoped chat rooms** powered by Socket.io — messages persist and broadcast instantly
- **@mention system** in task comments triggers immediate push notifications
- **Meeting scheduler** with automatic conflict detection across projects
- Live push notifications for task assignments, mentions, and deadlines

### AI Productivity (Llama 3.3 via Groq Cloud)
- **Magic Subtasks** — AI analyzes task title & description, auto-generates a structured checklist of actionable subtasks
- **AI Daily Brief** — personalized morning summary of today's tasks and scheduled meetings

### Monitoring & Analytics
- **IP-based Attendance Check-in** — validates employee's public IP against the organization's whitelist before recording
- **Attendance Reports** — filter by date range; view Present / Late / Absent statistics per member
- **Role-based Dashboard** — real-time KPIs, task distribution charts, workload heatmaps, and activity logs

### Administration
- **3-Level RBAC**: Organization Admin (Owner) → Project Manager → Member
- Full project lifecycle management (create, archive, delete) with plan-quota enforcement
- IP Whitelist configuration for attendance security
- Billing management via Stripe Customer Portal (upgrade, cancel, resume subscription)

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | REST API server, event-driven non-blocking I/O |
| **MongoDB + Mongoose** | NoSQL database, multi-tenant schema design |
| **Socket.io** | WebSocket layer for real-time chat & notifications |
| **JSON Web Token (JWT)** | Stateless authentication |
| **Bcrypt** | Password hashing |
| **Stripe** | Payment gateway & webhook handling |
| **Groq Cloud API (Llama 3.3)** | Generative AI for subtask generation and daily briefs |

### Frontend
| Technology | Purpose |
|---|---|
| **React.js** | Component-based SPA framework |
| **React Router DOM** | Client-side routing |
| **Context API** | Global state (auth, project, notifications) |
| **Tailwind CSS** | Utility-first responsive styling |
| **Ant Design** | Dashboard UI components (Stats, Progress, Spinners) |
| **Apache ECharts** | Interactive analytics charts |
| **@hello-pangea/dnd** | Drag-and-drop Kanban board |
| **Socket.io-client** | Real-time WebSocket client |
| **Axios** | HTTP client with JWT interceptors |
| **react-mentions** | @mention tagging in comments |
| **@react-oauth/google** | Google OAuth 2.0 integration |

### DevOps & Services
| Tool | Purpose |
|---|---|
| **Vercel** | Frontend deployment |
| **Stripe Webhooks** | Async subscription sync |
| **MongoDB Atlas** | Cloud database hosting |

---

## System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│              React SPA (Vercel CDN)                        │
│   Tailwind CSS · Ant Design · ECharts · Socket.io-client   │
└─────────────────────────┬─────────────────────────────────┘
                          │  REST (HTTP) + WebSocket
┌─────────────────────────▼─────────────────────────────────┐
│                   APPLICATION LAYER                        │
│             Node.js + Express.js Backend                   │
│  JWT Middleware · RBAC Guards · Socket.io Server           │
│  Controllers: Auth, Task, Project, Chat, Attendance, AI    │
└──────────┬─────────────────────────┬──────────────────────┘
           │                         │
┌──────────▼──────────┐   ┌──────────▼──────────────────────┐
│    DATA LAYER       │   │     THIRD-PARTY SERVICES         │
│   MongoDB Atlas     │   │  Stripe · Groq (Llama 3.3)       │
│  (Multi-tenant      │   │  Google OAuth 2.0                │
│   Shared Schema)    │   └──────────────────────────────────┘
└─────────────────────┘
```

**Multi-Tenancy Design:** Every API request passes through a security middleware that extracts the `organizationId` from the JWT and injects it as a mandatory filter on every database query — guaranteeing strict data isolation between organizations.

---

## Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB instance (local or Atlas)
- Stripe account (for billing features)
- Groq Cloud API key (for AI features)
- Google OAuth 2.0 credentials

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-org/syncora.git
cd syncora
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

**4. Configure environment variables** (see below), then start both servers:

```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:5000` (backend).

---

## Environment Variables

### Backend (`/backend/.env`)
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/syncora

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

CLIENT_URL=http://localhost:5173
```

### Frontend (`/frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Role-Based Access Control

Syncora enforces a strict **3-level hierarchical RBAC** model:

```
Organization Admin (Owner)
├── Full control over billing, IP whitelist, all projects
├── Project Manager
│   ├── Create/assign tasks, approve join requests
│   ├── Schedule meetings, manage project members
│   └── Member
│       ├── Update own task status (drag-and-drop)
│       ├── Chat, comment, @mention
│       └── AI subtasks, daily brief, attendance check-in
```

| Action | Admin | Manager | Member |
|---|:---:|:---:|:---:|
| Upgrade / Cancel Subscription | ✅ | ❌ | ❌ |
| Configure IP Whitelist | ✅ | ❌ | ❌ |
| Create / Delete Projects | ✅ | ❌ | ❌ |
| Create / Assign Tasks | ✅ | ✅ | ❌ |
| Drag-and-Drop Own Tasks | ✅ | ✅ | ✅ |
| Approve Join Requests | ✅ | ✅ | ❌ |
| Schedule Meetings | ✅ | ✅ | ❌ |
| View Attendance Reports | ✅ | ✅ | ❌ |
| Chat in Project | ✅ | ✅ | ✅ |
| AI Magic Subtasks / Daily Brief | ✅ | ✅ | ✅ |

---

## Team

**Group 30 — University of Science and Technology of Hanoi (USTH)**  
Course: GP2526 — Web Application Development

| Name | Student ID |
|---|---|
| Nguyễn Minh Đức | 23BI14102 | Leader |
| Nguyễn Hoàng Dũng | 23BI14111 |
| Huỳnh Anh Dũng | 23BI14114 |
| Trịnh Quang Dũng | 23BI14115 |
| Lưu Trần Minh Hiếu | 23BI14164 |
| Đào Xuân Hiếu | 23BI14161 |

**Supervisor:** MSc. Huỳnh Vinh Nam

---

<div align="center">
  Made with ❤️ by Group 30 · USTH · 2025
</div>
