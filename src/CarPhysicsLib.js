// car-physics-lib-enhanced-EV.js
// Units:
// - mass: kg, distance: m, speed: m/s, force: N, torque: Nm, power: W, rpm, time: s

export class CarPhysicsLib {
  constructor(config = {}) {
    // Environment
    this.env = {
      airDensity: 1.225, // kg/m^3 at sea level
      gravity: 9.81,     // m/s^2
      ...config.env
    };

    // --- Configuration (Default: Sports Sedan, ICE) ---
    this.parts = {
      // Added Motor Type Switch
      motorType: config.motorType || 'ICE', // 'ICE' or 'EV'
      
      engine: { // Internal Combustion Engine (ICE)
        inertia: 0.3,
        maxRPM: 6500,
        torqueCurve: [[800, 120], [1500, 160], [3000, 190], [4500, 210], [5800, 195], [6500, 0]],
        throttleResponse: 0.25,
        fuelDensity: 750, // g/L
        avgBSFC_g_kWh: 250, 
        ...config.engine
      },

      electric: { // Electric Vehicle (EV) Motor & Battery
        inertia: 0.05, // Lower inertia
        maxRPM: 12000,
        maxTorqueNm: 350, // Constant torque up to baseRPM
        maxPowerKW: 150, // Max output power
        baseRPM: 4000, // RPM where maxPowerKW starts (Torque declines)
        efficiency: 0.92, // Motor efficiency
        regenEfficiency: 0.65, // Efficiency for converting kinetic energy back to battery
        batteryCapacityKWh: 60, // Total energy in battery (for state tracking)
        ...config.electric
      },

      gearbox: {
        ratios: [3.50, 2.10, 1.40, 1.00, 0.82], // ICE: 5-speed transmission
        ratiosEV: [8.5], // EV: Single-speed transmission
        finalDrive: 4.10,
        efficiency: 0.95,
        shiftUpRPM: 6200,
        shiftDownRPM: 1300,
        ...config.gearbox
      },

      wheel: {
        radius: 0.32,
        inertiaPerWheel: 1.2,
        count: 4,
        ...config.wheel
      },
      body: {
        mass: 1300, // Base mass (excluding fuel/battery)
        dragCoeff: 0.30,
        frontalArea: 2.1,
        wheelbase: 2.7,
        heightOfCG: 0.5,
        weightDistFront: 0.5,
        fuelMassKg: 50, // Added base fuel/battery mass
        ...config.body
      },
      tires: {
        mu: 1.0,
        driveAxle: 'RWD',
        ...config.tires
      },
      brakes: {
        maxTorqueNm: 3000,
        biasFront: 0.7,
        ...config.brakes
      }
    };

    // Dynamic state
    this.state = {
      velocity: 0,
      position: 0,
      rpm: (this.parts.motorType === 'EV') ? 0 : 1200, // Idle or 0
      gear: (this.parts.motorType === 'EV') ? 1 : 1, // Gear 1 (or single speed for EV)
      time: 0,
      fuelConsumedL: 0,
      batteryChargeKWh: this.parts.electric.batteryCapacityKWh * 0.9, // Start at 90%
      currentMass: this.parts.body.mass + this.parts.body.fuelMassKg,
    };
  }

  // --- Physics helpers (Motor Specific) ---

  // 1. EV Motor Torque Model (Constant Torque then Constant Power)
  getMotorTorqueEV(rpm, throttle) {
    const { maxTorqueNm, maxPowerKW, maxRPM, baseRPM, efficiency } = this.parts.electric;
    const omega = rpm * (2 * Math.PI / 60); // rad/s
    const P_max_W = maxPowerKW * 1000 * efficiency;
    const T_max_P = P_max_W / omega;

    let baseTorque;

    if (rpm < baseRPM) {
      // Constant Torque Region
      baseTorque = maxTorqueNm;
    } else if (rpm < maxRPM && omega > 0) {
      // Constant Power Region (Torque decreases)
      baseTorque = Math.min(maxTorqueNm, T_max_P);
    } else {
      baseTorque = 0;
    }
    
    // Apply throttle and clamp
    const torque = baseTorque * throttle;
    return Math.max(0, Math.min(torque, maxTorqueNm));
  }

