export const site = {
  name: "FlyBridge Education",
  shortName: "FlyBridge",
  tagline: "Helping students bridge the gap to GCSE success.",
  description:
    "Thoughtful online tuition in science, mathematics and languages, with free assessment, clear reporting and supportive teaching for families across the UK.",
  url: "https://flybridgeeducation.co.uk",
  email: "admin@flybridgeeducation.co.uk",
  phone: "07729 467146",
  whatsappHref: "https://wa.me/447729467146",
  classroomHref: "https://classroom.google.com",
  callbackHref: "/request-callback",
  assessmentHref: "/book-assessment",
  contactHref: "/contact",
  images: {
    logo: "/images/logo.svg",
    logoLight: "/images/logo-light.svg",
    logoMark: "/images/logo-mark.svg",
    faviconSvg: "/images/favicon.svg",
    appleTouchIcon: "/images/favicon.svg",
    ogImage: "/images/og-image.svg",
    heroStudyDesk: "/images/hero-study-desk.svg",
    assessmentReport: "/images/assessment-report.svg",
    progressDashboard: "/images/progress-dashboard.svg",
    googleClassroom: "/images/google-classroom.svg",
    scienceIcons: "/images/science-icons.svg",
    bridgeBlueprint: "/images/bridge-blueprint.svg",
    learningPath: "/images/learning-path.svg",
    reportCover: "/images/report-cover.svg",
    revisionNotebook: "/images/revision-notebook.svg",
    physicsTools: "/images/science-icons.svg",
    chemistryTools: "/images/science-icons.svg",
    biologyStudy: "/images/science-icons.svg",
    consultancy: "/images/consultancy.svg",
    workspace: "/images/workspace.svg"
  }
} as const;

export const headerNavigation = [
  { label: "Home", href: "/" }
] as const;

export const scienceNavigation = [
  { label: "GCSE Biology", href: "/gcse-biology" },
  { label: "GCSE Chemistry", href: "/gcse-chemistry" },
  { label: "GCSE Physics", href: "/gcse-physics" },
  { label: "Combined Science", href: "/combined-science" }
] as const;

export const mathsNavigation = [
  { label: "GCSE Maths", href: "/gcse-maths" },
  { label: "Functional Skills Maths", href: "/functional-skills-maths" }
] as const;

export const languageNavigation = [
  { label: "French", href: "/french" }
] as const;

export const courseNavigation = [
  {
    label: "Science",
    items: scienceNavigation
  },
  {
    label: "Maths",
    items: mathsNavigation
  },
  {
    label: "Languages",
    items: languageNavigation
  }
] as const;

export const portalNavigation = [
  { label: "Parent Portal", href: "/parent-portal" },
  { label: "Tutor Login", href: "/tutor" },
  { label: "Student Hub", href: "/student-hub" }
] as const;

export const footerQuickLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
  { label: "Request a Callback", href: site.callbackHref },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" }
] as const;

export const footerPortalLinks = [
  { label: "Parent Portal", href: "/parent-portal" },
  { label: "Tutor Login", href: "/tutor" },
  { label: "Student Hub", href: "/student-hub" },
  { label: "Book Assessment", href: site.assessmentHref }
] as const;

export const footerServiceLinks = [
  { label: "Science Tuition", href: "/gcse-biology" },
  { label: "Maths Tuition", href: "/gcse-maths" },
  { label: "French Tuition", href: "/french" },
  { label: "Educational Consultancy", href: "/educational-consultancy" }
] as const;

export const heroMetrics = [
  {
    value: "Free assessment",
    label: "Assessment-first onboarding so families get a clear recommendation before committing."
  },
  {
    value: "Parent portal",
    label: "Parent reporting after lessons, assessments and targets in one calm place."
  },
  {
    value: "Weekly support",
    label: "Google Classroom delivery, homework, revision guidance and steady progress feedback."
  }
] as const;

export const heroSupportPoints = [
  "Science specialists with Cambridge training",
  "Free assessment before lessons begin",
  "Parent reporting built into the service"
] as const;

