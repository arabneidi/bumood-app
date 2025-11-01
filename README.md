<div align="center">

# 🎯 BuMood - Personal Mood & Wellness Tracker

**AI-Powered mood tracking app that learns your patterns and provides personalized wellness suggestions**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.6-2D3748)](https://www.prisma.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991)](https://openai.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Live Demo](https://bumood.com) • [Documentation](#documentation) • [Features](#features) • [Getting Started](#getting-started)

</div>

---

## ✨ Overview

**BuMood** is a comprehensive mood tracking application that combines data analytics with AI-powered personalization. Track your mood, activities, sleep, period cycles, meals, and hydration - all in one place. Get intelligent insights, personalized wellness suggestions, and discover patterns in your emotional and physical health.

### 🎯 Key Highlights

- 🤖 **AI-Powered Insights** - Personalized wellness suggestions based on your unique patterns
- 📊 **Advanced Analytics** - Visual charts, heatmaps, and trend analysis
- 🩸 **Period Tracking** - For women to track menstrual cycles with AI-adapted suggestions
- 🏆 **Achievement System** - Unlock badges for consistent tracking
- 📈 **Goal Tracking** - Set personal goals and track daily progress
- 🌐 **Monorepo Architecture** - Web app + iOS mobile app (in development)

---

## 🌟 Features

### Core Tracking

- ✅ **Mood Dimensions** - Track valence, energy, focus, stress, and sleep quality
- ✅ **Activity Logging** - Record daily activities with time slots and subcategories
- ✅ **Period Tracking** - Menstrual cycle tracking with day-by-day analytics (for women)
- ✅ **Nutrition & Hydration** - Track water intake, meals, caffeine, and alcohol
- ✅ **Reflection Notes** - Voice or text notes for deeper context

### AI Personalization

- 🤖 **Smart Suggestions** - AI generates personalized wellness recommendations
- 📝 **Quote Customization** - AI quotes based on your interests, gender, and mood
- 🎯 **Feedback Learning** - AI learns from your thumbs up/down feedback
- 📊 **Pattern Recognition** - Identify what works best for you over time
- 🌙 **Context-Aware** - Suggestions adapt to time of day, period status, and current state

### Analytics & Insights

- 📈 **Mood Trends** - See your mood patterns over time
- 🔥 **Heatmaps** - Visual performance heatmap by day/hour
- 🎯 **DSS (Daily Success Score)** - Calculate your daily wellness score
- 📊 **MC (Mood Composite)** - Track overall emotional wellbeing
- 🏆 **Achievement Badges** - Earn badges for milestones
- 📅 **Power Hours** - Discover your peak performance times
- 🎭 **Activity Drivers** - Which activities boost your mood most

### User Experience

- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 📱 **Mobile-Friendly** - Works seamlessly on phones and tablets
- 🌓 **Dark Mode** - Comfortable viewing in any lighting
- 🔔 **Smart Alerts** - Reminders for hydration, period, and goals
- 🗄️ **Data Export** - Export your data anytime (CSV format)

---

## 🏗️ Architecture

This is a **monorepo** built with modern web technologies:

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion |
| **Database** | PostgreSQL (via Prisma ORM) |
| **AI** | OpenAI GPT-4 |
| **Charts** | Recharts, VisX, Victory Native |
| **Auth** | NextAuth.js |
| **Deployment** | Vercel (Web), Expo (Mobile) |

### Project Structure

```
bumood-monorepo/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/  # React components
│   │   │   ├── lib/      # Utilities & business logic
│   │   │   └── server/   # Server-side API routes
│   │   └── prisma/       # Database schema
│   └── mobile/           # Expo React Native app (iOS)
│       └── App.tsx       # Main mobile entry
├── packages/
│   └── shared/           # Shared types & API client
│       ├── src/
│       │   ├── types.ts
│       │   └── api-client.ts
│       └── package.json
├── package.json          # Root workspace config
└── pnpm-workspace.yaml   # pnpm workspaces
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **pnpm** ≥ 8.15.0
- **PostgreSQL** database (or use Docker)
- **OpenAI API Key** (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/arabneidi/bumood-app.git
cd bumood-app
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bumood"

# OpenAI API Key (for AI features)
OPENAI_API_KEY="sk-your-api-key-here"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Optional: Other AI providers
GEMINI_API_KEY=""
TEXTCORTEX_API_KEY=""
```

4. **Set up the database**
```bash
cd apps/web
pnpm db:push        # Push schema to database
pnpm db:seed        # Seed initial data
```

5. **Start the development server**
```bash
# From root directory
pnpm dev:web        # Web app on http://localhost:3000
# Or
cd apps/web
pnpm dev
```

### Mobile App (iOS)

```bash
# Start Metro bundler
pnpm dev:mobile

# In the terminal, press 'i' to open iOS simulator
# Or manually:
npx expo start --ios
```

---

## 📚 Documentation

### User Guides

- **[Profile & Tracking Guide](PROFILE-AND-TRACKING-GUIDE.md)** - How to set up your profile and track data
- **[AI Features Guide](AI-FEEDBACK-SYSTEM.md)** - How AI personalization works
- **[Period Tracking](MULTIPLE-ENTRIES-PER-DAY.md)** - Menstrual cycle tracking guide
- **[Personalized Quotes](PERSONALIZED-QUOTES-GUIDE.md)** - Custom AI-generated quotes

### Technical Documentation

- **[AI Data Flow](AI-DATA-FLOW.md)** - What data is sent to OpenAI
- **[Metrics Logic](METRICS-LOGIC.md)** - How MC and DSS are calculated
- **[Database Backups](README.md)** - Database backup/clone procedures
- **[Goal DSS Analysis](goal-dss-analysis.md)** - Goal tracking algorithms

### API Endpoints

Key API routes (see `apps/web/src/app/api/`):

| Endpoint | Purpose |
|----------|---------|
| `/api/mood-entries` | CRUD for mood entries |
| `/api/ai-suggestions` | Get AI wellness suggestions |
| `/api/period-tracking` | Period cycle management |
| `/api/goals` | Goal tracking |
| `/api/achievements` | Badge management |
| `/api/dss` | Daily Success Score calculation |
| `/api/power-hours` | Performance time analysis |

---

## 🛠️ Development

### Available Scripts

```bash
# Web app
pnpm dev:web              # Start development server
pnpm build:web            # Build for production
pnpm typecheck            # TypeScript type checking
pnpm lint                 # ESLint

# Database
pnpm db:generate          # Generate Prisma client
pnpm db:push              # Push schema changes
pnpm db:studio            # Open Prisma Studio GUI

# Mobile app
pnpm dev:mobile           # Start Expo dev server
```

### Database Management

**Backup current database:**
```bash
bash scripts_backup_now.sh
```

**Clone to main database:**
```bash
bash scripts_clone_to_main.sh
```

**Restore from main:**
```bash
bash scripts_restore_from_main.sh
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Next.js recommended config
- **Prettier** - Auto-formatting
- **Husky** - Pre-commit hooks

---

## 📊 Project Status

### ✅ Completed

- [x] Web application (Next.js)
- [x] Database schema & Prisma setup
- [x] Mood tracking & analytics
- [x] AI-powered suggestions
- [x] Period tracking
- [x] Achievement system
- [x] Goal tracking
- [x] Data visualization
- [x] User feedback system
- [x] Monorepo setup

### 🚧 In Progress

- [ ] iOS mobile app (Expo)
- [ ] Android mobile app
- [ ] Real-time notifications
- [ ] Social features
- [ ] Data export improvements

### 🔮 Planned

- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Integration with wearables
- [ ] Advanced analytics dashboard
- [ ] Team/group tracking

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **Vercel** for hosting and deployment
- **Next.js** team for the amazing framework
- **Prisma** for the excellent ORM
- All contributors and users of BuMood

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/arabneidi/bumood-app/issues)
- **Email**: support@bumood.com
- **Website**: [bumood.com](https://bumood.com)

---

<div align="center">

**Made with ❤️ for better mental and physical wellbeing**

⭐ Star us on GitHub if you find BuMood helpful!

</div>