  // 2. ICE Engine Torque Model (Unchanged)
  getMotorTorqueICE(rpm, throttle) {
    const curve = this.parts.engine.torqueCurve;
    const minRPM = curve[0][0], maxRPM = curve[curve.length - 1][0];
    const r = Math.max(minRPM, Math.min(rpm, maxRPM));

    let i = 1;
    while (i < curve.length && curve[i][0] < r) i++;
    const [r2, t2] = curve[i];
    const [r1, t1] = curve[i - 1];
    const alpha = (r - r1) / (r2 - r1);
    const baseTorque = t1 + alpha * (t2 - t1);

    const resp = this.parts.engine.throttleResponse;
    const shaped = Math.pow(throttle, 1 - resp);
    return baseTorque * shaped;
  }

  // Unified Torque Getter
  getEngineTorque(rpm, throttle) {
    if (this.parts.motorType === 'EV') {
      return this.getMotorTorqueEV(rpm, throttle);
    }
    return this.getMotorTorqueICE(rpm, throttle);
  }

  // 3. Energy Consumption/Regen Calculation
  calculateEnergyUsage(engineTorque, rpm, dt) {
    const P_out_W = Math.abs(engineTorque) * (rpm * 2 * Math.PI / 60); // Power in Watts

    if (this.parts.motorType === 'EV') {
      // EV: Consumption is in kWh
      const { efficiency } = this.parts.electric;
      
      // P_W * dt / 3600 / 1000 (W*s -> kWh)
      const energyKWh = P_out_W * dt / 3600000; 

      if (engineTorque >= 0) {
        // Consumption
        const consumed = energyKWh / efficiency; 
        this.state.batteryChargeKWh -= consumed;
        return { consumedL: 0, consumedKWh: consumed };
      } else {
        // Regeneration (if Torque is negative due to braking)
        const { regenEfficiency } = this.parts.electric;
        const generated = energyKWh * regenEfficiency;
        this.state.batteryChargeKWh += generated;
        return { consumedL: 0, consumedKWh: -generated }; // Negative indicates regen
      }
    } 
    
    // ICE: Consumption is in Liters (Unchanged)
    const P_kW = P_out_W / 1000;
    const consumption_g_per_kWh = this.parts.engine.avgBSFC_g_kWh; 
    const flowRate_g_per_s = consumption_g_per_kWh * P_kW / 3600;
    const flowRate_L_per_s = flowRate_g_per_s / this.parts.engine.fuelDensity; 
    const consumedL = flowRate_L_per_s * dt;
    this.state.fuelConsumedL += consumedL;
    return { consumedL, consumedKWh: 0 };
  }
  
  // 4. Dynamic Mass Update
  updateDynamicMass() {
    let fuelMass = 0;
    if (this.parts.motorType === 'ICE') {
      // Assuming starting fuel mass is 50kg, and density 0.75 kg/L (750 g/L)
      const startingFuelL = this.parts.body.fuelMassKg / (this.parts.engine.fuelDensity / 1000); 
      const remainingFuelL = startingFuelL - this.state.fuelConsumedL;
      fuelMass = remainingFuelL * (this.parts.engine.fuelDensity / 1000);
    } else {
      // EV: Battery mass is assumed constant for simplicity
      fuelMass = this.parts.body.fuelMassKg;
    }
    this.state.currentMass = this.parts.body.mass + fuelMass;
  }

  // --- Core Physics (Modified to use Dynamic Mass) ---

  calculateDynamicNormalForces(acc, slopeAngleRad = 0) {
    const { wheelbase, heightOfCG, weightDistFront } = this.parts.body;
    const mass = this.state.currentMass; // Use dynamic mass
    const L = wheelbase;
    const h = heightOfCG;
    const G_static = mass * this.env.gravity;

    const N_static_total = G_static * Math.cos(slopeAngleRad);
    const N_front_static = N_static_total * weightDistFront;
    const N_rear_static = N_static_total * (1 - weightDistFront);

    const dN = (mass * acc * h) / L; 
    
    return { 
      N_front: N_front_static - dN,
      N_rear: N_rear_static + dN
    };
  }
  
