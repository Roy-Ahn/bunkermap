"use client";

import { useState, useRef, useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import SceneErrorBoundary from "./SceneErrorBoundary";
import { supabase } from "@/lib/supabase";

const GLOBE_RADIUS = 3;
const GLOBAL_RADIUS = GLOBE_RADIUS;

// Convert lat/lng to Cartesian coordinates
const latLongToVector3 = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
};

interface Bunker {
    id: string;
    title: string;
    location: string;
    lat: number;
    lng: number;
    depth: string;
    capacity: string;
    description: string;
    image_url: string | null;
}

// Component for a single bunker marker
function BunkerMarker({ bunker, onClick }: { bunker: Bunker, onClick: (b: Bunker) => void }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const position = useMemo(() => latLongToVector3(bunker.lat, bunker.lng, GLOBE_RADIUS + 0.05), [bunker]);

    useFrame((state) => {
        if (meshRef.current) {
            // Subtle pulse for interactive dots
            const scale = 1 + Math.sin(state.clock.elapsedTime * 4 + position.x) * 0.1;
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <mesh position={position} ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(bunker); }}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color="#000000" />
        </mesh>
    );
}

// Controller to handle camera movement when a bunker is selected
function CameraController({ targetPosition, isActive }: { targetPosition: THREE.Vector3 | null, isActive: boolean }) {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const vec = new THREE.Vector3();

    useFrame((state) => {
        if (isActive && targetPosition && controlsRef.current) {
            vec.copy(targetPosition).normalize().multiplyScalar(GLOBAL_RADIUS + 2.5);
            state.camera.position.lerp(vec, 0.08);
            controlsRef.current.target.lerp(targetPosition, 0.08);
            controlsRef.current.update();
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={3.5}
            maxDistance={15}
            autoRotate={!isActive}
            autoRotateSpeed={0.3}
        />
    );
}

interface GeoJSONFeature {
    geometry: {
        type: string;
        coordinates: number[][][] | number[][][][]; // Polygon or MultiPolygon
    };
}

interface GeoJSONData {
    features: GeoJSONFeature[];
}

function GlobeModel({ bunkers, onSelect }: { bunkers: Bunker[], onSelect: (b: Bunker) => void }) {
    const [worldData, setWorldData] = useState<GeoJSONData | null>(null);
    const earthTexture = useTexture("https://unpkg.com/three-globe/example/img/earth-topology.png");

    useEffect(() => {
        // Fetch stable low-res world borders for outlines
        fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
            .then(res => res.json())
            .then(setWorldData)
            .catch(err => console.error("GeoJSON load failed:", err));
    }, []);


    const borderLines = useMemo(() => {
        if (!worldData) return [];
        const lines: THREE.Vector3[][] = [];

        worldData.features.forEach((feature: GeoJSONFeature) => {
            const { type, coordinates } = feature.geometry;
            if (type === "Polygon") {
                const polyCoords = coordinates as number[][][];
                polyCoords.forEach((coords: number[][]) => {
                    lines.push(coords.map((c: number[]) => latLongToVector3(c[1], c[0], GLOBE_RADIUS + 0.01)));
                });
            } else if (type === "MultiPolygon") {
                const multiPolyCoords = coordinates as number[][][][];
                multiPolyCoords.forEach((polygon: number[][][]) => {
                    polygon.forEach((coords: number[][]) => {
                        lines.push(coords.map((c: number[]) => latLongToVector3(c[1], c[0], GLOBE_RADIUS + 0.01)));
                    });
                });
            }
        });
        return lines;
    }, [worldData]);

    return (
        <group>
            {/* Base White Sphere */}
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS - 0.01, 64, 64]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Continent Overlay (Subtle Grayscale for context) */}
            <mesh>
                <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
                <meshStandardMaterial
                    color="#000000"
                    alphaMap={earthTexture}
                    transparent={true}
                    opacity={0.06}
                    roughness={1}
                />
            </mesh>

            {/* World Border Outlines (Vector Lines) */}
            {borderLines.map((line, i) => (
                <line key={i}>
                    <bufferGeometry attach="geometry" onUpdate={self => self.setFromPoints(line)} />
                    <lineBasicMaterial attach="material" color="#000000" linewidth={1} transparent opacity={0.3} />
                </line>
            ))}

            {/* Render Bunkers as Distinct Black Dots */}
            {bunkers.map((bunker) => (
                <BunkerMarker
                    key={bunker.id}
                    bunker={bunker}
                    onClick={onSelect}
                />
            ))}
        </group>
    );
}



