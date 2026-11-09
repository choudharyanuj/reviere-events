// All copy below is carried over verbatim from the original www.reviereevent.com.
// tests/content.test.mjs checks every string here against the archived source in _source/.

export const site = {
  brand: 'Reviere Events',
  owner: 'Manish Kumar',
  url: 'https://www.reviereevent.com',
  whatsappPhone: '918893535829',
  mainPhone: { href: 'tel:+918893535829', label: '+91 88935 35829' },
  email: 'reviereevent@gmail.com',
  location: 'Patna, Bihar, India',
  instagram: 'https://instagram.com/reviereevent',
  facebook: 'https://facebook.com/Reviere-Events',
  ogImage: '/assets/images/event-hero.jpg',
  copyright: '© 2026 Reviere Events. All rights reserved. | Founded & Directed by Manish Kumar | Luxury Event Planner in Patna',
  footerAbout:
    'Exclusive Event Planning & Management founded and directed by Manish Kumar, based in Patna, Bihar. Turning moments into unforgettable memories with flawless execution.',
};

export const wa = {
  nav: 'Hi Manish! I would like to inquire about event planning services with Reviere Events.',
  drawer: 'Hi Manish! I want to discuss planning my upcoming event with Reviere Events.',
  drawerEvents: 'Hi Manish! I want to discuss planning my upcoming event.',
  footer: 'Hi Manish! I want to get in touch regarding an event.',
  fab: 'Hi Manish! I want to inquire about Event Planning & Management.',
};

export const nav = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'Services', href: '/events', key: 'events' },
  { label: 'About', href: '/about', key: 'about' },
  { label: 'Contact', href: '/contact', key: 'contact' },
] as const;

export const footerNav = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/events' },
  { label: 'About Manish', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

export const footerServices = [
  { label: 'Wedding Planning', href: '/events#wedding' },
  { label: 'Corporate Events', href: '/events#corporate' },
  { label: 'Transportation Facility', href: '/events#transportation' },
  { label: 'Security & Bodyguards', href: '/events#security' },
  { label: 'Stage Shows & Dance', href: '/events#dance' },
];

export const meta = {
  home: {
    title: 'Reviere Events | Luxury Event Planning & Management | Patna, Bihar',
    description:
      'Reviere Events — Premier Event Planning & Management in Patna, Bihar. Founded & Directed by Manish Kumar. Specializing in Weddings, Corporate Events, Private Celebrations, and Stage Shows.',
    keywords:
      'Reviere Events, Manish Kumar event planner, event management Patna, wedding planner Patna, corporate events Bihar, stage performance choreographer, vendor management Patna',
    ogTitle: 'Reviere Events | Luxury Event Planning & Management',
    ogDescription:
      'Crafting Unforgettable Moments — Weddings, Corporate Events, Private Parties & Stage Choreography in Patna, Bihar. Founded & Directed by Manish Kumar.',
  },
  about: {
    title: 'About Reviere Events | Founded by Manish Kumar | Patna',
    description:
      'Learn about Reviere Events — Premier Event Planning & Management company in Patna, Bihar, founded and directed by Manish Kumar with 7+ years of expertise.',
    ogTitle: 'About Reviere Events | Founded by Manish Kumar | Patna',
    ogDescription:
      'Meet Manish Kumar, Founder & Lead Director of Reviere Events — Premier Event Planning & Choreography in Patna with 7+ years experience.',
  },
  events: {
    title: 'Event Planning Services | Reviere Events | Patna, Bihar',
    description:
      'Explore luxury event services by Reviere Events in Patna, founded & directed by Manish Kumar — Wedding Planning, Corporate Seminars, Private Celebrations, Vendor Management & Stage Choreography.',
    ogTitle: 'Event Planning Services | Reviere Events | Patna, Bihar',
    ogDescription:
      'Explore luxury event services by Reviere Events in Patna — Weddings, Corporate Events, Celebrations & Vendor Management. Directed by Manish Kumar.',
  },
  contact: {
    title: 'Contact Reviere Events | Event Planner Patna, Bihar',
    description:
      'Get in touch with Reviere Events for luxury event planning, wedding management, corporate events, security guards, transportation, and stage performances in Patna, Bihar. Directed by Manish Kumar.',
    ogTitle: 'Contact Reviere Events | Event Planner Patna, Bihar',
    ogDescription:
      'Get in touch with Reviere Events for luxury event planning, wedding management, security, transportation, and stage performances in Patna, Bihar.',
  },
};

export const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EventPlanner',
  name: 'Reviere Events',
  url: 'https://www.reviereevent.com/',
  image: 'https://www.reviereevent.com/assets/images/event-hero.jpg',
  description:
    'Exclusive Event Planner & Manager specializing in Weddings, Corporate Events, Celebrations & Live Choreographed Performances in Patna, Bihar. Founded and Directed by Manish Kumar.',
  founder: { '@type': 'Person', name: 'Manish Kumar', jobTitle: 'Owner & Director' },
  telephone: '+918893535829',
  email: 'reviereevent@gmail.com',
  priceRange: '$$',
  areaServed: [
    { '@type': 'City', name: 'Patna' },
    { '@type': 'AdministrativeArea', name: 'Bihar' },
  ],
  address: { '@type': 'PostalAddress', addressLocality: 'Patna', addressRegion: 'Bihar', addressCountry: 'IN' },
};

