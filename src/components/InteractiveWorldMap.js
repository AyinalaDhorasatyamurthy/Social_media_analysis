import React, { useState } from "react";
import styled, { keyframes } from "styled-components";

const pulseGlow = keyframes`
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.9; }
`;

const MapWrapper = styled.div`
  background: #181818;
  border: 1px solid #272727;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.12);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
`;

const MapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .map-title {
    color: #f8fafc;
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge-live {
    font-size: 0.75rem;
    font-weight: 700;
    color: #FF0000;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 3px 10px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 5px;

    &::before {
      content: "";
      width: 6px;
      height: 6px;
      background: #FF0000;
      border-radius: 50%;
      box-shadow: 0 0 8px #FF0000;
    }
  }

  .instructions {
    color: #94a3b8;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

const SvgContainer = styled.div`
  width: 100%;
  position: relative;

  svg {
    width: 100%;
    height: auto;
    display: block;
    filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.6));
  }

  .country-path {
    fill: #242424;
    stroke: #333333;
    stroke-width: 1;
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    &:hover {
      fill: #cc0000;
      stroke: #FF0000;
      stroke-width: 1.8;
      filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.75));
    }
  }

  .continent-base {
    fill: #1c1c1c;
    stroke: #2a2a2a;
    stroke-width: 0.75;
    transition: fill 0.25s;
    cursor: pointer;

    &:hover {
      fill: #242424;
      stroke: #3b82f6;
    }
  }

  .country-active {
    fill: #FF0000 !important;
    stroke: #ffffff !important;
    stroke-width: 2.2 !important;
    filter: drop-shadow(0 0 16px rgba(99, 102, 241, 0.95)) !important;
  }

  .beacon-group {
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.25);
    }
  }
`;

const HudCard = styled.div`
  position: absolute;
  top: 1.25rem;
  right: 1.5rem;
  background: #212121;
  backdrop-filter: blur(12px);
  border: 1px solid #333333;
  border-radius: 12px;
  padding: 0.75rem 1.15rem;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  max-width: 380px;
  pointer-events: none;
  animation: ${pulseGlow} 4s infinite ease-in-out;

  .flag-icon {
    font-size: 2rem;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  .info-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .top-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .country-name {
    font-size: 1rem;
    font-weight: 800;
    color: #f1f5f9;
    letter-spacing: -0.01em;
  }

  .status-tag {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #FF0000;
    background: rgba(56, 189, 248, 0.15);
    padding: 1px 6px;
    border-radius: 4px;
  }

  .creator-preview {
    color: #cbd5e1;
    font-size: 0.78rem;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }

  .hint-action {
    color: #3ea6ff;
    font-size: 0.72rem;
    font-weight: 600;
  }

  @media (max-width: 640px) {
    position: static;
    max-width: 100%;
    margin-bottom: 1rem;
  }
`;

const QuickPillsBar = styled.div`
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  .bar-title {
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 0.25rem;
  }
`;

const HubPill = styled.button`
  background: ${(props) => (props.$active ? "#4f46e5" : "rgba(30, 41, 59, 0.75)")};
  color: ${(props) => (props.$active ? "#ffffff" : "#cbd5e1")};
  border: 1px solid ${(props) => (props.$active ? "#3ea6ff" : "rgba(71, 85, 105, 0.6)")};
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(props) => (props.$active ? "0 0 14px #333333" : "none")};

  &:hover {
    background: ${(props) => (props.$active ? "#4338ca" : "rgba(51, 65, 85, 0.9)")};
    border-color: #3ea6ff;
    color: #ffffff;
    transform: translateY(-1px);
  }
`;

const SubRegionBar = styled.div`
  margin-top: 0.75rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #272727;
  border-radius: 12px;
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;

  .label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #93c5fd;
    text-transform: uppercase;
  }
`;

// Major Global Hubs (including Sri Lanka and Pan-Africa)
const HUBS = [
  { id: "gb", country: "UK", name: "United Kingdom", flag: "🇬🇧", x: 495, y: 110, creators: "DanTDM, Sidemen, Mrwhosetheboss, KSI, Colin Furze (12+ Verified)" },
  { id: "de", country: "Germany", name: "Germany", flag: "🇩🇪", x: 535, y: 108, creators: "Kurzgesagt, Pamela Reif, freekickerz, MontanaBlack, Julien Bam (10+ Verified)" },
  { id: "us", country: "US", name: "United States", flag: "🇺🇸", x: 235, y: 155, creators: "MrBeast, Mark Rober, Dude Perfect, MKBHD, Veritasium (12+ Verified)" },
  { id: "ca", country: "Canada", name: "Canada", flag: "🇨🇦", x: 275, y: 120, creators: "Linus Tech Tips, Unbox Therapy, Hacksmith, Lilly Singh, AsapSCIENCE (12+ Verified)" },
  { id: "sa", country: "South America", name: "South America (Brazil & Argentina)", flag: "🌎", x: 345, y: 325, creators: "KondZilla, Luccas Neto, Whindersson, Felipe Neto, Bizarrap (11+ Verified)" },
  { id: "africa", country: "Africa", name: "Pan-Africa", flag: "🌍", x: 530, y: 245, creators: "Diamond Platnumz, Mark Angel, Trevor Noah, Tayo Aina (15+ Verified)" },
  { id: "za", country: "South Africa", name: "South Africa", flag: "🇿🇦", x: 565, y: 360, creators: "Wian Magic, Caspar Lee, Trevor Noah, MacG, Dan Mace (10+ Verified)" },
  { id: "in_andhra", country: "Andhra", name: "India (Andhra & Telugu)", flag: "🇮🇳", x: 718, y: 220, creators: "Prasad Tech, Vismai Food, Filmymoji, Mahathalli, The Viva (12+ Verified)" },
  { id: "in_tamil", country: "Tamil", name: "India (Tamil Nadu)", flag: "🇮🇳", x: 712, y: 248, creators: "Village Cooking Channel, Madan Gowri, Mic Set, Parithabangal (10+ Verified)" },
  { id: "in_national", country: "IN", name: "India (Pan-India / Hindi)", flag: "🇮🇳", x: 710, y: 180, creators: "CarryMinati, Total Gaming, Dhruv Rathee, BB Ki Vines (15+ Verified)" },
  { id: "lk", country: "Sri Lanka", name: "Sri Lanka", flag: "🇱🇰", x: 724, y: 288, creators: "Wild Cookbook, Ape Amma, Wasthi, Ratta, Chanux Bro (10+ Verified)" },
  { id: "jp", country: "Japan", name: "Japan", flag: "🇯🇵", x: 888, y: 155, creators: "HikakinTV, Hajime Syacho, Sushi Ramen, Fischer's, JunsKitchen (10+ Verified)" },
  { id: "kr", country: "Korea", name: "South Korea", flag: "🇰🇷", x: 852, y: 150, creators: "1MILLION, JFlaMusic, Hamzy, Tzuyang, Korean Englishman (10+ Verified)" },
  { id: "ru", country: "Russia", name: "Russia", flag: "🇷🇺", x: 615, y: 95, creators: "A4 Vlad, SlivkiShow, Marmok, HiMan, Kuplinov, Wylsacom (10+ Verified)" },
  { id: "au", country: "Australia", name: "Australia", flag: "🇦🇺", x: 915, y: 355, creators: "Chloe Ting, LazarBeam, Primitive Technology, Fresh, ColdFusion (10+ Verified)" },
];

export const InteractiveWorldMap = ({ selectedRegion, onSelectCountry }) => {
  const [hoveredHub, setHoveredHub] = useState(null);

  const activeHub = HUBS.find(
    (h) =>
      h.country.toLowerCase() === (selectedRegion || "").toLowerCase() ||
      (selectedRegion?.toLowerCase() === "sri lanka" && h.id === "lk") ||
      (selectedRegion?.toLowerCase() === "srilanka" && h.id === "lk") ||
      (selectedRegion?.toLowerCase() === "lk" && h.id === "lk") ||
      (selectedRegion?.toLowerCase() === "africa" && h.id === "africa") ||
      (selectedRegion?.toLowerCase() === "pan-africa" && h.id === "africa") ||
      (selectedRegion?.toLowerCase() === "south africa" && h.id === "za") ||
      (selectedRegion?.toLowerCase() === "za" && h.id === "za") ||
      (selectedRegion?.toLowerCase() === "south america" && h.id === "sa") ||
      (selectedRegion?.toLowerCase() === "brazil" && h.id === "sa") ||
      (selectedRegion?.toLowerCase() === "argentina" && h.id === "sa") ||
      (selectedRegion?.toLowerCase() === "uk" && h.id === "gb") ||
      (selectedRegion?.toLowerCase() === "andhra" && h.id === "in_andhra") ||
      (selectedRegion?.toLowerCase() === "in" && h.id === "in_national") ||
      (selectedRegion?.toLowerCase() === "tamil" && h.id === "in_national")
  );

  const currentDisplay = hoveredHub || activeHub || {
    flag: "🌍",
    name: "Global Creator Atlas",
    creators: "Click any country beacon or pill below to benchmark verified creators",
    country: "All",
  };

  return (
    <MapWrapper>
      <MapHeader>
        <div className="title-group">
          <div className="map-title">
            <span>🗺️ Interactive Creator World Map</span>
          </div>
          <span className="badge-live">Live Vector Engine</span>
        </div>

        <div className="instructions">
          <span>👆 Click any country shape, pulsing beacon, or quick pill to explore creators</span>
        </div>
      </MapHeader>

      {/* Floating HUD Card */}
      <HudCard>
        <span className="flag-icon">{currentDisplay.flag}</span>
        <div className="info-content">
          <div className="top-label">
            <span className="country-name">{currentDisplay.name}</span>
            <span className="status-tag">
              {hoveredHub ? "Hovering" : activeHub ? "Active Hub" : "Global"}
            </span>
          </div>
          <div className="creator-preview">{currentDisplay.creators}</div>
          <span className="hint-action">
            {hoveredHub ? "Click to view creator analytics →" : "Benchmark & Audience Metrics"}
          </span>
        </div>
      </HudCard>

      <SvgContainer>
        <svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Grid Pattern */}
            <pattern id="world-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255, 255, 255, 0.035)" strokeWidth="0.5" />
            </pattern>

            {/* Glowing Beacon Radial Gradient */}
            <radialGradient id="glow-cyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="1" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="glow-indigo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="1" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid Background */}
          <rect width="1000" height="500" fill="url(#world-grid)" />

          {/* Latitude Guides */}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(99, 102, 241, 0.18)" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="0" y1="160" x2="1000" y2="160" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" strokeWidth="0.75" />
          <line x1="0" y1="340" x2="1000" y2="340" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" strokeWidth="0.75" />

          {/* ========================================================= */}
          {/* CONTINENTAL LANDMASSES & INTERACTIVE COUNTRIES           */}
          {/* ========================================================= */}

          {/* NORTH AMERICA: Canada & Alaska */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "canada" ? "country-active" : ""}`}
            d="M 80 50 C 110 40, 160 45, 210 40 C 260 35, 310 45, 360 65 C 390 80, 360 115, 320 125 C 280 135, 240 130, 200 128 C 160 125, 130 115, 110 95 C 95 80, 80 65, 80 50 Z M 325 35 C 345 25, 375 30, 395 50 C 375 60, 350 55, 325 35 Z"
            onClick={() => onSelectCountry("CA", "Canada")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "ca"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>Canada</title>
          </path>

          {/* NORTH AMERICA: United States */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "us" || selectedRegion?.toLowerCase() === "usa" ? "country-active" : ""}`}
            d="M 140 125 C 190 125, 260 130, 315 125 C 330 145, 335 175, 330 205 C 315 220, 290 225, 265 230 C 240 232, 215 225, 195 210 C 165 200, 145 170, 140 125 Z M 305 215 C 315 220, 325 240, 320 250 C 315 250, 308 235, 305 215 Z"
            onClick={() => onSelectCountry("US", "US")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "us"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>United States</title>
          </path>

          {/* 🌎 SOUTH AMERICA (Brazil, Argentina & Latin America) */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "south america" || selectedRegion?.toLowerCase() === "brazil" || selectedRegion?.toLowerCase() === "argentina" ? "country-active" : ""}`}
            d="M 265 235 C 285 228, 320 225, 345 235 C 375 250, 410 270, 405 305 C 400 335, 375 375, 350 410 C 335 435, 320 465, 310 475 C 302 465, 298 440, 292 410 C 280 365, 260 315, 255 280 C 252 255, 258 242, 265 235 Z"
            onClick={() => onSelectCountry("SA", "South America")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "sa"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>South America (Brazil & Argentina)</title>
          </path>

          {/* EUROPE: United Kingdom */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "uk" || selectedRegion?.toLowerCase() === "gb" ? "country-active" : ""}`}
            d="M 482 90 C 495 85, 506 92, 504 105 C 502 118, 492 125, 485 120 C 480 110, 480 98, 482 90 Z M 470 102 C 478 98, 480 110, 476 118 C 472 116, 468 110, 470 102 Z"
            onClick={() => onSelectCountry("GB", "UK")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "gb"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>United Kingdom</title>
          </path>

          {/* EUROPE: Germany & Central Europe */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "germany" || selectedRegion?.toLowerCase() === "de" ? "country-active" : ""}`}
            d="M 515 95 C 530 90, 550 92, 560 105 C 558 122, 545 132, 528 130 C 518 125, 512 110, 515 95 Z"
            onClick={() => onSelectCountry("DE", "Germany")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "de"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>Germany</title>
          </path>

          {/* EUROPE: Western & Southern Europe */}
          <path
            className="continent-base"
            d="M 465 125 C 490 120, 515 122, 510 145 C 500 170, 475 175, 455 170 C 450 150, 455 135, 465 125 Z M 520 135 C 535 145, 540 170, 530 185 C 522 175, 520 155, 520 135 Z M 510 60 C 530 45, 555 55, 560 85 C 545 90, 525 80, 510 60 Z"
          >
            <title>Western Europe</title>
          </path>

          {/* 🌍 AFRICA: Pan-Africa (Click for Pan-Africa creators) */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "africa" ? "country-active" : ""}`}
            d="M 460 175 C 475 165, 535 165, 560 175 C 575 190, 595 200, 615 220 C 630 240, 615 265, 595 285 C 585 305, 575 325, 560 330 C 530 330, 520 325, 505 310 C 495 295, 480 280, 465 270 C 445 260, 435 240, 440 220 C 445 195, 455 185, 460 175 Z"
            onClick={() => onSelectCountry("AFRICA", "Africa")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "africa"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>Africa (Pan-Africa)</title>
          </path>

          {/* 🇿🇦 AFRICA: South Africa (Interactive Zone) */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "south africa" || selectedRegion?.toLowerCase() === "za" ? "country-active" : ""}`}
            d="M 520 335 C 535 330, 565 332, 590 325 C 605 345, 600 375, 580 395 C 565 410, 545 415, 535 405 C 522 390, 515 365, 520 335 Z"
            onClick={() => onSelectCountry("ZA", "South Africa")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "za"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>South Africa</title>
          </path>

          {/* EURASIA: Russia */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "russia" || selectedRegion?.toLowerCase() === "ru" ? "country-active" : ""}`}
            d="M 565 85 C 620 70, 710 65, 800 60 C 860 62, 920 75, 955 85 C 930 115, 880 120, 830 118 C 760 115, 680 112, 610 110 C 575 105, 565 95, 565 85 Z"
            onClick={() => onSelectCountry("RU", "Russia")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "ru"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>Russia</title>
          </path>

          {/* ASIA: India */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "in" || selectedRegion?.toLowerCase() === "andhra" || selectedRegion?.toLowerCase() === "tamil" ? "country-active" : ""}`}
            d="M 680 160 C 710 150, 745 155, 755 180 C 750 215, 730 260, 715 275 C 700 250, 685 210, 675 185 C 672 170, 675 165, 680 160 Z"
            onClick={() => onSelectCountry("IN", "Andhra")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "in_andhra"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>India</title>
          </path>

          {/* 🇱🇰 ASIA: Sri Lanka (Interactive Island) */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "sri lanka" || selectedRegion?.toLowerCase() === "lk" ? "country-active" : ""}`}
            d="M 720 280 C 726 278, 730 288, 725 298 C 720 302, 715 292, 720 280 Z"
            onClick={() => onSelectCountry("LK", "Sri Lanka")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "lk"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>Sri Lanka</title>
          </path>

          {/* ASIA: China & East Asia */}
          <path
            className="continent-base"
            d="M 690 120 C 740 118, 800 115, 835 130 C 850 155, 835 185, 800 190 C 760 190, 745 175, 740 152 C 720 145, 700 135, 690 120 Z"
          >
            <title>East Asia</title>
          </path>

          {/* ASIA: South Korea */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "korea" || selectedRegion?.toLowerCase() === "kr" ? "country-active" : ""}`}
            d="M 845 142 C 855 140, 860 145, 858 160 C 852 168, 846 162, 845 152 Z"
            onClick={() => onSelectCountry("KR", "Korea")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "kr"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>South Korea</title>
          </path>

          {/* ASIA: Japan */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "japan" || selectedRegion?.toLowerCase() === "jp" ? "country-active" : ""}`}
            d="M 875 130 C 890 125, 905 135, 902 155 C 895 175, 878 185, 870 170 C 865 155, 870 140, 875 130 Z M 895 110 C 910 105, 915 120, 902 125 C 895 120, 892 112, 895 110 Z"
            onClick={() => onSelectCountry("JP", "Japan")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "jp"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>Japan</title>
          </path>

          {/* AUSTRALIA */}
          <path
            className={`country-path ${selectedRegion?.toLowerCase() === "australia" || selectedRegion?.toLowerCase() === "au" ? "country-active" : ""}`}
            d="M 830 315 C 875 300, 925 305, 940 335 C 950 370, 935 410, 890 415 C 850 415, 825 380, 820 345 C 818 330, 822 320, 830 315 Z M 895 425 C 905 422, 908 435, 900 440 C 894 438, 892 430, 895 425 Z"
            onClick={() => onSelectCountry("AU", "Australia")}
            onMouseEnter={() => setHoveredHub(HUBS.find((h) => h.id === "au"))}
            onMouseLeave={() => setHoveredHub(null)}
          >
            <title>Australia</title>
          </path>

          {/* ========================================================= */}
          {/* INTERACTIVE RADAR PULSE BEACONS                           */}
          {/* ========================================================= */}
          {HUBS.map((hub) => {
            const isSelected = activeHub?.id === hub.id;
            return (
              <g
                key={hub.id}
                className="beacon-group"
                onClick={() => onSelectCountry(hub.id.toUpperCase(), hub.country)}
                onMouseEnter={() => setHoveredHub(hub)}
                onMouseLeave={() => setHoveredHub(null)}
              >
                {/* Expanding animated radar wave */}
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r={isSelected ? 16 : 10}
                  fill={isSelected ? "rgba(165, 180, 252, 0.35)" : "rgba(56, 189, 248, 0.25)"}
                >
                  <animate
                    attributeName="r"
                    values={isSelected ? "10;22;10" : "6;14;6"}
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0.1;0.9"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Second concentric wave for selected hub */}
                {isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={26}
                    fill="none"
                    stroke="#a5b4fc"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  >
                    <animate
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${hub.x} ${hub.y}`}
                      to={`360 ${hub.x} ${hub.y}`}
                      dur="10s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Inner Glowing Center Pin */}
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r={isSelected ? 6.5 : 4.5}
                  fill={isSelected ? "#ffffff" : "#FF0000"}
                  stroke={isSelected ? "#4f46e5" : "#ffffff"}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  filter={isSelected ? "drop-shadow(0 0 8px #a5b4fc)" : "drop-shadow(0 0 5px #FF0000)"}
                />
              </g>
            );
          })}
        </svg>
      </SvgContainer>

      {/* Quick Select Region Pills (Includes Sri Lanka & Pan-Africa) */}
      <QuickPillsBar>
        <span className="bar-title">⚡ Select Region:</span>

        <HubPill
          $active={!selectedRegion || selectedRegion.toLowerCase() === "all"}
          onClick={() => onSelectCountry("ALL", "All")}
        >
          🌍 Worldwide
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "sri lanka" || selectedRegion?.toLowerCase() === "lk"}
          onClick={() => onSelectCountry("LK", "Sri Lanka")}
        >
          🇱🇰 Sri Lanka
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "africa"}
          onClick={() => onSelectCountry("AFRICA", "Africa")}
        >
          🌍 Pan-Africa
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "south africa" || selectedRegion?.toLowerCase() === "za"}
          onClick={() => onSelectCountry("ZA", "South Africa")}
        >
          🇿🇦 South Africa
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "south america" || selectedRegion?.toLowerCase() === "brazil"}
          onClick={() => onSelectCountry("SA", "South America")}
        >
          🌎 South America
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "in" || selectedRegion?.toLowerCase() === "andhra" || selectedRegion?.toLowerCase() === "tamil"}
          onClick={() => onSelectCountry("IN", "Andhra")}
        >
          🇮🇳 India
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "uk" || selectedRegion?.toLowerCase() === "gb"}
          onClick={() => onSelectCountry("GB", "UK")}
        >
          🇬🇧 UK
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "us" || selectedRegion?.toLowerCase() === "usa"}
          onClick={() => onSelectCountry("US", "US")}
        >
          🇺🇸 United States
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "germany" || selectedRegion?.toLowerCase() === "de"}
          onClick={() => onSelectCountry("DE", "Germany")}
        >
          🇩🇪 Germany
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "japan" || selectedRegion?.toLowerCase() === "jp"}
          onClick={() => onSelectCountry("JP", "Japan")}
        >
          🇯🇵 Japan
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "korea" || selectedRegion?.toLowerCase() === "kr"}
          onClick={() => onSelectCountry("KR", "Korea")}
        >
          🇰🇷 South Korea
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "russia" || selectedRegion?.toLowerCase() === "ru"}
          onClick={() => onSelectCountry("RU", "Russia")}
        >
          🇷🇺 Russia
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "canada" || selectedRegion?.toLowerCase() === "ca"}
          onClick={() => onSelectCountry("CA", "Canada")}
        >
          🇨🇦 Canada
        </HubPill>

        <HubPill
          $active={selectedRegion?.toLowerCase() === "australia" || selectedRegion?.toLowerCase() === "au"}
          onClick={() => onSelectCountry("AU", "Australia")}
        >
          🇦🇺 Australia
        </HubPill>
      </QuickPillsBar>

      {/* Sub-region state selector if India is active */}
      {(selectedRegion?.toLowerCase() === "andhra" ||
        selectedRegion?.toLowerCase() === "in" ||
        selectedRegion?.toLowerCase() === "tamil") && (
        <SubRegionBar>
          <span className="label">🇮🇳 India State Hubs:</span>
          <HubPill
            $active={selectedRegion?.toLowerCase() === "andhra"}
            onClick={() => onSelectCountry("IN", "Andhra")}
          >
            📍 Andhra Pradesh & Telangana (Telugu)
          </HubPill>
          <HubPill
            $active={selectedRegion?.toLowerCase() === "tamil"}
            onClick={() => onSelectCountry("IN", "Tamil")}
          >
            📍 Tamil Nadu (Tamil)
          </HubPill>
          <HubPill
            $active={selectedRegion?.toLowerCase() === "in"}
            onClick={() => onSelectCountry("IN", "IN")}
          >
            📍 Pan-India (Hindi / National)
          </HubPill>
        </SubRegionBar>
      )}
    </MapWrapper>
  );
};

export default InteractiveWorldMap;
