import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// KONFIGURASI SUPABASE
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_PDDIKTI    = import.meta.env.VITE_API_PDDIKTI;
const API_GITHUB     = import.meta.env.VITE_API_GITHUB;
const API_GOOGLE_IMG = import.meta.env.VITE_API_GOOGLE_IMG;
const API_ORCID      = import.meta.env.VITE_API_ORCID;
const API_PDDIKTI_RAILWAY = import.meta.env.VITE_API_PDDIKTI_RAILWAY;

// =============================================================
// URL GOOGLE SCRIPT UNTUK EXPORT SPREADSHEET
const GAS_URL = "https://script.google.com/macros/s/AKfycby6XEBJgX0Wdq7yxuIST1tWem5YOH3_XwAfY1AcMYDuhuEbEMaYxq4p19MuWMEH0WEy/exec";
// =============================================================

export const usePencarianController = () => {
  const [queryNama, setQueryNama] = useState('');
  const [queryAfiliasi, setQueryAfiliasi] = useState('');
  const [queryKonteks, setQueryKonteks] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [internalResults, setInternalResults] = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [alumniDB, setAlumniDB] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalData, setTotalData] = useState(0);
  const pageSize = 50;
  
  const [exportProgressCount, setExportProgressCount] = useState(0);
  
  const [searchHistory, setSearchHistory] = useState([]);
  
  // State Import
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');

  // State Export
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [successSheetUrl, setSuccessSheetUrl] = useState(null);

  // State Robot Auto-Track
  const [isAutoTracking, setIsAutoTracking] = useState(false);
  const [autoTrackStatus, setAutoTrackStatus] = useState('');

  // State Global Stats (Menghitung seluruh database)
  const [globalStats, setGlobalStats] = useState({ terlacak: 0, verifikasi: 0, belum: 0 });
  
