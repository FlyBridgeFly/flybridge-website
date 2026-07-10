export type KeyStage = "KS2" | "KS3" | "KS4" | "KS5";

export interface CurriculumModule {
  title: string;
  summary: string;
}

export interface CurriculumPaper {
  title: string;
  summary?: string;
  modules: readonly CurriculumModule[];
}

export interface CurriculumBoard {
  name: string;
  qualification: string;
  specificationCode?: string;
  assessmentSummary: string;
  officialUrl: string;
  papers: readonly CurriculumPaper[];
}

export interface CurriculumGroup {
  title: string;
  summary: string;
  modules: readonly CurriculumModule[];
}

export interface CurriculumPage {
  slug: string;
  keyStage: KeyStage;
  subject: string;
  pageTitle: string;
  navLabel: string;
  summary: string;
  trustLine: string;
  qualificationLine: string;
  mode: "boards" | "curriculum";
  boards?: readonly CurriculumBoard[];
  curriculumGroups?: readonly CurriculumGroup[];
  officialUrl?: string;
}

export interface KeyStageLanding {
  slug: string;
  keyStage: KeyStage;
  title: string;
  summary: string;
  subjects: readonly {
    label: string;
    href: string;
    note: string;
  }[];
  coreOffer?: readonly string[];
}

