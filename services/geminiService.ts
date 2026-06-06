
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, PaymentStatus } from "../types";

const getSystemInstruction = () => {
  return `You are a financial assistant for a Building Society Manager. 
  Your job is to analyze collection data and provide a brief, professional, and encouraging summary.
  Focus on the percentage collected, amount remaining, and speed of collection.
  Keep it under 3 sentences.`;
};

// Use gemini-3-flash-preview for text tasks
export const generateFinancialInsight = async (state: AppState): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI insights unavailable: API Key missing.";
  }

  const paidCount = state.flats.filter(f => f.status === PaymentStatus.PAID).length;
  const unpaidCount = state.flats.filter(f => f.status === PaymentStatus.UNPAID).length;
  const totalCollected = state.transactions.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Calculate today's collection
  const today = new Date().toISOString().split('T')[0];
  const todayCollection = state.transactions
    .filter(t => t.date.startsWith(today))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const prompt = `
    Context:
    Building: Continental Heights B Wing.
    Total Flats: ${state.flats.length}
    Maintenance Amount: 2500 (Owner-occupied), 2800 (Rented)
    
    Current Status:
    Paid: ${paidCount}
    Unpaid: ${unpaidCount}
    Total Collected All Time: ${totalCollected}
    Collected Today: ${todayCollection}
    
    Provide a "Daily Insight" for the manager dashboard.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(),
      }
    });
    
    // Access response.text directly (not a method)
    return response.text || "Unable to generate insight.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to analyze data at this moment.";
  }
};

// Use gemini-3-flash-preview for parsing text to JSON
export const parseFinancialText = async (text: string): Promise<any> => {
  if (!process.env.API_KEY) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract transaction details from: "${text}".
      Return JSON with keys: 
      - type (INCOME, EXPENSE, or TRANSFER)
      - amount (number)
      - date (YYYY-MM-DD, assume today if not specified)
      - category (short string e.g. 'Repairs', 'Utilities', 'Maintenance')
      - description (brief summary)
      - paymentMode (CASH or BANK - deduce from context, default to CASH)
      `,
      config: {
        responseMimeType: "application/json",
         responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            paymentMode: { type: Type.STRING },
          }
        }
      }
    });
    
    // Access response.text directly (not a method)
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Quick Fill Error:", error);
    return null;
  }
};