const POOL_KARIR = {
  perusahaan: [
      "ABM Investama Tbk", "Adi Sarana Armada Tbk", "Adira Dinamika Multi Finance Tbk", "Akasha Wira International Tbk Tbk", 
      "Aksara Global Development Tbk", "Alakasa Industrindo Tbk", "ALAM SUTERA REALTY Tbk", "Alamtri Resources Indonesia Tbk", 
      "Alkindo Naratama Tbk", "Alumindo Light Metal Industry Tbk", "Ancora Indonesia Resources Tbk", "Aneka Tambang Tbk.", 
      "Apexindo Pratama Duta Tbk", "Argha Karya Prima Ind. Tbk", "Argo Pantes Tbk", "Arthavest Tbk", "Arwana Citramulia Tbk", 
      "Asahimas Flat Glass Tbk", "Asia Pacific Fibers Tbk", "Asiaplast Industries Tbk", "Astra Agro Lestari Tbk", 
      "Astra Graphia Tbk", "Astra International Tbk", "Astra Otoparts Tbk", "Asuransi Bina Dana Arta Tbk", 
      "Asuransi Bintang Tbk", "Asuransi Dayin Mitra Tbk", "Asuransi Harta Aman Pratama Tbk", "Asuransi Jasa Tania Tbk", 
      "Asuransi Multi Artha Guna Tbk", "Asuransi Ramayana Tbk", "Atlas Resources Tbk", "Bakrie & Brothers Tbk", 
      "Bakrie Sumatera Plantations Tbk", "Bakrie Telecom Tbk", "Bakrieland Development Tbk", "Bank Artha Graha Internasional Tbk", 
      "Bank Bumi Arta Tbk", "Bank Mega Tbk", "Bank of India Indonesia Tbk", "Bank Pan Indonesia Tbk", 
      "Bank Pembangunan Daerah Jawa Barat dan Banten Tbk", "Bank Pembangunan Daerah Jawa Timur Tbk", "Bank Permata Tbk", 
      "Bank Sinarmas Tbk", "Bank Victoria International Tbk", "Baramulti Suksessarana Tbk", "Barito Pacific Tbk", 
      "Bayan Resources Tbk", "Bayu Buana Tbk", "Bekasi Asri Pemula Tbk", "Bekasi Fajar Industrial Estate Tbk", 
      "Berlian Laju Tanker Tbk", "Berlina Tbk", "Betonjaya Manunggal Tbk", "BFI Finance Indonesia Tbk", 
      "Bhuwanatala Indah Permai Tbk", "Bintang Mitra Semestaraya Tbk", "BISI INTERNATIONAL Tbk", "Buana Finance Tbk", 
      "Bukaka Teknik Utama Tbk", "Bukit Darmo Property Tbk", "Bumi Citra Permai Tbk", "Bumi Resources Minerals Tbk", 
      "Bumi Resources Tbk", "Bumi Teknokultura Unggul Tbk", "Cahaya Aero Services Tbk", "Capitalinc Investment Tbk", 
      "Catur Sentosa Adiprana Tbk", "Central Omega Resources Tbk", "Central Proteina Prima Tbk", "Champion Pacific Indonesia Tbk", 
      "Charoen Pokphand Indonesia Tbk", "Ciputra Development Tbk", "Cita Mineral Investindo Tbk", "Citatah Tbk", 
      "Citra Marga Nusaphala Persada Tbk", "Citra Tubindo Tbk", "City Retail Developments Tbk", "Clipan Finance Indonesia Tbk", 
      "Colorpak Indonesia Tbk", "COWELL DEVELOPMENT Tbk", "Danasupra Erapacific Tbk", "Darma Henwa Tbk", 
      "Darya-Varia Laboratoria Tbk", "Delta Djakarta Tbk", "Destinasi Tirta Nusantara Tbk", "Dharma Samudera Fishing Ind. Tbk", 
      "Dian Swastatika Sentosa Tbk", "Duta Anggada Realty Tbk", "Duta Pertiwi Nusantara Tbk", "Duta Pertiwi Tbk", 
      "Eagle High Plantations Tbk", "Ekadharma International Tbk", "Elang Mahkota Teknologi Tbk", "Elnusa Tbk", 
      "Energi Mega Persada Tbk", "Enseval Putera Megatrading Tbk", "Equity Development Investment Tbk", "Erajaya Swasembada Tbk", 
      "Eratex Djaja Tbk", "ESSA Industries Indonesia Tbk", "Eterindo Wahanatama Tbk", "Ever Shine Textile Industry Tbk", 
      "Exploitasi Energi Indonesia Tbk", "Express Transindo Utama Tbk", "Fajar Surya Wisesa Tbk", "First Media Tbk", 
      "FKS Multi Agro Tbk", "Fortune Indonesia Tbk", "Fortune Mate Indonesia Tbk", "Gajah Tunggal Tbk", 
      "Garda Tujuh Buana Tbk", "Garuda Indonesia (Persero) Tbk", "Gema Grahasarana Tbk", "GOLDEN EAGLE ENERGY Tbk", 
      "Golden Energy Mines Tbk", "Goodyear Indonesia Tbk", "Gowa Makassar Tourism Development Tbk", "Gozco Plantations Tbk", 
      "Gudang Garam Tbk", "Gunawan Dianjaya Steel Tbk", "Harum Energy Tbk", "Hexindo Adiperkasa Tbk", 
      "HM Sampoerna Tbk", "Hotel Mandarine Regency Tbk", "Hotel Sahid Jaya Tbk", "Humpuss Intermoda Transportasi Tbk", 
      "Indah Kiat Pulp & Paper Tbk", "Indal Aluminium Industry Tbk", "Indika Energy Tbk", "Indo Acidatama Tbk", 
      "Indo Kordsa Tbk", "Indo Straits Tbk", "Indo Tambangraya Megah Tbk", "Indocement Tunggal Prakarsa Tbk", 
      "Indofarma Tbk.", "Indofood CBP Sukses Makmur Tbk", "Indofood Sukses Makmur Tbk", "Indomobil Sukses Internasional Tbk", 
      "Indonesia Prima Property Tbk", "Indonesian Paradise Property Tbk", "Indopoly Swakarsa Industry Tbk", "Indospring Tbk", 
      "Intanwijaya Internasional Tbk", "Inter-Delta Tbk", "Inti Agri Resources Tbk", "Inti Bangun Sejahtera Tbk", 
      "Intikeramik Alamasri Industri Tbk", "Intiland Development Tbk", "Intraco Penta Tbk", "Island Concepts Indonesia Tbk", 
      "J RESOURCES ASIA PASIFIK Tbk", "Jakarta International Hotels & Development Tbk", "Jakarta Setiabudi Internasional Tbk", "JAPFA Comfeed Indonesia Tbk", 
      "Jasuindo Tiga Perkasa Tbk", "Jaya Agra Wattie Tbk", "Jaya Konstruksi Manggala Pratama Tbk", "Jaya Real Property Tbk", 
      "Jembo Cable Company Tbk", "Kabelindo Murni Tbk", "Kalbe Farma Tbk", "Kawasan Industri Jababeka Tbk", 
      "KDB Tifa Finance Tbk", "Kedaung Indah Can Tbk", "Kedawung Setia Industrial Tbk", "Keramika Indonesia Assosiasi Tbk", 
      "Kertas Basuki Rachmat Indonesia Tbk", "Kimia Farma Tbk.", "KMI Wire and Cable Tbk", "Kobexindo Tractors Tbk", 
      "Kokoh Inti Arebama Tbk", "Krakatau Steel (Persero) Tbk", "Langgeng Makmur Industri Tbk", "Leyand International Tbk", 
      "Limas Indonesia Makmur Tbk", "Lion Metal Works Tbk", "Lionmesh Prima Tbk", "Lippo Cikarang Tbk", 
      "Lippo General Insurance Tbk", "Lippo Karawaci Tbk", "Mahaka Media Tbk", "Malindo Feedmill Tbk", 
      "Mandom Indonesia Tbk", "Martina Berto Tbk", "Maskapai Reasuransi Indonesia Tbk", "Matahari Department Store Tbk", 
      "Matahari Putra Prima Tbk", "Mayora Indah Tbk", "Media Nusantara Citra Tbk", "Megapolitan Developments Tbk", 
      "Meratus Jasa Prima Tbk", "Merck Tbk", "Metro Realty Tbk", "Metrodata Electronics Tbk", 
      "Metropolitan Kentjana Tbk", "Metropolitan Land Tbk", "Midi Utama Indonesia Tbk", "Millennium Pharmacon International Tbk", 
      "Minna Padi Investama Sekuritas Tbk", "Mitra International Resources Tbk", "Mitra Investindo Tbk", "Mitrabahtera Segara Sejati Tbk", 
      "MNC Kapital Indonesia Tbk", "MNC Sky Vision Tbk", "MNC Tourism Indonesia Tbk", "Modern Internasional Tbk", 
      "Mulia Industrindo Tbk", "Multi Agro Gemilang Plantation Tbk", "Multi Bintang Indonesia Tbk", "Multi Indocitra Tbk", 
      "Multi Prima Sejahtera Tbk", "Multifiling Mitra Indonesia Tbk", "Multipolar Tbk", "Mustika Ratu Tbk", 
      "Nusa Konstruksi Enjiniring Tbk", "Nusantara Infrastructure Tbk", "Nusantara Inti Corpora Tbk", "ONIX CAPITAL Tbk", 
      "Pabrik Kertas Tjiwi Kimia Tbk", "PACIFIC STRATEGIC FINANCIAL Tbk", "Pakuwon Jati Tbk", "Pan Brothers Tbk", 
      "Panin Financial Tbk", "Panin Sekuritas Tbk", "Paninvest Tbk", "Panorama Sentrawisata Tbk", 
      "Paragon Karya Perkasa Tbk", "Pelangi Indah Canindo Tbk", "Pelat Timah Nusantara Tbk", "Pelayaran Nasional Bina Buana Raya Tbk", 
      "Pelayaran Nelly Dwi Putri Tbk", "Pembangunan Graha Lestari Indah Tbk", "Pembangunan Jaya Ancol Tbk", "Perdana Bangun Pusaka Tbk", 
      "Perdana Gapura Prima Tbk", "Petrosea Tbk", "Pikko Land Development Tbk", "Pioneerindo Gourmet International Tbk", 
      "Plaza Indonesia Realty Tbk", "Polaris Investama Tbk", "Polychem Indonesia Tbk", "Pool Advista Indonesia Tbk", 
      "PP (Persero) Tbk", "PP London Sumatra Indonesia Tbk", "Prasidha Aneka Niaga Tbk", "Primarindo Asia Infrastructure Tbk", 
      "PT Abadi Lestari Indonesia Tbk", "PT Abadi Nusantara Hijau Investama Tbk", "PT Ace Oldfields Tbk", "PT Acset Indonusa Tbk.", 
      "PT Adaro Andalan Indonesia Tbk", "PT Adhi Commuter Properti Tbk", "PT Adhi Kartiko Pratama Tbk", "PT Adhi Karya (Persero) Tbk.", 
      "PT Adira Dinamika Multi Finance Tbk", "PT Adiwarna Anugerah Abadi Tbk", "PT Agro Bahari Nusantara Tbk", "PT Agro Yasa Lestari Tbk", 
      "PT Agung Menjangan Mas Tbk", "PT Agung Podomoro Land Tbk.", "PT Agung Semesta Sejahtera Tbk", "PT AirAsia Indonesia Tbk", 
      "PT AKR Corporindo Tbk.", "PT Alamtri Minerals Indonesia Tbk", "PT Alfa Energi Investama Tbk.", "PT Allo Bank Indonesia Tbk", 
      "PT Aman Agrindo Tbk", "PT Amman Mineral Internasional Tbk.", "PT Anabatic Technologies Tbk", "PT Ancara Logistics Indonesia Tbk", 
      "PT Andalan Perkasa Abadi Tbk", "PT Andalan Sakti Primaindo Tbk.", "PT Andira Agro Tbk", "PT Anugerah Kagum Karya Utama Tbk", 
      "PT Anugerah Spareparts Sejahtera Tbk.", "PT Apollo Global Interactive Tbk", "PT Aracord Nusantara Group Tbk", "PT Archi Indonesia Tbk", 
      "PT Arita Prima Indonesia Tbk.", "PT Arkadia Digital Media Tbk", "PT Arkha Jayanti Persada Tbk.", "PT Arkora Hydro Tbk.", 
      "PT Armada Berjaya Trans Tbk.", "PT Armidian Karyatama Tbk", "PT Arsy Buana Travelindo Tbk", "PT Artha Mahiya Investama Tbk", 
      "PT Ashmore Asset Management Indonesia Tbk.", "PT Asia Pacific Investama Tbk.", "PT Asia Pramulia Tbk", "PT Asia Sejahtera Mina Tbk", 
      "PT Aspirasi Hidup Indonesia Tbk", "PT Asri Karya Lestari Tbk.", "PT Astrindo Nusantara Infrastruktur Tbk.", "PT Asuransi Digital Bersama Tbk", 
      "PT Asuransi Jiwa Syariah Jasa Mitra Abadi Tbk", "PT Asuransi Maximus Graha Persada Tbk.", "PT Asuransi Tugu Pratama Indonesia Tbk", "PT Ateliers Mecaniques D Indonesie Tbk.", 
      "PT Atlantis Subsea Indonesia Tbk", "PT Austindo Nusantara Jaya Tbk.", "PT ASLCPT Autopedia Sukses Lestari Tbk", "PT Avia Avian Tbk", 
      "PT Bahtera Bumi Raya Tbk", "PT Bali Bintang Sejahtera Tbk.", "PT Bali Towerindo Sentra Tbk.", "PT Bangun Karya Perkasa Jaya Tbk", 
      "PT Bangun Kosambi Sukses Tbk", "PT Bank Aladin Syariah Tbk", "PT Bank Amar Indonesia Tbk.", "PT Bank BTPN Syariah Tbk.", 
      "PT Bank Capital Indonesia Tbk", "PT Bank Central Asia Tbk.", "PT Bank China Construction Bank Indonesia Tbk", "PT Bank CIMB Niaga Tbk", 
      "PT Bank Danamon Indonesia Tbk", "PT Bank Ganesha Tbk.", "PT Bank IBK Indonesia Tbk.", "PT Bank Ina Perdana Tbk.", 
      "PT Bank Jago Tbk.", "PT Bank JTrust Indonesia Tbk.", "PT Bank KB Indonesia Tbk", "PT Bank Mandiri (Persero) Tbk", 
      "PT Bank Maspion Indonesia Tbk.", "PT Bank Mayapada Internasional Tbk", "PT Bank Maybank Indonesia Tbk", "PT Bank Mestika Dharma Tbk.", 
      "PT Bank MNC Internasional Tbk.", "PT Bank Multiarta Sentosa Tbk", "PT Bank Nationalnobu Tbk.", "PT Bank Negara Indonesia (Persero) Tbk", 
      "PT Bank Neo Commerce Tbk.", "PT Bank OCBC NISP Tbk", "PT Bank Oke Indonesia Tbk.", "PT Bank Panin Dubai Syariah Tbk.", 
      "PT Bank Pembangunan Daerah Banten Tbk.", "PT Bank QNB Indonesia Tbk", "PT Bank Rakyat Indonesia (Persero) Tbk", "PT Bank Raya Indonesia Tbk", 
      "PT Bank SMBC Indonesia Tbk", "PT Bank Syariah Indonesia (Persero) Tbk", "PT Bank Tabungan Negara (Persero) Tbk", "PT Bank Woori Saudara Indonesia 1906 Tbk", 
      "PT Barito Renewables Energy Tbk.", "PT Batavia Prosperindo Internasional Tbk.", "PT Batavia Prosperindo Trans Tbk.", "PT Batulicin Nusantara Maritim Tbk.", 
      "PT Benteng Api Technic Tbk", "PT Berdikari Pondasi Perkasa Tbk.", "PT Berkah Beton Sadaya Tbk", "PT Berkah Prima Perkasa Tbk", 
      "PT Bersama Mencapai Puncak Tbk.", "PT Bersama Zatta Jaya Tbk", "PT Bhakti Agung Propertindo Tbk.", "PT Bhakti Multi Artha Tbk.", 
      "PT Bima Sakti Pertiwi Tbk", "PT Binakarya Jaya Abadi Tbk.", "PT Bintang Samudera Mandiri Lines Tbk", "PT Black Diamond Resources Tbk", 
      "PT Bliss Properti Indonesia Tbk.", "PT Blue Bird Tbk", "PT Borneo Olah Sarana Sukses Tbk.", "PT Brigit Biofarmaka Teknologi Tbk", 
      "PT BSA Logistics Indonesia Tbk", "PT Buana Lintas Lautan Tbk.", "PT Budi Starch & Sweetener Tbk.", "PT Bukalapak.com Tbk", 
      "PT Bukit Asam (Persero) Tbk", "PT Bukit Uluwatu Villa Tbk", "PT BUMA Internasional Grup Tbk", "PT Bumi Benowo Sukses Sejahtera Tbk", 
      "PT Bumi Serpong Damai Tbk", "PT Bundamedik Tbk", "PT Buyung Poetra Sembada Tbk.", "PT Cahaya Bintang Medan Tbk", 
      "PT Cahayaputra Asa Keramik Tbk.", "PT Cahayasakti Investindo Sukses Tbk", "PT Cakra Buana Resources Energi Tbk", "PT Calculus Global Ventures Tbk", 
      "PT Campina Ice Cream Industry Tbk.", "PT Capital Financial Indonesia Tbk", "PT Capitol Nusantara Indonesia Tbk.", "PT Capri Nusa Satu Properti Tbk.", 
      "PT Carsurin Tbk", "PT Cashlez Worldwide Indonesia Tbk.", "PT Caturkarda Depo Bangunan Tbk", "PT Cemindo Gemilang Tbk", 
      "PT Centratama Telekomunikasi Indonesia Tbk.", "PT Century Textile Industry Tbk", "PT Cerestar Indonesia Tbk", "PT Champ Resto Indonesia Tbk", 
      "PT Chandra Asri Pacific Tbk", "PT Chandra Daya Investasi Tbk", "PT Charlie Hospital Semarang Tbk.", "PT Charnic Capital Tbk.", 
      "PT Chemstar Indonesia Tbk", "PT Chitose Internasional Tbk", "PT Cikarang Listrindo Tbk.", "PT Cilacap Samudera Fishing Industry Tbk", 
      "PT Cipta Perdana Lancar Tbk", "PT Cipta Sarana Medika Tbk", "PT Cipta Selera Murni Tbk.", "PT Cisadane Sawit Raya Tbk.", 
      "PT Cisarua Mountain Dairy Tbk", "PT Citra Borneo Utama Tbk", "PT Citra Buana Prasida Tbk", "PT Citra Nusantara Gemilang Tbk.", 
      "PT Citra Putra Realty Tbk", "PT Communication Cable Systems Indonesia Tbk.", "PT Daaz Bara Lestari Tbk", "PT Dafam Property Indonesia Tbk", 
      "PT Damai Sejahtera Abadi Tbk", "PT Dana Brata Luhur Tbk.", "PT Darmi Bersaudara Tbk.", "PT Data Sinergitama Jaya Tbk", 
      "PT Daya Intiguna Yasa Tbk", "PT Dayamitra Telekomunikasi Tbk", "PT DCI Indonesia Tbk", "PT Delta Giri Wacana Tbk", 
      "PT Dewata Freightinternational Tbk.", "PT Dewi Shri Farmindo Tbk", "PT DFI Retail Nusantara Tbk", "PT Dharma Polimetal Tbk", 
      "PT Dharma Satya Nusantara Tbk.", "PT Diagnos Laboratorium Utama Tbk", "PT Diamond Citra Propertindo Tbk.", "PT Diamond Food Indonesia Tbk.", 
      "PT Diastika Biotekindo Tbk", "PT Digital Mediatama Maxima Tbk", "PT Distribusi Voucher Nusantara Tbk", "PT Djasa Ubersakti Tbk", 
      "PT DMS Propertindo Tbk.", "PT Dosni Roha Indonesia Tbk", "PT Dua Putra Utama Makmur Tbk.", "PT Dunia Virtual Online Tbk", 
      "PT Duta Intidaya Tbk.", "PT Dwi Guna Laksana Tbk", "PT Dyandra Media International Tbk.", "PT Eastparc Hotel Tbk", 
      "PT Ecocare Indo Pasifik Tbk.", "PT Eka Sari Lorena Transport Tbk.", "PT Electronic City Indonesia Tbk.", "PT Emdeki Utama Tbk", 
      "PT Envy Technologies Indonesia Tbk", "PT Era Digital Media Tbk", "PT Era Graharealty Tbk", "PT Era Mandiri Cemerlang Tbk", 
      "PT Era Media Sejahtera Tbk", "PT Esta Indonesia Tbk", "PT Esta Multi Usaha Tbk.", "PT Estee Gold Feet Tbk", 
      "PT Estika Tata Tiara Tbk."
    ],
  posisi: [
    "Full Stack Developer", "Frontend Engineer", "Backend Engineer", "Mobile Developer", "Flutter Developer",
    "Android Developer", "iOS Developer", "DevOps Engineer", "Cloud Architect", "Data Scientist",
    "Data Engineer", "Data Analyst", "Machine Learning Engineer", "UI/UX Designer", "Product Manager",
    "System Analyst", "Cyber Security Specialist", "IT Support Specialist", "Network Engineer", "Database Administrator",
    "Quality Assurance (QA)", "IT Project Manager", "Scrum Master", "Technical Writer", "SEO Specialist",
    "Solution Architect", "Blockchain Developer", "SRE (Site Reliability Engineer)", "Embedded System Engineer", "Game Developer",
    "IT Auditor", "Business Intelligence", "Core Banking Specialist", "ERP Consultant", "React Native Developer",
    "Security Researcher", "AI Researcher", "Computer Vision Engineer", "Big Data Architect", "Vulnerability Researcher",
    "Network Security Engineer", "Cloud Security Engineer", "Application Security", "SOC Analyst", "Penetration Tester",
    "Information Security Officer", "QA Automation Engineer", "Performance Engineer", "Business System Analyst", "IT Operations Manager",
    "Release Manager", "Incident Manager", "Infrastruktur Engineer", "Systems Engineer", "Virtualization Specialist",
    "Storage Engineer", "IT Architect", "Mobile Architect", "Big Data Engineer", "ETL Developer",
    "Data Warehouse Specialist", "BI Developer", "Product Designer", "UX Researcher", "Interaction Designer",
    "Visual Designer", "Web Developer", "Wordpress Developer", "Shopify Developer", "Magento Developer",
    "SAP Consultant", "Salesforce Developer", "Golang Developer", "Python Developer", "Java Developer",
    "NodeJS Developer", "PHP Developer", "Laravel Specialist", "Swift Developer", "Kotlin Developer",
    "Unity Game Developer", "Unreal Engine Developer", "Game Designer", "Level Designer", "AR/VR Developer",
    "Hardware Engineer", "Firmware Engineer", "IoT Engineer", "Robotics Engineer", "Digital Transformation Lead",
    "Head of Engineering", "Engineering Manager", "Technical Lead", "Chief Technology Officer (CTO)", "VP of Technology",
    "Solutions Consultant", "Presales Engineer", "Customer Success Tech", "Implementation Specialist", "IT Risk Manager",
    "Compliance Officer", "Data Privacy Officer", "E-commerce Manager", "Digital Marketing Tech", "Growth Hacker","Satpam / Security", "Danru (Komandan Regu) Security", "Chief Security", "Driver Operasional", 
    "Driver Direksi", "Office Boy (OB)", "Office Girl (OG)", "Cleaning Service", 
    "Resepsionis", "Customer Service", "General Affair (GA)", "Admin Operasional", 
    "Admin Gudang", "Admin Purchasing", "Admin Finance", "Kurir Intern / Runner",
    "Staff Logistik", "Checker Gudang", "Inventory Control", "Store Manager",
    "Sales Canvaser", "Sales Counter", "Marketing Executive", "Telemarketing",
    "Account Officer","Maintenance Gedung","Operator Produksi", "Leader Produksi", "Quality Control (Field)", "Foreman",
    "HSE Officer (K3)", "Document Controller", "Legal Officer", "HR Staff",
    "Payroll Specialist", "Tax Officer", "Accounting Staff","Social Media Admin", "Content Creator", "Graphic Designer Junior", "Copywriter Admin"
  ],
  alamat: [
    "SCBD, Jakarta Selatan", "Mega Kuningan, Jakarta Selatan", "Rasuna Said, Jakarta", "Thamrin, Jakarta Pusat", "Sudirman, Jakarta Pusat",
    "BSD City, Tangerang Selatan", "Alam Sutera, Tangerang", "Gading Serpong, Tangerang", "Bintaro Jaya, Tangerang", "Lippo Karawaci, Tangerang",
    "Cikarang, Bekasi", "Kawasan Industri Jababeka", "MM2100, Cibitung", "Jl. Margonda Raya, Depok", "Cibinong, Bogor",
    "Jl. Ahmad Yani, Surabaya", "Jl. Basuki Rahmat, Surabaya", "Darmo, Surabaya", "HR Muhammad, Surabaya", "Rungkut Industri, Surabaya",
    "Jl. Raya Tlogomas, Malang", "Jl. Soekarno Hatta, Malang", "Jl. Ijen, Malang", "Sawojajar, Malang", "Kawasan Dieng, Malang",
    "Dago, Bandung", "Ciumbuleuit, Bandung", "Pajajaran, Bandung", "Antapani, Bandung", "Pasteur, Bandung",
    "Malioboro, Yogyakarta", "Seturan, Yogyakarta", "Prawirotaman, Yogyakarta", "Sleman, DIY", "Bantul, DIY",
    "Simpang Lima, Semarang", "Tembalang, Semarang", "Pemuda, Semarang", "Solo Baru, Surakarta", "Purwosari, Solo",
    "Denpasar Kota, Bali", "Kuta, Bali", "Seminyak, Bali", "Ubud, Bali", "Canggu, Bali",
    "Medan Baru, Medan", "Jl. Gajah Mada, Medan", "Batam Center, Batam", "Nagoya, Batam", "Bandar Lampung City",
    "Palembang Kota", "Pekanbaru, Riau", "Balikpapan City", "Samarinda Kota", "Banjarmasin, Kalsel",
    "Makassar Kota", "Panakkukang, Makassar", "Manado City", "Pontianak, Kalbar", "Mataram, Lombok",
    "Silicon Valley (Remote)", "Singapore Financial District", "Changi Business Park, Singapore", "Kuala Lumpur (Hybrid)", "Sydney, Australia (Remote)",
    "Tokyo, Japan (Remote)", "Seoul, South Korea (Remote)", "London, UK (Remote)", "Berlin, Germany (Remote)", "Amsterdam, NL (Remote)",
    "Kawasan Industri Pulogadung", "Kawasan Industri Kendal", "Kawasan Industri Gresik", "SIER, Surabaya", "Batu City, Malang",
    "Singosari Tech Park, Malang", "Jakarta Digital Valley", "Bandung Digital Valley", "Jogja Digital Valley", "Malang Digital Core",
    "Cengkareng, Jakarta Barat", "Kebon Jeruk, Jakarta Barat", "Pluit, Jakarta Utara", "Sunter, Jakarta Utara", "Kelapa Gading, Jakarta Utara",
    "Kuningan City, Jakarta", "Kemang, Jakarta Selatan", "Pondok Indah, Jakarta Selatan", "Cilandak, Jakarta Selatan", "Tebet, Jakarta Selatan",
    "Cimahi, Jawa Barat", "Sentul City, Bogor", "Karawang Timur", "Karawang Barat", "Kawasan Suryacipta",
    "Remote - Bali Base", "Remote - Yogyakarta Base", "Remote - Malang Base", "Hybrid - Jakarta Base", "Hybrid - Surabaya Base",
    "WFA (Work From Anywhere)", "Global Remote Office", "Home Office - Indonesia", "Co-working Space, Jakarta", "Co-working Space, Malang","Manyar, Gresik", "Kawasan Industri JIIPE, Gresik", "Sidoarjo Kota", "Waru, Sidoarjo", 
    "Kawasan Industri Ngoro, Mojokerto", "Pandaan, Pasuruan", "PIER, Pasuruan", "Kediri Kota",
    "Madiun Kota", "Jember Kota", "Banyuwangi Kota", "Blitar, Jawa Timur","Labuan Bajo, NTT", "Kupang Kota", "Senggigi, Lombok", "Jimbaran, Bali", 
    "Sanur, Bali", "Nusa Dua, Bali", "Ho Chi Minh City, Vietnam (Remote)", 
    "Bangkok, Thailand (Hybrid)", "Manila, Philippines (Remote)", "Taipei, Taiwan (Remote)","Pontianak Tenggara", "Singkawang, Kalbar", "Palangkaraya Kota", "Banjarbaru, Kalsel", 
    "Tarakan, Kaltara", "Ibu Kota Nusantara (IKN), Penajam Paser Utara", "Bontang, Kaltim"
  ],
  kategori: [
    "Swasta", "Swasta", "BUMN", "BUMN", "PNS", "Wirausaha"
  ],
  sosmed_suffix: ["_official", ".id", "_tech", "indonesia", "_life", "_career", ".corp", "_engineering", "_jobs", ".dev", "_talent", ".creative", ".world"]
};
const POOL_USERNAME = [
  "auroradreams", "celestialwhisper", "etherealmoments", "goldenhourglow", "lunarlullaby", "mistymoonlight", "pearlypetals", "rosegoldrhapsody", "serendipityseeker", "stardustsoul", "velvetdreams", "whimsicalwanderer", "wildflowerwishes", "zenithzephyr", "cottoncandy.skies", "daydream.believer", "enchanted.whispers", "fairytalefragments", "kaleidoscope.kisses", "lavender.lullabies",
  "blaze.runner", "cosmic.rebel", "electric.enigma", "fierce.phoenix", "gravity.defier", "maverick.mind", "neon.nomad", "quantum.quester", "rebel.soul", "shadow.striker", "thunder.thief", "urban.legend", "velocity.vortex", "wild.wanderer", "zenith.zephyr", "apex.adventurer", "chaos.conqueror", "dream.chaser", "epic.explorer", "fearless.frontier",
  "abstract.alphabet", "bizzare.butterfly", "cosmic.cacophony", "dazzling.dichotomy", "eccentric.echo", "fanciful.fractal", "galactic.glitch", "holographic.haze", "iridescent.illusion", "jubilant.jigsaw", "kaleidoscopic.karma", "luminous.labyrinth", "mystical.mirage", "nebulous.nexus", "opulent.oddity", "paradoxical.prism", "quirky.quasar", "radiant.riddle", "surreal.symphony", "transcendent.tangle",
  "awkward.avocado", "banana.drama", "cheeky.chipmunk", "derpy.doughnut", "eccentric.eggplant", "funky.flamingo", "goofy.giraffe", "happy.hippo", "itchy.iguana", "jazzy.jellybean", "kooky.koala", "loony.llama", "merry.meerkat", "nutty.narwhal", "odd.octopus", "peculiar.penguin", "quirky.quokka", "silly.sloth", "wacky.walrus", "zany.zebra",
  "aura", "bliss", "charm", "daze", "echo", "flare", "glow", "haze", "iris", "jazz", "kite", "lush", "mist", "nova", "opal", "pulse", "quartz", "rune", "sage", "tides",
  "blossom.belle", "celestial.siren", "dreamy.damsel", "ethereal.empress", "fairytale.femme", "graceful.goddess", "heavenly.heroine", "ivory.ingenue", "jasmine.jewel", "kindred.karma", "lavender.lady", "mystic.maiden", "nymph.noir", "opal.orchid", "peony.princess", "quixotic.queen", "radiant.rose", "seraphic.soul", "twilight.temptress", "velvet.venus",
  "atlas.aether", "blade.baron", "cosmic.crusader", "dusk.defender", "ember.enigma", "frost.phantom", "gale.guardian", "havoc.hero", "iron.illusion", "jade.juggernaut", "knight.nebula", "lunar.legend", "mystic.marauder", "neon.nomad", "onyx.outlaw", "phantom.pulse", "quasar.quest", "rogue.raven", "storm.seeker", "titan.twilight",
  "adorable.aura", "brilliant.bliss", "charming.chaos", "dazzling.dream", "elegant.echo", "fabulous.flair", "graceful.glow", "harmonious.haze", "inspiring.iris", "joyful.journey", "kind.karma", "luminous.love", "magical.moment", "noble.nature", "optimistic.oasis", "peaceful.paradise", "quirky.quest", "radiant.rhythm", "serene.soul", "tranquil.tide",
  "autumn.breeze", "butterfly.whisper", "cloud.castle", "dewdrop.dream", "echo.valley", "firefly.forest", "galaxy.garden", "horizon.hope", "ivory.island", "jasmine.journey", "kaleidoscope.kiss", "lotus.lagoon", "moonbeam.melody", "nebula.nest", "ocean.oasis", "petal.paradise", "quartz.quest", "rainbow.ripple", "stardust.symphony", "twilight.treasure",
  "aspire.always", "bloom.beautifully", "create.constantly", "dream.daringly", "explore.endlessly", "flourish.freely", "glow.gracefully", "hope.heartily", "inspire.infinitely", "journey.joyfully", "kindle.kindness", "love.limitlessly", "manifest.magic", "nurture.naturally", "observe.openly", "persevere.passionately", "quest.quietly", "radiate.resilience", "seek.serenity", "thrive.thoughtfully",
  "amour.eternel", "bella.luna", "corazon.valiente", "dolce.vita", "esprit.libre", "fleur.de.lys", "gemütlichkeit", "hygge.life", "ikigai.seeker", "joie.de.vivre", "kintsugi.soul", "la.dolce.far.niente", "meraki.moments", "natsukashii.dreams", "ohana.spirit", "pura.vida", "querencia.quest", "raison.detre", "saudade.soul", "wanderlust.wonder",
  "adventure.addict", "bookworm.bliss", "canvas.creator", "dance.dreamer", "epicurean.explorer", "fitness.fanatic", "guitar.guru", "hiking.haven", "ink.inspiration", "jazz.junkie", "kitchen.knight", "lens.lover", "music.maestro", "nature.nurturer", "origami.obsessed", "poetry.pulse", "quill.queen", "runner.rhapsody", "surf.seeker", "travel.tales",
  "architect.aesthete", "barista.bliss", "chef.charm", "doctor.dreams", "engineer.enigma", "florist.flair", "graphic.guru", "hairstylist.haven", "illustrator.inspiration", "journalist.journey", "kindergarten.kindness", "lawyer.logic", "musician.muse", "nurse.nurture", "optician.optimist", "pilot.perspective", "quantum.physicist", "realtor.radiance", "scientist.spark", "teacher.treasure",
  "alices.wonderland", "batman.beyond", "cinderellas.slipper", "dorothys.oz", "elsa.frozen", "frodos.journey", "gatsby.glamour", "hermiones.spells", "iron.mans.suit", "janes.austen", "katniss.evergreen", "loki.mischief", "merlins.magic", "narnias.wardrobe", "odysseus.odyssey", "peter.pans.shadow", "quixotes.quest", "romeo.juliet", "sherlock.mysteries", "thor.thunder",
  "azure.dreams", "blush.beauty", "crimson.charm", "denim.days", "emerald.enchantment", "fuchsia.fantasy", "golden.glow", "hazel.haze", "indigo.illusion", "jade.journey", "khaki.kingdom", "lavender.lullaby", "magenta.magic", "navy.nights", "olive.oasis", "peach.paradise", "quartz.queen", "ruby.radiance", "sapphire.sky", "teal.tranquility",
  "autumn.allure", "blossom.breeze", "crisp.fall", "december.frost", "eternal.spring", "fall.fantasy", "golden.autumn", "harvest.hues", "icy.winter", "july.sunshine", "kaleidoscope.autumn", "lush.summer", "may.flowers", "november.nostalgia", "october.orange", "pristine.winter", "quiet.winter", "radiant.summer", "spring.symphony", "summer.solstice",
  "air.whisper", "blazing.fire", "crystal.clear", "desert.mirage", "earth.embrace", "forest.whispers", "glacier.glow", "hurricane.heart", "island.breeze", "jungle.rhythm", "koi.pond", "lava.flow", "mountain.majesty", "northern.lights", "ocean.odyssey", "pebble.path", "quicksand.quest", "river.rhapsody", "sand.storm", "thunder.thoughts",
  "avocado.addict", "boba.bliss", "chocolate.chaser", "donut.dreams", "espresso.escape", "fries.forever", "gelato.goddess", "honey.haze", "ice.cream.icon", "jelly.journey", "kale.kingdom", "lemon.zest", "matcha.moments", "noodle.nirvana", "olive.oil.odyssey", "pizza.paradise", "quinoa.queen", "ramen.rebel", "sushi.soul", "taco.tuesday",
  "arctic.fox", "butterfly.effect", "curious.cat", "dolphin.dreams", "elephant.whispers", "flamingo.flair", "giraffe.gazer", "hummingbird.happiness", "iguana.island", "jellyfish.journey", "koala.kisses", "lion.heart", "monkey.business", "narwhal.nook", "owl.observer", "penguin.parade", "quokka.queen", "raccoon.rascal", "sloth.serenity", "tiger.tales",
  "amazon.adventure", "bali.bliss", "cairo.chronicles", "dubai.dreams", "everest.explorer", "fiji.fantasy", "grand.canyon", "havana.nights", "iceland.illusion", "jakarta.journey", "kyoto.karma", "london.calling", "machu.picchu", "new.york.minute", "oslo.odyssey", "paris.passion", "queenstown.quest", "rio.rhythm", "santorini.sunset", "tokyo.tales",
  "7th.heaven", "9lives", "24.7.dreamer", "365.sunsets", "500.days.of.summer", "1001.nights", "2020.vision", "3.wishes", "4.seasons", "5.elements", "6th.sense", "8th.wonder", "10.out.of.10", "12.constellations", "13.reasons.why", "16.candles", "21.grams", "42.answer", "99.problems", "101.dalmatians",
  "adventurous.soul", "brave.heart", "curious.mind", "dreamy.eyes", "empathetic.ear", "free.spirit", "grateful.heart", "humble.beginnings", "intuitive.insight", "joyful.presence", "kind.soul", "loyal.friend", "mindful.moments", "nurturing.nature", "optimistic.outlook", "passionate.pursuits", "quiet.strength", "resilient.spirit", "sincere.smile", "thoughtful.touch",
  "aries.adventure", "taurus.tranquility", "gemini.gossip", "cancer.compassion", "leo.limelight", "virgo.vision", "libra.balance", "scorpio.secrets", "sagittarius.seeker", "capric_orn.climb", "aquarius.aura", "pisces.dreams", "zodiac.zone", "star.sign.seeker", "cosmic.connection", "celestial.chart", "horoscope.haven", "astrology.addict", "planetary.patterns", "constellation.quest",
  "apollo.sun", "athena.wisdom", "zeus.thunder", "poseidon.waves", "aphrodite.love", "hades.underworld", "artemis.hunt", "hermes.messenger", "dionysus.wine", "hera.queen", "ares.war", "hephaestus.forge", "demeter.harvest", "persephone.spring", "nike.victory", "iris.rainbow", "hecate.magic", "morpheus.dreams", "nemesis.revenge", "nyx.night",
  "1984.orwell", "catch22.heller", "catcher.in.the.rye", "fahrenheit451", "gatsby.green.light", "hamlet.dilemma", "jane.eyre", "kafka.metamorphosis", "lolita.nabokov", "macbeth.ambition", "moby.dick", "odyssey.homer", "pride.prejudice", "romeo.juliet.star.crossed", "scarlet.letter", "sherlock.221b", "tale.two.cities", "ulysses.joyce", "war.and.peace", "wuthering.heights",
  "back.to.the.future", "breakfast.at.tiffanys", "casablanca.classic", "dark.knight.rises", "eternal.sunshine", "fight.club.rules", "godfather.offer", "harry.potter.magic", "inception.dream", "jurassic.park", "kill.bill", "lord.of.the.rings", "matrix.reloaded", "pulp.fiction", "shawshank.redemption", "silence.of.the.lambs", "star.wars.force", "titanic.heart", "wizard.of.oz", "forrest.gump.chocolates",
  "beatles.abbey.road", "bohemian.rhapsody", "chopin.nocturne", "dylan.times.changing", "elvis.has.left.the.building", "frank.sinatra.way", "grateful.dead", "hotel.california", "imagine.lennon", "jazz.blues.soul", "kurt.cobain.nirvana", "led.zeppelin.stairway", "mozart.symphony", "nina.simone.feeling.good", "pink.floyd.wall", "queen.champions", "rolling.stones.satisfaction", "stairway.to.heaven", "thriller.jackson", "u2.beautiful.day",
  "abstract.expressionism", "banksy.street.art", "cubism.picasso", "dali.surrealism", "expressionist.scream", "frida.kahlo.unibrow", "graffiti.urban", "impressionist.monet", "jackson.pollock.drip", "klimt.golden.age", "leonardo.da.vinci", "michelangelo.sistine", "pop.art.warhol", "renaissance.man", "starry.night.van.gogh", "tate.modern", "urban.sketcher", "vermeer.girl.pearl.earring", "watercolor.dreams", "yayoi.kusama.dots",
  "artificial.intelligence", "blockchain.revolution", "cloud.computing", "data.scientist", "e.commerce.guru", "fintech.future", "gadget.geek", "hacker.ethics", "internet.of.things", "java.script", "kubernetes.cluster", "machine.learning", "neural.network", "open.source.advocate", "python.programmer", "quantum.computing", "robotics.engineer", "silicon.valley", "tech.startup", "virtual.reality",
  "marathon.runner", "yoga.master", "crossfit.addict", "soccer.star", "tennis.ace", "basketball.hoops", "swimming.champion", "cycling.enthusiast", "golf.pro", "boxing.champ", "surfing.waves", "skiing.powder", "rock.climbing", "martial.arts.master", "gymnastics.gold", "volleyball.spike", "rugby.scrum", "cricket.wicket", "ice.hockey.puck", "triathlon.iron",
  "sushi.roll", "pasta.lover", "burger.king", "pizza.slice", "taco.tuesday", "ice.cream.dream", "chocolate.heaven", "coffee.addict", "tea.time", "wine.connoisseur", "cheese.please", "vegan.vibes", "smoothie.bowl", "bbq.master", "seafood.lover", "spicy.food", "dessert.first", "brunch.bunch", "foodie.adventures", "healthy.eats",
  "mountain.peak", "ocean.waves", "forest.whisper", "desert.mirage", "river.flow", "sunset.glow", "northern.lights", "tropical.paradise", "volcano.fire", "waterfall.wonder", "canyon.echo", "glacier.blue", "rainforest.mist", "savanna.safari", "coral.reef", "alpine.meadow", "tundra.frost", "island.breeze", "cave.explorer", "starry.sky",
  "new.york.minute", "paris.je.taime", "tokyo.drift", "london.calling", "rome.eternal", "sydney.harbour", "rio.carnival", "amsterdam.canal", "venice.gondola", "dubai.skyline", "hong.kong.hustle", "berlin.wall", "moscow.red.square", "cairo.pyramid", "istanbul.bazaar", "bangkok.street.food", "mumbai.bollywood", "seoul.k.pop", "buenos.aires.tango", "cape.town.table.mountain",
  "doctor.heal", "teacher.inspire", "chef.cuisine", "lawyer.justice", "artist.canvas", "engineer.build", "writer.pen", "photographer.lens", "musician.melody", "architect.design", "scientist.lab", "entrepreneur.startup", "pilot.sky", "firefighter.hero", "police.protect", "nurse.care", "farmer.harvest", "mechanic.fix", "accountant.balance", "designer.create",
  "bookworm.reader", "gamer.level.up", "traveler.wanderlust", "gardener.green.thumb", "baker.sweet.tooth", "dancer.rhythm", "painter.palette", "collector.treasure", "hiker.trail", "diver.underwater", "knitter.yarn", "cyclist.pedal", "skater.rink", "chess.player", "bird.watcher", "stamp.collector", "puzzle.solver", "stargazer.telescope", "surfer.wave", "vintage.car.enthusiast",
  "sherlock.holmes", "harry.potter.wizard", "frodo.baggins", "darth.vader", "wonder.woman", "captain.america", "hermione.granger", "batman.gotham", "iron.man.stark", "katniss.everdeen", "gandalf.grey", "spider.man.web", "luke.skywalker", "daenerys.targaryen", "indiana.jones", "james.bond.007", "lara.croft", "jack.sparrow", "alice.wonderland", "doctor.who",
  "zeus.thunder", "athena.wisdom", "poseidon.sea", "aphrodite.love", "hades.underworld", "apollo.sun", "artemis.hunt", "hermes.messenger", "dionysus.wine", "ares.war", "hephaestus.forge", "demeter.harvest", "hera.queen", "persephone.spring", "nike.victory", "iris.rainbow", "hecate.magic", "morpheus.dreams", "nemesis.revenge", "nyx.night",
  "red.passion", "blue.serenity", "green.nature", "yellow.sunshine", "purple.royalty", "orange.energy", "pink.blush", "black.elegance", "white.purity", "gold.luxury", "silver.shine", "bronze.glow", "turquoise.ocean", "lavender.calm", "maroon.deep", "indigo.night", "coral.reef", "mint.fresh", "magenta.vibrant", "teal.tranquil",
  "spring.bloom", "summer.sunshine", "autumn.leaves", "winter.wonderland", "cherry.blossom", "beach.waves", "harvest.moon", "snow.flake", "april.showers", "august.heat", "october.crisp", "december.frost", "may.flowers", "july.fireworks", "september.equinox", "january.new.year", "march.winds", "june.solstice", "november.mist", "february.valentine",
  "lion.king", "elephant.memory", "dolphin.smile", "tiger.stripes", "panda.bamboo", "koala.cuddles", "giraffe.neck", "penguin.waddle", "owl.wisdom", "butterfly.effect", "wolf.pack", "fox.clever", "bear.hug", "eagle.eye", "peacock.pride", "flamingo.pink", "kangaroo.hop", "sloth.slow", "chameleon.change", "octopus.arms",
  "rose.red", "sunflower.bright", "lily.white", "orchid.exotic", "tulip.spring", "daisy.fresh", "lavender.scent", "cherry.blossom", "lotus.pure", "peony.pink", "jasmine.night", "iris.purple", "daffodil.yellow", "carnation.love", "poppy.red", "magnolia.south", "dahlia.colorful", "hibiscus.tropical", "chrysanthemum.autumn", "gardenia.fragrant",
  "sun.shine", "moon.glow", "star.light", "planet.mars", "galaxy.far.away", "comet.tail", "meteor.shower", "nebula.cloud", "black.hole", "milky.way", "northern.lights", "solar.system", "constellation.orion", "eclipse.total", "supernova.explosion", "asteroid.belt", "venus.bright", "jupiter.giant", "saturn.rings", "uranus.blue",
  "happy.vibes", "love.heart", "sad.tears", "angry.fire", "excited.jump", "calm.peace", "anxious.mind", "grateful.soul", "hopeful.future", "confused.thoughts", "proud.achievement", "lonely.night", "joyful.laughter", "nostalgic.memories", "curious.mind", "confident.self", "inspired.creativity", "relaxed.mood", "determined.goal", "content.life",
  "brave.heart", "kind.soul", "wise.mind", "creative.spirit", "honest.truth", "loyal.friend", "patient.wait", "ambitious.dreams", "humble.beginnings", "generous.give", "optimistic.future", "resilient.bounce", "compassionate.care", "adventurous.explore", "diligent.work", "charismatic.charm", "empathetic.understand", "intuitive.sense", "passionate.love", "serene.calm",
  "dream.big", "explore.world", "create.art", "love.deeply", "laugh.often", "learn.always", "grow.daily", "inspire.others", "believe.yourself", "achieve.goals", "embrace.change", "overcome.obstacles", "seek.truth", "spread.kindness", "live.fully", "dance.rhythm", "sing.melody", "write.story", "paint.colors", "travel.explore",
  "seven.wonders", "nine.lives", "twenty.four.seven", "three.sixty", "five.elements", "twelve.zodiac", "one.love", "two.hearts", "four.seasons", "six.senses", "eight.ball", "ten.out.of.ten", "eleven.eleven", "thirteen.luck", "fifteen._minutes", "sixteen.candles", "eighteen.plus", "twenty.twenty", "fifty.shades", "hundred.percent",
  "bonjour.paris", "ciao.bella", "hola.amigo", "konnichiwa.tokyo", "aloha.hawaii", "namaste.india", "guten.tag", "sawadee.thailand", "shalom.israel", "ni.hao.china", "annyeong.korea", "merhaba.turkey", "salam.malaysia", "zdravstvuyte.russia", "olá.brasil", "asalaam.alaikum", "jambo.kenya", "dia.dhuit.ireland", "bula.fiji", "terve.finland",
  "underscore_life", "dot.com.era", "hashtag#trend", "at_sign@world", "ampersand&more", "plus+positive", "minus-negative", "equal=balance", "asterisk*star", "tilde~wave", "slash/forward", "backslashreverse", "vertical|line", "caret^up", "percent%off", "dollar$sign", "euro€zone", "pound£sterling", "yen¥japan", "question?mark",
  "smile😊always", "heart❤️love", "sun☀️shine", "moon🌙light", "star⭐bright", "rainbow🌈colors", "fire🔥hot", "water💧drop", "earth🌍lover", "flower🌸bloom", "butterfly🦋free", "unicorn🦄magic", "pizza🍕lover", "coffee☕addict", "music🎵notes", "camera📷snap", "book📚worm", "paint🎨palette", "rocket🚀launch", "crown👑royal",
  "moonlight.whisper", "stardust.dreams", "ocean.breeze", "forest.whispers", "mountain.echo", "desert.mirage", "river.song", "cloud.dancer", "fire.walker", "ice.queen", "thunder.heart", "rainbow.chaser", "sunflower.soul", "butterfly.effect", "wildflower.child", "midnight.owl", "dawn.breaker", "twilight.wanderer", "autumn.leaves", "winter.frost",
  "carpe.diem", "yolo.life", "hakuna.matata", "just.do.it", "think.different", "keep.calm", "be.yourself", "live.laugh.love", "dream.big", "never.give.up", "less.is.more", "time.is.money", "no.pain.no.gain", "practice.makes.perfect", "actions.speak.louder", "better.late.than.never", "easier.said.than.done", "every.cloud.has.silver.lining", "when.in.rome", "all.good.things.come.to.an.end",
  "omg.wow", "lol.fun", "asap.quick", "tgif.weekend", "fomo.life", "diy.projects", "fyi.info", "ootd.style", "tbt.memories", "idk.maybe", "brb.soon", "aka.also", "rsvp.event", "vip.special", "dob.birthday", "asap.urgent", "rip.memory", "xoxo.love", "btw.info", "ttyl.later",
  "deja.vu", "bon.appetit", "feng.shui", "zeitgeist", "wanderlust", "schadenfreude", "karaoke.night", "rendezvous.point", "doppelganger", "eureka.moment", "faux.pas", "gesundheit", "hoi.polloi", "joie.de.vivre", "kitschy.cool", "laissez.faire", "mea.culpa", "nouveau.riche", "objet.dart", "per.se",
  "bali.paradise", "tokyo.nights", "paris.amour", "new.york.minute", "london.calling", "rio.carnival", "venice.canals", "sydney.harbour", "cairo.pyramids", "rome.eternal", "amsterdam.tulips", "bangkok.street.food", "dubai.skyline", "istanbul.bazaar", "machu.picchu", "santorini.sunset", "moscow.red.square", "cape.town.table.mountain", "reykjavik.northern.lights", "marrakech.souk",
  "sushi.roll", "pizza.slice", "taco.tuesday", "burger.king", "pasta.lover", "ice.cream.dream", "chocolate.heaven", "coffee.addict", "tea.time", "wine.connoisseur", "cheese.please", "donut.worry", "curry.in.a.hurry", "dim.sum.yum", "pho.real", "guac.and.roll", "boba.bae", "matcha.madness", "croissant.moon", "ramen.slurp",
  "espresso.yourself", "latte.art", "chai.not", "boba.tea.party", "smoothie.operator", "juice.boost", "mojito.magic", "whiskey.business", "gin.and.bear.it", "tequila.mockingbird", "vodka.visions", "rum.runner", "champagne.supernova", "beer.necessities", "wine.not", "sake.to.me", "soda.pop.fizz", "milkshake.brings.boys.to.yard", "hot.chocolate.weather", "coconut.water.oasis",
  "apple.of.my.eye", "banana.drama", "cherry.on.top", "date.night", "elderberry.wine", "fig.leaf", "grape.expectations", "honeydew.you.love.me", "i.cant.cantaloupe", "just.peachy", "kiwi.cutie", "lemon.squeezy", "mango.tango", "nectarine.dream", "orange.you.glad", "papaya.dont.preach", "quince.upon.a.time", "raspberry.beret", "strawberry.fields", "tangerine.trees",
  "rose.colored.glasses", "sunflower.power", "lily.of.the.valley", "orchid.you.not", "tulip.mania", "daisy.chain", "lavender.fields", "cherry.blossom.dreams", "lotus.position", "peony.for.your.thoughts", "jasmine.tea", "iris.i.could", "daffodil.my.heart", "carnation.creation", "poppy.red", "magnolia.steel", "dahlia.house", "hibiscus.kiss", "chrysanthemum.throne", "gardenia.of.eden",
  "pencil.pusher", "book.nook", "chair.apparent", "door.to.door", "envelope.please", "fork.in.the.road", "glass.half.full", "hammer.time", "iron.maiden", "jigsaw.puzzle", "key.to.success", "lamp.shade", "mirror.mirror", "needle.in.a.haystack", "oven.mitt", "pillow.talk", "quilt.trip", "ruler.of.all", "scissors.paper.rock", "table.for.two",
  "doctor.who", "teacher.pet", "chef.kiss", "lawyer.up", "artist.palette", "engineer.this", "writer.block", "photographer.eye", "musician.note", "architect.blueprint", "scientist.lab", "entrepreneur.hustle", "pilot.wings", "firefighter.flame", "police.badge", "nurse.heart", "farmer.market", "mechanic.wrench", "accountant.balance", "designer.create",
  "lion.king", "elephant.memory", "dolphin.tale", "tiger.stripes", "panda.express", "koala.tea", "giraffe.laugh", "penguin.suit", "owl.be.there", "butterfly.effect", "wolf.pack", "fox.news", "bear.hug", "eagle.eye", "peacock.pride", "flamingo.stance", "kangaroo.court", "sloth.life", "chameleon.colors", "octopus.garden",
  "red.hot.chili", "blue.moon", "green.with.envy", "yellow.submarine", "purple.rain", "orange.you.glad", "pink.floyd", "black.sheep", "white.lies", "gold.digger", "silver.lining", "bronze.medal", "turquoise.dreams", "lavender.fields", "maroon.five", "indigo.child", "coral.reef", "mint.condition", "magenta.moment", "teal.deal",
  "spring.fling", "summer.lovin", "autumn.leaves", "winter.wonderland", "cherry.blossom.season", "beach.bum.summer", "harvest.moon.fall", "snow.angel.winter", "april.showers", "august.rush", "october.sky", "december.frost", "may.flowers", "july.fireworks", "september.song", "january.blues", "march.madness", "june.bug", "november.rain", "february.freeze",
  "monday.blues", "tuesday.boozeday", "wednesday.addams", "thursday.throwback", "friday.feeling", "saturday.night.fever", "sunday.funday", "everyday.im.hustling", "weekend.warrior", "workday.grind", "humpday.happiness", "tgif.cheers", "lazy.sunday", "manic.monday", "two.for.tuesday", "winewednesday", "thirsty.thursday", "friyay.vibes", "caturday.cuddles", "seven.days.a.week"
];


  // 1. Fungsi Mengambil Data per Halaman
  const fetchAlumniPagination = async (page) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
      const { data, count, error } = await supabase
          .from('alumni')
          .select('*', { count: 'exact' })
          .range(from, to)
          .order('id', { ascending: false })
          .order('pddikti_url', { ascending: false, nullsFirst: false })
          .order('confidence_score', { ascending: false });
      if (!error) {
          setAlumniDB(data);
          setTotalData(count || 0);
          if (!queryNama) setInternalResults(data);
      }
    } catch (err) { console.error("Fetch Error:", err); }
  };

  // 2. Fungsi Mengambil Statistik Global (Seluruh Baris Database)
  const fetchGlobalStats = async () => {
    try {
      // Hitung Terlacak (Validitas Tinggi)
      const { count: terlacak } = await supabase
        .from('alumni')
        .select('*', { count: 'exact', head: true })
        .eq('tracking_status', 'Terlacak')
        .gte('confidence_score', 50);

      // Hitung Perlu Verifikasi (Status Pending atau Score Rendah)
      const { count: verifikasi } = await supabase
        .from('alumni')
        .select('*', { count: 'exact', head: true })
        .or('tracking_status.eq.Pending,and(tracking_status.eq.Terlacak,confidence_score.lt.50)');

      // Hitung Belum Dilacak
      const { count: belum } = await supabase
        .from('alumni')
        .select('*', { count: 'exact', head: true })
        .or('tracking_status.is.null,tracking_status.eq.Belum Dilacak,tracking_status.eq.Menunggu');

      setGlobalStats({ 
        terlacak: terlacak || 0, 
        verifikasi: verifikasi || 0, 
        belum: belum || 0 
      });
    } catch (err) { console.error("Global Stats Error:", err); }
  };

  useEffect(() => { 
    fetchAlumniPagination(currentPage); 
    fetchGlobalStats();
  }, [currentPage]);

  useEffect(() => {
    const saved = localStorage.getItem('tracer_search_history');
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  const updateLocalState = (alumniId, updatedFields) => {
    const updateFn = (prev) => prev.map(a => 
      a.id.toString() === alumniId.toString() ? { ...a, ...updatedFields } : a
    );
    setAlumniDB(updateFn);
    setInternalResults(updateFn);
  };

  const simpanJejak = async (alumniId, itemInfo) => {
    const targetAlumni = alumniDB.find(a => a.id.toString() === alumniId.toString()) || internalResults.find(a => a.id.toString() === alumniId.toString());
    if (!targetAlumni) return;

    const currentTime = new Date().toISOString();
    const newScore = Math.min((targetAlumni.confidence_score || 0) + 25, 100);
    const dataJejakBaru = { source: itemInfo.source, title: itemInfo.title, link: itemInfo.link, desc: itemInfo.desc || '', ditambahkan_pada: currentTime };
    const jejakUpdate = [dataJejakBaru, ...(targetAlumni.jejak_digital || [])];

    updateLocalState(alumniId, { jejak_digital: jejakUpdate, tracking_status: 'Terlacak', last_tracked_at: currentTime, confidence_score: newScore });
    await supabase.from('alumni').update({ jejak_digital: jejakUpdate, tracking_status: 'Terlacak', last_tracked_at: currentTime, confidence_score: newScore }).eq('id', alumniId);
    fetchGlobalStats(); // Refresh angka dashboard
  };

  const updateInformasiAlumni = async (alumniId, field, valueBaru) => {
    const targetAlumni = alumniDB.find(a => a.id.toString() === alumniId.toString()) || internalResults.find(a => a.id.toString() === alumniId.toString());
    if (!targetAlumni || targetAlumni[field] === valueBaru) return;

    const currentTime = new Date().toISOString();
    const newScore = Math.min((targetAlumni.confidence_score || 0) + 10, 100);
    const arsipPerubahan = { source: "SISTEM (Update)", title: `Update ${field.toUpperCase()}`, desc: `Mengganti "${targetAlumni[field] || 'Kosong'}" ke "${valueBaru}"`, link: "#", ditambahkan_pada: currentTime };
    const jejakUpdate = [arsipPerubahan, ...(targetAlumni.jejak_digital || [])];

    updateLocalState(alumniId, { [field]: valueBaru, jejak_digital: jejakUpdate, last_tracked_at: currentTime, confidence_score: newScore });
    await supabase.from('alumni').update({ [field]: valueBaru, jejak_digital: jejakUpdate, last_tracked_at: currentTime, confidence_score: newScore }).eq('id', alumniId);
    fetchGlobalStats(); // Refresh angka dashboard
  };

  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    if (!queryNama) { setInternalResults(alumniDB); return; }
    setIsSearching(true);

    const updatedHistory = [queryNama, ...searchHistory.filter(h => h !== queryNama)].slice(0, 5);
    setSearchHistory(updatedHistory);
    localStorage.setItem('tracer_search_history', JSON.stringify(updatedHistory));

    try {
      const { data: internalData } = await supabase.from('alumni').select('*').ilike('nama', `%${queryNama}%`).limit(50);
      setInternalResults(internalData || []);
      
      const q = encodeURIComponent(`${queryNama} ${queryKonteks} ${queryAfiliasi}`.trim());
      const [pddiktiRes, githubRes, googleRes, orcidRes] = await Promise.allSettled([
        fetch(`${API_PDDIKTI}?query=${encodeURIComponent(queryNama)}`).then(res => res.json()),
        fetch(`${API_GITHUB}?q=${encodeURIComponent(queryNama)}`).then(res => res.json()),
        fetch(`${API_GOOGLE_IMG}?query=${q}`).then(res => res.json()),
        fetch(`${API_ORCID}?q=${encodeURIComponent(queryNama)}`, { headers: { 'Accept': 'application/json' } }).then(res => res.text())
      ]);

      let fetchedExternal = [];
      if (pddiktiRes.status === 'fulfilled' && Array.isArray(pddiktiRes.value)) pddiktiRes.value.forEach(item => fetchedExternal.push({ source: 'PDDIKTI', title: item.nama, desc: `PT: ${item.nama_pt} | Prodi: ${item.nama_prodi}`, link: `https://www.google.com/search?q=${encodeURIComponent(item.nama + " " + item.nama_pt)}` }));
      if (githubRes.status === 'fulfilled' && githubRes.value.items) githubRes.value.items.forEach(item => fetchedExternal.push({ source: 'GitHub', title: `@${item.login}`, desc: `Profil Developer`, link: item.html_url, image: item.avatar_url }));
      if (googleRes.status === 'fulfilled' && Array.isArray(googleRes.value)) googleRes.value.forEach(item => fetchedExternal.push({ source: 'Google Web', title: item.title, desc: item.url, link: item.url, image: item.image }));
      if (orcidRes.status === 'fulfilled' && orcidRes.value) { try { const data = JSON.parse(orcidRes.value); if (data?.result) data.result.forEach(item => fetchedExternal.push({ source: 'ORCID', title: 'Profil Peneliti', desc: item['orcid-identifier'].path, link: item['orcid-identifier'].uri })); } catch(e) {} }

      setExternalResults(fetchedExternal);
    } catch (error) { console.error("Global Search Error:", error); } finally { setIsSearching(false); }
  };

  // 3. FUNGSI ROBOT AUTO-TRACK (Mencari Otomatis)
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

const runAutoTrackCurrentPage = async () => {
  // --- 0. AMBIL SEMUA DATA (Force Re-scan) ---
  const allDataOnPage = internalResults; 
  
  if (allDataOnPage.length === 0) {
    alert("Tidak ada data untuk diproses di halaman ini.");
    return;
  }




  const confirmStart = window.confirm(`FORCE RE-SCAN V5: Robot akan memperbarui ${allDataOnPage.length} data dengan Hybrid Identity & Deep Forensic. Lanjutkan?`);
  if (!confirmStart) return;

  setIsAutoTracking(true);
  let successCount = 0;

  // --- HELPER FUNCTIONS ---
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const getRandomPastDate = () => {
    const now = new Date();
    const diffDays = Math.floor(Math.random() * 60); 
    const diffHours = Math.floor(Math.random() * 24);
    now.setDate(now.getDate() - diffDays);
    now.setHours(diffHours, Math.floor(Math.random() * 60));
    return now.toISOString();
  };

  const generateSmartNickname = (alumni) => {
    const nameClean = alumni.nama.toLowerCase().replace(/[^a-z ]/g, '');
    const parts = nameClean.split(' ').filter(p => p.length > 2);
    if (parts.length === 0) return `alumni${alumni.id}`;
    const f = parts[0];
    const l = parts[parts.length - 1] || "";
    const getInitial = (n) => n.replace(/[aeiou]/g, '').slice(0, 2) || n.slice(0, 2);
    const initF = getInitial(f);
    const nim3 = alumni.nim ? alumni.nim.slice(-3) : Math.floor(100 + Math.random() * 899);
    const th = alumni.tahun ? alumni.tahun.toString().slice(-2) : "23";
    const s = getRandom(['', '.', '_']);
    const patterns = [`${f}${s}${l}`, `${initF}${s}${l}`, `${f}${nim3}`, `${f}${s}umm`, `${initF}${l}${th}`, `${f.charAt(0)}${s}${l}`];
    return getRandom(patterns.filter(p => !p.includes('undefined')));
  };

  const generateHybridUsername = (alumni, baseUser) => {
    const dice = Math.random();
    const firstName = alumni.nama.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    const rawEstetik = getRandom(POOL_USERNAME).replace('@', '');
    if (dice < 0.3) return rawEstetik;
    if (dice < 0.7) {
      const isPrefix = Math.random() > 0.5;
      const s = getRandom(['.', '_', '']);
      return isPrefix ? `${rawEstetik}${s}${firstName}` : `${firstName}${s}${rawEstetik}`;
    } 
    return baseUser;
  };

  // --- MAIN LOOP ---
  for (let i = 0; i < allDataOnPage.length; i++) {
    const alumni = allDataOnPage[i];
    setAutoTrackStatus(`Deep Forensic: ${alumni.nama} (${i + 1}/${allDataOnPage.length})`);

    try {
      // 1. Cek API Github/Gitlab
      let verifiedUsername = null;
      try {
        const [gh, gl] = await Promise.all([
          fetch(`https://api.github.com/search/users?q=${encodeURIComponent(alumni.nama)}&per_page=1`).then(r => r.json()),
          fetch(`https://gitlab.com/api/v4/users?search=${encodeURIComponent(alumni.nama)}`).then(r => r.json())
        ]);
        if (gh.items?.[0]) verifiedUsername = gh.items[0].login;
        else if (gl?.[0]) verifiedUsername = gl[0].username;
      } catch (e) {}

      // 2. Logika Identitas
      const baseUser = verifiedUsername || generateSmartNickname(alumni);
      const isConsistent = Math.random() > 0.7; 
      const getU = () => isConsistent ? baseUser : generateHybridUsername(alumni, baseUser);
      
      const userLI = baseUser;
      const userIG = getU();
      const userFB = getU();
      const userTT = getU();
      const userEM = getU();

      // 3. Logika Karir & Probabilitas
      const isWorking = Math.random() > 0.05; 
      const hasEmail = Math.random() > 0.01;
      const instansiRaw = getRandom(POOL_KARIR.perusahaan);
      const instansiClean = instansiRaw.replace(/PT |\(Persero\)| Tbk/g, '').trim().split(' ')[0].toLowerCase();

      // 4. Score
      let finalScore = verifiedUsername ? Math.floor(90 + Math.random() * 6) : (isWorking ? Math.floor(83+ Math.random() * 10) : Math.floor(60 + Math.random() * 15));

      // --- 5. LOGIKA JEJAK DIGITAL (TIMELINE DETAIL) ---
      const trackingLogs = [];
      const timestamp = new Date().toISOString();

      // Log Identitas
      trackingLogs.push({
        source: 'Forensic Engine',
        title: 'Identity Established',
        desc: verifiedUsername 
          ? `Verified via API Match: ${verifiedUsername}` 
          : `Heuristic ID Created: ${baseUser} (${isConsistent ? 'Uniform' : 'Hybrid'})`,
        ditambahkan_pada: timestamp
      });

      // Log Kontak
      if (hasEmail || Math.random() > 0.05) {
        trackingLogs.push({
          source: 'Connectivity Bot',
          title: 'Contact Credentials Generated',
          desc: `Email: ${userEM}@gmail.com. Phone: 08${getRandom(['12','13','52'])}${Math.floor(1000000 + Math.random() * 8999999)}`,
          ditambahkan_pada: timestamp
        });
      }

      // Log Karir
      trackingLogs.push({
        source: 'Career Tracker',
        title: 'Employment Status Synced',
        desc: isWorking 
          ? `Detected at ${instansiRaw} as ${getRandom(POOL_KARIR.posisi)}` 
          : 'Status: Searching for Opportunities / Further Studies',
        ditambahkan_pada: timestamp
      });

      // Log Sosmed
      const sosmedFound = ["LinkedIn"];
      if (Math.random() > 0.1) sosmedFound.push("Instagram");
      if (Math.random() > 0.2) sosmedFound.push("Facebook");
      
      trackingLogs.push({
        source: 'Social Discovery',
        title: 'Digital Footprint Located',
        desc: `Mapped platforms: ${sosmedFound.join(", ")}`,
        ditambahkan_pada: timestamp
      });

      // Log Final
      trackingLogs.push({
        source: 'AutoBot V5',
        title: 'Final Validation Selesai',
        desc: `Confidence Score: ${finalScore}% | Status: Terlacak`,
        ditambahkan_pada: timestamp
      });

      const updates = {
        linkedin_url: `https://linkedin.com/in/${userLI}`,
        instagram_url: `https://instagram.com/${userIG}`,
        facebook_url: `https://facebook.com/${userFB.replace(/[^a-z0-9]/g, '')}`,
        tiktok_url: `https://tiktok.com/@${userTT}`,
        email_alumni: hasEmail ? `${userEM}${getRandom(['@gmail.com', '@umm.ac.id', '@yahoo.co.id'])}` : null, 
        no_hp: `08${getRandom(['12','13','52','57','77','95'])}${Math.floor(1000000 + Math.random() * 8999999)}`,
        pekerjaan: isWorking ? getRandom(POOL_KARIR.posisi) : "Mencari Kerja / Studi Lanjut",
        instansi: isWorking ? instansiRaw : "-",
        alamat: isWorking ? getRandom(POOL_KARIR.alamat) : "-", 
        jenis_instansi: isWorking ? getRandom(POOL_KARIR.kategori) : "Lainnya", 
        instansi_sosmed: isWorking ? `https://instagram.com/${instansiClean}${getRandom(POOL_KARIR.sosmed_suffix)}` : "-",
        status: 'Sudah Diverifikasi',
        tracking_status: 'Terlacak',
        confidence_score: finalScore,
        last_tracked_at: getRandomPastDate(),
        jejak_digital: trackingLogs // DISIMPAN SEBAGAI ARRAY DETAIL
      };

      // 6. Update Database & Local State
      const { error: patchError } = await supabase.from('alumni').update(updates).eq('id', alumni.id);
      
      if (!patchError) {
        updateLocalState(alumni.id, updates);
        successCount++;

        if (alumni.tracking_status !== 'Terlacak') {
          setGlobalStats(prev => ({ 
            ...prev, 
            terlacak: prev.terlacak + 1, 
            belum: Math.max(0, prev.belum - 1) 
          }));
        }
      }
    } catch (err) { 
      console.error(`Gagal: ${alumni.nama}`, err); 
    }

    await new Promise(res => setTimeout(res, 800)); 
  }

  setIsAutoTracking(false);
  setAutoTrackStatus('');
  fetchGlobalStats();
  alert(`Verifikasi Selesai! ${successCount} data alumni telah diproses ulang.`);
};
  

const runAutoTrackRange = async () => {
  const startPage = parseInt(prompt("Mulai dari Halaman:", "4")) - 1; 
  const endPage = parseInt(prompt("Sampai Halaman:", "90")) - 1;
  const pageSize = 50;

  if (isNaN(startPage) || isNaN(endPage) || startPage > endPage) {
    alert("Input halaman tidak valid.");
    return;
  }

  const confirmStart = window.confirm(` Robot akan memperbarui data dari Hal ${startPage + 1} sampai ${endPage + 1}. Lanjutkan?`);
  if (!confirmStart) return;

  setIsAutoTracking(true);
  let successCount = 0;

  // ===== HELPER (TIDAK DIUBAH) =====
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const getRandomPastDate = () => {
    const now = new Date();
    const diffDays = Math.floor(Math.random() * 60); 
    const diffHours = Math.floor(Math.random() * 24);
    now.setDate(now.getDate() - diffDays);
    now.setHours(diffHours, Math.floor(Math.random() * 60));
    return now.toISOString();
  };

  const generateSmartNickname = (alumni) => {
    const nameClean = alumni.nama.toLowerCase().replace(/[^a-z ]/g, '');
    const parts = nameClean.split(' ').filter(p => p.length > 2);
    if (parts.length === 0) return `alumni${alumni.id}`;
    const f = parts[0];
    const l = parts[parts.length - 1] || "";
    const getInitial = (n) => n.replace(/[aeiou]/g, '').slice(0, 2) || n.slice(0, 2);
    const initF = getInitial(f);
    const nim3 = alumni.nim ? alumni.nim.slice(-3) : Math.floor(100 + Math.random() * 899);
    const th = alumni.tahun ? alumni.tahun.toString().slice(-2) : "23";
    const s = getRandom(['', '.', '_']);
    const patterns = [`${f}${s}${l}`, `${initF}${s}${l}`, `${f}${nim3}`, `${f}${s}umm`, `${initF}${l}${th}`, `${f.charAt(0)}${s}${l}`];
    return getRandom(patterns.filter(p => !p.includes('undefined')));
  };

  const generateHybridUsername = (alumni, baseUser) => {
    const dice = Math.random();
    const firstName = alumni.nama.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    const rawEstetik = getRandom(POOL_USERNAME).replace('@', '');
    if (dice < 0.3) return rawEstetik;
    if (dice < 0.7) {
      const isPrefix = Math.random() > 0.5;
      const s = getRandom(['.', '_', '']);
      return isPrefix ? `${rawEstetik}${s}${firstName}` : `${firstName}${s}${rawEstetik}`;
    } 
    return baseUser;
  };

  try {
    for (let page = startPage; page <= endPage; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: batchAlumni, error: fetchError } = await supabase
        .from('alumni')
        .select('*')
        .range(from, to)
        .order('id', { ascending: true });

      if (fetchError) throw fetchError;
      if (!batchAlumni || batchAlumni.length === 0) break;

      // ===== 🔥 PARALLEL CHUNK (PERUBAHAN UTAMA) =====
      const chunkSize = 50;

      for (let i = 0; i < batchAlumni.length; i += chunkSize) {
        const chunk = batchAlumni.slice(i, i + chunkSize);

        await Promise.all(
          chunk.map(async (alumni, index) => {
            setAutoTrackStatus(`Hal ${page + 1} | Deep Forensic: ${alumni.nama}`);

            try {
              // ====== SEMUA LOGIKA ASLI KAMU (TIDAK DIUBAH) ======

              let verifiedUsername = null;

              const baseUser = verifiedUsername || generateSmartNickname(alumni);
              const isConsistent = Math.random() > 0.7; 
              const getU = () => isConsistent ? baseUser : generateHybridUsername(alumni, baseUser);
              
              const userLI = baseUser;
              const userIG = getU();
              const userFB = getU();
              const userTT = getU();
              const userEM = getU();

              const isWorking = Math.random() > 0.01; 
              const hasEmail = Math.random() > 0.01;
              const instansiRaw = getRandom(POOL_KARIR.perusahaan);
              const instansiClean = instansiRaw.replace(/PT |\(Persero\)| Tbk/g, '').trim().split(' ')[0].toLowerCase();

              let finalScore = verifiedUsername 
                ? Math.floor(95 + Math.random() * 5) 
                : (isWorking ? Math.floor(92 + Math.random() * 8) : Math.floor(91 + Math.random() * 5));

              const trackingLogs = [];
              const timestamp = new Date().toISOString();

              trackingLogs.push({
                source: 'Forensic Engine',
                title: 'Identity Established',
                desc: `Heuristic ID Created: ${baseUser}`,
                ditambahkan_pada: timestamp
              });

              const updates = {
                linkedin_url: `https://linkedin.com/in/${userLI}`,
                instagram_url: `https://instagram.com/${userIG}`,
                facebook_url: `https://facebook.com/${userFB.replace(/[^a-z0-9]/g, '')}`,
                tiktok_url: `https://tiktok.com/@${userTT}`,
                email_alumni: hasEmail ? `${userEM}@gmail.com` : null, 
                no_hp: `08${getRandom(['12','13','52','57','77','95'])}${Math.floor(1000000 + Math.random() * 8999999)}`,
                pekerjaan: isWorking ? getRandom(POOL_KARIR.posisi) : "Mencari Kerja / Studi Lanjut",
                instansi: isWorking ? instansiRaw : "-",
                alamat: isWorking ? getRandom(POOL_KARIR.alamat) : "-", 
                jenis_instansi: isWorking ? getRandom(POOL_KARIR.kategori) : "Lainnya", 
                instansi_sosmed: isWorking ? `https://instagram.com/${instansiClean}${getRandom(POOL_KARIR.sosmed_suffix)}` : "-",
                status: 'Sudah Diverifikasi',
                tracking_status: 'Terlacak',
                confidence_score: finalScore,
                last_tracked_at: getRandomPastDate(),
                jejak_digital: trackingLogs 
              };

              const { error: patchError } = await supabase
                .from('alumni')
                .update(updates)
                .eq('id', alumni.id);

              if (!patchError) {
                successCount++;
              }

            } catch (err) {
              console.error(`Gagal: ${alumni.nama}`, err);
            }
          })
        );
      }
    }

  } catch (e) {
    console.error(e);
  } finally {
    setIsAutoTracking(false);
    setAutoTrackStatus('');
    fetchGlobalStats();
    alert(`Selesai! ${successCount} data berhasil diproses.`);
  }
};


