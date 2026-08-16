import { db } from "./index";
import {
  categories,
  subcategories,
  services,
  banners,
  reviews,
  projectGallery,
  faqs,
  serviceAreas,
  serviceRequests,
  notifications,
  users,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding QuestMore database...");

  // Clear existing data
  await db.delete(notifications);
  await db.delete(serviceRequests);
  await db.delete(projectGallery);
  await db.delete(faqs);
  await db.delete(serviceAreas);
  await db.delete(reviews);
  await db.delete(services);
  await db.delete(subcategories);
  await db.delete(categories);
  await db.delete(banners);
  await db.delete(users);

  // ─── CATEGORIES ───
  const cats = await db.insert(categories).values([
    {
      name: "Construction",
      slug: "construction",
      description: "Building, renovation, and structural construction services",
      icon: "building",
      imageUrl: "https://images.pexels.com/photos/11321791/pexels-photo-11321791.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 1,
    },
    {
      name: "Electrical",
      slug: "electrical",
      description: "Wiring, installations, solar power, and electrical systems",
      icon: "zap",
      imageUrl: "https://images.pexels.com/photos/27928762/pexels-photo-27928762.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 2,
    },
    {
      name: "Plumbing",
      slug: "plumbing",
      description: "Water systems, pipe fitting, drainage, and sanitation",
      icon: "droplets",
      imageUrl: "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 3,
    },
    {
      name: "Property",
      slug: "property",
      description: "Property inspection, valuation, management, and real estate",
      icon: "home",
      imageUrl: "https://images.pexels.com/photos/36622005/pexels-photo-36622005.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 4,
    },
    {
      name: "Maintenance",
      slug: "maintenance",
      description: "Repair, servicing, facility management, and upkeep",
      icon: "wrench",
      imageUrl: "https://images.pexels.com/photos/7347538/pexels-photo-7347538.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 5,
    },
    {
      name: "Engineering",
      slug: "engineering",
      description: "Structural, civil, mechanical, and environmental engineering",
      icon: "hard-hat",
      imageUrl: "https://images.pexels.com/photos/35082119/pexels-photo-35082119.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 6,
    },
  ]).returning();

  // ─── SUBCATEGORIES & SERVICES ───
  const constSubs = await db.insert(subcategories).values([
    { categoryId: cats[0].id, name: "Foundation Work", slug: "foundation", description: "Solid foundations for every structure", icon: "layers", sortOrder: 1 },
    { categoryId: cats[0].id, name: "Roofing", slug: "roofing", description: "Durable roofing systems and installations", icon: "triangle", sortOrder: 2 },
    { categoryId: cats[0].id, name: "Block & Brickwork", slug: "blockwork", description: "Expert masonry and block laying", icon: "grid-3x3", sortOrder: 3 },
  ]).returning();

  await db.insert(services).values([
    { subcategoryId: constSubs[0].id, categoryId: cats[0].id, name: "Raft Foundation", slug: "raft-foundation", shortDescription: "Reinforced concrete raft foundations for residential and commercial buildings", fullDescription: "Our raft foundation service includes site preparation, excavation, steel reinforcement, and precision concrete pouring. Suitable for all soil types across Nigeria.", imageUrl: "https://images.pexels.com/photos/5335018/pexels-photo-5335018.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
    { subcategoryId: constSubs[0].id, categoryId: cats[0].id, name: "Pile Foundation", slug: "pile-foundation", shortDescription: "Deep pile foundations for high-rise and heavy structures", fullDescription: "Professional pile foundation installation for structures requiring deep support. Includes soil investigation, pile driving, and integrity testing.", imageUrl: "https://images.pexels.com/photos/4642437/pexels-photo-4642437.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: false, sortOrder: 2 },
    { subcategoryId: constSubs[1].id, categoryId: cats[0].id, name: "Aluminium Roofing", slug: "aluminium-roofing", shortDescription: "Long-lasting aluminium roofing for homes and commercial properties", fullDescription: "Premium aluminium roofing installation with proper insulation and waterproofing. Includes material selection, truss construction, and professional installation.", imageUrl: "https://images.pexels.com/photos/16368372/pexels-photo-16368372.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
    { subcategoryId: constSubs[2].id, categoryId: cats[0].id, name: "Block Laying & Setting", slug: "block-laying", shortDescription: "Professional block laying and concrete setting services", fullDescription: "Expert masonry services including block laying, plastering, and finishing. Our verified masons deliver precise, level walls.", imageUrl: "https://images.pexels.com/photos/11321791/pexels-photo-11321791.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: false, sortOrder: 1 },
  ]);

  const elecSubs = await db.insert(subcategories).values([
    { categoryId: cats[1].id, name: "House Wiring", slug: "house-wiring", description: "Residential electrical wiring and installations", icon: "cable", sortOrder: 1 },
    { categoryId: cats[1].id, name: "Solar Power", slug: "solar-power", description: "Solar panel installation and energy systems", icon: "sun", sortOrder: 2 },
  ]).returning();

  await db.insert(services).values([
    { subcategoryId: elecSubs[0].id, categoryId: cats[1].id, name: "Complete House Wiring", slug: "house-wiring-complete", shortDescription: "Full electrical wiring for new buildings and rewiring for existing ones", fullDescription: "Comprehensive electrical wiring service covering conduit installation, wire pulling, breaker panel setup, outlet and switch installation.", imageUrl: "https://images.pexels.com/photos/8488059/pexels-photo-8488059.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
    { subcategoryId: elecSubs[1].id, categoryId: cats[1].id, name: "Solar Panel Installation", slug: "solar-installation", shortDescription: "Complete solar power systems for homes and businesses", fullDescription: "End-to-end solar energy solutions including panel installation, inverter setup, battery systems, and grid integration.", imageUrl: "https://images.pexels.com/photos/27928762/pexels-photo-27928762.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
  ]);

  const plumbSubs = await db.insert(subcategories).values([
    { categoryId: cats[2].id, name: "Pipe Installation", slug: "pipe-installation", description: "Water and waste pipe installation", icon: "cylinder", sortOrder: 1 },
    { categoryId: cats[2].id, name: "Water Systems", slug: "water-systems", description: "Water treatment, storage, and distribution", icon: "droplets", sortOrder: 2 },
  ]).returning();

  await db.insert(services).values([
    { subcategoryId: plumbSubs[0].id, categoryId: cats[2].id, name: "Pipe Fitting & Repairs", slug: "pipe-fitting", shortDescription: "Expert pipe fitting, replacement, and leak repair services", fullDescription: "Professional pipe fitting service for new installations and emergency repairs.", imageUrl: "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
    { subcategoryId: plumbSubs[1].id, categoryId: cats[2].id, name: "Borehole Drilling", slug: "borehole-drilling", shortDescription: "Professional borehole drilling and water treatment systems", fullDescription: "Complete borehole drilling service including geological survey, drilling, casing, pump installation, and water treatment.", imageUrl: "https://images.pexels.com/photos/14953886/pexels-photo-14953886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: false, sortOrder: 1 },
  ]);

  const propSubs = await db.insert(subcategories).values([
    { categoryId: cats[3].id, name: "Inspection", slug: "inspection", description: "Building and property inspection services", icon: "search", sortOrder: 1 },
    { categoryId: cats[3].id, name: "Valuation", slug: "valuation", description: "Professional property valuation", icon: "badge-check", sortOrder: 2 },
  ]).returning();

  await db.insert(services).values([
    { subcategoryId: propSubs[0].id, categoryId: cats[3].id, name: "Building Inspection", slug: "building-inspection", shortDescription: "Comprehensive building inspection reports for buyers and owners", fullDescription: "Detailed structural and safety inspection of residential and commercial properties.", imageUrl: "https://images.pexels.com/photos/36622005/pexels-photo-36622005.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
    { subcategoryId: propSubs[1].id, categoryId: cats[3].id, name: "Property Valuation", slug: "property-valuation", shortDescription: "Certified property valuation for sale, purchase, or insurance", fullDescription: "Professional property valuation conducted by certified estate surveyors and valuers.", imageUrl: "https://images.pexels.com/photos/7937750/pexels-photo-7937750.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: false, sortOrder: 2 },
  ]);

  const maintSubs = await db.insert(subcategories).values([
    { categoryId: cats[4].id, name: "AC & HVAC", slug: "ac-hvac", description: "Air conditioning and ventilation services", icon: "wind", sortOrder: 1 },
    { categoryId: cats[4].id, name: "Painting", slug: "painting", description: "Interior and exterior painting services", icon: "paintbrush", sortOrder: 2 },
  ]).returning();

  await db.insert(services).values([
    { subcategoryId: maintSubs[0].id, categoryId: cats[4].id, name: "AC Installation & Repair", slug: "ac-installation", shortDescription: "Professional air conditioning installation, servicing, and repair", fullDescription: "Expert AC installation and maintenance for split units, central systems, and industrial air conditioning.", imageUrl: "https://images.pexels.com/photos/7347538/pexels-photo-7347538.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
    { subcategoryId: maintSubs[1].id, categoryId: cats[4].id, name: "Interior & Exterior Painting", slug: "painting-service", shortDescription: "Quality interior and exterior painting with premium materials", fullDescription: "Professional painting services for homes and commercial properties with premium paints.", imageUrl: "https://images.pexels.com/photos/4642437/pexels-photo-4642437.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: false, sortOrder: 1 },
  ]);

  const engSubs = await db.insert(subcategories).values([
    { categoryId: cats[5].id, name: "Structural", slug: "structural", description: "Structural design and analysis", icon: "columns-3", sortOrder: 1 },
    { categoryId: cats[5].id, name: "Civil", slug: "civil", description: "Infrastructure and civil engineering", icon: "landmark", sortOrder: 2 },
  ]).returning();

  await db.insert(services).values([
    { subcategoryId: engSubs[0].id, categoryId: cats[5].id, name: "Structural Design", slug: "structural-design", shortDescription: "Professional structural design for residential and commercial buildings", fullDescription: "Complete structural engineering services including analysis, design, and drawings for buildings.", imageUrl: "https://images.pexels.com/photos/35082119/pexels-photo-35082119.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: true, sortOrder: 1 },
    { subcategoryId: engSubs[1].id, categoryId: cats[5].id, name: "Road Construction", slug: "road-construction", shortDescription: "Professional road design, construction, and rehabilitation", fullDescription: "Civil engineering services for road construction including survey, design, earthworks, and finishing.", imageUrl: "https://images.pexels.com/photos/35340757/pexels-photo-35340757.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", featured: false, sortOrder: 2 },
  ]);

  // ─── BANNERS ───
  await db.insert(banners).values([
    {
      title: "Quality Construction Services",
      subtitle: "Verified professionals for every project in Abuja and beyond",
      imageUrl: "https://images.pexels.com/photos/36622005/pexels-photo-36622005.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 1,
    },
    {
      title: "Solar Power Solutions",
      subtitle: "Reduce energy costs with professional solar installations",
      imageUrl: "https://images.pexels.com/photos/27928762/pexels-photo-27928762.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 2,
    },
    {
      title: "Home Maintenance Made Easy",
      subtitle: "AC repair, plumbing, electrical — one platform for all your needs",
      imageUrl: "https://images.pexels.com/photos/7347538/pexels-photo-7347538.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      sortOrder: 3,
    },
  ]);

  // ─── REVIEWS ───
  await db.insert(reviews).values([
    { clientName: "Adebayo O.", rating: 5, comment: "QuestMore connected us with an excellent team for our office renovation. Work was completed on time and to a very high standard.", location: "Abuja", featured: true },
    { clientName: "Ngozi E.", rating: 5, comment: "I needed emergency plumbing repair and QuestMore sent someone within hours. The plumber was professional and fixed everything perfectly.", location: "Lagos", featured: true },
    { clientName: "Chidi M.", rating: 5, comment: "Used QuestMore for a complete house wiring project. The electrician was knowledgeable and neat. Highly recommend.", location: "Abuja", featured: true },
    { clientName: "Fatima A.", rating: 4, comment: "Great platform for finding reliable services. Used them for building inspection before purchasing a property. Thorough report!", location: "Kaduna", featured: true },
  ]);

  // ─── PROJECT GALLERY (Before/After) ───
  await db.insert(projectGallery).values([
    {
      categoryId: cats[0].id,
      title: "Residential Building - Wuse, Abuja",
      description: "Complete construction from foundation to finishing. 4-bedroom duplex built in 8 months.",
      beforeImageUrl: "https://images.pexels.com/photos/5335018/pexels-photo-5335018.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      afterImageUrl: "https://images.pexels.com/photos/36622005/pexels-photo-36622005.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      location: "Wuse, Abuja",
      featured: true,
    },
    {
      categoryId: cats[4].id,
      title: "Office Painting - Victoria Island",
      description: "Complete interior and exterior painting for a 3-floor office building.",
      beforeImageUrl: "https://images.pexels.com/photos/4642437/pexels-photo-4642437.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      afterImageUrl: "https://images.pexels.com/photos/7937750/pexels-photo-7937750.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      location: "Victoria Island, Lagos",
      featured: true,
    },
    {
      categoryId: cats[1].id,
      title: "Solar Installation - Gwarinpa",
      description: "10kW solar system installation for residential use. Complete energy independence.",
      beforeImageUrl: "https://images.pexels.com/photos/8488059/pexels-photo-8488059.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      afterImageUrl: "https://images.pexels.com/photos/27928762/pexels-photo-27928762.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      location: "Gwarinpa, Abuja",
      featured: true,
    },
  ]);

  // ─── FAQs ───
  await db.insert(faqs).values([
    { question: "How do I request a service?", answer: "Simply browse our services, select what you need, and fill out the request form. Our team will contact you within 24 hours to discuss your requirements and provide a professional.", sortOrder: 1 },
    { question: "Are your professionals verified?", answer: "Yes! Every professional on QuestMore goes through a rigorous verification process including ID verification, skill assessment, and background checks.", sortOrder: 2 },
    { question: "What areas do you cover?", answer: "We currently serve Abuja (FCT), Lagos, Kaduna, and Port Harcourt. We're expanding to more cities soon!", sortOrder: 3 },
    { question: "How much do services cost?", answer: "Pricing varies based on the scope of work. After you submit a request, we'll assess your needs and provide a transparent quote before any work begins.", sortOrder: 4 },
    { question: "What if I'm not satisfied with the work?", answer: "Your satisfaction is guaranteed. If you're not happy with the work, contact us within 48 hours and we'll send another professional or provide a refund.", sortOrder: 5 },
    { question: "Can I schedule services for a specific date?", answer: "Absolutely! When submitting your request, you can specify your preferred date and time. We'll do our best to accommodate your schedule.", sortOrder: 6 },
    { question: "Do you offer emergency services?", answer: "Yes, we offer emergency services for urgent issues like plumbing leaks, electrical faults, and AC breakdowns. Mark your request as 'Emergency' for priority handling.", sortOrder: 7 },
    { question: "How do I contact QuestMore?", answer: "You can reach us via WhatsApp at +234 815 630 7091, email at hello@questmore.com, or through the app's contact feature.", sortOrder: 8 },
  ]);

  // ─── SERVICE AREAS ───
  await db.insert(serviceAreas).values([
    { name: "Wuse", state: "FCT Abuja" },
    { name: "Garki", state: "FCT Abuja" },
    { name: "Maitama", state: "FCT Abuja" },
    { name: "Asokoro", state: "FCT Abuja" },
    { name: "Gwarinpa", state: "FCT Abuja" },
    { name: "Jabi", state: "FCT Abuja" },
    { name: "Kubwa", state: "FCT Abuja" },
    { name: "Lugbe", state: "FCT Abuja" },
    { name: "Victoria Island", state: "Lagos" },
    { name: "Lekki", state: "Lagos" },
    { name: "Ikoyi", state: "Lagos" },
    { name: "Ikeja", state: "Lagos" },
    { name: "Kaduna North", state: "Kaduna" },
    { name: "Kaduna South", state: "Kaduna" },
    { name: "Port Harcourt City", state: "Rivers" },
  ]);

  // ─── DEMO USER ───
  const [demoUser] = await db.insert(users).values([
    {
      fullName: "Demo User",
      email: "demo@questmore.com",
      phone: "+2348156307091",
      verified: true,
    },
  ]).returning();

  // ─── DEMO SERVICE REQUESTS (for Activity tab) ───
  await db.insert(serviceRequests).values([
    {
      userId: demoUser.id,
      fullName: "Demo User",
      email: "demo@questmore.com",
      phone: "+2348156307091",
      categoryId: cats[0].id,
      description: "Need to build a 3-bedroom bungalow foundation",
      location: "Gwarinpa, Abuja",
      address: "Plot 123, 4th Avenue, Gwarinpa, Abuja",
      urgency: "this_week",
      status: "in_progress",
      statusNote: "Foundation work has started. Expected completion in 5 days.",
    },
    {
      userId: demoUser.id,
      fullName: "Demo User",
      email: "demo@questmore.com",
      phone: "+2348156307091",
      categoryId: cats[1].id,
      description: "Install solar panels for my home - 5kW system",
      location: "Wuse, Abuja",
      address: "12 Aminu Kano Crescent, Wuse 2, Abuja",
      urgency: "flexible",
      status: "completed",
      statusNote: "Installation completed successfully. System is operational.",
    },
    {
      userId: demoUser.id,
      fullName: "Demo User",
      email: "demo@questmore.com",
      phone: "+2348156307091",
      categoryId: cats[2].id,
      description: "Fix leaking pipes in bathroom",
      location: "Maitama, Abuja",
      address: "5 Yedseram Street, Maitama, Abuja",
      urgency: "urgent",
      status: "pending",
      statusNote: "Your request is being reviewed. We will assign a plumber shortly.",
    },
  ]);

  // ─── DEMO NOTIFICATIONS ───
  await db.insert(notifications).values([
    {
      userId: demoUser.id,
      title: "Request Confirmed",
      message: "Your foundation construction request has been confirmed. Work will begin on Monday.",
      type: "request_update",
      read: false,
    },
    {
      userId: demoUser.id,
      title: "Solar Installation Complete",
      message: "Great news! Your solar panel installation is complete. Enjoy clean energy!",
      type: "request_update",
      read: true,
    },
    {
      userId: demoUser.id,
      title: "Weekend Special",
      message: "Get 10% off on all maintenance services this weekend. Use code WEEKEND10.",
      type: "promotion",
      read: false,
    },
  ]);

  console.log("✅ QuestMore database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