  rollingResistance(slopeAngleRad = 0) {
    const mass = this.state.currentMass; // Use dynamic mass
    const Crr = 0.015;
    const N_static_total = mass * this.env.gravity * Math.cos(slopeAngleRad);
    return Crr * N_static_total;
  }
  
  gradeForce(slopeAngleRad = 0) {
    const mass = this.state.currentMass; // Use dynamic mass
    return mass * this.env.gravity * Math.sin(slopeAngleRad);
  }
  
  // Effective mass including rotational inertia
  getEffectiveMass(gearIndex) {
    const R = this.parts.wheel.radius;
    const motorI = (this.parts.motorType === 'EV') ? this.parts.electric.inertia : this.parts.engine.inertia;
    const ratios = (this.parts.motorType === 'EV') ? this.parts.gearbox.ratiosEV : this.parts.gearbox.ratios;
    
    // Ensure gearIndex is valid for single-speed EV or multi-speed ICE
    const actualGearIndex = (this.parts.motorType === 'EV') ? 0 : gearIndex - 1;

    const gearRatio = ratios[actualGearIndex] * this.parts.gearbox.finalDrive;
    const wheelsI = this.parts.wheel.inertiaPerWheel * this.parts.wheel.count;
    const translationalFromMotor = (motorI * gearRatio * gearRatio) / (R * R);
    const translationalFromWheels = wheelsI / (R * R);
    
    return this.state.currentMass + translationalFromMotor + translationalFromWheels; // Use dynamic mass
  }

  // RPM from vehicle speed and gearing
  rpmFromVelocity(v, gearIndex) {
    const R = this.parts.wheel.radius;
    const ratios = (this.parts.motorType === 'EV') ? this.parts.gearbox.ratiosEV : this.parts.gearbox.ratios;
    const actualGearIndex = (this.parts.motorType === 'EV') ? 0 : gearIndex - 1;

    const gr = ratios[actualGearIndex] * this.parts.gearbox.finalDrive;
    const wheelOmega = v / R; // rad/s
    const engineOmega = wheelOmega * gr;
    return engineOmega * (60 / (2 * Math.PI)); // rpm
  }
  
  // Shift logic (Disabled for EV)
  maybeShift(throttle) {
    if (this.parts.motorType === 'EV') return;
    
    const { shiftUpRPM, shiftDownRPM, ratios } = this.parts.gearbox;
    const { rpm, gear } = this.state;

    if (rpm > shiftUpRPM && gear < ratios.length) {
      this.state.gear += 1;
      return;
    }
    if (rpm < shiftDownRPM && gear > 1) {
      this.state.gear -= 1;
    }
  }

