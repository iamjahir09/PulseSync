'use client';

export type BLEConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface BLEHeartRateData {
  heartRate: number;
  rrIntervals?: number[];
  timestamp: Date;
}

export interface BLEDevice {
  id: string;
  name: string;
  device: any;
}

class BLECore {
  private device: any = null;
  private server: any = null;
  private service: any = null;
  private characteristic: any = null;
  private onDataCallback: ((data: BLEHeartRateData) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private isConnected = false;

  // Check if Web Bluetooth is available
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // Scan for BLE devices
  async scan(): Promise<BLEDevice> {
    if (!this.isAvailable()) {
      throw new Error('Web Bluetooth API is not supported in this browser. Please use Chrome.');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['heart_rate'],
      });

      this.device = device;
      return {
        id: device.id || 'unknown',
        name: device.name || 'Unknown Device',
        device: device,
      };
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error('No BLE device found. Please make sure your heart rate monitor is on and in pairing mode.');
      } else if (error.name === 'SecurityError') {
        throw new Error('BLE connection requires HTTPS or localhost.');
      } else {
        throw new Error(`Scan failed: ${error.message}`);
      }
    }
  }

  // Connect to BLE device
  async connect(device: any): Promise<void> {
    if (!device) {
      throw new Error('No device selected');
    }

    try {
      this.device = device;
      this.server = await device.gatt.connect();
      this.service = await this.server.getPrimaryService('heart_rate');
      this.characteristic = await this.service.getCharacteristic('heart_rate_measurement');

      // Start notifications
      await this.characteristic.startNotifications();

      // Add event listeners
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleData.bind(this));
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      this.isConnected = true;
    } catch (error: any) {
      this.isConnected = false;
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  // Handle incoming BLE data
  private handleData(event: any): void {
    const value = event.target.value;
    const data = this.parseHeartRateData(value);

    if (data && this.onDataCallback) {
      this.onDataCallback(data);
    }
  }

  // Parse Heart Rate Measurement data
  parseHeartRateData(value: DataView): BLEHeartRateData | null {
    try {
      const flags = value.getUint8(0);
      const isHR16Bit = flags & 0x01;
      const hasRR = flags & 0x10;

      let heartRate: number;
      let offset = 1;

      if (isHR16Bit) {
        heartRate = value.getUint16(offset, true);
        offset += 2;
      } else {
        heartRate = value.getUint8(offset);
        offset += 1;
      }

      const rrIntervals: number[] = [];
      if (hasRR) {
        while (offset + 1 < value.byteLength) {
          const rr = value.getUint16(offset, true);
          rrIntervals.push(rr);
          offset += 2;
        }
      }

      return {
        heartRate,
        rrIntervals: rrIntervals.length > 0 ? rrIntervals : undefined,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error parsing BLE data:', error);
      return null;
    }
  }

  // Handle disconnection
  private handleDisconnect(): void {
    this.isConnected = false;
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  // Set data callback
  onData(callback: (data: BLEHeartRateData) => void): void {
    this.onDataCallback = callback;
  }

  // Set disconnect callback
  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  // Disconnect from device
  disconnect(): void {
    if (this.device && this.device.gatt) {
      try {
        this.device.gatt.disconnect();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
    this.isConnected = false;
  }

  // Check if connected
  isConnectedState(): boolean {
    return this.isConnected;
  }

  // Get device name
  getDeviceName(): string {
    return this.device?.name || 'Unknown Device';
  }

  // Get device ID
  getDeviceId(): string {
    return this.device?.id || 'unknown';
  }
}

export const bleCore = new BLECore();