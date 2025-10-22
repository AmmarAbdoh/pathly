/**
 * Template Translations
 * Translations for goal and reward templates
 */

export type Language = 'en' | 'ar';

// Goal Template Translations
export const goalTemplateTranslations: Record<string, Record<Language, { title: string; description: string }>> = {
  // Fitness & Health
  lose_weight: {
    en: { title: 'Lose Weight', description: 'Reach your target weight' },
    ar: { title: 'إنقاص الوزن', description: 'الوصول إلى وزنك المستهدف' },
  },
  gain_muscle: {
    en: { title: 'Build Muscle', description: 'Increase muscle mass' },
    ar: { title: 'بناء العضلات', description: 'زيادة الكتلة العضلية' },
  },
  run_distance: {
    en: { title: 'Run Distance', description: 'Complete running goal' },
    ar: { title: 'مسافة الجري', description: 'إكمال هدف الجري' },
  },
  drink_water: {
    en: { title: 'Drink Water', description: 'Stay hydrated daily' },
    ar: { title: 'شرب الماء', description: 'حافظ على الترطيب يومياً' },
  },
  workout_sessions: {
    en: { title: 'Workout Sessions', description: 'Complete workout routines' },
    ar: { title: 'جلسات التمرين', description: 'أكمل روتين التمارين' },
  },
  steps_daily: {
    en: { title: 'Daily Steps', description: 'Walk X steps per day' },
    ar: { title: 'الخطوات اليومية', description: 'امشِ X خطوة يومياً' },
  },
  sleep_hours: {
    en: { title: 'Sleep Hours', description: 'Get enough rest' },
    ar: { title: 'ساعات النوم', description: 'احصل على قسط كافٍ من الراحة' },
  },
  meditation: {
    en: { title: 'Meditation', description: 'Practice mindfulness' },
    ar: { title: 'التأمل', description: 'مارس اليقظة الذهنية' },
  },
  yoga_sessions: {
    en: { title: 'Yoga Practice', description: 'Regular yoga sessions' },
    ar: { title: 'ممارسة اليوغا', description: 'جلسات يوغا منتظمة' },
  },
  push_ups: {
    en: { title: 'Push-ups', description: 'Build upper body strength' },
    ar: { title: 'تمارين الضغط', description: 'بناء قوة الجزء العلوي' },
  },
  
  // Learning & Education
  read_books: {
    en: { title: 'Read Books', description: 'Complete reading goal' },
    ar: { title: 'قراءة الكتب', description: 'أكمل هدف القراءة' },
  },
  learn_language: {
    en: { title: 'Learn Language', description: 'Study new language' },
    ar: { title: 'تعلم لغة', description: 'ادرس لغة جديدة' },
  },
  online_course: {
    en: { title: 'Online Course', description: 'Complete course modules' },
    ar: { title: 'دورة عبر الإنترنت', description: 'أكمل وحدات الدورة' },
  },
  study_hours: {
    en: { title: 'Study Hours', description: 'Dedicated learning time' },
    ar: { title: 'ساعات الدراسة', description: 'وقت مخصص للتعلم' },
  },
  coding_practice: {
    en: { title: 'Coding Practice', description: 'Improve programming skills' },
    ar: { title: 'ممارسة البرمجة', description: 'حسّن مهارات البرمجة' },
  },
  watch_tutorials: {
    en: { title: 'Watch Tutorials', description: 'Educational videos' },
    ar: { title: 'مشاهدة دروس', description: 'مقاطع فيديو تعليمية' },
  },
  practice_instrument: {
    en: { title: 'Practice Music', description: 'Learn an instrument' },
    ar: { title: 'ممارسة الموسيقى', description: 'تعلم آلة موسيقية' },
  },
  write_journal: {
    en: { title: 'Write Journal', description: 'Daily journaling practice' },
    ar: { title: 'كتابة يوميات', description: 'ممارسة الكتابة اليومية' },
  },
  learn_skill: {
    en: { title: 'Learn New Skill', description: 'Master a new ability' },
    ar: { title: 'تعلم مهارة جديدة', description: 'إتقان قدرة جديدة' },
  },
  
  // Work & Productivity
  complete_projects: {
    en: { title: 'Complete Projects', description: 'Finish work tasks' },
    ar: { title: 'إكمال المشاريع', description: 'إنهاء مهام العمل' },
  },
  work_hours: {
    en: { title: 'Productive Hours', description: 'Focused work time' },
    ar: { title: 'ساعات الإنتاج', description: 'وقت عمل مركز' },
  },
  meetings_attended: {
    en: { title: 'Attend Meetings', description: 'Professional engagement' },
    ar: { title: 'حضور الاجتماعات', description: 'المشاركة المهنية' },
  },
  tasks_completed: {
    en: { title: 'Complete Tasks', description: 'Daily task completion' },
    ar: { title: 'إكمال المهام', description: 'إنجاز المهام اليومية' },
  },
  emails_processed: {
    en: { title: 'Process Emails', description: 'Inbox management' },
    ar: { title: 'معالجة الرسائل', description: 'إدارة البريد الوارد' },
  },
  
  // Finance
  save_money: {
    en: { title: 'Save Money', description: 'Build savings' },
    ar: { title: 'توفير المال', description: 'بناء المدخرات' },
  },
  reduce_spending: {
    en: { title: 'Reduce Spending', description: 'Cut unnecessary expenses' },
    ar: { title: 'تقليل الإنفاق', description: 'خفض النفقات غير الضرورية' },
  },
  earn_income: {
    en: { title: 'Earn Income', description: 'Increase earnings' },
    ar: { title: 'كسب الدخل', description: 'زيادة الأرباح' },
  },
  invest_money: {
    en: { title: 'Invest Money', description: 'Build investment portfolio' },
    ar: { title: 'استثمار المال', description: 'بناء محفظة استثمارية' },
  },
  pay_debt: {
    en: { title: 'Pay Off Debt', description: 'Reduce debt balance' },
    ar: { title: 'سداد الديون', description: 'تقليل رصيد الديون' },
  },
  
  // Personal & Social
  call_family: {
    en: { title: 'Call Family', description: 'Stay connected with loved ones' },
    ar: { title: 'الاتصال بالعائلة', description: 'ابقَ على تواصل مع الأحبة' },
  },
  meet_friends: {
    en: { title: 'Meet Friends', description: 'Social connections' },
    ar: { title: 'لقاء الأصدقاء', description: 'الروابط الاجتماعية' },
  },
  volunteer_hours: {
    en: { title: 'Volunteer', description: 'Give back to community' },
    ar: { title: 'العمل التطوعي', description: 'رد الجميل للمجتمع' },
  },
  clean_organize: {
    en: { title: 'Clean & Organize', description: 'Maintain tidy space' },
    ar: { title: 'التنظيف والترتيب', description: 'حافظ على مساحة نظيفة' },
  },
  practice_gratitude: {
    en: { title: 'Practice Gratitude', description: 'Daily thankfulness' },
    ar: { title: 'ممارسة الامتنان', description: 'الشكر اليومي' },
  },
  
  // Hobbies
  draw_paint: {
    en: { title: 'Draw & Paint', description: 'Creative art practice' },
    ar: { title: 'الرسم والتلوين', description: 'ممارسة الفن الإبداعي' },
  },
  photography: {
    en: { title: 'Photography', description: 'Capture moments' },
    ar: { title: 'التصوير الفوتوغرافي', description: 'التقط اللحظات' },
  },
  gardening: {
    en: { title: 'Gardening', description: 'Grow plants' },
    ar: { title: 'البستنة', description: 'زراعة النباتات' },
  },
  cooking: {
    en: { title: 'Cooking', description: 'Prepare meals' },
    ar: { title: 'الطبخ', description: 'إعداد الوجبات' },
  },
  gaming: {
    en: { title: 'Gaming', description: 'Play games' },
    ar: { title: 'الألعاب', description: 'لعب الألعاب' },
  },
  daily_water: {
    en: { title: 'Drink Water', description: 'Stay hydrated daily' },
    ar: { title: 'شرب الماء', description: 'حافظ على الترطيب يومياً' },
  },
  workout_streak: {
    en: { title: 'Workout Streak', description: 'Consistent exercise routine' },
    ar: { title: 'سلسلة تمارين', description: 'روتين تمارين متسق' },
  },
  online_courses: {
    en: { title: 'Online Courses', description: 'Complete online courses' },
    ar: { title: 'دورات عبر الإنترنت', description: 'أكمل الدورات عبر الإنترنت' },
  },
  reduce_debt: {
    en: { title: 'Reduce Debt', description: 'Pay down debt' },
    ar: { title: 'تقليل الديون', description: 'سداد الديون' },
  },
  invest: {
    en: { title: 'Invest Money', description: 'Build investments' },
    ar: { title: 'استثمار المال', description: 'بناء الاستثمارات' },
  },
  reduce_distractions: {
    en: { title: 'Reduce Distractions', description: 'Minimize interruptions' },
    ar: { title: 'تقليل التشتيت', description: 'تقليل المقاطعات' },
  },
  sleep_better: {
    en: { title: 'Sleep Better', description: 'Improve sleep quality' },
    ar: { title: 'نوم أفضل', description: 'تحسين جودة النوم' },
  },
  journaling: {
    en: { title: 'Daily Journaling', description: 'Write in journal daily' },
    ar: { title: 'كتابة يوميات', description: 'اكتب في اليوميات يومياً' },
  },
  family_time: {
    en: { title: 'Family Time', description: 'Spend quality time with family' },
    ar: { title: 'وقت العائلة', description: 'اقضِ وقتاً ممتعاً مع العائلة' },
  },
  creative_projects: {
    en: { title: 'Creative Projects', description: 'Work on creative projects' },
    ar: { title: 'مشاريع إبداعية', description: 'اعمل على مشاريع إبداعية' },
  },
  learn_instrument: {
    en: { title: 'Learn Instrument', description: 'Practice musical instrument' },
    ar: { title: 'تعلم آلة موسيقية', description: 'مارس آلة موسيقية' },
  },
  writing: {
    en: { title: 'Writing', description: 'Write regularly' },
    ar: { title: 'الكتابة', description: 'اكتب بانتظام' },
  },
  drawing: {
    en: { title: 'Drawing', description: 'Practice drawing skills' },
    ar: { title: 'الرسم', description: 'مارس مهارات الرسم' },
  },
  cycling: {
    en: { title: 'Cycling', description: 'Ride your bike regularly' },
    ar: { title: 'ركوب الدراجة', description: 'اركب دراجتك بانتظام' },
  },
  swimming: {
    en: { title: 'Swimming', description: 'Swim for exercise' },
    ar: { title: 'السباحة', description: 'اسبح للتمرين' },
  },
  yoga: {
    en: { title: 'Yoga Practice', description: 'Regular yoga sessions' },
    ar: { title: 'ممارسة اليوغا', description: 'جلسات يوغا منتظمة' },
  },
  pushups: {
    en: { title: 'Push-ups', description: 'Daily push-up exercise' },
    ar: { title: 'تمارين الضغط', description: 'تمارين ضغط يومية' },
  },
  plank: {
    en: { title: 'Plank Exercise', description: 'Hold plank position' },
    ar: { title: 'تمرين البلانك', description: 'حافظ على وضعية البلانك' },
  },
  vegetables: {
    en: { title: 'Eat Vegetables', description: 'Daily vegetable servings' },
    ar: { title: 'تناول الخضروات', description: 'حصص يومية من الخضروات' },
  },
  reduce_sugar: {
    en: { title: 'Reduce Sugar', description: 'Cut down sugar intake' },
    ar: { title: 'تقليل السكر', description: 'قلل استهلاك السكر' },
  },
  vitamins: {
    en: { title: 'Take Vitamins', description: 'Daily vitamin supplements' },
    ar: { title: 'تناول الفيتامينات', description: 'مكملات فيتامينات يومية' },
  },
  reduce_caffeine: {
    en: { title: 'Reduce Caffeine', description: 'Limit caffeine consumption' },
    ar: { title: 'تقليل الكافيين', description: 'حدد استهلاك الكافيين' },
  },
  stretch: {
    en: { title: 'Stretching', description: 'Daily stretching routine' },
    ar: { title: 'التمدد', description: 'روتين تمدد يومي' },
  },
  dental: {
    en: { title: 'Dental Care', description: 'Maintain dental hygiene' },
    ar: { title: 'العناية بالأسنان', description: 'حافظ على نظافة الأسنان' },
  },
  podcasts: {
    en: { title: 'Listen to Podcasts', description: 'Educational podcasts' },
    ar: { title: 'استمع للبودكاست', description: 'بودكاست تعليمي' },
  },
  coding: {
    en: { title: 'Coding Practice', description: 'Practice programming' },
    ar: { title: 'ممارسة البرمجة', description: 'مارس البرمجة' },
  },
  practice_math: {
    en: { title: 'Practice Math', description: 'Improve math skills' },
    ar: { title: 'ممارسة الرياضيات', description: 'حسّن مهارات الرياضيات' },
  },
  vocabulary: {
    en: { title: 'Build Vocabulary', description: 'Learn new words' },
    ar: { title: 'بناء المفردات', description: 'تعلم كلمات جديدة' },
  },
  certifications: {
    en: { title: 'Get Certifications', description: 'Earn professional certificates' },
    ar: { title: 'الحصول على شهادات', description: 'احصل على شهادات مهنية' },
  },
  emails: {
    en: { title: 'Process Emails', description: 'Manage email inbox' },
    ar: { title: 'معالجة الرسائل', description: 'إدارة صندوق الوارد' },
  },
  meetings: {
    en: { title: 'Attend Meetings', description: 'Professional meetings' },
    ar: { title: 'حضور الاجتماعات', description: 'اجتماعات مهنية' },
  },
  networking: {
    en: { title: 'Networking', description: 'Build professional connections' },
    ar: { title: 'التواصل المهني', description: 'بناء اتصالات مهنية' },
  },
  skills: {
    en: { title: 'Learn New Skills', description: 'Develop professional skills' },
    ar: { title: 'تعلم مهارات جديدة', description: 'طور المهارات المهنية' },
  },
  presentations: {
    en: { title: 'Give Presentations', description: 'Public speaking practice' },
    ar: { title: 'تقديم العروض', description: 'ممارسة التحدث أمام الجمهور' },
  },
  emergency_fund: {
    en: { title: 'Emergency Fund', description: 'Build emergency savings' },
    ar: { title: 'صندوق طوارئ', description: 'بناء مدخرات الطوارئ' },
  },
  reduce_expenses: {
    en: { title: 'Reduce Expenses', description: 'Cut unnecessary spending' },
    ar: { title: 'تقليل النفقات', description: 'قلل الإنفاق غير الضروري' },
  },
  side_income: {
    en: { title: 'Side Income', description: 'Earn extra money' },
    ar: { title: 'دخل جانبي', description: 'اكسب مالاً إضافياً' },
  },
  no_eat_out: {
    en: { title: 'No Eating Out', description: 'Cook at home instead' },
    ar: { title: 'لا أكل خارجي', description: 'اطبخ في المنزل بدلاً من ذلك' },
  },
  budget_track: {
    en: { title: 'Track Budget', description: 'Monitor spending habits' },
    ar: { title: 'تتبع الميزانية', description: 'راقب عادات الإنفاق' },
  },
  gratitude: {
    en: { title: 'Practice Gratitude', description: 'Daily gratitude practice' },
    ar: { title: 'ممارسة الامتنان', description: 'ممارسة الامتنان اليومية' },
  },
  morning_routine: {
    en: { title: 'Morning Routine', description: 'Consistent morning habits' },
    ar: { title: 'روتين الصباح', description: 'عادات صباحية متسقة' },
  },
  no_social_media: {
    en: { title: 'Limit Social Media', description: 'Reduce screen time' },
    ar: { title: 'تحديد وسائل التواصل', description: 'قلل وقت الشاشة' },
  },
  cold_shower: {
    en: { title: 'Cold Showers', description: 'Take cold showers' },
    ar: { title: 'الاستحمام البارد', description: 'خذ حماماً بارداً' },
  },
  affirmations: {
    en: { title: 'Daily Affirmations', description: 'Positive self-talk' },
    ar: { title: 'التأكيدات اليومية', description: 'حديث إيجابي مع النفس' },
  },
  declutter: {
    en: { title: 'Declutter', description: 'Organize and clean spaces' },
    ar: { title: 'التخلص من الفوضى', description: 'نظم ونظف المساحات' },
  },
  volunteer: {
    en: { title: 'Volunteer', description: 'Give back to community' },
    ar: { title: 'العمل التطوعي', description: 'رد الجميل للمجتمع' },
  },
  make_friends: {
    en: { title: 'Make New Friends', description: 'Build new friendships' },
    ar: { title: 'تكوين صداقات جديدة', description: 'بناء صداقات جديدة' },
  },
  compliments: {
    en: { title: 'Give Compliments', description: 'Spread positivity' },
    ar: { title: 'إعطاء المجاملات', description: 'نشر الإيجابية' },
  },
  help_others: {
    en: { title: 'Help Others', description: 'Acts of kindness' },
    ar: { title: 'مساعدة الآخرين', description: 'أعمال اللطف' },
  },
  recycle: {
    en: { title: 'Recycle', description: 'Recycle materials' },
    ar: { title: 'إعادة التدوير', description: 'إعادة تدوير المواد' },
  },
  reduce_plastic: {
    en: { title: 'Reduce Plastic', description: 'Use less plastic' },
    ar: { title: 'تقليل البلاستيك', description: 'استخدم بلاستيك أقل' },
  },
  plant_trees: {
    en: { title: 'Plant Trees', description: 'Environmental contribution' },
    ar: { title: 'زراعة الأشجار', description: 'مساهمة بيئية' },
  },
  composting: {
    en: { title: 'Composting', description: 'Create compost from waste' },
    ar: { title: 'التسميد', description: 'إنشاء سماد من النفايات' },
  },
};

