import { GoogleGenAI } from "@google/genai";
import { AppState, PaymentStatus } from "../types";
import { MAINTENANCE_AMOUNT } from "../constants";

const getSystemInstruction = () => {
  return `You are a financial assistant for a Building Society Manager. 
  Your job is to analyze collection data and provide a brief, professional, and encouraging summary.
  Focus on the percentage collected, amount remaining, and speed of collection.
  Keep it under 3 sentences.`;
};

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
    Maintenance Amount: ${MAINTENANCE_AMOUNT}
    
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
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(),
      }
    });
    
    return response.text || "Unable to generate insight.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to analyze data at this moment.";
  }
};