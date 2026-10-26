import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  AlertTriangle,
  Filter,
  PlusCircle,
  ShieldAlert,
  Layers,
  CheckCircle,
  Eye,
  Info,
  Navigation,
  Wrench,
  Search,
  RotateCcw,
  Sliders,
  Check,
  ChevronDown,
  X,
  Radio,
  FileCheck,
} from 'lucide-react';
import {
  PollutionReport,
  PreventionTask,
  EnvironmentalHotspot,
  PollutionCategory,
  RiskLevel,
  Coordinates,
  TaskPriority,
} from '../../types';
import { validateCoordinates } from '../../services/weatherService';

interface InteractiveMapProps {
  reports: PollutionReport[];
  tasks?: PreventionTask[];
  hotspots: EnvironmentalHotspot[];
  selectedLocation?: Coordinates;
  onSelectReport?: (report: PollutionReport) => void;
  onSelectTask?: (task: PreventionTask) => void;
  onSelectHotspot?: (hotspot: EnvironmentalHotspot) => void;
  onSelectLocation?: (coords: Coordinates) => void;
  onMapClickCoordinates?: (coords: Coordinates) => void;
  userRole?: string;
  onAddNewHotspot?: (hotspot: Omit<EnvironmentalHotspot, 'id'>) => void;
  onNavigateToTasks?: () => void;
  onNavigateToReports?: () => void;
  heightClass?: string;
}

