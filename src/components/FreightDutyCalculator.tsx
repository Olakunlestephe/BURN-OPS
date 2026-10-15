import React, { useState, useMemo } from 'react';
import { useBurnOps } from '../context/BurnOpsContext';
import {
  Calculator,
  Scale,
  Box,
  Truck,
  Ship,
  Plane,
  Receipt,
  FileCheck2,
  DollarSign,
  Sparkles,
  HelpCircle,
  Copy,
  Download,
  Check,
  RotateCcw,
  Plus,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Info,
} from 'lucide-react';

// Destinations with tariff and port surcharge parameters
export interface DestinationInfo {
  id: string;
  country: string;
  port: string;
  type: 'EAC' | 'ECOWAS' | 'SADC' | 'INTERNATIONAL';
  currency: string;
  exchangeRateToUSD: number;
  standardDutyRate: number; // e.g. 0.25 (25%)
  cleanStoveDutyRate: number; // e.g. 0.0 or 0.10 (incentive)
  vatRate: number; // e.g. 0.16 (16%)
  cleanStoveVatExempt: boolean;
  idfFeeRate: number; // Import Declaration Fee / Inspection
  rdlFeeRate: number; // Railway / Infrastructure development levy
  portHandlingBaseUSD: number;
  seaFreightPerCBM: number; // Ocean freight estimate per CBM
  airFreightPerKg: number; // Air cargo estimate per kg
  roadFreightPerKg: number; // Overland trucking estimate per kg
  seaTransitDays: string;
  airTransitDays: string;
  roadTransitDays: string;
}

export const DESTINATIONS: DestinationInfo[] = [
  {
    id: 'KE-MBA',
    country: 'Kenya',
    port: 'Mombasa / ICD Nairobi',
    type: 'EAC',
    currency: 'KES',
    exchangeRateToUSD: 130,
    standardDutyRate: 0.25,
    cleanStoveDutyRate: 0.0, // 0% duty on clean cookstoves under East Africa CET green energy incentive
    vatRate: 0.16,
    cleanStoveVatExempt: true, // Clean energy VAT zero-rated
    idfFeeRate: 0.025, // 2.5% IDF
    rdlFeeRate: 0.02, // 2.0% RDL
    portHandlingBaseUSD: 240,
    seaFreightPerCBM: 48,
    airFreightPerKg: 4.2,
    roadFreightPerKg: 0.14,
    seaTransitDays: '18-24 days',
    airTransitDays: '2-4 days',
    roadTransitDays: '3-5 days',
  },
  {
    id: 'UG-KLA',
    country: 'Uganda',
    port: 'Kampala / Port Bell Corridor',
    type: 'EAC',
    currency: 'UGX',
    exchangeRateToUSD: 3750,
    standardDutyRate: 0.25,
    cleanStoveDutyRate: 0.0, // 0% duty under EAC renewable energy schedule
    vatRate: 0.18,
    cleanStoveVatExempt: true,
    idfFeeRate: 0.02,
    rdlFeeRate: 0.015,
    portHandlingBaseUSD: 280,
    seaFreightPerCBM: 62, // Sea to Mombasa + road feeder
    airFreightPerKg: 4.8,
    roadFreightPerKg: 0.18,
    seaTransitDays: '24-30 days',
    airTransitDays: '3-5 days',
    roadTransitDays: '4-6 days',
  },
  {
    id: 'TZ-DAR',
    country: 'Tanzania',
    port: 'Dar es Salaam / Arusha',
    type: 'EAC',
    currency: 'TZS',
    exchangeRateToUSD: 2600,
    standardDutyRate: 0.25,
    cleanStoveDutyRate: 0.1, // 10% preferential duty
    vatRate: 0.18,
    cleanStoveVatExempt: false,
    idfFeeRate: 0.02,
    rdlFeeRate: 0.015,
    portHandlingBaseUSD: 250,
    seaFreightPerCBM: 52,
    airFreightPerKg: 4.6,
    roadFreightPerKg: 0.16,
    seaTransitDays: '20-26 days',
    airTransitDays: '3-4 days',
    roadTransitDays: '4-7 days',
  },
  {
    id: 'RW-KGL',
    country: 'Rwanda',
    port: 'Kigali / Gikondo Dry Port',
    type: 'EAC',
    currency: 'RWF',
    exchangeRateToUSD: 1320,
    standardDutyRate: 0.25,
    cleanStoveDutyRate: 0.0, // 0% duty on certified clean cookstoves
    vatRate: 0.18,
    cleanStoveVatExempt: true,
    idfFeeRate: 0.015,
    rdlFeeRate: 0.015,
    portHandlingBaseUSD: 290,
    seaFreightPerCBM: 68,
    airFreightPerKg: 5.1,
    roadFreightPerKg: 0.22,
    seaTransitDays: '26-34 days',
    airTransitDays: '3-5 days',
    roadTransitDays: '5-8 days',
  },
  {
    id: 'NG-LOS',
    country: 'Nigeria',
    port: 'Lagos / Apapa / Tin Can',
    type: 'ECOWAS',
    currency: 'NGN',
    exchangeRateToUSD: 1450,
    standardDutyRate: 0.2,
    cleanStoveDutyRate: 0.05, // 5% clean energy tariff
    vatRate: 0.075, // 7.5% VAT
    cleanStoveVatExempt: false,
    idfFeeRate: 0.01, // CISS 1%
    rdlFeeRate: 0.005, // ETLS 0.5%
    portHandlingBaseUSD: 360,
    seaFreightPerCBM: 72,
    airFreightPerKg: 5.8,
    roadFreightPerKg: 0.35,
    seaTransitDays: '30-42 days',
    airTransitDays: '4-6 days',
    roadTransitDays: 'N/A (Maritime/Air)',
  },
  {
    id: 'GH-TEM',
    country: 'Ghana',
    port: 'Tema / Accra Kotoka',
    type: 'ECOWAS',
    currency: 'GHS',
    exchangeRateToUSD: 15.2,
    standardDutyRate: 0.2,
    cleanStoveDutyRate: 0.05,
    vatRate: 0.15,
    cleanStoveVatExempt: false,
    idfFeeRate: 0.02,
    rdlFeeRate: 0.01,
    portHandlingBaseUSD: 310,
    seaFreightPerCBM: 65,
    airFreightPerKg: 5.4,
    roadFreightPerKg: 0.32,
    seaTransitDays: '28-38 days',
    airTransitDays: '3-5 days',
    roadTransitDays: 'N/A (Maritime/Air)',
  },
  {
    id: 'MZ-MPM',
    country: 'Mozambique',
    port: 'Maputo / Beira',
    type: 'SADC',
    currency: 'MZN',
    exchangeRateToUSD: 64,
    standardDutyRate: 0.2,
    cleanStoveDutyRate: 0.075,
    vatRate: 0.17,
    cleanStoveVatExempt: false,
    idfFeeRate: 0.02,
    rdlFeeRate: 0.01,
    portHandlingBaseUSD: 290,
    seaFreightPerCBM: 58,
    airFreightPerKg: 5.2,
    roadFreightPerKg: 0.28,
    seaTransitDays: '22-30 days',
    airTransitDays: '3-5 days',
    roadTransitDays: '8-12 days',
  },
  {
    id: 'CD-GOM',
    country: 'DR Congo',
    port: 'Goma / Bukavu / Matadi',
    type: 'INTERNATIONAL',
    currency: 'USD',
    exchangeRateToUSD: 1,
    standardDutyRate: 0.2,
    cleanStoveDutyRate: 0.1,
    vatRate: 0.16,
    cleanStoveVatExempt: false,
    idfFeeRate: 0.025,
    rdlFeeRate: 0.02,
    portHandlingBaseUSD: 340,
    seaFreightPerCBM: 80,
    airFreightPerKg: 6.2,
    roadFreightPerKg: 0.38,
    seaTransitDays: '32-45 days',
    airTransitDays: '4-7 days',
    roadTransitDays: '7-12 days',
  },
];

