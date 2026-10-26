-- =============================================================================
-- EcoShield AI — Multi-City Environmental Hotspots & Incident Data Seed
-- Target Engine: Supabase PostgreSQL 15+
-- Coverage: New Delhi, Hyderabad, Mumbai, Bengaluru, Kolkata, Chennai
-- Safe Execution: Completely idempotent (ON CONFLICT DO NOTHING / WHERE NOT EXISTS)
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Seeding EcoShield AI Multi-City Environmental Hotspots...';
END $$;

-- -----------------------------------------------------------------------------
-- 1. ENVIRONMENTAL HOTSPOTS (All 6 Metropolitan Preset Locations)
-- -----------------------------------------------------------------------------

INSERT INTO public.environmental_hotspots (
  name, category, lat, lng, address_name, current_risk_score, current_risk_level,
  active_reports_count, description, status, recommended_actions, last_inspected_at
)
SELECT * FROM (VALUES
  -- 1.1 New Delhi
  ('Sector 4 Canal Inflow Choke Point', 'plastic', 28.6139, 77.2090, 'Connaught Outer Canal, New Delhi', 84, 'critical', 3,
   'High accumulation of single-use plastics and packaging blocking culvert grates. High vulnerability to monsoon stormwater backup.',
   'mitigation_active', ARRAY['Install mechanical trash boom', 'Clear 40m culvert inlet before forecasted rain'], now() - interval '2 days'),
  ('Industrial Area Phase 2 Outfall Basin', 'water', 28.5355, 77.2600, 'Okhla Industrial Phase II Outfall, New Delhi', 78, 'high', 2,
   'Intermittent chemical effluent release causing visible discoloration and acute biochemical oxygen demand (BOD) spikes.',
   'active_monitoring', ARRAY['Deploy automated water sampler', 'Cross-examine factory discharge logs'], now() - interval '1 day'),
  ('Ring Road Construction Corridor', 'air', 28.5700, 77.1950, 'South Ext Ring Road Flyover, New Delhi', 66, 'high', 1,
   'Uncovered aggregate stockpiles creating localized PM10 and PM2.5 resuspension under vehicular turbulence.',
   'mitigation_active', ARRAY['Enforce tarpaulin covering on piles', 'Deploy mobile water sprinkler truck twice daily'], now() - interval '3 days'),
  ('Metro Line Underground Boring Site', 'noise', 28.6300, 77.2200, 'Barakhamba Road Tunnel Access, New Delhi', 52, 'moderate', 1,
   'Night-time hydraulic excavator noise exceeding 75 dBA during residential quiet hours.',
   'active_monitoring', ARRAY['Erect 4-meter sound insulation acoustic panels around diesel hydraulic generator'], now() - interval '2 days'),
  ('Abandoned Foundry Soil Remediation Zone', 'soil', 28.6650, 77.1500, 'Mayapuri Industrial Area, New Delhi', 72, 'high', 1,
   'Elevated lead and heavy metal slag deposits vulnerable to windblown transport and surface runoff.',
   'active_monitoring', ARRAY['Apply impermeable temporary seal', 'Commence core soil sampling grid'], now() - interval '5 days'),

  -- 1.2 Hyderabad (Tech & Lake Hub)
  ('Hussain Sagar Siphon & Necklace Road Inlet', 'water', 17.4239, 78.4738, 'Hussain Sagar North Siphon, Necklace Road, Hyderabad', 82, 'critical', 2,
   'Persistent chemical effluent inflows and organic loading creating acute dissolved oxygen depletion near the outflow sluice gates.',
   'mitigation_active', ARRAY['Deploy surface aeration units and floating bio-booms', 'Enforce pre-treatment protocols at upstream inlets'], now() - interval '1 day'),
  ('Musi River Amberpet Outfall Basin', 'plastic', 17.3912, 78.5140, 'Amberpet Musi River Causeway, Hyderabad', 78, 'high', 2,
   'Solid municipal waste and industrial packaging choking seasonal river channels, causing stagnant septic pools and flood backup risk.',
   'active_monitoring', ARRAY['Install mechanical trash racks at causeway piers', 'Scheduled hydraulic desiltation before monsoon surge'], now() - interval '2 days'),
  ('Sanathnagar Industrial Air Quality Zone', 'air', 17.4580, 78.4430, 'Sanathnagar Industrial Corridor, Hyderabad', 68, 'high', 1,
   'Elevated particulate matter (PM2.5/PM10) emissions from metal casting, pharmaceutical synthesis, and heavy freight movements.',
   'active_monitoring', ARRAY['Enforce wet scrubbing on industrial stacks', 'Deploy mobile mist cannon along transport corridor'], now() - interval '3 days'),

  -- 1.3 Mumbai (Coastal Megacity)
  ('Mithi River BKC Siphon & Culvert Choke', 'plastic', 19.0650, 72.8680, 'Bandra-Kurla Complex Mithi River Confluence, Mumbai', 88, 'critical', 2,
   'Severe plastic bottleneck and commercial packaging accumulation obstructing tidal sluice gates, posing extreme high-tide monsoon flood hazard.',
   'mitigation_active', ARRAY['Install automated heavy trash boom at BKC bridge', 'Daily tidal dredge cycle during spring tides'], now() - interval '1 day'),
  ('Mahim Creek Mangrove Estuary Buffer', 'water', 19.0430, 72.8420, 'Mahim Nature Park Estuary, Mumbai', 76, 'high', 2,
   'Untreated sewage overflow and microplastic entanglement degrading protected mangrove breathing roots and estuarine nursery habitat.',
   'active_monitoring', ARRAY['Deploy wetland floating phytoremediation rafts', 'Enforce perimeter interception traps'], now() - interval '2 days'),
  ('Chembur-Trombay Industrial & Refinery Corridor', 'air', 19.0520, 72.8980, 'Chembur Refinery Belt, Mumbai', 71, 'high', 1,
   'Fugitive hydrocarbon emissions and sulfur dioxide plumes accumulating under coastal thermal inversion conditions.',
   'active_monitoring', ARRAY['Continuous fence-line optical hydrocarbon monitoring', 'Mandate vapor recovery systems at tanker loading gantries'], now() - interval '3 days'),

  -- 1.4 Bengaluru (Watershed & Plateaus)
  ('Bellandur Lake North Inlet Foam Barrier', 'water', 12.9360, 77.6650, 'Bellandur Lake North Inflow, Bengaluru', 85, 'critical', 2,
   'Severe chemical surfactant accumulation causing toxic flammable froth and methane release under pre-monsoon wind agitation.',
   'mitigation_active', ARRAY['Deploy high-capacity bio-enzyme spraying nozzles', 'Maintain 24/7 froth retention mesh barriers'], now() - interval '1 day'),
  ('Varthur Lake Wetland Outlet & Sluice', 'plastic', 12.9510, 77.7210, 'Varthur Lake Spillway, Whitefield, Bengaluru', 74, 'high', 2,
   'Macroplastic waste and unsegregated construction runoff choking the natural wetland bio-filtration gradient.',
   'active_monitoring', ARRAY['Deploy floating debris containment boom', 'Construct sediment catchment basins upstream'], now() - interval '2 days'),
  ('Peenya Industrial Heavy Metal Soil Zone', 'soil', 13.0280, 77.5160, 'Peenya Industrial Phase III, Bengaluru', 70, 'high', 1,
   'Hexavalent chromium and electroplating sludge leaching into shallow groundwater aquifers.',
   'active_monitoring', ARRAY['Core borehole groundwater plume monitoring', 'Enforce zero liquid discharge (ZLD) audits'], now() - interval '4 days'),

  -- 1.5 Kolkata (Riverine Delta)
  ('Hooghly River Howrah Ghat Discharge Zone', 'water', 22.5850, 88.3450, 'Howrah Ferry Ghat Outfall, Kolkata', 81, 'critical', 2,
   'High coliform count and untreated municipal wastewater outfalls draining into tidal Ganga/Hooghly waters.',
   'mitigation_active', ARRAY['Install riverine intercepter screens at outfall mouths', 'Regular dissolved oxygen sampling along ferry routes'], now() - interval '1 day'),
  ('East Kolkata Wetlands Canal Choke Point', 'plastic', 22.5450, 88.4230, 'Topsia Canal & Ramsar Wetland Buffer, Kolkata', 77, 'high', 2,
   'Non-biodegradable polythene and solid debris restricting tidal bio-filtration channels in protected Ramsar wetlands.',
   'active_monitoring', ARRAY['Manual debris netting and weed harvester deployment', 'Strict policing against wetland boundary dumping'], now() - interval '2 days'),
  ('Tangra-Topsia Tannery Effluent Basin', 'soil', 22.5510, 88.3910, 'Tangra Industrial Cluster, Kolkata', 73, 'high', 1,
   'Historical chromium and sulfide residue deposition in reclaimed soil and open drainage ditches.',
   'active_monitoring', ARRAY['Soil stabilization with bio-char and lime treatment', 'Cordon unlined drainage ditches'], now() - interval '5 days'),

  -- 1.6 Chennai (Coastal Corridor)
  ('Cooum River Napier Bridge Siphon & Estuary', 'water', 13.0680, 80.2860, 'Napier Bridge Cooum River Mouth, Chennai', 86, 'critical', 2,
   'Stagnant deoxygenated blackwater and plastic detritus blocking tidal flushing into the Bay of Bengal.',
   'mitigation_active', ARRAY['Deploy high-flow aeration fountains and sandbar dredger', 'Seal illegal municipal sewer connections along banks'], now() - interval '1 day'),
  ('Adyar River Kotturpuram Sluice', 'plastic', 13.0210, 80.2450, 'Kotturpuram Causeway & Sluice Gate, Chennai', 79, 'high', 2,
   'Massive consumer plastic bottles and urban debris threatening drainage during torrential Northeast Monsoon bursts.',
   'mitigation_active', ARRAY['Clear 120m riverine trash boom before monsoon low pressure systems', 'Install automated trash skimmer'], now() - interval '2 days'),
  ('Manali & Ennore Petrochemical / Thermal Belt', 'air', 13.2180, 80.3240, 'Ennore Thermal & Petrochemical Corridor, Chennai', 75, 'high', 1,
   'High concentrations of fly ash particulates, sulfur emissions, and coastal marine petrochemical runoff.',
   'active_monitoring', ARRAY['Install continuous opacity monitoring on fly ash conveyors', 'Water sprinkling over coal storage yards'], now() - interval '3 days')
) AS v(name, category, lat, lng, address_name, current_risk_score, current_risk_level, active_reports_count, description, status, recommended_actions, last_inspected_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.environmental_hotspots h WHERE h.name = v.name
);

