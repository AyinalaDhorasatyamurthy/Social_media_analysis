"""
services/regional_trending.py - InsightSphere STUDIO Regional Trending Intelligence Registry
Curated resilient backup catalog for global YouTube trending feeds across 10 sovereign nations.
Guarantees zero-downtime and 100% feed availability even during YouTube API quota exhaustion or network downtime.
"""

REGIONAL_TRENDING = {
    "IN": [
        {
            "video_id": "IN_TR_01",
            "title": "ISRO Chandrayaan Next Mission Update: Deep Space Telemetry & Lunar Rover Trajectory",
            "views": 24800000,
            "likes": "1.4M",
            "published_at": "2026-11-07T14:30:00Z",
            "channel_title": "ISRO Official",
            "thumbnail": "https://images.unsplash.com/photo-1517976487508-2b22bb8582d9?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_02",
            "title": "T-Series Mega Launch: Official Teaser & 8K Visual Album Premier",
            "views": 41200000,
            "likes": "2.8M",
            "published_at": "2026-11-06T18:00:00Z",
            "channel_title": "T-Series",
            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_03",
            "title": "Shark Tank India Season 5 - AI Robotics Startup Secures Record Deal!",
            "views": 18500000,
            "likes": "950K",
            "published_at": "2026-11-06T20:15:00Z",
            "channel_title": "SET India",
            "thumbnail": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_04",
            "title": "India vs Australia Cricket Champions Trophy 2026 Highlights - Thrilling Final Over",
            "views": 32900000,
            "likes": "2.1M",
            "published_at": "2026-11-05T16:45:00Z",
            "channel_title": "BCCI TV",
            "thumbnail": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_05",
            "title": "CarryMinati - Modern Reality 2: Satirical Deep Dive into Viral Algorithms",
            "views": 27400000,
            "likes": "3.2M",
            "published_at": "2026-11-05T12:00:00Z",
            "channel_title": "CarryMinati",
            "thumbnail": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_06",
            "title": "Bhuvan Bam's Dhindora 2 Official Trailer - BB Ki Vines",
            "views": 19200000,
            "likes": "1.7M",
            "published_at": "2026-11-04T15:30:00Z",
            "channel_title": "BB Ki Vines",
            "thumbnail": "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_07",
            "title": "Technical Guruji - Quantum Processor Smartphone Unboxing & 6G Benchmark",
            "views": 8400000,
            "likes": "520K",
            "published_at": "2026-11-04T10:00:00Z",
            "channel_title": "Technical Guruji",
            "thumbnail": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_08",
            "title": "Ranveer Allahbadia x Dr. S. Jaishankar: Global Geopolitics & India's 2030 Vision",
            "views": 12600000,
            "likes": "810K",
            "published_at": "2026-11-03T18:00:00Z",
            "channel_title": "BeerBiceps",
            "thumbnail": "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_09",
            "title": "Dhruv Rathee: The Artificial Superintelligence Revolution Explained Simply",
            "views": 15800000,
            "likes": "1.1M",
            "published_at": "2026-11-03T13:30:00Z",
            "channel_title": "Dhruv Rathee",
            "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "IN_TR_10",
            "title": "Sony SAB: Taarak Mehta Ka Ooltah Chashmah - Gokuldham's Grand Celebration Episode",
            "views": 14200000,
            "likes": "630K",
            "published_at": "2026-11-02T20:30:00Z",
            "channel_title": "Sony SAB",
            "thumbnail": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "US": [
        {
            "video_id": "US_TR_01",
            "title": "$1,000,000 Every Minute You Survive In The Sub-Zero Arctic Bunker!",
            "views": 78500000,
            "likes": "4.9M",
            "published_at": "2026-11-07T16:00:00Z",
            "channel_title": "MrBeast",
            "thumbnail": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "US_TR_02",
            "title": "MKBHD - The Futuristic Neural Apple Glass Review: The Real Future?",
            "views": 16400000,
            "likes": "890K",
            "published_at": "2026-11-06T15:00:00Z",
            "channel_title": "Marques Brownlee",
            "thumbnail": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "US_TR_03",
            "title": "NASA James Webb Space Telescope Discovers Habitable Exoplanet Ocean Atmosphere",
            "views": 22100000,
            "likes": "1.3M",
            "published_at": "2026-11-06T11:00:00Z",
            "channel_title": "NASA",
            "thumbnail": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "US_TR_04",
            "title": "Hot Ones: Christopher Nolan Cries Over The Last Dab While Dissecting Cinema",
            "views": 14900000,
            "likes": "780K",
            "published_at": "2026-11-05T17:00:00Z",
            "channel_title": "First We Feast",
            "thumbnail": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "US_TR_05",
            "title": "Mark Rober: I Built a Hyperloop Rollercoaster In My Backyard",
            "views": 38200000,
            "likes": "2.4M",
            "published_at": "2026-11-04T18:00:00Z",
            "channel_title": "Mark Rober",
            "thumbnail": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "US_TR_06",
            "title": "Veritasium - The Infinite Energy Paradox That Broke Quantum Physics",
            "views": 19800000,
            "likes": "1.1M",
            "published_at": "2026-11-03T19:00:00Z",
            "channel_title": "Veritasium",
            "thumbnail": "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "US_TR_07",
            "title": "Dude Perfect: Super Sonic Jet Plane Bottle Flip 2.0 (Mind Blowing!)",
            "views": 25600000,
            "likes": "1.6M",
            "published_at": "2026-11-02T16:00:00Z",
            "channel_title": "Dude Perfect",
            "thumbnail": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "US_TR_08",
            "title": "Lex Fridman Podcast #480 - Sam Altman on Artificial General Intelligence Timelines",
            "views": 11400000,
            "likes": "620K",
            "published_at": "2026-11-01T21:00:00Z",
            "channel_title": "Lex Fridman",
            "thumbnail": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "GB": [
        {
            "video_id": "GB_TR_01",
            "title": "Colin Furze: I Built a Working Jet-Powered Flying Hoverbike in My Bunker",
            "views": 17800000,
            "likes": "1.2M",
            "published_at": "2026-11-07T13:00:00Z",
            "channel_title": "colinfurze",
            "thumbnail": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "GB_TR_02",
            "title": "The Graham Norton Show: Cillian Murphy & Tom Hardy Red Chair Laugh Out Loud",
            "views": 12900000,
            "likes": "640K",
            "published_at": "2026-11-06T22:30:00Z",
            "channel_title": "The Graham Norton Show",
            "thumbnail": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "GB_TR_03",
            "title": "BBC Earth: David Attenborough Reveals Never-Before-Seen Deep Sea Bioluminescence",
            "views": 21500000,
            "likes": "1.5M",
            "published_at": "2026-11-05T19:00:00Z",
            "channel_title": "BBC Earth",
            "thumbnail": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "GB_TR_04",
            "title": "Sidemen 24-Hour Deserted Island Survival Challenge (£100,000 Prize)",
            "views": 29400000,
            "likes": "2.1M",
            "published_at": "2026-11-04T18:00:00Z",
            "channel_title": "Sidemen",
            "thumbnail": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "GB_TR_05",
            "title": "Premier League Highlights: Arsenal vs Manchester City 4-3 Classic Clash",
            "views": 33100000,
            "likes": "1.9M",
            "published_at": "2026-11-03T20:00:00Z",
            "channel_title": "Sky Sports Premier League",
            "thumbnail": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "AU": [
        {
            "video_id": "AU_TR_01",
            "title": "Supercar Blondie: Driving The $15M Fully Electric Holographic Hypercar!",
            "views": 31200000,
            "likes": "1.6M",
            "published_at": "2026-11-07T12:00:00Z",
            "channel_title": "Supercar Blondie",
            "thumbnail": "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "AU_TR_02",
            "title": "LazarBeam - We Broken The Most Insane Fortnite World Record Ever",
            "views": 24500000,
            "likes": "1.4M",
            "published_at": "2026-11-06T14:00:00Z",
            "channel_title": "LazarBeam",
            "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "AU_TR_03",
            "title": "Primitive Technology: Building a Full Stone Iron Smelting Furnace From Mud",
            "views": 19800000,
            "likes": "1.3M",
            "published_at": "2026-11-05T09:00:00Z",
            "channel_title": "Primitive Technology",
            "thumbnail": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "AU_TR_04",
            "title": "Mighty Car Mods: Twin Turbo V8 Swap In A Tiny Japanese Kei Van!",
            "views": 9400000,
            "likes": "580K",
            "published_at": "2026-11-04T11:00:00Z",
            "channel_title": "Mighty Car Mods",
            "thumbnail": "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "CA": [
        {
            "video_id": "CA_TR_01",
            "title": "Linus Tech Tips: We Built The Ultimate 256-Core Liquid Nitrogen Supercomputer",
            "views": 18200000,
            "likes": "1.1M",
            "published_at": "2026-11-07T17:00:00Z",
            "channel_title": "Linus Tech Tips",
            "thumbnail": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "CA_TR_02",
            "title": "Unbox Therapy: The Most Ridiculous $100,000 Futuristic Tech Setup!",
            "views": 15400000,
            "likes": "890K",
            "published_at": "2026-11-06T19:00:00Z",
            "channel_title": "Unbox Therapy",
            "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "CA_TR_03",
            "title": "The Weeknd: Official Live From Toronto Stadium 8K World Tour",
            "views": 39500000,
            "likes": "2.4M",
            "published_at": "2026-11-05T20:00:00Z",
            "channel_title": "The Weeknd",
            "thumbnail": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "JP": [
        {
            "video_id": "JP_TR_01",
            "title": "Anime Season Premier: Jujutsu Kaisen & Demon Slayer New Arc 4K Official Trailer",
            "views": 48200000,
            "likes": "3.1M",
            "published_at": "2026-11-07T10:00:00Z",
            "channel_title": "TOHO animation",
            "thumbnail": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "JP_TR_02",
            "title": "Nintendo Direct: Next Gen Console Official Unveil & Super Mario 3D World 2",
            "views": 36700000,
            "likes": "2.5M",
            "published_at": "2026-11-06T13:00:00Z",
            "channel_title": "Nintendo Official",
            "thumbnail": "https://images.unsplash.com/photo-1612287232258-c7e6c3fd66bb?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "JP_TR_03",
            "title": "Shinkansen Maglev 600km/h High Speed Cabin View from Tokyo to Osaka",
            "views": 14100000,
            "likes": "820K",
            "published_at": "2026-11-05T08:00:00Z",
            "channel_title": "Japan Railway Discovery",
            "thumbnail": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "KR": [
        {
            "video_id": "KR_TR_01",
            "title": "BTS Reunion World Tour 2026: Official MV Comeback & Global Stadium Announcement",
            "views": 92400000,
            "likes": "7.8M",
            "published_at": "2026-11-07T09:00:00Z",
            "channel_title": "HYBE LABELS",
            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "KR_TR_02",
            "title": "BLACKPINK: New Global Anthem Live Visualizer & Behind The Scenes",
            "views": 68100000,
            "likes": "5.4M",
            "published_at": "2026-11-06T11:00:00Z",
            "channel_title": "BLACKPINK",
            "thumbnail": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "KR_TR_03",
            "title": "T1 vs Gen.G: League of Legends Worlds 2026 Grand Final Faker Clutch Ace",
            "views": 25800000,
            "likes": "1.7M",
            "published_at": "2026-11-05T15:00:00Z",
            "channel_title": "LCK Global",
            "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "DE": [
        {
            "video_id": "DE_TR_01",
            "title": "Kurzgesagt: What Happens If We Detonate All Uranium On Mars at Once?",
            "views": 28400000,
            "likes": "1.9M",
            "published_at": "2026-11-07T15:00:00Z",
            "channel_title": "Kurzgesagt – In a Nutshell",
            "thumbnail": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "DE_TR_02",
            "title": "Porsche 911 GT3 RS: Breaking Nürburgring All-Time Lap Record in the Wet",
            "views": 16900000,
            "likes": "940K",
            "published_at": "2026-11-06T16:30:00Z",
            "channel_title": "Porsche Official",
            "thumbnail": "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "DE_TR_03",
            "title": "Bundesliga: Bayern Munich vs Borussia Dortmund 5-4 Thriller Match Recap",
            "views": 21800000,
            "likes": "1.2M",
            "published_at": "2026-11-05T21:00:00Z",
            "channel_title": "Bundesliga",
            "thumbnail": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "FR": [
        {
            "video_id": "FR_TR_01",
            "title": "Squeezie: Le Plus Grand Tournoi de Créateurs Français au Stade de France!",
            "views": 23400000,
            "likes": "1.8M",
            "published_at": "2026-11-07T18:00:00Z",
            "channel_title": "SQUEEZIE",
            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "FR_TR_02",
            "title": "Cannes Film Festival 2026 Palme d'Or Masterpiece: Official Red Carpet Premiere",
            "views": 14200000,
            "likes": "750K",
            "published_at": "2026-11-06T20:00:00Z",
            "channel_title": "Festival de Cannes",
            "thumbnail": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "FR_TR_03",
            "title": "Paris Saint-Germain: UEFA Champions League Quarter-Final Historic Comeback",
            "views": 27900000,
            "likes": "1.6M",
            "published_at": "2026-11-05T22:00:00Z",
            "channel_title": "PSG - Paris Saint-Germain",
            "thumbnail": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=70"
        }
    ],

    "BR": [
        {
            "video_id": "BR_TR_01",
            "title": "Felipe Neto: O Desafio Mais Insano do YouTube Brasil com R$ 1.000.000",
            "views": 34100000,
            "likes": "2.6M",
            "published_at": "2026-11-07T17:30:00Z",
            "channel_title": "Felipe Neto",
            "thumbnail": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "BR_TR_02",
            "title": "KondZilla: O Novo Hit do Funk Paulista Que Bateu Recordes Globais no YouTube",
            "views": 52600000,
            "likes": "3.8M",
            "published_at": "2026-11-06T19:00:00Z",
            "channel_title": "Canal KondZilla",
            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=70"
        },
        {
            "video_id": "BR_TR_03",
            "title": "Seleção Brasileira: Melhores Momentos da Copa América e Golaço de Vini Jr",
            "views": 39800000,
            "likes": "2.9M",
            "published_at": "2026-11-05T21:30:00Z",
            "channel_title": "CBF TV",
            "thumbnail": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=70"
        }
    ]
}

def get_curated_trending(region_code="IN"):
    """
    Returns curated high-impact viral videos for a specific region.
    Falls back to 'IN' or 'US' if an unlisted country code is passed.
    """
    code = (region_code or "IN").strip().upper()
    if code in REGIONAL_TRENDING:
        return list(REGIONAL_TRENDING[code])
    if "US" in REGIONAL_TRENDING:
        return list(REGIONAL_TRENDING["US"])
    return list(REGIONAL_TRENDING.get("IN", []))
