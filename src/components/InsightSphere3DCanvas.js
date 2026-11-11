import React, { useEffect, useRef } from "react";

export default function InsightSphere3DCanvas({ 
  nodeCount = 65, 
  radius = 160, 
  interactive = true, 
  accentColor = "#FF0000",
  secondaryColor = "#3ea6ff",
  height = "320px" 
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth || 500);
    let heightPx = (canvas.height = canvas.parentElement.offsetHeight || 320);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth || 500;
      heightPx = canvas.height = canvas.parentElement.offsetHeight || 320;
    };
    window.addEventListener("resize", handleResize);

    // Generate 3D sphere points (Fibonacci sphere algorithm)
    const points = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      points.push({
        origX: x * radius,
        origY: y * radius,
        origZ: z * radius,
        x: x * radius,
        y: y * radius,
        z: z * radius,
        color: i % 4 === 0 ? accentColor : i % 5 === 0 ? secondaryColor : "#ffffff",
        size: i % 4 === 0 ? 3.5 : 2.2,
      });
    }

    let rotationX = 0;
    let rotationY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let autoRotSpeedY = 0.0035;
    let autoRotSpeedX = 0.0018;

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - width / 2;
      const mouseY = e.clientY - rect.top - heightPx / 2;
      targetRotY = (mouseX / width) * 0.8;
      targetRotX = -(mouseY / heightPx) * 0.8;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    const focalLength = 380;
    const centerX = width / 2;
    const centerY = heightPx / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, heightPx);

      // Smooth dampening towards target rotation
      rotationX += (targetRotX - rotationX) * 0.05 + autoRotSpeedX;
      rotationY += (targetRotY - rotationY) * 0.05 + autoRotSpeedY;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Projected points
      const projected = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Rotate Y
        let x1 = p.origX * cosY - p.origZ * sinY;
        let z1 = p.origZ * cosY + p.origX * sinY;

        // Rotate X
        let y1 = p.origY * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.origY * sinX;

        // Perspective projection
        const scale = focalLength / (focalLength + z2 + radius * 1.2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y1 * scale;
        const alpha = Math.max(0.15, Math.min(1, (z2 + radius) / (2 * radius)));

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          scale,
          alpha,
          color: p.color,
          size: p.size * scale,
        });
      }

      // Draw connecting lines between close points in 3D
      ctx.lineWidth = 0.75;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect if within visual distance
          if (dist < 65) {
            const lineAlpha = (1 - dist / 65) * Math.min(p1.alpha, p2.alpha) * 0.45;
            ctx.strokeStyle = `rgba(255, 0, 0, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Sort points by z for proper depth rendering
      projected.sort((a, b) => a.z - b.z);

      // Draw glowing nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];

        // Glow ring for prominent nodes
        if (p.color === accentColor) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 0, 0, ${p.alpha * 0.25})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [nodeCount, radius, interactive, accentColor, secondaryColor]);

  return (
    <div style={{ position: "relative", width: "100%", height, overflow: "hidden", pointerEvents: "none" }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