/* ───────────────────────────── Home ───────────────────────────── */

export const home = {
  hero: {
    eyebrow: 'Luxury Event Planning & Management • Patna',
    title: ['REVIERE', 'EVENTS'],
    tagline: 'Crafting Unforgettable Moments',
    description:
      'Founded & Directed by Manish Kumar. Premium Event Planning & Management — Weddings, Corporate Events, Private Celebrations & Stage Performances tailored for Patna and beyond.',
    primary: { label: 'Explore Our Services', href: '/events' },
    secondary: {
      label: 'Book via WhatsApp',
      wa: 'Hi Manish! I visited Reviere Events website and would like to consult on an upcoming event.',
    },
  },
  stats: [
    { value: 50, label: 'Events Managed' },
    { value: 7, label: 'Years Experience' },
    { value: 150, label: 'Happy Clients' },
    { value: 100, label: 'Customised Events' },
  ],
  services: {
    eyebrow: 'Our Specialisations',
    title: 'Luxury Event Services',
    subtitle:
      'From grand wedding galas to seamless corporate seminars, we bring elegance and flawless execution to every celebration.',
    items: [
      {
        icon: 'Gem',
        image: 'wedding',
        title: 'Wedding Planning',
        desc: 'Bespoke wedding design, ritual coordination, Sangeet choreography, and full hospitality management for your special day.',
        points: ['Sangeet & Reception Management', 'Theme Decoration & Lighting', 'Complete Guest Hospitality'],
        cta: 'Inquire for Wedding',
        wa: 'Hi Manish! I want to inquire about Wedding Planning services.',
      },
      {
        icon: 'Briefcase',
        image: 'corporate',
        title: 'Corporate Events',
        desc: 'High-impact corporate seminars, brand launches, annual galas, and executive conferences executed with absolute precision.',
        points: ['Stage Setup & AV Tech Support', 'VIP Hospitality & Logistics', 'Branding & Media Coverage'],
        cta: 'Inquire for Corporate',
        wa: 'Hi Manish! I want to inquire about Corporate Event Management.',
      },
      {
        icon: 'PartyPopper',
        image: 'party',
        title: 'Private Celebrations',
        desc: 'Milestone birthday bashes, anniversary galas, ring ceremonies, and exclusive private house parties.',
        points: ['Custom Decor & Ambience', 'DJ, Sound & Entertainment', 'Catering & Beverage Management'],
        cta: 'Inquire for Party',
        wa: 'Hi Manish! I want to inquire about Private Celebration planning.',
      },
      {
        icon: 'Music',
        image: 'sangeet',
        title: 'Stage Shows & Dance',
        desc: 'Electrifying live dance choreography, celebrity entry concepts, and choreographed stage shows directed by Manish Kumar.',
        points: ['Live Dance Performances', 'Family Sangeet Choreography', 'Concept Entries & Light FX'],
        cta: 'Book Dance Show',
        wa: 'Hi Manish! I want to inquire about Stage Dance Performances & Choreography.',
      },
      {
        icon: 'GraduationCap',
        image: 'fest',
        title: 'College & Cultural Fests',
        desc: 'End-to-end festival management for colleges and institutions — artist booking, stage production, and crowd security.',
        points: ['Main Stage & Sound System', 'Celebrity & Artist Coordination', 'Security & Crowd Control'],
        cta: 'Inquire for Fest',
        wa: 'Hi Manish! I want to inquire about College Fest management.',
      },
      {
        icon: 'MapPin',
        image: 'destination',
        title: 'Destination Events',
        desc: 'Seamless outstation event management across Bihar and neighboring states with dedicated on-site venue logistics.',
        points: ['Venue Scouting & Selection', 'Guest Transport & Lodging', 'On-Ground Event Operations'],
        cta: 'Inquire for Destination',
        wa: 'Hi Manish! I want to inquire about Destination Event planning.',
      },
      {
        icon: 'Car',
        image: 'transport',
        title: 'Transportation Facility',
        desc: 'Luxury bridal cars, vintage vehicles, AC tempo travelers, and bus fleets for seamless guest logistics across Patna & Bihar.',
        points: ['Luxury Bridal Cars (Audi, BMW, Vintage)', 'AC Guest Buses & Airport Pickup Fleet', '24/7 On-Ground Transport Management'],
        cta: 'Inquire for Transport',
        wa: 'Hi Manish! I want to inquire about Transportation & Fleet services for my event.',
      },
      {
        icon: 'ShieldCheck',
        image: 'security',
        title: 'Security & Bodyguards',
        desc: 'Elite personal bodyguards, trained bouncers, and comprehensive event checkpoint security for VIPs, galas, and weddings.',
        points: ['Trained Male & Female Event Bouncers', 'Armed & Unarmed Personal Bodyguards', 'Gate Metal Detectors & Crowd Discipline'],
        cta: 'Inquire for Security',
        wa: 'Hi Manish! I want to inquire about Security Guards & Bodyguard services for my event.',
      },
    ],
  },
  vendors: {
    eyebrow: 'Seamless Coordination',
    title: 'All-In-One Vendor Management',
    subtitle: 'Save time and eliminate stress. We manage Patna’s finest vendors under one unified contract.',
    items: [
      { icon: 'Sparkles', title: 'Beautician & Makeup', desc: 'Bridal, party & HD makeup artists' },
      { icon: 'Flame', title: 'Pandit & Rituals', desc: 'Experienced priests for all traditional ceremonies' },
      { icon: 'Camera', title: 'Photographers', desc: 'Candid photography & cinematic portraits' },
      { icon: 'Video', title: 'Videographers', desc: '4K drone shots & wedding films' },
      { icon: 'Flower2', title: 'Stage & Decor', desc: 'Floral arrangements & luxury lighting' },
      { icon: 'Utensils', title: 'Catering Services', desc: 'Multi-cuisine buffet & gourmet presentation' },
      { icon: 'Car', title: 'Transportation Facility', desc: 'Bridal cars, guest AC buses & airport pickup' },
      { icon: 'ShieldCheck', title: 'Security & Bodyguards', desc: 'Trained bouncers, VIP bodyguards & gate control' },
    ],
    cta: 'Consult Vendor Package',
    wa: 'Hi Manish! I want to consult on full vendor management for my event.',
  },
  highlights: {
    eyebrow: 'Visual Excellence',
    title: 'Featured Event Highlights',
    subtitle: 'A glimpse into recent luxury celebrations designed and executed by our team in Patna.',
    items: [
      { image: 'wedding', alt: 'Grand Wedding Decor', tag: 'Wedding Gala', title: 'Royal Palace Wedding' },
      { image: 'sangeet', alt: 'Stage Dance Show', tag: 'Live Choreography', title: 'Sangeet Stage Performance' },
      { image: 'corporate', alt: 'Corporate Gala', tag: 'Corporate Event', title: 'Annual Corporate Summit' },
      { image: 'fest', alt: 'College Fest', tag: 'Cultural Fest', title: 'University Youth Festival' },
    ],
  },
  testimonials: {
    eyebrow: 'Client Trust',
    title: 'What Our Clients Say',
    subtitle: 'Real feedback from event hosts and clients across Patna.',
    items: [
      {
        quote:
          'We hired Manish for our college fest and he managed everything — from artist management to stage setup and security. Professional, creative, and strictly on time.',
        initials: 'AK',
        name: 'Amit Kumar',
        role: 'College Event Organiser',
      },
      {
        quote:
          'Our wedding Sangeet performance was choreographed by Manish sir, and his team also handled stage lighting. Every single guest complimented the arrangement!',
        initials: 'RP',
        name: 'Ravi Prakash',
        role: 'Wedding Client',
      },
      {
        quote:
          "Manish took care of catering, decor, and photography for my daughter's 1st birthday celebration. Seamless experience with zero stress for our family!",
        initials: 'SP',
        name: 'Sneha Patel',
        role: 'Private Party Host',
      },
    ],
  },
  cta: {
    title: 'Ready to Plan Your Next Event?',
    text: "Let's discuss your vision, budget, and requirements. Chat with Manish Kumar directly on WhatsApp for an instant consultation.",
    primary: { label: 'Chat on WhatsApp', wa: 'Hi Manish! I want to start planning an upcoming event.' },
    secondary: { label: 'Fill Inquiry Form', href: '/contact' },
  },
};

