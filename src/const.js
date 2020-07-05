export const MAX_PARTS = 64;

export const config = {
  physics: { jointStiffness: 0.5, landDensity: 0.1 },
  wheel: {
    density: 0.0005,
    friction: 0.8,

    appliedTorque: 0.2,
    maxSpeed: 0.15,
  },
  line: {
    density: 0.001,
  },
  thruster: {
    thrustForce: 0.008,
  },
};
