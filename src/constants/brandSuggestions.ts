export type BrandEntry = { brand: string; models: string[] };

export const BRAND_SUGGESTIONS: Record<string, BrandEntry[]> = {
  'Tractors': [
    {
      brand: 'John Deere',
      models: [
        '4044M', '4052M', '4066M', '4044R', '4052R', '4066R',
        '5055E', '5065E', '5075E', '5085M', '5100M', '5115M',
        '6105M', '6115M', '6120M', '6130M', '6140M', '6155M', '6175M', '6195M',
        '6105R', '6115R', '6130R', '6145R', '6155R', '6175R', '6195R', '6215R', '6230R', '6250R',
        '7R 210', '7R 230', '7R 250', '7R 270', '7R 290', '7R 310', '7R 330',
        '8R 230', '8R 250', '8R 280', '8R 310', '8R 340', '8R 370', '8R 410',
        '9R 390', '9R 440', '9R 490', '9R 540', '9R 590', '9R 640',
        '9RX 390', '9RX 440', '9RX 490', '9RX 540', '9RX 590', '9RX 640',
      ],
    },
    {
      brand: 'Case IH',
      models: [
        'Farmall 45A', 'Farmall 55A', 'Farmall 65A', 'Farmall 75A', 'Farmall 85A',
        'Farmall 95A', 'Farmall 105A', 'Farmall 110A', 'Farmall 120A',
        'Maxxum 110', 'Maxxum 115', 'Maxxum 120', 'Maxxum 125', 'Maxxum 130', 'Maxxum 145',
        'Puma 130', 'Puma 145', 'Puma 150', 'Puma 160', 'Puma 170', 'Puma 185', 'Puma 200', 'Puma 220', 'Puma 240',
        'Magnum 180', 'Magnum 200', 'Magnum 220', 'Magnum 235', 'Magnum 250', 'Magnum 260', 'Magnum 280', 'Magnum 310', 'Magnum 340',
        'Steiger 370', 'Steiger 420', 'Steiger 470', 'Steiger 500', 'Steiger 540', 'Steiger 580', 'Steiger 620',
        'Quadtrac 370', 'Quadtrac 420', 'Quadtrac 470', 'Quadtrac 500', 'Quadtrac 540', 'Quadtrac 580', 'Quadtrac 620',
      ],
    },
    {
      brand: 'New Holland',
      models: [
        'Boomer 24', 'Boomer 33', 'Boomer 37', 'Boomer 41', 'Boomer 47', 'Boomer 50',
        'T4.75', 'T4.80', 'T4.90', 'T4.100', 'T4.110', 'T4.120',
        'T5.90', 'T5.100', 'T5.110', 'T5.120', 'T5.130', 'T5.140',
        'T6.120', 'T6.140', 'T6.145', 'T6.155', 'T6.160', 'T6.165', 'T6.175', 'T6.180',
        'T7.165', 'T7.175', 'T7.190', 'T7.200', 'T7.210', 'T7.225', 'T7.245',
        'T8.300', 'T8.320', 'T8.350', 'T8.380', 'T8.410', 'T8.435',
        'T9.390', 'T9.435', 'T9.480', 'T9.530', 'T9.565', 'T9.615', 'T9.645', 'T9.700',
      ],
    },
    {
      brand: 'Kubota',
      models: [
        'BX23S', 'BX25D', 'BX80 Series',
        'L3301', 'L3901', 'L4060', 'L4701', 'L5460', 'L6060',
        'MX4800', 'MX5200', 'MX5400', 'MX6000',
        'M4-071', 'M4-091', 'M5-091', 'M5-111',
        'M6060', 'M7060', 'M8560', 'M9540',
        'M5-111', 'M6-101', 'M6-111', 'M6-131', 'M6-141',
        'M7-131', 'M7-151', 'M7-171',
        'RTV-X900', 'RTV-X1100C', 'RTV-X1140',
      ],
    },
    {
      brand: 'Massey Ferguson',
      models: [
        'MF 1526', 'MF 1533', 'MF 1540', 'MF 1547', 'MF 1552', 'MF 1560',
        'MF 4707', 'MF 4708', 'MF 4709', 'MF 4710',
        'MF 5710 S', 'MF 5711 S', 'MF 5712 S', 'MF 5713 S',
        'MF 6713 S', 'MF 6714 S', 'MF 6715 S', 'MF 6716 S', 'MF 6718 S',
        'MF 7714 S', 'MF 7715 S', 'MF 7716 S', 'MF 7718 S', 'MF 7719 S', 'MF 7720 S',
        'MF 8727 S', 'MF 8730 S', 'MF 8732 S', 'MF 8735 S', 'MF 8737 S', 'MF 8740 S',
      ],
    },
    {
      brand: 'Fendt',
      models: [
        '200 Vario', '210 Vario', '211 Vario', '211F Vario',
        '300 Vario', '310 Vario', '311 Vario', '313 Vario', '314 Vario', '316 Vario',
        '500 Vario', '510 Vario', '511 Vario', '512 Vario', '513 Vario', '514 Vario',
        '700 Vario', '714 Vario', '715 Vario', '716 Vario', '718 Vario', '720 Vario', '722 Vario', '724 Vario',
        '900 Vario', '930 Vario', '933 Vario', '936 Vario', '939 Vario', '942 Vario',
        '1000 Vario', '1038 Vario', '1042 Vario', '1046 Vario', '1050 Vario',
      ],
    },
    {
      brand: 'AGCO / Challenger',
      models: ['MT700E', 'MT700F', 'MT800E', 'MT800F', 'MT900E', 'MT900F'],
    },
    {
      brand: 'Mahindra',
      models: [
        '1526', '1533', '1538', '1640', '1648', '1723', '1734', '1739',
        '2638', '2645', '2660', '3616', '3650', '4025', '4550', '5570', '6075', '7095',
      ],
    },
    {
      brand: 'Valtra',
      models: ['A Series', 'N Series', 'T Series', 'S Series', 'Q Series'],
    },
    {
      brand: 'Deutz-Fahr',
      models: ['5G Series', '6G Series', '6.4 Series', '7 Series', 'Agrotron TTV'],
    },
    {
      brand: 'SAME',
      models: ['Frutteto', 'Virtus', 'Dorado', 'Iron'],
    },
    {
      brand: 'Landini',
      models: ['5-065', '5-075', '5-085', '5-095', '5-105', '6-100', '6-110', '6-120', '6-130', '7-180', '7-200', '7-220'],
    },
    {
      brand: 'Ford / New Holland (Classic)',
      models: ['8N', '9N', '2N', 'NAA', '600', '800', '4000', '5000', '7000', '8700', 'TW-20', 'TW-35'],
    },
    {
      brand: 'International Harvester (Classic)',
      models: ['Farmall A', 'Farmall C', 'Farmall M', 'Farmall 140', '560', '706', '806', '1066', '1206', '1256', '1456', '1466', '1486', '1566', '1586'],
    },
    {
      brand: 'Allis-Chalmers (Classic)',
      models: ['WC', 'WD', 'WD45', 'D-17', 'D-19', '170', '175', '185', '190', '200', '7060'],
    },
    {
      brand: 'Kioti',
      models: ['CX2510', 'CS2210', 'DK4510', 'DK5510', 'DK6010', 'PX9020', 'HX9020'],
    },
    {
      brand: 'LS Tractor',
      models: ['MT125', 'MT240', 'MT340', 'MT347H', 'MT4 Series', 'XR Series'],
    },
    {
      brand: 'TYM',
      models: ['T194', 'T234', 'T264', 'T394', 'T474', 'T574', 'T754', 'T804'],
    },
    {
      brand: 'Yanmar',
      models: ['SA Series', 'YT2 Series', 'YT3 Series', 'YT4 Series'],
    },
  ],

  'Trucks': [
    {
      brand: 'Ford',
      models: ['F-150', 'F-150 Lightning', 'F-250 Super Duty', 'F-350 Super Duty', 'F-450 Super Duty', 'F-550 Super Duty'],
    },
    {
      brand: 'Chevrolet',
      models: ['Silverado 1500', 'Silverado 1500 EV', 'Silverado 2500HD', 'Silverado 3500HD'],
    },
    {
      brand: 'GMC',
      models: ['Sierra 1500', 'Sierra 2500HD', 'Sierra 3500HD'],
    },
    {
      brand: 'Ram',
      models: ['Ram 1500', 'Ram 1500 TRX', 'Ram 2500', 'Ram 3500', 'Ram 3500 Dually'],
    },
    {
      brand: 'Toyota',
      models: ['Tacoma', 'Tacoma TRD Pro', 'Tundra', 'Tundra TRD Pro', 'Land Cruiser 200'],
    },
    {
      brand: 'Nissan',
      models: ['Frontier', 'Titan', 'Titan XD'],
    },
    {
      brand: 'Honda',
      models: ['Ridgeline'],
    },
  ],

  'UTVs & ATVs': [
    {
      brand: 'Polaris',
      models: [
        'Ranger 570', 'Ranger 570 Full-Size', 'Ranger 900', 'Ranger XP 1000', 'Ranger XP Kinetic',
        'Ranger Crew 570', 'Ranger Crew XP 1000',
        'General 1000', 'General XP 4 1000',
        'RZR XP 1000', 'RZR Pro XP',
        'Sportsman 450 H.O.', 'Sportsman 570', 'Sportsman 850', 'Sportsman XP 1000',
      ],
    },
    {
      brand: 'Can-Am',
      models: [
        'Defender HD7', 'Defender HD9', 'Defender HD10',
        'Defender MAX HD10', 'Defender MAX Limited HD10',
        'Maverick Trail 1000', 'Maverick Sport 1000R',
        'Outlander 450', 'Outlander 570', 'Outlander 650', 'Outlander 850', 'Outlander 1000R',
      ],
    },
    {
      brand: 'John Deere Gator',
      models: [
        'TS 4x2', 'TH 6x4', 'TH 6x4 Diesel',
        'HPX615E', 'HPX815E',
        'XUV 560', 'XUV 590E', 'XUV 590M',
        'XUV 835M', 'XUV 835R', 'XUV 855M', 'XUV 855R', 'XUV 865M', 'XUV 865R',
        'RSX860M', 'RSX860E',
      ],
    },
    {
      brand: 'Kawasaki',
      models: [
        'Mule SX 4x4', 'Mule SX 4x4 FI',
        'Mule PRO-FX', 'Mule PRO-FXT', 'Mule PRO-FXR', 'Mule PRO-DX', 'Mule PRO-DXT',
        'Brute Force 300', 'Brute Force 750 4x4i',
        'Teryx S LE', 'Teryx4 S LE',
      ],
    },
    {
      brand: 'Yamaha',
      models: [
        'Wolverine X2', 'Wolverine X4', 'Wolverine RMAX2 1000', 'Wolverine RMAX4 1000',
        'Viking', 'Viking VI',
        'Grizzly 700', 'Grizzly EPS',
        'Kodiak 450', 'Kodiak 700',
      ],
    },
    {
      brand: 'Honda',
      models: [
        'Pioneer 500', 'Pioneer 700', 'Pioneer 700-4', 'Pioneer 1000', 'Pioneer 1000-6 Crew',
        'FourTrax Foreman 520', 'FourTrax Rancher 420', 'FourTrax Recon 250',
        'TRX520 Rubicon',
      ],
    },
    {
      brand: 'Kubota',
      models: ['RTV-X900', 'RTV-X1100C', 'RTV-X1100CR', 'RTV-X1140', 'RTV500'],
    },
    {
      brand: 'CFMOTO',
      models: ['UForce 1000', 'ZForce 950 Sport', 'CForce 600', 'CForce 800'],
    },
    {
      brand: 'Textron / Arctic Cat',
      models: ['Alterra 700', 'Alterra TBX 700', 'Prowler Pro', 'Wildcat XX'],
    },
  ],

  'Attachments & Implements': [
    {
      brand: 'John Deere',
      models: [
        '520M Loader', '540R Loader', '620R Loader', '640R Loader',
        'iMatch Quick-Coupler',
        'BW15079 Box Blade', 'BW14631 Tiller',
        'LP42108 Pallet Forks', 'LP49228 Forks',
        'BW13613 Bale Spear',
      ],
    },
    {
      brand: 'Case IH',
      models: [
        'L750 Loader', 'L755 Loader', 'L760 Loader', 'L765 Loader',
        'Quick-Coupler',
      ],
    },
    {
      brand: 'Kubota',
      models: [
        'LA463 Loader', 'LA525 Loader', 'LA534 Loader', 'LA805 Loader', 'LA1154 Loader',
        'BX2816 Tiller', 'RCK54 Mower Deck',
        'WL210 Loader',
      ],
    },
    {
      brand: 'Land Pride',
      models: [
        'RCR1260 Rotary Cutter', 'RCR1872 Rotary Cutter', 'RCR2684 Rotary Cutter',
        'FDR1648 Rotary Disc Mower',
        'BB1548 Box Blade', 'BB1560 Box Blade', 'BB2596 Box Blade',
        'RTO1542 Tiller', 'RTO1560 Tiller', 'RTO2542 Tiller',
        'PD10 Post Hole Digger', 'PD15 Post Hole Digger',
        'SR1548 Landscape Rake', 'SR1560 Landscape Rake',
        'LS1548 Landscape Seeder',
      ],
    },
    {
      brand: 'Woods',
      models: [
        'RC Series Rotary Cutter', 'BW126X Batwing Cutter',
        'BD6000X Backhoe', 'BD7000X Backhoe',
        'BH75X Backhoe', 'BH90X Backhoe',
        'RD Series Rotary Disc Mower',
        'EQ Box Blade',
        'TSG50 Stump Grinder',
      ],
    },
    {
      brand: 'Bobcat',
      models: [
        'Bucket 68"', 'Bucket 72"', 'Bucket 78"', 'Bucket 84"',
        'Pallet Fork Frame', 'Utility Forks 48"', 'Utility Forks 60"',
        'Grapple Bucket', 'Root Grapple',
        'Auger Drive + 9" Bit', 'Auger Drive + 12" Bit', 'Auger Drive + 18" Bit',
        'Broom 72"', 'Angle Broom',
        'Snow Blower 72"', 'Snow Blower 84"',
        'Stump Grinder',
        'Trencher 36"', 'Trencher 48"',
        'Mulcher',
        'Landscape Rake',
      ],
    },
    {
      brand: 'Paladin / Pengo',
      models: [
        'Bobcat-style Pallet Forks', 'Heavy Duty Grapple',
        'Tree Shear', 'Root Rake Grapple',
        'Auger Drive XD', 'Pengo Auger 9"', 'Pengo Auger 12"', 'Pengo Auger 18"',
        'Trencher T8', 'Trencher T16',
      ],
    },
    {
      brand: 'Titan Implement',
      models: [
        'Box Blade 60"', 'Box Blade 72"', 'Box Blade 84"',
        'Pallet Forks 42"', 'Pallet Forks 48"',
        'Bale Spear 49"',
        'Rotary Tiller 48"', 'Rotary Tiller 60"', 'Rotary Tiller 72"',
        'Landscape Rake 60"', 'Landscape Rake 72"',
        'Rear Blade 60"', 'Rear Blade 72"',
        'Log Grapple', 'Root Grapple',
        'Skid Steer Bucket 72"', 'Skid Steer Bucket 84"',
        'Post Hole Digger + 9" Bit',
      ],
    },
    {
      brand: 'Erskine Attachments',
      models: [
        'Snow Blower 72"', 'Snow Blower 84"', 'Snow Blower 96"',
        'Bucket 66"', 'Bucket 72"', 'Bucket 78"',
        'Sweepster Broom 72"',
        'Trencher 36"', 'Trencher 48"', 'Trencher 60"',
        'Auger Drive', 'Auger 9"', 'Auger 12"',
      ],
    },
    {
      brand: 'Craig Manufacturing',
      models: [
        'Skid Steer Grapple', 'Brush Grapple',
        'Skid Steer Thumb', 'Excavator Thumb',
        'Log Forks',
      ],
    },
    {
      brand: 'Brush Wolf / Fecon',
      models: [
        'FTX100', 'FTX148', 'FTX200',
        'Bull Hog BH074', 'Bull Hog BH085',
        'RTC72 Roller Drum Cutter',
      ],
    },
    {
      brand: 'Caterpillar',
      models: [
        'Work Tool Bucket 72"', 'Work Tool Bucket 84"',
        'Multi-Purpose Bucket',
        'Pallet Forks',
        'Grapple Rake',
        'Cold Planer',
      ],
    },
    {
      brand: 'Worksaver',
      models: [
        'Skid Steer Bale Spear', '3-Pt Bale Spear',
        '3-Pt Pallet Forks',
        'Hay Mover',
        'Grain Bucket',
      ],
    },
    {
      brand: 'Westendorf',
      models: [
        'TA-26 Loader', 'TA-28 Loader', 'TA-46 Loader',
        'WL-35 Loader', 'WL-42 Loader',
      ],
    },
    {
      brand: 'Alamo Industrial',
      models: [
        'Rhino SR Series Cutter', 'Rhino TW Series',
        'Servis 15 Cutter', 'Servis 20 Cutter',
        'Machete Batwing',
      ],
    },
  ],

  'Harvesting': [
    {
      brand: 'John Deere',
      models: [
        'S660', 'S670', 'S680', 'S690', 'S760', 'S770', 'S780', 'S785', 'S790',
        'X9 1000', 'X9 1100',
        'W235', 'W260',
        'H360', 'H380', 'H400',
        '460M', '460R', '560M', '560R', '590R', '640FD', '635FD',
        'CP690', 'CH530', 'CH570',
        'DB60', 'DB66', 'DB80', 'DB90',
      ],
    },
    {
      brand: 'Case IH',
      models: [
        'Axial-Flow 7130', 'Axial-Flow 7150', 'Axial-Flow 7240', 'Axial-Flow 7250',
        'Axial-Flow 8230', 'Axial-Flow 8240', 'Axial-Flow 8250',
        'Axial-Flow 9230', 'Axial-Flow 9240', 'Axial-Flow 9250',
        'Axial-Flow 9120', 'Axial-Flow 9150',
        'WD1503', 'WD2104', 'WD2504',
        'RB565', 'RB464', 'LB334', 'LB434',
        'Farmall 340', 'Farmall 460',
      ],
    },
    {
      brand: 'New Holland',
      models: [
        'CR5.85', 'CR6.90', 'CR7.90', 'CR8.90', 'CR9.90', 'CR10.90', 'CR11.90',
        'CX5.80', 'CX6.90', 'CX7.90', 'CX8.90',
        'TC5.30', 'TC5.80',
        'BB9080', 'BB9090',
        'Roll-Belt 450', 'Roll-Belt 460', 'Roll-Belt 550', 'Roll-Belt 560',
        'BC5050', 'BC5060', 'BC5070',
        'WR9880', 'WR9960',
      ],
    },
    {
      brand: 'CLAAS',
      models: [
        'Lexion 5300', 'Lexion 6600', 'Lexion 7500', 'Lexion 8700', 'Lexion 8800', 'Lexion 8900',
        'Trion 520', 'Trion 620', 'Trion 720', 'Trion 750',
        'Tucano 420', 'Tucano 430', 'Tucano 440', 'Tucano 450', 'Tucano 470', 'Tucano 520', 'Tucano 570',
        'Avero 160',
        'Jaguar 940', 'Jaguar 950', 'Jaguar 960', 'Jaguar 970',
        'Variant 360', 'Variant 460', 'Variant 480', 'Variant 580',
        'Rollant 354', 'Rollant 454', 'Rollant 375',
        'Quadrant 3200', 'Quadrant 3300', 'Quadrant 5200', 'Quadrant 5300',
      ],
    },
    {
      brand: 'Gleaner',
      models: [
        'A76', 'A86', 'A96',
        'S67', 'S77', 'S78', 'S88', 'S98',
        'R42', 'R52', 'R62', 'R72',
        'N5', 'N6', 'N7',
        'F2', 'F3',
      ],
    },
    {
      brand: 'Massey Ferguson',
      models: [
        'MF 7274', 'MF 7282', 'MF 9380',
        'IDEAL 7', 'IDEAL 8', 'IDEAL 9', 'IDEAL 9T',
        'MF 2170', 'MF 2270',
        'MF DM 305', 'MF DM 321',
        'MF RB 3135', 'MF RB 3145', 'MF RB 4160',
      ],
    },
    {
      brand: 'Fendt',
      models: [
        'IDEAL 7', 'IDEAL 8', 'IDEAL 9', 'IDEAL 10',
        '5255 L', '5275 L', '5255 C', '5275 C',
        '10080 Vario', '12080 Vario',
      ],
    },
    {
      brand: 'Krone',
      models: [
        'BiG Pack 870', 'BiG Pack 1270', 'BiG Pack 1290 HDP', 'BiG Pack 1290 XC',
        'BiG M 450', 'BiG M 500',
        'Comprima V 150 XC', 'Comprima V 180 XC',
        'VariPack V 150',
        'Swadro 700', 'Swadro 1400',
      ],
    },
    {
      brand: 'MacDon',
      models: [
        'FD1 FlexDraper', 'FD75 FlexDraper', 'FD140 FlexDraper',
        'D1 Series 30', 'D1 Series 35', 'D1 Series 40',
        'M1 240', 'M1 170',
        'R85 Rotary Disc Mower',
        'A40-D Auger Header',
      ],
    },
    {
      brand: 'Geringhoff',
      models: ['Rota Disc 580', 'NorthStar 840', 'NorthStar 1020', 'Horizon 880'],
    },
    {
      brand: 'Bale-Band-It',
      models: ['NetWrap Replacement System'],
    },
    {
      brand: 'Vermeer',
      models: [
        'R2800', 'R2300', 'R1600',
        'BP8000', 'BP9000', 'BP10000',
        'ZR5-1200', 'ZR5-1500',
        'WR24', 'WR36',
        'CO300', 'CO350',
      ],
    },
    {
      brand: 'Hesston / Fendt Hay',
      models: ['WR9870', 'WR9970', 'HB1545', 'HB2148'],
    },
    {
      brand: 'Kuhn',
      models: [
        'FC 3560 TCD', 'FC 8730 D',
        'RA 142 G', 'RA 302 G',
        'VB 7160', 'VB 7190',
        'LSB 1290 iD', 'LSB 1290 Plus iD',
        'SB 1290 iD',
      ],
    },
    {
      brand: 'NH (Classic)',
      models: ['1900', '1910', 'BR740', 'BR780', 'BB960'],
    },
  ],

  'Tillage & Planting': [
    {
      brand: 'John Deere',
      models: [
        '1770NT CCS', '1775NT CCS', '1785', '1795',
        '1790', '1890', '1895',
        'DB60', 'DB66', 'DB80', 'DB90',
        '2510H', '2510L', '2510S',
        '2230', '2310', '2410', '2430', '2510',
        '637 Disk', '637 Tandem Disk', '645 Tandem Disk',
        '2400 Ripper', '2410 Ripper', '2700 Mulch Ripper', '2730 Combo Ripper', '2900 Ripper',
        '915 Mulch Finisher', '2100 Finisher', '2210 Field Cultivator',
      ],
    },
    {
      brand: 'Case IH',
      models: [
        'Early Riser 1200', 'Early Riser 2100', 'Early Riser 2150 AFS',
        '2140 Precision Hoe', '2150 Precision Hoe', '2160 Precision Hoe',
        '1220 Early Riser', '1230 Early Riser',
        'Tiger-Mate 255', 'Tiger-Mate 200',
        'Ecolo-Tiger 870', 'Ecolo-Tiger 875',
        'True-Tandem 330 Disk', 'True-Tandem 335 Disk',
        'Precision Disk 500', 'Precision Disk 400', 'Precision Disk 300',
        'Nutri-Placer 930', 'Nutri-Placer 850',
      ],
    },
    {
      brand: 'Kinze',
      models: [
        '3500', '3600', '3660 ASD', '3800', '4900', '4905',
        '4700', '4200', '3200', '3100',
      ],
    },
    {
      brand: 'Great Plains',
      models: [
        'YP-2025', 'YP-3025A', 'YP-4025A', 'YP-2425',
        '3S-3000HD', '3S-4000HD', '3S-6000HD',
        'Turbo-Chisel', 'Turbo-Max', 'Turbo-Till 2000',
        'Solid Stand 30', 'Solid Stand 35',
        'Ultra-Till', 'Soil Warrior',
        'CTA 2500', 'CTA 3500',
      ],
    },
    {
      brand: 'White Planters',
      models: ['6100', '6200', '8100', '8516', '8522', '9816', '9818'],
    },
    {
      brand: 'Horsch',
      models: [
        'Maestro 12 SW', 'Maestro 16 SW', 'Maestro 24 SW',
        'Joker 8 RT', 'Joker 12 RT',
        'Tiger 4 LT', 'Tiger 8 LT',
        'Sprinter 6 ST', 'Sprinter 9 ST',
        'Pronto 9 DC', 'Pronto 12 DC',
        'Terrano 4 FX', 'Terrano 6 FX',
      ],
    },
    {
      brand: 'Bourgault',
      models: [
        '3310-60 Paralink', '3310-76 Paralink',
        '6550 Series', '6550 ST', '6700 ST',
        '3195-36 Series',
        'XR770', 'XR780',
        '5710',
      ],
    },
    {
      brand: 'Morris',
      models: [
        'Quantum 2400 Air Drill', 'Quantum 3000',
        'C2 Air Seeder', 'C3 Air Seeder',
        'Maxim 2', 'Maxim 3',
      ],
    },
    {
      brand: 'Sunflower',
      models: ['1435', '4630', '6333-30', '9630 Planter', '9831 Row Crop Planter'],
    },
    {
      brand: 'Landoll',
      models: ['7431', '7441', '7450', '930F', '1450'],
    },
    {
      brand: 'Krause',
      models: ['4200 Dominator', '6200 Dominator', '8200 Dominator', '3100 Till Mulcher'],
    },
    {
      brand: 'Salford',
      models: ['RTS 570', 'RTS 630', 'I-1200', 'I-1600', 'BBI SpreadAll'],
    },
    {
      brand: 'DMI',
      models: ['Paratill', 'Tiger Mate II', 'Ecolo-Tiger'],
    },
    {
      brand: 'Blu-Jet',
      models: ['AT Series', 'NutriPlacer 800', 'NutriPlacer 850', 'Surface Sweep'],
    },
    {
      brand: 'Unverferth',
      models: ['Ripper Stripper', '2110 Conservation Disk', '3510 Turbo Disc Finisher', 'Coulter Disk 2850'],
    },
    {
      brand: 'Kuhn',
      models: [
        'Planter 3000', 'Planter 5000', 'Planter 7000', 'Planter 9000',
        'Performer 3000', 'Performer 6000',
        'Kracker 4202', 'Kracker 6302',
        'Combiliner Venta 3030',
      ],
    },
  ],

  'Sprayers': [
    {
      brand: 'John Deere',
      models: [
        'R4023', 'R4030', 'R4038', 'R4044', 'R4045', 'R4060',
        '4630', '4730', '4830',
      ],
    },
    {
      brand: 'Case IH',
      models: [
        'Patriot 250', 'Patriot 280', 'Patriot 350', 'Patriot 380',
        'Patriot 4440', 'Patriot 4450', 'Patriot 4490',
        'Patriot 2250', 'Patriot 2270',
      ],
    },
    {
      brand: 'New Holland',
      models: [
        'Guardian SP.270F', 'Guardian SP.295F', 'Guardian SP.365F',
        'Guardian SP.390F', 'Guardian SP.410F',
        'Guardian Pro SP.265F', 'Guardian Pro SP.295F',
      ],
    },
    {
      brand: 'Apache',
      models: ['AS720', 'AS850', 'AS1020', 'AS1220', 'AS1240'],
    },
    {
      brand: 'Hagie',
      models: ['STS10', 'STS12', 'STS14', 'STS16', 'DTS10', 'DTS16'],
    },
    {
      brand: 'Hardi',
      models: [
        'Commander 4400', 'Commander 6000', 'Commander 6000 Plus',
        'Master 4500', 'Master 5500',
        'Navigator 4000', 'Navigator 6000',
        'Rubicon 9000',
      ],
    },
    {
      brand: 'AGCO RoGator',
      models: ['RG600B', 'RG900B', 'RG1100B', 'C Series', 'B Series'],
    },
    {
      brand: 'Wilmar',
      models: ['W240', 'W280', 'W300', 'WR8400'],
    },
    {
      brand: 'Miller Nitro',
      models: ['6000', '7000', '8000', '9000'],
    },
    {
      brand: 'Bestway',
      models: ['Field Star II 1200', 'Field Star II 1500', 'Nitro Pro 1200', 'Nitro Pro 1500'],
    },
    {
      brand: 'Kuhn Nufarm',
      models: ['Lexis 28', 'Lexis 33', 'Metris 3601'],
    },
    {
      brand: 'Agrifac',
      models: ['Condor Extra', 'Condor Endurance', 'Condor Quattro', 'WideTrail'],
    },
    {
      brand: 'Bateman',
      models: ['RB15', 'RB25', 'RB35', 'RB55'],
    },
    {
      brand: 'Goldacres',
      models: ['Prairie Gold 6000', 'Prairie Gold 7000'],
    },
    {
      brand: 'Fast',
      models: ['103', '113 Series', '9613 XL'],
    },
    {
      brand: 'Brandt',
      models: ['Triton 4550', 'Triton 7550'],
    },
  ],

  'Loaders & Skid Steers': [
    {
      brand: 'Bobcat',
      models: [
        'S450', 'S510', 'S550', 'S570', 'S590', 'S630', 'S650', 'S750', 'S770', 'S850',
        'T450', 'T550', 'T590', 'T630', 'T650', 'T740', 'T750', 'T770', 'T870',
        'A770', 'A300',
        'E20', 'E26', 'E35', 'E42', 'E50', 'E60', 'E85', 'E145',
        'TL26', 'TL30', 'TL38',
      ],
    },
    {
      brand: 'Case',
      models: [
        'SR130', 'SR150', 'SR175', 'SR200', 'SR220', 'SR250',
        'SV250', 'SV280', 'SV340',
        'TR270', 'TR310', 'TR320', 'TR340',
        'TV380', 'TV450',
        'CX15B', 'CX26B', 'CX37C', 'CX57C', 'CX80C',
      ],
    },
    {
      brand: 'New Holland',
      models: [
        'L216', 'L218', 'L220', 'L221', 'L223', 'L225', 'L228', 'L230',
        'C227', 'C232', 'C234', 'C237',
        'L316', 'L318', 'L320', 'L321', 'L323', 'L325', 'L328', 'L334',
        'C332', 'C337',
      ],
    },
    {
      brand: 'Caterpillar',
      models: [
        '216B3', '226D3', '232D3', '236D3', '242D3', '246D3', '248', '252', '256',
        '262D3', '272D2', '279D3', '289D3', '299D3', '299D3 XE',
        '903D', '906M', '908M',
      ],
    },
    {
      brand: 'John Deere',
      models: [
        '317G', '320G', '325G', '330G', '332G',
        '333G',
        '244K', '244L', '304K', '304L', '324K', '324L', '344K', '344L', '444K', '444L',
        '514', '524K', '524L', '624K', '624L', '644K', '644L', '724K', '724L',
      ],
    },
    {
      brand: 'Kubota',
      models: [
        'SSV65', 'SSV75',
        'SVL65-2', 'SVL75-2S', 'SVL95-2S', 'SVL97-2',
        'R065', 'R085', 'R105',
        'K008-3', 'U17', 'U27-4', 'U35-4', 'U55-4',
      ],
    },
    {
      brand: 'Gehl',
      models: [
        'R105', 'R135', 'R150', 'R165', 'R190', 'R220', 'R260',
        'RT135', 'RT165', 'RT215', 'RT250', 'RT295',
        'V270', 'V330', 'V340',
        'DL6H', 'DL8',
      ],
    },
    {
      brand: 'Manitou',
      models: [
        'MLT 625', 'MLT 630', 'MLT 634', 'MLT 635', 'MLT 741',
        'MLT 741-120 LSU', 'MLT 845-120 LSU', 'MLT 950',
        'MHT 10130', 'MHT 10160',
        '3300 V', '4300 V', '6300 V',
      ],
    },
    {
      brand: 'Wacker Neuson',
      models: ['SW21', 'SW28', 'SW28 E', 'ST28', 'ST35', '1550', '2080'],
    },
    {
      brand: 'Takeuchi',
      models: ['TL8', 'TL10', 'TL12', 'TL12R2', 'TW65', 'TW80', 'TW95'],
    },
    {
      brand: 'JLG',
      models: ['G6-42A', 'G9-43A', 'G12-55A', 'G15-44A', '1255', '1505'],
    },
    {
      brand: 'Genie',
      models: ['GTH-636', 'GTH-844', 'GTH-1056', 'GTH-1544'],
    },
    {
      brand: 'Merlo',
      models: ['P25.6', 'P32.6 Plus', 'P38.13 Plus', 'P50.18 Plus', 'TF35.7-120'],
    },
    {
      brand: 'Mustang',
      models: ['1750RT', '2100RT', '2800RT', '3300V'],
    },
  ],

  'Irrigation': [
    {
      brand: 'Valley',
      models: [
        '6000 Series', '7000 Series', '8000 Series',
        '6000XD', '8000XD',
        'Pivot Pro', 'Pivot Pro+',
        'Lateral Move',
      ],
    },
    {
      brand: 'Reinke',
      models: [
        'Electrogator I', 'Electrogator II', 'Electrogator X',
        'Resolute I', 'Resolute II',
        'Navigator', 'Pivot',
      ],
    },
    {
      brand: 'Lindsay / Zimmatic',
      models: [
        'Zimmatic 8500P', 'Zimmatic 9500P',
        'Zimmatic 9000XS',
        'FieldNET Advisor',
        'Hiflo Lateral',
      ],
    },
    {
      brand: 'T-L Irrigation',
      models: ['Pivot System', 'Lateral Move', 'Towable Pivot'],
    },
    {
      brand: 'Grundfos',
      models: [
        'SP 3A-23', 'SP 5A-20', 'SP 11-18', 'SP 17-8', 'SP 30-17',
        'CM 1', 'CM 3', 'CM 5', 'CM 10', 'CM 25',
        'CRI Series', 'CRNE Series',
        'SQ 3-55', 'SQ 5-50',
      ],
    },
    {
      brand: 'Goulds / Xylem',
      models: [
        '3657', '3757', '3886', '3887',
        'VIT Series', 'WS Series',
        'LNC Series', 'V Series Turbine',
      ],
    },
    {
      brand: 'Franklin Electric',
      models: [
        'Tri-Seal 4"', 'Tri-Seal 6"', 'Tri-Seal 8"',
        'FPS Series', 'MagForce Series',
        'SandPro', 'MonoDrive',
      ],
    },
    {
      brand: 'Gorman-Rupp',
      models: [
        'T Series', 'U Series', 'Super T Series',
        'PA Series', '4B-B', '6B-B', '8C-B',
      ],
    },
    {
      brand: 'Berkeley Pumps',
      models: ['B2TPMS', 'B3TPMS', 'B4TPMS', 'B5TPMS', 'SCI Series'],
    },
    {
      brand: 'Irritec',
      models: ['Labyrinth Drip Tape', 'T-Tape', 'Aquaplus', 'Compact K'],
    },
    {
      brand: 'Hunter Industries',
      models: ['I-35', 'I-40', 'I-60', 'PGP Ultra', 'MP Rotator'],
    },
    {
      brand: 'Rain Bird',
      models: ['5000 Series', '8005', 'SAM-PRS Series', '1800 Series', 'XCZ-100-PRF'],
    },
    {
      brand: 'Netafim',
      models: ['Drip Net PC', 'UniNet', 'StreamNet', 'Typhoon'],
    },
    {
      brand: 'Jain Irrigation',
      models: ['J-Turbo PC', 'J-Turbo NPC', 'PC Drip Line'],
    },
    {
      brand: 'WaterPulse / ABI',
      models: ['Turboprop Series', 'LP Towers'],
    },
    {
      brand: 'Ag-Rain',
      models: ['Traveling Gun 75', 'Traveling Gun 100', 'Reel Traveler'],
    },
  ],

  'Power Tools': [
    {
      brand: 'Stihl',
      models: [
        'MS 170', 'MS 180 C-BE', 'MS 250', 'MS 250 C-BE', 'MS 271', 'MS 291', 'MS 311', 'MS 362', 'MS 391', 'MS 441', 'MS 461', 'MS 500i', 'MS 661', 'MS 881',
        'MSA 120 C-BQ', 'MSA 200 C-BQ',
        'FSA 60 R', 'FSA 130 R', 'FS 38', 'FS 56', 'FS 91', 'FS 111', 'FS 131', 'FS 240', 'FS 311',
        'KMA 135 R', 'KMA 130 R',
        'BR 200', 'BR 350', 'BR 430', 'BR 600', 'BR 800 X',
        'BG 50', 'BG 86',
        'SP 90 T', 'SP 90 TX',
        'HT 131', 'HT 133',
      ],
    },
    {
      brand: 'Husqvarna',
      models: [
        '120', '120i', '135', '135 Mark II', '140', '145', '450 Rancher', '455 Rancher', '460 Rancher', '465 Rancher', '550 XP Mark II', '560 XP G', '572 XP G', '592 XP G',
        'T525', 'T540i XP', 'T542 XP G',
        '115iL', '115iKD', '520iLX', '525L', '536Li', '536LiLX', '525RBX', '336FR',
        '305', '315X', '430XH', '450X',
        '375BTS', '570BTS', '580BTS', '360BT', '360BTS',
      ],
    },
    {
      brand: 'Echo',
      models: [
        'CS-310', 'CS-355T', 'CS-400', 'CS-490', 'CS-590', 'CS-620P', 'CS-680',
        'SRM-225', 'SRM-266', 'SRM-2620', 'SRM-410U',
        'PAS-225', 'PAS-266', 'PAS-2620',
        'PB-250LN', 'PB-580H', 'PB-760LNT', 'PB-8010',
        'HC-152', 'HC-2020',
      ],
    },
    {
      brand: 'RedMax',
      models: ['EBZ9000RH', 'EBZ8550RH', 'BCZ3000S', 'GZ3500TS'],
    },
    {
      brand: 'Honda',
      models: [
        'EU2200i', 'EU3000iS', 'EU6500iS',
        'EB2800i', 'EB5000', 'EB6500', 'EB10000',
        'GX160', 'GX200', 'GX270', 'GX390',
        'HRC216HXA', 'HRN216VKA',
      ],
    },
    {
      brand: 'Generac',
      models: [
        'GP3500iO', 'GP6500', 'GP7500E', 'GP8000E', 'GP10000E',
        'XC6500', 'XC8000E',
        '7500E', '10000E', '17500E',
        'IQ3500', 'GP3300i',
      ],
    },
    {
      brand: 'Champion',
      models: ['3500W', '4000W', '4500W', '7500W', '9000W', '100263', '201049'],
    },
    {
      brand: 'Lincoln Electric',
      models: [
        'Power MIG 140C', 'Power MIG 180C', 'Power MIG 210 MP', 'Power MIG 256', 'Power MIG 350MP',
        'Square Wave TIG 200', 'Square Wave TIG 275',
        'Viking 3350', 'Viking 3350 Series',
        'Ranger 250 GXT', 'Ranger 305G',
        'Idealarc DC-600',
      ],
    },
    {
      brand: 'Miller Electric',
      models: [
        'Millermatic 141', 'Millermatic 211', 'Millermatic 252',
        'Multimatic 215', 'Multimatic 220 AC/DC', 'Multimatic 235',
        'Dynasty 200', 'Dynasty 210', 'Dynasty 280', 'Dynasty 350',
        'Syncrowave 210', 'Syncrowave 250',
        'Big Blue 300P', 'Big Blue 400 Pro',
        'XMT 304', 'XMT 350',
      ],
    },
    {
      brand: 'Hobart',
      models: ['Handler 140', 'Handler 190', 'Handler 210MVP', 'IronMan 230', 'Stickmate 160i'],
    },
    {
      brand: 'DeWalt',
      models: [
        'DCCS670X1 (60V Chainsaw)',
        'DCPW550B (Power Cleaner)',
        'DXPW3425 (Gas Pressure Washer)',
        'DWE7491RS (Table Saw)',
        'DW1150 (Drill Press)',
        'DCS369B (Reciprocating Saw)',
      ],
    },
    {
      brand: 'Milwaukee',
      models: [
        'M18 FUEL 2727-21HD (Chainsaw)',
        'M18 2903-20 (Drill)',
        '6955-20 (Angle Grinder)',
        '6117-30 (Band Saw)',
        'M12 2448-21 (Drill)',
      ],
    },
    {
      brand: 'Makita',
      models: [
        'XCU04PT1 (18V Chainsaw)',
        'EA6100P (Gas Chainsaw)',
        'DUH523Z (Hedge Trimmer)',
        'EM4251UH (4-Stroke String Trimmer)',
        'XRH11Z (Rotary Hammer)',
      ],
    },
    {
      brand: 'Pressure-Pro',
      models: ['PP4240H', 'PP3228H', 'PP4035H', 'EE4040HA'],
    },
    {
      brand: 'Simpson',
      models: ['MSH3125-S', 'MSV3024', 'PS4240H', 'ALH4240'],
    },
  ],

  'Electrical & Power': [
    {
      brand: 'Generac',
      models: [
        'GP3500iO', 'GP6500', 'GP7500E', 'GP8000E', 'GP10000E', 'GP12500E',
        'XC6500', 'XC8000E',
        '7500E', '10000E', '17500E',
        'Protector 14kW', 'Protector 22kW', 'Protector 48kW',
        'Guardian 7kW', 'Guardian 10kW', 'Guardian 13kW', 'Guardian 16kW', 'Guardian 20kW',
        'PowerPact 7.5kW',
        'IQ3500', 'GP3300i',
      ],
    },
    {
      brand: 'Kohler',
      models: [
        '6RESVL', '8RESVL', '12RESVL', '14RESVL', '20RESAL',
        '38RCLB', '48RCLB', '60RCLB', '80RCLB', '100RCLB', '125RCLB',
        '150RCLB', '200RCLB',
        'PCV730', 'CH750',
      ],
    },
    {
      brand: 'Cummins / Onan',
      models: [
        'Onan 2.5 HGJAB', 'Onan 3.6 HGJAB', 'Onan 5500', 'Onan 6500', 'Onan 7000',
        'RS20000', 'RS13000',
        'C17D6', 'C20D6', 'C25D6', 'C38D6', 'C55D6', 'C80D6',
        'DQKAB', 'DQKAA',
      ],
    },
    {
      brand: 'Caterpillar',
      models: [
        'DE22E3', 'DE33E3', 'DE55E3', 'DE100E3', 'D100-6',
        'C3.3B', 'C4.4', 'C7.1', 'C9', 'C15',
        'XQ100', 'XQ125', 'XQ175', 'XQ230', 'XQ350',
      ],
    },
    {
      brand: 'Briggs & Stratton',
      models: [
        '30651', '30675', '30678',
        'P3000', 'P4500', 'P6500',
        'Q6500', 'Q12500',
        'Vanguard 23', 'Vanguard 35', 'Vanguard 40',
      ],
    },
    {
      brand: 'Tesla Energy',
      models: ['Powerwall 2', 'Powerwall+', 'Powerwall 3', 'Megapack'],
    },
    {
      brand: 'Enphase',
      models: ['IQ Battery 3', 'IQ Battery 5P', 'IQ Battery 10T', 'IQ Battery 10+', 'IQ8 Microinverter'],
    },
    {
      brand: 'SolarEdge',
      models: ['SE7600H', 'SE10000H', 'SE11400H', 'SE33.3K', 'Home Battery'],
    },
    {
      brand: 'Outback Power',
      models: ['FP1 Series', 'FX2012', 'FX2348T', 'VFXR3048A'],
    },
    {
      brand: 'Eaton',
      models: [
        'CH200L200PGT', 'BR200L200PGT',
        'PW9130N1000T-EBM',
        'DG4000', 'DG7500E',
      ],
    },
    {
      brand: 'Square D / Schneider Electric',
      models: [
        'HOM2448M100PC', 'QO130L200PG',
        'Conext SW 4024', 'Conext XW+',
        'APC Smart-UPS 3000',
      ],
    },
    {
      brand: 'Blue Pacific Solar',
      models: ['Off-Grid Kit 1kW', 'Off-Grid Kit 3kW', 'Off-Grid Kit 5kW'],
    },
    {
      brand: 'Winco',
      models: ['W6000HE', 'W10000VE', 'W15000VE', 'EC6000I', 'EC9000I'],
    },
    {
      brand: 'Multiquip',
      models: ['MQ GA6HEA', 'MQ GA9HEA', 'MQ DCA25SSJU', 'MQ DCA45SSIU4F'],
    },
  ],

  'Livestock Equipment': [
    {
      brand: 'Priefert',
      models: [
        'Model 82 Squeeze', 'Model 85 Squeeze', 'Model 87 Squeeze',
        'S28 Head Gate', 'NH10 Head Gate',
        'Classic Cattle Chute', 'Roping Chute',
        'Sweep System', 'Tub & Sweep Combo',
        'Panels', 'Feeders', 'Hay Rings',
      ],
    },
    {
      brand: 'WW Manufacturing',
      models: [
        '1701 Squeeze Chute', '2100 Series', '3100 Series', '5000 Series',
        'Roping Chute',
        'Cable Alley', 'Powder-Coated Panel',
      ],
    },
    {
      brand: 'Hi-Qual',
      models: ['Standard Squeeze', 'Hydraulic Squeeze', 'Electric Squeeze', 'Head Gate'],
    },
    {
      brand: 'Powder River',
      models: [
        'P20 Squeeze', 'P32 Squeeze', 'P82 Squeeze',
        'PortaFount 100', 'PortaFount 150',
        'Panel 5-Bar', 'Panel 6-Bar', 'Gate',
        'Tub Sorter',
      ],
    },
    {
      brand: 'Arrowquip',
      models: [
        'Q-Catch 74 Series', 'Q-Catch 86 Series', 'Q-Catch 87 Series',
        'Q-Power 104', 'Q-Power 116',
        'Bow Gate', 'Straight Gate',
      ],
    },
    {
      brand: 'Real Tuff',
      models: ['Squeeze Chute', 'Head Gate', 'Panels', 'Alley System'],
    },
    {
      brand: 'Sydell',
      models: ['206 Series', 'Series II', 'Balaclava Ram', 'Ewe Creep Feeder'],
    },
    {
      brand: 'Ritchie Industries',
      models: [
        'Omni Fount 24', 'Omni Fount 32', 'Omni Fount 64',
        'Eco Fount 2', 'Eco Fount 5',
        'Thrifty King 30', 'Thrifty King 50',
        'WaterMaster',
      ],
    },
    {
      brand: 'Behlen Country',
      models: [
        'Galvanized Round Tank 100', 'Galvanized Round Tank 300', 'Galvanized Round Tank 500',
        'Oval Stock Tank', 'Poly Stock Tank',
        'Corral Panels', 'Continuous Fence Panel',
        'Bunk Feeder', 'Hay Rack',
      ],
    },
    {
      brand: 'Calan',
      models: ['Door Feeder 8", 12"', 'Barrel Feeder', 'Pig Feeder', 'Calf Starter Feeder'],
    },
    {
      brand: 'Gallagher',
      models: ['B11', 'B21', 'B50', 'B80', 'B100', 'M300', 'M3800i', 'S17', 'S100', 'S400'],
    },
    {
      brand: 'Parmak',
      models: ['Magnum 12', 'Magnum 12-SP', 'Mark 6-SP', 'DF-SP-LI'],
    },
    {
      brand: 'Datamars / Zee Tags',
      models: ['Y-Tex 2-Piece Tag', 'Allflex Global Tag', 'Leader Tag S/M/L'],
    },
    {
      brand: 'Allflex',
      models: ['Usherette Panel Reader', 'RS420 Stick Reader', 'ATag Visual'],
    },
    {
      brand: 'GrowSafe',
      models: ['Beef Producer', 'Dairy Producer'],
    },
    {
      brand: 'DeLaval',
      models: ['VMS V300', 'AMR', 'Dairy Control DC305', 'InService Milking Parlor'],
    },
    {
      brand: 'Lely',
      models: ['Astronaut A5', 'Vector', 'Juno', 'Grazeway'],
    },
    {
      brand: 'Boumatic',
      models: ['Gemini Rotary', 'SwiftLane', 'Robotic Milker'],
    },
    {
      brand: 'Jamesway',
      models: ['Flat Deck Feeder', 'Chain Feeder', 'Auger Conveyor'],
    },
    {
      brand: 'Osborne',
      models: ['FIRE System', 'Big Wheel Feeder', 'Hog Slat Panel'],
    },
  ],

  'Storage & Structures': [
    {
      brand: 'GSI (Grain Systems Inc)',
      models: [
        'GSI Bin 18,000 bu', 'GSI Bin 36,000 bu', 'GSI Bin 60,000 bu', 'GSI Bin 120,000 bu',
        'GSI Tower Dryer 2208', 'GSI Tower Dryer 2808', 'GSI Tower Dryer 3012',
        'GSI Crossflow Dryer 3016', 'GSI Crossflow Dryer 4016',
        'GSI Hopper Bin',
        'GSI Belt Conveyor', 'GSI Bucket Elevator',
      ],
    },
    {
      brand: 'Sukup',
      models: [
        'Sukup Bin 15,000 bu', 'Sukup Bin 30,000 bu', 'Sukup Bin 60,000 bu',
        'Sukup QuadDry', 'Sukup Tower Dryer', 'Sukup Natural Air Bin',
        'Sukup Hopper Bin', 'Sukup Flat Bottom',
        'Sukup Auger', 'Sukup Belt Conveyor',
      ],
    },
    {
      brand: 'Brock',
      models: [
        'Brock HDPE Bin', 'Brock Bolted Bin', 'Brock Hopper Bin',
        'Brock Grain Guardian Dryer',
        'Brock Continuous Flow Dryer',
      ],
    },
    {
      brand: 'Meridian',
      models: [
        'Meridian Grain Bin Standard', 'Meridian Hopper Bin',
        'Meridian Fuel Tank 500', 'Meridian Fuel Tank 1000', 'Meridian Fuel Tank 2000',
        'Meridian Liquid Fertilizer Tank 500', 'Meridian Liquid Fertilizer Tank 2000',
        'Meridian Seed Tender 360', 'Meridian Seed Tender 540',
      ],
    },
    {
      brand: 'Westeel',
      models: [
        'Westeel Hopper Bin 1,000 bu', 'Westeel Hopper Bin 3,000 bu',
        'Westeel Flat Bottom 15,000 bu', 'Westeel Flat Bottom 50,000 bu',
        'Westeel Aeration System',
      ],
    },
    {
      brand: 'AGI (Ag Growth Int\'l)',
      models: [
        'Prairie Steel Bin', 'Westeel Corr Bin',
        'Union Iron Works Elevator',
        'Batco Conveyor',
      ],
    },
    {
      brand: 'Behlen Country (Buildings)',
      models: [
        'A-Frame Building', 'Single Slope', 'Quonset',
        'Corral System', 'Modular Barn',
      ],
    },
    {
      brand: 'Morton Buildings',
      models: [
        'Post Frame Farm Building', 'Machine Storage',
        'Livestock Barn', 'Equestrian Center',
        'Multi-Use Barn',
      ],
    },
    {
      brand: 'FBi Buildings',
      models: ['Post-Frame Barn', 'Commodity Storage', 'Grain Handling Building'],
    },
    {
      brand: 'Butler Buildings',
      models: ['Landmark', 'Landmark II', 'Widespan', 'GalvaPlus'],
    },
    {
      brand: 'Western Global',
      models: [
        'FuelCube 990', 'FuelCube 2600', 'FuelCube 4400',
        'TransCube 10TC', 'TransCube 20TC', 'TransCube 30TC',
        'Titan FuelCube',
      ],
    },
    {
      brand: 'Containment Solutions',
      models: ['Fiberglass Tank 500', 'Fiberglass Tank 2000', 'Fiberglass Tank 10000'],
    },
    {
      brand: 'Snyder Industries',
      models: ['Water Tank 500', 'Water Tank 1500', 'Water Tank 2500', 'Nurse Tank'],
    },
    {
      brand: 'Ag-Bag',
      models: ['G6000 Bagger', 'G7000 Bagger', 'G8000 Bagger', 'G6000T Tunnel'],
    },
    {
      brand: 'KUHN Knight',
      models: [
        'Pro Twin 8118', 'Pro Twin 8124',
        'Reel Auggie 8124',
        'RA 142', 'RA 182',
      ],
    },
    {
      brand: 'Chief Industries',
      models: ['Chief Bin', 'Chief Hopper Cone', 'Chief Aeration Fan'],
    },
  ],

  'Hand Tools': [
    {
      brand: 'Snap-on',
      models: [
        'KRLP1012', 'KRL1022', 'KRL1062',
        'SFSX725', 'SFSX735', 'SFSX740',
        'FLANKDRIVE+ Wrenches',
        'SCHLEY Oil Filter Pliers',
        'SSDMR4A Ratchet',
      ],
    },
    {
      brand: 'Mac Tools',
      models: ['Tool Set', 'Torque Wrench', 'Socket Set', 'Ratchet Combo'],
    },
    {
      brand: 'DeWalt',
      models: [
        'DWMT72165 (108-pc Mechanics Set)',
        'DWMT73803 (168-pc Mechanics Set)',
        'DWMT81531 (205-pc Mechanics Set)',
        'DWHT36107 (Tape Measure)',
        'DWHT20210 (Hammer)',
      ],
    },
    {
      brand: 'Milwaukee',
      models: [
        '48-22-9004 (Mechanics Tool Set)',
        '48-22-6560 (Tool Bag)',
        '48-22-7125 (Lineman\'s Pliers)',
        '48-22-3041 (Magnetic Tape)',
        '48-22-9000 (Tool Set)',
      ],
    },
    {
      brand: 'Craftsman',
      models: [
        'CMMT99448 (450-pc Mechanics Set)',
        'CMMT99206 (Standard/Metric Set)',
        'CMMT81748 (215-pc Set)',
        'CMXZTSG1100 (Tape Measure)',
        'CMHT51398 (Framing Hammer)',
      ],
    },
    {
      brand: 'Klein Tools',
      models: [
        '92906 (6-Piece Screwdriver Set)',
        '5-in-1 Screwdriver 32477',
        '68200 (Conduit Bender)',
        'D228-8 (Diagonal Pliers)',
        'J207-8C (Journeyman Pliers)',
        'Cat. No. 11061 (Wire Stripper)',
      ],
    },
    {
      brand: 'Channellock',
      models: [
        '420 (Tongue & Groove Pliers 10")',
        '430 (12")', '440 (14")', '460 (20")',
        '526 (Slip Joint Pliers)',
        'XLT Series',
      ],
    },
    {
      brand: 'Knipex',
      models: [
        '86 03 250 (Pliers Wrench 10")',
        '87 01 250 (Cobra Water Pump Pliers 10")',
        '87 41 250 (Cobra XS)',
        '00 20 72 (Tool Set)',
        '74 02 160 (Diagonal Cutter)',
      ],
    },
    {
      brand: 'Wera',
      models: [
        '057460 (Kraftform Screwdriver Set)',
        '05020013001 (Tool-Check Plus)',
        '05136264001 (Joker Wrench Set)',
        '9800 Bit Set',
      ],
    },
    {
      brand: 'Stanley',
      models: [
        'STMT74101 (210-pc Mechanics Set)',
        'STHT60113 (Combo Set)',
        'FATMAX Tape Measure',
        'STHT51512 (Framing Hammer)',
        'STST19331 (Tool Bag)',
      ],
    },
    {
      brand: 'Proto / Stanley Proto',
      models: ['J50139 (170-pc Tool Set)', 'J44158L (Torque Wrench)', 'J6430-TT (8-pc Wrench Set)'],
    },
    {
      brand: 'GearWrench',
      models: [
        '83234 (239-pc Mechanics Set)',
        '84916 (20-pc Metric Ratchet & Wrench Set)',
        '85058 (Flex Head Ratchet)',
        '89003 (9-pc Adjustable Wrench Set)',
      ],
    },
    {
      brand: 'Irwin',
      models: [
        'VISE-GRIP 2078902 (9-pc Set)',
        'VISE-GRIP 2078300 (Locking Pliers)',
        'Marples Chisels',
        'Speedbor Drill Bit Set',
      ],
    },
    {
      brand: 'Estwing',
      models: [
        'E3-16S (Straight Rip Hammer)',
        'E3-20S (20 oz Framing Hammer)',
        'E3-22P (Nailing Hatchet)',
        'MRW10C (Rock Pick)',
        'E6-15 (Long Handle Axe)',
      ],
    },
    {
      brand: 'Fiskars',
      models: ['X27 Super Splitting Axe', 'X25 Splitting Axe', 'X17 Axe', 'IsoCore Maul', 'Pro Pruning Shears'],
    },
    {
      brand: 'Corona',
      models: ['RK 62060L (Ratchet Lopper)', 'BP 3180D (Bypass Pruner)', 'AC 8300 (Hedge Shears)'],
    },
    {
      brand: 'Felco',
      models: ['FELCO 2', 'FELCO 7', 'FELCO 8', 'FELCO 12', 'FELCO 14', 'FELCO F-900'],
    },
  ],
};