// Curriculum module names must be checked against current official awarding body specifications before future updates.
export const curriculumPages = [
  {
    slug: "ks2-english",
    keyStage: "KS2",
    subject: "English",
    pageTitle: "KS2 English",
    navLabel: "English",
    summary: "KS2 English tuition focused on reading, writing, grammar and confident communication through the English National Curriculum.",
    trustLine: "FlyBridge support is delivered by qualified teachers who understand how to build literacy securely and systematically.",
    qualificationLine: "English National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study",
    curriculumGroups: [
      {
        title: "Reading",
        summary: "Developing fluency, comprehension and vocabulary through fiction, non-fiction and poetry.",
        modules: [
          { title: "Word reading", summary: "Accurate decoding, fluency and growing automaticity across age-appropriate texts." },
          { title: "Comprehension", summary: "Inference, retrieval and explanation built through discussion and close reading." },
          { title: "Vocabulary", summary: "Understanding new language in context and using it more precisely in speech and writing." }
        ]
      },
      {
        title: "Writing",
        summary: "Planning, drafting and editing so written work becomes clearer, more accurate and more purposeful.",
        modules: [
          { title: "Composition", summary: "Organising ideas for narrative, descriptive and non-fiction writing tasks." },
          { title: "Grammar and punctuation", summary: "Using sentence control, tense and punctuation with increasing consistency." },
          { title: "Spelling and handwriting", summary: "Securing common patterns and presentation habits that support confidence." }
        ]
      }
    ]
  },
  {
    slug: "ks2-maths",
    keyStage: "KS2",
    subject: "Maths",
    pageTitle: "KS2 Maths",
    navLabel: "Maths",
    summary: "KS2 Maths tuition organised around number fluency, reasoning and problem solving within the primary curriculum.",
    trustLine: "FlyBridge maths teaching is led by qualified teachers who combine clear modelling with steady guided practice.",
    qualificationLine: "English National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study",
    curriculumGroups: [
      {
        title: "Number",
        summary: "Securing arithmetic, place value and fractions so pupils can work with accuracy and confidence.",
        modules: [
          { title: "Place value", summary: "Reading, ordering and manipulating whole numbers with confidence." },
          { title: "Calculation", summary: "Using written and mental methods accurately across all four operations." },
          { title: "Fractions, decimals and percentages", summary: "Connecting representations and solving practical number problems." }
        ]
      },
      {
        title: "Reasoning and problem solving",
        summary: "Applying number knowledge to multistep questions rather than relying on isolated methods.",
        modules: [
          { title: "Measurement", summary: "Working with time, money, length, mass and capacity in context." },
          { title: "Geometry", summary: "Recognising properties, angle relationships and spatial reasoning." },
          { title: "Statistics", summary: "Reading tables, charts and simple data sets with growing independence." }
        ]
      }
    ]
  },
  {
    slug: "ks2-science",
    keyStage: "KS2",
    subject: "Science",
    pageTitle: "KS2 Science",
    navLabel: "Science",
    summary: "KS2 Science tuition focused on secure scientific knowledge, vocabulary and working scientifically through the primary curriculum.",
    trustLine: "FlyBridge science support is built around qualified teaching, practical explanation and careful misconception diagnosis.",
    qualificationLine: "English National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study",
    curriculumGroups: [
      {
        title: "Scientific knowledge",
        summary: "Building secure understanding across the main primary science areas before content becomes more abstract at KS3.",
        modules: [
          { title: "Biology topics", summary: "Living things, habitats, plants, animals including humans and evolution at an age-appropriate level." },
          { title: "Chemistry topics", summary: "Everyday materials, their properties and how materials can change." },
          { title: "Physics topics", summary: "Forces, light, sound, electricity and Earth and space taught through clear models." }
        ]
      },
      {
        title: "Working scientifically",
        summary: "Learning how to observe, compare, test and explain rather than simply memorise facts.",
        modules: [
          { title: "Observing and classifying", summary: "Using evidence carefully and choosing appropriate ways to group findings." },
          { title: "Planning simple enquiries", summary: "Making predictions, spotting variables and recording results clearly." },
          { title: "Explaining results", summary: "Using scientific vocabulary to discuss patterns and conclusions." }
        ]
      }
    ]
  },
  {
    slug: "ks2-french",
    keyStage: "KS2",
    subject: "French",
    pageTitle: "KS2 French",
    navLabel: "French",
    summary: "KS2 French tuition that introduces vocabulary, pronunciation and simple sentence-building in a structured way.",
    trustLine: "FlyBridge language teaching is delivered by qualified teachers who build confidence gradually through repetition and use.",
    qualificationLine: "English National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-languages-programmes-of-study",
    curriculumGroups: [
      {
        title: "Speaking and listening",
        summary: "Developing pronunciation, short responses and confidence using familiar vocabulary.",
        modules: [
          { title: "Phonics and pronunciation", summary: "Recognising common sound patterns and saying words more accurately." },
          { title: "Simple interaction", summary: "Answering questions, giving preferences and using short spoken phrases." }
        ]
      },
      {
        title: "Reading and writing",
        summary: "Using familiar words and simple grammar patterns to understand and produce short language.",
        modules: [
          { title: "Core vocabulary", summary: "Building topic vocabulary around self, family, school and everyday routines." },
          { title: "Simple sentence building", summary: "Combining familiar verbs and nouns to express meaning clearly." }
        ]
      }
    ]
  },
  {
    slug: "ks3-english",
    keyStage: "KS3",
    subject: "English",
    pageTitle: "KS3 English",
    navLabel: "English",
    summary: "KS3 English tuition focused on reading analysis, writing control and vocabulary growth through the secondary curriculum.",
    trustLine: "FlyBridge English support is delivered by qualified teachers who know how to move pupils from surface understanding to stronger analysis.",
    qualificationLine: "English National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study",
    curriculumGroups: [
      {
        title: "Reading",
        summary: "Working with increasingly demanding fiction, non-fiction and literary non-fiction texts.",
        modules: [
          { title: "Inference and interpretation", summary: "Explaining ideas, methods and evidence with greater precision." },
          { title: "Authorial craft", summary: "Commenting on language, structure and viewpoint in a more organised way." },
          { title: "Vocabulary development", summary: "Strengthening subject terminology and wider word knowledge through reading." }
        ]
      },
      {
        title: "Writing",
        summary: "Improving control, structure and style across analytical, transactional and creative writing.",
        modules: [
          { title: "Sentence control", summary: "Writing with greater variety, accuracy and awareness of effect." },
          { title: "Organisation", summary: "Shaping ideas into coherent paragraphs and whole responses." },
          { title: "Grammar and accuracy", summary: "Reducing avoidable errors while making expression more deliberate." }
        ]
      }
    ]
  },
  {
    slug: "ks3-maths",
    keyStage: "KS3",
    subject: "Maths",
    pageTitle: "KS3 Maths",
    navLabel: "Maths",
    summary: "KS3 Maths tuition that builds fluency, reasoning and algebraic confidence before GCSE content begins to accelerate.",
    trustLine: "FlyBridge maths teaching combines qualified classroom practice with clear modelling and carefully paced practice.",
    qualificationLine: "Mathematics National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study",
    curriculumGroups: [
      {
        title: "Number and proportional reasoning",
        summary: "Strengthening the numerical foundations that support later GCSE fluency and problem solving.",
        modules: [
          { title: "Integers, fractions and decimals", summary: "Working confidently with positive and negative numbers across varied contexts." },
          { title: "Ratio and proportion", summary: "Recognising multiplicative relationships and applying them accurately." }
        ]
      },
      {
        title: "Algebra, geometry and statistics",
        summary: "Making abstract ideas more manageable through worked examples, structure and repetition.",
        modules: [
          { title: "Algebra", summary: "Using notation, substitution, simplification and equations with more confidence." },
          { title: "Geometry and measures", summary: "Reasoning with angles, shapes and units more precisely." },
          { title: "Probability and statistics", summary: "Interpreting data and likelihood using clear mathematical language." }
        ]
      }
    ]
  },
  {
    slug: "ks3-science",
    keyStage: "KS3",
    subject: "Science",
    pageTitle: "KS3 Science",
    navLabel: "Science",
    summary: "KS3 Science tuition organised around Biology, Chemistry, Physics and working scientifically so pupils are ready for GCSE study.",
    trustLine: "FlyBridge science tuition is delivered by qualified teachers who understand how misconceptions build before GCSE science becomes more demanding.",
    qualificationLine: "Science National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study",
    curriculumGroups: [
      {
        title: "Biology",
        summary: "Building secure understanding of cells, organisms, reproduction and ecosystems.",
        modules: [
          { title: "Cells and organisation", summary: "Moving from simple cell knowledge into tissues, organs and body systems." },
          { title: "Reproduction and health", summary: "Understanding growth, variation and basic health science clearly." },
          { title: "Ecosystems", summary: "Explaining interdependence, food webs and environmental change." }
        ]
      },
      {
        title: "Chemistry",
        summary: "Making particle models, reactions and materials more coherent before GCSE chemistry begins.",
        modules: [
          { title: "Particles and states", summary: "Using particle ideas to explain changes of state and physical behaviour." },
          { title: "Atoms, elements and compounds", summary: "Distinguishing substances and representing them more clearly." },
          { title: "Reactions", summary: "Describing chemical change, acids and alkalis with correct vocabulary." }
        ]
      },
      {
        title: "Physics",
        summary: "Connecting forces, energy, electricity and waves through clear explanation and application.",
        modules: [
          { title: "Forces and motion", summary: "Using everyday examples to explain balanced forces, pressure and speed." },
          { title: "Energy", summary: "Tracking stores, transfers and efficiency more securely." },
          { title: "Electricity, light and sound", summary: "Building strong models for circuits, waves and their effects." }
        ]
      },
      {
        title: "Working scientifically",
        summary: "Using planning, evidence and evaluation more deliberately across the subject.",
        modules: [
          { title: "Experimental design", summary: "Recognising variables, methods and sources of error more clearly." },
          { title: "Data and conclusions", summary: "Interpreting results and justifying conclusions using evidence." }
        ]
      }
    ]
  },
  {
    slug: "ks3-french",
    keyStage: "KS3",
    subject: "French",
    pageTitle: "KS3 French",
    navLabel: "French",
    summary: "KS3 French tuition that develops vocabulary, grammar and sentence-building before GCSE work begins.",
    trustLine: "FlyBridge language support is delivered by qualified teachers who help pupils move from memorising words to using them confidently.",
    qualificationLine: "Languages National Curriculum",
    mode: "curriculum",
    officialUrl: "https://www.gov.uk/government/publications/national-curriculum-in-england-languages-programmes-of-study",
    curriculumGroups: [
      {
        title: "Vocabulary and phonics",
        summary: "Strengthening pronunciation and retention so pupils can access new content more confidently.",
        modules: [
          { title: "Core phonics", summary: "Recognising common French sound patterns and applying them more reliably." },
          { title: "Topic vocabulary", summary: "Building usable vocabulary around identity, school, leisure and daily life." }
        ]
      },
      {
        title: "Grammar and communication",
        summary: "Using familiar verbs and structures to read, write, speak and respond more independently.",
        modules: [
          { title: "Sentence building", summary: "Moving from single words to short accurate sentences and opinions." },
          { title: "Translation and comprehension", summary: "Understanding short texts and expressing meaning more clearly." }
        ]
      }
    ]
  },
  {
    slug: "gcse-biology",
    keyStage: "KS4",
    subject: "Biology",
    pageTitle: "GCSE Biology",
    navLabel: "Biology",
    summary: "GCSE Biology curriculum guidance with board tabs, assessment structure and clear topic summaries.",
    trustLine: "FlyBridge Biology tuition is delivered by qualified teachers who understand the curriculum, misconceptions and the demands of longer exam responses.",
    qualificationLine: "GCSE Biology",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE Biology",
        specificationCode: "8461",
        assessmentSummary: "Two written papers covering subject content, practical skills and application. Both papers assess knowledge, working scientifically and extended responses.",
        officialUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "Cell biology", summary: "Cells, microscopy, transport and cell division taught as the foundation of biological understanding." },
              { title: "Organisation", summary: "Tissues, organs, digestion and transport systems linked through structure and function." },
              { title: "Infection and response", summary: "Pathogens, the immune system and treatments explained through cause and effect." },
              { title: "Bioenergetics", summary: "Photosynthesis and respiration connected to energy transfer in living organisms." }
            ]
          },
          {
            title: "Paper 2",
            modules: [
              { title: "Homeostasis and response", summary: "Coordination, regulation and maintaining internal conditions." },
              { title: "Inheritance, variation and evolution", summary: "Genetics, selective breeding and evolution brought together clearly." },
              { title: "Ecology", summary: "Ecosystems, biodiversity and material cycles explained through interaction and evidence." }
            ]
          }
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE Biology",
        specificationCode: "1BI0",
        assessmentSummary: "Two written papers assess topic knowledge, core practical understanding and application across the course.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.html",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "Topic 1 Key concepts in biology", summary: "Foundational ideas that underpin later biological explanation and interpretation." },
              { title: "Topic 2 Cells and control", summary: "Cells, enzymes, transport and control processes brought together securely." },
              { title: "Topic 3 Genetics", summary: "DNA, inheritance and variation developed through clear biological models." },
              { title: "Topic 4 Natural selection and genetic modification", summary: "Selection, evolution and genetic technologies considered in context." },
              { title: "Topic 5 Health, disease and the development of medicines", summary: "Disease processes, treatment and drug development explained with scientific reasoning." }
            ]
          },
          {
            title: "Paper 2",
            modules: [
              { title: "Topic 6 Plant structures and their functions", summary: "Transport, photosynthesis and reproduction across plant systems." },
              { title: "Topic 7 Animal coordination, control and homeostasis", summary: "Hormonal and nervous control linked to regulation and response." },
              { title: "Topic 8 Exchange and transport in animals", summary: "Gas exchange, circulation and internal transport systems explained comparatively." },
              { title: "Topic 9 Ecosystems and material cycles", summary: "Ecology, interactions and nutrient cycles interpreted through real examples." }
            ]
          }
        ]
      },
      {
        name: "OCR Gateway",
        qualification: "GCSE Biology A",
        specificationCode: "J247",
        assessmentSummary: "Two written papers assess content knowledge, practical ideas and application across six biology modules.",
        officialUrl: "https://www.ocr.org.uk/qualifications/gcse/gateway-science-suite-biology-a-j247-from-2016/",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "B1 Cell level systems", summary: "Cells, transport and the biochemical processes needed for life." },
              { title: "B2 Scaling up", summary: "Organisation, exchange surfaces and transport in plants and animals." },
              { title: "B3 Organism level systems", summary: "Coordination, response and maintaining life processes in whole organisms." }
            ]
          },
          {
            title: "Paper 2",
            summary: "Practical skills are assessed across the qualification as well as the written papers.",
            modules: [
              { title: "B4 Community level systems", summary: "Ecosystems, interactions and environmental change across communities." },
              { title: "B5 Genes, inheritance and selection", summary: "Inheritance, variation and evolutionary ideas developed systematically." },
              { title: "B6 Global challenges", summary: "Disease, sustainability and biotechnology linked to biological problem solving." }
            ]
          }
        ]
      }
    ]
  },
  {
    slug: "gcse-chemistry",
    keyStage: "KS4",
    subject: "Chemistry",
    pageTitle: "GCSE Chemistry",
    navLabel: "Chemistry",
    summary: "GCSE Chemistry curriculum guidance with board tabs, assessment structure and high-level topic summaries.",
    trustLine: "FlyBridge Chemistry tuition is delivered by qualified teachers who make abstract models, calculations and reactions more manageable.",
    qualificationLine: "GCSE Chemistry",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE Chemistry",
        specificationCode: "8462",
        assessmentSummary: "Two written papers assess chemistry knowledge, practical understanding and problem solving across the course.",
        officialUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "Atomic structure and the periodic table", summary: "Foundational particle ideas and periodic organisation explained clearly." },
              { title: "Bonding, structure and the properties of matter", summary: "Linking microscopic structure to physical and chemical behaviour." },
              { title: "Quantitative chemistry", summary: "Moles, equations and calculations taught through structured method-building." },
              { title: "Chemical changes", summary: "Reactivity, electrolysis and acids connected through chemical reasoning." },
              { title: "Energy changes", summary: "Exothermic and endothermic change explained through bonds and energy transfer." }
            ]
          },
          {
            title: "Paper 2",
            modules: [
              { title: "The rate and extent of chemical change", summary: "Rates, reversible reactions and equilibrium interpreted with evidence." },
              { title: "Organic chemistry", summary: "Hydrocarbons and key carbon chemistry processes introduced securely." },
              { title: "Chemical analysis", summary: "Testing, purity and instrumental ideas explained practically." },
              { title: "Chemistry of the atmosphere", summary: "Atmospheric chemistry linked to environmental understanding." },
              { title: "Using resources", summary: "Resource use, sustainability and industrial chemistry in context." }
            ]
          }
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE Chemistry",
        specificationCode: "1CH0",
        assessmentSummary: "Two written papers assess topic knowledge, core practical skills and application across chemistry content.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.html",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "Topic 1 Key concepts in chemistry", summary: "Core chemical ideas that support the whole course." },
              { title: "Topic 2 States of matter and mixtures", summary: "Particles, separation methods and matter models developed clearly." },
              { title: "Topic 3 Chemical changes", summary: "Reaction types, acids and electrolysis connected to practical chemistry." },
              { title: "Topic 4 Extracting metals and equilibria", summary: "Reactivity, extraction and dynamic equilibrium explained with structure." }
            ]
          },
          {
            title: "Paper 2",
            modules: [
              { title: "Topic 5 Separate chemistry 1", summary: "Additional separate-science content that deepens chemical understanding." },
              { title: "Topic 6 Groups in the periodic table", summary: "Patterns, properties and predictions across key groups." },
              { title: "Topic 7 Rates of reaction and energy changes", summary: "Rate, collision theory and energy ideas applied together." },
              { title: "Topic 8 Fuels and Earth science", summary: "Hydrocarbons, Earth resources and atmospheric chemistry in context." },
              { title: "Topic 9 Separate chemistry 2", summary: "Further separate-science chemistry content and linked practical ideas." }
            ]
          }
        ]
      },
      {
        name: "OCR Gateway",
        qualification: "GCSE Chemistry A",
        specificationCode: "J248",
        assessmentSummary: "Two written papers assess chemistry knowledge, practical ideas and application across six chemistry modules.",
        officialUrl: "https://www.ocr.org.uk/qualifications/gcse/gateway-science-suite-chemistry-a-j248-from-2016/",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "C1 Particles", summary: "Particle models, structure and quantitative relationships underpinning chemistry." },
              { title: "C2 Elements, compounds and mixtures", summary: "Substances, formulas and separation methods taught through clear distinctions." },
              { title: "C3 Chemical reactions", summary: "Reactivity, equations and chemical change built through linked examples." }
            ]
          },
          {
            title: "Paper 2",
            summary: "Practical skills are assessed across the qualification as well as the written papers.",
            modules: [
              { title: "C4 Predicting and identifying reactions and products", summary: "Using patterns and evidence to anticipate chemical outcomes." },
              { title: "C5 Monitoring and controlling chemical reactions", summary: "Rates, yields and conditions interpreted in a structured way." },
              { title: "C6 Global challenges", summary: "Resources, environment and sustainability linked to chemistry in the real world." }
            ]
          }
        ]
      }
    ]
  },
  {
    slug: "gcse-physics",
    keyStage: "KS4",
    subject: "Physics",
    pageTitle: "GCSE Physics",
    navLabel: "Physics",
    summary: "GCSE Physics curriculum guidance with board tabs, paper structure and high-level topic organisation.",
    trustLine: "FlyBridge Physics tuition is delivered by qualified teachers who make equations, models and application feel more coherent.",
    qualificationLine: "GCSE Physics",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE Physics",
        specificationCode: "8463",
        assessmentSummary: "Two written papers assess physics knowledge, practical understanding and problem solving across the course.",
        officialUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "Energy", summary: "Stores, transfers and efficiency linked to everyday and applied contexts." },
              { title: "Electricity", summary: "Circuits, charge and electrical calculations taught through clear modelling." },
              { title: "Particle model of matter", summary: "Density, changes of state and internal energy interpreted through particle ideas." },
              { title: "Atomic structure", summary: "Atoms, isotopes and radiation introduced with clarity and care." }
            ]
          },
          {
            title: "Paper 2",
            modules: [
              { title: "Forces", summary: "Motion, momentum and force relationships explained through linked models." },
              { title: "Waves", summary: "Wave behaviour, properties and applications taught through patterns and representations." },
              { title: "Magnetism and electromagnetism", summary: "Fields, motors and generators connected through clear cause and effect." },
              { title: "Space physics", summary: "Separate-science space content linked to motion and the wider universe." }
            ]
          }
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE Physics",
        specificationCode: "1PH0",
        assessmentSummary: "Two written papers assess topic knowledge, mathematical application and core practical understanding.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.html",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "Topic 1 Key concepts of physics", summary: "Core physics ideas used to support later explanation and calculation." },
              { title: "Topic 2 Motion and forces", summary: "Speed, acceleration and force relationships built carefully." },
              { title: "Topic 3 Conservation of energy", summary: "Energy stores, transfers and efficiency explained in structured ways." },
              { title: "Topic 4 Waves", summary: "Wave properties, sound and behaviour across different contexts." },
              { title: "Topic 5 Light and the electromagnetic spectrum", summary: "Light, optics and electromagnetic ideas linked through models." },
              { title: "Topic 6 Radioactivity", summary: "Radiation, half-life and applications introduced securely." }
            ]
          },
          {
            title: "Paper 2",
            modules: [
              { title: "Topic 7 Astronomy", summary: "Separate-science astronomy ideas linked to observation and evidence." },
              { title: "Topic 8 Energy - Forces doing work", summary: "Work done, power and motion-related energy applied fluently." },
              { title: "Topic 9 Forces and their effects", summary: "Pressure, moments and motion effects developed systematically." },
              { title: "Topic 10 Electricity and circuits", summary: "Current, potential difference and resistance explained through circuit models." },
              { title: "Topic 11 Static electricity", summary: "Charging and electric fields introduced through cause and effect." },
              { title: "Topic 12 Magnetism and the motor effect", summary: "Fields, motors and magnetic interactions connected clearly." },
              { title: "Topic 13 Electromagnetic induction", summary: "Generators, transformers and induced potential difference applied practically." },
              { title: "Topic 14 Particle model", summary: "Particle behaviour, density and internal energy revisited through physics models." },
              { title: "Topic 15 Forces and matter", summary: "Pressure, moments and material behaviour explored with greater precision." },
              { title: "Topic 16 Atomic structure", summary: "Atomic models, fission and fusion linked to evidence and change." }
            ]
          }
        ]
      },
      {
        name: "OCR Gateway",
        qualification: "GCSE Physics A",
        specificationCode: "J249",
        assessmentSummary: "Two written papers assess content knowledge, practical ideas and application across the OCR Gateway physics modules.",
        officialUrl: "https://www.ocr.org.uk/qualifications/gcse/gateway-science-suite-physics-a-j249-from-2016/",
        papers: [
          {
            title: "Paper 1",
            modules: [
              { title: "P1 Matter", summary: "Particle ideas, density and thermal behaviour explained through physical models." },
              { title: "P2 Forces", summary: "Motion, force interactions and mechanics built through clear calculations and diagrams." },
              { title: "P3 Waves and radioactivity", summary: "Wave behaviour and radiation introduced through practical interpretation." }
            ]
          },
          {
            title: "Paper 2",
            modules: [
              { title: "P4 Global challenges", summary: "Physics ideas applied to the environment, energy and wider scientific issues." },
              { title: "P5 Space physics", summary: "Astronomy and space concepts linked to evidence and observation." },
              { title: "P6 Electricity and magnetism", summary: "Circuits, fields and electromagnetism explained in an applied way." }
            ]
          }
        ]
      }
    ]
  },
  {
    slug: "combined-science",
    keyStage: "KS4",
    subject: "Combined Science",
    pageTitle: "GCSE Combined Science",
    navLabel: "Combined Science",
    summary: "GCSE Combined Science curriculum guidance showing how Biology, Chemistry and Physics are organised by board.",
    trustLine: "FlyBridge Combined Science tuition is delivered by qualified teachers who balance the three sciences without losing clarity.",
    qualificationLine: "GCSE Combined Science",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE Combined Science: Trilogy",
        specificationCode: "8464",
        assessmentSummary: "Six written papers assess Biology, Chemistry and Physics content, practical understanding and application across the combined course.",
        officialUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464",
        papers: [
          { title: "Biology Paper 1", modules: [
            { title: "Cell biology", summary: "Core cell knowledge and related biological processes." },
            { title: "Organisation", summary: "Systems, tissues and transport in living organisms." },
            { title: "Infection and response", summary: "Disease processes, defence and treatment." },
            { title: "Bioenergetics", summary: "Respiration and photosynthesis explained in context." }
          ]},
          { title: "Biology Paper 2", modules: [
            { title: "Homeostasis and response", summary: "Control, coordination and maintaining internal conditions." },
            { title: "Inheritance, variation and evolution", summary: "Genetics and evolutionary explanation brought together clearly." },
            { title: "Ecology", summary: "Interactions, ecosystems and environmental change." }
          ]},
          { title: "Chemistry Paper 1", modules: [
            { title: "Atomic structure and the periodic table", summary: "Atomic models and periodic patterns." },
            { title: "Bonding, structure and the properties of matter", summary: "Relating structure to behaviour and properties." },
            { title: "Quantitative chemistry", summary: "Calculation methods and chemical amounts." },
            { title: "Chemical changes", summary: "Reactivity, acids and electrolysis." },
            { title: "Energy changes", summary: "Exothermic and endothermic change." }
          ]},
          { title: "Chemistry Paper 2", modules: [
            { title: "The rate and extent of chemical change", summary: "Rates, reversible reactions and equilibrium." },
            { title: "Organic chemistry", summary: "Hydrocarbons and carbon chemistry basics." },
            { title: "Chemical analysis", summary: "Testing, purity and analysis." },
            { title: "Chemistry of the atmosphere", summary: "Atmospheric processes and change." },
            { title: "Using resources", summary: "Resources, sustainability and practical chemistry." }
          ]},
          { title: "Physics Paper 1", modules: [
            { title: "Energy", summary: "Stores, transfers and efficiency." },
            { title: "Electricity", summary: "Circuits and electrical behaviour." },
            { title: "Particle model of matter", summary: "Density and changes of state." },
            { title: "Atomic structure", summary: "Atoms and radiation fundamentals." }
          ]},
          { title: "Physics Paper 2", modules: [
            { title: "Forces", summary: "Motion and interactions explained clearly." },
            { title: "Waves", summary: "Wave behaviour and applications." },
            { title: "Magnetism and electromagnetism", summary: "Fields, circuits and electromagnetic ideas." }
          ]}
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE Combined Science",
        specificationCode: "1SC0",
        assessmentSummary: "Six written papers assess the Biology, Chemistry and Physics strands alongside core practical understanding.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/science-2016.html",
        papers: [
          {
            title: "Biology",
            modules: [
              { title: "Topic 1 Key concepts in biology", summary: "Core ideas supporting the rest of the biology content." },
              { title: "Topic 2 Cells and control", summary: "Cells, enzymes and control processes." },
              { title: "Topic 3 Genetics", summary: "Inheritance and variation at a combined-science depth." },
              { title: "Topic 4 Natural selection and genetic modification", summary: "Selection and genetic technology in context." },
              { title: "Topic 5 Health, disease and the development of medicines", summary: "Disease and medicine linked through evidence." },
              { title: "Topic 6 Plant structures and their functions", summary: "Transport and photosynthesis in plants." },
              { title: "Topic 7 Animal coordination, control and homeostasis", summary: "Hormones, nerves and regulation." },
              { title: "Topic 8 Exchange and transport in animals", summary: "Gas exchange and circulation." },
              { title: "Topic 9 Ecosystems and material cycles", summary: "Interactions, cycles and environments." }
            ]
          },
          {
            title: "Chemistry",
            modules: [
              { title: "Topic 1 Key concepts in chemistry", summary: "Core chemistry models and language." },
              { title: "Topic 2 States of matter and mixtures", summary: "Particles, separation and matter changes." },
              { title: "Topic 3 Chemical changes", summary: "Reactivity, acids and electrolysis." },
              { title: "Topic 4 Extracting metals and equilibria", summary: "Extraction, reduction and equilibrium." },
              { title: "Topic 6 Groups in the periodic table", summary: "Patterns and properties across key groups." },
              { title: "Topic 7 Rates of reaction and energy changes", summary: "Collision theory, rates and energy." },
              { title: "Topic 8 Fuels and Earth science", summary: "Resources, fuels and atmospheric science." }
            ]
          },
          {
            title: "Physics",
            modules: [
              { title: "Topic 1 Key concepts of physics", summary: "Core physics ideas that support later study." },
              { title: "Topic 2 Motion and forces", summary: "Speed, acceleration and force relationships." },
              { title: "Topic 3 Conservation of energy", summary: "Energy stores and transfers." },
              { title: "Topic 4 Waves", summary: "Wave behaviour, sound and wave models." },
              { title: "Topic 5 Light and the electromagnetic spectrum", summary: "Light, optics and the EM spectrum." },
              { title: "Topic 6 Radioactivity", summary: "Radiation and nuclear ideas." },
              { title: "Topic 8 Energy - Forces doing work", summary: "Work done, power and energy change." },
              { title: "Topic 9 Forces and their effects", summary: "Pressure, moments and effects of forces." },
              { title: "Topic 10 Electricity and circuits", summary: "Current, voltage and resistance." },
              { title: "Topic 12 Magnetism and the motor effect", summary: "Magnets, motors and fields." },
              { title: "Topic 13 Electromagnetic induction", summary: "Generating electricity and transformers." },
              { title: "Topic 14 Particle model", summary: "Density and kinetic ideas in matter." }
            ]
          }
        ]
      },
      {
        name: "OCR Gateway",
        qualification: "GCSE Combined Science A",
        specificationCode: "J250",
        assessmentSummary: "Six written papers assess the Biology, Chemistry and Physics modules across OCR Gateway Combined Science.",
        officialUrl: "https://www.ocr.org.uk/qualifications/gcse/gateway-science-suite-combined-science-a-j250-from-2016/",
        papers: [
          { title: "Biology", modules: [
            { title: "B1 Cell level systems", summary: "Cells, transport and biochemical processes." },
            { title: "B2 Scaling up", summary: "Organisation and exchange in larger systems." },
            { title: "B3 Organism level systems", summary: "Coordination and maintaining life processes." },
            { title: "B4 Community level systems", summary: "Ecosystems and interactions." }
          ]},
          { title: "Chemistry", modules: [
            { title: "C1 Particles", summary: "Particle models and foundational chemistry ideas." },
            { title: "C2 Elements, compounds and mixtures", summary: "Substances and representations." },
            { title: "C3 Chemical reactions", summary: "Reaction types and chemical change." },
            { title: "C4 Predicting and identifying reactions and products", summary: "Using patterns and evidence to explain outcomes." }
          ]},
          { title: "Physics", modules: [
            { title: "P1 Matter", summary: "Particles, density and thermal ideas." },
            { title: "P2 Forces", summary: "Motion and mechanical interactions." },
            { title: "P3 Waves and radioactivity", summary: "Wave behaviour and radiation ideas." },
            { title: "P4 Global challenges", summary: "Applying physics to environment and energy issues." }
          ]}
        ]
      }
    ]
  },
  {
    slug: "gcse-maths",
    keyStage: "KS4",
    subject: "Maths",
    pageTitle: "GCSE Maths",
    navLabel: "Maths",
    summary: "GCSE Maths curriculum guidance with board tabs, paper structure and topic-family summaries.",
    trustLine: "FlyBridge maths tuition is delivered by qualified teachers who understand curriculum sequencing, error patterns and exam method.",
    qualificationLine: "GCSE Mathematics",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE Mathematics",
        specificationCode: "8300",
        assessmentSummary: "Foundation and Higher tiers each use three written papers, one non-calculator and two calculator papers, assessing the full course.",
        officialUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300",
        papers: [
          { title: "Paper structure", modules: [
            { title: "Foundation and Higher", summary: "Both tiers cover the course at different demand levels with three equally weighted papers." },
            { title: "Calculator pattern", summary: "One non-calculator paper is followed by two calculator papers." }
          ]},
          { title: "Topic families", modules: [
            { title: "Number", summary: "Place value, fractions, decimals, percentages and calculation fluency." },
            { title: "Algebra", summary: "Expressions, equations, graphs and algebraic reasoning." },
            { title: "Ratio, proportion and rates of change", summary: "Multiplicative reasoning used in practical and abstract contexts." },
            { title: "Geometry and measures", summary: "Angles, shape, area, volume and trigonometric ideas." },
            { title: "Probability", summary: "Likelihood, combined events and interpreting outcomes." },
            { title: "Statistics", summary: "Charts, averages and data interpretation with reasoning." }
          ]}
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE Mathematics",
        specificationCode: "1MA1",
        assessmentSummary: "Foundation and Higher tiers each use three written papers, one non-calculator and two calculator papers, across the full specification.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.html",
        papers: [
          { title: "Paper structure", modules: [
            { title: "Foundation and Higher", summary: "Tiered papers assess the same broad content with different depth and complexity." },
            { title: "Calculator pattern", summary: "Paper 1 is non-calculator, while Papers 2 and 3 allow a calculator." }
          ]},
          { title: "Topic families", modules: [
            { title: "Number", summary: "Methods, estimation and numerical reasoning." },
            { title: "Algebra", summary: "Manipulation, solving and graph-based interpretation." },
            { title: "Ratio, proportion and rates of change", summary: "Comparative reasoning and proportional methods across contexts." },
            { title: "Geometry and measures", summary: "Shape, coordinates, transformations and measurement." },
            { title: "Probability", summary: "Theoretical and experimental probability used in increasingly structured questions." },
            { title: "Statistics", summary: "Representation, averages and statistical interpretation." }
          ]}
        ]
      },
      {
        name: "OCR",
        qualification: "GCSE Mathematics",
        specificationCode: "J560",
        assessmentSummary: "Foundation and Higher tiers each use three written papers with a non-calculator paper followed by two calculator papers.",
        officialUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/",
        papers: [
          { title: "Paper structure", modules: [
            { title: "Foundation and Higher", summary: "Tiered assessment covering the specification through three written papers." },
            { title: "Calculator pattern", summary: "One non-calculator paper and two calculator papers across both tiers." }
          ]},
          { title: "Topic families", modules: [
            { title: "Number", summary: "Core arithmetic and number reasoning developed securely." },
            { title: "Algebra", summary: "Expressions, equations, sequences and graphs." },
            { title: "Ratio, proportion and rates of change", summary: "Multiplicative methods and practical reasoning." },
            { title: "Geometry and measures", summary: "Spatial reasoning, shape properties and measurement." },
            { title: "Probability", summary: "Chance, outcomes and event reasoning." },
            { title: "Statistics", summary: "Data presentation, averages and interpretation." }
          ]}
        ]
      }
    ]
  },
  {
    slug: "english-language",
    keyStage: "KS4",
    subject: "English Language",
    pageTitle: "GCSE English Language",
    navLabel: "English Language",
    summary: "GCSE English Language curriculum guidance showing board components, reading and writing structure and spoken language information.",
    trustLine: "FlyBridge English Language tuition is delivered by qualified teachers who understand reading, writing and exam structure rather than subject knowledge alone.",
    qualificationLine: "GCSE English Language",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE English Language",
        specificationCode: "8700",
        assessmentSummary: "Two written papers cover fiction, non-fiction and writing, with spoken language reported separately.",
        officialUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700",
        papers: [
          { title: "Paper 1 Explorations in creative reading and writing", modules: [
            { title: "Reading", summary: "Close analysis of one literature fiction text and how writers shape meaning." },
            { title: "Writing", summary: "Descriptive or narrative writing with control of structure and expression." }
          ]},
          { title: "Paper 2 Writers’ viewpoints and perspectives", modules: [
            { title: "Reading", summary: "Comparison of two linked non-fiction texts from different periods." },
            { title: "Writing", summary: "Transactional writing that argues, explains, advises or persuades clearly." }
          ]},
          { title: "Spoken language", modules: [
            { title: "Presentation and response", summary: "A separate endorsement assessing spoken communication and response." }
          ]}
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE English Language",
        specificationCode: "1EN0",
        assessmentSummary: "Two written papers assess reading and writing, with spoken language reported separately.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.html",
        papers: [
          { title: "Paper 1 Fiction and imaginative writing", modules: [
            { title: "Reading", summary: "Analysis of an unseen fiction extract and writer’s craft." },
            { title: "Writing", summary: "Imaginative writing with control of tone, structure and technical accuracy." }
          ]},
          { title: "Paper 2 Non-fiction and transactional writing", modules: [
            { title: "Reading", summary: "Comparison and interpretation across unseen non-fiction texts." },
            { title: "Writing", summary: "Transactional responses shaped for audience, purpose and viewpoint." }
          ]},
          { title: "Spoken language", modules: [
            { title: "Spoken presentation", summary: "A separate spoken language endorsement focused on presentation and discussion." }
          ]}
        ]
      }
    ]
  },
  {
    slug: "english-literature",
    keyStage: "KS4",
    subject: "English Literature",
    pageTitle: "GCSE English Literature",
    navLabel: "English Literature",
    summary: "GCSE English Literature curriculum guidance showing board components and the main literature domains assessed.",
    trustLine: "FlyBridge English Literature tuition is delivered by qualified teachers who understand text study, interpretation and essay structure.",
    qualificationLine: "GCSE English Literature",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE English Literature",
        specificationCode: "8702",
        assessmentSummary: "Two written papers assess Shakespeare, the nineteenth-century novel, modern texts and poetry. Set texts vary by school.",
        officialUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702",
        papers: [
          { title: "Paper 1 Shakespeare and the nineteenth-century novel", modules: [
            { title: "Shakespeare", summary: "Studying one Shakespeare play through language, character and dramatic method." },
            { title: "Nineteenth-century novel", summary: "Analysing one nineteenth-century prose text in detail." }
          ]},
          { title: "Paper 2 Modern texts and poetry", modules: [
            { title: "Modern text or drama", summary: "Responding to one modern prose or drama text chosen by the school." },
            { title: "Poetry anthology", summary: "Comparing named anthology poems through ideas, methods and meaning." },
            { title: "Unseen poetry", summary: "Reading and comparing poems not studied in advance." }
          ]}
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE English Literature",
        specificationCode: "1ET0",
        assessmentSummary: "Two written papers assess Shakespeare, a nineteenth-century novel, poetry and a modern text. Set texts vary by school and board entry.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-literature-2015.html",
        papers: [
          { title: "Paper 1 Shakespeare and post-1914 literature", modules: [
            { title: "Shakespeare", summary: "Studying one Shakespeare play through close textual analysis." },
            { title: "Modern text", summary: "Responding to one post-1914 prose or drama text selected by the school." }
          ]},
          { title: "Paper 2 Nineteenth-century novel and poetry since 1789", modules: [
            { title: "Nineteenth-century novel", summary: "Analysing one nineteenth-century prose text in depth." },
            { title: "Poetry anthology", summary: "Comparing named anthology poems using clear textual support." },
            { title: "Unseen poetry", summary: "Interpreting unseen poems and commenting on writer’s methods." }
          ]}
        ]
      }
    ]
  },
  {
    slug: "french",
    keyStage: "KS4",
    subject: "French",
    pageTitle: "GCSE French",
    navLabel: "French",
    summary: "GCSE French curriculum guidance showing board components and the four assessed language skills.",
    trustLine: "FlyBridge French tuition is delivered by qualified teachers who build vocabulary, grammar and exam performance together.",
    qualificationLine: "GCSE French",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "GCSE French",
        specificationCode: "8658",
        assessmentSummary: "Four papers assess listening, speaking, reading and writing. The content and vocabulary chosen by schools and boards should be checked against the current specification in use.",
        officialUrl: "https://www.aqa.org.uk/subjects/languages/gcse/french-8658",
        papers: [
          { title: "Listening", modules: [
            { title: "Understanding spoken French", summary: "Interpreting familiar and less familiar spoken language with increasing independence." }
          ]},
          { title: "Speaking", modules: [
            { title: "Conversation and photo-based response", summary: "Responding to prompts, role play and extended spoken communication." }
          ]},
          { title: "Reading", modules: [
            { title: "Comprehension and translation", summary: "Reading authentic and adapted texts with accurate interpretation." }
          ]},
          { title: "Writing", modules: [
            { title: "Short and extended written responses", summary: "Producing written French with control of vocabulary and grammar." }
          ]}
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "GCSE French",
        specificationCode: "1FR1",
        assessmentSummary: "Four papers assess listening, speaking, reading and writing across the GCSE French course. Content choices should be checked against the current board entry used by the school.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/french-2016.html",
        papers: [
          { title: "Listening", modules: [
            { title: "Understanding spoken French", summary: "Recognising gist, detail and inference across set vocabulary domains." }
          ]},
          { title: "Speaking", modules: [
            { title: "Role play, picture task and conversation", summary: "Building clear, accurate spoken responses across familiar contexts." }
          ]},
          { title: "Reading", modules: [
            { title: "Reading and translation", summary: "Interpreting written French and translating accurately into English." }
          ]},
          { title: "Writing", modules: [
            { title: "Written communication", summary: "Producing clear written French using a growing range of language." }
          ]}
        ]
      }
    ]
  },
  {
    slug: "a-level-maths",
    keyStage: "KS5",
    subject: "Maths",
    pageTitle: "A Level Maths",
    navLabel: "Maths",
    summary: "KS5 Maths curriculum guidance showing board-aware structure across Pure Mathematics, Statistics and Mechanics.",
    trustLine: "FlyBridge KS5 Maths tuition is delivered by qualified teachers who understand how advanced content and exam demands fit together.",
    qualificationLine: "A Level Mathematics",
    mode: "boards",
    boards: [
      {
        name: "Pearson Edexcel",
        qualification: "A Level Mathematics",
        specificationCode: "9MA0",
        assessmentSummary: "Three written papers assess Pure Mathematics, Statistics and Mechanics across the A Level course.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-a-levels/mathematics-2017.html",
        papers: [
          { title: "Pure Mathematics", modules: [
            { title: "Algebra and functions", summary: "Manipulation, functions and proof used as the backbone of the course." },
            { title: "Coordinate geometry and calculus", summary: "Graphs, differentiation and integration applied systematically." },
            { title: "Sequences, trigonometry and exponentials", summary: "Core advanced relationships developed with fluency." }
          ]},
          { title: "Statistics", modules: [
            { title: "Statistical sampling and data", summary: "Interpreting data, distributions and statistical models." },
            { title: "Probability and hypothesis testing", summary: "Using probability methods and testing ideas rigorously." }
          ]},
          { title: "Mechanics", modules: [
            { title: "Forces and motion", summary: "Kinematics and dynamics explained through modelling and calculation." },
            { title: "Moments and variable acceleration", summary: "Applying mechanics ideas to more demanding physical systems." }
          ]}
        ]
      },
      {
        name: "AQA",
        qualification: "A Level Mathematics",
        specificationCode: "7357",
        assessmentSummary: "Three written papers assess Pure Mathematics and the applied strands of Statistics and Mechanics.",
        officialUrl: "https://www.aqa.org.uk/subjects/mathematics/as-and-a-level/mathematics-7357",
        papers: [
          { title: "Pure Mathematics", modules: [
            { title: "Proof, algebra and functions", summary: "Core algebraic reasoning and function work underpinning the course." },
            { title: "Coordinate geometry and calculus", summary: "Curves, rates of change and integration methods developed carefully." },
            { title: "Sequences, series and trigonometry", summary: "Advanced relationships and techniques built with precision." }
          ]},
          { title: "Statistics", modules: [
            { title: "Probability and statistical models", summary: "Using data, distributions and inference in a mathematically secure way." }
          ]},
          { title: "Mechanics", modules: [
            { title: "Kinematics and forces", summary: "Motion and force models explained through consistent method and interpretation." }
          ]}
        ]
      }
    ]
  },
  {
    slug: "a-level-french",
    keyStage: "KS5",
    subject: "French",
    pageTitle: "A Level French",
    navLabel: "French",
    summary: "KS5 French curriculum guidance showing board-aware listening, reading, writing, speaking and independent research structures.",
    trustLine: "FlyBridge KS5 French tuition is delivered by qualified teachers who understand language development, essay work and spoken accuracy at advanced level.",
    qualificationLine: "A Level French",
    mode: "boards",
    boards: [
      {
        name: "AQA",
        qualification: "A Level French",
        specificationCode: "7652",
        assessmentSummary: "Written and spoken assessment covers listening, reading, translation, writing, literary or film study and an independent research project.",
        officialUrl: "https://www.aqa.org.uk/subjects/languages/as-and-a-level/french-7652",
        papers: [
          { title: "Listening and reading", modules: [
            { title: "Listening", summary: "Understanding spoken French on social, political and cultural topics." },
            { title: "Reading", summary: "Reading authentic French texts and translating accurately into English." }
          ]},
          { title: "Writing", modules: [
            { title: "Translation into French", summary: "Producing accurate written French with control of grammar and register." },
            { title: "Text or film essay", summary: "Writing analytical essays on the works chosen by the student’s course." }
          ]},
          { title: "Speaking", modules: [
            { title: "Discussion of stimulus material", summary: "Responding to prompts and sustaining analytical spoken discussion." },
            { title: "Independent research project", summary: "Presenting and discussing independently researched French-language topics." }
          ]}
        ]
      },
      {
        name: "Pearson Edexcel",
        qualification: "A Level French",
        specificationCode: "9FR0",
        assessmentSummary: "Assessment covers listening, reading, translation, writing, speaking and independent research across the A Level course.",
        officialUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-a-levels/french-2016.html",
        papers: [
          { title: "Listening and reading", modules: [
            { title: "Listening", summary: "Interpreting spoken French across varied contemporary and cultural contexts." },
            { title: "Reading", summary: "Working with authentic written texts and translating accurately." }
          ]},
          { title: "Writing", modules: [
            { title: "Translation into French", summary: "Producing precise written French with control of complex grammar." },
            { title: "Works or cultural study", summary: "Analytical writing on literary works, film or cultural topics." }
          ]},
          { title: "Speaking", modules: [
            { title: "Discussion themes", summary: "Sustained spoken discussion across the board’s prescribed themes." },
            { title: "Independent research", summary: "Presenting and defending an individually researched topic." }
          ]}
        ]
      }
    ]
  }
] as const satisfies readonly CurriculumPage[];