export const parentReasons = [
  {
    title: "Specialist science tuition",
    body: "Focused support across GCSE Biology, Chemistry, Physics and Combined Science with teaching that respects the specification and the student."
  },
  {
    title: "Academic credibility",
    body: "FlyBridge was founded by two science educators with Cambridge teacher training, giving families confidence in the thinking behind each lesson."
  },
  {
    title: "Clear progress systems",
    body: "Homework, lesson notes, revision resources and feedback are organised so parents can see steady forward movement rather than guesswork."
  },
  {
    title: "Personalised support",
    body: "Students receive a structured plan shaped by their current performance, target grades, confidence level and exam timeline."
  }
] as const;

export const tutorHighlights = [
  {
    title: "Built by educators",
    body: "FlyBridge was founded by Mr Mubarak and his mother, both science education specialists with teacher training from the University of Cambridge."
  },
  {
    title: "Research-informed teaching",
    body: "Mr Mubarak later completed a Master of Education at Cambridge, helping shape a clear, evidence-aware approach to lesson design and communication."
  },
  {
    title: "Carefully selected tutors",
    body: "As FlyBridge grows, it works with experienced teachers across the country so more families can access structured, supportive subject teaching."
  }
] as const;

export const flybridgeMethod = [
  {
    title: "Diagnose the gap",
    body: "The free assessment identifies current strengths, confidence gaps and the subjects or skills most likely to unlock progress."
  },
  {
    title: "Build the plan",
    body: "A tailored lesson pathway is created around the student's year group, exam board, target grade and available study time."
  },
  {
    title: "Teach with structure",
    body: "Lessons combine direct teaching, retrieval practice, exam-style questions and careful modelling so understanding turns into performance."
  },
  {
    title: "Track and adjust",
    body: "Progress is reviewed regularly so support stays sharp, targeted and relevant as exams approach."
  }
] as const;

export const lessonFlow = [
  {
    title: "Free assessment",
    body: "A friendly first conversation explores current grades, goals, confidence and any topics that feel difficult or inconsistent."
  },
  {
    title: "Personal plan",
    body: "Parents receive a clear recommendation for lesson format, pacing and the most valuable areas to tackle first."
  },
  {
    title: "Live online tuition",
    body: "Weekly lessons are delivered online with guided teaching, worked examples, active questioning and exam-focused practice."
  },
  {
    title: "Homework and revision",
    body: "Follow-up tasks keep knowledge active between lessons and help students build habits that stick."
  },
  {
    title: "Progress reviews",
    body: "Parents can see what has been covered, what is improving and where the next layer of focus should be."
  }
] as const;

export const progressTracking = [
  "Google Classroom resources organised by topic",
  "Weekly homework with clear expectations",
  "Targeted feedback after lessons and tasks",
  "Revision guidance matched to exam timelines",
  "Ongoing refinement of weak areas and exam technique",
  "A calmer, more confident approach to science study"
] as const;

export const parentPortalFeatures = [
  "Lesson summaries after every session",
  "Strengths and confidence gains spotted in the lesson",
  "Homework and revision priorities",
  "Assessment scores and checkpoint trends",
  "Current targets and what success looks like",
  "Clear next steps so parents know where support is heading"
] as const;

export const platformSplit = [
  {
    title: "Google Classroom for learning",
    body: "Resources, homework, revision files and lesson materials are organised inside Google Classroom so students always know where to work."
  },
  {
    title: "FlyBridge Portal for parent updates",
    body: "Parents get a calmer reporting view focused on lesson summaries, strengths, homework, targets and assessment progress without needing to chase for updates."
  }
] as const;

export const assessmentFeatures = [
  "Discuss current grades, confidence and priorities",
  "Identify topic gaps and exam technique issues",
  "Recommend the right lesson format and pace",
  "Outline next steps with no pressure to commit immediately"
] as const;

export const pricingFeatures = [
  "Free assessment before any lesson is booked",
  "Online delivery with flexible scheduling options",
  "One-to-one or small-group recommendations where suitable",
  "Homework, revision resources and lesson follow-up included"
] as const;

