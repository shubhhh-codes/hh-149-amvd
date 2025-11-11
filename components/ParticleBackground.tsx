import { useCallback } from 'react';
import { Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions: ISourceOptions = {
    fullScreen: {
      enable: false,
      zIndex: 0
    },
    particles: {
      number: { value: 30 },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: {
        value: 0.3,
        animation: {
          enable: true,
          speed: 0.5
        }
      },
      size: {
        value: 3,
        animation: {
          enable: true,
          speed: 0.5
        }
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "out"
        }
      }
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse"
        },
        resize: { enable: true }
      }
    },
    detectRetina: true
  };

  return (
    <Particles
      id="tsparticles"
      options={particlesOptions}
      //init={particlesInit}
    />
  );
}