const PRESET_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: 'New Delhi (HQ)', lat: 28.6139, lng: 77.2090 },
  { name: 'Hyderabad (Tech & Lake)', lat: 17.3850, lng: 78.4867 },
  { name: 'Mumbai (Coastal)', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru (Watershed)', lat: 12.9716, lng: 77.5946 },
  { name: 'Kolkata (Riverine)', lat: 22.5726, lng: 88.3639 },
  { name: 'Chennai (Coastal Corridor)', lat: 13.0827, lng: 80.2707 },
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  reports,
  tasks = [],
  hotspots,
  selectedLocation,
  onSelectReport,
  onSelectTask,
  onSelectHotspot,
  onSelectLocation,
  onMapClickCoordinates,
  userRole,
  onAddNewHotspot,
  onNavigateToTasks,
  onNavigateToReports,
  heightClass = 'h-[580px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Filter States
  const [entityFilter, setEntityFilter] = useState<'all' | 'reports' | 'tasks' | 'hotspots'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [provenanceFilter, setProvenanceFilter] = useState<'all' | 'real_only' | 'demo_only'>('all');
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Manual Coordinates Input
  const [manualLat, setManualLat] = useState<string>(selectedLocation ? String(selectedLocation.lat) : '28.6139');
  const [manualLng, setManualLng] = useState<string>(selectedLocation ? String(selectedLocation.lng) : '77.2090');
  const [coordError, setCoordError] = useState<string>('');

  // GPS Geolocation States
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [geoMessage, setGeoMessage] = useState<string>('');

  // Modal State for Adding Hotspot
  const [showHotspotModal, setShowHotspotModal] = useState<boolean>(false);
  const [hotspotForm, setHotspotForm] = useState({
    name: '',
    category: 'plastic' as PollutionCategory,
    lat: 28.6139,
    lng: 77.2090,
    addressName: '',
    riskScore: 75,
    description: '',
  });

  const defaultCenter: [number, number] = [
    selectedLocation?.lat ?? 28.6139,
    selectedLocation?.lng ?? 77.2090,
  ];

  // Helper for Category Color
  const getCategoryColor = (cat: PollutionCategory): string => {
    switch (cat) {
      case 'water': return '#0284c7';     // Cyan / Sky
      case 'air': return '#94a3b8';       // Slate / Smoke
      case 'plastic': return '#ea580c';   // Orange
      case 'soil': return '#d97706';      // Amber
      case 'noise': return '#a855f7';     // Purple
      case 'thermal': return '#ef4444';   // Red
      case 'radioactive': return '#eab308'; // Toxic Yellow
      case 'light': return '#f43f5e';     // Rose
      case 'visual': return '#14b8a6';    // Teal
      default: return '#10b981';
    }
  };

  // Helper for Risk Level Color
  const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'moderate': return '#eab308';
      case 'low': return '#10b981';
    }
  };

  // Helper for Task Priority Color
  const getTaskPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
      });

      // Free OpenStreetMap tile layer with attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | EcoShield AI',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      // Handle map clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        const coords: Coordinates = {
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
          addressName: `Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`,
        };

        setManualLat(coords.lat.toFixed(4));
        setManualLng(coords.lng.toFixed(4));
        setCoordError('');

        if (onSelectLocation) {
          onSelectLocation(coords);
        }
        if (onMapClickCoordinates) {
          onMapClickCoordinates(coords);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when selectedLocation changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    const val = validateCoordinates(selectedLocation);
    if (!val.valid) return;

    mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 13);

    // Update or create selected location marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
    } else {
      const marker = L.circleMarker([selectedLocation.lat, selectedLocation.lng], {
        radius: 8,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 180px;">
          <div style="font-weight: 700; color: #60a5fa; font-size: 12px; margin-bottom: 2px;">
            📍 Active Selected Location
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">
            Lat: ${selectedLocation.lat.toFixed(4)}, Lng: ${selectedLocation.lng.toFixed(4)}
          </div>
          <div style="font-size: 10px; color: #cbd5e1; margin-top: 4px;">
            Live weather & risk analysis active for this coordinate.
          </div>
        </div>
      `);
      userMarkerRef.current = marker;
    }
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  // Request browser geolocation with explicit user consent
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      setGeoMessage('Geolocation is not supported by your current browser.');
      return;
    }

    setGeoStatus('requesting');
    setGeoMessage('Requesting GPS coordinate access...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setGeoStatus('granted');
        setGeoMessage(`Location locked (±${Math.round(pos.coords.accuracy)}m accuracy).`);

        const coords: Coordinates = {
          lat: userLat,
          lng: userLng,
          addressName: `Consented GPS Location (±${Math.round(pos.coords.accuracy)}m)`,
        };

        setManualLat(userLat.toFixed(4));
        setManualLng(userLng.toFixed(4));
        setCoordError('');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 14, { duration: 1.5 });
        }

        if (onSelectLocation) {
          onSelectLocation(coords);
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setGeoStatus('denied');
        setGeoMessage('Location permission denied or unavailable. You can click on the map or type manual coordinates.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Jump to manual coordinates
  const handleJumpToManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    const val = validateCoordinates({ lat, lng });
    if (!val.valid) {
      setCoordError(val.reason || 'Invalid coordinates.');
      return;
    }

    setCoordError('');
    const coords: Coordinates = {
      lat,
      lng,
      addressName: `Manual Input: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.2 });
    }

    if (onSelectLocation) {
      onSelectLocation(coords);
    }
  };

  // Select quick preset city
  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    setManualLat(preset.lat.toFixed(4));
    setManualLng(preset.lng.toFixed(4));
    setCoordError('');

    const coords: Coordinates = {
      lat: preset.lat,
      lng: preset.lng,
      addressName: preset.name,
    };

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 13, { duration: 1.2 });
    }

    if (onSelectLocation) {
      onSelectLocation(coords);
    }
  };

  // Render Markers when data or filters change
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // 1. RENDER HOTSPOTS
    if (entityFilter === 'all' || entityFilter === 'hotspots') {
      hotspots.forEach((spot) => {
        if (!spot.coordinates || isNaN(spot.coordinates.lat) || isNaN(spot.coordinates.lng)) return;
        if (selectedCategory !== 'all' && spot.category !== selectedCategory) return;
        if (selectedRisk !== 'all' && spot.currentRiskLevel !== selectedRisk) return;

        const riskColor = getRiskColor(spot.currentRiskLevel);
        const catColor = getCategoryColor(spot.category);

        const hotspotIcon = L.divIcon({
          className: 'custom-hotspot-pin',
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background-color: ${riskColor}; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background-color: ${riskColor}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                <span style="color: white; font-size: 10px; font-weight: 800; font-family: monospace;">${spot.currentRiskScore}</span>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], { icon: hotspotIcon });

        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; min-width: 250px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; background: ${riskColor}25; color: ${riskColor}; border: 1px solid ${riskColor}50;">
                ${spot.currentRiskLevel.toUpperCase()} RISK (${spot.currentRiskScore}/100)
              </span>
              <span style="font-size: 10px; color: ${catColor}; font-weight: 700; text-transform: uppercase;">${spot.category}</span>
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 4px 0;">${spot.name}</h4>
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.4;">${spot.description}</p>
            <div style="font-size: 10px; background: #060e09; border-radius: 6px; padding: 6px; border: 1px solid rgba(16, 185, 129, 0.2); margin-bottom: 8px;">
              <strong style="color: #6ee7b7; display: block; margin-bottom: 2px;">Primary Recommendation:</strong>
              <p style="margin: 0; color: #cbd5e1;">${spot.recommendedActions[0] || 'Continuous inspection mandated'}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; pt: 4px; border-top: 1px solid rgba(255,255,255,0.06);">
              <span>Reports: ${spot.activeReportsCount}</span>
              <span style="color: #38bdf8; font-weight: 600;">Status: ${spot.status.replace('_', ' ')}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          if (onSelectHotspot) onSelectHotspot(spot);
          if (onSelectLocation) onSelectLocation(spot.coordinates);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 2. RENDER POLLUTION REPORTS
    if (entityFilter === 'all' || entityFilter === 'reports') {
      reports.forEach((rep) => {
        if (!rep.location || isNaN(rep.location.lat) || isNaN(rep.location.lng)) return;
        if (selectedCategory !== 'all' && rep.category !== selectedCategory) return;

        // Provenance filtering
        const isDemo = Boolean(rep.isDemo);
        if (provenanceFilter === 'real_only' && isDemo) return;
        if (provenanceFilter === 'demo_only' && !isDemo) return;

        // Risk filtering based on severity
        if (selectedRisk !== 'all') {
          if (selectedRisk === 'critical' && rep.severity < 5) return;
          if (selectedRisk === 'high' && rep.severity !== 4) return;
          if (selectedRisk === 'moderate' && rep.severity !== 3) return;
          if (selectedRisk === 'low' && rep.severity > 2) return;
        }

        const catColor = getCategoryColor(rep.category);
        const isVerified = rep.status === 'verified' || rep.status === 'action_assigned' || rep.status === 'action_taken' || rep.status === 'resolved';

        // Pin styling: Cyan/Emerald border for real user report, dashed amber for demo
        const borderStyle = isDemo ? 'border: 2px dashed #f59e0b;' : 'border: 2px solid #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);';

        const reportIcon = L.divIcon({
          className: 'custom-report-pin',
          html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="width: 24px; height: 24px; border-radius: 6px; background-color: ${catColor}; ${borderStyle} display: flex; align-items: center; justify-content: center; transform: rotate(45deg);">
                <div style="transform: rotate(-45deg); color: white; font-size: 11px; font-weight: 800; font-family: monospace;">
                  ${rep.severity}
                </div>
              </div>
              ${isVerified ? `<div style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; background: #10b981; border: 1.5px solid #080d0a; border-radius: 50%;"></div>` : ''}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([rep.location.lat, rep.location.lng], { icon: reportIcon });

        const provenanceBadge = isDemo
          ? `<span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600;">[Demo Seed]</span>`
          : `<span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 600;">[Real User Report]</span>`;

        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; min-width: 250px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
              <span style="font-size: 10px; font-weight: 700; color: ${catColor}; text-transform: uppercase;">
                ${rep.category} • Severity ${rep.severity}/5
              </span>
              ${provenanceBadge}
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 4px 0;">${rep.title}</h4>
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0; line-height: 1.3;">${rep.description.slice(0, 110)}...</p>
            <div style="font-size: 10px; color: #cbd5e1; margin-bottom: 6px; font-family: monospace;">
              📍 ${rep.location.addressName || `Lat: ${rep.location.lat}, Lng: ${rep.location.lng}`}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06);">
              <span>${rep.isAnonymous ? 'Anonymous Citizen' : rep.reporterName}</span>
              <span style="font-weight: 600; color: #a7f3d0;">${rep.status.replace('_', ' ')}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          if (onSelectReport) onSelectReport(rep);
          if (onSelectLocation) onSelectLocation(rep.location);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // 3. RENDER PREVENTION TASKS
    if (entityFilter === 'all' || entityFilter === 'tasks') {
      tasks.forEach((tsk) => {
        if (!tsk.location || isNaN(tsk.location.lat) || isNaN(tsk.location.lng)) return;
        if (selectedCategory !== 'all' && tsk.category !== selectedCategory) return;
        if (selectedRisk !== 'all' && tsk.riskLevel !== selectedRisk) return;

        // Provenance filtering
        const isDemo = Boolean(tsk.isDemo);
        if (provenanceFilter === 'real_only' && isDemo) return;
        if (provenanceFilter === 'demo_only' && !isDemo) return;

        const priorityColor = getTaskPriorityColor(tsk.priority);
        const taskBorder = isDemo ? 'border: 2px dashed #f59e0b;' : 'border: 2px solid #38bdf8; box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);';

        const taskIcon = L.divIcon({
          className: 'custom-task-pin',
          html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="width: 26px; height: 26px; border-radius: 8px; background-color: #0b140f; ${taskBorder} display: flex; align-items: center; justify-content: center;">
                <svg style="width: 14px; height: 14px; color: ${priorityColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div style="position: absolute; bottom: -2px; right: -2px; width: 9px; height: 9px; border-radius: 50%; background-color: ${priorityColor}; border: 1.5px solid #080d0a;"></div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([tsk.location.lat, tsk.location.lng], { icon: taskIcon });

        const taskProvenance = isDemo
          ? `<span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600;">[Demo Task]</span>`
          : `<span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 600;">[Real Task]</span>`;

        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; min-width: 250px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
              <span style="font-size: 10px; font-weight: 700; color: ${priorityColor}; text-transform: uppercase;">
                ${tsk.priority} Priority Task
              </span>
              ${taskProvenance}
            </div>
            <h4 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 4px 0;">${tsk.title}</h4>
            <div style="font-size: 10px; font-family: monospace; color: #94a3b8; margin-bottom: 6px;">
              ID: ${tsk.id} • Status: <strong style="color: #6ee7b7;">${tsk.status.replace('_', ' ')}</strong>
            </div>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 8px 0; line-height: 1.3;">${tsk.description.slice(0, 110)}...</p>
            <div style="font-size: 10px; color: #94a3b8; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between;">
              <span>Worker: ${tsk.assignedTo?.name || 'Unassigned'}</span>
              <span>Score: ${tsk.riskScore}/100</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          if (onSelectTask) onSelectTask(tsk);
          if (onSelectLocation) onSelectLocation(tsk.location);
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [reports, tasks, hotspots, entityFilter, selectedCategory, selectedRisk, provenanceFilter]);

  // Handle hotspot creation submission
  const handleCreateHotspot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddNewHotspot) return;

    let level: RiskLevel = 'low';
    if (hotspotForm.riskScore >= 75) level = 'critical';
    else if (hotspotForm.riskScore >= 50) level = 'high';
    else if (hotspotForm.riskScore >= 25) level = 'moderate';

    onAddNewHotspot({
      name: hotspotForm.name,
      category: hotspotForm.category,
      coordinates: {
        lat: Number(hotspotForm.lat),
        lng: Number(hotspotForm.lng),
        addressName: hotspotForm.addressName || 'Custom Hotspot Zone',
      },
      currentRiskScore: hotspotForm.riskScore,
      currentRiskLevel: level,
      activeReportsCount: 0,
      description: hotspotForm.description,
      lastInspectedAt: new Date().toISOString(),
      status: 'active_monitoring',
      recommendedActions: [
        'Establish automated boundary inspection schedule',
        'Verify runoff containment barriers before rain peak',
      ],
    });

    setShowHotspotModal(false);
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-emerald-950/70 bg-[#080d0a] shadow-elevated flex flex-col text-slate-200`}>
      {/* Top Filter and Geolocation Controls Bar */}
      <div className="bg-[#0b140f] border-b border-emerald-950/60 p-3 z-10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Entity Type Filter */}
          <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-2.5 py-1.5 text-slate-200">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={entityFilter}
              onChange={(e: any) => setEntityFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b140f] text-slate-200">All Entities</option>
              <option value="reports" className="bg-[#0b140f] text-slate-200">Citizen Reports Only</option>
              <option value="tasks" className="bg-[#0b140f] text-slate-200">Prevention Tasks Only</option>
              <option value="hotspots" className="bg-[#0b140f] text-slate-200">Hotspots Only</option>
            </select>
          </div>

          {/* Pollution Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-2.5 py-1.5 text-slate-200">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b140f] text-slate-200">All 9 Pollution Domains</option>
              <option value="plastic" className="bg-[#0b140f] text-slate-200">Plastic & Waste</option>
              <option value="water" className="bg-[#0b140f] text-slate-200">Water Contamination</option>
              <option value="air" className="bg-[#0b140f] text-slate-200">Air Pollution</option>
              <option value="soil" className="bg-[#0b140f] text-slate-200">Soil & Land</option>
              <option value="noise" className="bg-[#0b140f] text-slate-200">Noise Decibels</option>
              <option value="thermal" className="bg-[#0b140f] text-slate-200">Thermal Shock</option>
              <option value="light" className="bg-[#0b140f] text-slate-200">Light Pollution</option>
              <option value="radioactive" className="bg-[#0b140f] text-slate-200">Radioactive Hazard</option>
              <option value="visual" className="bg-[#0b140f] text-slate-200">Visual Blight</option>
            </select>
          </div>

          {/* Risk/Priority Filter */}
          <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-2.5 py-1.5 text-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b140f] text-slate-200">All Risk Tiers</option>
              <option value="critical" className="bg-[#0b140f] text-red-400 font-semibold">Critical Risk (75-100)</option>
              <option value="high" className="bg-[#0b140f] text-orange-400">High Risk (50-74)</option>
              <option value="moderate" className="bg-[#0b140f] text-amber-400">Moderate Risk (25-49)</option>
              <option value="low" className="bg-[#0b140f] text-emerald-400">Low Risk (0-24)</option>
            </select>
          </div>

          {/* Provenance Filter (Real vs Demo Seed) */}
          <div className="flex items-center gap-1.5 bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-2.5 py-1.5 text-slate-200">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={provenanceFilter}
              onChange={(e: any) => setProvenanceFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0b140f] text-slate-200">Data Origin: All</option>
              <option value="real_only" className="bg-[#0b140f] text-emerald-400 font-semibold">Real User Data Only</option>
              <option value="demo_only" className="bg-[#0b140f] text-amber-400">Demo Seed Data Only</option>
            </select>
          </div>
        </div>

        {/* Right Action Controls: Use My Location & Legend Toggle */}
        <div className="flex items-center gap-2">
          {/* Explicit "Use My Location" GPS Button */}
          <button
            onClick={handleRequestLocation}
            disabled={geoStatus === 'requesting'}
            className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl font-medium transition-colors shadow-xs"
            title="Request GPS browser permission to pin your current position"
          >
            <Navigation className={`w-3.5 h-3.5 ${geoStatus === 'requesting' ? 'animate-spin text-blue-400' : ''}`} />
            <span>{geoStatus === 'granted' ? 'Location Locked' : 'Use My Location'}</span>
          </button>

          {/* Toggle Legend Button */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 bg-[#0e1a13] hover:bg-[#13281c] text-slate-300 border border-emerald-950/80 px-2.5 py-1.5 rounded-xl font-medium transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Legend</span>
          </button>

          {/* Add Hotspot (for Admin/Field Worker) */}
          {(userRole === 'admin' || userRole === 'field_worker') && (
            <button
              onClick={() => setShowHotspotModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-medium shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Hotspot</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual Coordinates Input & Quick Preset Cities Bar */}
      <div className="bg-[#08120c] border-b border-emerald-950/60 px-3 py-2 z-10 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Manual Lat/Lng Form */}
        <form onSubmit={handleJumpToManualCoords} className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Search className="w-3 h-3 text-emerald-400" />
            <span>Jump Coords:</span>
          </span>
          <input
            type="text"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            placeholder="Lat (e.g. 28.61)"
            className="w-24 bg-[#0e1a13] border border-emerald-950/80 rounded-lg px-2 py-1 text-slate-200 text-[11px] font-mono outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            placeholder="Lng (e.g. 77.20)"
            className="w-24 bg-[#0e1a13] border border-emerald-950/80 rounded-lg px-2 py-1 text-slate-200 text-[11px] font-mono outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-semibold transition-colors"
          >
            Locate
          </button>
          {coordError && <span className="text-red-400 text-[10px] ml-1">{coordError}</span>}
        </form>

        {/* Quick City Preset Jump Links */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-mono text-[10px] hidden md:inline">Presets:</span>
          {PRESET_LOCATIONS.map((preset) => {
            const isActive =
              selectedLocation &&
              Math.abs(selectedLocation.lat - preset.lat) < 0.05 &&
              Math.abs(selectedLocation.lng - preset.lng) < 0.05;
            return (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-emerald-600/25 border-emerald-500/70 text-emerald-300 font-semibold shadow-xs'
                    : 'bg-[#0e1a13] hover:bg-[#13281c] border-emerald-950/80 text-slate-300 hover:text-emerald-300'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Geolocation status notification banner */}
      {geoMessage && (
        <div
          className={`px-3 py-1.5 text-xs flex items-center justify-between z-10 ${
            geoStatus === 'granted'
              ? 'bg-blue-950/40 text-blue-300 border-b border-blue-900/50'
              : 'bg-amber-950/40 text-amber-300 border-b border-amber-900/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{geoMessage}</span>
          </div>
          <button onClick={() => setGeoMessage('')} className="text-slate-400 hover:text-slate-200 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* The Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* Floating Map Legend & Attribution Box */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-10 bg-[#0b140f]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-950/80 p-3.5 text-xs max-w-sm pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Map Legend & Data Origin</span>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 bg-emerald-500 border border-emerald-300 inline-block"></span>
              <span>Real User Report (1-5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 bg-amber-500 border border-dashed border-amber-300 inline-block"></span>
              <span>Demo Seed Report</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-500 border border-sky-300 inline-block"></span>
              <span>Prevention Task Pin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping"></span>
              <span>Monitored Hotspot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Selected Coordinates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Verified Status Dot</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-emerald-950/60 text-[10px] text-slate-400 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span>Tiles: <strong className="text-slate-300">OpenStreetMap Free (ODbL)</strong></span>
              <span className="text-emerald-400 font-mono">₹0 Budget</span>
            </div>
            <p className="text-[9px] text-slate-500 leading-tight">
              Markers represent community observations and prevention dispatch tasks; not laboratory chemical sensor probes.
            </p>
          </div>
        </div>
      )}

      {/* Add Hotspot Modal (for Admins / Field Workers) */}
      {showHotspotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b140f] rounded-2xl shadow-2xl max-w-md w-full p-5 border border-emerald-950/80 text-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-950/60 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Define Environmental Hotspot Boundary</span>
              </h3>
              <button
                onClick={() => setShowHotspotModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHotspot} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Hotspot Name
                </label>
                <input
                  type="text"
                  required
                  value={hotspotForm.name}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, name: e.target.value })}
                  placeholder="e.g. Industrial Storm Drain Outfall #3"
                  className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Pollution Domain
                  </label>
                  <select
                    value={hotspotForm.category}
                    onChange={(e: any) => setHotspotForm({ ...hotspotForm, category: e.target.value })}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="plastic">Plastic Waste</option>
                    <option value="water">Water Pollution</option>
                    <option value="air">Air Contamination</option>
                    <option value="soil">Soil Pollution</option>
                    <option value="noise">Noise Decibels</option>
                    <option value="thermal">Thermal Effluent</option>
                    <option value="light">Light Pollution</option>
                    <option value="radioactive">Radioactive</option>
                    <option value="visual">Visual Blight</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Baseline Risk Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={hotspotForm.riskScore}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, riskScore: Number(e.target.value) })}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hotspotForm.lat}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, lat: parseFloat(e.target.value) })}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hotspotForm.lng}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, lng: parseFloat(e.target.value) })}
                    className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Location Landmark / Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={hotspotForm.description}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, description: e.target.value })}
                  placeholder="Identify key vulnerable assets, runoff channels, or nearby populations..."
                  className="w-full bg-[#0e1a13] border border-emerald-950/80 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-950/60">
                <button
                  type="button"
                  onClick={() => setShowHotspotModal(false)}
                  className="px-3 py-2 bg-transparent hover:bg-[#0e1a13] text-slate-400 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Save Hotspot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
