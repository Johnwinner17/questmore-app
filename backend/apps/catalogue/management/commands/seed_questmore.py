from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.catalogue.models import (
    Category, Subcategory, Service,
    ProviderProfession, Banner, Review,
    FAQ, ServiceArea
)
from apps.gallery.models import GalleryPhoto

class Command(BaseCommand):
    help = "Seed QuestMore database with certified engineering categories, services, and photo gallery."

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting QuestMore Database Seeding...")

        # 1. Create Superuser / Admin if not exists
        if not User.objects.filter(username="admin").exists():
            admin_user = User.objects.create_superuser(
                username="admin",
                email="admin@questmore.ng",
                password="adminpassword123",
                first_name="QuestMore",
                last_name="SuperAdmin"
            )
            self.stdout.write(self.style.SUCCESS("Created Superuser: admin (password: adminpassword123)"))

        # 2. Categories
        categories_data = [
            {
                "id": 1,
                "name": "Construction",
                "slug": "construction",
                "description": "Building, renovation, and structural construction services",
                "icon": "building",
                "image_url": "https://images.pexels.com/photos/11321791/pexels-photo-11321791.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
                "sort_order": 1,
            },
            {
                "id": 2,
                "name": "Electrical",
                "slug": "electrical",
                "description": "Wiring, installations, solar power, and electrical systems",
                "icon": "zap",
                "image_url": "https://images.pexels.com/photos/27928762/pexels-photo-27928762.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
                "sort_order": 2,
            },
            {
                "id": 3,
                "name": "Plumbing",
                "slug": "plumbing",
                "description": "Water systems, pipe fitting, drainage, and sanitation",
                "icon": "droplets",
                "image_url": "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
                "sort_order": 3,
            },
            {
                "id": 4,
                "name": "Property & Interiors",
                "slug": "property",
                "description": "Architectural planning, painting, roofing, and interior finishings",
                "icon": "home",
                "image_url": "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
                "sort_order": 4,
            },
        ]

        cat_objs = {}
        for c in categories_data:
            cat, _ = Category.objects.update_or_create(
                id=c["id"],
                defaults={
                    "name": c["name"],
                    "slug": c["slug"],
                    "description": c["description"],
                    "icon": c["icon"],
                    "image_url": c["image_url"],
                    "sort_order": c["sort_order"],
                    "active": True,
                }
            )
            cat_objs[c["id"]] = cat

        self.stdout.write(f"Seeded {len(cat_objs)} Categories.")

        # 3. Subcategories
        subcategories_data = [
            {"id": 1, "category_id": 1, "name": "Building & Structural", "slug": "building-structural", "description": "Foundations, framing, masonry, and full structural builds"},
            {"id": 2, "category_id": 1, "name": "Renovation & Remodeling", "slug": "renovation-remodeling", "description": "Home additions, kitchen and bath overhauls, commercial remodeling"},
            {"id": 3, "category_id": 1, "name": "Roofing & Ceiling", "slug": "roofing-ceiling", "description": "Roof trussing, stone-coated tiles, aluminum sheets, POP ceilings"},
            {"id": 4, "category_id": 1, "name": "Finishing & Masonry", "slug": "finishing-masonry", "description": "Plastering, screeding, tiling, and interlocking stones"},
            {"id": 5, "category_id": 2, "name": "Solar & Renewable Energy", "slug": "solar-energy", "description": "Solar PV arrays, lithium battery storage, hybrid inverters"},
            {"id": 6, "category_id": 2, "name": "House & Commercial Wiring", "slug": "wiring-installations", "description": "Conduit wiring, distribution boards, lighting systems, 3-phase setups"},
            {"id": 7, "category_id": 2, "name": "Security & Automation", "slug": "security-automation", "description": "CCTV, electric fencing, access control, smart home automation"},
            {"id": 8, "category_id": 2, "name": "Generator & Power Systems", "slug": "generators-power", "description": "Diesel generator installation, ATS panels, changeover switches"},
            {"id": 9, "category_id": 3, "name": "Borehole & Water Systems", "slug": "borehole-water", "description": "Industrial drilling, submersible pumps, overhead tanks, filtration"},
            {"id": 10, "category_id": 3, "name": "Piping & Drainage", "slug": "piping-drainage", "description": "PPR/PVC piping, sewage connections, soakaways, stormwater drainage"},
            {"id": 11, "category_id": 3, "name": "Sanitary & Bathroom Fittings", "slug": "sanitary-fittings", "description": "Water heaters, bathtubs, shower cabins, modern sanitary fixtures"},
            {"id": 12, "category_id": 3, "name": "Leak Detection & Repairs", "slug": "leak-repairs", "description": "Underground pipe diagnostics, high-pressure leak repairs, unclogging"},
            {"id": 13, "category_id": 4, "name": "Painting & Screeding", "slug": "painting-screeding", "description": "Interior satin, exterior emulsion, wall putty, decorative coatings"},
            {"id": 14, "category_id": 4, "name": "Interior Design & Fitout", "slug": "interior-fitout", "description": "3D space planning, modular kitchen cabinets, bespoke wardrobes"},
            {"id": 15, "category_id": 4, "name": "Doors, Windows & Glass", "slug": "doors-windows-glass", "description": "Security steel doors, tempered glass partitions, aluminum casements"},
            {"id": 16, "category_id": 4, "name": "Landscaping & Interlocking", "slug": "landscaping-paving", "description": "Concrete interlocking, curbs, drainage channels, compound greening"},
        ]

        sub_objs = {}
        for s in subcategories_data:
            sub, _ = Subcategory.objects.update_or_create(
                id=s["id"],
                defaults={
                    "category": cat_objs[s["category_id"]],
                    "name": s["name"],
                    "slug": s["slug"],
                    "description": s["description"],
                    "active": True,
                }
            )
            sub_objs[s["id"]] = sub

        self.stdout.write(f"Seeded {len(sub_objs)} Subcategories.")

        # 4. Services
        services_data = [
            {"id": 1, "sub_id": 1, "cat_id": 1, "name": "Residential Building Construction", "slug": "residential-building", "price": None, "featured": True, "img": "https://images.pexels.com/photos/11321791/pexels-photo-11321791.jpeg", "short": "Full structural development from foundation to completion."},
            {"id": 2, "sub_id": 1, "cat_id": 1, "name": "Commercial Complex Structural Work", "slug": "commercial-structural", "price": None, "featured": True, "img": "https://images.pexels.com/photos/8961438/pexels-photo-8961438.jpeg", "short": "Multi-storey commercial engineering with certified structural drawings."},
            {"id": 3, "sub_id": 2, "cat_id": 1, "name": "Full House Renovation & Retrofitting", "slug": "house-renovation", "price": None, "featured": False, "img": "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "short": "Complete property modernization, layout redesign, and QA upgrades."},
            {"id": 4, "sub_id": 3, "cat_id": 1, "name": "Roof Installation & Trussing", "slug": "roof-installation", "price": None, "featured": False, "img": "https://images.pexels.com/photos/14838424/pexels-photo-14838424.jpeg", "short": "High-grade wood & steel trussing with Gerard and aluminium roofing."},
            {"id": 5, "sub_id": 4, "cat_id": 1, "name": "Granite & Porcelain Tiling", "slug": "floor-tiling", "price": 45000, "featured": True, "img": "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "short": "Precision laser alignment for residential & commercial tiling."},
            {"id": 6, "sub_id": 5, "cat_id": 2, "name": "5KVA - 10KVA Solar Hybrid System", "slug": "solar-system-5kva", "price": 180000, "featured": True, "img": "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg", "short": "Pure sine wave hybrid inverter with Tier-1 solar panels and MPPT."},
            {"id": 7, "sub_id": 6, "cat_id": 2, "name": "Complete House Conduit Wiring", "slug": "conduit-wiring", "price": 75000, "featured": True, "img": "https://images.pexels.com/photos/27928762/pexels-photo-27928762.jpeg", "short": "Certified fire-resistant cable routing, distribution boards, and earthing."},
            {"id": 8, "sub_id": 7, "cat_id": 2, "name": "HD CCTV & Security Installation", "slug": "cctv-security", "price": 60000, "featured": False, "img": "https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg", "short": "8-channel 4K camera system with mobile live-stream setup."},
            {"id": 9, "sub_id": 8, "cat_id": 2, "name": "Generator ATS & Panel Setup", "slug": "generator-ats", "price": 35000, "featured": False, "img": "https://images.pexels.com/photos/5691659/pexels-photo-5691659.jpeg", "short": "Automatic changeover switch with timer and overload relay protection."},
            {"id": 10, "sub_id": 9, "cat_id": 3, "name": "Borehole Drilling & Submersible Pump", "slug": "borehole-drilling", "price": None, "featured": True, "img": "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg", "short": "Deep aquifer geo-survey, drilling, casing, and water treatment setup."},
            {"id": 11, "sub_id": 10, "cat_id": 3, "name": "Underground Drainage & Piping", "slug": "drainage-piping", "price": 50000, "featured": False, "img": "https://images.pexels.com/photos/5691659/pexels-photo-5691659.jpeg", "short": "PPR and PVC distribution networks with zero-leak guarantee."},
            {"id": 12, "sub_id": 11, "cat_id": 3, "name": "Water Heater Installation & Plumbing", "slug": "water-heater-install", "price": 25000, "featured": True, "img": "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg", "short": "Instant & storage water heater mounting, pressure valves, and testing."},
            {"id": 13, "sub_id": 13, "cat_id": 4, "name": "Interior Screeding & Wall Painting", "slug": "interior-painting", "price": 40000, "featured": True, "img": "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "short": "Smooth POP screeding finish with premium wash-resistant coatings."},
            {"id": 14, "sub_id": 14, "cat_id": 4, "name": "Modern Kitchen Cabinet & Wardrobes", "slug": "kitchen-cabinets", "price": None, "featured": True, "img": "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg", "short": "High-gloss HDF and marine board kitchen fittings with granite tops."},
        ]

        for s in services_data:
            Service.objects.update_or_create(
                id=s["id"],
                defaults={
                    "category": cat_objs[s["cat_id"]],
                    "subcategory": sub_objs.get(s["sub_id"]),
                    "name": s["name"],
                    "slug": s["slug"],
                    "short_description": s["short"],
                    "full_description": f"QuestMore certified {s['name']}. Includes engineering supervision, certified specialists, genuine materials, and 12-month quality guarantee.",
                    "image_url": s["img"],
                    "price": s["price"],
                    "featured": s["featured"],
                    "active": True,
                }
            )

        self.stdout.write(f"Seeded {len(services_data)} Services.")

        # 5. Professions
        professions_list = [
            ("Plumber", "plumber", "Water piping, leak repairs, bathroom fittings & drainage", "🔧"),
            ("Electrician", "electrician", "Conduit wiring, fault troubleshooting, distribution boards", "⚡"),
            ("Painter", "painter", "Interior & exterior wall painting, screeding & wallpaper", "🎨"),
            ("Carpenter", "carpenter", "Doors, kitchen cabinets, roofing timber & woodwork", "🪚"),
            ("Mason", "mason", "Bricklaying, plastering, interlocking & concrete work", "🧱"),
            ("Welder", "welder", "Metal fabrication, burglary proofing, gates & tanks", "🔥"),
            ("Solar Engineer", "solar-engineer", "Solar PV design, hybrid inverters & lithium batteries", "☀️"),
            ("HVAC / AC Technician", "hvac-technician", "Air conditioner servicing, installation & ducting", "❄️"),
            ("Tiler", "tiler", "Floor & wall ceramic, porcelain and granite tiling", "🔲"),
            ("Roofer", "roofer", "Stone-coated tiles, aluminium sheets & roof truss", "🏠"),
            ("Civil Engineer", "civil-engineer", "Site supervision, road design & drainage structures", "📐"),
            ("Structural Engineer", "structural-engineer", "Structural drawings, calculations & load audits", "🏗️"),
        ]

        for idx, (name, slug, desc, icon) in enumerate(professions_list, start=1):
            ProviderProfession.objects.update_or_create(
                id=idx,
                defaults={"name": name, "slug": slug, "description": desc, "icon": icon, "sort_order": idx, "active": True}
            )

        # 6. Banners
        banners_list = [
            ("Solar Power Systems", "Clean, reliable energy solutions with 5-year warranty", "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg"),
            ("Building Renovation", "Transform your residential or commercial space with expert engineers", "https://images.pexels.com/photos/8961438/pexels-photo-8961438.jpeg"),
            ("Borehole & Water Systems", "Complete water solution from drilling to filtration", "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg"),
        ]
        for idx, (title, sub, img) in enumerate(banners_list, start=1):
            Banner.objects.update_or_create(id=idx, defaults={"title": title, "subtitle": sub, "image_url": img, "sort_order": idx, "active": True})

        # 7. Reviews
        reviews_list = [
            ("Alhaji Ibrahim Musa", 5, "QuestMore handled our 10KVA solar inverter installation in Maitama. Done in 24 hours.", "Maitama, Abuja"),
            ("Engr. Ngozi Okafor", 5, "Top notch plumbing and water treatment. The quality verification gave us full peace of mind.", "Guzape, Abuja"),
            ("Mrs. Folake Adeleke", 5, "Screeding and painting was super clean with zero mess. Highly recommended!", "Wuse 2, Abuja"),
        ]
        for idx, (c_name, rating, comment, loc) in enumerate(reviews_list, start=1):
            Review.objects.update_or_create(id=idx, defaults={"client_name": c_name, "rating": rating, "comment": comment, "location": loc, "featured": True})

        # 8. Service Areas
        areas_list = [
            ("Maitama", "Abuja (FCT)"), ("Asokoro", "Abuja (FCT)"), ("Guzape", "Abuja (FCT)"),
            ("Wuse 2", "Abuja (FCT)"), ("Gwarinpa", "Abuja (FCT)"), ("Jabi", "Abuja (FCT)"),
            ("Victoria Island", "Lagos"), ("Ikoyi", "Lagos"), ("Lekki Phase 1", "Lagos"),
        ]
        for idx, (name, state) in enumerate(areas_list, start=1):
            ServiceArea.objects.update_or_create(id=idx, defaults={"name": name, "state": state, "active": True})

        # 9. Gallery Photos
        gallery_list = [
            ("5KVA Hybrid Solar PV Transformation", "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg", "https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg", "Guzape, Abuja"),
            ("Residential Building Renovation & Screeding", "https://images.pexels.com/photos/8961438/pexels-photo-8961438.jpeg", "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "Maitama, Abuja"),
            ("Industrial Water Treatment & Borehole Rig", "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg", "https://images.pexels.com/photos/7859953/pexels-photo-7859953.jpeg", "Wuse 2, Abuja"),
        ]
        for idx, (title, before, after, loc) in enumerate(gallery_list, start=1):
            GalleryPhoto.objects.update_or_create(
                id=idx,
                defaults={
                    "title": title,
                    "description": "Completed engineering project executed to QuestMore QA compliance standards.",
                    "before_image_url": before,
                    "after_image_url": after,
                    "location": loc,
                    "featured": True,
                    "sort_order": idx,
                }
            )

        self.stdout.write(self.style.SUCCESS("QuestMore Database Seeded Successfully! All tables ready."))
