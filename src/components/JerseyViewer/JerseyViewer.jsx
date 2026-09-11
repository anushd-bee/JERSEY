import React, { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import styles from './JerseyViewer.module.css';

// Fallback utility to draw a jersey texture on a canvas
function createJerseyCanvasTexture(color, text, number) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 512);

    // Draw some jersey-like shapes (chest chevron/stripes)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(256, 250);
    ctx.lineTo(512, 150);
    ctx.lineTo(512, 200);
    ctx.lineTo(256, 300);
    ctx.lineTo(0, 200);
    ctx.fill();

    // Draw text (Player Name)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    if (text) {
        ctx.fillText(text.toUpperCase().substring(0, 12), 256, 180);
    }

    // Draw number
    ctx.font = 'bold 180px sans-serif';
    if (number) {
        ctx.fillText(number, 256, 340);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

function JerseyMesh({ frontImg, backImg, fallbackColor, fallbackName, fallbackNumber }) {
    // If real images exist, attempt to load them. Otherwise, generate canvas textures.
    // Drei's useTexture requires paths. If we don't have images, we skip useTexture.

    const hasPhotos = !!frontImg;

    // Attempt to load textures if images are provided.
    // If only one image is available, use it for both front and back.
    const texturePaths = hasPhotos ? [frontImg, backImg || frontImg] : null;
    const loadedTextures = texturePaths ? useTexture(texturePaths) : null;

    const [mapFront, mapBack] = hasPhotos ? loadedTextures : [null, null];

    // Fallback Canvas Textures
    const fallbackTexture = useMemo(() => {
        if (hasPhotos) return null;
        return createJerseyCanvasTexture(fallbackColor, fallbackName, fallbackNumber);
    }, [fallbackColor, fallbackName, fallbackNumber, hasPhotos]);

    // Box geometries have 6 faces. We map textures to the front and back differently.
    // Faces: right, left, top, bottom, front, back
    const materials = useMemo(() => {
        const createMat = (map, baseColor = '#ffffff') => new THREE.MeshStandardMaterial({
            map: map || fallbackTexture,
            color: (map || hasPhotos) ? '#ffffff' : '#ffffff', // No tinting on real photos
            roughness: 0.6,
            metalness: 0.1
        });

        // Edge materials (sides, top, bottom) get a flat color (either derived from fallback or solid dark)
        const edgeColor = hasPhotos ? '#333333' : fallbackColor;
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: edgeColor,
            roughness: 0.8,
        });

        return [
            edgeMaterial, // Right
            edgeMaterial, // Left
            edgeMaterial, // Top
            edgeMaterial, // Bottom
            createMat(mapFront), // Front (index 4)
            createMat(mapBack)   // Back (index 5)
        ];
    }, [mapFront, mapBack, fallbackTexture, fallbackColor, hasPhotos]);

    // Use a slight sine-wave bobbing effect for extra premium feel when idle
    const groupRef = useRef();
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Box dimensions roughly matching a torso aspect ratio */}
            <mesh material={materials} castShadow>
                <boxGeometry args={[2.2, 3.0, 0.4]} />
            </mesh>
        </group>
    );
}

export default function JerseyViewer({ product }) {
    const [isIdle, setIsIdle] = useState(true);
    const timeoutRef = useRef(null);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Derived states
    // In our schema, we have `images` (array) and `image` (string fallback).
    const imagesArray = Array.isArray(product?.images) ? product.images : [];
    const mainImg = product?.image || imagesArray[0];
    const secondaryImg = imagesArray[1] || mainImg;

    // We'll mock variants (colors) since Supabase schema didn't natively have kit colors
    // In a real scenario, this could come from product.variants or product.attributes
    const variants = [
        { label: 'Home', color: '#B31B1B' },     // Crimson / Red
        { label: 'Away', color: '#1B4D3E' },     // Forest Green
        { label: 'Third', color: '#111111' },    // Black
    ];

    const [activeVariant, setActiveVariant] = useState(variants[0]);

    // Parse name and number for fallback
    // e.g. short name from product title
    const fallbackName = typeof product?.name === 'string'
        ? product.name.split(' ')[0]
        : 'JERSEY';
    const fallbackNumber = '10';

    const handleInteractStart = () => {
        setIsIdle(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleInteractEnd = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsIdle(true);
        }, 1200);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Since we don't have separate front/back photos guaranteed, we toggle behavior
    // If no real mainImg, we use the fallback canvas mode. 
    // Usually e-commerce has real images, but some might be empty if we want to rely entirely on 3D.
    const useRealImages = !!mainImg;

    return (
        <div className={styles.container}>
            <div className={styles.canvasWrapper}>
                <Suspense fallback={
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner} />
                    </div>
                }>
                    <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} shadows dpr={[1, 2]}>
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize={1024} />
                        <Environment preset="city" />

                        <JerseyMesh
                            frontImg={mainImg}
                            backImg={secondaryImg}
                            fallbackColor={activeVariant.color}
                            fallbackName={fallbackName}
                            fallbackNumber={fallbackNumber}
                        />

                        {/* Shadows for grounded, premium feel */}
                        <ContactShadows position={[0, -1.8, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />

                        <OrbitControls
                            enableZoom={false}
                            enablePan={false}
                            enableDamping={!prefersReducedMotion}
                            dampingFactor={0.05}
                            minPolarAngle={Math.PI / 3}
                            maxPolarAngle={Math.PI / 1.5}
                            autoRotate={isIdle && !prefersReducedMotion}
                            autoRotateSpeed={3.0}
                            onStart={handleInteractStart}
                            onEnd={handleInteractEnd}
                        />
                    </Canvas>
                </Suspense>
            </div>

            {/* Fallback Badge Indicator */}
            {!useRealImages && (
                <div className={styles.fallbackBadge}>3D Configurator</div>
            )}

            {/* Kit color swatches */}
            <div className={styles.controls}>
                {variants.map((variant) => (
                    <button
                        key={variant.label}
                        className={`${styles.swatch} ${activeVariant.label === variant.label ? styles.active : ''}`}
                        style={{ backgroundColor: variant.color }}
                        onClick={() => setActiveVariant(variant)}
                        aria-label={`Select ${variant.label} variant`}
                        title={variant.label}
                    />
                ))}
            </div>
        </div>
    );
}