  // --- Main simulation step ---
  simulateStep(dt, throttleInput, brakeInput = 0, slopeAngleRad = 0) {
    const s = this.state;
    const { finalDrive, efficiency } = this.parts.gearbox;

    // 0. Update Dynamic Mass
    this.updateDynamicMass();

    // Clamp inputs
    const throttle = Math.max(0, Math.min(1, throttleInput));
    const brake = Math.max(0, Math.min(1, brakeInput));

    // Determine actual gear
    const ratios = (this.parts.motorType === 'EV') ? this.parts.gearbox.ratiosEV : this.parts.gearbox.ratios;
    const actualGearIndex = (this.parts.motorType === 'EV') ? 0 : s.gear - 1;
    const gearRatio = ratios[actualGearIndex];

    // Update RPM based on current velocity
    s.rpm = Math.min(this.rpmFromVelocity(s.velocity, s.gear), (this.parts.motorType === 'EV') ? this.parts.electric.maxRPM : this.parts.engine.maxRPM);

    // 1. Drive Force Calculation
    let engineTorque = this.getEngineTorque(s.rpm, throttle);
    let wheelTorque = engineTorque * gearRatio * finalDrive * efficiency;
    let FdriveIdeal = wheelTorque / this.parts.wheel.radius;

    // 2. Braking Force Calculation (Friction and Regen)
    const maxBrakeForce = this.parts.brakes.maxTorqueNm * 4 / this.parts.wheel.radius; 
    const FbrakeIdeal = brake * maxBrakeForce;
    
    // If EV and braking, apply regen as additional negative torque (which translates to a positive force Fbrake)
    if (this.parts.motorType === 'EV' && brake > 0) {
      // Simple Regen Torque proportional to brake input (up to 50% max motor torque)
      const regenTorque = this.parts.electric.maxTorqueNm * 0.5 * brake;
      const Fregen = regenTorque * gearRatio * finalDrive / this.parts.wheel.radius;
      
      // Regen is subtracted from drive force and added to braking (negative drive is positive braking)
      FdriveIdeal -= Fregen; // This FdriveIdeal will be used for traction limit check
      
      // We simulate the energy capture via negative engineTorque below
      engineTorque -= regenTorque;
    }
    
    // 3. Net Force Calculation and Dynamic Load
    const Meff_prev = this.getEffectiveMass(s.gear);
    const Fnet_prev_raw = FdriveIdeal - this.dragForce(s.velocity) - this.rollingResistance(slopeAngleRad) - FbrakeIdeal;
    const acc_prev = (s.velocity > 0 || Fnet_prev_raw > 0) ? Fnet_prev_raw / Meff_prev : 0;
    
    const { N_front, N_rear } = this.calculateDynamicNormalForces(acc_prev, slopeAngleRad);
    
    // 4. Traction Limit
    let N_drive;
    const driveAxle = this.parts.tires.driveAxle;
    if (driveAxle === 'RWD') N_drive = N_rear;
    else if (driveAxle === 'FWD') N_drive = N_front;
    else N_drive = N_front + N_rear; 

    const FtractionMax = this.parts.tires.mu * N_drive;
    
    // Limit drive/brake force by traction
    let Ftraction, Fbrake;
    if (FdriveIdeal > 0) {
      // Acceleration mode
      Ftraction = Math.min(FdriveIdeal, FtractionMax);
      Fbrake = 0;
    } else if (FbrakeIdeal > 0) {
      // Braking mode
      Ftraction = 0; // No drive force
      // Total possible braking force limited by total normal force
      const FbrakeMaxTotal = this.parts.tires.mu * (N_front + N_rear);
      Fbrake = Math.min(FbrakeIdeal, FbrakeMaxTotal); 
      
    } else {
      // Coasting
      Ftraction = 0;
      Fbrake = 0;
    }

    // 5. Energy Usage/Regen Update (must be done before final Fnet)
    const energyResult = this.calculateEnergyUsage(engineTorque, s.rpm, dt); // engineTorque can be negative due to regen

    // 6. Final Net Force and Acceleration
    const Fdrag = this.dragForce(s.velocity);
    const Froll = this.rollingResistance(slopeAngleRad);
    const Fgrade = this.gradeForce(slopeAngleRad);
    
    // Fnet = Drive Force (Traction Limit) - Resistances - Brake Force (Friction Limit)
    const Fnet = Ftraction - Fdrag - Froll - Fgrade - Fbrake;
    const Meff = this.getEffectiveMass(s.gear);
    const acc = Fnet / Meff;

    // 7. Update State
    s.velocity = Math.max(0, s.velocity + acc * dt);
    s.position += s.velocity * dt;
    s.time += dt;

    // 8. Update RPM and Shift Logic
    s.rpm = Math.min(this.rpmFromVelocity(s.velocity, s.gear), (this.parts.motorType === 'EV') ? this.parts.electric.maxRPM : this.parts.engine.maxRPM);
    this.maybeShift(throttle);

    return { 
      ...s,
      speedKmH: s.velocity * 3.6,
      accMS2: acc,
      FtractionMax, 
      N_front, N_rear,
      energyConsumedKWh: energyResult.consumedKWh,
      isEV: this.parts.motorType === 'EV'
    };
  }
  
