import { create } from 'zustand';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
  plan: string;
}

interface HotelState {
  activeHotel: Hotel | null;
  hotels: Hotel[];
  setActiveHotel: (hotel: Hotel | null) => void;
  setHotels: (hotels: Hotel[]) => void;
}

export const useHotelStore = create<HotelState>((set) => ({
  activeHotel: null,
  hotels: [],
  setActiveHotel: (hotel) => set({ activeHotel: hotel }),
  setHotels: (hotels) => set({ hotels }),
}));
