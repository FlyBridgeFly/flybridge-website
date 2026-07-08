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
  classroomHref: "https://classroom.google.com"
} as const;

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/#courses" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Student Hub", href: "/student-hub" }
] as const;

export const trustItems = [
  "Cambridge-trained teacher",
  "GCSE specialist",
  "Google Classroom learning",
  "Small class sizes",
  "Weekly homework",
  "Progress tracking"
] as const;

export const steps = [
  {
    title: "Book a Free Assessment",
    body: "Start with a friendly consultation so we can understand your goals, confidence level and exam timeline."
  },
  {
    title: "Receive a personalised learning plan",
    body: "Each student gets a focused plan built around their strengths, gaps and target grades."
  },
  {
    title: "Join your Google Classroom",
    body: "Access lesson links, revision resources, homework and feedback in one organised learning space."
  },
  {
    title: "Weekly live lessons",
    body: "Attend structured online sessions designed to build understanding, confidence and exam fluency."
  },
  {
    title: "Track your progress",
    body: "Stay accountable with progress reviews, targeted feedback and measurable next steps."
  }
] as const;

export const subjects = [
  {
    name: "Biology",
    summary: "Master core topics with visually clear explanations, retrieval practice and high-yield exam training."
  },
  {
    name: "Chemistry",
    summary: "Build confidence in equations, calculations and tricky concepts through structured, step-by-step teaching."
  },
  {
    name: "Physics",
    summary: "Strengthen problem solving, mathematical reasoning and conceptual understanding with calm, precise guidance."
  },
  {
    name: "Combined Science",
    summary: "Get joined-up support across the full GCSE specification with a plan tailored to mixed strengths and gaps."
  }
] as const;

export const flybridgeHighlights = [
  "Cambridge-trained teacher",
  "Structured lessons",
  "Exam technique",
  "Interactive quizzes",
  "Homework",
  "Revision resources",
  "Personal feedback"
] as const;

export const faqs = [
  {
    question: "How are lessons delivered?",
    answer:
      "Lessons are delivered online in a structured, live format with guided teaching, active participation and clear follow-up tasks."
  },
  {
    question: "Do students receive homework?",
    answer:
      "Yes. Weekly homework and revision tasks reinforce lesson content, improve retention and keep progress moving between sessions."
  },
  {
    question: "Can lessons be one-to-one?",
    answer:
      "Yes, depending on availability and the support level required. Small-group and one-to-one formats can both be discussed during the assessment."
  },
  {
    question: "How does Google Classroom work?",
    answer:
      "Google Classroom acts as the student learning hub for lesson materials, homework, revision resources, announcements and feedback."
  },
  {
    question: "What exam boards are supported?",
    answer:
      "Lessons are designed around the major UK GCSE science exam boards, with teaching adapted to the student's specification where needed."
  }
] as const;