/* ───────────────────────────── Services (events.html) ───────────────────────────── */

export const eventsPage = {
  hero: {
    title: 'Our Event Planning Services',
    subtitle: 'From vision to reality — we handle every detail so you can enjoy your special day.',
    crumb: 'Services',
  },
  services: [
    {
      id: 'wedding',
      image: 'wedding',
      chip: 'Wedding',
      icon: 'Gem',
      title: 'Wedding Planning & Management',
      desc: 'Complete end-to-end wedding production covering pre-wedding ceremonies, Tilak, Haldi, Sangeet night, and grand reception galas in Patna.',
      points: [
        'Theme Decoration & Flower Concepts',
        'Custom Family Sangeet Choreography',
        'Catering, Pandit & Beautician Packages',
        'On-Site Coordination & Guest Hospitality',
      ],
      cta: 'Inquire via WhatsApp',
      wa: 'Hi Manish! I am interested in Wedding Planning services.',
    },
    {
      id: 'corporate',
      image: 'corporate',
      chip: 'Corporate',
      icon: 'Briefcase',
      title: 'Corporate Events & Seminars',
      desc: 'Professional corporate event management tailored for company launches, annual awards ceremonies, dealer meets, and conferences.',
      points: [
        'Audio-Visual & Stage Production',
        'Corporate Branding & Backdrop Design',
        'Delegate Registration & VIP Logistics',
        'Professional MC & Entertainment',
      ],
      cta: 'Inquire via WhatsApp',
      wa: 'Hi Manish! I am interested in Corporate Event Management.',
    },
    {
      id: 'private',
      image: 'party',
      chip: 'Private',
      icon: 'PartyPopper',
      title: 'Private Parties & Celebrations',
      desc: 'Create unforgettable memories for birthday celebrations, anniversaries, engagement ceremonies, and private family dinners.',
      points: [
        'Balloon & Floral Backdrop Styling',
        'DJ, Sound Systems & Live Musicians',
        'Gourmet Catering & Dessert Bars',
        'Event Anchor & Interactive Games',
      ],
      cta: 'Inquire via WhatsApp',
      wa: 'Hi Manish! I am interested in Private Celebration planning.',
    },
    {
      id: 'dance',
      image: 'sangeet',
      chip: 'Stage & Dance',
      icon: 'Music',
      title: 'Stage Performances & Choreography',
      desc: "Leveraging Manish Kumar's 7+ years of dance experience to bring show-stopping dance acts, bridal entries, and choreographed performances.",
      points: [
        'Bride & Groom Romantic Entry Dance',
        'Family Group Sangeet Rehearsals',
        'Professional Dance Troupe Performances',
        'Theme Music Mixes & Sound Editing',
      ],
      cta: 'Inquire via WhatsApp',
      wa: 'Hi Manish! I want to inquire about Stage Choreography and Dance Shows.',
    },
    {
      id: 'transportation',
      image: 'transport',
      chip: 'Transport',
      icon: 'Car',
      title: 'Transportation & Luxury Fleet Facility',
      desc: 'Comprehensive ground transport for weddings, corporate delegates, and outstation guests across Patna and all Bihar districts.',
      points: [
        'Luxury Bridal Cars (Audi, BMW, Vintage) & Floral Decoration',
        'AC Deluxe Buses & Tempo Travelers for Guest Caravans',
        'Patna Airport & Railway Station VIP Transfers',
        '24/7 Dedicated Transport Coordinator On-Site',
      ],
      cta: 'Inquire for Transportation',
      wa: 'Hi Manish! I want to inquire about Transportation & Fleet facility for my event.',
    },
    {
      id: 'security',
      image: 'security',
      chip: 'Security',
      icon: 'ShieldCheck',
      title: 'Security Guards, Bouncers & Bodyguards',
      desc: 'Elite security solutions ensuring complete safety, VIP protection, and disciplined crowd management for private celebrations, concerts, and weddings.',
      points: [
        'Professional Male & Female Event Bouncers',
        'Armed & Unarmed Personal Bodyguards for VIPs / Artists',
        'Gate Access Control, Metal Detectors & Wristband Screening',
        'Parking Management & Emergency Rapid Response',
      ],
      cta: 'Inquire for Security',
      wa: 'Hi Manish! I want to inquire about Security Guard and Bodyguard services for my event.',
    },
  ],
  vendors: {
    eyebrow: 'Complete Package',
    title: 'All-In-One Vendor Services',
    subtitle: 'No need to contact 10 different people. Manish Kumar coordinates all required experts directly.',
    items: [
      { icon: 'Sparkles', title: 'Beautician & Makeup', desc: 'HD Bridal Makeup, Hair Styling & Saree Draping' },
      { icon: 'Flame', title: 'Pandit Ji', desc: 'Vedic Priests for Mandap rituals & Poojas' },
      { icon: 'Camera', title: 'Photography', desc: 'Candid, Traditional & Pre-wedding Shoots' },
      { icon: 'Video', title: 'Videography', desc: 'Teasers, Full Wedding Films & Drone Clips' },
      { icon: 'Flower2', title: 'Decoration', desc: 'Entrance Gates, Mandap, Lighting & Floral Stages' },
      { icon: 'Utensils', title: 'Catering', desc: 'North Indian, South Indian & Continental Menus' },
      { icon: 'Car', title: 'Transportation Facility', desc: 'Bridal Luxury Cars, Guest AC Buses & Airport Pickup' },
      { icon: 'ShieldCheck', title: 'Security & Bodyguards', desc: 'Trained Bouncers, VIP Bodyguards & Gate Protocol' },
    ],
  },
  process: {
    eyebrow: 'Systematic Execution',
    title: 'How We Work',
    subtitle: 'Our simple 4-step process ensures a smooth, stress-free event from start to finish.',
    steps: [
      {
        title: 'Initial Consultation',
        text: 'We discuss your vision, event scale, tentative dates, guest count, and budget parameters via phone call or in-person meeting in Patna.',
      },
      {
        title: 'Custom Proposal & Planning',
        text: 'We present a detailed event concept blueprint, vendor line-up, design mood board, and itemized quotation customized to your needs.',
      },
      {
        title: 'Flawless On-Ground Execution',
        text: 'On the event day, Manish Kumar and the team oversee venue setup, vendor arrivals, stage cues, sound, and timeline management.',
      },
      {
        title: 'Post-Event Wrap-Up',
        text: 'Final vendor settlement, photo/video deliverable tracking, and ensuring complete satisfaction for your family or organization.',
      },
    ],
  },
  cta: {
    title: "Let's Discuss Your Event Requirements",
    text: 'Get a custom quote and vendor recommendation for your upcoming event in Patna.',
    primary: { label: 'Consult on WhatsApp', wa: 'Hi Manish! I want to consult on an upcoming event.' },
    secondary: { label: 'Go to Contact Form', href: '/contact' },
  },
};

