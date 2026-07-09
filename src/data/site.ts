export const site = {
  name: "FlyBridge Education",
  shortName: "FlyBridge",
  tagline: "Helping students bridge the gap to GCSE success.",
  description:
    "Cambridge-trained GCSE Science tuition for ambitious students aiming for Grades 7-9 through engaging online lessons, structured progress tracking and personalised support.",
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
    logoDark: "/images/logo-dark.svg",
    logoLight: "/images/logo-light.svg",
    logoMark: "/images/logo-mark.svg",
    faviconSvg: "/images/favicon.svg",
    favicon32: "/images/favicon-32.png",
    favicon16: "/images/favicon-16.png",
    appleTouchIcon: "/images/apple-touch-icon.png",
    ogImage: "/images/og-image.png",
    heroStudyDesk: "/images/hero-study-desk.webp",
    assessmentReport: "/images/assessment-report.webp",
    progressDashboard: "/images/progress-dashboard.webp",
    googleClassroom: "/images/google-classroom.webp",
    scienceIcons: "/images/science-icons.webp",
    bridgeBlueprint: "/images/bridge-blueprint.webp",
    learningPath: "/images/learning-path.webp",
    reportCover: "/images/report-cover.webp",
    revisionNotebook: "/images/revision-notebook.webp",
    physicsTools: "/images/physics-tools.webp",
    chemistryTools: "/images/chemistry-tools.webp",
    biologyStudy: "/images/biology-study.webp",
    consultancy: "/images/consultancy.webp",
    workspace: "/images/workspace.webp"
  }
} as const;

export const mainNavigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Educational Consultancy", href: "/educational-consultancy" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" }
] as const;

export const subjectNavigation = [
  { label: "GCSE Biology", href: "/gcse-biology" },
  { label: "GCSE Chemistry", href: "/gcse-chemistry" },
  { label: "GCSE Physics", href: "/gcse-physics" },
  { label: "Combined Science", href: "/combined-science" }
] as const;

export const footerQuickLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Educational Consultancy", href: "/educational-consultancy" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" }
] as const;

export const footerSupportLinks = [
  { label: "Book Assessment", href: site.assessmentHref },
  { label: "Request a Callback", href: site.callbackHref },
  { label: "Student Hub", href: "/student-hub" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" }
] as const;

export const heroMetrics = [
  {
    value: "Cambridge",
    label: "Academic training paired with calm, structured GCSE teaching."
  },
  {
    value: "7-9",
    label: "A clear pathway for students aiming to push into top grades."
  },
  {
    value: "Weekly",
    label: "Ongoing homework, revision guidance and progress feedback."
  }
] as const;

export const parentReasons = [
  {
    title: "Specialist science tuition",
    body: "Focused support across GCSE Biology, Chemistry, Physics and Combined Science with teaching that respects the specification and the student."
  },
  {
    title: "Academic credibility",
    body: "Cambridge-trained expertise gives parents confidence that lessons are rigorous, thoughtful and built around long-term understanding."
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
    title: "Cambridge training",
    body: "A strong academic foundation that supports precise explanations, high standards and thoughtful lesson design."
  },
  {
    title: "GCSE science focus",
    body: "Sessions are built around the specific challenges students face in science: recall, application, calculations, extended responses and exam technique."
  },
  {
    title: "Supportive teaching style",
    body: "Students are challenged without feeling overwhelmed, with patient explanations and a clear path through difficult topics."
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

export const testimonials = [
  {
    quote:
      "Placeholder testimonial: we wanted someone academically strong but also patient enough to build confidence. FlyBridge gave us both.",
    name: "Parent of a Year 10 student"
  },
  {
    quote:
      "Placeholder testimonial: the lessons feel organised, calm and high quality. My daughter finally understands how to answer science questions properly.",
    name: "Parent of a Year 11 student"
  },
  {
    quote:
      "Placeholder testimonial: the progress tracking and Google Classroom setup made it much easier for us to stay involved without hovering.",
    name: "Parent of a Combined Science student"
  }
] as const;

export const aboutSections = [
  {
    title: "Cambridge training",
    body: "FlyBridge is grounded in strong academic training, bringing clarity, rigour and careful thinking to every lesson."
  },
  {
    title: "Teaching philosophy",
    body: "The goal is not just to cover content, but to build understanding, confidence and the ability to perform under exam conditions."
  },
  {
    title: "Experience",
    body: "Support is designed around the patterns seen again and again in GCSE science: uneven topic knowledge, weak exam technique and fragile confidence."
  },
  {
    title: "Personal approach",
    body: "Students respond best when teaching feels structured, calm and encouraging. FlyBridge combines high standards with a supportive tone."
  },
  {
    title: "Qualifications",
    body: "Lessons reflect a premium, academically informed approach with careful attention to curriculum demands and learning progression."
  },
  {
    title: "Mission",
    body: "FlyBridge exists to help students bridge the gap between where they are now and the grades they are capable of achieving."
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
