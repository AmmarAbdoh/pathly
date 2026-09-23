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
    search: string;
    clear: string;
    apply: string;
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
    ongoingGoals: string;
    completedGoals: string;
    searchPlaceholder: string;
    filters: string;
    filterAll: string;
    filterActive: string;
    filterPaused: string;
    filterCompleted: string;
    filterExpired: string;
    noResults: string;
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
    titleRequired: string;
    invalidCostTitle: string;
    invalidCost: string;
    notEnoughPointsMessage: string; // {points}
    saveError: string;
    redeemError: string;
    deleteError: string;
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
  iconCategories: {
    achievements: string;
    health: string;
    learning: string;
    work: string;
    finance: string;
    time: string;
    food: string;
    fun: string;
    sports: string;
    travel: string;
    nature: string;
    animals: string;
    celebrations: string;
    hobbies: string;
    tech: string;
    home: string;
    symbols: string;
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
  analytics: {
    title: string;
    subtitle: string;
    overview: string;
    insights: string;
    noData: string;
    startCompletingGoals: string;
    categoryPerformance: string;
    periodPerformance: string;
    timeOfDay: string;
    completionTrend: string;
    last30Days: string;
    bestCategory: string;
    worstCategory: string;
    bestDay: string;
    mostProductiveHour: string;
    averageCompletionTime: string;
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
    completions: string;
    rate: string;
    avgProgress: string;
    points: string;
    goals: string;
    days: string;
    day: string;
    noTrend: string;
    /** Hour-of-day markers, e.g. "3:00 PM" / "٣:٠٠ م". */
    am: string;
    pm: string;
    /** Summary sentences. Placeholders in braces are filled by getInsightsSummary. */
    insightMessages: {
      excellent: string; // {rate}
      good: string; // {rate}
      keepPushing: string; // {rate}
      bestCategory: string; // {category} {rate}
      morning: string;
      afternoon: string;
      evening: string;
      night: string;
      bestDay: string; // {day}
      averageTime: string; // {days} {unit}
    };
  };
  goalForm: {
    subgoalPointsHelper: string;
    subgoalPointsHint: string;
    addError: string;
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
    startingValue: string;
    startingValueHint: string;
    goalTarget: string;
    goalTargetHint: string;
    progressPreview: string;
    helperIncrease: string;
    helperDecrease: string;
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
    periodOngoing: string;
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
    linkedReward: string;
    linkedRewardHint: string;
    selectReward: string;
    noReward: string;
    autoRedeem: string;
    completedGoalEditNote: string;
    subgoalNoPoints: string;
    subgoalsAwardPoints: string;
    subgoalsAwardPointsHint: string;
    pointsOptional: string;
    confirmAddTitle: string;
    confirmEditTitle: string;
    /** The recurring checkbox's hint, for each period that can recur. */
    recurringResets: {
      daily: string;
      weekly: string;
      monthly: string;
      yearly: string;
      custom: string;
    };
  };
  goalCard: {
    points: string;
    percent: string;
    subgoals: string;
    ultimate: string;
    completed: string;
    streak: string;
    weekStreak: string;
    paused: string;
    blocked: string;
    openHint: string;
    moveUp: string;
    moveDown: string;
    a11yUltimate: string;
    a11yProgress: string; // {percent}
    a11ySubgoals: string; // {completed} {total}
    a11ySeparator: string;
  };
  goalDetail: {
    notFound: string;
    recurringBadge: string;
    updateProgress: string;
    deleteGoal: string;
    archiveGoal: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: string;
    archiveConfirmTitle: string;
    archiveConfirmMessage: string;
    updateSuccess: string;
    updateError: string;
    deleteError: string;
    archiveSuccess: string;
    archiveError: string;
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
    quickAdjust: string;
    orEnterValue: string;
    expiredWarning: string;
    extendDeadline: string;
    extendDeadlineTitle: string;
    extendDeadlineMessage: string;
    extendSuccess: string;
    extendError: string;
    pauseGoal: string;
    resumeGoal: string;
    pauseSuccess: string;
    resumeSuccess: string;
    pauseError: string;
    complete100Title: string;
    complete100Message: string;
    markComplete: string;
    setTo99: string;
    notYetLabel: string;
    notYetPlaceholder: string;
    notYetHint: string;
    saveCompleteConfirm: string;
    unsavedChangesMessage: string;
    discardChanges: string;
    saveAsTemplate: string;
    saveAsTemplateTitle: string;
    saveAsTemplateMessage: string;
    templateNamePlaceholder: string;
    templateSaveSuccess: string;
    templateSaveError: string;
    notesTitle: string;
    noNotes: string;
    addNote: string;
    noteInputPlaceholder: string;
    noteSaved: string;
    deleteNote: string;
    deleteNoteConfirm: string;
    dependenciesTitle: string;
    noDependencies: string;
    addDependency: string;
    selectDependencies: string;
    dependencyDescription: string;
    blockedByDependencies: string;
    dependencyCompleted: string;
    dependencyIncomplete: string;
    removeDependency: string;
    invalidDays: string;
    noteSaveError: string;
    noteDeleteError: string;
    dependenciesUpdateError: string;
    dependencyRemoveError: string;
    noAvailableDependencies: string;
    goalUpdateSuccess: string;
    goalUpdateError: string;
    subgoalAddSuccess: string;
    subgoalAddError: string;
    resetTitle: string;
    resetMessage: string;
    resetNow: string;
    resetSuccess: string;
    resetError: string;
    cancelEdit: string;
    cancelAddSubgoal: string;
    newProgressValue: string;
    timesCompleted: string; // {count}
  };
  review: {
    title: string;
    weeklyReview: string;
    monthlyReview: string;
    period: string;
    thisWeek: string;
    thisMonth: string;
    lastWeek: string;
    lastMonth: string;
    overview: string;
    goalsCompleted: string;
    totalGoals: string;
    completionRate: string;
    pointsEarned: string;
    achievements: string;
    completedGoals: string;
    noCompletedGoals: string;
    noGoalsMessage: string;
    keepGoing: string;
    excellentWork: string;
    goodProgress: string;
    startWorking: string;
  };
  export: {
    title: string;
    description: string;
    exportJSON: string;
    exportCSV: string;
    jsonDescription: string;
    csvDescription: string;
    exporting: string;
    exportSuccess: string;
    exportError: string;
    noData: string;
    shareTitle: string;
  };
  import: {
    title: string;
    description: string;
    selectFile: string;
    supportedFormats: string;
    importing: string;
    importSuccess: string;
    importError: string;
    confirmTitle: string;
    confirmMessage: string;
    merge: string;
    replace: string;
    replaceConfirmTitle: string;
    replaceConfirmMessage: string; // {goals} {rewards}: the user's current data
    csvUnsupported: string;
    invalidFile: string;
    skipped: string; // {count}
    partialError: string;
  };
  notifications: {
    title: string;
    enabled: string;
    disabled: string;
    time: string;
    days: string;
    selectDays: string;
    everyday: string;
    weekdays: string;
    weekends: string;
    custom: string;
    testNotification: string;
    testNotificationDescription: string;
    testNotificationSent: string;
    testNotificationError: string;
    reminderTitle: string;
    reminderBody: string; // {goal}: the goal title
    testTitle: string;
    testBody: string;
    channelName: string; // how Android lists the reminders in system settings
    permissionsRequired: string;
    permissionsDescription: string;
    enablePermissions: string;
    permissionsDenied: string;
    permissionsGranted: string;
    scheduleSuccess: string;
    scheduleError: string;
    cancelSuccess: string;
    selectTime: string;
    selectDaysDescription: string;
    dayNames: {
      sunday: string;
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
    };
    dayNamesShort: {
      sunday: string;
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
    };
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
    archivedGoals: string;
    archivedGoalsSubtitle: string;
    viewArchived: string;
    noArchivedGoals: string;
    restoreGoal: string;
    deleteGoalPermanently: string;
    deletePermanentlyTitle: string;
    deletePermanentlyMessage: string;
    restoreSuccess: string;
    restoreError: string;
    deletePermanentlySuccess: string;
    deletePermanentlyError: string;
    about: string;
    aboutText: string;
    version: string;
    languageChangedRestart: string; // shown in the language just chosen
    themeOptionLabel: string; // {theme}
    themeOptionHint: string; // {theme}
    languageOptionLabel: string; // {language}: the language's name
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
    customPeriodRequired: string;
    customPeriodWholeDays: string;
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
  };
  periods: {
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    custom: string;
  };
  time: {
    days: string;
    hours: string;
    minutes: string;
    day: string;
    hour: string;
    minute: string;
    dayDual: string;      // For 2 days (Arabic)
    hourDual: string;     // For 2 hours (Arabic)
    minuteDual: string;   // For 2 minutes (Arabic)
    left: string;
    expired: string;
    resetsIn: string;
    and: string;          // Separator between time units
    endsAt: string;       // "Ends: Oct 30, 11:59 PM"
    /**
     * Whether counts of 11 and above take the singular noun. True for Arabic
     * ("11 يوم"); false for English, which keeps the plural ("11 days").
     */
    singularAfterTen: boolean;
  };
  labels: {
    target: string;
    category: string;
    description: string;
  };
  /** Shown by StorageErrorBanner when data cannot be saved or loaded. */
  storageErrors: {
    saveFailed: string;
    loadFailed: string;
    rewardsLoadFailed: string;
    rewardsSaveFailed: string;
    unreadable: string;
    retry: string;
  };
  schedule: {
    title: string;
    everyDay: string;
    specificDays: string;
    specificDates: string;
    dateRange: string;
    from: string;
    to: string;
    everyDays: string;
    monthlyOnDays: string;
    monthlyFromTo: string;
    weekdayShort: string[];
    weekdayLong: string[];
    monthlyDates: string;
    selectWeekdays: string;
    selectDates: string;
    selectRange: string;
    listSeparator: string; // between listed days or dates
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
      search: 'Search',
      clear: 'Clear',
      apply: 'Apply',
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
      ongoingGoals: '∞ Ongoing Goals',
      completedGoals: '✓ Completed Goals',
      searchPlaceholder: 'Search goals...',
      filters: 'Filters',
      filterAll: 'All',
      filterActive: 'Active',
      filterPaused: 'Paused',
      filterCompleted: 'Completed',
      filterExpired: 'Expired',
      noResults: 'No goals found',
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
      titleRequired: 'Please enter a reward title',
      invalidCostTitle: 'Invalid Points',
      invalidCost: 'A reward must cost at least 1 point',
      notEnoughPointsMessage: 'You need {points} more points to redeem this reward.',
      saveError: 'Failed to save reward',
      redeemError: 'Failed to redeem reward',
      deleteError: 'Failed to delete reward',
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
    iconCategories: {
      achievements: 'Achievements',
      health: 'Health',
      learning: 'Learning',
      work: 'Work',
      finance: 'Finance',
      time: 'Time',
      food: 'Food',
      fun: 'Fun',
      sports: 'Sports',
      travel: 'Travel',
      nature: 'Nature',
      animals: 'Animals',
      celebrations: 'Celebrations',
      hobbies: 'Hobbies',
      tech: 'Tech',
      home: 'Home',
      symbols: 'Symbols',
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
    analytics: {
      title: 'Analytics',
      subtitle: 'Deep insights into your goal performance',
      overview: 'Overview',
      insights: 'Insights',
      noData: 'No analytics data available',
      startCompletingGoals: 'Complete some goals to unlock analytics insights!',
      categoryPerformance: 'Category Performance',
      periodPerformance: 'Period Performance',
      timeOfDay: 'Time of Day',
      completionTrend: 'Completion Trend',
      last30Days: 'Last 30 Days',
      bestCategory: 'Best Category',
      worstCategory: 'Needs Attention',
      bestDay: 'Best Day',
      mostProductiveHour: 'Most Productive Hour',
      averageCompletionTime: 'Avg. Completion Time',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
      completions: 'completions',
      rate: 'Rate',
      avgProgress: 'Avg. Progress',
      points: 'pts',
      goals: 'goals',
      days: 'days',
      day: 'day',
      noTrend: 'No completion trend data yet',
      am: 'AM',
      pm: 'PM',
      insightMessages: {
        excellent: '🏆 Excellent! {rate}% completion rate!',
        good: '💪 Good progress! {rate}% completion rate.',
        keepPushing: '🎯 {rate}% completion rate. Keep pushing!',
        bestCategory: '⭐ Best category: {category} ({rate}%)',
        morning: "🌅 You're most productive in the morning!",
        afternoon: '☀️ Afternoons are your peak productivity time!',
        evening: '🌆 You work best in the evening!',
        night: '🌙 Night owl! You complete most goals at night.',
        bestDay: '📅 {day} is your most productive day!',
        averageTime: '⏱️ Average completion time: {days} {unit}',
      },
    },
    goalForm: {
      subgoalPointsHelper: 'Leave at 0 if you do not want this subgoal to award points',
      subgoalPointsHint: 'Optional points to award when completing this subgoal',
      addError: 'Failed to add goal',
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
      startingValue: 'Starting Value',
      startingValueHint: 'Where you are right now',
      goalTarget: 'Goal Target',
      goalTargetHint: 'Where you want to be',
      progressPreview: 'Progress: {{current}} → {{target}}',
      helperIncrease: 'You\'ll track progress from {{current}} up to {{target}}',
      helperDecrease: 'You\'ll track progress from {{current}} down to {{target}}',
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
      periodOngoing: 'Ongoing (No Deadline)',
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
      linkedReward: 'Linked Reward',
      linkedRewardHint: 'Auto-redeem a reward when this goal completes',
      selectReward: 'Select Reward',
      noReward: 'No Reward',
      autoRedeem: 'Auto-redeem on completion',
      completedGoalEditNote: 'This goal is completed. You can only edit the title, description, icon, and linked reward.',
      subgoalNoPoints: 'Subgoals don\'t award points individually. Points are awarded when the parent goal completes.',
      subgoalsAwardPoints: 'Subgoals award their own points',
      subgoalsAwardPointsHint: 'If checked, each subgoal will award points individually when completed. If unchecked, only the parent goal awards points.',
      pointsOptional: 'Reward Points (Optional)',
      confirmAddTitle: 'Add this goal?',
      confirmEditTitle: 'Save these changes?',
      recurringResets: {
        daily: 'Resets automatically at the end of each day',
        weekly: 'Resets automatically every week',
        monthly: 'Resets automatically every month',
        yearly: 'Resets automatically every year',
        custom: 'Resets automatically at the end of each period',
      },
    },
    goalCard: {
      points: 'points',
      percent: 'complete',
      subgoals: 'subgoals',
      ultimate: '⭐ ULTIMATE',
      completed: 'Completed',
      streak: 'streak',
      weekStreak: 'week streak',
      paused: 'Paused',
      blocked: 'Blocked',
      openHint: 'Tap to view and edit goal details',
      moveUp: 'Move goal up',
      moveDown: 'Move goal down',
      a11yUltimate: 'Ultimate goal',
      a11yProgress: '{percent}% complete',
      a11ySubgoals: '{completed} of {total} subgoals complete',
      a11ySeparator: ', ',
    },
    goalDetail: {
      notFound: 'Goal not found',
      recurringBadge: 'Recurring',
      updateProgress: 'Update Progress',
      deleteGoal: 'Delete Goal',
      archiveGoal: 'Archive Goal',
      deleteConfirmTitle: 'Delete Goal',
      deleteConfirmMessage: 'Are you sure you want to delete this goal?',
      archiveConfirmTitle: 'Archive Goal',
      archiveConfirmMessage: 'Archive this goal? You can view and restore it from Settings.',
      updateSuccess: 'Progress updated successfully',
      updateError: 'Failed to update progress',
      deleteError: 'Failed to delete goal',
      archiveSuccess: 'Goal archived successfully',
      archiveError: 'Failed to archive goal',
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
      quickAdjust: 'Quick adjust:',
      orEnterValue: 'Or enter value:',
      expiredWarning: 'You can only delete this goal',
      extendDeadline: 'Extend Deadline',
      extendDeadlineTitle: 'Extend Goal Deadline',
      extendDeadlineMessage: 'How many additional days would you like to add?',
      extendSuccess: 'Deadline extended successfully!',
      extendError: 'Failed to extend deadline',
      pauseGoal: 'Pause Goal',
      resumeGoal: 'Resume Goal',
      pauseSuccess: 'Goal paused successfully',
      resumeSuccess: 'Goal resumed successfully',
      pauseError: 'Failed to pause/resume goal',
      complete100Title: 'Goal Reached 100%',
      complete100Message: 'You reached 100% progress! Adjust the value below or save as-is.',
      markComplete: 'Mark Complete',
      setTo99: 'Not Yet',
      notYetLabel: 'Adjust value (optional)',
      notYetPlaceholder: 'Enter new value',
      notYetHint: 'Leave empty to keep current value, or enter a different value',
      saveCompleteConfirm: 'This value will complete the goal. Do you want to mark it as complete?',
      unsavedChangesMessage: 'You have unsaved changes. Discard them?',
      discardChanges: 'Discard',
      saveAsTemplate: 'Save as Template',
      saveAsTemplateTitle: 'Save as Template',
      saveAsTemplateMessage: 'Give this template a name to reuse it later',
      templateNamePlaceholder: 'Template name (e.g., "My Weekly Workout")',
      templateSaveSuccess: 'Template saved successfully! You can use it when creating new goals.',
      templateSaveError: 'Failed to save template',
      notesTitle: 'Notes & Journal',
      noNotes: 'No notes yet. Add your first note to track progress and thoughts!',
      addNote: 'Add Note',
      noteInputPlaceholder: 'Write your note here... (e.g., "Week 3: Great progress!")',
      noteSaved: 'Note saved successfully',
      deleteNote: 'Delete Note',
      deleteNoteConfirm: 'Delete this note? This cannot be undone.',
      dependenciesTitle: 'Dependencies',
      noDependencies: 'No dependencies set. Add prerequisite goals that must be completed first.',
      addDependency: 'Add Dependency',
      selectDependencies: 'Select Goals',
      dependencyDescription: 'This goal requires the following goals to be completed first:',
      blockedByDependencies: '🔒 This goal is blocked. Complete the required goals first.',
      dependencyCompleted: '✅ Completed',
      dependencyIncomplete: '⏳ In Progress',
      removeDependency: 'Remove',
      invalidDays: 'Please enter a valid number of days',
      noteSaveError: 'Failed to save note',
      noteDeleteError: 'Failed to delete note',
      dependenciesUpdateError: 'Failed to update dependencies',
      dependencyRemoveError: 'Failed to remove dependency',
      noAvailableDependencies: 'No goals available to add as dependencies',
      goalUpdateSuccess: 'Goal updated successfully',
      goalUpdateError: 'Failed to update goal',
      subgoalAddSuccess: 'Subgoal added successfully',
      subgoalAddError: 'Failed to add subgoal',
      resetTitle: 'Reset Recurring Goal',
      resetMessage: 'Start a new period for this goal now? Its progress goes back to the start, and if it was completed, the completion is kept in its history.',
      resetNow: 'Reset Now',
      resetSuccess: 'A new period has started.',
      resetError: 'Failed to reset the goal',
      cancelEdit: 'Cancel editing',
      cancelAddSubgoal: 'Cancel adding a subgoal',
      newProgressValue: 'New progress value',
      timesCompleted: '× {count} completions',
    },
    review: {
      title: 'Review',
      weeklyReview: 'Weekly Review',
      monthlyReview: 'Monthly Review',
      period: 'Period',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      lastWeek: 'Last Week',
      lastMonth: 'Last Month',
      overview: 'Overview',
      goalsCompleted: 'Goals Completed',
      totalGoals: 'Total Goals',
      completionRate: 'Completion Rate',
      pointsEarned: 'Points Earned',
      achievements: 'Achievements',
      completedGoals: 'Completed Goals',
      noCompletedGoals: 'No goals completed in this period',
      noGoalsMessage: 'Start setting goals to see your progress!',
      keepGoing: 'Keep going! You\'re making great progress! 🎉',
      excellentWork: 'Excellent work! You completed all goals! 🏆',
      goodProgress: 'Good progress! Keep up the momentum! 💪',
      startWorking: 'Time to start working on your goals! 🚀',
    },
    export: {
      title: 'Export Data',
      description: 'Export your goals and rewards data for backup or analysis',
      exportJSON: 'Export as JSON',
      exportCSV: 'Export as CSV',
      jsonDescription: 'Complete data with all details',
      csvDescription: 'Spreadsheet-friendly format',
      exporting: 'Preparing export...',
      exportSuccess: 'Data exported successfully',
      exportError: 'Failed to export data',
      noData: 'No data available to export',
      shareTitle: 'Share Pathly Data',
    },
    import: {
      title: 'Import Data',
      description: 'Import goals and rewards from a backup file or another device',
      selectFile: 'Select Import File',
      supportedFormats: 'Supports JSON files',
      importing: 'Processing import...',
      importSuccess: 'Successfully imported {goals} goals and {rewards} rewards',
      importError: 'Failed to import data',
      confirmTitle: 'Import Data',
      confirmMessage: 'Found {goals} goals and {rewards} rewards. How would you like to import?',
      merge: 'Merge with Existing',
      replace: 'Replace All Data',
      replaceConfirmTitle: 'Replace all data?',
      replaceConfirmMessage: 'Your current {goals} goals and {rewards} rewards will be deleted and replaced by the backup. This cannot be undone.',
      csvUnsupported: 'CSV import is not supported yet. Please import a JSON backup.',
      invalidFile: 'This file is not a valid Pathly backup.',
      skipped: '{count} invalid records in the file will be skipped.',
      partialError: "Only part of the backup was imported: its rewards were added, but its goals couldn't be saved. Free up some storage before importing again.",
    },
    notifications: {
      title: 'Notifications',
      enabled: 'Enable Notifications',
      disabled: 'Disabled',
      time: 'Reminder Time',
      days: 'Reminder Days',
      selectDays: 'Select Days',
      everyday: 'Everyday',
      weekdays: 'Weekdays',
      weekends: 'Weekends',
      custom: 'Custom',
      testNotification: 'Test Notification',
      testNotificationDescription: 'Send a test notification to verify settings',
      testNotificationSent: 'Test notification sent!',
      testNotificationError: 'Failed to send test notification',
      reminderTitle: '🎯 Goal Reminder',
      reminderBody: 'Time to work on: {goal}',
      testTitle: '🎯 Test Notification',
      testBody: 'Notifications are working! You will receive goal reminders at your scheduled times.',
      channelName: 'Goal Reminders',
      permissionsRequired: 'Notification Permissions Required',
      permissionsDescription: 'Enable notifications to receive goal reminders',
      enablePermissions: 'Enable Permissions',
      permissionsDenied: 'Notification permissions denied',
      permissionsGranted: 'Notification permissions granted',
      scheduleSuccess: 'Notifications scheduled successfully',
      scheduleError: 'Failed to schedule notifications',
      cancelSuccess: 'Notifications cancelled',
      selectTime: 'Select time for daily reminders',
      selectDaysDescription: 'Choose which days to receive reminders',
      dayNames: {
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
      },
      dayNamesShort: {
        sunday: 'Sun',
        monday: 'Mon',
        tuesday: 'Tue',
        wednesday: 'Wed',
        thursday: 'Thu',
        friday: 'Fri',
        saturday: 'Sat',
      },
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
      archivedGoals: 'Archived Goals',
      archivedGoalsSubtitle: 'View and manage your archived goals',
      viewArchived: 'View Archived Goals',
      noArchivedGoals: 'No archived goals',
      restoreGoal: 'Restore',
      deleteGoalPermanently: 'Delete Permanently',
      deletePermanentlyTitle: 'Delete Permanently',
      deletePermanentlyMessage: 'Permanently delete this goal? This action cannot be undone and all history will be lost.',
      restoreSuccess: 'Goal restored successfully',
      restoreError: 'Failed to restore goal',
      deletePermanentlySuccess: 'Goal deleted permanently',
      deletePermanentlyError: 'Failed to delete goal',
      about: 'About',
      aboutText: 'Pathly helps you track and achieve your goals with a simple and intuitive interface. Set your targets, monitor progress, and celebrate your achievements.',
      version: 'Version',
      languageChangedRestart: 'Language changed to English. Restart the app for it to apply everywhere.',
      themeOptionLabel: '{theme} theme',
      themeOptionHint: 'Switch to the {theme} theme',
      languageOptionLabel: '{language} language',
    },
    validation: {
      invalidNumber: 'Please enter a valid number',
      customPeriodRequired: 'Custom period days is required',
      customPeriodWholeDays: 'Enter a whole number of days, 1 or more',
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
    },
    periods: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom',
    },
    time: {
      days: 'days',
      hours: 'hours',
      minutes: 'minutes',
      day: 'day',
      hour: 'hour',
      minute: 'minute',
      dayDual: 'days',      // English doesn't have dual, use plural
      hourDual: 'hours',
      minuteDual: 'minutes',
      left: 'left',
      expired: 'Expired',
      resetsIn: 'Resets in',
      and: 'and',
      endsAt: 'Ends',
      singularAfterTen: false,
    },
    labels: {
      target: 'Target',
      category: 'Category',
      description: 'Description',
    },
    storageErrors: {
      saveFailed: "Your latest changes couldn't be saved. They're kept on this screen; tap Retry.",
      loadFailed: "Your goals couldn't be loaded. Nothing will be saved until they load - tap Retry.",
      rewardsLoadFailed: "Your rewards couldn't be loaded. They can't be changed until they load - tap Retry.",
      rewardsSaveFailed: "A reward linked to a completed goal couldn't be redeemed. Tap Retry.",
      unreadable: "Some saved data was damaged and couldn't be read. It has been kept aside, and Pathly has started fresh.",
      retry: 'Retry',
    },
    schedule: {
      title: 'Schedule',
      everyDay: 'Every day',
      specificDays: 'Specific days',
      specificDates: 'Specific dates',
      dateRange: 'Date range',
      from: 'From',
      to: 'To',
      everyDays: 'Every {days}',
      monthlyOnDays: 'Monthly on day {dates}',
      monthlyFromTo: 'Monthly from day {start} to {end}',
      weekdayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      weekdayLong: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      monthlyDates: 'Monthly dates',
      selectWeekdays: 'Select days of the week:',
      selectDates: 'Select dates of the month:',
      selectRange: 'Select date range (e.g., 20-25):',
      listSeparator: ', ',
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
      search: 'بحث',
      clear: 'مسح',
      apply: 'تطبيق',
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
      ongoingGoals: '∞ أهداف مستمرة',
      completedGoals: '✓ أهداف مكتملة',
      searchPlaceholder: 'البحث عن الأهداف...',
      filters: 'التصفيات',
      filterAll: 'الكل',
      filterActive: 'النشطة',
      filterPaused: 'المتوقفة',
      filterCompleted: 'المكتملة',
      filterExpired: 'المنتهية',
      noResults: 'لم يتم العثور على أهداف',
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
      titleRequired: 'يرجى إدخال عنوان المكافأة',
      invalidCostTitle: 'نقاط غير صالحة',
      invalidCost: 'يجب أن تكلّف المكافأة نقطة واحدة على الأقل',
      notEnoughPointsMessage: 'تحتاج إلى {points} نقطة إضافية لاسترداد هذه المكافأة.',
      saveError: 'فشل حفظ المكافأة',
      redeemError: 'فشل استبدال المكافأة',
      deleteError: 'فشل حذف المكافأة',
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
    iconCategories: {
      achievements: 'إنجازات',
      health: 'صحة',
      learning: 'تعلم',
      work: 'عمل',
      finance: 'مالية',
      time: 'وقت',
      food: 'طعام',
      fun: 'مرح',
      sports: 'رياضة',
      travel: 'سفر',
      nature: 'طبيعة',
      animals: 'حيوانات',
      celebrations: 'احتفالات',
      hobbies: 'هوايات',
      tech: 'تقنية',
      home: 'منزل',
      symbols: 'رموز',
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
    analytics: {
      title: 'التحليلات',
      subtitle: 'رؤى عميقة حول أداء أهدافك',
      overview: 'نظرة عامة',
      insights: 'رؤى',
      noData: 'لا توجد بيانات تحليلية متاحة',
      startCompletingGoals: 'أكمل بعض الأهداف لفتح رؤى التحليلات!',
      categoryPerformance: 'أداء الفئات',
      periodPerformance: 'أداء الفترات',
      timeOfDay: 'الوقت من اليوم',
      completionTrend: 'اتجاه الإنجاز',
      last30Days: 'آخر 30 يوم',
      bestCategory: 'أفضل فئة',
      worstCategory: 'تحتاج إلى انتباه',
      bestDay: 'أفضل يوم',
      mostProductiveHour: 'الساعة الأكثر إنتاجية',
      averageCompletionTime: 'متوسط وقت الإنجاز',
      morning: 'الصباح',
      afternoon: 'الظهيرة',
      evening: 'المساء',
      night: 'الليل',
      completions: 'إنجازات',
      rate: 'المعدل',
      avgProgress: 'متوسط التقدم',
      points: 'نقاط',
      goals: 'أهداف',
      days: 'أيام',
      day: 'يوم',
      noTrend: 'لا توجد بيانات اتجاه الإنجاز بعد',
      am: 'ص',
      pm: 'م',
      insightMessages: {
        excellent: '🏆 ممتاز! معدل الإنجاز {rate}%!',
        good: '💪 تقدم جيد! معدل الإنجاز {rate}%.',
        keepPushing: '🎯 معدل الإنجاز {rate}%. واصل المحاولة!',
        bestCategory: '⭐ أفضل فئة: {category} ({rate}%)',
        morning: '🌅 أنت أكثر إنتاجية في الصباح!',
        afternoon: '☀️ فترة الظهيرة هي ذروة إنتاجيتك!',
        evening: '🌆 تعمل بشكل أفضل في المساء!',
        night: '🌙 من محبي السهر! تنجز معظم أهدافك ليلاً.',
        bestDay: '📅 {day} هو يومك الأكثر إنتاجية!',
        averageTime: '⏱️ متوسط وقت الإنجاز: {days} {unit}',
      },
    },
    goalForm: {
      subgoalPointsHelper: 'اتركه 0 إذا كنت لا تريد أن يمنح هذا الهدف الفرعي نقاطاً',
      subgoalPointsHint: 'نقاط اختيارية تُمنح عند إكمال هذا الهدف الفرعي',
      addError: 'فشل إضافة الهدف',
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
      startingValue: 'القيمة البدائية',
      startingValueHint: 'أين أنت الآن',
      goalTarget: 'الهدف المستهدف',
      goalTargetHint: 'أين تريد أن تكون',
      progressPreview: 'التقدم: {{current}} ← {{target}}',
      helperIncrease: 'ستتتبع التقدم من {{current}} إلى {{target}}',
      helperDecrease: 'ستتتبع التقدم من {{current}} إلى {{target}} (تنازلي)',
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
      periodOngoing: 'مستمر (بدون موعد نهائي)',
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
      linkedReward: 'مكافأة مرتبطة',
      linkedRewardHint: 'استرداد تلقائي للمكافأة عند إكمال هذا الهدف',
      selectReward: 'اختر المكافأة',
      noReward: 'بدون مكافأة',
      autoRedeem: 'استرداد تلقائي عند الإكمال',
      completedGoalEditNote: 'هذا الهدف مكتمل. يمكنك فقط تعديل العنوان والوصف والأيقونة والمكافأة المرتبطة.',
      subgoalNoPoints: 'الأهداف الفرعية لا تمنح نقاطًا بشكل فردي. يتم منح النقاط عند إكمال الهدف الرئيسي.',
      subgoalsAwardPoints: 'الأهداف الفرعية تمنح نقاطها الخاصة',
      subgoalsAwardPointsHint: 'إذا تم التحديد، سيمنح كل هدف فرعي نقاطًا بشكل فردي عند إكماله. إذا لم يتم التحديد، فقط الهدف الرئيسي يمنح النقاط.',
      pointsOptional: 'نقاط المكافأة (اختياري)',
      confirmAddTitle: 'إضافة هذا الهدف؟',
      confirmEditTitle: 'حفظ هذه التغييرات؟',
      recurringResets: {
        daily: 'يُعاد تعيينه تلقائيًا في نهاية كل يوم',
        weekly: 'يُعاد تعيينه تلقائيًا كل أسبوع',
        monthly: 'يُعاد تعيينه تلقائيًا كل شهر',
        yearly: 'يُعاد تعيينه تلقائيًا كل سنة',
        custom: 'يُعاد تعيينه تلقائيًا في نهاية كل فترة',
      },
    },
    goalCard: {
      points: 'نقطة',
      percent: 'مكتمل',
      subgoals: 'أهداف فرعية',
      ultimate: '⭐ أسمى',
      completed: 'مكتمل',
      streak: 'سلسلة',
      weekStreak: 'سلسلة أسبوعية',
      paused: 'متوقف',
      blocked: 'محجوب',
      openHint: 'اضغط لعرض وتعديل تفاصيل الهدف',
      moveUp: 'تحريك الهدف لأعلى',
      moveDown: 'تحريك الهدف لأسفل',
      a11yUltimate: 'هدف أسمى',
      a11yProgress: 'مكتمل بنسبة {percent}٪',
      a11ySubgoals: 'اكتمل {completed} من {total} أهداف فرعية',
      a11ySeparator: '، ',
    },
    goalDetail: {
      notFound: 'الهدف غير موجود',
      recurringBadge: 'متكرر',
      updateProgress: 'تحديث التقدم',
      deleteGoal: 'حذف الهدف',
      archiveGoal: 'أرشفة الهدف',
      deleteConfirmTitle: 'حذف الهدف',
      deleteConfirmMessage: 'هل أنت متأكد أنك تريد حذف هذا الهدف؟',
      archiveConfirmTitle: 'أرشفة الهدف',
      archiveConfirmMessage: 'أرشفة هذا الهدف؟ يمكنك عرضه واستعادته من الإعدادات.',
      updateSuccess: 'تم تحديث التقدم بنجاح',
      updateError: 'فشل تحديث التقدم',
      deleteError: 'فشل حذف الهدف',
      archiveSuccess: 'تم أرشفة الهدف بنجاح',
      archiveError: 'فشل في أرشفة الهدف',
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
      quickAdjust: 'ضبط سريع:',
      orEnterValue: 'أو أدخل القيمة:',
      expiredWarning: 'يمكنك فقط حذف هذا الهدف',
      extendDeadline: 'تمديد الموعد النهائي',
      extendDeadlineTitle: 'تمديد الموعد النهائي للهدف',
      extendDeadlineMessage: 'كم عدد الأيام الإضافية التي تريد إضافتها؟',
      extendSuccess: 'تم تمديد الموعد النهائي بنجاح!',
      extendError: 'فشل تمديد الموعد النهائي',
      pauseGoal: 'إيقاف الهدف مؤقتًا',
      resumeGoal: 'استئناف الهدف',
      pauseSuccess: 'تم إيقاف الهدف مؤقتًا بنجاح',
      resumeSuccess: 'تم استئناف الهدف بنجاح',
      pauseError: 'فشل في إيقاف/استئناف الهدف',
      complete100Title: 'الهدف وصل إلى 100٪',
      complete100Message: 'لقد وصلت إلى تقدم 100٪! عدّل القيمة أدناه أو احفظها كما هي.',
      markComplete: 'تحديد كمكتمل',
      setTo99: 'ليس بعد',
      notYetLabel: 'تعديل القيمة (اختياري)',
      notYetPlaceholder: 'أدخل قيمة جديدة',
      notYetHint: 'اتركه فارغًا للحفاظ على القيمة الحالية، أو أدخل قيمة مختلفة',
      saveCompleteConfirm: 'هذه القيمة ستكمل الهدف. هل تريد تحديده كمكتمل؟',
      unsavedChangesMessage: 'لديك تغييرات غير محفوظة. هل تريد تجاهلها؟',
      discardChanges: 'تجاهل',
      saveAsTemplate: 'حفظ كقالب',
      saveAsTemplateTitle: 'حفظ كقالب',
      saveAsTemplateMessage: 'أعط هذا القالب اسمًا لإعادة استخدامه لاحقًا',
      templateNamePlaceholder: 'اسم القالب (مثال: "تمرين أسبوعي")',
      templateSaveSuccess: 'تم حفظ القالب بنجاح! يمكنك استخدامه عند إنشاء أهداف جديدة.',
      templateSaveError: 'فشل حفظ القالب',
      notesTitle: 'ملاحظات ويوميات',
      noNotes: 'لا توجد ملاحظات بعد. أضف ملاحظتك الأولى لتتبع التقدم والأفكار!',
      addNote: 'إضافة ملاحظة',
      noteInputPlaceholder: 'اكتب ملاحظتك هنا... (مثال: "الأسبوع 3: تقدم رائع!")',
      noteSaved: 'تم حفظ الملاحظة بنجاح',
      deleteNote: 'حذف الملاحظة',
      deleteNoteConfirm: 'حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء.',
      dependenciesTitle: 'التبعيات',
      noDependencies: 'لا توجد تبعيات محددة. أضف أهدافًا مطلوبة يجب إكمالها أولاً.',
      addDependency: 'إضافة تبعية',
      selectDependencies: 'اختر الأهداف',
      dependencyDescription: 'يتطلب هذا الهدف إكمال الأهداف التالية أولاً:',
      blockedByDependencies: '🔒 هذا الهدف محظور. أكمل الأهداف المطلوبة أولاً.',
      dependencyCompleted: '✅ مكتمل',
      dependencyIncomplete: '⏳ قيد التقدم',
      removeDependency: 'إزالة',
      invalidDays: 'يرجى إدخال عدد أيام صالح',
      noteSaveError: 'فشل حفظ الملاحظة',
      noteDeleteError: 'فشل حذف الملاحظة',
      dependenciesUpdateError: 'فشل تحديث التبعيات',
      dependencyRemoveError: 'فشلت إزالة التبعية',
      noAvailableDependencies: 'لا توجد أهداف متاحة لإضافتها كتبعيات',
      goalUpdateSuccess: 'تم تحديث الهدف بنجاح',
      goalUpdateError: 'فشل تحديث الهدف',
      subgoalAddSuccess: 'تمت إضافة الهدف الفرعي بنجاح',
      subgoalAddError: 'فشلت إضافة الهدف الفرعي',
      resetTitle: 'إعادة تعيين الهدف المتكرر',
      resetMessage: 'هل تريد بدء فترة جديدة لهذا الهدف الآن؟ سيعود تقدمه إلى البداية، وإذا كان مكتملاً فسيُحفظ الإكمال في سجله.',
      resetNow: 'إعادة التعيين الآن',
      resetSuccess: 'بدأت فترة جديدة.',
      resetError: 'فشلت إعادة تعيين الهدف',
      cancelEdit: 'إلغاء التعديل',
      cancelAddSubgoal: 'إلغاء إضافة هدف فرعي',
      newProgressValue: 'قيمة التقدم الجديدة',
      timesCompleted: '× {count} مرات إكمال',
    },
    review: {
      title: 'المراجعة',
      weeklyReview: 'المراجعة الأسبوعية',
      monthlyReview: 'المراجعة الشهرية',
      period: 'الفترة',
      thisWeek: 'هذا الأسبوع',
      thisMonth: 'هذا الشهر',
      lastWeek: 'الأسبوع الماضي',
      lastMonth: 'الشهر الماضي',
      overview: 'نظرة عامة',
      goalsCompleted: 'الأهداف المكتملة',
      totalGoals: 'إجمالي الأهداف',
      completionRate: 'معدل الإنجاز',
      pointsEarned: 'النقاط المكتسبة',
      achievements: 'الإنجازات',
      completedGoals: 'الأهداف المكتملة',
      noCompletedGoals: 'لا توجد أهداف مكتملة في هذه الفترة',
      noGoalsMessage: 'ابدأ بتحديد الأهداف لرؤية تقدمك!',
      keepGoing: 'استمر! أنت تحرز تقدمًا رائعًا! 🎉',
      excellentWork: 'عمل ممتاز! لقد أكملت جميع الأهداف! 🏆',
      goodProgress: 'تقدم جيد! حافظ على الزخم! 💪',
      startWorking: 'حان الوقت للعمل على أهدافك! 🚀',
    },
    export: {
      title: 'تصدير البيانات',
      description: 'قم بتصدير أهدافك ومكافآتك للنسخ الاحتياطي أو التحليل',
      exportJSON: 'تصدير كـ JSON',
      exportCSV: 'تصدير كـ CSV',
      jsonDescription: 'بيانات كاملة مع جميع التفاصيل',
      csvDescription: 'تنسيق متوافق مع جداول البيانات',
      exporting: 'جارٍ تحضير التصدير...',
      exportSuccess: 'تم تصدير البيانات بنجاح',
      exportError: 'فشل تصدير البيانات',
      noData: 'لا توجد بيانات متاحة للتصدير',
      shareTitle: 'مشاركة بيانات Pathly',
    },
    import: {
      title: 'استيراد البيانات',
      description: 'استيراد الأهداف والمكافآت من ملف نسخ احتياطي أو جهاز آخر',
      selectFile: 'اختر ملف الاستيراد',
      supportedFormats: 'يدعم ملفات JSON',
      importing: 'جارٍ معالجة الاستيراد...',
      importSuccess: 'تم استيراد {goals} أهداف و {rewards} مكافآت بنجاح',
      importError: 'فشل استيراد البيانات',
      confirmTitle: 'استيراد البيانات',
      confirmMessage: 'تم العثور على {goals} أهداف و {rewards} مكافآت. كيف تريد الاستيراد؟',
      merge: 'دمج مع الموجود',
      replace: 'استبدال جميع البيانات',
      replaceConfirmTitle: 'استبدال جميع البيانات؟',
      replaceConfirmMessage: 'سيتم حذف أهدافك الحالية ({goals}) ومكافآتك ({rewards}) واستبدالها بالنسخة الاحتياطية. لا يمكن التراجع عن ذلك.',
      csvUnsupported: 'استيراد CSV غير مدعوم بعد. يرجى استيراد نسخة احتياطية بصيغة JSON.',
      invalidFile: 'هذا الملف ليس نسخة احتياطية صالحة من Pathly.',
      skipped: 'سيتم تجاهل {count} من السجلات غير الصالحة في الملف.',
      partialError: 'تم استيراد جزء فقط من النسخة الاحتياطية: أُضيفت مكافآتها، لكن تعذّر حفظ أهدافها. وفّر بعض مساحة التخزين قبل الاستيراد مرة أخرى.',
    },
    notifications: {
      title: 'الإشعارات',
      enabled: 'تفعيل الإشعارات',
      disabled: 'معطل',
      time: 'وقت التذكير',
      days: 'أيام التذكير',
      selectDays: 'اختر الأيام',
      everyday: 'كل يوم',
      weekdays: 'أيام الأسبوع',
      weekends: 'عطلة نهاية الأسبوع',
      custom: 'مخصص',
      testNotification: 'اختبار الإشعار',
      testNotificationDescription: 'إرسال إشعار تجريبي للتحقق من الإعدادات',
      testNotificationSent: 'تم إرسال الإشعار التجريبي!',
      testNotificationError: 'فشل إرسال الإشعار التجريبي',
      reminderTitle: '🎯 تذكير بالهدف',
      reminderBody: 'حان وقت العمل على: {goal}',
      testTitle: '🎯 إشعار تجريبي',
      testBody: 'الإشعارات تعمل! ستصلك تذكيرات أهدافك في الأوقات المحددة.',
      channelName: 'تذكيرات الأهداف',
      permissionsRequired: 'مطلوب أذونات الإشعارات',
      permissionsDescription: 'قم بتمكين الإشعارات لتلقي تذكيرات الأهداف',
      enablePermissions: 'تمكين الأذونات',
      permissionsDenied: 'تم رفض أذونات الإشعارات',
      permissionsGranted: 'تم منح أذونات الإشعارات',
      scheduleSuccess: 'تم جدولة الإشعارات بنجاح',
      scheduleError: 'فشل في جدولة الإشعارات',
      cancelSuccess: 'تم إلغاء الإشعارات',
      selectTime: 'اختر وقت التذكيرات اليومية',
      selectDaysDescription: 'اختر الأيام التي تريد تلقي التذكيرات فيها',
      dayNames: {
        sunday: 'الأحد',
        monday: 'الإثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',
        saturday: 'السبت',
      },
      dayNamesShort: {
        sunday: 'أحد',
        monday: 'إثن',
        tuesday: 'ثلا',
        wednesday: 'أرب',
        thursday: 'خمي',
        friday: 'جمع',
        saturday: 'سبت',
      },
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
      archivedGoals: 'الأهداف المؤرشفة',
      archivedGoalsSubtitle: 'عرض وإدارة أهدافك المؤرشفة',
      viewArchived: 'عرض الأهداف المؤرشفة',
      noArchivedGoals: 'لا توجد أهداف مؤرشفة',
      restoreGoal: 'استعادة',
      deleteGoalPermanently: 'حذف نهائياً',
      deletePermanentlyTitle: 'حذف نهائياً',
      deletePermanentlyMessage: 'حذف هذا الهدف نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم فقدان كل السجل.',
      restoreSuccess: 'تم استعادة الهدف بنجاح',
      restoreError: 'فشل في استعادة الهدف',
      deletePermanentlySuccess: 'تم حذف الهدف نهائياً',
      deletePermanentlyError: 'فشل في حذف الهدف',
      about: 'حول',
      aboutText: 'يساعدك باثلي على تتبع أهدافك وتحقيقها من خلال واجهة بسيطة وبديهية. حدد أهدافك، راقب التقدم، واحتفل بإنجازاتك.',
      version: 'الإصدار',
      languageChangedRestart: 'تم تغيير اللغة إلى العربية. أعد تشغيل التطبيق لتفعيل الاتجاه من اليمين إلى اليسار بالكامل.',
      themeOptionLabel: 'مظهر {theme}',
      themeOptionHint: 'التبديل إلى مظهر {theme}',
      languageOptionLabel: 'اللغة {language}',
    },
    validation: {
      customPeriodRequired: 'عدد أيام الفترة المخصصة مطلوب',
      customPeriodWholeDays: 'أدخل عدداً صحيحاً من الأيام، يوماً واحداً أو أكثر',
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
    },
    periods: {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      yearly: 'سنوي',
      custom: 'مخصص',
    },
    time: {
      days: 'أيام',          // 3-10 days
      hours: 'ساعات',        // 3-10 hours
      minutes: 'دقائق',      // 3-10 minutes
      day: 'يوم',            // 1 day
      hour: 'ساعة',          // 1 hour
      minute: 'دقيقة',       // 1 minute
      dayDual: 'يومان',      // 2 days
      hourDual: 'ساعتان',    // 2 hours
      minuteDual: 'دقيقتان', // 2 minutes
      left: 'متبقية',
      expired: 'منتهي',
      resetsIn: 'يتم إعادة التعيين في',
      and: 'و',
      endsAt: 'ينتهي',
      singularAfterTen: true,
    },
    labels: {
      target: 'الهدف',
      category: 'الفئة',
      description: 'الوصف',
    },
    storageErrors: {
      saveFailed: 'تعذّر حفظ آخر تغييراتك. ما زالت محفوظة في هذه الشاشة؛ اضغط إعادة المحاولة.',
      loadFailed: 'تعذّر تحميل أهدافك. لن يُحفظ أي شيء حتى يتم تحميلها - اضغط إعادة المحاولة.',
      rewardsLoadFailed: 'تعذّر تحميل مكافآتك. لا يمكن تعديلها حتى يتم تحميلها - اضغط إعادة المحاولة.',
      rewardsSaveFailed: 'تعذّر استرداد مكافأة مرتبطة بهدف مكتمل. اضغط إعادة المحاولة.',
      unreadable: 'بعض البيانات المحفوظة تالفة ولم تمكن قراءتها. تم الاحتفاظ بها جانبًا، وبدأ Pathly من جديد.',
      retry: 'إعادة المحاولة',
    },
    schedule: {
      title: 'الجدول',
      everyDay: 'كل يوم',
      specificDays: 'أيام محددة',
      specificDates: 'تواريخ محددة',
      dateRange: 'نطاق التواريخ',
      from: 'من',
      to: 'إلى',
      everyDays: 'كل {days}',
      monthlyOnDays: 'شهرياً في يوم {dates}',
      monthlyFromTo: 'شهرياً من يوم {start} إلى {end}',
      weekdayShort: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
      weekdayLong: [
        'الأحد',
        'الإثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
        'الجمعة',
        'السبت',
      ],
      monthlyDates: 'تواريخ شهرية',
      selectWeekdays: 'اختر أيام الأسبوع:',
      selectDates: 'اختر أيام الشهر:',
      selectRange: 'اختر نطاق التواريخ (مثال: 20-25):',
      listSeparator: '، ',
    },
  },
};
