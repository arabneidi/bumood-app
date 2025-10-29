PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "height" REAL,
    "weight" REAL,
    "timezone" TEXT,
    "personality" TEXT,
    "universityLevel" TEXT,
    "fieldOfStudy" TEXT,
    "interests" TEXT,
    "quoteStyle" TEXT,
    "favoriteAuthors" TEXT,
    "favoriteWriters" TEXT,
    "favoriteSportsFigures" TEXT,
    "favoriteMusicians" TEXT,
    "favoriteArtists" TEXT,
    "favoriteMovies" TEXT,
    "favoritePhilosophers" TEXT,
    "customFavorites" TEXT
, "recentActivities" TEXT);
INSERT INTO User VALUES('dummy-user','Sunny',NULL,NULL,NULL,'female',25,169.0,65.0,NULL,'["ESTJ","ESFP","ISFP"]','master','computer science','["music","literature","technology","gym","cooking"]',NULL,NULL,'j.k. Rowling,jane austin',NULL,NULL,NULL,'friends, big bang theory, inception, euphoria, suits',NULL,'[{"id":"1761330161758","category":"Singer","items":["sabrina cerpenter, taylor swift"]}]','["Quit smoking","One-Pot Meals","Night Photography","Youth Sports Coaching","Puzzle Games","Role-Playing Games (RPGs)","Romantic Comedies","Fitness Walking","Professional Networking Calls","Artistic Expression Workshops"]');
INSERT INTO User VALUES('predefined-goals','Predefined Goals','predefined@goals.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "MoodEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "valence" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "focus" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "sleep" REAL,
    "notes" TEXT,
    "activities" TEXT NOT NULL,
    "selectedTimeSlots" TEXT,
    "selectedSubcategories" TEXT,
    "dssAnalysis" TEXT,
    "reflection" TEXT,
    "voiceNote" TEXT,
    "aiSuggestion" TEXT,
    "timeBucket" TEXT NOT NULL DEFAULT 'morning',
    "onPeriod" BOOLEAN NOT NULL DEFAULT false,
    "waterIntake" INTEGER,
    "mealsEaten" INTEGER,
    "mealQuality" TEXT,
    "caffeine" INTEGER,
    "alcohol" INTEGER,
    "moodComposite" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "periodDay" INTEGER, "activityEntries" TEXT,
    CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" INTEGER,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "completedAt" DATETIME, "dssComponent" TEXT,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 1,
    "unlockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "HabitLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "AISuggestionAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "tried" BOOLEAN NOT NULL DEFAULT false,
    "helpful" BOOLEAN,
    "feedback" TEXT,
    "triedAt" DATETIME,
    "ratedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AISuggestionAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Congratulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionMessage" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 1,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Congratulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Congratulation VALUES('cmh6998xv0007bt0ro7n21rfs','dummy-user','achievement_unlocked','Getting Started','🏆 Amazing work Sunny! You''ve earned the "Getting Started" badge! ⭐','Log your first mood entry','🌟',1,1,1761395254915);
INSERT INTO Congratulation VALUES('cmh69g9up0017bt0rp4low9r2','dummy-user','achievement_unlocked','Activity Explorer','🏆 Amazing work Sunny! You''ve earned the "Activity Explorer" badge! ⭐⭐','Log 10 different activities','🎯',2,1,1761395582688);
INSERT INTO Congratulation VALUES('cmh6a7ksm004fbt0rqhabplk5','dummy-user','achievement_unlocked','Week Warrior','🏆 Amazing work Sunny! You''ve earned the "Week Warrior" badge! ⭐⭐','Log mood for 7 consecutive days','🔥',2,1,1761396856582);
INSERT INTO Congratulation VALUES('cmh7airit0007ifcbw9tlevkz','dummy-user','achievement_unlocked','Early Bird','🏆 Amazing work Sunny! You''ve earned the "Early Bird" badge! ⭐⭐','Log mood before 9 AM for 7 days','🐦',2,1,1761457844693);
INSERT INTO Congratulation VALUES('cmh7d5dvk00171304702sendb','dummy-user','achievement_unlocked','Sleep Champion','🏆 Amazing work Sunny! You''ve earned the "Sleep Champion" badge! ⭐⭐','Log 8+ hours sleep for 7 consecutive days','😴',2,1,1761462259327);
CREATE TABLE IF NOT EXISTS "PeriodTracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "flowIntensity" TEXT,
    "symptoms" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PeriodTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "DailyTracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waterIntake" INTEGER,
    "mealsEaten" INTEGER,
    "mealQuality" TEXT,
    "caffeine" INTEGER,
    "alcohol" INTEGER,
    "exercise" BOOLEAN NOT NULL DEFAULT false,
    "exerciseType" TEXT,
    "exerciseDuration" INTEGER,
    "steps" INTEGER,
    "socialInteraction" BOOLEAN NOT NULL DEFAULT false,
    "screenTime" INTEGER,
    "outdoorTime" INTEGER,
    "meditation" BOOLEAN NOT NULL DEFAULT false,
    "meditationDuration" INTEGER,
    "journaling" BOOLEAN NOT NULL DEFAULT false,
    "readingTime" INTEGER,
    "medicationTaken" BOOLEAN NOT NULL DEFAULT false,
    "supplements" TEXT,
    "symptoms" TEXT,
    "deepworkMinutes" INTEGER DEFAULT 0,
    "tasksCompleted" INTEGER DEFAULT 0,
    "sleepHours" REAL,
    "recoveryAction" BOOLEAN NOT NULL DEFAULT false,
    "positiveSocialTouchpoints" INTEGER DEFAULT 0,
    "dssScore" REAL,
    "learningMomentum" REAL,
    "recoveryIndex" REAL,
    "connectionScore" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ActivityOutcomeConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 1.0,
    "positiveCount" INTEGER NOT NULL DEFAULT 0,
    "negativeCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityOutcomeConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PredefinedGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "dssComponent" TEXT NOT NULL,
    "targetValue" INTEGER,
    "unit" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO PredefinedGoal VALUES('cmh5ik0mj000010ttgwd9q3fl','Run 5K','Run 5 kilometers','health','exercise','RI',30,'days','medium',1,1761350407723,1761350407723);
INSERT INTO PredefinedGoal VALUES('cmh5ik0mn000110ttbbmvp7ju','Gym 3x/week','Go to gym 3 times per week','health','exercise','RI',12,'weeks','medium',1,1761350407727,1761350407727);
INSERT INTO PredefinedGoal VALUES('cmh5ik0mp000210ttrnlfn5wa','Daily yoga','Practice yoga daily','health','exercise','RI',30,'days','medium',1,1761350407730,1761350407730);
INSERT INTO PredefinedGoal VALUES('cmh5ik0ms000310tthqbynguc','Drink 8 glasses water','Drink 8 glasses of water daily','health','nutrition','RI',30,'days','medium',1,1761350407732,1761350407732);
INSERT INTO PredefinedGoal VALUES('cmh5ik0mu000410ttormvs02h','Eat 5 veggies','Eat 5 servings of vegetables daily','health','nutrition','RI',30,'days','medium',1,1761350407734,1761350407734);
INSERT INTO PredefinedGoal VALUES('cmh5ik0mw000510ttxr6vba80','No sugar','Avoid added sugars','health','nutrition','RI',30,'days','medium',1,1761350407737,1761350407737);
INSERT INTO PredefinedGoal VALUES('cmh5ik0mz000610tti6s2con9','Sleep 8 hours','Get 8 hours of sleep nightly','health','sleep','RI',30,'days','medium',1,1761350407740,1761350407740);
INSERT INTO PredefinedGoal VALUES('cmh5ik0n2000710ttxn5hc1zc','Bed by 10pm','Go to bed by 10pm','health','sleep','RI',30,'days','medium',1,1761350407742,1761350407742);
INSERT INTO PredefinedGoal VALUES('cmh5ik0n4000810tti2w6u8xu','No phone before bed','No phone use 1 hour before bed','health','sleep','RI',30,'days','medium',1,1761350407745,1761350407745);
INSERT INTO PredefinedGoal VALUES('cmh5ik0n7000910tt4i0d9prs','Meditate 10 min','Meditate for 10 minutes daily','mental','meditation','RI',30,'days','medium',1,1761350407747,1761350407747);
INSERT INTO PredefinedGoal VALUES('cmh5ik0n9000a10tt2hd2u3oi','Morning mindfulness','Practice morning mindfulness','mental','meditation','RI',30,'days','medium',1,1761350407749,1761350407749);
INSERT INTO PredefinedGoal VALUES('cmh5ik0nb000b10ttn8a44wwb','Evening reflection','Evening reflection practice','mental','meditation','RI',30,'days','medium',1,1761350407751,1761350407751);
INSERT INTO PredefinedGoal VALUES('cmh5ik0nd000c10ttoagdnpkj','Quit smoking','Quit smoking completely','mental','breaking-bad-habits','RI',90,'days','medium',1,1761350407754,1761350407754);
INSERT INTO PredefinedGoal VALUES('cmh5ik0ng000d10tt1dfnuqpn','No alcohol','Avoid alcohol','mental','breaking-bad-habits','RI',30,'days','medium',1,1761350407756,1761350407756);
INSERT INTO PredefinedGoal VALUES('cmh5ik0ni000e10tt3wpmfxy3','Reduce caffeine','Reduce caffeine intake','mental','breaking-bad-habits','RI',30,'days','medium',1,1761350407758,1761350407758);
INSERT INTO PredefinedGoal VALUES('cmh5ik0nk000f10ttzn1179oc','Read 30 min','Read for 30 minutes daily','mental','learning','LM',30,'days','medium',1,1761350407761,1761350407761);
INSERT INTO PredefinedGoal VALUES('cmh5ik0nn000g10ttuqsxux0d','Learn new skill','Learn a new skill','mental','learning','LM',90,'days','medium',1,1761350407763,1761350407763);
INSERT INTO PredefinedGoal VALUES('cmh5ik0no000h10ttmon0a2rf','Take course','Complete an online course','mental','learning','LM',1,'course','medium',1,1761350407765,1761350407765);
INSERT INTO PredefinedGoal VALUES('cmh5ik0np000i10tthrvpyr5t','Complete project','Complete a work project','productivity','work','LM',1,'project','medium',1,1761350407766,1761350407766);
INSERT INTO PredefinedGoal VALUES('cmh5ik0nq000j10ttetg6t6mu','Learn new tool','Learn a new work tool','productivity','work','LM',30,'days','medium',1,1761350407767,1761350407767);
INSERT INTO PredefinedGoal VALUES('cmh5ik0nt000k10tto1dpj2bz','Clean desk daily','Keep desk clean daily','productivity','organization','LM',30,'days','medium',1,1761350407769,1761350407769);
INSERT INTO PredefinedGoal VALUES('cmh5ik0nw000l10ttwmpm8tht','Plan tomorrow','Plan the next day','productivity','organization','LM',30,'days','medium',1,1761350407772,1761350407772);
INSERT INTO PredefinedGoal VALUES('cmh5ik0ny000m10ttkp0o2e0x','Declutter','Declutter living space','productivity','organization','LM',7,'days','medium',1,1761350407775,1761350407775);
INSERT INTO PredefinedGoal VALUES('cmh5ik0o1000n10ttt7bl2rad','Networking','Network professionally','productivity','work','Connection',4,'weeks','medium',1,1761350407778,1761350407778);
INSERT INTO PredefinedGoal VALUES('cmh5ik0o3000o10ttd68r3aoq','Call parents weekly','Call parents once a week','relationships','family','Connection',4,'weeks','medium',1,1761350407780,1761350407780);
INSERT INTO PredefinedGoal VALUES('cmh5ik0o6000p10tts0k1u24z','Family dinner','Have family dinner','relationships','family','Connection',4,'weeks','medium',1,1761350407782,1761350407782);
INSERT INTO PredefinedGoal VALUES('cmh5ik0o8000q10tt19uuwdu8','Quality time','Spend quality time with family','relationships','family','Connection',4,'weeks','medium',1,1761350407784,1761350407784);
INSERT INTO PredefinedGoal VALUES('cmh5ik0oa000r10ttpltm46zy','Meet friend weekly','Meet a friend weekly','relationships','friends','Connection',4,'weeks','medium',1,1761350407786,1761350407786);
INSERT INTO PredefinedGoal VALUES('cmh5ik0oc000s10tt2s7q43rk','Message friends','Message friends regularly','relationships','friends','Connection',30,'days','medium',1,1761350407788,1761350407788);
INSERT INTO PredefinedGoal VALUES('cmh5ik0of000t10ttugcel0vc','Plan outing','Plan social outings','relationships','friends','Connection',4,'weeks','medium',1,1761350407791,1761350407791);
INSERT INTO PredefinedGoal VALUES('cmh5sw8zx0000ab04s4dss2gq','Deep breathing','Practice deep breathing exercises daily','health','stress-management','RI',7,'days','easy',1,1761367774606,1761367774606);
INSERT INTO PredefinedGoal VALUES('cmh5sw8zz0001ab04hyb357kd','Take breaks','Take regular breaks during work','health','stress-management','RI',5,'days','easy',1,1761367774608,1761367774608);
INSERT INTO PredefinedGoal VALUES('cmh5sw9010002ab04hkqmxl4o','Journal stress','Write about daily stressors','health','stress-management','RI',3,'days','medium',1,1761367774609,1761367774609);
INSERT INTO PredefinedGoal VALUES('cmh5sw9020003ab04nk5piq87','Daily gratitude','Write down 3 things you''re grateful for','mental','building-good-habits','RI',7,'days','easy',1,1761367774611,1761367774611);
INSERT INTO PredefinedGoal VALUES('cmh5sw9040004ab04sw88jofn','Positive affirmations','Repeat positive affirmations daily','mental','building-good-habits','RI',7,'days','easy',1,1761367774612,1761367774612);
INSERT INTO PredefinedGoal VALUES('cmh5sw9060005ab04ow9n588h','Mindful moments','Take mindful moments throughout the day','mental','building-good-habits','RI',5,'days','medium',1,1761367774614,1761367774614);
CREATE TABLE IF NOT EXISTS "PredefinedActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dssComponent" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO PredefinedActivity VALUES('cmh5inxhm0000jv9q60w48peq','Exercise','💪','Physical','RI','bg-red-100 text-red-800',1,1761350590282,1761350590282);
INSERT INTO PredefinedActivity VALUES('cmh5inxhn0001jv9qma3bvd97','Walking','🚶','Physical','RI','bg-red-100 text-red-800',1,1761350590283,1761350590283);
INSERT INTO PredefinedActivity VALUES('cmh5inxhn0002jv9qxk5oetey','Yoga','🧘','Physical','RI','bg-red-100 text-red-800',1,1761350590284,1761350590284);
INSERT INTO PredefinedActivity VALUES('cmh5inxho0003jv9q99kdnvgf','Swimming','🏊','Physical','RI','bg-red-100 text-red-800',1,1761350590284,1761350590284);
INSERT INTO PredefinedActivity VALUES('cmh5inxho0004jv9qva4oi3pn','Sleeping','😴','Relaxation','RI','bg-yellow-100 text-yellow-800',1,1761350590285,1761350590285);
INSERT INTO PredefinedActivity VALUES('cmh5inxhp0005jv9qo4mnogu8','Napping','💤','Relaxation','RI','bg-yellow-100 text-yellow-800',1,1761350590285,1761350590285);
INSERT INTO PredefinedActivity VALUES('cmh5inxhp0006jv9qv5z3xfpj','Watching','📺','Relaxation','RI','bg-yellow-100 text-yellow-800',1,1761350590286,1761350590286);
INSERT INTO PredefinedActivity VALUES('cmh5inxhq0007jv9q6srgy1or','Bathing','🛁','Relaxation','RI','bg-yellow-100 text-yellow-800',1,1761350590286,1761350590286);
INSERT INTO PredefinedActivity VALUES('cmh5inxhq0008jv9q7y4l32uu','Massage','💆','Relaxation','RI','bg-yellow-100 text-yellow-800',1,1761350590287,1761350590287);
INSERT INTO PredefinedActivity VALUES('cmh5inxhq0009jv9quuq053tp','Nature','🌿','Relaxation','RI','bg-yellow-100 text-yellow-800',1,1761350590287,1761350590287);
INSERT INTO PredefinedActivity VALUES('cmh5inxhr000ajv9qek82jea7','Meditation','🧘‍♀️','Mental','RI','bg-blue-100 text-blue-800',1,1761350590287,1761350590287);
INSERT INTO PredefinedActivity VALUES('cmh5inxhr000bjv9qzs7ps0km','Planning','📋','Mental','RI','bg-blue-100 text-blue-800',1,1761350590288,1761350590288);
INSERT INTO PredefinedActivity VALUES('cmh5inxhs000cjv9q86fq3n7j','Reading','📚','Mental','LM','bg-blue-100 text-blue-800',1,1761350590288,1761350590288);
INSERT INTO PredefinedActivity VALUES('cmh5inxhs000djv9qg4nh2jk5','Learning','🎓','Mental','LM','bg-blue-100 text-blue-800',1,1761350590288,1761350590288);
INSERT INTO PredefinedActivity VALUES('cmh5inxhs000ejv9qvdr749kb','Writing','✍️','Mental','LM','bg-blue-100 text-blue-800',1,1761350590289,1761350590289);
INSERT INTO PredefinedActivity VALUES('cmh5inxht000fjv9q1dnk70sv','Puzzles','🧩','Mental','LM','bg-blue-100 text-blue-800',1,1761350590289,1761350590289);
INSERT INTO PredefinedActivity VALUES('cmh5inxht000gjv9qui5x1q5w','Working','💼','Work','LM','bg-gray-100 text-gray-800',1,1761350590289,1761350590289);
INSERT INTO PredefinedActivity VALUES('cmh5inxht000hjv9qghexzyl3','studying','📖','Work','LM','bg-gray-100 text-gray-800',1,1761350590290,1761350590290);
INSERT INTO PredefinedActivity VALUES('cmh5inxht000ijv9q4egp5jo8','presenting','📊','Work','LM','bg-gray-100 text-gray-800',1,1761350590290,1761350590290);
INSERT INTO PredefinedActivity VALUES('cmh5inxhu000jjv9qqz4r9sfq','Coding','💻','Work','LM','bg-gray-100 text-gray-800',1,1761350590290,1761350590290);
INSERT INTO PredefinedActivity VALUES('cmh5inxhu000kjv9q6lc2xalt','Socializing','👥','Social','Connection','bg-green-100 text-green-800',1,1761350590290,1761350590290);
INSERT INTO PredefinedActivity VALUES('cmh5inxhu000ljv9q5bxg2x7x','Family Time','👨‍👩‍👧‍👦','Social','Connection','bg-green-100 text-green-800',1,1761350590291,1761350590291);
INSERT INTO PredefinedActivity VALUES('cmh5inxhv000mjv9qhn9bs7bc','calling','📞','Social','Connection','bg-green-100 text-green-800',1,1761350590291,1761350590291);
INSERT INTO PredefinedActivity VALUES('cmh5inxhv000njv9qswo7lkl2','Dating','💕','Social','Connection','bg-green-100 text-green-800',1,1761350590291,1761350590291);
INSERT INTO PredefinedActivity VALUES('cmh5inxhv000ojv9q0nrhh2i9','Meeting','🤝','Social','Connection','bg-green-100 text-green-800',1,1761350590292,1761350590292);
INSERT INTO PredefinedActivity VALUES('cmh5inxhv000pjv9q30kv00pt','Volunteering','🤲','Social','Connection','bg-green-100 text-green-800',1,1761350590292,1761350590292);
INSERT INTO PredefinedActivity VALUES('cmh5inxhw000qjv9qnkfeyv6z','Cooking','👨‍🍳','Creative','Connection','bg-purple-100 text-purple-800',1,1761350590292,1761350590292);
INSERT INTO PredefinedActivity VALUES('cmh5inxhw000rjv9qww4vdr6n','Crafting','✂️','Creative','Connection','bg-purple-100 text-purple-800',1,1761350590292,1761350590292);
INSERT INTO PredefinedActivity VALUES('cmh5inxhw000sjv9q4sjr03q2','Photography','📸','Creative','Connection','bg-purple-100 text-purple-800',1,1761350590293,1761350590293);
INSERT INTO PredefinedActivity VALUES('cmh5inxhx000tjv9qg63b058a','Gaming','🎮','Creative','Connection','bg-purple-100 text-purple-800',1,1761350590293,1761350590293);
INSERT INTO PredefinedActivity VALUES('cmh5inxhx000ujv9qg62168af','Meeting','👔','Work','Connection','bg-gray-100 text-gray-800',1,1761350590293,1761350590293);
INSERT INTO PredefinedActivity VALUES('cmh5inxhx000vjv9q4d77533n','Emailing','📧','Work','Connection','bg-gray-100 text-gray-800',1,1761350590294,1761350590294);
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "DailyTracking_userId_date_key" ON "DailyTracking"("userId", "date");
CREATE UNIQUE INDEX "ActivityOutcomeConnection_userId_activity_outcome_key" ON "ActivityOutcomeConnection"("userId", "activity", "outcome");
COMMIT;
