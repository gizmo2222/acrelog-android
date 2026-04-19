export type BrandEntry = { brand: string; models: string[] };

export const BRAND_SUGGESTIONS: Record<string, BrandEntry[]> = {
  'Electrical & Power': [
    {
      brand: 'Generac',
      models: ['GP3500iO', 'GP6500', 'GP8000E', 'Protector 22kW', 'Protector 48kW', 'XC8000E', '7500E'],
    },
    {
      brand: 'Kohler',
      models: ['12RESVL', '20RESAL', '38RCLB', '60RCLB'],
    },
    {
      brand: 'Cummins',
      models: ['Onan 3.6HGJAB', 'Onan 5500', 'RS20000'],
    },
    {
      brand: 'Caterpillar',
      models: ['DE22E3', 'DE33E3', 'D100-6'],
    },
    {
      brand: 'Briggs & Stratton',
      models: ['30651', 'P3000', 'P4500'],
    },
    {
      brand: 'Tesla',
      models: ['Powerwall 2', 'Powerwall+'],
    },
    {
      brand: 'Enphase',
      models: ['IQ Battery 10T', 'IQ Battery 5P'],
    },
    {
      brand: 'Blue Pacific Solar',
      models: ['Off-Grid Kit'],
    },
    {
      brand: 'Eaton',
      models: ['CH200L200PGT', 'BR200L200PGT'],
    },
    {
      brand: 'Square D',
      models: ['HOM2448M100PC'],
    },
  ],

  'Hand Tools': [
    {
      brand: 'DeWalt',
      models: ['DWMT72165', 'DWMT73803', 'Tool Set'],
    },
    {
      brand: 'Milwaukee',
      models: ['48-22-9004', '48-22-6560', 'Tool Set'],
    },
    {
      brand: 'Snap-on',
      models: ['KRLP1012', 'KRL1022', 'Tool Set'],
    },
    {
      brand: 'Craftsman',
      models: ['CMMT99448', 'CMMT99206', 'Tool Set'],
    },
    {
      brand: 'Klein Tools',
      models: ['92906', '5-in-1 Screwdriver'],
    },
    {
      brand: 'Channellock',
      models: ['140', '410', '526 Pliers'],
    },
    {
      brand: 'Stanley',
      models: ['STMT74101', 'STHT60113'],
    },
    {
      brand: 'Knipex',
      models: ['87 01 250', '86 03 250', '00 20 72'],
    },
  ],

  'Harvesting': [
    {
      brand: 'John Deere',
      models: ['S780', 'S790', 'X9 1000', 'X9 1100', '460M', '560M', 'W235'],
    },
    {
      brand: 'Case IH',
      models: ['Axial-Flow 8250', 'AF 9250', 'WD1203', 'RB565'],
    },
    {
      brand: 'New Holland',
      models: ['CR9.90', 'CR10.90', 'CX8.90', 'Roll-Belt 560'],
    },
    {
      brand: 'CLAAS',
      models: ['Lexion 8900', 'Tucano 570', 'Variant 480'],
    },
    {
      brand: 'Gleaner',
      models: ['S77', 'S88', 'S98', 'A86'],
    },
    {
      brand: 'Massey Ferguson',
      models: ['IDEAL 9T', '9565', '7282 CEREA'],
    },
    {
      brand: 'Krone',
      models: ['BiG Pack 1290', 'Comprima V 180 XC'],
    },
    {
      brand: 'MacDon',
      models: ['FD1 Draper', 'D1 Series'],
    },
  ],

  'Irrigation': [
    {
      brand: 'Valley',
      models: ['8000 Series', '6000 Series'],
    },
    {
      brand: 'Reinke',
      models: ['Electrogator II', 'Resolute'],
    },
    {
      brand: 'Lindsay',
      models: ['Zimmatic 9500P', 'Zimmatic 8500P'],
    },
    {
      brand: 'T-L Irrigation',
      models: ['Pivot'],
    },
    {
      brand: 'Grundfos',
      models: ['SP 17-8', 'CM 5-4'],
    },
    {
      brand: 'Gorman-Rupp',
      models: ['T Series'],
    },
    {
      brand: 'Berkeley',
      models: ['B Series'],
    },
    {
      brand: 'Franklin Electric',
      models: ['Tri-Seal Series'],
    },
  ],

  'Livestock Equipment': [
    {
      brand: 'Priefert',
      models: ['Model 82', 'Model 85', 'S28', 'Tub & Sweep'],
    },
    {
      brand: 'WW Manufacturing',
      models: ['3100 Series', '2200 Series', 'Squeeze Chute'],
    },
    {
      brand: 'Hi-Qual',
      models: ['Standard Squeeze', 'Hydraulic'],
    },
    {
      brand: 'Powder River',
      models: ['PortaFount', 'Squeeze Chute'],
    },
    {
      brand: 'Sydell',
      models: ['206 Series', 'Series II'],
    },
    {
      brand: 'Ritchie',
      models: ['Omni Fount', 'Eco Fount', 'Thrifty King'],
    },
    {
      brand: 'Behlen',
      models: ['Galvanized Tank', 'Oval Tank', 'Corral Panels'],
    },
    {
      brand: 'Calan',
      models: ['Door Feeder', 'Barrel Feeder'],
    },
  ],

  'Loaders & Skid Steers': [
    {
      brand: 'Bobcat',
      models: ['S450', 'S510', 'S550', 'S590', 'S650', 'T450', 'T550', 'T650', 'A770'],
    },
    {
      brand: 'Case',
      models: ['SR175', 'SR200', 'SR250', 'TR270', 'TR320'],
    },
    {
      brand: 'New Holland',
      models: ['L218', 'L220', 'L225', 'L230', 'C227', 'C232', 'C237'],
    },
    {
      brand: 'Caterpillar',
      models: ['226D3', '236D3', '246D3', '272D2', '299D3'],
    },
    {
      brand: 'John Deere',
      models: ['317G', '320G', '325G', '330G', '332G'],
    },
    {
      brand: 'Kubota',
      models: ['SSV65', 'SSV75', 'SVL65-2', 'SVL75-2S', 'SVL97-2'],
    },
    {
      brand: 'Manitou',
      models: ['MLT 741-120 LSU', 'MLT 845-120 LSU'],
    },
    {
      brand: 'Gehl',
      models: ['V270', 'V330', 'V340', 'R190'],
    },
  ],

  'Power Tools': [
    {
      brand: 'Stihl',
      models: ['MS 170', 'MS 250', 'MS 291', 'MS 391', 'MS 500i', 'BR 430', 'BR 800 X'],
    },
    {
      brand: 'Husqvarna',
      models: ['120', '135', '450 Rancher', '572XP', '580BTS', '360BT'],
    },
    {
      brand: 'Honda',
      models: ['EU2200i', 'EU3000iS', 'EB2800i'],
    },
    {
      brand: 'Generac',
      models: ['GP3500iO', 'GP8000E', 'XC8000E', '7500E'],
    },
    {
      brand: 'Champion',
      models: ['3500W', '4500W', '7500W'],
    },
    {
      brand: 'Lincoln Electric',
      models: ['Power MIG 210', 'Square Wave TIG 200'],
    },
    {
      brand: 'Miller',
      models: ['Multimatic 215', 'Millermatic 211', 'Dynasty 210'],
    },
    {
      brand: 'DeWalt',
      models: ['DCCS670X1', 'DCPW550B', 'DXPW3425'],
    },
  ],

  'Sprayers': [
    {
      brand: 'John Deere',
      models: ['R4023', 'R4030', 'R4038', 'R4044', 'R4045'],
    },
    {
      brand: 'Case IH',
      models: ['Patriot 250', 'Patriot 280', 'Patriot 380', 'Patriot 4440'],
    },
    {
      brand: 'New Holland',
      models: ['Guardian SP.270F', 'Guardian SP.295F'],
    },
    {
      brand: 'Apache',
      models: ['AS1020', 'AS1220', 'AS1240'],
    },
    {
      brand: 'Hagie',
      models: ['STS12', 'STS14', 'STS16'],
    },
    {
      brand: 'Hardi',
      models: ['Commander 4400', 'Master 4500', 'Navigator 6000'],
    },
    {
      brand: 'Wilmar',
      models: ['W240', 'W300', 'WR8400'],
    },
    {
      brand: 'Bestway',
      models: ['Field Star II', 'Nitro Pro'],
    },
  ],

  'Storage & Structures': [
    {
      brand: 'GSI',
      models: ['Bin 60,000 bu', 'Dryer 2808', 'Tower Dryer'],
    },
    {
      brand: 'Sukup',
      models: ['Bin Series', 'QuadDry', 'Natural Air Bin'],
    },
    {
      brand: 'Brock',
      models: ['HDPE Bin', 'Grain Guardian'],
    },
    {
      brand: 'Behlen Country',
      models: ['Steel Building', 'Corral'],
    },
    {
      brand: 'Meridian',
      models: ['Grain Bin', 'Fuel Tank', 'Liquid Fertilizer Tank'],
    },
    {
      brand: 'Westeel',
      models: ['Hopper Bin', 'Flat Bottom'],
    },
    {
      brand: 'Butler',
      models: ['Landmark', 'Landmark II Building'],
    },
    {
      brand: 'Morton Buildings',
      models: ['Farm Building', 'Equestrian'],
    },
    {
      brand: 'Western Global',
      models: ['FuelCube 990', 'TransCube 10TC'],
    },
    {
      brand: 'Ritchie Industries',
      models: ['Fuel Tank'],
    },
    {
      brand: 'Ag-Bag',
      models: ['G6000', 'G7000 Bagger'],
    },
  ],

  'Tillage & Planting': [
    {
      brand: 'John Deere',
      models: ['1770NT CCS', '1790', 'DB60', 'DB66', '2230', '2510H', '637 Disk', '2400 Ripper'],
    },
    {
      brand: 'Case IH',
      models: ['Early Riser 1200', '2150 Precision Hoe', 'Tiger-Mate 255'],
    },
    {
      brand: 'Kinze',
      models: ['3660 ASD', '3800', '4900', '4905'],
    },
    {
      brand: 'Great Plains',
      models: ['YP-4025A', 'YP-3025A', '3S-4000HD', 'Turbo-Max'],
    },
    {
      brand: 'White Planters',
      models: ['8516', '8522', '9816'],
    },
    {
      brand: 'Sunflower',
      models: ['6333', '1435', '4630'],
    },
    {
      brand: 'Krause',
      models: ['4200 Dominator', '8200 Dominator'],
    },
    {
      brand: 'Salford',
      models: ['RTS 570', 'I-1200'],
    },
  ],

  'Tractors & Vehicles': [
    {
      brand: 'John Deere',
      models: ['5E Series', '6M Series', '7R Series', '8R Series', '9R Series', '4044M', '4052M', '4066M'],
    },
    {
      brand: 'Case IH',
      models: ['Farmall', 'Maxxum', 'Puma', 'Magnum', 'Steiger'],
    },
    {
      brand: 'New Holland',
      models: ['T4', 'T5', 'T6', 'T7', 'T8', 'Boomer'],
    },
    {
      brand: 'Kubota',
      models: ['L4060', 'M7060', 'MX5400', 'BX23S', 'RTV-X1100C'],
    },
    {
      brand: 'Massey Ferguson',
      models: ['4707', '5711', '6713', '7714'],
    },
    {
      brand: 'Fendt',
      models: ['210 Vario', '310 Vario', '716 Vario', '942 Vario'],
    },
    {
      brand: 'Mahindra',
      models: ['1526', '2638', '3650', '4550', '6075'],
    },
    {
      brand: 'Ford',
      models: ['F-250', 'F-350'],
    },
    {
      brand: 'Chevrolet',
      models: ['Silverado 2500HD', 'Silverado 3500HD'],
    },
    {
      brand: 'Ram',
      models: ['2500', '3500'],
    },
    {
      brand: 'Polaris',
      models: ['Ranger 570', 'Ranger XP 1000'],
    },
    {
      brand: 'John Deere Gator',
      models: ['TS', 'TH', 'HPX', 'XUV 835M'],
    },
  ],
};
