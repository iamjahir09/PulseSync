'use client';

import { HeartRateParser, HeartRateMeasurement } from './heart-rate-parser';

export type BLEMockState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BLEMockDevice {
  id: string;
  name: string;
}

class BLEMock {
  private isConnected = false;
  private isScanning = false;
  private mockInterval: NodeJS.Timeout | null = null;
  private dataCallback: ((data: HeartRateMeasurement) => void) | null = null;
  private disconnectCallback: (() => void) | null = null;
  private devices: BLEMockDevice[] = [];

  constructor() {
    // Generate mock devices
    this.devices = [
      { id: 'mock-001', name: 'Polar H10 Simulator' },
      { id: 'mock-002', name: 'Garmin HRM Simulator' },
      { id: 'mock-003', name: 'Wahoo TICKR Simulator' },
    ];
  }

  isAvailable(): boolean {
    // Mock is always available
    return true;
  }

  async scan(): Promise<BLEMockDevice> {
    this.isScanning = true;

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.isScanning = false;

    // Return random device
    const randomIndex = Math.floor(Math.random() * this.devices.length);
    return this.devices[randomIndex];
  }

  async connect(device: BLEMockDevice): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.isConnected = true;

    // Start generating mock data
    this.startMockData();

    // Simulate random disconnect after 30-60 seconds (for testing)
    const disconnectTime = 30000 + Math.floor(Math.random() * 30000);
    setTimeout(() => {
      if (this.isConnected) {
        this.handleDisconnect();
      }
    }, disconnectTime);
  }

  private startMockData(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }

    this.mockInterval = setInterval(() => {
      if (this.isConnected && this.dataCallback) {
        const mockData = HeartRateParser.generateMockData();
        this.dataCallback(mockData);
      }
    }, 1000);
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    if (this.disconnectCallback) {
      this.disconnectCallback();
    }
  }

  onData(callback: (data: HeartRateMeasurement) => void): void {
    this.dataCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  isConnectedState(): boolean {
    return this.isConnected;
  }

  getDeviceName(): string {
    return 'Mock BLE Device';
  }

  getDeviceId(): string {
    return 'mock-device-001';
  }

  // Simulate reconnection
  async reconnect(): Promise<void> {
    if (this.isConnected) return;
    await this.connect({
      id: this.getDeviceId(),
      name: this.getDeviceName(),
    });
  }
}

export const bleMock = new BLEMock();