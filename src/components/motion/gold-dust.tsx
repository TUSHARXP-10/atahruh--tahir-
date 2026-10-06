"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number; ph: number };

/**
 * Drifting gold dust with soft glow — a lightweight 2D canvas (no WebGL).
 * Pauses off-screen and when the tab is hidden; renders a still frame for reduced motion.
 */
export function GoldDust({ className, density = 0.00009, maxParticles = 140 }: { className?: string; density?: number; maxParticles?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const spawn = (anywhere: boolean): Particle => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.6 + 0.35,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(Math.random() * 0.28 + 0.06),
      a: Math.random() * 0.6 + 0.25,
      tw: Math.random() * 0.02 + 0.006,
      ph: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(maxParticles, Math.floor(w * h * density));
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        p.ph += p.tw;
        const alpha = p.a * (0.55 + 0.45 * Math.sin(p.ph));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(246, 226, 180, ${alpha})`);
        g.addColorStop(0.35, `rgba(214, 176, 98, ${alpha * 0.45})`);
        g.addColorStop(1, "rgba(201, 165, 92, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(p.ph * 0.5) * 0.08;
        p.y += p.vy;
        if (p.y < -12 || p.x < -12 || p.x > w + 12) particles[i] = spawn(false);
      }
      draw();
      raf = visible ? requestAnimationFrame(step) : 0;
    };

    resize();
    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(step);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(step);
    });
    io.observe(canvas);
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(step);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, maxParticles]);

  return <canvas ref={canvasRef} className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} aria-hidden />;
}
