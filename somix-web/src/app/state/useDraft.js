import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultDraft = {
  prompt: '',
  imageUrl: undefined,
  imageData: undefined,
  caption: '',
  tags: [],
  visibility: 'public',
  allowComments: true,
  openMint: false,
  editionsCap: null
}

export const useDraftStore = create(
  persist(
    (set, get) => ({
      draft: defaultDraft,

      setPrompt: (prompt) =>
        set((state) => ({
          draft: { ...state.draft, prompt }
        })),

      setImageUrl: (imageUrl) =>
        set((state) => ({
          draft: { ...state.draft, imageUrl }
        })),

      setImageData: (imageData) =>
        set((state) => ({
          draft: { ...state.draft, imageData }
        })),

      setCaption: (caption) =>
        set((state) => ({
          draft: { ...state.draft, caption }
        })),

      setTags: (tags) =>
        set((state) => ({
          draft: { ...state.draft, tags }
        })),

      setVisibility: (visibility) =>
        set((state) => ({
          draft: { ...state.draft, visibility }
        })),

      setAllowComments: (allowComments) =>
        set((state) => ({
          draft: { ...state.draft, allowComments }
        })),

      setOpenMint: (openMint) =>
        set((state) => ({
          draft: { ...state.draft, openMint }
        })),

      setEditionsCap: (editionsCap) =>
        set((state) => ({
          draft: { ...state.draft, editionsCap }
        })),

      clearDraft: () =>
        set(() => ({
          draft: defaultDraft
        })),

      resetToDefaults: () =>
        set(() => ({
          draft: defaultDraft
        }))
    }),
    {
      name: 'somix-draft-storage',
      partialize: (state) => ({ draft: state.draft })
    }
  )
)