export default function Scene({ selectedBunker, onSelectBunker }: { selectedBunker: Bunker | null; onSelectBunker: (b: Bunker | null) => void; }) {
    const [bunkersData, setBunkersData] = useState<Bunker[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImageEnlarged, setIsImageEnlarged] = useState(false);

    useEffect(() => {
        setIsImageEnlarged(false);
    }, [selectedBunker]);

    useEffect(() => {
        const fetchBunkers = async () => {
            try {
                const { data, error } = await supabase.from('bunkers').select('*');
                if (!error && data) setBunkersData(data as Bunker[]);
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBunkers();
    }, []);

    const targetPos = useMemo(() => {
        if (!selectedBunker) return null;
        return latLongToVector3(selectedBunker.lat, selectedBunker.lng, GLOBE_RADIUS);
    }, [selectedBunker]);

    if (loading) {
        return (
            <div className="absolute inset-0 w-full h-full bg-white flex items-center justify-center font-sans">
                <div className="text-black font-bold text-xs uppercase tracking-[0.3em] animate-pulse">
                    ARCHIVE_CONNECTING
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full bg-white font-sans overflow-hidden">
            {/* Image Modal Overlay */}
            {isImageEnlarged && selectedBunker?.image_url && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8 cursor-pointer animate-in fade-in duration-300"
                    onClick={() => setIsImageEnlarged(false)}
                >
                    <div className="relative w-full max-w-6xl max-h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={selectedBunker.image_url}
                            alt={selectedBunker.title}
                            className="max-w-full max-h-[90vh] object-contain rounded-sm"
                        />
                        <button
                            className="absolute -top-12 right-0 md:top-0 md:-right-12 text-white hover:text-gray-300 transition-colors p-2 hidden md:block"
                            onClick={() => setIsImageEnlarged(false)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Intel Report Side Panel */}
            {selectedBunker && (
                <div className="absolute top-0 right-0 w-96 h-full bg-white/95 backdrop-blur-xl border-l border-gray-100 p-10 z-20 flex flex-col gap-8 shadow-2xl transform transition-all duration-500 ease-out animate-in slide-in-from-right">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-black text-black uppercase tracking-tighter leading-none mb-2">{selectedBunker.title}</h2>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">FILE: {selectedBunker.id.slice(0, 12)}</p>
                        </div>
                        <button
                            onClick={() => onSelectBunker(null)}
                            className="text-gray-300 hover:text-black transition-colors p-1"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {selectedBunker.image_url ? (
                            <div
                                className="relative group overflow-hidden bg-gray-50 rounded-sm aspect-video cursor-pointer"
                                onClick={() => setIsImageEnlarged(true)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={selectedBunker.image_url}
                                    alt={selectedBunker.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                                </div>
                            </div>
                        ) : (
                            <div className="relative overflow-hidden bg-gray-50 flex flex-col items-center justify-center rounded-sm aspect-video border border-dashed border-gray-200">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-3"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold">NO VISUAL INTEL</span>
                                <span className="text-[8px] uppercase tracking-widest text-gray-300 mt-1 font-mono">RESTRICTED DATASTREAM</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Location</h4>
                                <p className="text-xs uppercase tracking-wider text-black font-medium">{selectedBunker.location}</p>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Coordinates</h4>
                                <p className="text-xs font-mono text-black">{selectedBunker.lat?.toFixed(4)}N, {selectedBunker.lng?.toFixed(4)}E</p>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Depth</h4>
                                <p className="text-xs text-black">{selectedBunker.depth || "N/A"}</p>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Capacity</h4>
                                <p className="text-xs text-black font-medium">{selectedBunker.capacity || "N/A"}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Geopolitical Summary</h4>
                            <p className="text-xs text-gray-600 leading-relaxed text-justify">
                                {selectedBunker.description}
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between opacity-30">
                        <span className="text-[8px] font-mono tracking-widest uppercase">Geospatial_Node_ID: {selectedBunker.id.slice(0, 8)}</span>
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                    </div>
                </div>
            )}

            <SceneErrorBoundary>
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
                    <color attach="background" args={["#ffffff"]} />
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={2.5} color="#ffffff" />

                    <CameraController targetPosition={targetPos} isActive={!!selectedBunker} />

                    <Suspense fallback={null}>
                        <GlobeModel bunkers={bunkersData} onSelect={onSelectBunker} />
                    </Suspense>
                </Canvas>
            </SceneErrorBoundary>
        </div>
    );
}
