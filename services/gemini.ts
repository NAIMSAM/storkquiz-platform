
import { GoogleGenAI } from "@google/genai";
import { QuizQuestion } from "../types";

export const generateQuizFromContent = async (
  content: string,
  images: string[] = [],
  questionCount: number = 5
): Promise<QuizQuestion[]> => {
  const genAI = new GoogleGenAI({ apiKey: window._env_?.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "" });

  const prompt = `Génère un quiz de ${questionCount} questions à choix multiples basé sur le contenu fourni.
  
  OBJECTIF PÉDAGOGIQUE CRUCIAL :
  Ce quiz sert d'ACCROCHE pour une formation. Il doit tester l'INTUITION des participants face à la RÉALITÉ du terrain avant qu'ils n'aient l'explication.
  
  CONSIGNES STRICTES DE FORMAT :
  1. Génère exactement ${questionCount} questions.
  2. Les questions doivent être très COURTES et DIRECTES (Maximum 15 mots par question).
  3. Les options de réponse doivent être très COURTES et CONCISES (Maximum 6 mots par option).
  4. Les questions doivent être formulées pour challenger les idées reçues.
  5. La "correctAnswer" doit être la vraie réponse basée sur le texte.
  6. L'explication doit commencer par "En réalité..." ou "Contrairement à ce qu'on pense...".
  
  Format : ${questionCount} questions concises, 4 choix très courts par question.`;

  const parts: any[] = [{ text: prompt }, { text: `CONTENU: ${content}` }];

  images.forEach((img) => {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: img.split(',')[1] // remove data:image/jpeg;base64,
      }
    });
  });

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              question: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              correctAnswerIndex: { type: "INTEGER" },
              explanation: { type: "STRING" }
            },
            required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Erreur lors de la génération du quiz:", error);

    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      throw new Error("Quota d'IA dépassé. Veuillez patienter quelques instants ou passer à une offre supérieure.");
    }

    throw error;
  }
};