export const aboutSections = [
  {
    title: "Experienced teaching",
    body: "Lessons are shaped by classroom experience as well as subject knowledge, so support stays practical, calm and clearly explained."
  },
  {
    title: "Clear parent communication",
    body: "Families should never feel unsure about what is being covered, how the student is doing or what the next step should be."
  },
  {
    title: "Structured progress tracking",
    body: "Reporting, checkpoints and targets are organised so progress is easier to notice and easier to act on."
  },
  {
    title: "Carefully selected tutors",
    body: "FlyBridge works with experienced educators across subject areas, choosing people who can teach clearly and communicate well with families."
  },
  {
    title: "Qualifications",
    body: "Mr Mubarak completed both a PGCE and a Master of Education at the University of Cambridge, while his mother also completed her PGCE there."
  },
  {
    title: "Mission",
    body: "FlyBridge exists to help students bridge the gap between where they are now and the confidence, understanding and outcomes they are capable of reaching."
  }
] as const;

export const consultancyServices = [
  {
    title: "Study skills",
    body: "Support with concentration, note-making, retrieval practice and independent study habits that actually work."
  },
  {
    title: "Revision planning",
    body: "Practical revision structures for busy students who need a realistic system rather than a vague checklist."
  },
  {
    title: "University guidance",
    body: "Thoughtful academic guidance for students planning longer-term pathways and wanting clarity on next steps."
  },
  {
    title: "School transition",
    body: "Support through periods of change, including moving schools, stepping into GCSE years or regaining momentum after disruption."
  },
  {
    title: "Academic mentoring",
    body: "A broader layer of accountability and encouragement for students who need help with consistency, direction and confidence."
  }
] as const;

export const examBoards = ["AQA", "Edexcel", "OCR", "WJEC / Eduqas"] as const;

export const subjectPages = [
  {
    name: "Biology",
    slug: "gcse-biology",
    navLabel: "GCSE Biology",
    summary:
      "Biology tuition focused on understanding key systems, applying knowledge clearly and answering longer questions with precision.",
    hero:
      "Build stronger recall, sharper exam answers and real confidence across the GCSE Biology course.",
    image: site.images.biologyStudy,
    imageAlt: "A focused GCSE Biology study setup with notes and science materials.",
    coverage: [
      "Cell biology, organisation and infection",
      "Bioenergetics, homeostasis and response",
      "Inheritance, variation and evolution",
      "Ecology, required practicals and extended-response questions"
    ],
    structure: [
      "Topic teaching with diagrams and carefully sequenced explanations",
      "Retrieval practice to strengthen long-term memory",
      "Exam question modelling and mark scheme language",
      "Homework that reinforces weak areas without overload"
    ]
  },
  {
    name: "Chemistry",
    slug: "gcse-chemistry",
    navLabel: "GCSE Chemistry",
    summary:
      "Chemistry tuition that turns confusing topics into structured, manageable steps, especially for calculations and multi-stage ideas.",
    hero:
      "Gain clarity in chemistry with lessons that make difficult concepts feel teachable, logical and exam-ready.",
    image: site.images.chemistryTools,
    imageAlt: "Chemistry study tools arranged neatly on a desk for GCSE revision.",
    coverage: [
      "Atomic structure, bonding and the periodic table",
      "Quantitative chemistry and chemical changes",
      "Energy changes, rates and equilibrium",
      "Organic chemistry, analysis and required practicals"
    ],
    structure: [
      "Step-by-step teaching for equations, calculations and particle models",
      "Guided practice before independent exam questions",
      "Topic summaries that reduce cognitive overload",
      "Targeted homework to improve accuracy and fluency"
    ]
  },
  {
    name: "Physics",
    slug: "gcse-physics",
    navLabel: "GCSE Physics",
    summary:
      "Physics tuition for students who need stronger problem solving, better formula confidence and clearer conceptual understanding.",
    hero:
      "Develop a calmer, stronger approach to GCSE Physics with structured support for both maths and concepts.",
    image: site.images.physicsTools,
    imageAlt: "Physics revision tools and stationery laid out for focused study.",
    coverage: [
      "Energy, electricity and particle models",
      "Atomic structure, forces and motion",
      "Waves, magnetism and electromagnetism",
      "Space physics, required practicals and applied calculations"
    ],
    structure: [
      "Clear modelling of formulas, units and multistep calculations",
      "Concept teaching that links maths with physical meaning",
      "Exam practice for data, graphs and explanation questions",
      "Homework designed to build accuracy and confidence"
    ]
  },
  {
    name: "Combined Science",
    slug: "combined-science",
    navLabel: "Combined Science",
    summary:
      "Joined-up support across Biology, Chemistry and Physics for students studying Combined Science and needing coherent, balanced guidance.",
    hero:
      "Get structured support across the full Combined Science course without losing clarity between subjects.",
    image: site.images.scienceIcons,
    imageAlt: "A premium science-themed study image representing Combined Science support.",
    coverage: [
      "Core Biology, Chemistry and Physics topics across the combined specification",
      "Topic prioritisation based on the student's strongest and weakest areas",
      "Required practicals and blended exam practice",
      "Revision support built for students balancing multiple science demands"
    ],
    structure: [
      "Balanced weekly coverage across the most valuable topics",
      "Focused revision planning that prevents students from spreading too thinly",
      "Exam practice that strengthens both recall and application",
      "Homework and feedback organised clearly through Google Classroom"
    ]
  }
] as const;