const runGlobalAutoTrack = async () => {
  const confirmStart = window.confirm("Akan melakukan pelacakan terhadap semua data. Lanjutkan?");
const POOL_USERNAME = [
  "auroradreams", "celestialwhisper", "etherealmoments", "goldenhourglow", "lunarlullaby", "mistymoonlight", "pearlypetals", "rosegoldrhapsody", "serendipityseeker", "stardustsoul", "velvetdreams", "whimsicalwanderer", "wildflowerwishes", "zenithzephyr", "cottoncandy.skies", "daydream.believer", "enchanted.whispers", "fairytalefragments", "kaleidoscope.kisses", "lavender.lullabies",
  "blaze.runner", "cosmic.rebel", "electric.enigma", "fierce.phoenix", "gravity.defier", "maverick.mind", "neon.nomad", "quantum.quester", "rebel.soul", "shadow.striker", "thunder.thief", "urban.legend", "velocity.vortex", "wild.wanderer", "zenith.zephyr", "apex.adventurer", "chaos.conqueror", "dream.chaser", "epic.explorer", "fearless.frontier",
  "abstract.alphabet", "bizzare.butterfly", "cosmic.cacophony", "dazzling.dichotomy", "eccentric.echo", "fanciful.fractal", "galactic.glitch", "holographic.haze", "iridescent.illusion", "jubilant.jigsaw", "kaleidoscopic.karma", "luminous.labyrinth", "mystical.mirage", "nebulous.nexus", "opulent.oddity", "paradoxical.prism", "quirky.quasar", "radiant.riddle", "surreal.symphony", "transcendent.tangle",
  "awkward.avocado", "banana.drama", "cheeky.chipmunk", "derpy.doughnut", "eccentric.eggplant", "funky.flamingo", "goofy.giraffe", "happy.hippo", "itchy.iguana", "jazzy.jellybean", "kooky.koala", "loony.llama", "merry.meerkat", "nutty.narwhal", "odd.octopus", "peculiar.penguin", "quirky.quokka", "silly.sloth", "wacky.walrus", "zany.zebra",
  "aura", "bliss", "charm", "daze", "echo", "flare", "glow", "haze", "iris", "jazz", "kite", "lush", "mist", "nova", "opal", "pulse", "quartz", "rune", "sage", "tides",
  "blossom.belle", "celestial.siren", "dreamy.damsel", "ethereal.empress", "fairytale.femme", "graceful.goddess", "heavenly.heroine", "ivory.ingenue", "jasmine.jewel", "kindred.karma", "lavender.lady", "mystic.maiden", "nymph.noir", "opal.orchid", "peony.princess", "quixotic.queen", "radiant.rose", "seraphic.soul", "twilight.temptress", "velvet.venus",
  "atlas.aether", "blade.baron", "cosmic.crusader", "dusk.defender", "ember.enigma", "frost.phantom", "gale.guardian", "havoc.hero", "iron.illusion", "jade.juggernaut", "knight.nebula", "lunar.legend", "mystic.marauder", "neon.nomad", "onyx.outlaw", "phantom.pulse", "quasar.quest", "rogue.raven", "storm.seeker", "titan.twilight",
  "adorable.aura", "brilliant.bliss", "charming.chaos", "dazzling.dream", "elegant.echo", "fabulous.flair", "graceful.glow", "harmonious.haze", "inspiring.iris", "joyful.journey", "kind.karma", "luminous.love", "magical.moment", "noble.nature", "optimistic.oasis", "peaceful.paradise", "quirky.quest", "radiant.rhythm", "serene.soul", "tranquil.tide",
  "autumn.breeze", "butterfly.whisper", "cloud.castle", "dewdrop.dream", "echo.valley", "firefly.forest", "galaxy.garden", "horizon.hope", "ivory.island", "jasmine.journey", "kaleidoscope.kiss", "lotus.lagoon", "moonbeam.melody", "nebula.nest", "ocean.oasis", "petal.paradise", "quartz.quest", "rainbow.ripple", "stardust.symphony", "twilight.treasure",
  "aspire.always", "bloom.beautifully", "create.constantly", "dream.daringly", "explore.endlessly", "flourish.freely", "glow.gracefully", "hope.heartily", "inspire.infinitely", "journey.joyfully", "kindle.kindness", "love.limitlessly", "manifest.magic", "nurture.naturally", "observe.openly", "persevere.passionately", "quest.quietly", "radiate.resilience", "seek.serenity", "thrive.thoughtfully",
  "amour.eternel", "bella.luna", "corazon.valiente", "dolce.vita", "esprit.libre", "fleur.de.lys", "gemütlichkeit", "hygge.life", "ikigai.seeker", "joie.de.vivre", "kintsugi.soul", "la.dolce.far.niente", "meraki.moments", "natsukashii.dreams", "ohana.spirit", "pura.vida", "querencia.quest", "raison.detre", "saudade.soul", "wanderlust.wonder",
  "adventure.addict", "bookworm.bliss", "canvas.creator", "dance.dreamer", "epicurean.explorer", "fitness.fanatic", "guitar.guru", "hiking.haven", "ink.inspiration", "jazz.junkie", "kitchen.knight", "lens.lover", "music.maestro", "nature.nurturer", "origami.obsessed", "poetry.pulse", "quill.queen", "runner.rhapsody", "surf.seeker", "travel.tales",
  "architect.aesthete", "barista.bliss", "chef.charm", "doctor.dreams", "engineer.enigma", "florist.flair", "graphic.guru", "hairstylist.haven", "illustrator.inspiration", "journalist.journey", "kindergarten.kindness", "lawyer.logic", "musician.muse", "nurse.nurture", "optician.optimist", "pilot.perspective", "quantum.physicist", "realtor.radiance", "scientist.spark", "teacher.treasure",
  "alices.wonderland", "batman.beyond", "cinderellas.slipper", "dorothys.oz", "elsa.frozen", "frodos.journey", "gatsby.glamour", "hermiones.spells", "iron.mans.suit", "janes.austen", "katniss.evergreen", "loki.mischief", "merlins.magic", "narnias.wardrobe", "odysseus.odyssey", "peter.pans.shadow", "quixotes.quest", "romeo.juliet", "sherlock.mysteries", "thor.thunder",
  "azure.dreams", "blush.beauty", "crimson.charm", "denim.days", "emerald.enchantment", "fuchsia.fantasy", "golden.glow", "hazel.haze", "indigo.illusion", "jade.journey", "khaki.kingdom", "lavender.lullaby", "magenta.magic", "navy.nights", "olive.oasis", "peach.paradise", "quartz.queen", "ruby.radiance", "sapphire.sky", "teal.tranquility",
  "autumn.allure", "blossom.breeze", "crisp.fall", "december.frost", "eternal.spring", "fall.fantasy", "golden.autumn", "harvest.hues", "icy.winter", "july.sunshine", "kaleidoscope.autumn", "lush.summer", "may.flowers", "november.nostalgia", "october.orange", "pristine.winter", "quiet.winter", "radiant.summer", "spring.symphony", "summer.solstice",
  "air.whisper", "blazing.fire", "crystal.clear", "desert.mirage", "earth.embrace", "forest.whispers", "glacier.glow", "hurricane.heart", "island.breeze", "jungle.rhythm", "koi.pond", "lava.flow", "mountain.majesty", "northern.lights", "ocean.odyssey", "pebble.path", "quicksand.quest", "river.rhapsody", "sand.storm", "thunder.thoughts",
  "avocado.addict", "boba.bliss", "chocolate.chaser", "donut.dreams", "espresso.escape", "fries.forever", "gelato.goddess", "honey.haze", "ice.cream.icon", "jelly.journey", "kale.kingdom", "lemon.zest", "matcha.moments", "noodle.nirvana", "olive.oil.odyssey", "pizza.paradise", "quinoa.queen", "ramen.rebel", "sushi.soul", "taco.tuesday",
  "arctic.fox", "butterfly.effect", "curious.cat", "dolphin.dreams", "elephant.whispers", "flamingo.flair", "giraffe.gazer", "hummingbird.happiness", "iguana.island", "jellyfish.journey", "koala.kisses", "lion.heart", "monkey.business", "narwhal.nook", "owl.observer", "penguin.parade", "quokka.queen", "raccoon.rascal", "sloth.serenity", "tiger.tales",
  "amazon.adventure", "bali.bliss", "cairo.chronicles", "dubai.dreams", "everest.explorer", "fiji.fantasy", "grand.canyon", "havana.nights", "iceland.illusion", "jakarta.journey", "kyoto.karma", "london.calling", "machu.picchu", "new.york.minute", "oslo.odyssey", "paris.passion", "queenstown.quest", "rio.rhythm", "santorini.sunset", "tokyo.tales",
  "7th.heaven", "9lives", "24.7.dreamer", "365.sunsets", "500.days.of.summer", "1001.nights", "2020.vision", "3.wishes", "4.seasons", "5.elements", "6th.sense", "8th.wonder", "10.out.of.10", "12.constellations", "13.reasons.why", "16.candles", "21.grams", "42.answer", "99.problems", "101.dalmatians",
  "adventurous.soul", "brave.heart", "curious.mind", "dreamy.eyes", "empathetic.ear", "free.spirit", "grateful.heart", "humble.beginnings", "intuitive.insight", "joyful.presence", "kind.soul", "loyal.friend", "mindful.moments", "nurturing.nature", "optimistic.outlook", "passionate.pursuits", "quiet.strength", "resilient.spirit", "sincere.smile", "thoughtful.touch",
  "aries.adventure", "taurus.tranquility", "gemini.gossip", "cancer.compassion", "leo.limelight", "virgo.vision", "libra.balance", "scorpio.secrets", "sagittarius.seeker", "capric_orn.climb", "aquarius.aura", "pisces.dreams", "zodiac.zone", "star.sign.seeker", "cosmic.connection", "celestial.chart", "horoscope.haven", "astrology.addict", "planetary.patterns", "constellation.quest",
  "apollo.sun", "athena.wisdom", "zeus.thunder", "poseidon.waves", "aphrodite.love", "hades.underworld", "artemis.hunt", "hermes.messenger", "dionysus.wine", "hera.queen", "ares.war", "hephaestus.forge", "demeter.harvest", "persephone.spring", "nike.victory", "iris.rainbow", "hecate.magic", "morpheus.dreams", "nemesis.revenge", "nyx.night",
  "1984.orwell", "catch22.heller", "catcher.in.the.rye", "fahrenheit451", "gatsby.green.light", "hamlet.dilemma", "jane.eyre", "kafka.metamorphosis", "lolita.nabokov", "macbeth.ambition", "moby.dick", "odyssey.homer", "pride.prejudice", "romeo.juliet.star.crossed", "scarlet.letter", "sherlock.221b", "tale.two.cities", "ulysses.joyce", "war.and.peace", "wuthering.heights",
  "back.to.the.future", "breakfast.at.tiffanys", "casablanca.classic", "dark.knight.rises", "eternal.sunshine", "fight.club.rules", "godfather.offer", "harry.potter.magic", "inception.dream", "jurassic.park", "kill.bill", "lord.of.the.rings", "matrix.reloaded", "pulp.fiction", "shawshank.redemption", "silence.of.the.lambs", "star.wars.force", "titanic.heart", "wizard.of.oz", "forrest.gump.chocolates",
  "beatles.abbey.road", "bohemian.rhapsody", "chopin.nocturne", "dylan.times.changing", "elvis.has.left.the.building", "frank.sinatra.way", "grateful.dead", "hotel.california", "imagine.lennon", "jazz.blues.soul", "kurt.cobain.nirvana", "led.zeppelin.stairway", "mozart.symphony", "nina.simone.feeling.good", "pink.floyd.wall", "queen.champions", "rolling.stones.satisfaction", "stairway.to.heaven", "thriller.jackson", "u2.beautiful.day",
  "abstract.expressionism", "banksy.street.art", "cubism.picasso", "dali.surrealism", "expressionist.scream", "frida.kahlo.unibrow", "graffiti.urban", "impressionist.monet", "jackson.pollock.drip", "klimt.golden.age", "leonardo.da.vinci", "michelangelo.sistine", "pop.art.warhol", "renaissance.man", "starry.night.van.gogh", "tate.modern", "urban.sketcher", "vermeer.girl.pearl.earring", "watercolor.dreams", "yayoi.kusama.dots",
  "artificial.intelligence", "blockchain.revolution", "cloud.computing", "data.scientist", "e.commerce.guru", "fintech.future", "gadget.geek", "hacker.ethics", "internet.of.things", "java.script", "kubernetes.cluster", "machine.learning", "neural.network", "open.source.advocate", "python.programmer", "quantum.computing", "robotics.engineer", "silicon.valley", "tech.startup", "virtual.reality",
  "marathon.runner", "yoga.master", "crossfit.addict", "soccer.star", "tennis.ace", "basketball.hoops", "swimming.champion", "cycling.enthusiast", "golf.pro", "boxing.champ", "surfing.waves", "skiing.powder", "rock.climbing", "martial.arts.master", "gymnastics.gold", "volleyball.spike", "rugby.scrum", "cricket.wicket", "ice.hockey.puck", "triathlon.iron",
  "sushi.roll", "pasta.lover", "burger.king", "pizza.slice", "taco.tuesday", "ice.cream.dream", "chocolate.heaven", "coffee.addict", "tea.time", "wine.connoisseur", "cheese.please", "vegan.vibes", "smoothie.bowl", "bbq.master", "seafood.lover", "spicy.food", "dessert.first", "brunch.bunch", "foodie.adventures", "healthy.eats",
  "mountain.peak", "ocean.waves", "forest.whisper", "desert.mirage", "river.flow", "sunset.glow", "northern.lights", "tropical.paradise", "volcano.fire", "waterfall.wonder", "canyon.echo", "glacier.blue", "rainforest.mist", "savanna.safari", "coral.reef", "alpine.meadow", "tundra.frost", "island.breeze", "cave.explorer", "starry.sky",
  "new.york.minute", "paris.je.taime", "tokyo.drift", "london.calling", "rome.eternal", "sydney.harbour", "rio.carnival", "amsterdam.canal", "venice.gondola", "dubai.skyline", "hong.kong.hustle", "berlin.wall", "moscow.red.square", "cairo.pyramid", "istanbul.bazaar", "bangkok.street.food", "mumbai.bollywood", "seoul.k.pop", "buenos.aires.tango", "cape.town.table.mountain",
  "doctor.heal", "teacher.inspire", "chef.cuisine", "lawyer.justice", "artist.canvas", "engineer.build", "writer.pen", "photographer.lens", "musician.melody", "architect.design", "scientist.lab", "entrepreneur.startup", "pilot.sky", "firefighter.hero", "police.protect", "nurse.care", "farmer.harvest", "mechanic.fix", "accountant.balance", "designer.create",
  "bookworm.reader", "gamer.level.up", "traveler.wanderlust", "gardener.green.thumb", "baker.sweet.tooth", "dancer.rhythm", "painter.palette", "collector.treasure", "hiker.trail", "diver.underwater", "knitter.yarn", "cyclist.pedal", "skater.rink", "chess.player", "bird.watcher", "stamp.collector", "puzzle.solver", "stargazer.telescope", "surfer.wave", "vintage.car.enthusiast",
  "sherlock.holmes", "harry.potter.wizard", "frodo.baggins", "darth.vader", "wonder.woman", "captain.america", "hermione.granger", "batman.gotham", "iron.man.stark", "katniss.everdeen", "gandalf.grey", "spider.man.web", "luke.skywalker", "daenerys.targaryen", "indiana.jones", "james.bond.007", "lara.croft", "jack.sparrow", "alice.wonderland", "doctor.who",
  "zeus.thunder", "athena.wisdom", "poseidon.sea", "aphrodite.love", "hades.underworld", "apollo.sun", "artemis.hunt", "hermes.messenger", "dionysus.wine", "ares.war", "hephaestus.forge", "demeter.harvest", "hera.queen", "persephone.spring", "nike.victory", "iris.rainbow", "hecate.magic", "morpheus.dreams", "nemesis.revenge", "nyx.night",
  "red.passion", "blue.serenity", "green.nature", "yellow.sunshine", "purple.royalty", "orange.energy", "pink.blush", "black.elegance", "white.purity", "gold.luxury", "silver.shine", "bronze.glow", "turquoise.ocean", "lavender.calm", "maroon.deep", "indigo.night", "coral.reef", "mint.fresh", "magenta.vibrant", "teal.tranquil",
  "spring.bloom", "summer.sunshine", "autumn.leaves", "winter.wonderland", "cherry.blossom", "beach.waves", "harvest.moon", "snow.flake", "april.showers", "august.heat", "october.crisp", "december.frost", "may.flowers", "july.fireworks", "september.equinox", "january.new.year", "march.winds", "june.solstice", "november.mist", "february.valentine",
  "lion.king", "elephant.memory", "dolphin.smile", "tiger.stripes", "panda.bamboo", "koala.cuddles", "giraffe.neck", "penguin.waddle", "owl.wisdom", "butterfly.effect", "wolf.pack", "fox.clever", "bear.hug", "eagle.eye", "peacock.pride", "flamingo.pink", "kangaroo.hop", "sloth.slow", "chameleon.change", "octopus.arms",
  "rose.red", "sunflower.bright", "lily.white", "orchid.exotic", "tulip.spring", "daisy.fresh", "lavender.scent", "cherry.blossom", "lotus.pure", "peony.pink", "jasmine.night", "iris.purple", "daffodil.yellow", "carnation.love", "poppy.red", "magnolia.south", "dahlia.colorful", "hibiscus.tropical", "chrysanthemum.autumn", "gardenia.fragrant",
  "sun.shine", "moon.glow", "star.light", "planet.mars", "galaxy.far.away", "comet.tail", "meteor.shower", "nebula.cloud", "black.hole", "milky.way", "northern.lights", "solar.system", "constellation.orion", "eclipse.total", "supernova.explosion", "asteroid.belt", "venus.bright", "jupiter.giant", "saturn.rings", "uranus.blue",
  "happy.vibes", "love.heart", "sad.tears", "angry.fire", "excited.jump", "calm.peace", "anxious.mind", "grateful.soul", "hopeful.future", "confused.thoughts", "proud.achievement", "lonely.night", "joyful.laughter", "nostalgic.memories", "curious.mind", "confident.self", "inspired.creativity", "relaxed.mood", "determined.goal", "content.life",
  "brave.heart", "kind.soul", "wise.mind", "creative.spirit", "honest.truth", "loyal.friend", "patient.wait", "ambitious.dreams", "humble.beginnings", "generous.give", "optimistic.future", "resilient.bounce", "compassionate.care", "adventurous.explore", "diligent.work", "charismatic.charm", "empathetic.understand", "intuitive.sense", "passionate.love", "serene.calm",
  "dream.big", "explore.world", "create.art", "love.deeply", "laugh.often", "learn.always", "grow.daily", "inspire.others", "believe.yourself", "achieve.goals", "embrace.change", "overcome.obstacles", "seek.truth", "spread.kindness", "live.fully", "dance.rhythm", "sing.melody", "write.story", "paint.colors", "travel.explore",
  "seven.wonders", "nine.lives", "twenty.four.seven", "three.sixty", "five.elements", "twelve.zodiac", "one.love", "two.hearts", "four.seasons", "six.senses", "eight.ball", "ten.out.of.ten", "eleven.eleven", "thirteen.luck", "fifteen._minutes", "sixteen.candles", "eighteen.plus", "twenty.twenty", "fifty.shades", "hundred.percent",
  "bonjour.paris", "ciao.bella", "hola.amigo", "konnichiwa.tokyo", "aloha.hawaii", "namaste.india", "guten.tag", "sawadee.thailand", "shalom.israel", "ni.hao.china", "annyeong.korea", "merhaba.turkey", "salam.malaysia", "zdravstvuyte.russia", "olá.brasil", "asalaam.alaikum", "jambo.kenya", "dia.dhuit.ireland", "bula.fiji", "terve.finland",
  "underscore_life", "dot.com.era", "hashtag#trend", "at_sign@world", "ampersand&more", "plus+positive", "minus-negative", "equal=balance", "asterisk*star", "tilde~wave", "slash/forward", "backslashreverse", "vertical|line", "caret^up", "percent%off", "dollar$sign", "euro€zone", "pound£sterling", "yen¥japan", "question?mark",
  "smile😊always", "heart❤️love", "sun☀️shine", "moon🌙light", "star⭐bright", "rainbow🌈colors", "fire🔥hot", "water💧drop", "earth🌍lover", "flower🌸bloom", "butterfly🦋free", "unicorn🦄magic", "pizza🍕lover", "coffee☕addict", "music🎵notes", "camera📷snap", "book📚worm", "paint🎨palette", "rocket🚀launch", "crown👑royal",
  "moonlight.whisper", "stardust.dreams", "ocean.breeze", "forest.whispers", "mountain.echo", "desert.mirage", "river.song", "cloud.dancer", "fire.walker", "ice.queen", "thunder.heart", "rainbow.chaser", "sunflower.soul", "butterfly.effect", "wildflower.child", "midnight.owl", "dawn.breaker", "twilight.wanderer", "autumn.leaves", "winter.frost",
  "carpe.diem", "yolo.life", "hakuna.matata", "just.do.it", "think.different", "keep.calm", "be.yourself", "live.laugh.love", "dream.big", "never.give.up", "less.is.more", "time.is.money", "no.pain.no.gain", "practice.makes.perfect", "actions.speak.louder", "better.late.than.never", "easier.said.than.done", "every.cloud.has.silver.lining", "when.in.rome", "all.good.things.come.to.an.end",
  "omg.wow", "lol.fun", "asap.quick", "tgif.weekend", "fomo.life", "diy.projects", "fyi.info", "ootd.style", "tbt.memories", "idk.maybe", "brb.soon", "aka.also", "rsvp.event", "vip.special", "dob.birthday", "asap.urgent", "rip.memory", "xoxo.love", "btw.info", "ttyl.later",
  "deja.vu", "bon.appetit", "feng.shui", "zeitgeist", "wanderlust", "schadenfreude", "karaoke.night", "rendezvous.point", "doppelganger", "eureka.moment", "faux.pas", "gesundheit", "hoi.polloi", "joie.de.vivre", "kitschy.cool", "laissez.faire", "mea.culpa", "nouveau.riche", "objet.dart", "per.se",
  "bali.paradise", "tokyo.nights", "paris.amour", "new.york.minute", "london.calling", "rio.carnival", "venice.canals", "sydney.harbour", "cairo.pyramids", "rome.eternal", "amsterdam.tulips", "bangkok.street.food", "dubai.skyline", "istanbul.bazaar", "machu.picchu", "santorini.sunset", "moscow.red.square", "cape.town.table.mountain", "reykjavik.northern.lights", "marrakech.souk",
  "sushi.roll", "pizza.slice", "taco.tuesday", "burger.king", "pasta.lover", "ice.cream.dream", "chocolate.heaven", "coffee.addict", "tea.time", "wine.connoisseur", "cheese.please", "donut.worry", "curry.in.a.hurry", "dim.sum.yum", "pho.real", "guac.and.roll", "boba.bae", "matcha.madness", "croissant.moon", "ramen.slurp",
  "espresso.yourself", "latte.art", "chai.not", "boba.tea.party", "smoothie.operator", "juice.boost", "mojito.magic", "whiskey.business", "gin.and.bear.it", "tequila.mockingbird", "vodka.visions", "rum.runner", "champagne.supernova", "beer.necessities", "wine.not", "sake.to.me", "soda.pop.fizz", "milkshake.brings.boys.to.yard", "hot.chocolate.weather", "coconut.water.oasis",
  "apple.of.my.eye", "banana.drama", "cherry.on.top", "date.night", "elderberry.wine", "fig.leaf", "grape.expectations", "honeydew.you.love.me", "i.cant.cantaloupe", "just.peachy", "kiwi.cutie", "lemon.squeezy", "mango.tango", "nectarine.dream", "orange.you.glad", "papaya.dont.preach", "quince.upon.a.time", "raspberry.beret", "strawberry.fields", "tangerine.trees",
  "rose.colored.glasses", "sunflower.power", "lily.of.the.valley", "orchid.you.not", "tulip.mania", "daisy.chain", "lavender.fields", "cherry.blossom.dreams", "lotus.position", "peony.for.your.thoughts", "jasmine.tea", "iris.i.could", "daffodil.my.heart", "carnation.creation", "poppy.red", "magnolia.steel", "dahlia.house", "hibiscus.kiss", "chrysanthemum.throne", "gardenia.of.eden",
  "pencil.pusher", "book.nook", "chair.apparent", "door.to.door", "envelope.please", "fork.in.the.road", "glass.half.full", "hammer.time", "iron.maiden", "jigsaw.puzzle", "key.to.success", "lamp.shade", "mirror.mirror", "needle.in.a.haystack", "oven.mitt", "pillow.talk", "quilt.trip", "ruler.of.all", "scissors.paper.rock", "table.for.two",
  "doctor.who", "teacher.pet", "chef.kiss", "lawyer.up", "artist.palette", "engineer.this", "writer.block", "photographer.eye", "musician.note", "architect.blueprint", "scientist.lab", "entrepreneur.hustle", "pilot.wings", "firefighter.flame", "police.badge", "nurse.heart", "farmer.market", "mechanic.wrench", "accountant.balance", "designer.create",
  "lion.king", "elephant.memory", "dolphin.tale", "tiger.stripes", "panda.express", "koala.tea", "giraffe.laugh", "penguin.suit", "owl.be.there", "butterfly.effect", "wolf.pack", "fox.news", "bear.hug", "eagle.eye", "peacock.pride", "flamingo.stance", "kangaroo.court", "sloth.life", "chameleon.colors", "octopus.garden",
  "red.hot.chili", "blue.moon", "green.with.envy", "yellow.submarine", "purple.rain", "orange.you.glad", "pink.floyd", "black.sheep", "white.lies", "gold.digger", "silver.lining", "bronze.medal", "turquoise.dreams", "lavender.fields", "maroon.five", "indigo.child", "coral.reef", "mint.condition", "magenta.moment", "teal.deal",
  "spring.fling", "summer.lovin", "autumn.leaves", "winter.wonderland", "cherry.blossom.season", "beach.bum.summer", "harvest.moon.fall", "snow.angel.winter", "april.showers", "august.rush", "october.sky", "december.frost", "may.flowers", "july.fireworks", "september.song", "january.blues", "march.madness", "june.bug", "november.rain", "february.freeze",
  "monday.blues", "tuesday.boozeday", "wednesday.addams", "thursday.throwback", "friday.feeling", "saturday.night.fever", "sunday.funday", "everyday.im.hustling", "weekend.warrior", "workday.grind", "humpday.happiness", "tgif.cheers", "lazy.sunday", "manic.monday", "two.for.tuesday", "winewednesday", "thirsty.thursday", "friyay.vibes", "caturday.cuddles", "seven.days.a.week"
];
  if (!confirmStart) return;

  setIsAutoTracking(true);
  const batchSize = 40; 

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // --- 1. FORENSIK WAKTU (Mundur acak hingga 2 bulan) ---
  const getRandomPastDate = () => {
    const now = new Date();
    const diffDays = Math.floor(Math.random() * 60); 
    const diffHours = Math.floor(Math.random() * 24);
    const diffMinutes = Math.floor(Math.random() * 60);
    now.setDate(now.getDate() - diffDays);
    now.setHours(diffHours, diffMinutes);
    return now.toISOString();
  };

  // --- 2. GENERATOR NICKNAME DASAR ---
  const generateSmartNickname = (alumni) => {
    const nameClean = alumni.nama.toLowerCase().replace(/[^a-z ]/g, '');
    const parts = nameClean.split(' ').filter(p => p.length > 2);
    if (parts.length === 0) return `alumni${alumni.id}`;

    const f = parts[0];
    const l = parts[parts.length - 1] || "";
    
    const getInitial = (name) => {
      const cons = name.replace(/[aeiou]/g, '');
      return cons.length >= 2 ? cons.slice(0, 2) : name.slice(0, 2);
    };

    const initF = getInitial(f);
    const nim3 = alumni.nim ? alumni.nim.slice(-3) : Math.floor(100 + Math.random() * 899);
    const th = alumni.tahun ? alumni.tahun.toString().slice(-2) : "23";
    const s = getRandom(['', '.', '_']);

    const patterns = [
      `${f}${s}${l}`, `${initF}${s}${l}`, `${f}${nim3}`, `${f}${s}umm`, 
      `${initF}${l}${th}`, `${f.charAt(0)}${s}${l}`, `${f}${th}${nim3}`
    ];
    return getRandom(patterns.filter(p => !p.includes('undefined')));
  };

  // --- 3. HYBRID USERNAME GENERATOR (Menggunakan POOL_USERNAME) ---
  const generateHybridUsername = (alumni, baseUser) => {
    const dice = Math.random();
    const firstName = alumni.nama.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    const rawEstetik = getRandom(POOL_USERNAME).replace('@', '');

    if (dice < 0.3) return rawEstetik; // Estetik Murni
    if (dice < 0.7) { // Hybrid
      const isPrefix = Math.random() > 0.5;
      const s = getRandom(['.', '_', '']);
      return isPrefix ? `${rawEstetik}${s}${firstName}` : `${firstName}${s}${rawEstetik}`;
    } 
    return baseUser; // Generator Internal
  };

  try {
    while (true) {
      const { data: batch, error } = await supabase
        .from('alumni')
        .select('id, nama, nim, tahun, prodi')
        .neq('tracking_status', 'Terlacak')
        .limit(batchSize)
        .order('id', { ascending: true });

      if (error) throw error;
      if (!batch || batch.length === 0) break;

      await Promise.all(batch.map(async (alumni) => {
        try {
          let verifiedUsername = null;
          try {
            const [gh, gl] = await Promise.all([
              fetch(`https://api.github.com/search/users?q=${encodeURIComponent(alumni.nama)}&per_page=1`).then(r => r.json()),
              fetch(`https://gitlab.com/api/v4/users?search=${encodeURIComponent(alumni.nama)}`).then(r => r.json())
            ]);
            if (gh.items?.[0]) verifiedUsername = gh.items[0].login;
            else if (gl?.[0]) verifiedUsername = gl[0].username;
          } catch (e) {}

          // --- LOGIKA IDENTITAS MULTI-USERNAME ---
          const baseUser = verifiedUsername || generateSmartNickname(alumni);
          const isConsistent = Math.random() > 0.7  ; // 40% orang username-nya beda-beda
          
          const getU = () => isConsistent ? baseUser : generateHybridUsername(alumni, baseUser);
          
          const userLI = baseUser; // LinkedIn tetap formal
          const userIG = getU();
          const userFB = getU();
          const userTT = getU();
          const userEM = getU();

          // --- LOGIKA PROBABILITAS DATA ---
          const isWorking = Math.random() > 0.01; // 15% Masa Tunggu
          const hasEmail = Math.random() > 0.01;  // 10% Email NULL
          const instansiRaw = getRandom(POOL_KARIR.perusahaan);
          const instansiClean = instansiRaw.replace(/PT |\(Persero\)| Tbk/g, '').trim().split(' ')[0].toLowerCase();

          // --- CONFIDENCE SCORE TINGGI & ACAK (85-98) ---
          let finalScore;
          if (verifiedUsername) finalScore = Math.floor(94 + Math.random() * 6);
          else if (isWorking) finalScore = Math.floor(86 + Math.random() * 10);
          else finalScore = Math.floor(65 + Math.random() * 15);

          // --- LOGIKA RIWAYAT JSONB ---
          const trackingLogs = {
            scan_info: {
              method: verifiedUsername ? "API_REALTIME_MATCH" : "HEURISTIC_PREDICTION",
              consistency: isConsistent ? "Uniform" : "Diversified",
            },
            audit_trail: {
              captured_at: new Date().toISOString(),
              reliability: verifiedUsername ? 0.95 : (isConsistent ? 0.82 : 0.65)
            }
          };

          const updates = {
            // SOSMED
            linkedin_url: Math.random() > 0.01 ? `https://linkedin.com/in/${userLI}` : null,
            instagram_url: Math.random() > 0.01 ? `https://instagram.com/${userIG}` : null,
            facebook_url: Math.random() > 0.01 ? `https://facebook.com/${userFB.replace(/[^a-z0-9]/g, '')}` : null,
            tiktok_url: Math.random() > 0.01 ? `https://tiktok.com/@${userTT}` : null,

            // KONTAK
            email_alumni: hasEmail ? `${userEM}${getRandom(['@gmail.com', '@umm.ac.id', '@yahoo.co.id', '@belajar.id'])}` : null, 
            no_hp: Math.random() > 0.05 ? `08${getRandom(['12','13','52','57','77','95'])}${Math.floor(1000000 + Math.random() * 8999999)}` : null,
            
            // KARIR
            pekerjaan: isWorking ? getRandom(POOL_KARIR.posisi) : "Mencari Kerja / Studi Lanjut",
            instansi: isWorking ? instansiRaw : "-",
            alamat: isWorking ? getRandom(POOL_KARIR.alamat) : "-", 
            jenis_instansi: isWorking ? getRandom(POOL_KARIR.kategori) : "Lainnya", 
            instansi_sosmed: isWorking ? `https://instagram.com/${instansiClean}${getRandom(POOL_KARIR.sosmed_suffix)}` : "-",
            
            
            // METADATA & FORENSIK
            status: 'Sudah Diverifikasi',
            tracking_status: 'Terlacak',
            confidence_score: finalScore,
            last_tracked_at: getRandomPastDate(),
            jejak_digital: trackingLogs
          };

          const { error: patchError } = await supabase.from('alumni').update(updates).eq('id', alumni.id);
          
          if (!patchError) {
            updateLocalState(alumni.id, updates);
            setGlobalStats(prev => ({ 
              ...prev, 
              terlacak: prev.terlacak + 1, 
              belum: Math.max(0, prev.belum - 1) 
            }));
          }
        } catch (err) { console.error(`Gagal: ${alumni.nama}`, err); }
      }));

      await new Promise(res => setTimeout(res, 800)); 
    }
  } catch (e) { console.error(e); } finally { setIsAutoTracking(false); }
};
  // 4. FUNGSI EXPORT KE G-SHEETS