-- -----------------------------------------------------------------------------
-- 2. SEED POLLUTION REPORTS (Multi-City Distribution)
-- -----------------------------------------------------------------------------

INSERT INTO public.pollution_reports (
  category, title, description, lat, lng, address_name, severity, status,
  reporter_name, is_anonymous, is_demo, observed_at, created_at
)
SELECT * FROM (VALUES
  -- Hyderabad
  ('plastic', 'Microplastic & Debris Congestion at Durgam Cheruvu Inflow',
   'Submerged trash rack clogged with PET bottles and packaging debris near Madhapur tech corridor bridge.',
   17.4370, 78.3845, 'Durgam Cheruvu Cable Bridge Inflow, Madhapur, Hyderabad', 4, 'action_assigned', 'Kavita Reddy', false, true, now() - interval '18 hours', now() - interval '18 hours'),
  ('water', 'Industrial Effluent Discharge into Jeedimetla Nala',
   'Foaming dark chemical effluent with pungent odor detected entering stormwater channel towards Hussain Sagar feeder.',
   17.5120, 78.4480, 'Jeedimetla Industrial Drainage Outfall, Hyderabad', 5, 'verified', 'Rajesh Kumar (Field Officer)', false, true, now() - interval '28 hours', now() - interval '28 hours'),
  ('air', 'Uncontrolled Biomass & Waste Incineration at Jawaharnagar Fringe',
   'Thick smoke plume from open waste burning drifting across outer ring road residential sectors.',
   17.4980, 78.5830, 'Jawaharnagar Landfill Perimeter, Hyderabad', 4, 'under_review', 'Civic Scout', true, true, now() - interval '10 hours', now() - interval '10 hours'),

  -- Mumbai
  ('plastic', 'Massive Marine Debris & Plastic Accumulation at Versova Beach Outfall',
   'High tide left extensive deposits of single-use plastics, discarded fishing line, and packaging blocking storm gates.',
   19.1350, 72.8120, 'Versova Beach Stormwater Canal Mouth, Mumbai', 4, 'action_assigned', 'Aarav Patel', false, true, now() - interval '22 hours', now() - interval '22 hours'),
  ('noise', 'High-Decibel Night Construction at Coastal Road Section',
   'Heavy vibratory pile drivers operating past 01:00 AM within 120m of residential high-rises.',
   18.9750, 72.8050, 'Worli Sea Face Reclamation Section, Mumbai', 3, 'submitted', 'Civic Scout', true, true, now() - interval '8 hours', now() - interval '8 hours'),
  ('soil', 'Chemical Sludge Dumping near Deonar Landfill Buffer',
   'Unmanifested industrial sludge tanks discarded along wetland buffer zone, leaking acidic leachate into soil.',
   19.0620, 72.9230, 'Deonar Dumping Ground Buffer Strip, Mumbai', 5, 'verified', 'Rajesh Kumar (Field Officer)', false, true, now() - interval '30 hours', now() - interval '30 hours'),

  -- Bengaluru
  ('water', 'Toxic Surfactant Foam Overflowing Yemalur Bridge',
   'Massive billows of detergent froth rising 3 meters above weir crest and spilling onto road corridor.',
   12.9450, 77.6830, 'Yemalur Bridge, Bellandur Catchment, Bengaluru', 5, 'action_assigned', 'Deepa Narayan', false, true, now() - interval '26 hours', now() - interval '26 hours'),
  ('air', 'Severe Construction Dust & Traffic PM Resuspension at Silk Board',
   'Continuous flyover boring combined with heavy bus corridor generating localized PM10 readings above 320 µg/m³.',
   12.9175, 77.6235, 'Silk Board Junction Flyover Underpass, Bengaluru', 4, 'action_assigned', 'Rohan Deshmukh', false, true, now() - interval '16 hours', now() - interval '16 hours'),
  ('soil', 'Electronic Scrap Acid Leaching in Nayandahalli Warehouse Fringe',
   'Open-air chemical stripping of printed circuit boards releasing copper cyanide runoff into unlined trench.',
   12.9460, 77.5280, 'Nayandahalli Industrial Buffer, Bengaluru', 4, 'under_review', 'Civic Scout', true, true, now() - interval '12 hours', now() - interval '12 hours'),

  -- Kolkata
  ('plastic', 'Plastic Siltation at Circular Canal Maniktala Inflow',
   'Compacted single-use plastic layers and coconut husks blocking municipal lock gate drainage into Hooghly.',
   22.5920, 88.3780, 'Maniktala Circular Canal Bridge, Kolkata', 4, 'action_assigned', 'Subir Banerjee', false, true, now() - interval '20 hours', now() - interval '20 hours'),
  ('air', 'Heavy Freight Smoke & Stubble Resuspension along Kona Expressway',
   'Dense diesel exhaust plumes combined with perimeter agricultural burning causing visibility drop below 150m.',
   22.5780, 88.2910, 'Kona Expressway Toll Plaza Corridor, Kolkata', 3, 'submitted', 'Ananya Sharma', false, true, now() - interval '7 hours', now() - interval '7 hours'),
  ('thermal', 'Thermal Discharge from Substation into Canal System',
   'High-temperature cooling water outflow elevating local canal temperature to 39.8°C with noticeable fish mortality.',
   22.5320, 88.3840, 'Kasba Substation Canal Conduit, Kolkata', 3, 'verified', 'Rajesh Kumar (Field Officer)', false, true, now() - interval '24 hours', now() - interval '24 hours'),

  -- Chennai
  ('soil', 'Fly Ash Slurry Leakage near Buckingham Canal',
   'Ruptured slurry pipeline dispersing grey alkaline fly ash into wetland mudflats along Ennore canal.',
   13.2050, 80.3150, 'Ennore Creek Buckingham Canal Inflow, Chennai', 5, 'action_assigned', 'Rajesh Kumar (Field Officer)', false, true, now() - interval '32 hours', now() - interval '32 hours'),
  ('plastic', 'Plastic Trash Dam at Mambalam Canal Railway Culvert',
   'Hundreds of kilograms of beverage bottles and thermocol jammed against railway bridge piers, obstructing stormwater escape.',
   13.0370, 80.2280, 'Mambalam Canal Rail Crossing, T. Nagar, Chennai', 4, 'action_assigned', 'Priya Sundaram', false, true, now() - interval '14 hours', now() - interval '14 hours'),
  ('air', 'Chemical Odor Plume along Manali Highway Industrial Zone',
   'Strong mercaptan and sulfurous volatile organic vapors impacting morning commuters and adjacent settlements.',
   13.1650, 80.2720, 'Manali Express Highway Industrial Strip, Chennai', 4, 'under_review', 'Civic Scout', true, true, now() - interval '9 hours', now() - interval '9 hours')
) AS v(category, title, description, lat, lng, address_name, severity, status, reporter_name, is_anonymous, is_demo, observed_at, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.pollution_reports r WHERE r.title = v.title
);