// Reward Template Translations
export const rewardTemplateTranslations: Record<string, Record<Language, { title: string; description: string }>> = {
  // Food & Drinks
  coffee_shop: {
    en: { title: 'Coffee Shop Visit', description: 'Treat yourself to your favorite drink' },
    ar: { title: 'زيارة المقهى', description: 'دلل نفسك بمشروبك المفضل' },
  },
  restaurant_meal: {
    en: { title: 'Restaurant Meal', description: 'Enjoy a nice meal out' },
    ar: { title: 'وجبة في مطعم', description: 'استمتع بوجبة لذيذة بالخارج' },
  },
  dessert: {
    en: { title: 'Dessert', description: 'Sweet treat' },
    ar: { title: 'حلوى', description: 'حلوى لذيذة' },
  },
  pizza: {
    en: { title: 'Pizza', description: 'Order your favorite pizza' },
    ar: { title: 'بيتزا', description: 'اطلب بيتزا المفضلة' },
  },
  ice_cream: {
    en: { title: 'Ice Cream', description: 'Cold and delicious' },
    ar: { title: 'آيس كريم', description: 'بارد ولذيذ' },
  },
  smoothie: {
    en: { title: 'Smoothie', description: 'Healthy and refreshing' },
    ar: { title: 'سموذي', description: 'صحي ومنعش' },
  },
  snacks: {
    en: { title: 'Snack Time', description: 'Your favorite snacks' },
    ar: { title: 'وقت الوجبات الخفيفة', description: 'وجباتك الخفيفة المفضلة' },
  },
  bubble_tea: {
    en: { title: 'Bubble Tea', description: 'Refreshing bubble tea drink' },
    ar: { title: 'شاي الفقاعات', description: 'مشروب شاي الفقاعات المنعش' },
  },
  pizza_night: {
    en: { title: 'Pizza Night', description: 'Order your favorite pizza' },
    ar: { title: 'ليلة بيتزا', description: 'اطلب بيتزا المفضلة لديك' },
  },
  sushi: {
    en: { title: 'Sushi Dinner', description: 'Fresh sushi from local restaurant' },
    ar: { title: 'عشاء سوشي', description: 'سوشي طازج من مطعم محلي' },
  },
  burger: {
    en: { title: 'Gourmet Burger', description: 'Premium burger meal' },
    ar: { title: 'برجر فاخر', description: 'وجبة برجر متميزة' },
  },
  brunch: {
    en: { title: 'Weekend Brunch', description: 'Lazy Sunday brunch outing' },
    ar: { title: 'برانش نهاية الأسبوع', description: 'وجبة برانش يوم الأحد' },
  },
  takeout: {
    en: { title: 'Takeout Dinner', description: 'Order from your favorite restaurant' },
    ar: { title: 'عشاء خارجي', description: 'اطلب من مطعمك المفضل' },
  },
  
  // Entertainment
  movie_night: {
    en: { title: 'Movie Night', description: 'Watch a new movie' },
    ar: { title: 'ليلة فيلم', description: 'شاهد فيلماً جديداً' },
  },
  streaming_service: {
    en: { title: 'Streaming Subscription', description: '1 month subscription' },
    ar: { title: 'اشتراك البث', description: 'اشتراك لمدة شهر واحد' },
  },
  concert_ticket: {
    en: { title: 'Concert Ticket', description: 'See your favorite artist' },
    ar: { title: 'تذكرة حفل موسيقي', description: 'شاهد فنانك المفضل' },
  },
  video_game: {
    en: { title: 'Video Game', description: 'New game purchase' },
    ar: { title: 'لعبة فيديو', description: 'شراء لعبة جديدة' },
  },
  book_purchase: {
    en: { title: 'Book Purchase', description: 'Buy a new book' },
    ar: { title: 'شراء كتاب', description: 'اشترِ كتاباً جديداً' },
  },
  music_album: {
    en: { title: 'Music Album', description: 'Download new music' },
    ar: { title: 'ألبوم موسيقي', description: 'حمّل موسيقى جديدة' },
  },
  movie_ticket: {
    en: { title: 'Movie Theater', description: 'Watch a movie in cinema' },
    ar: { title: 'سينما', description: 'شاهد فيلماً في السينما' },
  },
  streaming_month: {
    en: { title: 'Streaming Service', description: 'One month subscription' },
    ar: { title: 'خدمة البث', description: 'اشتراك لمدة شهر واحد' },
  },
  game_night: {
    en: { title: 'Game Night', description: 'Board games with friends' },
    ar: { title: 'ليلة ألعاب', description: 'ألعاب الطاولة مع الأصدقاء' },
  },
  theater: {
    en: { title: 'Theater Show', description: 'Watch a live theater performance' },
    ar: { title: 'عرض مسرحي', description: 'شاهد عرضاً مسرحياً مباشراً' },
  },
  karaoke: {
    en: { title: 'Karaoke Night', description: 'Sing your heart out' },
    ar: { title: 'ليلة كاريوكي', description: 'غنِ بكل قلبك' },
  },
  escape_room: {
    en: { title: 'Escape Room', description: 'Puzzle-solving adventure' },
    ar: { title: 'غرفة الهروب', description: 'مغامرة حل الألغاز' },
  },
  bowling: {
    en: { title: 'Bowling', description: 'Fun bowling session' },
    ar: { title: 'البولينج', description: 'جلسة بولينج ممتعة' },
  },
  
  // Shopping
  clothing_item: {
    en: { title: 'Clothing Item', description: 'New outfit piece' },
    ar: { title: 'قطعة ملابس', description: 'قطعة زي جديدة' },
  },
  shoes: {
    en: { title: 'New Shoes', description: 'Treat your feet' },
    ar: { title: 'حذاء جديد', description: 'دلل قدميك' },
  },
  accessories: {
    en: { title: 'Accessories', description: 'Fashion accessory' },
    ar: { title: 'إكسسوارات', description: 'إكسسوار أنيق' },
  },
  online_shopping: {
    en: { title: 'Online Shopping', description: 'Shop your wishlist' },
    ar: { title: 'التسوق عبر الإنترنت', description: 'تسوق من قائمة أمنياتك' },
  },
  home_decor: {
    en: { title: 'Home Décor', description: 'Beautify your space' },
    ar: { title: 'ديكور منزلي', description: 'جمّل مساحتك' },
  },
  clothes: {
    en: { title: 'New Clothes', description: 'Update your wardrobe' },
    ar: { title: 'ملابس جديدة', description: 'حدّث خزانة ملابسك' },
  },
  makeup: {
    en: { title: 'Makeup Products', description: 'Beauty essentials' },
    ar: { title: 'منتجات مكياج', description: 'أساسيات الجمال' },
  },
  perfume: {
    en: { title: 'Perfume', description: 'Signature scent' },
    ar: { title: 'عطر', description: 'عطرك المميز' },
  },
  sunglasses: {
    en: { title: 'Sunglasses', description: 'Stylish eye protection' },
    ar: { title: 'نظارات شمسية', description: 'حماية أنيقة للعين' },
  },
  gift_card: {
    en: { title: 'Gift Card', description: 'Shop at your favorite store' },
    ar: { title: 'بطاقة هدية', description: 'تسوق من متجرك المفضل' },
  },
  plants: {
    en: { title: 'Indoor Plants', description: 'Bring nature inside' },
    ar: { title: 'نباتات داخلية', description: 'أحضر الطبيعة للداخل' },
  },
  candles: {
    en: { title: 'Scented Candles', description: 'Create cozy atmosphere' },
    ar: { title: 'شموع معطرة', description: 'اخلق جواً دافئاً' },
  },
  
  // Wellness & Self-Care
  spa_day: {
    en: { title: 'Spa Day', description: 'Relaxation and pampering' },
    ar: { title: 'يوم في المنتجع الصحي', description: 'استرخاء ودلال' },
  },
  massage: {
    en: { title: 'Massage Session', description: 'Relieve stress' },
    ar: { title: 'جلسة مساج', description: 'تخفيف التوتر' },
  },
  manicure: {
    en: { title: 'Manicure', description: 'Nail care' },
    ar: { title: 'عناية بالأظافر', description: 'العناية بالأظافر' },
  },
  haircut: {
    en: { title: 'Haircut', description: 'New hairstyle' },
    ar: { title: 'قصة شعر', description: 'تسريحة جديدة' },
  },
  skincare_product: {
    en: { title: 'Skincare Product', description: 'Pamper your skin' },
    ar: { title: 'منتج للعناية بالبشرة', description: 'دلل بشرتك' },
  },
  yoga_class: {
    en: { title: 'Yoga Class', description: 'Mind and body wellness' },
    ar: { title: 'صف يوغا', description: 'صحة العقل والجسم' },
  },
  gym_month: {
    en: { title: 'Gym Membership', description: 'One month gym access' },
    ar: { title: 'عضوية صالة رياضية', description: 'وصول لصالة الرياضة لمدة شهر' },
  },
  meditation_app: {
    en: { title: 'Meditation App', description: 'Premium meditation subscription' },
    ar: { title: 'تطبيق تأمل', description: 'اشتراك تأمل متميز' },
  },
  skincare: {
    en: { title: 'Skincare Set', description: 'Complete skincare routine' },
    ar: { title: 'مجموعة عناية بالبشرة', description: 'روتين عناية كامل بالبشرة' },
  },
  bath_products: {
    en: { title: 'Bath Products', description: 'Luxurious bath essentials' },
    ar: { title: 'منتجات الاستحمام', description: 'أساسيات استحمام فاخرة' },
  },
  fitness_tracker: {
    en: { title: 'Fitness Tracker', description: 'Monitor your health' },
    ar: { title: 'متتبع اللياقة', description: 'راقب صحتك' },
  },
  
  // Experiences
  weekend_trip: {
    en: { title: 'Weekend Trip', description: 'Short getaway' },
    ar: { title: 'رحلة نهاية الأسبوع', description: 'رحلة قصيرة' },
  },
  museum_visit: {
    en: { title: 'Museum Visit', description: 'Cultural experience' },
    ar: { title: 'زيارة المتحف', description: 'تجربة ثقافية' },
  },
  amusement_park: {
    en: { title: 'Amusement Park', description: 'Fun day out' },
    ar: { title: 'مدينة ملاهي', description: 'يوم ممتع بالخارج' },
  },
  sports_event: {
    en: { title: 'Sports Event', description: 'Live game ticket' },
    ar: { title: 'حدث رياضي', description: 'تذكرة مباراة مباشرة' },
  },
  class_workshop: {
    en: { title: 'Class/Workshop', description: 'Learn something new' },
    ar: { title: 'فصل / ورشة عمل', description: 'تعلم شيئاً جديداً' },
  },
  day_trip: {
    en: { title: 'Day Trip', description: 'Explore nearby destination' },
    ar: { title: 'رحلة يومية', description: 'استكشف وجهة قريبة' },
  },
  theme_park: {
    en: { title: 'Theme Park', description: 'Thrilling rides and fun' },
    ar: { title: 'مدينة ملاهي', description: 'ألعاب مثيرة ومتعة' },
  },
  museum: {
    en: { title: 'Museum Visit', description: 'Art and history exploration' },
    ar: { title: 'زيارة متحف', description: 'استكشاف الفن والتاريخ' },
  },
  aquarium: {
    en: { title: 'Aquarium', description: 'Underwater world adventure' },
    ar: { title: 'حوض أسماك', description: 'مغامرة عالم تحت الماء' },
  },
  zoo: {
    en: { title: 'Zoo Visit', description: 'See exotic animals' },
    ar: { title: 'زيارة حديقة حيوان', description: 'شاهد حيوانات غريبة' },
  },
  weekend_getaway: {
    en: { title: 'Weekend Getaway', description: 'Short vacation trip' },
    ar: { title: 'هروب نهاية الأسبوع', description: 'رحلة إجازة قصيرة' },
  },
  beach_day: {
    en: { title: 'Beach Day', description: 'Sun, sand, and relaxation' },
    ar: { title: 'يوم شاطئ', description: 'شمس ورمال واسترخاء' },
  },
  hiking: {
    en: { title: 'Hiking Adventure', description: 'Nature trail exploration' },
    ar: { title: 'مغامرة المشي', description: 'استكشاف مسارات الطبيعة' },
  },
  camping: {
    en: { title: 'Camping Trip', description: 'Outdoor overnight adventure' },
    ar: { title: 'رحلة تخييم', description: 'مغامرة ليلية في الهواء الطلق' },
  },
  hot_air_balloon: {
    en: { title: 'Hot Air Balloon', description: 'Sky-high adventure' },
    ar: { title: 'منطاد هواء ساخن', description: 'مغامرة في السماء' },
  },
  
  // Tech & Gadgets
  app_purchase: {
    en: { title: 'App Purchase', description: 'Premium app' },
    ar: { title: 'شراء تطبيق', description: 'تطبيق متميز' },
  },
  headphones: {
    en: { title: 'Headphones', description: 'Quality audio' },
    ar: { title: 'سماعات رأس', description: 'صوت عالي الجودة' },
  },
  phone_accessory: {
    en: { title: 'Phone Accessory', description: 'Upgrade your device' },
    ar: { title: 'ملحق للهاتف', description: 'طوّر جهازك' },
  },
  gadget: {
    en: { title: 'New Gadget', description: 'Cool tech item' },
    ar: { title: 'أداة جديدة', description: 'عنصر تقني رائع' },
  },
  software_license: {
    en: { title: 'Software License', description: 'Productivity tool' },
    ar: { title: 'ترخيص برنامج', description: 'أداة إنتاجية' },
  },
  smart_speaker: {
    en: { title: 'Smart Speaker', description: 'Voice-controlled assistant' },
    ar: { title: 'مكبر صوت ذكي', description: 'مساعد يتحكم بالصوت' },
  },
  keyboard: {
    en: { title: 'Mechanical Keyboard', description: 'Premium typing experience' },
    ar: { title: 'لوحة مفاتيح ميكانيكية', description: 'تجربة كتابة متميزة' },
  },
  mouse: {
    en: { title: 'Gaming Mouse', description: 'Precision control' },
    ar: { title: 'فأرة ألعاب', description: 'تحكم دقيق' },
  },
  webcam: {
    en: { title: 'HD Webcam', description: 'Crystal clear video calls' },
    ar: { title: 'كاميرا ويب عالية الدقة', description: 'مكالمات فيديو واضحة' },
  },
  power_bank: {
    en: { title: 'Power Bank', description: 'Portable charging solution' },
    ar: { title: 'بنك طاقة', description: 'حل شحن محمول' },
  },
  phone_case: {
    en: { title: 'Phone Case', description: 'Protect your device' },
    ar: { title: 'غطاء هاتف', description: 'احمِ جهازك' },
  },
  tablet: {
    en: { title: 'Tablet', description: 'Portable entertainment' },
    ar: { title: 'جهاز لوحي', description: 'ترفيه محمول' },
  },
  smart_watch: {
    en: { title: 'Smart Watch', description: 'Wearable technology' },
    ar: { title: 'ساعة ذكية', description: 'تقنية يمكن ارتداؤها' },
  },
  led_lights: {
    en: { title: 'LED Lights', description: 'Ambient room lighting' },
    ar: { title: 'أضواء LED', description: 'إضاءة الغرفة المحيطة' },
  },
  
  // Other
  donation: {
    en: { title: 'Charitable Donation', description: 'Give back' },
    ar: { title: 'تبرع خيري', description: 'رد الجميل' },
  },
  hobby_supplies: {
    en: { title: 'Hobby Supplies', description: 'Materials for your passion' },
    ar: { title: 'مستلزمات الهواية', description: 'مواد لشغفك' },
  },
  free_time: {
    en: { title: 'Free Time', description: 'Guilt-free relaxation' },
    ar: { title: 'وقت حر', description: 'استرخاء بدون ذنب' },
  },
  cheat_day: {
    en: { title: 'Cheat Day', description: 'Break the rules' },
    ar: { title: 'يوم الغش', description: 'اكسر القواعد' },
  },
  lazy_day: {
    en: { title: 'Lazy Day', description: 'Do nothing' },
    ar: { title: 'يوم كسل', description: 'لا تفعل شيئاً' },
  },
  art_supplies: {
    en: { title: 'Art Supplies', description: 'Materials for creative projects' },
    ar: { title: 'مستلزمات فنية', description: 'مواد للمشاريع الإبداعية' },
  },
  photography_gear: {
    en: { title: 'Photography Gear', description: 'Camera accessories' },
    ar: { title: 'معدات تصوير', description: 'إكسسوارات الكاميرا' },
  },
  musical_accessory: {
    en: { title: 'Musical Accessory', description: 'Enhance your music practice' },
    ar: { title: 'ملحق موسيقي', description: 'حسّن ممارستك الموسيقية' },
  },
  cookbook: {
    en: { title: 'Cookbook', description: 'New recipes to try' },
    ar: { title: 'كتاب طبخ', description: 'وصفات جديدة لتجربتها' },
  },
  cooking_class: {
    en: { title: 'Cooking Class', description: 'Learn culinary skills' },
    ar: { title: 'صف طبخ', description: 'تعلم مهارات الطهي' },
  },
  craft_kit: {
    en: { title: 'Craft Kit', description: 'DIY project materials' },
    ar: { title: 'مجموعة حرف يدوية', description: 'مواد مشاريع DIY' },
  },
  gardening_tools: {
    en: { title: 'Gardening Tools', description: 'Tools for your garden' },
    ar: { title: 'أدوات البستنة', description: 'أدوات لحديقتك' },
  },
  puzzle: {
    en: { title: 'Puzzle', description: 'Brain-teasing entertainment' },
    ar: { title: 'أحجية', description: 'ترفيه يحفز العقل' },
  },
  hobby_book: {
    en: { title: 'Hobby Book', description: 'Learn about your passion' },
    ar: { title: 'كتاب هواية', description: 'تعلم عن شغفك' },
  },
  sports_equipment: {
    en: { title: 'Sports Equipment', description: 'Gear for your sport' },
    ar: { title: 'معدات رياضية', description: 'معدات لرياضتك' },
  },
  cheat_meal: {
    en: { title: 'Cheat Meal', description: 'Indulge guilt-free' },
    ar: { title: 'وجبة غش', description: 'استمتع بدون ذنب' },
  },
  sleep_in: {
    en: { title: 'Sleep In', description: 'Extra morning sleep' },
    ar: { title: 'النوم المتأخر', description: 'نوم صباحي إضافي' },
  },
  charity: {
    en: { title: 'Charity Donation', description: 'Give to a cause' },
    ar: { title: 'تبرع خيري', description: 'تبرع لقضية' },
  },
  flowers: {
    en: { title: 'Fresh Flowers', description: 'Brighten your space' },
    ar: { title: 'زهور طازجة', description: 'أنر مساحتك' },
  },
  magazine: {
    en: { title: 'Magazine', description: 'Your favorite publication' },
    ar: { title: 'مجلة', description: 'منشورك المفضل' },
  },
  parking_pass: {
    en: { title: 'Parking Pass', description: 'Convenient parking access' },
    ar: { title: 'تصريح موقف', description: 'وصول مريح للموقف' },
  },
  pet_treat: {
    en: { title: 'Pet Treat', description: 'Spoil your furry friend' },
    ar: { title: 'مكافأة حيوان أليف', description: 'دلل صديقك ذو الفرو' },
  },
};

/**
 * Get translated goal template
 */
export const getGoalTemplateTranslation = (templateId: string, language: Language) => {
  return goalTemplateTranslations[templateId]?.[language] || { title: templateId, description: '' };
};

/**
 * Get translated reward template
 */
export const getRewardTemplateTranslation = (templateId: string, language: Language) => {
  return rewardTemplateTranslations[templateId]?.[language] || { title: templateId, description: '' };
};
