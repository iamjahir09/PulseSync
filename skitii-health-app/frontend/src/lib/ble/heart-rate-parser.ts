'use client';

export interface HeartRateMeasurement {
  heartRate: number;
  isHR16Bit: boolean;
  rrIntervals?: number[];
  energyExpended?: number;
  contactDetected?: boolean;
}

export class HeartRateParser {
  /**
   * Parse BLE Heart Rate Measurement data
   * Based on GATT Heart Rate Service specification
   */
  static parse(value: DataView): HeartRateMeasurement | null {
    try {
      if (value.byteLength < 2) {
        return null;
      }

      const flags = value.getUint8(0);
      const isHR16Bit = !!(flags & 0x01);
      const contactStatus = !!(flags & 0x02);
      const contactDetected = !!(flags & 0x04);
      const energyExpendedPresent = !!(flags & 0x08);
      const hasRRInterval = !!(flags & 0x10);

      let offset = 1;
      let heartRate: number;

      if (isHR16Bit) {
        heartRate = value.getUint16(offset, true);
        offset += 2;
      } else {
        heartRate = value.getUint8(offset);
        offset += 1;
      }

      let energyExpended: number | undefined;
      if (energyExpendedPresent) {
        energyExpended = value.getUint16(offset, true);
        offset += 2;
      }

      const rrIntervals: number[] = [];
      if (hasRRInterval) {
        while (offset + 1 < value.byteLength) {
          const rr = value.getUint16(offset, true);
          rrIntervals.push(rr);
          offset += 2;
        }
      }

      return {
        heartRate,
        isHR16Bit,
        rrIntervals: rrIntervals.length > 0 ? rrIntervals : undefined,
        energyExpended,
        contactDetected: contactStatus ? contactDetected : undefined,
      };
    } catch (error) {
      console.error('Error parsing heart rate data:', error);
      return null;
    }
  }

  /**
   * Convert RR interval to heart rate variability (HRV)
   */
  static calculateHRV(rrIntervals: number[]): number | null {
    if (!rrIntervals || rrIntervals.length < 2) {
      return null;
    }

    // Calculate standard deviation of RR intervals (SDNN)
    const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
    const squaredDiffs = rrIntervals.map(rr => Math.pow(rr - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / rrIntervals.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate mock heart rate data (for development without real device)
   */
  static generateMockData(): HeartRateMeasurement {
    const baseHR = 65 + Math.floor(Math.random() * 25);
    const rrCount = 1 + Math.floor(Math.random() * 3);
    const rrIntervals: number[] = [];

    for (let i = 0; i < rrCount; i++) {
      const rr = 600 + Math.floor(Math.random() * 300);
      rrIntervals.push(rr);
    }

    return {
      heartRate: baseHR,
      isHR16Bit: false,
      rrIntervals,
      contactDetected: true,
    };
  }

  /**
   * Get HRV status based on RR intervals
   */
  static getHRVStatus(rrIntervals: number[]): string {
    if (!rrIntervals || rrIntervals.length < 2) {
      return 'Insufficient data';
    }

    const hrv = this.calculateHRV(rrIntervals);
    if (hrv === null) {
      return 'Insufficient data';
    }

    if (hrv < 20) return 'Low HRV';
    if (hrv < 50) return 'Normal HRV';
    return 'High HRV';
  }
}