  // ... (simulate0ToSpeed, simulateBraking, calcMaxSpeedKmH - use updated internal logic automatically) ...
  
  // Aerodynamic drag: F = 0.5 * rho * Cd * A * v^2
  dragForce(v) {
    const { airDensity } = this.env;
    const { dragCoeff, frontalArea } = this.parts.body;
    return 0.5 * airDensity * dragCoeff * frontalArea * v * v;
  }

  simulate0ToSpeed(targetSpeedKmH, dt = 0.01) {
    // Reset state for the run (uses motorType)
    this.state = {
      velocity: 0, position: 0, rpm: (this.parts.motorType === 'EV') ? 0 : 1200, gear: (this.parts.motorType === 'EV') ? 1 : 1, time: 0, fuelConsumedL: 0,
      batteryChargeKWh: this.parts.electric.batteryCapacityKWh * 0.9,
      currentMass: this.parts.body.mass + this.parts.body.fuelMassKg,
    };
    const targetSpeedMs = targetSpeedKmH / 3.6;
    let records = [];

    while (this.state.velocity < targetSpeedMs && this.state.time < 60) {
      const snapshot = this.simulateStep(dt, 1.0, 0, 0); 
      
      if (records.length === 0 || (snapshot.time - records[records.length - 1].time) >= 0.1) {
        records.push({ time: snapshot.time, speed: snapshot.speedKmH, distance: snapshot.position });
      }
    }

    return { 
      finalTimeS: this.state.time.toFixed(3), 
      finalDistanceM: this.state.position.toFixed(2),
      totalFuelL: this.state.fuelConsumedL.toFixed(4),
      totalEnergyKWh: (this.parts.electric.batteryCapacityKWh * 0.9 - this.state.batteryChargeKWh).toFixed(4),
      records 
    };
  }
  
  simulateBraking(initialSpeedKmH, dt = 0.01) {
    // Reset state and set initial speed (uses motorType)
    this.state = {
      velocity: initialSpeedKmH / 3.6, position: 0, rpm: 0, gear: (this.parts.motorType === 'EV') ? 1 : 1, time: 0, fuelConsumedL: 0,
      batteryChargeKWh: this.parts.electric.batteryCapacityKWh * 0.9,
	currentMass: this.parts.body.mass + (
  	          (this.parts.motorType === 'EV') 
  	          ? (this.parts.body.batteryMassKg || 0) // فرض می‌کنیم اگر EV است، جرم باتری از پیکربندی می‌آید
 	           : this.parts.body.fuelMassKg
  	      ),
    };
    
    while (this.state.velocity > 0.1 && this.state.time < 30) {
      this.simulateStep(dt, 0, 1.0, 0); 
    }
    
    // Calculate regenerated energy during the stop
    const regenGainedKWh = this.state.batteryChargeKWh - (this.parts.electric.batteryCapacityKWh * 0.9);
    
    return { 
      initialSpeedKmH,
      brakingDistanceM: this.state.position.toFixed(2),
      timeToStopS: this.state.time.toFixed(3),
      regeneratedEnergyKWh: (this.parts.motorType === 'EV' ? regenGainedKWh.toFixed(4) : 0)
    };
  }
  
  calcMaxSpeedKmH() {
    // Use max power from the correct motor type
    const Pmax = (this.parts.motorType === 'EV') 
      ? this.parts.electric.maxPowerKW * 1000 * this.parts.electric.efficiency
      : this.parts.engine.torqueCurve.reduce((max, [rpm, t]) => Math.max(max, t * (rpm * 2 * Math.PI / 60)), 0) * this.parts.gearbox.efficiency;

    let v = 0;
    for (let testV = 0; testV < 120; testV += 0.5) { 
      const Fdrag = this.dragForce(testV);
      const Froll = this.rollingResistance(0);
      const requiredP = (Fdrag + Froll) * testV;
      if (requiredP > Pmax) break;
      v = testV;
    }
    return Math.round(v * 3.6);
  }
}