export interface CargoPreset {
  id: string;
  name: string;
  desc: string;
  commodity: 'clean_stoves' | 'raw_materials' | 'parts' | 'general';
  weightKg: number;
  packagesCount: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValueUSD: number;
  units: number;
  mode: 'sea' | 'air' | 'road';
}

const PRESETS: CargoPreset[] = [
  {
    id: 'pallet_eco_100',
    name: '1 Pallet: 100x BS-ECO Clean Cookstoves',
    desc: 'Euro-pallet with 100 packaged portable charcoal/wood clean cookstoves',
    commodity: 'clean_stoves',
    weightKg: 340,
    packagesCount: 1,
    lengthCm: 120,
    widthCm: 80,
    heightCm: 155,
    declaredValueUSD: 3800,
    units: 100,
    mode: 'sea',
  },
  {
    id: 'pallet_pro_80',
    name: '1 Pallet: 80x BS-PRO High-Efficiency Stoves',
    desc: 'Commercial heavy-duty institutional clean biomass cookstoves',
    commodity: 'clean_stoves',
    weightKg: 420,
    packagesCount: 1,
    lengthCm: 120,
    widthCm: 100,
    heightCm: 160,
    declaredValueUSD: 5200,
    units: 80,
    mode: 'sea',
  },
  {
    id: 'fcl_20ft_1200',
    name: '20ft FCL Container: 1,200x Clean Cookstoves',
    desc: 'Standard ocean container batch destined for international distributor',
    commodity: 'clean_stoves',
    weightKg: 4250,
    packagesCount: 12,
    lengthCm: 120,
    widthCm: 80,
    heightCm: 155,
    declaredValueUSD: 45600,
    units: 1200,
    mode: 'sea',
  },
  {
    id: 'coil_stainless_steel',
    name: 'Raw Material: 2x Stainless Steel Coils',
    desc: 'Grade 304/430 stainless steel stamping rolls for combustion chamber fabrication',
    commodity: 'raw_materials',
    weightKg: 2400,
    packagesCount: 2,
    lengthCm: 100,
    widthCm: 100,
    heightCm: 85,
    declaredValueUSD: 7200,
    units: 2,
    mode: 'sea',
  },
  {
    id: 'air_sample_batch',
    name: 'Air Express: 25x Pilot Evaluation Samples',
    desc: 'Urgent airfreight consignment for government test lab / UN certification',
    commodity: 'clean_stoves',
    weightKg: 95,
    packagesCount: 5,
    lengthCm: 60,
    widthCm: 45,
    heightCm: 45,
    declaredValueUSD: 1150,
    units: 25,
    mode: 'air',
  },
];