/* ───────────────────────────── About ───────────────────────────── */

export const aboutPage = {
  hero: {
    title: 'About Reviere Events',
    subtitle: 'Founded & Directed by Manish Kumar — Your Trusted Event Partner in Patna, Bihar.',
    crumb: 'About',
  },
  bio: {
    imageAlt: 'Manish Kumar — Owner & Director, Reviere Events',
    eyebrow: 'Founder & Lead Director',
    title: 'Transforming Visions into Extraordinary Experiences',
    // Paragraphs keep the original's emphasised runs: [text, emphasised?]
    paragraphs: [
      [
        ['Welcome to ', false],
        ['Reviere Events', true],
        ['. Led by founder and owner ', false],
        ['Manish Kumar', true],
        [', with over ', false],
        ['7+ years of hands-on experience', true],
        [' managing ', false],
        ['50+ large-scale events', true],
        [' across Patna and Bihar, we have built a reputation for delivering extraordinary, stress-free celebrations.', false],
      ],
      [
        [
          'From high-stakes corporate summits and university cultural festivals to intimate private celebrations and grand wedding galas, Manish brings creative vision, meticulous planning, and sharp on-ground leadership to every single event produced under the ',
          false,
        ],
        ['Reviere Events', true],
        [' banner.', false],
      ],
      [
        [
          'By handling venue logistics, lighting production, decoration styling, catering, and vendor alignment under a single point of contact, we allow hosts to be true guests at their own events.',
          false,
        ],
      ],
    ] as [string, boolean][][],
    stats: [
      { value: '50+', label: 'EVENTS MANAGED' },
      { value: '7+', label: 'YEARS EXPERIENCE' },
      { value: '150+', label: 'HAPPY CLIENTS' },
    ],
  },
  dance: {
    title: 'Also a Professional Dance Performer & Choreographer',
    paragraph: [
      ['Beyond event management, Manish is an accomplished dancer trained at the prestigious ', false],
      ['M.D.S Dance Station', true],
      [' in Patna under Minku Kumar. He currently teaches at ', false],
      ['Trang Dance Classes', true],
      [' & ', false],
      ['Moonlight Dance Studio', true],
      ['. He brings live dance performances, Sangeet choreography, and stage direction as an exclusive option for events.', false],
    ] as [string, boolean][],
    styles: ['Contemporary', 'BollyHop', 'Salsa', 'Bachata'],
  },
  quote: {
    text: 'Every event is a story. My job is to make it one worth telling.',
    by: '— Manish Kumar',
  },
  journey: {
    eyebrow: 'Journey & Milestones',
    title: 'The Path to Excellence',
    subtitle: "How dedication and passion built Patna's preferred event management service.",
    steps: [
      {
        title: 'Foundation & Performance Training',
        text: 'Mastered dance and stage choreography at M.D.S Dance Station under Minku Kumar, establishing a strong understanding of stage aesthetics, lighting, and audience management.',
      },
      {
        title: 'Stage Direction & Studio Association',
        text: 'Joined Trang Dance Classes and Moonlight Dance Studio as instructor and choreographer, directing live performances and Sangeet shows across Patna.',
      },
      {
        title: 'Reviere Events Launch',
        text: "Expanded into end-to-end luxury event management as Reviere Events, establishing direct partnerships with Patna's top beauticians, priests, decorators, caterers, and media production crews.",
      },
      {
        title: '50+ Events & Growing',
        text: "Today, with over 50+ successful events managed and 150+ happy clients, Reviere Events stands for elite event execution in Bihar under Manish Kumar's direction.",
      },
    ],
  },
  cta: {
    title: "Let's Plan Your Event Together",
    text: 'Connect with Manish Kumar at Reviere Events to turn your vision into an unforgettable experience.',
    primary: {
      label: 'Connect on WhatsApp',
      wa: 'Hi Manish! I read the Reviere Events about page and would like to discuss an upcoming event.',
    },
    secondary: { label: 'Send an Inquiry', href: '/contact' },
  },
};

