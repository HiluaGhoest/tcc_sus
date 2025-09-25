import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";

// Simple parallax effect
function ParallaxImage({ src, alt }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrame;
    let lastX = 0, lastY = 0;

    const handlePointerMove = (e) => {
      lastX = (e.clientX / window.innerWidth - 0.5) * 20;
      lastY = (e.clientY / window.innerHeight - 0.5) * 20;
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(() => {
          setOffset({ x: lastX, y: lastY });
          animationFrame = null;
        });
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover absolute top-0 left-0"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    />
  );
}

function generateBlurSpots(count, radius) {
  const spots = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100; // % of width
    const y = Math.random() * 100; // % of height
    const size = Math.random() * radius + 100; // px radius
    const alpha = Math.random() * 0.3 + 0.1; // transparency
    const color = `rgba(255,255,255,${alpha})`; // white glow
    spots.push(`radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent ${size}px)`);
  }
  return spots.join(',');
}


export default function LandingPage() {
  const [view, setView] = useState(null);
  // Gerar blur spots uma vez ao montar
  const [blurSpots, setBlurSpots] = useState("");
  useEffect(() => {
    setBlurSpots(generateBlurSpots(8, 200));
  }, []);

  return (
    <div className="min-h-screen flex relative font-inter">
      {/* Left side - Rotating circular gradient */}
      <div className="w-1/2 relative flex flex-col justify-center items-center p-12 space-y-6 overflow-hidden">
        {/* Rotating gradient circle com blur spots */}
        <div
          className="absolute -bottom-[1000px] -right-[1000px] w-[2000px] h-[2000px] rounded-full gradient-circle animate-rotate"
          style={{
            background: `conic-gradient(
              from 0deg,
              #0a0a23,
              #3b82f6,
              #60a5fa,
              #0e2846ff,
              #0a0a23
            ), ${blurSpots}`,
          }}
        ></div>

        <h1 className="text-5xl font-bold text-white z-10">SisVida</h1>
        <p className="text-lg text-blue-100 text-center z-10">
          Agende, Consulte e Gerencie sua Saúde com Facilidade.
        </p>

        <div className="flex space-x-4 z-10">


          <button
            onClick={() => setView("login")}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:shadow-lg transition-transform duration-300"
          >
            Login
          </button>
          <button
            onClick={() => setView("register")}
            className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-900 hover:scale-105 hover:shadow-lg transition duration-300"
          >
            
            Register
          </button>

          
        </div>
      </div>

      {/* Right side - Parallax Image */}
      <div className="w-[65%] relative overflow-hidden h-screen">
        <div className="absolute inset-0 w-full h-full scale-110">
          <ParallaxImage src="images/landing_page.jpg" alt="Landing Illustration" />
        </div>
      </div>

      {/* Modal Overlay */}
      {view && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeInScale">
            <button
              onClick={() => setView(null)}
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-700 transition"
            >
              <span className="text-white text-xl font-bold">✕</span>
            </button>
            {view === "login" && <Login />}
            {view === "register" && <Register />}
          </div>
        </div>
      )}

      <style jsx>{`
        /* Rotating circular gradient */
        .gradient-circle {
            /* O gradiente base agora é sobrescrito pelo inline style */
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-rotate {
          animation: rotate 20s linear infinite;
        }

        /* Modal fade in */
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInScale {
          animation: fadeInScale 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}
