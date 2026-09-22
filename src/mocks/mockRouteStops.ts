export type RouteStopScanType = "Barcode" | "Manual";

export interface RouteStop {
  addressName: string;
  eta: string;
  id: string;
  pallets: number;
  qty: number;
  scanType: RouteStopScanType;
  volume: string;
  weight: string;
}

/**
 * Route Detail 的本地联调数据。
 * key 使用路线唯一 id，后续接入接口时只需替换这份数据来源。
 */
export const mockRouteStopsByRouteId: Record<string, RouteStop[]> = {
  "route-hongqiao-lingang": [
    { addressName: "Hongqiao Hub", eta: "09:30 AM", id: "hongqiao-1", pallets: 3, qty: 24, scanType: "Barcode", volume: "8 cbm", weight: "320 kg" },
    { addressName: "Xuhui Stop", eta: "10:20 AM", id: "hongqiao-2", pallets: 2, qty: 18, scanType: "Manual", volume: "5 cbm", weight: "210 kg" },
    { addressName: "Pudong Depot", eta: "11:45 AM", id: "hongqiao-3", pallets: 4, qty: 36, scanType: "Barcode", volume: "12 cbm", weight: "480 kg" },
    { addressName: "Lingang Center", eta: "01:10 PM", id: "hongqiao-4", pallets: 2, qty: 27, scanType: "Barcode", volume: "9 cbm", weight: "350 kg" },
  ],
  "route-putuo-waigaoqiao": [
    { addressName: "Putuo Warehouse", eta: "08:15 AM", id: "pudong-1", pallets: 2, qty: 16, scanType: "Barcode", volume: "5 cbm", weight: "190 kg" },
    { addressName: "Jing'an Stop", eta: "09:05 AM", id: "pudong-2", pallets: 1, qty: 12, scanType: "Manual", volume: "3 cbm", weight: "125 kg" },
    { addressName: "Yangpu Station", eta: "10:10 AM", id: "pudong-3", pallets: 3, qty: 25, scanType: "Barcode", volume: "7 cbm", weight: "280 kg" },
    { addressName: "Jinqiao Depot", eta: "11:20 AM", id: "pudong-4", pallets: 2, qty: 20, scanType: "Barcode", volume: "6 cbm", weight: "230 kg" },
    { addressName: "Waigaoqiao Hub", eta: "12:35 PM", id: "pudong-5", pallets: 4, qty: 38, scanType: "Manual", volume: "11 cbm", weight: "465 kg" },
    { addressName: "Pudong Terminal", eta: "01:40 PM", id: "pudong-6", pallets: 2, qty: 22, scanType: "Barcode", volume: "6 cbm", weight: "250 kg" },
  ],
  "route-songjiang-xinjiangwan": [
    { addressName: "Songjiang DC", eta: "02:00 PM", id: "lingang-1", pallets: 5, qty: 42, scanType: "Barcode", volume: "14 cbm", weight: "520 kg" },
    { addressName: "Xinjiangwan T4", eta: "03:35 PM", id: "lingang-2", pallets: 3, qty: 31, scanType: "Manual", volume: "10 cbm", weight: "390 kg" },
  ],
};
