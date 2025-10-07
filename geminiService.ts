
import { GoogleGenAI, Type } from '@google/genai';
import type { WasteClassificationResult, DiseasePredictionResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const wasteClassificationSchema = {
  type: Type.OBJECT,
  properties: {
    wasteType: {
      type: Type.STRING,
      description: 'The classified type of waste (e.g., Plastic, Organic, E-Waste, Paper, Glass, Metal, Wood).',
    },
    recycling: {
      type: Type.OBJECT,
      properties: {
        possible: {
          type: Type.BOOLEAN,
          description: 'Whether this item is typically recyclable.',
        },
        instructions: {
          type: Type.STRING,
          description: 'Detailed instructions on how to recycle this waste. Provide actionable steps.',
        },
      },
    },
    reuse: {
      type: Type.STRING,
      description: 'Creative and practical ideas for reusing this type of waste item.',
    },
    disposal: {
      type: Type.STRING,
      description: 'Instructions for safe and proper disposal if recycling or reuse is not possible.',
    },
    environmentalImpact: {
      type: Type.STRING,
      description: 'A summary of the negative environmental effects of improper disposal of this waste type.',
    },
    healthRisks: {
      type: Type.ARRAY,
      description: 'A list of potential diseases or health risks associated with this waste.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Name of the potential disease or health risk.'
          },
          description: {
            type: Type.STRING,
            description: 'Description of how this waste can cause the health risk.'
          }
        }
      }
    },
  },
  required: ['wasteType', 'recycling', 'reuse', 'disposal', 'environmentalImpact', 'healthRisks'],
};

const diseasePredictionSchema = {
  type: Type.OBJECT,
  properties: {
    overallRiskLevel: {
      type: Type.STRING,
      description: 'An overall assessment of the health risk, categorized as Low, Medium, or High.',
    },
    predictedDiseases: {
      type: Type.ARRAY,
      description: 'A list of potential diseases that could spread from the conditions shown.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'The name of the potential disease (e.g., Dengue Fever, Cholera, Typhoid, Malaria).',
          },
          cause: {
            type: Type.STRING,
            description: 'How the conditions in the image (e.g., stagnant water, pests) can lead to this disease.',
          },
          preventionTips: {
            type: Type.ARRAY,
            description: 'A list of specific, actionable prevention tips for the community and individuals.',
            items: {
              type: Type.STRING
            },
          },
        },
         required: ['name', 'cause', 'preventionTips'],
      },
    },
  },
  required: ['overallRiskLevel', 'predictedDiseases'],
};

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

export const classifyWaste = async (imageBase64: string, mimeType: string): Promise<WasteClassificationResult> => {
  const imagePart = fileToGenerativePart(imageBase64, mimeType);
  const prompt = "Analyze this image of waste. Classify it, and provide detailed information on recycling, disposal, environmental impact, and health risks according to the provided JSON schema.";
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: wasteClassificationSchema,
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const predictDiseases = async (imageBase64: string, mimeType: string): Promise<DiseasePredictionResult> => {
  const imagePart = fileToGenerativePart(imageBase64, mimeType);
  const prompt = "Analyze this image of a waste dump or drainage area. Based on the visible conditions, predict potential diseases that could spread and provide detailed prevention tips according to the provided JSON schema.";
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: diseasePredictionSchema,
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};
