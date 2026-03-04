import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type LocationState = {
    pref: string | null;
    city: string | null;
    municipalityCode: string | null;
    coords: { lat: number | null; lng: number | null } | null;

    hydrated: boolean;
    setHydrated: (v: boolean) => void;

    setCoords: (lat: number | null, lng: number | null) => void;
    setPref: (p: string | null) => void;
    setCity: (c: string | null) => void;
    setMunicipalityCode: (m: string | null) => void;

    reset: () => void;
};

export const useLocationStore = create<LocationState>()(
    persist(
        (set) => ({
            pref: null,
            city: null,
            municipalityCode: null,
            coords: null,

            hydrated: false,
            setHydrated: (v) => set({ hydrated: v }),

            setCoords: (lat, lng) =>
                set({
                    coords:
                        lat != null && lng != null
                            ? { lat, lng }
                            : { lat: null, lng: null },
                }),

            setPref: (pref) => set({ pref }),
            setCity: (city) => set({ city }),
            setMunicipalityCode: (m) => set({ municipalityCode: m }),

            reset: () =>
                set({
                    pref: null,
                    city: null,
                    municipalityCode: null,
                    coords: null,
                }),
        }),
        {
            name: "location-store",
            storage: createJSONStorage(() => localStorage),

            // ★ これが本番で必須
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);
