const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const prisma = new PrismaClient();

function genToken() {
  return crypto.randomBytes(12).toString('hex');
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('🌱 Seeding EventCEO AI database...');

  // Clear existing data
  await prisma.competitionRegistration.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.aiPlan.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.guestFunction.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.eventFunction.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Create organizer user
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const organizer = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'demo@eventceo.ai',
      name: 'Priya Sharma',
      passwordHash,
    }
  });
  console.log('✅ Created organizer:', organizer.email);

  // ─────────────────────────────────────────────
  // WEDDING EVENT
  // ─────────────────────────────────────────────
  const wedding = await prisma.event.create({
    data: {
      id: uuidv4(),
      slug: 'sharma-kapoor-wedding-2027',
      title: 'Sharma – Kapoor Wedding',
      type: 'wedding',
      date: daysFromNow(45),
      endDate: daysFromNow(47),
      venue: 'The Grand Palace Banquet Hall',
      city: 'Mumbai',
      description: 'The joyous union of Rahul Sharma & Priya Kapoor. A 3-day celebration spanning mehendi, sangeet, wedding, and reception.',
      guestCount: 300,
      budget: 2500000,
      currency: 'INR',
      publicToken: genToken(),
      language: 'hi',
      organizerId: organizer.id,
    }
  });

  // Wedding functions
  const weddingFunctions = await Promise.all([
    prisma.eventFunction.create({ data: { eventId: wedding.id, name: 'Mehendi', date: daysFromNow(43), venue: 'Garden Lawn', startTime: '16:00', endTime: '22:00', order: 1 } }),
    prisma.eventFunction.create({ data: { eventId: wedding.id, name: 'Sangeet', date: daysFromNow(44), venue: 'Rooftop Terrace', startTime: '19:00', endTime: '01:00', order: 2 } }),
    prisma.eventFunction.create({ data: { eventId: wedding.id, name: 'Wedding Ceremony', date: daysFromNow(45), venue: 'Main Hall', startTime: '10:00', endTime: '14:00', order: 3 } }),
    prisma.eventFunction.create({ data: { eventId: wedding.id, name: 'Reception', date: daysFromNow(45), venue: 'Grand Ballroom', startTime: '19:00', endTime: '23:00', order: 4 } }),
  ]);

  // Wedding guests
  const weddingGuestData = [
    { name: 'Amit Sharma', email: 'amit@example.com', phone: '9876543210', group: 'Family', mealPref: 'veg', rsvpStatus: 'yes', partySize: 4 },
    { name: 'Sunita Kapoor', email: 'sunita@example.com', phone: '9876543211', group: 'Family', mealPref: 'veg', rsvpStatus: 'yes', partySize: 3 },
    { name: 'Rohit Mehta', email: 'rohit@example.com', phone: '9876543212', group: 'Friends', mealPref: 'nonveg', rsvpStatus: 'yes', partySize: 2 },
    { name: 'Kavya Nair', email: 'kavya@example.com', phone: '9876543213', group: 'Friends', mealPref: 'veg', rsvpStatus: 'maybe', partySize: 1 },
    { name: 'Vikram Singh', email: 'vikram@example.com', phone: '9876543214', group: 'Colleagues', mealPref: 'nonveg', rsvpStatus: 'no', partySize: 0 },
    { name: 'Meera Iyer', email: 'meera@example.com', phone: '9876543215', group: 'Family', mealPref: 'vegan', rsvpStatus: 'yes', partySize: 2 },
    { name: 'Arjun Patel', email: 'arjun@example.com', phone: '9876543216', group: 'Friends', mealPref: 'nonveg', rsvpStatus: 'yes', partySize: 3, checkedIn: true },
    { name: 'Deepika Rao', email: 'deepika@example.com', phone: '9876543217', group: 'Colleagues', mealPref: 'veg', rsvpStatus: 'pending', partySize: 1 },
  ];

  for (const g of weddingGuestData) {
    await prisma.guest.create({
      data: {
        eventId: wedding.id,
        name: g.name, email: g.email, phone: g.phone,
        group: g.group, mealPref: g.mealPref,
        rsvpStatus: g.rsvpStatus, partySize: g.partySize,
        checkedIn: g.checkedIn || false,
        checkedInAt: g.checkedIn ? new Date() : null,
        rsvpAt: g.rsvpStatus !== 'pending' ? new Date() : null,
        qrToken: genToken(),
      }
    });
  }

  // Wedding tasks
  const weddingTasks = [
    { title: 'Book main venue', category: 'Venue', owner: 'Priya', dueDate: daysFromNow(-30), priority: 'urgent', status: 'done', progress: 100 },
    { title: 'Finalize catering menu', category: 'Catering', owner: 'Rahul', dueDate: daysFromNow(10), priority: 'high', status: 'in_progress', progress: 60 },
    { title: 'Book photographer & videographer', category: 'Photography', owner: 'Priya', dueDate: daysFromNow(5), priority: 'high', status: 'done', progress: 100 },
    { title: 'Send out invitations', category: 'Invitations', owner: 'Priya', dueDate: daysFromNow(7), priority: 'urgent', status: 'in_progress', progress: 40 },
    { title: 'Arrange transportation', category: 'Logistics', owner: 'Rahul', dueDate: daysFromNow(20), priority: 'medium', status: 'todo', progress: 0 },
    { title: 'Book mehendi artist', category: 'Entertainment', owner: 'Priya', dueDate: daysFromNow(15), priority: 'high', status: 'done', progress: 100 },
    { title: 'Order wedding cake', category: 'Catering', owner: 'Rahul', dueDate: daysFromNow(30), priority: 'medium', status: 'todo', progress: 0 },
    { title: 'Arrange floral decorations', category: 'Decor', owner: 'Priya', dueDate: daysFromNow(14), priority: 'high', status: 'in_progress', progress: 30 },
    { title: 'Book DJ for sangeet', category: 'Entertainment', owner: 'Rahul', dueDate: daysFromNow(12), priority: 'high', status: 'done', progress: 100 },
    { title: 'Organize guest accommodation', category: 'Logistics', owner: 'Priya', dueDate: daysFromNow(25), priority: 'medium', status: 'todo', progress: 0 },
  ];
  for (let i = 0; i < weddingTasks.length; i++) {
    await prisma.task.create({ data: { eventId: wedding.id, ...weddingTasks[i], order: i } });
  }

  // Wedding budget
  const weddingBudget = [
    { category: 'Venue', name: 'Grand Palace Hall Rental', estimated: 800000, actual: 750000, paid: 375000, vendor: 'Grand Palace Events' },
    { category: 'Catering', name: 'Food & Beverages (300 pax)', estimated: 600000, actual: 620000, paid: 310000, vendor: 'Royal Feast Caterers' },
    { category: 'Photography', name: 'Photography & Videography', estimated: 150000, actual: 160000, paid: 80000, vendor: 'PixelPerfect Studios' },
    { category: 'Decor', name: 'Floral & Stage Decoration', estimated: 250000, actual: 0, paid: 0, vendor: 'Bloom & Drape' },
    { category: 'Entertainment', name: 'DJ & Live Music', estimated: 100000, actual: 95000, paid: 47500, vendor: 'DJ Beats Mumbai' },
    { category: 'Bridal', name: 'Bridal Lehenga & Jewellery', estimated: 300000, actual: 320000, paid: 320000 },
    { category: 'Transport', name: 'Guest Transportation', estimated: 80000, actual: 0, paid: 0 },
    { category: 'Invitations', name: 'Printed Invitations & Gifts', estimated: 60000, actual: 45000, paid: 45000 },
    { category: 'Miscellaneous', name: 'Contingency', estimated: 160000, actual: 0, paid: 0 },
  ];
  for (const b of weddingBudget) {
    await prisma.budgetItem.create({ data: { eventId: wedding.id, ...b } });
  }

  console.log('✅ Wedding event seeded');

  // ─────────────────────────────────────────────
  // BIRTHDAY EVENT (Surprise Mode)
  // ─────────────────────────────────────────────
  const birthday = await prisma.event.create({
    data: {
      id: uuidv4(),
      slug: 'arjun-30th-birthday-bash',
      title: "Arjun's 30th Birthday Bash 🎉",
      type: 'birthday',
      date: daysFromNow(14),
      venue: 'Sky Lounge, Bandra',
      city: 'Mumbai',
      description: "Arjun's surprise 30th birthday party! Keep it hush hush 🤫",
      guestCount: 50,
      budget: 80000,
      currency: 'INR',
      publicToken: genToken(),
      surpriseMode: true,
      organizerId: organizer.id,
    }
  });

  const birthdayGuests = [
    { name: 'Sneha Reddy', email: 's.reddy@example.com', group: 'Friends', rsvpStatus: 'yes', partySize: 1, mealPref: 'veg' },
    { name: 'Karan Johar (not that one)', email: 'kj@example.com', group: 'Friends', rsvpStatus: 'yes', partySize: 2, mealPref: 'nonveg' },
    { name: 'Ananya Desai', email: 'ananya@example.com', group: 'College Friends', rsvpStatus: 'maybe', partySize: 1, mealPref: 'veg' },
    { name: 'Rohan Verma', email: 'rohan@example.com', group: 'Work', rsvpStatus: 'yes', partySize: 1, mealPref: 'nonveg', checkedIn: true },
    { name: 'Arjun Kumar', email: 'arjun.k@example.com', group: 'Family', rsvpStatus: 'pending', partySize: 1, mealPref: 'veg', isHonorGuest: true },
  ];
  for (const g of birthdayGuests) {
    await prisma.guest.create({
      data: {
        eventId: birthday.id, name: g.name, email: g.email,
        group: g.group, rsvpStatus: g.rsvpStatus, partySize: g.partySize,
        mealPref: g.mealPref, checkedIn: g.checkedIn || false,
        checkedInAt: g.checkedIn ? new Date() : null,
        rsvpAt: g.rsvpStatus !== 'pending' ? new Date() : null,
        isHonorGuest: g.isHonorGuest || false, qrToken: genToken(),
      }
    });
  }

  const birthdayTasks = [
    { title: 'Book Sky Lounge venue', category: 'Venue', owner: 'Sneha', dueDate: daysFromNow(-5), priority: 'urgent', status: 'done', progress: 100 },
    { title: 'Order custom birthday cake', category: 'Catering', owner: 'Ananya', dueDate: daysFromNow(10), priority: 'high', status: 'in_progress', progress: 50 },
    { title: 'Arrange surprise reveal plan', category: 'Entertainment', owner: 'Karan', dueDate: daysFromNow(12), priority: 'high', status: 'in_progress', progress: 70 },
    { title: 'Buy decorations & balloons', category: 'Decor', owner: 'Rohan', dueDate: daysFromNow(13), priority: 'medium', status: 'todo', progress: 0 },
    { title: 'Create photo slideshow', category: 'Entertainment', owner: 'Sneha', dueDate: daysFromNow(11), priority: 'medium', status: 'in_progress', progress: 40 },
    { title: 'Send secret invites', category: 'Invitations', owner: 'Ananya', dueDate: daysFromNow(3), priority: 'urgent', status: 'done', progress: 100 },
  ];
  for (let i = 0; i < birthdayTasks.length; i++) {
    await prisma.task.create({ data: { eventId: birthday.id, ...birthdayTasks[i], order: i } });
  }

  const birthdayBudget = [
    { category: 'Venue', name: 'Sky Lounge Rental (4 hrs)', estimated: 25000, actual: 25000, paid: 25000, vendor: 'Sky Lounge Events' },
    { category: 'Catering', name: 'Snacks, Drinks & Cake', estimated: 20000, actual: 18000, paid: 18000 },
    { category: 'Decor', name: 'Balloons, Streamers & Setup', estimated: 8000, actual: 0, paid: 0 },
    { category: 'Entertainment', name: 'Playlist & Sound System', estimated: 10000, actual: 10000, paid: 5000 },
    { category: 'Gifts', name: 'Return gifts for guests', estimated: 10000, actual: 0, paid: 0 },
    { category: 'Miscellaneous', name: 'Photography & Other', estimated: 7000, actual: 0, paid: 0 },
  ];
  for (const b of birthdayBudget) {
    await prisma.budgetItem.create({ data: { eventId: birthday.id, ...b } });
  }
  console.log('✅ Birthday event seeded');

  // ─────────────────────────────────────────────
  // COLLEGE EVENT
  // ─────────────────────────────────────────────
  const college = await prisma.event.create({
    data: {
      id: uuidv4(),
      slug: 'techfest-2027-iit-bombay',
      title: 'TechFest 2027 – IIT Bombay',
      type: 'college',
      date: daysFromNow(30),
      endDate: daysFromNow(32),
      venue: 'IIT Bombay Campus',
      city: 'Mumbai',
      description: 'Asia\'s largest college technical festival. Hackathons, robotics, workshops, and more!',
      guestCount: 5000,
      budget: 5000000,
      currency: 'INR',
      publicToken: genToken(),
      organizerId: organizer.id,
    }
  });

  // Competitions
  const hackathon = await prisma.competition.create({
    data: {
      eventId: college.id,
      name: 'AI Hackathon',
      description: 'Build an AI-powered solution in 24 hours',
      category: 'Technology',
      maxTeamSize: 4,
      prize: '₹1,00,000 + internship offers',
    }
  });

  const robotics = await prisma.competition.create({
    data: {
      eventId: college.id,
      name: 'Robowar',
      description: 'Robot combat competition',
      category: 'Robotics',
      maxTeamSize: 6,
      prize: '₹75,000',
    }
  });

  // Competition registrations
  const registrations = [
    { teamName: 'NeuralNinjas', members: JSON.stringify(['Aditya K', 'Priya M', 'Rohan S']), email: 'aditya@iitb.ac.in', phone: '9871234560' },
    { teamName: 'ByteBusters', members: JSON.stringify(['Sam T', 'Lea P', 'Nik G', 'Anya R']), email: 'sam@iitb.ac.in', phone: '9871234561' },
    { teamName: 'CodeCraft', members: JSON.stringify(['Raj V', 'Mia S']), email: 'raj@iitb.ac.in', phone: '9871234562' },
  ];
  for (const r of registrations) {
    await prisma.competitionRegistration.create({ data: { competitionId: hackathon.id, ...r } });
  }
  await prisma.competitionRegistration.create({
    data: { competitionId: robotics.id, teamName: 'RoboRavens', members: JSON.stringify(['Vik P', 'Esh K', 'Jay M']), email: 'vik@iitb.ac.in' }
  });

  const collegeGuests = [
    { name: 'Prof. Ramesh Kumar', email: 'ramesh@iitb.ac.in', group: 'Faculty', rsvpStatus: 'yes', partySize: 1 },
    { name: 'Aditya Kulkarni', email: 'aditya@iitb.ac.in', group: 'Students', rsvpStatus: 'yes', partySize: 1 },
    { name: 'Sneha Joshi', email: 'sneha@iitb.ac.in', group: 'Students', rsvpStatus: 'yes', partySize: 1 },
    { name: 'Tech Corp Sponsor', email: 'sponsor@techcorp.com', group: 'Sponsors', rsvpStatus: 'yes', partySize: 3 },
  ];
  for (const g of collegeGuests) {
    await prisma.guest.create({ data: { eventId: college.id, qrToken: genToken(), mealPref: 'veg', ...g, rsvpAt: new Date() } });
  }

  const collegeTasks = [
    { title: 'Confirm venue with admin', category: 'Venue', status: 'done', priority: 'urgent', progress: 100, dueDate: daysFromNow(-20) },
    { title: 'Onboard sponsors', category: 'Sponsorship', status: 'in_progress', priority: 'high', progress: 60, dueDate: daysFromNow(10) },
    { title: 'Setup registration portal', category: 'Tech', status: 'done', priority: 'high', progress: 100, dueDate: daysFromNow(-10) },
    { title: 'Print participation certificates', category: 'Admin', status: 'todo', priority: 'medium', progress: 0, dueDate: daysFromNow(28) },
    { title: 'Arrange accommodation for outstation participants', category: 'Logistics', status: 'in_progress', priority: 'high', progress: 30, dueDate: daysFromNow(20) },
    { title: 'Set up judging panel for Hackathon', category: 'Events', status: 'todo', priority: 'high', progress: 0, dueDate: daysFromNow(25) },
  ];
  for (let i = 0; i < collegeTasks.length; i++) {
    await prisma.task.create({ data: { eventId: college.id, ...collegeTasks[i], order: i } });
  }

  const collegeBudget = [
    { category: 'Venue', name: 'Auditorium & Open Ground', estimated: 500000, actual: 500000, paid: 250000 },
    { category: 'Prizes', name: 'Competition Prizes Pool', estimated: 1000000, actual: 1000000, paid: 0 },
    { category: 'Marketing', name: 'Banners, Social Media, PR', estimated: 300000, actual: 280000, paid: 280000 },
    { category: 'Catering', name: 'Food Stalls & Meals (2 days)', estimated: 800000, actual: 0, paid: 0 },
    { category: 'Tech', name: 'AV Equipment & Internet', estimated: 500000, actual: 480000, paid: 480000 },
    { category: 'Guests', name: 'Keynote Speaker Fees & Travel', estimated: 400000, actual: 400000, paid: 200000 },
    { category: 'Miscellaneous', name: 'Contingency & Misc', estimated: 1500000, actual: 0, paid: 0 },
  ];
  for (const b of collegeBudget) {
    await prisma.budgetItem.create({ data: { eventId: college.id, ...b } });
  }
  console.log('✅ College event seeded');

  // ─────────────────────────────────────────────
  // COMMUNITY EVENT
  // ─────────────────────────────────────────────
  const community = await prisma.event.create({
    data: {
      id: uuidv4(),
      slug: 'mumbai-diwali-mela-2027',
      title: 'Mumbai Diwali Mela 2027 🪔',
      type: 'community',
      date: daysFromNow(20),
      endDate: daysFromNow(22),
      venue: 'Shivaji Park, Dadar',
      city: 'Mumbai',
      description: 'A grand community Diwali celebration open to all. Lights, food, music, and joy for the entire neighbourhood!',
      guestCount: 2000,
      budget: 500000,
      currency: 'INR',
      publicToken: genToken(),
      organizerId: organizer.id,
    }
  });

  // Donations
  const donationData = [
    { donorName: 'Suresh Patel', amount: 25000, message: 'Happy Diwali to all!', isAnonymous: false },
    { donorName: 'Anonymous', amount: 10000, message: 'For the community 🪔', isAnonymous: true },
    { donorName: 'Kapoor Family Trust', amount: 50000, message: 'Proud to support', isAnonymous: false },
    { donorName: 'Tech Mumbai Inc.', amount: 75000, message: 'Corporate CSR contribution', isAnonymous: false },
    { donorName: 'Resident 7B', amount: 5000, message: '', isAnonymous: true },
    { donorName: 'Sharmila Devi', amount: 15000, message: 'Jai Lakshmi Mata! 🙏', isAnonymous: false },
  ];
  for (const d of donationData) {
    await prisma.donation.create({ data: { eventId: community.id, ...d } });
  }

  const communityGuests = [
    { name: 'Balwant Singh', email: 'balwant@example.com', group: 'Committee', rsvpStatus: 'yes', partySize: 4 },
    { name: 'Fatima Shaikh', email: 'fatima@example.com', group: 'Volunteers', rsvpStatus: 'yes', partySize: 2 },
    { name: 'Rajan Nair', email: 'rajan@example.com', group: 'Sponsors', rsvpStatus: 'yes', partySize: 2 },
  ];
  for (const g of communityGuests) {
    await prisma.guest.create({ data: { eventId: community.id, qrToken: genToken(), mealPref: 'veg', rsvpAt: new Date(), ...g } });
  }

  const communityTasks = [
    { title: 'Get BMC permission for Shivaji Park', category: 'Permits', status: 'done', priority: 'urgent', progress: 100, dueDate: daysFromNow(-15) },
    { title: 'Arrange lights & decoration', category: 'Decor', status: 'in_progress', priority: 'high', progress: 40, dueDate: daysFromNow(15) },
    { title: 'Book food stall vendors', category: 'Catering', status: 'done', priority: 'high', progress: 100, dueDate: daysFromNow(-5) },
    { title: 'Organize volunteer teams', category: 'Operations', status: 'in_progress', priority: 'high', progress: 70, dueDate: daysFromNow(10) },
    { title: 'Set up donation collection booths', category: 'Fundraising', status: 'todo', priority: 'medium', progress: 0, dueDate: daysFromNow(18) },
    { title: 'Arrange fire safety & first aid', category: 'Safety', status: 'todo', priority: 'urgent', progress: 0, dueDate: daysFromNow(17) },
    { title: 'Cultural program lineup', category: 'Entertainment', status: 'in_progress', priority: 'medium', progress: 80, dueDate: daysFromNow(12) },
  ];
  for (let i = 0; i < communityTasks.length; i++) {
    await prisma.task.create({ data: { eventId: community.id, ...communityTasks[i], order: i } });
  }

  const communityBudget = [
    { category: 'Venue', name: 'Park Booking & Setup', estimated: 50000, actual: 50000, paid: 50000 },
    { category: 'Decor', name: 'Diya, Lights & Decorations', estimated: 100000, actual: 0, paid: 0 },
    { category: 'Entertainment', name: 'Cultural Programs & Sound', estimated: 80000, actual: 75000, paid: 37500 },
    { category: 'Food', name: 'Food Court Stalls', estimated: 150000, actual: 0, paid: 0 },
    { category: 'Logistics', name: 'Security, Volunteers, First Aid', estimated: 70000, actual: 40000, paid: 40000 },
    { category: 'Marketing', name: 'Banners & Promotion', estimated: 30000, actual: 25000, paid: 25000 },
    { category: 'Misc', name: 'Contingency', estimated: 20000, actual: 0, paid: 0 },
  ];
  for (const b of communityBudget) {
    await prisma.budgetItem.create({ data: { eventId: community.id, ...b } });
  }
  console.log('✅ Community event seeded');

  console.log('\n🎉 Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Login: demo@eventceo.ai');
  console.log('🔑 Password: demo1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
