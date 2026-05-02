import axios from 'axios';

// Используем реальный бэкенд FastAPI (настроен порт 8000 в docker-compose)
const API_URL = 'http://localhost:8000/api/v1';

export interface GrainLot {
  lot_id: string;
  status: string;
  farmer_id: string;
  cadastre_number: string;
  ukas_verified: boolean;
  phyto_cert_number: string | null;
  truck_plate: string;
  price_usdc: number;
  solana_tx: string | null;
  hash_chain: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export const lotApi = {
  getLots: async (): Promise<{ lots: GrainLot[], total: number }> => {
    try {
      const response = await axios.get(`${API_URL}/lots/`);
      return response.data;
    } catch (e) {
      console.error(e);
      // Возвращаем мок для демо, если бэкенд не запущен
      return {
        lots: [
          {
            lot_id: "UA-2026-A1B2C3",
            status: "IN_TRANSIT",
            farmer_id: "312***89",
            cadastre_number: "6310138500:10:012:0045",
            ukas_verified: true,
            phyto_cert_number: "PHYTO-UA-001234",
            truck_plate: "AA1234BB",
            price_usdc: 5400,
            solana_tx: "4mK8p...",
            hash_chain: {
              kep: "a1b2c3d4...",
              cadastre: "f5g6h7j8...",
              ukas: "k9l0m1n2...",
              phyto: "o3p4q5r6..."
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            lot_id: "UA-2026-X9Y8Z7",
            status: "EXPORT_READY",
            farmer_id: "278***12",
            cadastre_number: "4210138500:05:010:0021",
            ukas_verified: true,
            phyto_cert_number: "PHYTO-UA-009876",
            truck_plate: "BC9876AC",
            price_usdc: 8200,
            solana_tx: "7xR2t...",
            hash_chain: {
              kep: "q1w2e3r4...",
              cadastre: "t5y6u7i8...",
              ukas: "o9p0a1s2..."
            },
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        total: 2
      };
    }
  },
  
  getLotDetails: async (lotId: string): Promise<GrainLot> => {
    try {
      const response = await axios.get(`${API_URL}/lots/${lotId}`);
      return response.data;
    } catch (e) {
      // Моковые данные fallback
      return {
        lot_id: lotId,
        status: "IN_TRANSIT",
        farmer_id: "312***89",
        cadastre_number: "6310138500:10:012:0045",
        ukas_verified: true,
        phyto_cert_number: "PHYTO-UA-001234",
        truck_plate: "AA1234BB",
        price_usdc: 5400,
        solana_tx: "4mK8pRqN9wXyZ1vC2bN3mQ4wE5rT6yU7iI8oP9aS0dF1gH2jK3lM4nB5vC6xZ7",
        hash_chain: {
          kep: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1",
          cadastre: "f5g6h7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5",
          ukas: "k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9",
          phyto: "o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3"
        },
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }
};