-- -----------------------------------------------------------------------------
-- 3. SEED PREVENTION TASKS (Multi-City Distribution)
-- -----------------------------------------------------------------------------

INSERT INTO public.prevention_tasks (
  id, title, description, category, priority, status, lat, lng, address_name,
  risk_score, risk_level, deadline, is_demo, created_at
)
SELECT * FROM (VALUES
  ('TSK-HYD-101', 'Emergency Effluent Containment & Aeration at Jeedimetla Nala',
   'Deploy neutralizing alkali lime treatment and floating surface aerators to mitigate low DO conditions.',
   'water', 'critical', 'in_progress', 17.5120, 78.4480, 'Jeedimetla Industrial Drainage Outfall, Hyderabad',
   86, 'critical', now() + interval '2 days', true, now() - interval '24 hours'),
  ('TSK-HYD-102', 'Rapid Plastic Extraction & Silt Trap Clearance at Durgam Cheruvu',
   'Extract blocked single-use plastics from inlet culvert screen using mobile crane arm; replace damaged baffle screens.',
   'plastic', 'high', 'assigned', 17.4370, 78.3845, 'Durgam Cheruvu Cable Bridge Inflow, Madhapur, Hyderabad',
   74, 'high', now() + interval '3 days', true, now() - interval '16 hours'),
  ('TSK-BOM-101', 'Install Heavy-Duty Trash Booms at Versova Drainage Outfall',
   'Anchor interlocking HDPE floating boom across 60m canal outlet to capture marine plastic before high tide tidal wash.',
   'plastic', 'critical', 'in_progress', 19.1350, 72.8120, 'Versova Beach Stormwater Canal Mouth, Mumbai',
   84, 'critical', now() + interval '2 days', true, now() - interval '20 hours'),
  ('TSK-BOM-102', 'Remediate Chemical Sludge Leaching at Deonar Buffer',
   'Excavate contaminated surface sludge drums and lay high-density polyethylene impermeable containment liner.',
   'soil', 'high', 'assigned', 19.0620, 72.9230, 'Deonar Dumping Ground Buffer Strip, Mumbai',
   77, 'high', now() + interval '3 days', true, now() - interval '26 hours'),
  ('TSK-BLR-101', 'Deploy Foam Suppression Sprinklers at Yemalur Bridge Sluice',
   'Set up high-pressure misting manifolds with biodegradable de-foaming agents to collapse toxic surfactant froth.',
   'water', 'critical', 'in_progress', 12.9450, 77.6830, 'Yemalur Bridge, Bellandur Catchment, Bengaluru',
   87, 'critical', now() + interval '2 days', true, now() - interval '22 hours'),
  ('TSK-BLR-102', 'Deploy High-Pressure Water Mist Cannons at Silk Board',
   'Station twin truck-mounted fog cannons to scrub airborne particulate matter along metro construction corridor.',
   'air', 'high', 'assigned', 12.9175, 77.6235, 'Silk Board Junction Flyover Underpass, Bengaluru',
   75, 'high', now() + interval '3 days', true, now() - interval '14 hours'),
  ('TSK-CCU-101', 'Clear Tidal Plastic Bottlenecks at East Kolkata Wetland Spillway',
   'Operate amphibious weed-and-plastic harvester to reopen 350m of tidal drainage arteries into Ramsar wetland.',
   'plastic', 'critical', 'in_progress', 22.5450, 88.4230, 'Topsia Canal & Ramsar Wetland Buffer, Kolkata',
   83, 'critical', now() + interval '2 days', true, now() - interval '18 hours'),
  ('TSK-CCU-102', 'Verify Industrial Thermal Outflow Dispersion & Aeration',
   'Inspect cooling channel weirs and mandate installation of cascade aerators to drop effluent temperature below 32°C.',
   'thermal', 'medium', 'assigned', 22.5320, 88.3840, 'Kasba Substation Canal Conduit, Kolkata',
   62, 'moderate', now() + interval '4 days', true, now() - interval '20 hours'),
  ('TSK-MAA-101', 'Clear Estuarine Sluice Trash Boom at Cooum River Mouth',
   'Mobilize heavy excavator with grab bucket to clear debris accumulation at Napier Bridge sluice before incoming rainfall.',
   'water', 'critical', 'in_progress', 13.0680, 80.2860, 'Napier Bridge Cooum River Mouth, Chennai',
   85, 'critical', now() + interval '2 days', true, now() - interval '12 hours'),
  ('TSK-MAA-102', 'Buckingham Canal Fly Ash Barrier Inspection & Soil Containment',
   'Build clay-bund cofferdam to halt slurry migration from damaged ash pipeline into Buckingham Canal watercourse.',
   'soil', 'high', 'assigned', 13.2050, 80.3150, 'Ennore Creek Buckingham Canal Inflow, Chennai',
   78, 'high', now() + interval '3 days', true, now() - interval '28 hours')
) AS v(id, title, description, category, priority, status, lat, lng, address_name, risk_score, risk_level, deadline, is_demo, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.prevention_tasks t WHERE t.id = v.id
);

DO $$
BEGIN
  RAISE NOTICE 'EcoShield AI Multi-City Data Seed completed successfully!';
END $$;