export const expansionSubjectPages = [
  {
    name: "GCSE Maths",
    slug: "gcse-maths",
    eyebrow: "Maths Tuition",
    navLabel: "GCSE Maths",
    summary:
      "Premium GCSE Maths tuition from FlyBridge Education, with clear explanations, steady confidence-building and structured parent communication.",
    heroTitle: "GCSE Maths support with the same calm structure and parent clarity as the wider FlyBridge experience.",
    heroBody:
      "FlyBridge maths support is designed for families who want organised teaching, careful explanation and a premium experience that keeps both students and parents confident about the next step.",
    image: site.images.workspace,
    imageAlt: "A refined study workspace representing structured GCSE Maths tuition.",
    imageBadge: "Clear, structured maths support",
    coverageHeading: "What maths support focuses on",
    coverageBody:
      "Lessons are shaped around the student's current working level, but support often centres on the patterns that most affect GCSE Maths confidence and marks.",
    coverage: [
      "Number fluency, algebra and proportional reasoning",
      "Geometry, graphs, statistics and calculator confidence",
      "Problem solving with clear method-building rather than guesswork",
      "Exam technique for showing working accurately and staying calm under time pressure"
    ],
    structureHeading: "How lessons are structured",
    structureBody:
      "The aim is to make maths feel more manageable, more logical and more consistent from one week to the next.",
    structure: [
      "Step-by-step modelling before independent practice",
      "Targeted question sequences that build confidence gradually",
      "Homework and revision follow-up through a clear weekly rhythm",
      "Parent-facing updates that explain what is improving and what still needs attention"
    ],
    boardsHeading: "Suitable for",
    boardsBody:
      "GCSE Maths support is intended for students who need stronger foundations, cleaner working and greater confidence across the course.",
    boards: ["Foundation and Higher pathways", "AQA, Edexcel and OCR-style specifications", "Students needing both method and confidence support", "Families wanting steady communication, not last-minute surprises"],
    ctaTitle: "Enquire about GCSE Maths support",
    ctaBody:
      "If maths support would be valuable for your family, the best next step is still a free assessment or callback so FlyBridge can understand the student's current position properly."
  },
  {
    name: "Functional Skills Maths",
    slug: "functional-skills-maths",
    eyebrow: "Maths Support",
    navLabel: "Functional Skills Maths",
    summary:
      "Functional Skills Maths support from FlyBridge Education, designed to feel practical, encouraging and well organised.",
    heroTitle: "Functional Skills Maths support built around clarity, practicality and steady progress.",
    heroBody:
      "For students and adult learners alike, Functional Skills support should feel direct and useful. FlyBridge focuses on practical understanding, confidence and consistent follow-through.",
    image: site.images.reportCover,
    imageAlt: "A premium study materials image representing Functional Skills Maths support.",
    imageBadge: "Practical, confidence-building support",
    coverageHeading: "What the support covers",
    coverageBody:
      "Sessions are built to strengthen the real-world maths skills and exam confidence most often needed for Functional Skills success.",
    coverage: [
      "Number, fractions, percentages and ratio in practical contexts",
      "Measures, money, data handling and interpretation",
      "Multi-step questions broken down into manageable decisions",
      "Confidence-building practice for learners returning to maths after a difficult experience"
    ],
    structureHeading: "How sessions are delivered",
    structureBody:
      "Teaching is designed to be supportive without becoming vague, so learners know exactly what they are working on and why it matters.",
    structure: [
      "Clear teaching with everyday examples before formal question practice",
      "Short, focused exercises that prioritise useful progress over overload",
      "Steady repetition of key methods so skills begin to stick",
      "Simple reporting and next-step guidance so progress stays visible"
    ],
    boardsHeading: "A strong fit for",
    boardsBody:
      "Functional Skills support is especially valuable for learners who need maths to feel calmer, more approachable and easier to apply.",
    boards: ["Students resitting essential maths skills", "Learners preparing for Functional Skills assessments", "Families wanting practical support without unnecessary pressure", "Anyone who benefits from a slower, more confidence-led teaching pace"],
    ctaTitle: "Talk through Functional Skills Maths support",
    ctaBody:
      "A short conversation is the easiest way to understand whether Functional Skills support is the right fit and what kind of lesson structure would help most."
  },
  {
    name: "French Tuition",
    slug: "french",
    eyebrow: "Languages",
    navLabel: "French Tuition",
    summary:
      "Premium French tuition from FlyBridge Education, with structured support for vocabulary, grammar, confidence and exam performance.",
    heroTitle: "French support that feels organised, encouraging and carefully structured.",
    heroBody:
      "FlyBridge French support is designed for students who need stronger routine, clearer explanations and more confidence across vocabulary, grammar, writing and speaking.",
    image: site.images.bridgeBlueprint,
    imageAlt: "A refined brand image representing premium French tuition.",
    imageBadge: "Calm, structured language support",
    coverageHeading: "What French tuition can focus on",
    coverageBody:
      "Support is adapted to the student, but lessons commonly centre on the language patterns and exam skills that unlock greater consistency.",
    coverage: [
      "Vocabulary building with better retention strategies",
      "Grammar explained clearly so students can use it with more confidence",
      "Reading, listening and translation practice with guided support",
      "Writing and speaking preparation that reduces hesitation and builds fluency"
    ],
    structureHeading: "How the tuition feels",
    structureBody:
      "The goal is to make language learning feel more navigable, so students are not simply memorising but actually gaining control over how they respond.",
    structure: [
      "Regular retrieval of vocabulary and core structures",
      "Careful correction that improves accuracy without knocking confidence",
      "Exam-style practice that becomes more independent over time",
      "Clear weekly follow-up so students know what to revisit between lessons"
    ],
    boardsHeading: "Well suited to",
    boardsBody:
      "French support is a good fit for students who want a calmer route to stronger performance across both classroom work and exam preparation.",
    boards: ["GCSE French learners needing more confidence", "Students who struggle to retain vocabulary consistently", "Families wanting clearer communication around progress", "Students who benefit from patient, structured explanation"],
    ctaTitle: "Enquire about French tuition",
    ctaBody:
      "If French support would help your child feel more confident and consistent, FlyBridge can talk through the best starting point and likely lesson format."
  }
] as const;

