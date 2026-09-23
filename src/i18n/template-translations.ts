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
  steps_daily: {
    en: { title: 'Daily Steps', description: 'Walk X steps per day' },
    ar: { title: 'الخطوات اليومية', description: 'امشِ X خطوة يومياً' },
  },
  meditation: {
    en: { title: 'Meditation', description: 'Practice mindfulness' },
    ar: { title: 'التأمل', description: 'مارس اليقظة الذهنية' },
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
  watch_tutorials: {
    en: { title: 'Watch Tutorials', description: 'Educational videos' },
    ar: { title: 'مشاهدة دروس', description: 'مقاطع فيديو تعليمية' },
  },
  
  // Work & Productivity
  complete_projects: {
    en: { title: 'Complete Projects', description: 'Finish work tasks' },
    ar: { title: 'إكمال المشاريع', description: 'إنهاء مهام العمل' },
  },
  
  // Finance
  save_money: {
    en: { title: 'Save Money', description: 'Build savings' },
    ar: { title: 'توفير المال', description: 'بناء المدخرات' },
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
  
  // Hobbies
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
  dessert: {
    en: { title: 'Dessert', description: 'Sweet treat' },
    ar: { title: 'حلوى', description: 'حلوى لذيذة' },
  },
  ice_cream: {
    en: { title: 'Ice Cream', description: 'Cold and delicious' },
    ar: { title: 'آيس كريم', description: 'بارد ولذيذ' },
  },
  smoothie: {
    en: { title: 'Smoothie', description: 'Healthy and refreshing' },
    ar: { title: 'سموذي', description: 'صحي ومنعش' },
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
  concert: {
    en: { title: 'Concert Tickets', description: 'Live music experience' },
    ar: { title: 'تذاكر حفل موسيقي', description: 'تجربة موسيقية حية' },
  },
  video_game: {
    en: { title: 'Video Game', description: 'New game purchase' },
    ar: { title: 'لعبة فيديو', description: 'شراء لعبة جديدة' },
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
  shoes: {
    en: { title: 'New Shoes', description: 'Treat your feet' },
    ar: { title: 'حذاء جديد', description: 'دلل قدميك' },
  },
  accessories: {
    en: { title: 'Accessories', description: 'Fashion accessory' },
    ar: { title: 'إكسسوارات', description: 'إكسسوار أنيق' },
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
  headphones: {
    en: { title: 'Headphones', description: 'Quality audio' },
    ar: { title: 'سماعات رأس', description: 'صوت عالي الجودة' },
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
 * Returned when a template has no translation.
 *
 * Empty strings, not the template id: the template getters fall back with
 * `translation.title || template.title`, and a truthy id defeated that fallback,
 * so an untranslated template displayed its raw id ("concert") instead of its
 * English title.
 */
const MISSING_TRANSLATION = { title: '', description: '' } as const;

/**
 * Get translated goal template
 */
export const getGoalTemplateTranslation = (templateId: string, language: Language) => {
  return goalTemplateTranslations[templateId]?.[language] || MISSING_TRANSLATION;
};

/**
 * Get translated reward template
 */
export const getRewardTemplateTranslation = (templateId: string, language: Language) => {
  return rewardTemplateTranslations[templateId]?.[language] || MISSING_TRANSLATION;
};