interface FreightDutyCalculatorProps {
  onApplyToNewShipment?: (data: {
    type: 'import' | 'export';
    ref: string;
    desc: string;
    party: string;
    reg: string;
    dest: string;
    eta: string;
  }) => void;
}

export const FreightDutyCalculator: React.FC<FreightDutyCalculatorProps> = ({
  onApplyToNewShipment,
}) => {
  const { visibleWarehouses, showToast } = useBurnOps();

  // Inputs
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('UG-KLA');
  const [transportMode, setTransportMode] = useState<'sea' | 'air' | 'road'>('sea');
  const [commodity, setCommodity] = useState<
    'clean_stoves' | 'raw_materials' | 'parts' | 'general'
  >('clean_stoves');

  const [weightKg, setWeightKg] = useState<number>(340);
  const [packagesCount, setPackagesCount] = useState<number>(1);
  const [lengthCm, setLengthCm] = useState<number>(120);
  const [widthCm, setWidthCm] = useState<number>(80);
  const [heightCm, setHeightCm] = useState<number>(155);
  const [declaredValueUSD, setDeclaredValueUSD] = useState<number>(3800);
  const [totalUnits, setTotalUnits] = useState<number>(100);

  // Incentive checkbox
  const [applyCleanEnergyIncentive, setApplyCleanEnergyIncentive] = useState<boolean>(true);

  // Copy indicator
  const [copied, setCopied] = useState(false);

  // Active destination data
  const destination = useMemo(() => {
    return (
      DESTINATIONS.find((d) => d.id === selectedDestinationId) || DESTINATIONS[0]
    );
  }, [selectedDestinationId]);

  // Load preset
  const handleLoadPreset = (preset: CargoPreset) => {
    setCommodity(preset.commodity);
    setWeightKg(preset.weightKg);
    setPackagesCount(preset.packagesCount);
    setLengthCm(preset.lengthCm);
    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setDeclaredValueUSD(preset.declaredValueUSD);
    setTotalUnits(preset.units);
    setTransportMode(preset.mode);
    showToast(`Loaded preset: ${preset.name}`);
  };

  // 1. Physical and Volumetric calculations
  const volumePerPackageM3 = (lengthCm * widthCm * heightCm) / 1_000_000;
  const totalVolumeCBM = Number((volumePerPackageM3 * packagesCount).toFixed(3));

  // Volumetric weight factors:
  // Air standard IATA: 1 CBM = 167 kg (or L x W x H in cm / 6000)
  // Sea standard: 1 CBM = 1,000 kg (revenue tonne)
  // Road standard: 1 CBM = 333 kg (3:1 ratio)
  const volumetricWeightKg = useMemo(() => {
    if (transportMode === 'air') {
      return Number(((lengthCm * widthCm * heightCm * packagesCount) / 6000).toFixed(1));
    }
    if (transportMode === 'road') {
      return Number((totalVolumeCBM * 333.3).toFixed(1));
    }
    // sea
    return Number((totalVolumeCBM * 1000).toFixed(1));
  }, [transportMode, lengthCm, widthCm, heightCm, packagesCount, totalVolumeCBM]);

  const chargeableWeightKg = Math.max(weightKg, volumetricWeightKg);
  const isVolumetricHigher = volumetricWeightKg > weightKg;

  // 2. Base Freight calculation
  const freightDetails = useMemo(() => {
    let baseFreightUSD = 0;
    let bafFuelSurchargeUSD = 0;
    let terminalPortUSD = destination.portHandlingBaseUSD;

    if (transportMode === 'sea') {
      // Sea uses revenue tonne: max of CBM or (Gross weight in MT)
      const revenueTonnes = Math.max(totalVolumeCBM, weightKg / 1000);
      baseFreightUSD = revenueTonnes * destination.seaFreightPerCBM;
      bafFuelSurchargeUSD = baseFreightUSD * 0.15; // 15% Bunker Adjustment Factor
    } else if (transportMode === 'air') {
      baseFreightUSD = chargeableWeightKg * destination.airFreightPerKg;
      bafFuelSurchargeUSD = chargeableWeightKg * 0.45; // $0.45/kg fuel surcharge
    } else {
      // Road
      baseFreightUSD = chargeableWeightKg * destination.roadFreightPerKg;
      bafFuelSurchargeUSD = baseFreightUSD * 0.12; // 12% road fuel levy
    }

    // Marine / Transit Insurance: 0.6% of declared cargo value + freight
    const transitInsuranceUSD = Math.max(
      35,
      Number(((declaredValueUSD + baseFreightUSD) * 0.006).toFixed(2))
    );

    const totalFreightAndTransitUSD =
      baseFreightUSD + bafFuelSurchargeUSD + terminalPortUSD + transitInsuranceUSD;

    return {
      baseFreightUSD: Number(baseFreightUSD.toFixed(2)),
      bafFuelSurchargeUSD: Number(bafFuelSurchargeUSD.toFixed(2)),
      terminalPortUSD: Number(terminalPortUSD.toFixed(2)),
      transitInsuranceUSD: Number(transitInsuranceUSD.toFixed(2)),
      totalFreightAndTransitUSD: Number(totalFreightAndTransitUSD.toFixed(2)),
    };
  }, [transportMode, totalVolumeCBM, weightKg, chargeableWeightKg, destination, declaredValueUSD]);

  // 3. Customs Duty and Tariff calculation
  const tariffDetails = useMemo(() => {
    // CIF Value = Declared Cost (FOB) + Total Freight + Insurance
    const cifUSD = declaredValueUSD + freightDetails.totalFreightAndTransitUSD;

    // Determine applicable duty rate
    let effectiveDutyRate = destination.standardDutyRate;
    let isCleanEnergyIncentiveActive = false;

    if (commodity === 'clean_stoves') {
      if (applyCleanEnergyIncentive) {
        effectiveDutyRate = destination.cleanStoveDutyRate;
        isCleanEnergyIncentiveActive = true;
      }
    } else if (commodity === 'raw_materials') {
      effectiveDutyRate = 0.0; // Raw materials under EAC/ECOWAS industrial schedule 0%
    } else if (commodity === 'parts') {
      effectiveDutyRate = 0.1; // 10% parts schedule
    }

    // Customs Import Duty
    const customsDutyUSD = cifUSD * effectiveDutyRate;

    // Import Declaration Fee (IDF) / Regulatory Inspection
    const idfUSD = cifUSD * destination.idfFeeRate;

    // Railway / Infrastructure Development Levy
    const rdlUSD = cifUSD * destination.rdlFeeRate;

    // Value Added Tax (VAT)
    // VAT is assessed on: (CIF + Customs Duty + RDL + IDF)
    const vatTaxableBaseUSD = cifUSD + customsDutyUSD + idfUSD + rdlUSD;
    let vatUSD = vatTaxableBaseUSD * destination.vatRate;

    if (
      commodity === 'clean_stoves' &&
      applyCleanEnergyIncentive &&
      destination.cleanStoveVatExempt
    ) {
      vatUSD = 0; // Exempted under green energy schedule
    }

    const totalTaxesAndDutiesUSD = customsDutyUSD + idfUSD + rdlUSD + vatUSD;

    // Calculate baseline standard duty without incentives to display savings
    const standardBaselineDutyUSD = cifUSD * destination.standardDutyRate;
    const standardBaselineVatUSD =
      (cifUSD + standardBaselineDutyUSD + idfUSD + rdlUSD) * destination.vatRate;
    const standardBaselineTotalTaxesUSD =
      standardBaselineDutyUSD + idfUSD + rdlUSD + standardBaselineVatUSD;

    const incentiveSavingsUSD = Math.max(
      0,
      standardBaselineTotalTaxesUSD - totalTaxesAndDutiesUSD
    );

    return {
      cifUSD: Number(cifUSD.toFixed(2)),
      effectiveDutyRate,
      isCleanEnergyIncentiveActive,
      customsDutyUSD: Number(customsDutyUSD.toFixed(2)),
      idfUSD: Number(idfUSD.toFixed(2)),
      rdlUSD: Number(rdlUSD.toFixed(2)),
      vatUSD: Number(vatUSD.toFixed(2)),
      totalTaxesAndDutiesUSD: Number(totalTaxesAndDutiesUSD.toFixed(2)),
      incentiveSavingsUSD: Number(incentiveSavingsUSD.toFixed(2)),
    };
  }, [
    declaredValueUSD,
    freightDetails.totalFreightAndTransitUSD,
    destination,
    commodity,
    applyCleanEnergyIncentive,
  ]);

  // 4. Landed Totals & Unit Economics
  const totalLandedCostUSD = Number(
    (tariffDetails.cifUSD + tariffDetails.totalTaxesAndDutiesUSD).toFixed(2)
  );
  const costPerUnitUSD = totalUnits > 0 ? Number((totalLandedCostUSD / totalUnits).toFixed(2)) : 0;
  const costPerKgUSD = weightKg > 0 ? Number((totalLandedCostUSD / weightKg).toFixed(2)) : 0;
  const localCurrencyTotal = Number(
    (totalLandedCostUSD * destination.exchangeRateToUSD).toFixed(0)
  );

  const estimatedLeadTime =
    transportMode === 'sea'
      ? destination.seaTransitDays
      : transportMode === 'air'
      ? destination.airTransitDays
      : destination.roadTransitDays;

  // Copy full summary to clipboard
  const handleCopySummary = () => {
    const text = `
=== BURN OPS FREIGHT & DUTY ESTIMATE ===
Destination: ${destination.country} (${destination.port}) [${destination.type}]
Transport Mode: ${transportMode.toUpperCase()} | Transit Time: ${estimatedLeadTime}
Commodity: ${
      commodity === 'clean_stoves'
        ? 'Clean Cookstoves (HS 7321)'
        : commodity === 'raw_materials'
        ? 'Raw Materials'
        : 'Spare Parts'
    }
Gross Weight: ${weightKg} kg | Volumetric Weight: ${volumetricWeightKg} kg
Chargeable Weight: ${chargeableWeightKg} kg | Volume: ${totalVolumeCBM} CBM (${packagesCount} pkgs)
Cargo Declared Value: $${declaredValueUSD.toLocaleString()} USD (${totalUnits} units)

--- FREIGHT & TRANSIT BREAKDOWN ---
Base Freight: $${freightDetails.baseFreightUSD.toLocaleString()} USD
Fuel Surcharge (BAF): $${freightDetails.bafFuelSurchargeUSD.toLocaleString()} USD
Port / Terminal Handling: $${freightDetails.terminalPortUSD.toLocaleString()} USD
Transit Insurance: $${freightDetails.transitInsuranceUSD.toLocaleString()} USD
Total Freight & Logistics: $${freightDetails.totalFreightAndTransitUSD.toLocaleString()} USD

--- CUSTOMS DUTIES & TARIFFS ---
CIF Valuation: $${tariffDetails.cifUSD.toLocaleString()} USD
Import Duty (${(tariffDetails.effectiveDutyRate * 100).toFixed(0)}%): $${tariffDetails.customsDutyUSD.toLocaleString()} USD
IDF Declaration Fee: $${tariffDetails.idfUSD.toLocaleString()} USD
Railway / Infra Levy: $${tariffDetails.rdlUSD.toLocaleString()} USD
VAT (${(destination.vatRate * 100).toFixed(0)}%): $${tariffDetails.vatUSD.toLocaleString()} USD
Total Customs & Taxes: $${tariffDetails.totalTaxesAndDutiesUSD.toLocaleString()} USD

--- TOTAL LANDED SUMMARY ---
Total Landed Cost: $${totalLandedCostUSD.toLocaleString()} USD (~ ${localCurrencyTotal.toLocaleString()} ${destination.currency})
Landed Cost Per Unit: $${costPerUnitUSD} USD / unit
Clean Energy Duty Savings: $${tariffDetails.incentiveSavingsUSD.toLocaleString()} USD
========================================
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Freight & duty estimate copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  // Export CSV
  const handleDownloadCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `Category,Parameter,Value,Unit
Shipment,Destination,${destination.country} - ${destination.port},Location
Shipment,Trade Agreement,${destination.type},Bloc
Shipment,Transport Mode,${transportMode.toUpperCase()},Mode
Shipment,Estimated Transit Time,${estimatedLeadTime},Days
Metrics,Gross Weight,${weightKg},KG
Metrics,Dimensions (LxWxH),${lengthCm}x${widthCm}x${heightCm},CM
Metrics,Packages Count,${packagesCount},Packages
Metrics,Volume,${totalVolumeCBM},CBM
Metrics,Volumetric Weight,${volumetricWeightKg},KG
Metrics,Chargeable Weight,${chargeableWeightKg},KG
Valuation,Declared FOB Value,${declaredValueUSD},USD
Valuation,Units Count,${totalUnits},Units
Freight,Base Freight,${freightDetails.baseFreightUSD},USD
Freight,Fuel Surcharge (BAF),${freightDetails.bafFuelSurchargeUSD},USD
Freight,Port Terminal Handling,${freightDetails.terminalPortUSD},USD
Freight,Transit Insurance,${freightDetails.transitInsuranceUSD},USD
Freight,Total Freight & Transit,${freightDetails.totalFreightAndTransitUSD},USD
Customs,CIF Value,${tariffDetails.cifUSD},USD
Customs,Customs Duty Rate,${(tariffDetails.effectiveDutyRate * 100).toFixed(1)}%,Rate
Customs,Customs Duty Amount,${tariffDetails.customsDutyUSD},USD
Customs,Import Declaration Fee (IDF),${tariffDetails.idfUSD},USD
Customs,Railway Development Levy (RDL),${tariffDetails.rdlUSD},USD
Customs,Value Added Tax (VAT),${tariffDetails.vatUSD},USD
Customs,Total Duties and Taxes,${tariffDetails.totalTaxesAndDutiesUSD},USD
Incentives,Clean Energy Concession Savings,${tariffDetails.incentiveSavingsUSD},USD
Landed,Total Landed Cost USD,${totalLandedCostUSD},USD
Landed,Total Landed Cost Local,${localCurrencyTotal},${destination.currency}
Landed,Landed Cost Per Unit,${costPerUnitUSD},USD/unit
Landed,Landed Cost Per KG,${costPerKgUSD},USD/kg
`
      );

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute(
      'download',
      `BurnOps_Tariff_Estimate_${destination.country}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded tariff and freight breakdown CSV');
  };

  // Convert to Tracked Shipment
  const handleConvertToShipment = () => {
    if (!onApplyToNewShipment) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ref = `EXP-${destination.country.slice(0, 3).toUpperCase()}-${randomSuffix}`;
    const desc = `${totalUnits}x ${
      commodity === 'clean_stoves' ? 'Clean Cookstoves' : 'Materials'
    } (${weightKg}kg / ${totalVolumeCBM} CBM) to ${destination.country}`;

    // Target warehouse if exists in that region
    const matchedWh = visibleWarehouses.find(
      (w) =>
        w.n.toLowerCase().includes(destination.country.toLowerCase()) ||
        w.reg.toLowerCase().includes(destination.country.toLowerCase())
    );

    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + (transportMode === 'air' ? 4 : 24));
    const etaString = etaDate.toISOString().split('T')[0];

    onApplyToNewShipment({
      type: 'export',
      ref,
      desc,
      party: `${destination.country} Distribution Hub`,
      reg: destination.type === 'EAC' ? 'Western' : 'Central',
      dest: matchedWh ? matchedWh.id : visibleWarehouses[0]?.id || '',
      eta: etaString,
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-5 sm:p-6 border border-stone-700/60 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#E8590C] text-white">
                <Calculator className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                International Freight &amp; Customs Duty Calculator
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
              Model cross-border shipping costs, volumetric freight rates, and EAC/ECOWAS customs
              tariffs. Calculate landed unit economics with clean cookstove duty exemptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-400" />
                  <span>Copy Quote</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-stone-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-4 border-t border-stone-700/80">
          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E8590C]" />
            <span>Quick-Load Burn Stoves Consignment Presets:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleLoadPreset(p)}
                className="py-1 px-3 rounded-lg text-xs font-medium bg-stone-800/90 hover:bg-[#E8590C]/20 hover:border-[#E8590C]/60 text-stone-200 border border-stone-700 transition cursor-pointer text-left"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Calculation Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculation Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#E8590C]" />
                <h3 className="font-bold font-heading text-sm text-stone-900 dark:text-stone-100">
                  Consignment &amp; Routing Parameters
                </h3>
              </div>
              <span className="text-[11px] font-mono text-stone-400">Step 1 of 2</span>
            </div>

            {/* Destination Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>Destination Country &amp; Port</span>
                <span className="text-[10px] uppercase font-bold text-stone-400">
                  {destination.type} Trade Bloc
                </span>
              </label>
              <select
                value={selectedDestinationId}
                onChange={(e) => setSelectedDestinationId(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#E8590C]/30"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.country} — {d.port} ({d.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Transport Mode Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Transport Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTransportMode('sea')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    transportMode === 'sea'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/60 dark:border-blue-600 dark:text-blue-300 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <Ship className="w-4 h-4" />
                  <span>Sea Freight</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportMode('air')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    transportMode === 'air'
                      ? 'bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-950/60 dark:border-amber-600 dark:text-amber-300 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <Plane className="w-4 h-4" />
                  <span>Air Cargo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportMode('road')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    transportMode === 'road'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-600 dark:text-emerald-300 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Road Freight</span>
                </button>
              </div>
            </div>

            {/* Commodity Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Commodity &amp; HS Schedule
              </label>
              <select
                value={commodity}
                onChange={(e) => setCommodity(e.target.value as any)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
              >
                <option value="clean_stoves">
                  Clean Cookstoves &amp; Biomass Stoves (HS 7321.11 / 7321.19)
                </option>
                <option value="raw_materials">
                  Raw Materials: Stainless Steel Coils &amp; Ceramics (HS 7219)
                </option>
                <option value="parts">
                  Cookstove Spare Parts, Tooling &amp; Grates (HS 7321.90)
                </option>
                <option value="general">General Commercial Manufacturing Goods</option>
              </select>
            </div>

            {/* Clean Energy Concession Toggle */}
            {commodity === 'clean_stoves' && (
              <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="cleanIncentive"
                  checked={applyCleanEnergyIncentive}
                  onChange={(e) => setApplyCleanEnergyIncentive(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#E8590C] focus:ring-[#E8590C] cursor-pointer"
                />
                <label htmlFor="cleanIncentive" className="text-xs cursor-pointer select-none">
                  <strong className="text-stone-900 dark:text-stone-100 block">
                    Apply Clean Energy Duty Concession
                  </strong>
                  <span className="text-stone-600 dark:text-stone-400 text-[11px] block mt-0.5">
                    Recognizes renewable cooking equipment duty waiver (0% or preferential rates)
                    under East African &amp; ECOWAS green transitions.
                  </span>
                </label>
              </div>
            )}

            {/* Weight & Packages Input */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Gross Weight (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={weightKg || ''}
                    onChange={(e) => setWeightKg(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 pr-8 text-xs font-bold font-mono text-stone-900 dark:text-stone-100"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-stone-400 font-bold">
                    KG
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Total Packages / Pallets
                </label>
                <input
                  type="number"
                  min="1"
                  value={packagesCount || ''}
                  onChange={(e) => setPackagesCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Dimensions (LxWxH) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Dimensions per Package (cm)
                </label>
                <span className="text-[11px] font-mono text-stone-400">
                  Vol: {totalVolumeCBM} m³ (CBM)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="L"
                      value={lengthCm || ''}
                      onChange={(e) => setLengthCm(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 pr-6 text-xs font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-stone-400">L</span>
                  </div>
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">
                    Length cm
                  </span>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="W"
                      value={widthCm || ''}
                      onChange={(e) => setWidthCm(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 pr-6 text-xs font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-stone-400">W</span>
                  </div>
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">
                    Width cm
                  </span>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="H"
                      value={heightCm || ''}
                      onChange={(e) => setHeightCm(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-2.5 py-1.5 pr-6 text-xs font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-stone-400">H</span>
                  </div>
                  <span className="text-[10px] text-stone-400 block text-center mt-0.5">
                    Height cm
                  </span>
                </div>
              </div>
            </div>

            {/* Declared Value & Units */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Cargo Value (FOB in USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">$</span>
                  <input
                    type="number"
                    min="1"
                    value={declaredValueUSD || ''}
                    onChange={(e) => setDeclaredValueUSD(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl pl-7 pr-3 py-2 text-xs font-bold font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Total Stove Units
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalUnits || ''}
                  onChange={(e) => setTotalUnits(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold font-mono text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Volumetric Weight Diagnostic Card */}
          <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-stone-500" />
                <span>Freight Weight Comparison:</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                  isVolumetricHigher
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {isVolumetricHigher ? 'Charged by Volume' : 'Charged by Weight'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block font-sans">Physical Gross</span>
                <strong className="text-stone-800 dark:text-stone-200 text-xs">{weightKg} kg</strong>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block font-sans">Volumetric</span>
                <strong className="text-stone-800 dark:text-stone-200 text-xs">
                  {volumetricWeightKg} kg
                </strong>
              </div>

              <div className="p-2 rounded-xl bg-[#E8590C]/10 dark:bg-orange-950/40 border border-[#E8590C]/30">
                <span className="text-[10px] text-[#E8590C] block font-sans font-bold">
                  Chargeable
                </span>
                <strong className="text-[#E8590C] text-xs">{chargeableWeightKg} kg</strong>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
              {transportMode === 'air'
                ? 'Air freight ratio applied: 1 CBM = 167 kg (L x W x H cm / 6000).'
                : transportMode === 'sea'
                ? 'Ocean LCL uses Revenue Tonne (W/M): 1 CBM = 1,000 kg equivalent.'
                : 'Overland trucking ratio: 1 CBM = 333.3 kg equivalent.'}
            </p>
          </div>
        </div>

        {/* Right Column: Calculated Cost Breakdown & Landed Economics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Executive Landed Cost Card */}
          <div className="bg-white dark:bg-stone-900 border-2 border-[#E8590C]/40 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Total Landed Cost Estimate
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#E8590C]">
                    ${totalLandedCostUSD.toLocaleString()}
                  </h3>
                  <span className="text-xs font-mono text-stone-500">
                    (~ {localCurrencyTotal.toLocaleString()} {destination.currency})
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-stone-400 block">Landed Cost / Unit</span>
                <span className="text-xl font-bold font-heading text-stone-900 dark:text-stone-100">
                  ${costPerUnitUSD}{' '}
                  <span className="text-xs font-normal text-stone-400">/ stove</span>
                </span>
                <span className="text-[10px] text-stone-400 block font-mono">
                  ${costPerKgUSD}/kg landed
                </span>
              </div>
            </div>

            {/* Concession Savings Highlight */}
            {tariffDetails.incentiveSavingsUSD > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-emerald-900 dark:text-emerald-200 block">
                      Clean Energy Concession Savings:
                    </strong>
                    <span className="text-emerald-800 dark:text-emerald-300 text-[11px]">
                      Duty rate discounted from standard {(destination.standardDutyRate * 100).toFixed(0)}% to{' '}
                      {(tariffDetails.effectiveDutyRate * 100).toFixed(0)}% + VAT exemption.
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                    -${tariffDetails.incentiveSavingsUSD.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Saved</span>
                </div>
              </div>
            )}

            {/* Split Details: 1. Freight vs 2. Customs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Freight & Port Costs */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-1.5">
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#E8590C]" />
                    <span>Freight &amp; Transit</span>
                  </span>
                  <strong className="font-mono text-stone-900 dark:text-stone-100">
                    ${freightDetails.totalFreightAndTransitUSD.toLocaleString()}
                  </strong>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">Base Carrier Freight:</span>
                    <span>${freightDetails.baseFreightUSD.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">Fuel / BAF Surcharge:</span>
                    <span>${freightDetails.bafFuelSurchargeUSD.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">Port / Terminal Handling:</span>
                    <span>${freightDetails.terminalPortUSD.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">Marine / Cargo Insurance:</span>
                    <span>${freightDetails.transitInsuranceUSD.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex items-center justify-between font-sans">
                  <span>Transit SLA Duration:</span>
                  <strong className="text-stone-800 dark:text-stone-200">
                    {estimatedLeadTime}
                  </strong>
                </div>
              </div>

              {/* Customs Duties & Statutory Taxes */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-1.5">
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    <span>Customs &amp; Tariffs</span>
                  </span>
                  <strong className="font-mono text-stone-900 dark:text-stone-100">
                    ${tariffDetails.totalTaxesAndDutiesUSD.toLocaleString()}
                  </strong>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">
                      Import Duty ({(tariffDetails.effectiveDutyRate * 100).toFixed(0)}%):
                    </span>
                    <span>${tariffDetails.customsDutyUSD.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">
                      Declaration (IDF {(destination.idfFeeRate * 100).toFixed(1)}%):
                    </span>
                    <span>${tariffDetails.idfUSD.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">
                      Infra Levy (RDL {(destination.rdlFeeRate * 100).toFixed(1)}%):
                    </span>
                    <span>${tariffDetails.rdlUSD.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                    <span className="font-sans">
                      Value Added Tax ({(destination.vatRate * 100).toFixed(0)}%):
                    </span>
                    <span
                      className={tariffDetails.vatUSD === 0 ? 'text-emerald-600 font-bold' : ''}
                    >
                      {tariffDetails.vatUSD === 0
                        ? 'EXEMPT (0%)'
                        : `$${tariffDetails.vatUSD.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 flex items-center justify-between font-sans">
                  <span>CIF Valuation Base:</span>
                  <strong className="font-mono text-stone-800 dark:text-stone-200">
                    ${tariffDetails.cifUSD.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Landed Cost Waterfall Composition Visual */}
            <div className="pt-2 space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-500 flex items-center justify-between">
                <span>Cost Composition Breakdown:</span>
                <span className="font-mono">100% Landed</span>
              </span>
              <div className="h-3 w-full rounded-full bg-stone-100 dark:bg-stone-800 flex overflow-hidden">
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round((declaredValueUSD / totalLandedCostUSD) * 100)
                    )}%`,
                  }}
                  className="bg-stone-700 h-full"
                  title={`Product FOB: $${declaredValueUSD}`}
                />
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round(
                        (freightDetails.totalFreightAndTransitUSD / totalLandedCostUSD) * 100
                      )
                    )}%`,
                  }}
                  className="bg-[#E8590C] h-full"
                  title={`Freight & Logistics: $${freightDetails.totalFreightAndTransitUSD}`}
                />
                <div
                  style={{
                    width: `${Math.max(
                      5,
                      Math.round(
                        (tariffDetails.totalTaxesAndDutiesUSD / totalLandedCostUSD) * 100
                      )
                    )}%`,
                  }}
                  className="bg-amber-500 h-full"
                  title={`Duties & Taxes: $${tariffDetails.totalTaxesAndDutiesUSD}`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] text-stone-400 pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded bg-stone-700" />
                  <span>
                    FOB Goods:{' '}
                    {Math.round((declaredValueUSD / totalLandedCostUSD) * 100)}%
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded bg-[#E8590C]" />
                  <span>
                    Freight:{' '}
                    {Math.round(
                      (freightDetails.totalFreightAndTransitUSD / totalLandedCostUSD) * 100
                    )}%
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded bg-amber-500" />
                  <span>
                    Duties/Taxes:{' '}
                    {Math.round(
                      (tariffDetails.totalTaxesAndDutiesUSD / totalLandedCostUSD) * 100
                    )}%
                  </span>
                </span>
              </div>
            </div>

            {/* Convert to Tracked Shipment Action */}
            {onApplyToNewShipment && (
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleConvertToShipment}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Tracked Trade Shipment with this Model</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Regulatory & Trade Accord Notes */}
          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-xs space-y-2 text-stone-600 dark:text-stone-300">
            <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
              <Info className="w-4 h-4 text-[#E8590C]" />
              <span>Trade Accord &amp; Regulatory Compliance Grounding</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-500 dark:text-stone-400">
              <li>
                <strong>EAC Rules of Origin:</strong> Clean cookstoves manufactured at the Kenya Burn
                factory qualify for preferential 0% tariff treatment across Uganda, Tanzania, and
                Rwanda with valid EAC Certificate of Origin.
              </li>
              <li>
                <strong>ECOWAS Common External Tariff (CET):</strong> Consignments destined for
                Nigeria and Ghana fall under Category 1 / Category 2 capital and renewable energy
                transition goods.
              </li>
              <li>
                <strong>Import Valuation Basis:</strong> Port customs authority evaluates duties on
                GATT / WTO Cost, Insurance, and Freight (CIF) valuation standards.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
