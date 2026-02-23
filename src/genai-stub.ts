// Frontend stub for @google/genai
// This module exists solely to satisfy import resolution during Vite bundling.
// It provides a minimal API with no real functionality; all actual AI calls
// are performed on the server.

export class GoogleGenAI {
  constructor(_opts: any) {}
  models = {
    async generateContent(_opts: any) {
      return { text: '' };
    }
  };
}

export const Type: any = {};