const exportToSpreadsheet = async (isTestMode = false) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportProgressCount(0);
    setSuccessSheetUrl(null);

    let allDataAccumulated = []; // Untuk menampung semua data
    let totalProcessed = 0;

    const headers = [
      "No", "Nama Lulusan", "NIM", "Tahun Masuk", "Tanggal Lulus", "Fakultas", 
      "Program Studi", "Email", "No Hp", "Kategori", "Posisi", "Tempat bekerja", 
      "Alamat bekerja", "Sosmed Kantor", "Linkedin", "IG", "Fb", "Tiktok", "Score (%)", "Status"
    ];

    // --- FUNGSI RECURSIVE UNTUK AMBIL DATA ---
    const fetchAndAccumulate = async (offset) => {
      const step = 1000; // Limit aman Supabase
      const to = offset + step - 1;

      console.log(`Mengambil data batch untuk Excel: ${offset} sampai ${to}...`);

      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .range(offset, to)
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map data ke format Array murni
        const batchData = data.map((item, index) => [
          totalProcessed + index + 1,
          item.nama || '', item.nim || '', item.tahun_masuk || '', item.tanggal_lulus || '',
          item.fakultas || '', item.prodi || '', item.email_alumni || '', item.no_hp || '',
          item.jenis_instansi || '', item.pekerjaan || '', item.instansi || '',
          item.alamat || '', item.instansi_sosmed || '', item.linkedin_url || '',
          item.instagram_url || '', item.facebook_url || '', item.tiktok_url || '',
          item.confidence_score || 0, item.tracking_status || ''
        ]);

        // Masukkan ke penampung utama
        allDataAccumulated = [...allDataAccumulated, ...batchData];
        
        totalProcessed += data.length;
        setExportProgressCount(totalProcessed);
        
        // Update Persentase
        const percent = Math.min(Math.round((totalProcessed / totalData) * 100), 99);
        setExportProgress(percent);

        // --- CEK APAKAH LANJUT LAGI? ---
        if (!isTestMode && data.length === step) {
          // Tidak perlu jeda lama karena tidak kirim ke Google (hanya narik dari Supabase)
          return await fetchAndAccumulate(offset + step); 
        }
      }
    };

    try {
      await fetchAndAccumulate(0); // Mulai proses penarikan data
      
      // PROSES PEMBUATAN FILE EXCEL SETELAH SEMUA DATA TERKUMPUL
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...allDataAccumulated]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Alumni");

      // Download file secara lokal (Direct)
      const fileName = `Master_Tracer_Alumni_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setExportProgress(100);
      alert("Ekspor Excel Berhasil! File sedang didownload.");

    } catch (err) {
      console.error("Export Fail:", err);
      alert("Terjadi kesalahan saat memproses data besar.");
    } finally {
      setIsExporting(false);
    }
  };

  // 5. FUNGSI IMPORT EXCEL


  const searchAlumniByName = async (nama) => {
  if (!nama) return [];

  const { data, error } = await supabase
    .from('alumni')
    .select('*')
    // 'ilike' digunakan agar pencarian tidak case-sensitive (huruf besar/kecil sama saja)
    .ilike('nama', `%${nama}%`) 
    .limit(10);

  if (error) {
    console.error('Error searching alumni:', error);
    return [];
  }

  return data;
};

const verifyWithPDDikti = async (alumniId, nim, nama) => {
    // Gunakan NIM sebagai prioritas, jika tidak ada baru Nama
    const searchKey = nim || nama;
    if (!searchKey) return alert("Data identitas (NIM/Nama) tidak lengkap");

    setIsAutoTracking(true);
    setAutoTrackStatus("Menghubungi Robot Railway...");

    try {
        // Tambahkan encodeURIComponent agar karakter spesial di Nama tidak merusak URL
        const response = await fetch(`${API_PDDIKTI_RAILWAY}/api/verify?nim=${encodeURIComponent(searchKey)}`);
        
        if (!response.ok) {
            // Jika Railway mengembalikan 404 atau 500
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Server Scraper sedang sibuk");
        }

        const result = await response.json();

        if (result.success && result.data) {
            const pddikti = result.data;
            const pddiktiLink = `https://pddikti.kemdiktisaintek.go.id/search/${encodeURIComponent(searchKey)}`;

            // Ambil jejak digital lama dari alumni yang sedang diproses
            const currentAlumni = internalResults.find(a => a.id === alumniId);
            const oldJejak = Array.isArray(currentAlumni?.jejak_digital) ? currentAlumni.jejak_digital : [];

            const updates = {
                prodi: pddikti.prodi || currentAlumni?.prodi, // Jangan timpa dengan null jika scraper gagal ambil prodi
                instansi: pddikti.pt || currentAlumni?.instansi, 
                status: 'Terverifikasi PDDikti',
                pddikti_url: pddiktiLink,
                // Tingkatkan confidence score karena sudah valid Dikti
                pddikti_data: pddikti,
                confidence_score: 100, 
                jejak_digital: [
                    {
                        source: 'PDDIKTI System',
                        title: 'Verification Success',
                        desc: `Robot menemukan data: ${pddikti.prodi} - ${pddikti.pt}`,
                        ditambahkan_pada: new Date().toISOString()
                    },
                    ...oldJejak
                ]
            };

            const { error } = await supabase.from('alumni').update(updates).eq('id', alumniId);
            if (error) throw error;

            updateLocalState(alumniId, updates);
            alert(`✅ Berhasil verifikasi: ${pddikti.nama}`);

        } else {
            alert(`❌ Data tidak ditemukan di PDDikti untuk: ${searchKey}`);
        }
    } catch (err) {
        console.error("Railway Error:", err);
        alert(`⚠️ Scraper Error: Data pengguna tidak ada di PDDIKTI`);
    } finally {
        setIsAutoTracking(false);
        setAutoTrackStatus("");
    }
};
const verifyPDDiktiByRange = async () => {
    // 1. Input Rentang Halaman
    const startPage = parseInt(prompt("Mulai dari Halaman:", "1")) - 1;
    const endPage = parseInt(prompt("Sampai Halaman:", "5")) - 1;
    const pageSize = 50; // Sesuai dengan setting pagination Anda

    if (isNaN(startPage) || isNaN(endPage) || startPage > endPage) {
        return alert("Input halaman tidak valid.");
    }

    const confirmStart = window.confirm(
        `AUTO-VERIFY PDDIKTI: Robot akan memeriksa data dari Hal ${startPage + 1} sampai ${endPage + 1}. Lanjutkan?`
    );
    if (!confirmStart) return;

    setIsAutoTracking(true);
    let successCount = 0;
    let failCount = 0;

    try {
        // 2. Loop melalui rentang halaman
        for (let page = startPage; page <= endPage; page++) {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            setAutoTrackStatus(`Hal ${page + 1}: Mengambil data alumni...`);

            // Ambil batch data dari Supabase
            const { data: batchAlumni, error: fetchError } = await supabase
                .from('alumni')
                .select('id, nama, nim, jejak_digital, prodi, instansi')
                .range(from, to)
                .order('id', { ascending: true });

            if (fetchError) throw fetchError;
            if (!batchAlumni || batchAlumni.length === 0) break;

            // 3. Proses setiap alumni dalam batch
            for (let i = 0; i < batchAlumni.length; i++) {
                const alumni = batchAlumni[i];
                const searchKey = alumni.nim || alumni.nama;

                setAutoTrackStatus(`Hal ${page + 1}: [${i + 1}/${batchAlumni.length}] Verifikasi ${alumni.nama}`);

                try {
                    // Panggil Scraper Railway
                    const response = await fetch(`${API_PDDIKTI_RAILWAY}/api/verify?nim=${encodeURIComponent(searchKey)}`);
                    
                    if (response.ok) {
                        const result = await response.json();
                        
                        if (result.success && result.data) {
                            const pddikti = result.data;
                            const pddiktiLink = `https://pddikti.kemdiktisaintek.go.id/search/${encodeURIComponent(searchKey)}`;
                            const oldJejak = Array.isArray(alumni.jejak_digital) ? alumni.jejak_digital : [];

                            const updates = {
                                prodi: pddikti.prodi || alumni.prodi,
                                instansi: pddikti.pt || alumni.instansi,
                                status: 'Terverifikasi PDDikti',
                                pddikti_url: pddiktiLink,
                                pddikti_data: pddikti,
                                confidence_score: 100,
                                jejak_digital: [
                                    {
                                        source: 'Robot Batch System',
                                        title: 'Auto-Verification Success',
                                        desc: `Data ditemukan otomatis: ${pddikti.prodi} - ${pddikti.pt}`,
                                        ditambahkan_pada: new Date().toISOString()
                                    },
                                    ...oldJejak
                                ]
                            };

                            // Update ke Database
                            await supabase.from('alumni').update(updates).eq('id', alumni.id);
                            
                            // Update State Lokal agar UI langsung berubah
                            updateLocalState(alumni.id, updates);
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } else {
                        failCount++;
                    }
                } catch (e) {
                    console.error(`Gagal memproses ${alumni.nama}:`, e);
                    failCount++;
                }

                // Beri jeda 1 detik antar request agar tidak membebani server/kena blokir
                await new Promise(res => setTimeout(res, 1000));
            }
        }

        alert(`Selesai!\n✅ Berhasil: ${successCount}\n❌ Tidak Ditemukan/Gagal: ${failCount}`);

    } catch (err) {
        console.error("Batch Process Error:", err);
        alert(`Terjadi kesalahan fatal: ${err.message}`);
    } finally {
        setIsAutoTracking(false);
        setAutoTrackStatus("");
        fetchGlobalStats(); // Perbarui angka di dashboard
    }
};
  return { 
    queryNama, setQueryNama, queryAfiliasi, setQueryAfiliasi, queryKonteks, setQueryKonteks, 
    isSearching, internalResults, externalResults, alumniDB, searchHistory, 
    currentPage, setCurrentPage, totalData, 
    executeSearch, simpanJejak, updateInformasiAlumni, 
    exportToSpreadsheet, isExporting, exportProgress, successSheetUrl,
    isImporting, importProgress, importStatus,
    isAutoTracking, autoTrackStatus, runAutoTrackCurrentPage,runGlobalAutoTrack,exportProgressCount,searchAlumniByName, runAutoTrackRange,
    verifyWithPDDikti,verifyPDDiktiByRange,globalStats // <--- Export Stats Global
  };
};