/* ───────────────────────────── Contact ───────────────────────────── */

export const contactPage = {
  hero: {
    title: 'Get In Touch',
    subtitle: 'Ready to make your upcoming event extraordinary? Send us an inquiry or chat directly on WhatsApp.',
    crumb: 'Contact',
  },
  form: {
    eyebrow: 'Quick Inquiry',
    title: 'Plan Your Event With Us',
    intro: 'Fill out the form below. Submitting will generate a pre-filled WhatsApp message for fast, direct communication.',
    name: { label: 'Your Name *', placeholder: 'e.g. Ankit Sharma' },
    phone: { label: 'Phone / WhatsApp Number *', placeholder: '+91 88935 35829' },
    eventType: {
      label: 'Event Type / Service Required *',
      options: [
        'Wedding Planning & Reception',
        'Corporate Event / Seminar',
        'Private Birthday / Celebration',
        'Transportation Facility & Fleet Logistics',
        'Security Guards, Bouncers & Bodyguard',
        'Stage Dance Show / Choreography',
        'College Fest Management',
        'Destination Event',
        'All-in-One Full Event Package',
        'Other Custom Event',
      ],
    },
    date: { label: 'Tentative Event Date' },
    message: {
      label: 'Event Details / Requirements',
      placeholder: 'Share your location in Patna, estimated guest count, theme ideas, or budget...',
    },
    submit: 'Submit & Chat on WhatsApp',
    status: 'Opening WhatsApp with your inquiry...',
  },
  info: {
    title: 'Contact Information',
    main: { title: 'Main Phone & WhatsApp', link: 'Chat on WhatsApp →', wa: 'Hi Manish! I would like to inquire about event planning.' },
    email: { title: 'Official Email', note: 'Send event briefs & RFPs' },
    location: { title: 'Location', note: 'Serving Patna, Muzaffarpur, Gaya, and destination events across Bihar.' },
    hours: { title: 'Consultation Hours', value: 'Mon - Sun: 9:00 AM - 9:00 PM' },
    follow: 'Follow Our Work',
  },
  mapSrc:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115133.01016834015!2d85.07300224168434!3d25.6081755716186!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed58dce6732867%3A0x4059f39a1ac82f06!2sPatna%2C%20Bihar!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
};

export { buildInquiryMessage } from './inquiry.ts';

export const waLink = (message: string) => `https://wa.me/${site.whatsappPhone}?text=${encodeURIComponent(message)}`;