export const faqs = [
  {
    question: "How are lessons delivered?",
    answer:
      "Lessons are delivered online in a live, structured format. Students receive guided teaching, active questioning, exam-style practice and clear follow-up tasks."
  },
  {
    question: "Who is FlyBridge best suited for?",
    answer:
      "FlyBridge is designed for students who want focused GCSE science support, especially those aiming to improve confidence, consistency and top-end exam performance."
  },
  {
    question: "What happens during the free assessment?",
    answer:
      "The assessment explores current grades, target grades, confidence, topics causing difficulty and the kind of support that would be most effective. Parents leave with a clearer sense of the next step."
  },
  {
    question: "Do students receive homework?",
    answer:
      "Yes. Homework and revision tasks are used to reinforce lesson content, improve retention and create steady progress between sessions."
  },
  {
    question: "Can lessons be one-to-one?",
    answer:
      "Yes, subject to availability and suitability. One-to-one and small-group options can both be discussed during the assessment."
  },
  {
    question: "How does Google Classroom work?",
    answer:
      "Google Classroom acts as the student hub for lesson resources, homework, revision materials, announcements and feedback so everything stays organised in one place."
  },
  {
    question: "What exam boards are supported?",
    answer:
      "Support is available for the main UK GCSE science exam boards, including AQA, Edexcel, OCR and WJEC / Eduqas where relevant to the student."
  },
  {
    question: "How much does tuition cost?",
    answer:
      "Tuition starts from £20 per hour. Final fees depend on year group, format, level of support needed and current availability."
  }
] as const;
