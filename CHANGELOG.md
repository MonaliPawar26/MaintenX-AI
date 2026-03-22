# Changelog

All notable changes to MaintenX AI are documented here.

## [2.0.0] — 2024-01-22

### Added
- **Profile Page** — Skills bars, certifications, performance metrics chart, activity timeline, edit mode
- **Settings Page v2** — 6 rich settings cards (Display & Theme, Notifications, AI & Automation, Dashboard & Workflow, Security & Privacy, Integrations); keyboard shortcuts panel; danger zone
- **Sidebar** — Profile and Settings added under "Account" section
- **Nav click** — User avatar now navigates to Profile page
- **Keyboard shortcuts** — Alt+D/K/P/E/R/C/U wired up globally
- `GET /api/analytics/mttr` — Mean Time To Repair endpoint
- `GET /api/users/available` — Smart technician availability endpoint
- User model expanded: bio, jobTitle, phone, location, certifications array

### Changed
- Settings page no longer shows backend URL fields
- Frontend `countUpStr` signature fixed
- All skill bar animations trigger on profile load

### Fixed
- Template literal syntax error in predictions render
- `countUpStr` called with correct argument order in profile stats

---

## [1.0.0] — 2024-01-18

### Added
- Full-stack project: Node.js backend, FastAPI AI service, MongoDB, Nginx, Docker Compose
- Landing page with hero, features (9 cards), how-it-works, tech stack, pricing, testimonials, footer
- Login page with Google OAuth + email/password form
- Dashboard with KPIs, AI alerts, 3D gear (Three.js), insights panel, activity, status chart, Kanban preview
- Equipment registry with ML risk scores, animated bars, predict/history/delete
- Kanban board — full drag-and-drop, PATCH to backend, overdue red highlighting
- AI Predictions — per-asset gauges, failure countdown, AI recommendations
- Calendar — monthly view, click-to-schedule, colour-coded events
- Analytics — 4 Chart.js charts
- AI Chatbot (FAB) — NLP → auto-creates maintenance ticket
- Google OAuth + JWT authentication
- RandomForest + GradientBoosting ML models (3000 synthetic training samples)
- CI/CD pipeline via GitHub Actions