export const keyStageLandingPages = [
  {
    slug: "ks2",
    keyStage: "KS2",
    title: "KS2 tuition",
    summary: "KS2 support organised around the primary curriculum, with FlyBridge’s current core tuition offer focused on English, Maths, Science and French.",
    coreOffer: ["English", "Maths", "Science", "French"],
    subjects: [
      { label: "English", href: "/ks2-english", note: "Reading, writing, grammar and communication." },
      { label: "Maths", href: "/ks2-maths", note: "Number, reasoning and problem solving." },
      { label: "Science", href: "/ks2-science", note: "Primary science knowledge and working scientifically." },
      { label: "French", href: "/ks2-french", note: "Vocabulary, pronunciation and simple sentence-building." }
    ]
  },
  {
    slug: "ks3",
    keyStage: "KS3",
    title: "KS3 tuition",
    summary: "KS3 support focused on secure curriculum understanding before GCSE content begins to accelerate.",
    subjects: [
      { label: "English", href: "/ks3-english", note: "Reading analysis, vocabulary and writing control." },
      { label: "Maths", href: "/ks3-maths", note: "Fluency, algebra and reasoning before GCSE." },
      { label: "Science", href: "/ks3-science", note: "Biology, Chemistry, Physics and working scientifically." },
      { label: "French", href: "/ks3-french", note: "Vocabulary, grammar and confident sentence-building." }
    ]
  },
  {
    slug: "ks4",
    keyStage: "KS4",
    title: "KS4 tuition",
    summary: "KS4 support organised around GCSE subjects, exam-board structure and clear assessment demands.",
    subjects: [
      { label: "English Language", href: "/english-language", note: "Reading, writing and spoken language structure." },
      { label: "English Literature", href: "/english-literature", note: "Texts, poetry and essay response." },
      { label: "Maths", href: "/gcse-maths", note: "Foundation, Higher and topic-family structure." },
      { label: "Biology", href: "/gcse-biology", note: "Board-aware biology paper structure." },
      { label: "Chemistry", href: "/gcse-chemistry", note: "Board-aware chemistry paper structure." },
      { label: "Physics", href: "/gcse-physics", note: "Board-aware physics paper structure." },
      { label: "Combined Science", href: "/combined-science", note: "Biology, Chemistry and Physics in one course." },
      { label: "French", href: "/french", note: "Listening, speaking, reading and writing." }
    ]
  },
  {
    slug: "ks5",
    keyStage: "KS5",
    title: "KS5 tuition",
    summary: "KS5 support organised around A Level structures and the demands of advanced written and applied work.",
    subjects: [
      { label: "Maths", href: "/a-level-maths", note: "Pure Mathematics, Statistics and Mechanics." },
      { label: "French", href: "/a-level-french", note: "Listening, reading, writing, speaking and independent research." }
    ]
  }
] as const satisfies readonly KeyStageLanding[];

export const primaryCurriculumAreas = [
  "English",
  "Maths",
  "Science",
  "Design and Technology",
  "History",
  "Geography",
  "Art and Design",
  "Music",
  "Physical Education",
  "Computing",
  "Languages"
] as const;

export function getCurriculumPage(slug: string) {
  return curriculumPages.find((page) => page.slug === slug);
}

export function getKeyStageLanding(slug: string) {
  return keyStageLandingPages.find((page) => page.slug === slug);
}
