/**
 * Translation strings for the application
 * Supports English and Arabic languages
 */

export type Language = 'en' | 'ar';

export interface Translations {
  common: {
    add: string;
    update: string;
    delete: string;
    cancel: string;
    save: string;
    back: string;
    success: string;
    error: string;
    close: string;
  };
  tabs: {
    home: string;
    addGoal: string;
    statistics: string;
    rewards: string;
    settings: string;
  };
  home: {
    title: string;
    subtitle: string;
    noGoals: string;
    addGoal: string;
    ultimateGoals: string;
    dailyGoals: string;
    weeklyGoals: string;
    monthlyGoals: string;
    yearlyGoals: string;
    customGoals: string;
  };
  templates: {
    title: string;
    subtitle: string;
    useTemplate: string;
    quickStart: string;
    all: string;
    categories: {
      health: string;
      fitness: string;
      learning: string;
      work: string;
      finance: string;
      personal: string;
      social: string;
      hobby: string;
      other: string;
    };
  };
  rewards: {
    title: string;
    subtitle: string;
    all: string;
    useTemplate: string;
    quickRewards: string;
    totalEarned: string;
    spent: string;
    available: string;
    availableRewards: string;
    redeemedRewards: string;
    noRewards: string;
    createRewards: string;
    createReward: string;
    editReward: string;
    icon: string;
    rewardTitle: string;
    description: string;
    descriptionOptional: string;
    pointsCost: string;
    redeem: string;
    redeemed: string;
    deleteReward: string;
    deleteConfirm: string;
    redeemConfirm: string;
    redeemConfirmMessage: string;
    redeemSuccess: string;
    notEnoughPoints: string;
    categories: {
      food: string;
      entertainment: string;
      shopping: string;
      wellness: string;
      experience: string;
      hobby: string;
      tech: string;
      other: string;
    };
  };
  statistics: {
    title: string;
    yourProgress: string;
    totalGoals: string;
    completedGoals: string;
    activeGoals: string;
    totalPoints: string;
    currentStreak: string;
    longestStreak: string;
    completionRate: string;
    days: string;
    achievements: string;
    lockedAchievements: string;
    progressTo: string;
    motivationalQuote: string;
    streakStats: string;
    current: string;
    best: string;
    goalsCompleted: string;
    keepItUp: string;
  };
  goalForm: {
    title: string;
    titlePlaceholder: string;
    titleLabel: string;
    titleHint: string;
    description: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    targetAmount: string;
    targetPlaceholder: string;
    targetLabel: string;
    targetHint: string;
    currentProgress: string;
    currentPlaceholder: string;
    currentLabel: string;
    currentHint: string;
    unit: string;
    unitPlaceholder: string;
    unitLabel: string;
    unitHint: string;
    direction: string;
    directionIncrease: string;
    directionDecrease: string;
    period: string;
    periodDaily: string;
    periodWeekly: string;
    periodMonthly: string;
    periodYearly: string;
    periodCustom: string;
    customPeriodDays: string;
    customPeriodPlaceholder: string;
    points: string;
    pointsPlaceholder: string;
    pointsLabel: string;
    pointsHint: string;
    addButton: string;
    addButtonHint: string;
    addSubgoal: string;
    ultimateGoal: string;
    ultimateGoalHint: string;
    recurringGoal: string;
    recurringGoalHint: string;
    editButton: string;
  };
  goalCard: {
    points: string;
    percent: string;
    subgoals: string;
    ultimate: string;
  };
  goalDetail: {
    notFound: string;
    updateProgress: string;
    deleteGoal: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    updateSuccess: string;
    updateError: string;
    deleteError: string;
    reward: string;
    complete: string;
    subgoalsTitle: string;
    noSubgoals: string;
    addSubgoal: string;
    editGoal: string;
    finishGoal: string;
    finishConfirmTitle: string;
    finishConfirmMessage: string;
    finishSuccess: string;
    finishError: string;
    useSlider: string;
  };
  settings: {
    title: string;
    appearance: string;
    themeSystem: string;
    themeLight: string;
    themeDark: string;
    language: string;
    languageEnglish: string;
    languageArabic: string;
    about: string;
    aboutText: string;
    version: string;
  };
  validation: {
    invalidNumber: string;
    requiredField: string;
    titleRequired: string;
    titleTooLong: string;
    targetRequired: string;
    targetPositive: string;
    targetMin: string;
    targetMax: string;
    currentRequired: string;
    currentValid: string;
    currentMin: string;
    currentMax: string;
    unitRequired: string;
    unitTooLong: string;
    pointsRequired: string;
    pointsValid: string;
    pointsMin: string;
    pointsMax: string;
  };
  achievements: {
    first_goal: { title: string; description: string };
    goal_master: { title: string; description: string };
    century_club: { title: string; description: string };
    point_collector: { title: string; description: string };
    point_legend: { title: string; description: string };
    week_warrior: { title: string; description: string };
    month_champion: { title: string; description: string };
    unstoppable: { title: string; description: string };
    ultimate_creator: { title: string; description: string };
    perfectionist: { title: string; description: string };
  };
  quotes: string[];
  units: {
    kg: string;
    lb: string;
    km: string;
    mi: string;
    books: string;
    pages: string;
    hours: string;
    days: string;
    times: string;
    reps: string;
    calories: string;
    minutes: string;
    dollars: string;
    glasses: string;
    workouts: string;
    courses: string;
    entries: string;
    projects: string;
    photos: string;
    recipes: string;
    words: string;
    steps: string;
    laps: string;
    sessions: string;
    servings: string;
    grams: string;
    cups: string;
    episodes: string;
    videos: string;
    problems: string;
    certs: string;
    emails: string;
    connections: string;
    skills: string;
    presentations: string;
    showers: string;
    items: string;
    areas: string;
    calls: string;
    people: string;
    compliments: string;
    acts: string;
    bags: string;
    trees: string;
    subgoals: string;
  };
  messages: {
    goalsCompleted: string;
    automaticallyResets: string;
    day: string;
    period: string;
  };
  periods: {
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    custom: string;
  };
  labels: {
    target: string;
    category: string;
    description: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      add: 'Add',
      update: 'Update',
      delete: 'Delete',
      cancel: 'Cancel',
      save: 'Save',
      back: 'Back',
      success: 'Success',
      error: 'Error',
      close: 'Close',
    },
    tabs: {
      home: 'Home',
      addGoal: 'Add Goal',
      statistics: 'Stats',
      rewards: 'Rewards',
      settings: 'Settings',
    },
    home: {
      title: 'Pathly',
      subtitle: 'Track your progress, step by step',
      noGoals: 'No goals yet. Create one below to get started!',
      addGoal: 'Add a new goal',
      ultimateGoals: '⭐ Ultimate Goals',
      dailyGoals: '📅 Daily Goals',
      weeklyGoals: '📆 Weekly Goals',
      monthlyGoals: '🗓️ Monthly Goals',
      yearlyGoals: '📊 Yearly Goals',
      customGoals: '⏱️ Custom Goals',
    },
    templates: {
      title: 'Goal Templates',
      subtitle: 'Choose a template to get started quickly',
      useTemplate: 'Use a Template',
      quickStart: 'Quick start with pre-made goals',
      all: 'All',
      categories: {
        health: 'Health',
        fitness: 'Fitness',
        learning: 'Learning',
        work: 'Work',
        finance: 'Finance',
        personal: 'Personal',
        social: 'Social',
        hobby: 'Hobbies',
        other: 'Other',
      },
    },
    rewards: {
      title: 'Rewards',
      subtitle: 'Spend your points on rewards',
      all: 'All',
      useTemplate: 'Use a Template',
      quickRewards: 'Quick rewards from 100+ ideas',
      totalEarned: 'Total Earned',
      spent: 'Spent',
      available: 'Available',
      availableRewards: 'Available Rewards',
      redeemedRewards: 'Redeemed Rewards',
      noRewards: 'No Rewards Yet',
      createRewards: 'Create rewards to spend your hard-earned points!',
      createReward: 'Create Reward',
      editReward: 'Edit Reward',
      icon: 'Icon',
      rewardTitle: 'Title',
      description: 'Description',
      descriptionOptional: 'Optional description',
      pointsCost: 'Points Cost',
      redeem: 'Redeem',
      redeemed: 'Redeemed',
      deleteReward: 'Delete Reward?',
      deleteConfirm: 'Are you sure you want to delete this reward? This action cannot be undone.',
      redeemConfirm: 'Redeem Reward?',
      redeemConfirmMessage: 'Are you sure you want to redeem this reward? Points will be deducted from your balance.',
      redeemSuccess: 'Success! 🎉\nReward redeemed! Enjoy your treat!',
      notEnoughPoints: 'Not Enough Points',
      categories: {
        food: 'Food',
        entertainment: 'Fun',
        shopping: 'Shopping',
        wellness: 'Wellness',
        experience: 'Experiences',
        hobby: 'Hobbies',
        tech: 'Tech',
        other: 'Other',
      },
    },
    statistics: {
      title: 'Statistics',
      yourProgress: '📊 Your Progress',
      totalGoals: 'Total Goals',
      completedGoals: 'Completed',
      activeGoals: 'Active Goals',
      totalPoints: 'Total Points',
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      completionRate: 'Completion Rate',
      days: 'days',
      achievements: 'Achievements',
      lockedAchievements: 'Locked Achievements',
      progressTo: 'Progress to',
      motivationalQuote: 'Motivational Quote',
      streakStats: '🔥 Streak Stats',
      current: 'Current',
      best: 'Best',
      goalsCompleted: 'of {total} goals completed',
      keepItUp: 'Keep it up! 🎉',
    },
    goalForm: {
      title: 'Add a new goal',
      titlePlaceholder: 'Goal title (e.g. Lose Weight)',
      titleLabel: 'Goal title',
      titleHint: 'Enter a descriptive name for your goal',
      description: 'Description (Optional)',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Add more details about your goal...',
      targetAmount: 'Target amount',
      targetPlaceholder: 'Target amount (e.g. 20)',
      targetLabel: 'Target amount',
      targetHint: 'Enter the target value you want to reach',
      currentProgress: 'Current progress',
      currentPlaceholder: 'Current progress (e.g. 5)',
      currentLabel: 'Current progress',
      currentHint: 'Enter your starting or current value',
      unit: 'Unit',
      unitPlaceholder: 'Unit (e.g. kg, books, km)',
      unitLabel: 'Unit of measurement',
      unitHint: 'Enter the unit for measuring progress',
      direction: 'Progress Direction',
      directionIncrease: 'Increasing (e.g., Books Read)',
      directionDecrease: 'Decreasing (e.g., Weight Loss)',
      period: 'Time Period',
      periodDaily: 'Daily',
      periodWeekly: 'Weekly',
      periodMonthly: 'Monthly',
      periodYearly: 'Yearly',
      periodCustom: 'Custom',
      customPeriodDays: 'Custom Period (Days)',
      customPeriodPlaceholder: 'Number of days',
      points: 'Reward Points',
      pointsPlaceholder: 'Points for completing (e.g. 100)',
      pointsLabel: 'Reward points',
      pointsHint: 'Enter points to earn when completing this goal',
      addButton: 'Add Goal',
      addButtonHint: 'Creates a new goal with the entered information',
      addSubgoal: 'Add as Subgoal',
      ultimateGoal: 'Ultimate Goal',
      ultimateGoalHint: 'Mark as ultimate goal (special design, can have subgoals)',
      recurringGoal: 'Recurring Goal',
      recurringGoalHint: 'Goal that automatically resets after completion',
      editButton: 'Save Changes',
    },
    goalCard: {
      points: 'points',
      percent: 'complete',
      subgoals: 'subgoals',
      ultimate: '⭐ ULTIMATE',
    },
    goalDetail: {
      notFound: 'Goal not found',
      updateProgress: 'Update Progress',
      deleteGoal: 'Delete Goal',
      deleteConfirmTitle: 'Delete Goal',
      deleteConfirmMessage: 'Are you sure you want to delete this goal?',
      updateSuccess: 'Progress updated successfully',
      updateError: 'Failed to update progress',
      deleteError: 'Failed to delete goal',
      reward: 'Reward',
      complete: 'complete',
      subgoalsTitle: 'Subgoals',
      noSubgoals: 'No subgoals yet',
      addSubgoal: 'Add Subgoal',
      editGoal: 'Edit Goal',
      finishGoal: 'Mark as Complete',
      finishConfirmTitle: 'Complete Goal',
      finishConfirmMessage: 'Mark this goal as 100% complete?',
      finishSuccess: 'Goal marked as complete!',
      finishError: 'Failed to complete goal',
      useSlider: 'Use slider to adjust progress',
    },
    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
      language: 'Language',
      languageEnglish: 'English',
      languageArabic: 'Arabic',
      about: 'About',
      aboutText: 'Pathly helps you track and achieve your goals with a simple and intuitive interface. Set your targets, monitor progress, and celebrate your achievements.',
      version: 'Version',
    },
    validation: {
      invalidNumber: 'Please enter a valid number',
      requiredField: 'This field is required',
      titleRequired: 'Title is required',
      titleTooLong: 'Title must be less than 100 characters',
      targetRequired: 'Target is required',
      targetPositive: 'Target must be a positive number',
      targetMin: 'Target must be at least 0.01',
      targetMax: 'Target must be less than 1,000,000',
      currentRequired: 'Current value is required',
      currentValid: 'Current must be a valid number',
      currentMin: 'Current value must be at least 0',
      currentMax: 'Current value must be less than 1,000,000',
      unitRequired: 'Unit is required',
      unitTooLong: 'Unit must be less than 20 characters',
      pointsRequired: 'Points are required',
      pointsValid: 'Points must be a valid number',
      pointsMin: 'Points must be at least 0',
      pointsMax: 'Points must be less than 100,000',
    },
    achievements: {
      first_goal: { title: 'Getting Started', description: 'Create your first goal' },
      goal_master: { title: 'Goal Master', description: 'Complete 10 goals' },
      century_club: { title: 'Century Club', description: 'Complete 100 goals' },
      point_collector: { title: 'Point Collector', description: 'Earn 1000 points' },
      point_legend: { title: 'Point Legend', description: 'Earn 10,000 points' },
      week_warrior: { title: 'Week Warrior', description: 'Maintain a 7-day streak' },
      month_champion: { title: 'Month Champion', description: 'Maintain a 30-day streak' },
      unstoppable: { title: 'Unstoppable', description: 'Maintain a 100-day streak' },
      ultimate_creator: { title: 'Ultimate Creator', description: 'Create 5 ultimate goals' },
      perfectionist: { title: 'Perfectionist', description: 'Complete all goals in a week' },
    },
    quotes: [
      "The secret of getting ahead is getting started. - Mark Twain",
      "It always seems impossible until it's done. - Nelson Mandela",
      "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
      "Believe you can and you're halfway there. - Theodore Roosevelt",
      "The only way to do great work is to love what you do. - Steve Jobs",
      "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
      "What you get by achieving your goals is not as important as what you become by achieving your goals. - Zig Ziglar",
      "A goal without a plan is just a wish. - Antoine de Saint-Exupéry",
      "Set your goals high, and don't stop till you get there. - Bo Jackson",
      "The only impossible journey is the one you never begin. - Tony Robbins",
      "Don't limit your challenges. Challenge your limits.",
      "Dream big, start small, act now.",
      "Progress, not perfection.",
      "Every accomplishment starts with the decision to try.",
      "Your only limit is you.",
      "Make each day your masterpiece. - John Wooden",
      "The harder you work for something, the greater you'll feel when you achieve it.",
      "Don't stop when you're tired. Stop when you're done.",
    ],
    units: {
      kg: 'kg',
      lb: 'lb',
      km: 'km',
      mi: 'mi',
      books: 'books',
      pages: 'pages',
      hours: 'hours',
      days: 'days',
      times: 'times',
      reps: 'reps',
      calories: 'calories',
      minutes: 'minutes',
      dollars: 'dollars',
      glasses: 'glasses',
      workouts: 'workouts',
      courses: 'courses',
      entries: 'entries',
      projects: 'projects',
      photos: 'photos',
      recipes: 'recipes',
      words: 'words',
      steps: 'steps',
      laps: 'laps',
      sessions: 'sessions',
      servings: 'servings',
      grams: 'grams',
      cups: 'cups',
      episodes: 'episodes',
      videos: 'videos',
      problems: 'problems',
      certs: 'certs',
      emails: 'emails',
      connections: 'connections',
      skills: 'skills',
      presentations: 'presentations',
      showers: 'showers',
      items: 'items',
      areas: 'areas',
      calls: 'calls',
      people: 'people',
      compliments: 'compliments',
      acts: 'acts',
      bags: 'bags',
      trees: 'trees',
      subgoals: 'subgoals',
    },
    messages: {
      goalsCompleted: 'of {total} goals completed',
      automaticallyResets: 'Automatically resets after each {period} period',
      day: 'day',
      period: 'period',
    },
    periods: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom',
    },
    labels: {
      target: 'Target',
      category: 'Category',
      description: 'Description',
    },
  },
  ar: {
    common: {
      add: 'إضافة',
      update: 'تحديث',
      delete: 'حذف',
      cancel: 'إلغاء',
      save: 'حفظ',
      back: 'رجوع',
      success: 'نجح',
      error: 'خطأ',
      close: 'إغلاق',
    },
    tabs: {
      home: 'الرئيسية',
      addGoal: 'إضافة هدف',
      statistics: 'الإحصائيات',
      rewards: 'المكافآت',
      settings: 'الإعدادات',
    },
    home: {
      title: 'باثلي',
      subtitle: 'تتبع تقدمك، خطوة بخطوة',
      noGoals: 'لا توجد أهداف حتى الآن. قم بإنشاء واحد أدناه للبدء!',
      addGoal: 'إضافة هدف جديد',
      ultimateGoals: '⭐ أهداف أسمى',
      dailyGoals: '📅 أهداف يومية',
      weeklyGoals: '📆 أهداف أسبوعية',
      monthlyGoals: '🗓️ أهداف شهرية',
      yearlyGoals: '📊 أهداف سنوية',
      customGoals: '⏱️ أهداف مخصصة',
    },
    templates: {
      title: 'قوالب الأهداف',
      subtitle: 'اختر قالبًا للبدء بسرعة',
      useTemplate: 'استخدم قالب',
      quickStart: 'ابدأ بسرعة مع أهداف جاهزة',
      all: 'الكل',
      categories: {
        health: 'الصحة',
        fitness: 'اللياقة',
        learning: 'التعلم',
        work: 'العمل',
        finance: 'المالية',
        personal: 'شخصي',
        social: 'اجتماعي',
        hobby: 'هوايات',
        other: 'أخرى',
      },
    },
    rewards: {
      title: 'المكافآت',
      subtitle: 'أنفق نقاطك على المكافآت',
      all: 'الكل',
      useTemplate: 'استخدم قالب',
      quickRewards: 'مكافآت سريعة من أكثر من 100 فكرة',
      totalEarned: 'إجمالي المكتسب',
      spent: 'المنفق',
      available: 'المتاح',
      availableRewards: 'المكافآت المتاحة',
      redeemedRewards: 'المكافآت المستبدلة',
      noRewards: 'لا توجد مكافآت بعد',
      createRewards: 'أنشئ مكافآت لإنفاق نقاطك التي كسبتها بجهد!',
      createReward: 'إنشاء مكافأة',
      editReward: 'تحرير المكافأة',
      icon: 'الأيقونة',
      rewardTitle: 'العنوان',
      description: 'الوصف',
      descriptionOptional: 'وصف اختياري',
      pointsCost: 'تكلفة النقاط',
      redeem: 'استبدال',
      redeemed: 'تم الاستبدال',
      deleteReward: 'حذف المكافأة؟',
      deleteConfirm: 'هل أنت متأكد أنك تريد حذف هذه المكافأة؟ لا يمكن التراجع عن هذا الإجراء.',
      redeemConfirm: 'استبدال المكافأة؟',
      redeemConfirmMessage: 'هل أنت متأكد أنك تريد استبدال هذه المكافأة؟ سيتم خصم النقاط من رصيدك.',
      redeemSuccess: 'نجح! 🎉\nتم استبدال المكافأة! استمتع بها!',
      notEnoughPoints: 'نقاط غير كافية',
      categories: {
        food: 'طعام',
        entertainment: 'ترفيه',
        shopping: 'تسوق',
        wellness: 'عافية',
        experience: 'تجارب',
        hobby: 'هوايات',
        tech: 'تقنية',
        other: 'أخرى',
      },
    },
    statistics: {
      title: 'الإحصائيات',
      yourProgress: '📊 تقدمك',
      totalGoals: 'إجمالي الأهداف',
      completedGoals: 'المكتمل',
      activeGoals: 'الأهداف النشطة',
      totalPoints: 'إجمالي النقاط',
      currentStreak: 'السلسلة الحالية',
      longestStreak: 'أطول سلسلة',
      completionRate: 'معدل الإنجاز',
      days: 'أيام',
      achievements: 'الإنجازات',
      lockedAchievements: 'الإنجازات المقفلة',
      progressTo: 'التقدم إلى',
      motivationalQuote: 'اقتباس تحفيزي',
      streakStats: '🔥 إحصائيات السلسلة',
      current: 'الحالي',
      best: 'الأفضل',
      goalsCompleted: 'من أصل {total} أهداف مكتملة',
      keepItUp: 'استمر في ذلك! 🎉',
    },
    goalForm: {
      title: 'إضافة هدف جديد',
      titlePlaceholder: 'عنوان الهدف (مثال: فقدان الوزن)',
      titleLabel: 'عنوان الهدف',
      titleHint: 'أدخل اسمًا وصفيًا لهدفك',
      description: 'الوصف (اختياري)',
      descriptionLabel: 'الوصف',
      descriptionPlaceholder: 'أضف المزيد من التفاصيل حول هدفك...',
      targetAmount: 'المبلغ المستهدف',
      targetPlaceholder: 'المبلغ المستهدف (مثال: 20)',
      targetLabel: 'المبلغ المستهدف',
      targetHint: 'أدخل القيمة المستهدفة التي تريد الوصول إليها',
      currentProgress: 'التقدم الحالي',
      currentPlaceholder: 'التقدم الحالي (مثال: 5)',
      currentLabel: 'التقدم الحالي',
      currentHint: 'أدخل قيمتك الحالية أو البدائية',
      unit: 'الوحدة',
      unitPlaceholder: 'الوحدة (مثال: كجم، كتب، كم)',
      unitLabel: 'وحدة القياس',
      unitHint: 'أدخل وحدة لقياس التقدم',
      direction: 'اتجاه التقدم',
      directionIncrease: 'متزايد (مثال: الكتب المقروءة)',
      directionDecrease: 'متناقص (مثال: فقدان الوزن)',
      period: 'الفترة الزمنية',
      periodDaily: 'يومي',
      periodWeekly: 'أسبوعي',
      periodMonthly: 'شهري',
      periodYearly: 'سنوي',
      periodCustom: 'مخصص',
      customPeriodDays: 'فترة مخصصة (أيام)',
      customPeriodPlaceholder: 'عدد الأيام',
      points: 'نقاط المكافأة',
      pointsPlaceholder: 'النقاط عند الإنجاز (مثال: 100)',
      pointsLabel: 'نقاط المكافأة',
      pointsHint: 'أدخل النقاط التي ستكسبها عند إكمال هذا الهدف',
      addButton: 'إضافة الهدف',
      addButtonHint: 'ينشئ هدفًا جديدًا بالمعلومات المدخلة',
      addSubgoal: 'إضافة كهدف فرعي',
      ultimateGoal: 'هدف أسمى',
      ultimateGoalHint: 'تحديد كهدف أسمى (تصميم خاص، يمكن أن يحتوي على أهداف فرعية)',
      recurringGoal: 'هدف متكرر',
      recurringGoalHint: 'هدف يتم إعادة تعيينه تلقائياً بعد الإنجاز',
      editButton: 'حفظ التغييرات',
    },
    goalCard: {
      points: 'نقطة',
      percent: 'مكتمل',
      subgoals: 'أهداف فرعية',
      ultimate: '⭐ أسمى',
    },
    goalDetail: {
      notFound: 'الهدف غير موجود',
      updateProgress: 'تحديث التقدم',
      deleteGoal: 'حذف الهدف',
      deleteConfirmTitle: 'حذف الهدف',
      deleteConfirmMessage: 'هل أنت متأكد أنك تريد حذف هذا الهدف؟',
      updateSuccess: 'تم تحديث التقدم بنجاح',
      updateError: 'فشل تحديث التقدم',
      deleteError: 'فشل حذف الهدف',
      reward: 'المكافأة',
      complete: 'مكتمل',
      subgoalsTitle: 'الأهداف الفرعية',
      noSubgoals: 'لا توجد أهداف فرعية حتى الآن',
      addSubgoal: 'إضافة هدف فرعي',
      editGoal: 'تحرير الهدف',
      finishGoal: 'تحديد كمكتمل',
      finishConfirmTitle: 'إكمال الهدف',
      finishConfirmMessage: 'تحديد هقذا الهدف كمكتمل 100٪؟',
      finishSuccess: 'تم تحديد الهدف كمكتمل!',
      finishError: 'فشل في إكمال الهدف',
      useSlider: 'استخدم المنزلق لضبط التقدم',
    },
    settings: {
      title: 'الإعدادات',
      appearance: 'المظهر',
      themeSystem: 'النظام',
      themeLight: 'فاتح',
      themeDark: 'داكن',
      language: 'اللغة',
      languageEnglish: 'الإنجليزية',
      languageArabic: 'العربية',
      about: 'حول',
      aboutText: 'يساعدك باثلي على تتبع أهدافك وتحقيقها من خلال واجهة بسيطة وبديهية. حدد أهدافك، راقب التقدم، واحتفل بإنجازاتك.',
      version: 'الإصدار',
    },
    validation: {
      invalidNumber: 'الرجاء إدخال رقم صحيح',
      requiredField: 'هذا الحقل مطلوب',
      titleRequired: 'العنوان مطلوب',
      titleTooLong: 'يجب أن يكون العنوان أقل من 100 حرف',
      targetRequired: 'الهدف مطلوب',
      targetPositive: 'يجب أن يكون الهدف رقمًا موجبًا',
      targetMin: 'يجب أن يكون الهدف على الأقل 0.01',
      targetMax: 'يجب أن يكون الهدف أقل من 1,000,000',
      currentRequired: 'القيمة الحالية مطلوبة',
      currentValid: 'يجب أن تكون القيمة الحالية رقمًا صحيحًا',
      currentMin: 'يجب أن تكون القيمة الحالية على الأقل 0',
      currentMax: 'يجب أن تكون القيمة الحالية أقل من 1,000,000',
      unitRequired: 'الوحدة مطلوبة',
      unitTooLong: 'يجب أن تكون الوحدة أقل من 20 حرفًا',
      pointsRequired: 'النقاط مطلوبة',
      pointsValid: 'يجب أن تكون النقاط رقمًا صحيحًا',
      pointsMin: 'يجب أن تكون النقاط على الأقل 0',
      pointsMax: 'يجب أن تكون النقاط أقل من 100,000',
    },
    achievements: {
      first_goal: { title: 'البداية', description: 'أنشئ هدفك الأول' },
      goal_master: { title: 'سيد الأهداف', description: 'أكمل 10 أهداف' },
      century_club: { title: 'نادي المئة', description: 'أكمل 100 هدف' },
      point_collector: { title: 'جامع النقاط', description: 'اكسب 1000 نقطة' },
      point_legend: { title: 'أسطورة النقاط', description: 'اكسب 10,000 نقطة' },
      week_warrior: { title: 'محارب الأسبوع', description: 'حافظ على سلسلة 7 أيام' },
      month_champion: { title: 'بطل الشهر', description: 'حافظ على سلسلة 30 يومًا' },
      unstoppable: { title: 'لا يُقهر', description: 'حافظ على سلسلة 100 يوم' },
      ultimate_creator: { title: 'منشئ الأهداف الأسمى', description: 'أنشئ 5 أهداف أسمى' },
      perfectionist: { title: 'الكمالي', description: 'أكمل جميع الأهداف في أسبوع' },
    },
    quotes: [
      "سر التقدم هو البدء. - مارك توين",
      "يبدو الأمر دائمًا مستحيلاً حتى يتم إنجازه. - نيلسون مانديلا",
      "لا تراقب الساعة؛ افعل ما تفعله. استمر. - سام ليفنسون",
      "المستقبل ملك لأولئك الذين يؤمنون بجمال أحلامهم. - إليانور روزفلت",
      "النجاح ليس نهائياً، الفشل ليس مميتاً، الشجاعة للاستمرار هي ما يهم. - ونستون تشرشل",
      "آمن بأنك تستطيع وأنت في منتصف الطريق. - ثيودور روزفلت",
      "الطريقة الوحيدة للقيام بعمل عظيم هي أن تحب ما تفعله. - ستيف جوبز",
      "أنت لست كبيرًا جدًا لتحديد هدف آخر أو الحلم بحلم جديد. - سي إس لويس",
      "ما تحصل عليه من تحقيق أهدافك ليس بأهمية ما تصبح عليه من تحقيق أهدافك. - زيج زيجلار",
      "الهدف بدون خطة هو مجرد أمنية. - أنطوان دو سانت إكزوبيري",
      "ضع أهدافك عالية، ولا تتوقف حتى تصل إليها. - بو جاكسون",
      "الرحلة المستحيلة الوحيدة هي تلك التي لا تبدأها أبدًا. - توني روبينز",
      "لا تحد من تحدياتك. تحدى حدودك.",
      "احلم بكبر، ابدأ بصغر، اعمل الآن.",
      "التقدم، وليس الكمال.",
      "كل إنجاز يبدأ بقرار المحاولة.",
      "حدك الوحيد هو أنت.",
      "اجعل كل يوم تحفة فنية. - جون وودن",
      "كلما عملت بجد لتحقيق شيء ما، كلما شعرت بالسعادة عند تحقيقه.",
      "لا تتوقف عندما تكون متعبًا. توقف عندما تنتهي.",
    ],
    units: {
      kg: 'كجم',
      lb: 'رطل',
      km: 'كم',
      mi: 'ميل',
      books: 'كتب',
      pages: 'صفحات',
      hours: 'ساعات',
      days: 'أيام',
      times: 'مرات',
      reps: 'تكرارات',
      calories: 'سعرات',
      minutes: 'دقائق',
      dollars: 'دولار',
      glasses: 'أكواب',
      workouts: 'تمارين',
      courses: 'دورات',
      entries: 'إدخالات',
      projects: 'مشاريع',
      photos: 'صور',
      recipes: 'وصفات',
      words: 'كلمات',
      steps: 'خطوات',
      laps: 'لفات',
      sessions: 'جلسات',
      servings: 'حصص',
      grams: 'جرام',
      cups: 'أكواب',
      episodes: 'حلقات',
      videos: 'فيديوهات',
      problems: 'مسائل',
      certs: 'شهادات',
      emails: 'رسائل',
      connections: 'اتصالات',
      skills: 'مهارات',
      presentations: 'عروض',
      showers: 'استحمام',
      items: 'عناصر',
      areas: 'مناطق',
      calls: 'مكالمات',
      people: 'أشخاص',
      compliments: 'مجاملات',
      acts: 'أفعال',
      bags: 'أكياس',
      trees: 'أشجار',
      subgoals: 'أهداف فرعية',
    },
    messages: {
      goalsCompleted: 'من أصل {total} أهداف مكتملة',
      automaticallyResets: 'يتم إعادة التعيين تلقائيًا بعد كل فترة {period}',
      day: 'يوم',
      period: 'فترة',
    },
    periods: {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      yearly: 'سنوي',
      custom: 'مخصص',
    },
    labels: {
      target: 'الهدف',
      category: 'الفئة',
      description: 'الوصف',
    },
  },
};
