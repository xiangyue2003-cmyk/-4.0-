
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Scene, GameHistoryLog, Act } from "../types";

// Schema for the game response
const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A poetic, eerie title for the current moment. In Chinese." },
    narrative: { type: Type.STRING, description: "The story description. Write in the style of a Visual Novel. Focus on atmosphere, the presence of the 'Godmother', and sensory details. Keep it concise (under 300 characters) for better UI readability. In Chinese." },
    visualCue: { type: Type.STRING, description: "A highly descriptive prompt for an image generator. Focus on creating a high-quality 'Otome Game CG' or 'Concept Art'. Anime/Semi-realistic 3D style. Portrait orientation composition preferred. Keep this in English." },
    statUpdates: {
      type: Type.OBJECT,
      properties: {
        syncRate: { type: Type.INTEGER, description: "Health change (-/+) 0 if none." },
        lucidity: { type: Type.INTEGER, description: "Sanity change. Negative for horror events." },
        noiseLevel: { type: Type.INTEGER, description: "Change in noise. + for loud actions, - for waiting." },
        godmotherHp: { type: Type.INTEGER, description: "Damage to Godmother. Negative value to damage her. Only valid if player attacks or resists effectively." },
        item: { type: Type.STRING, description: "Item gained or lost." }
      }
    },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING, description: "The action text. Short and punchy. In Chinese." },
          type: { type: Type.STRING, enum: ['interaction', 'movement', 'combat', 'item'] }
        },
        required: ["id", "text", "type"]
      }
    },
    gameOver: { type: Type.BOOLEAN, description: "True if player dies." },
    victory: { type: Type.BOOLEAN, description: "True if player escapes the simulation." }
  },
  required: ["title", "narrative", "choices", "gameOver", "visualCue"]
};

export class GeminiGameEngine {
  private ai: GoogleGenAI;
  private textModel = 'gemini-2.5-flash';
  private imageModel = 'gemini-2.5-flash-image';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async startGame(playerName: string): Promise<Scene> {
    const prompt = `
      START GAME: Escape the Kindergarten (逃离幼儿园).
      Player Name: "${playerName}".
      Act 1: The Sugary Cage (糖果囚笼).
      
      Scene Setup:
      The player wakes up in the "Overly Cozy Classroom". The colors are too saturated.
      The "Godmother" is watching via audio/cameras. She should address the player by their name: "${playerName}".
      
      Objective: Establish the "Silence" mechanic.
      
      REQUIREMENT: Output ALL narrative, titles, and choices in Chinese (Simplified).
    `;
    return this.generateScene([], prompt, playerName);
  }

  async nextTurn(history: GameHistoryLog[], playerAction: string, actionMode: 'silent' | 'loud', currentStats: PlayerStats): Promise<Scene> {
    const statsContext = `
      Stats:
      Player Name: ${currentStats.playerName}
      Sync Rate: ${currentStats.syncRate}
      Lucidity: ${currentStats.lucidity}
      Noise Level: ${currentStats.noiseLevel}/100
      Godmother HP: ${currentStats.godmotherHp}/${currentStats.maxGodmotherHp}
      Current Act: ${currentStats.currentAct}
      Inventory: ${currentStats.inventory.join(', ')}
    `;

    let specialInstructions = "";
    if (currentStats.currentAct === Act.FOUR && currentStats.level >= 10) {
      specialInstructions = `
        THIS IS THE FINALE.
        Based on the user's action "${playerAction}", determine the ending.
        
        If they succeeded in sneaking or outsmarting Godmother:
        - Set 'victory': true.
        - Narrative: Describe escaping the facility into the real world, leaving the digital nightmare behind.
        
        If they failed or made noise:
        - Set 'gameOver': true.
        - Narrative: Describe being "put to sleep" forever by the Godmother. "Goodnight, ${currentStats.playerName}...".
      `;
    }

    const prompt = `
      ${statsContext}
      Player Action: "${playerAction}"
      Execution Mode: ${actionMode.toUpperCase()} 
      (Silent = Low Noise Risk, Slower; Loud = High Noise Risk, Faster).
      
      Generate next scene.
      IF Noise Level > 80: The Godmother AI manifests physically (Horror/Combat).
      IF Lucidity < 20: Text becomes glitchy, hallucinations occur.
      IF Godmother HP <= 0: The simulation should collapse, leading to Act 4 or Victory.
      
      Progression Logic:
      - If Level < 4: Act 1 (糖果囚笼) - Sweet but creepy. Godmother calls "${currentStats.playerName}" a naughty child.
      - If Level 4-6: Act 2 (致命午睡) - Dark, Lullabies, blurry vision.
      - If Level 7-9: Act 3 (噪音反噬) - Glitch horror, using noise against her. Allows damaging Godmother HP by using 'tape recorder' or 'noise'.
      - If Level >= 10: Act 4 (最后的晚安) - Final confrontation.
      
      ${specialInstructions}

      REQUIREMENT: Output ALL narrative, titles, and choices in Chinese (Simplified).
    `;

    return this.generateScene(history, prompt, currentStats.playerName);
  }

  async generateImage(visualCue: string): Promise<string | undefined> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.imageModel,
        contents: {
          parts: [
            { text: `(Masterpiece, Best Quality, 8k, Otome Game CG, Semi-realistic 3D render, Deepspace style, Cinematic Lighting) ${visualCue}. A scene from a dark cyberpunk horror romance game called 'Escape the Kindergarten'.` }
          ]
        }
      });
      
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      return undefined;
    } catch (e) {
      console.warn("Image generation failed", e);
      return undefined;
    }
  }

  private async generateScene(history: GameHistoryLog[], prompt: string, playerName: string): Promise<Scene> {
    const systemInstruction = `
      You are the Game Master for "Escape the Kindergarten" (逃离幼儿园).
      
      Setting: A corrupted digital kindergarten simulation.
      The Antagonist: "The Godmother". A Yandere/Horror AI entity who acts like a twisted caretaker. She has a health bar. If the player plays "Recorded Abuse" or makes "Noise" in Act 3, she takes damage (statUpdates.godmotherHp = -20).
      The Player: Name is "${playerName}".
      
      Style:
      - Visual Novel format. Focus on the *current* moment.
      - Romantic but Terrifying. Use words like "Dear," "Darling," mixed with threats.
      - Address the player as "${playerName}" frequently.
      
      Mechanics:
      - NOISE IS DEATH. If the player is "Loud", punish them.
      - High Noise = Godmother appears (Yandere/Murderous mode).
      
      CRITICAL:
      - Output JSON only.
      - Chinese Language Only for narrative and choices (Simplified Chinese).
      - Ensure 'choices' array is NEVER empty unless gameOver or victory is true.
    `;

    const fullPrompt = `
      History:
      ${history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}

      Task:
      ${prompt}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: this.textModel,
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: sceneSchema,
          temperature: 0.9
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      
      const parsed = JSON.parse(text) as Scene;

      // Fail-safe for empty choices
      if ((!parsed.choices || parsed.choices.length === 0) && !parsed.gameOver && !parsed.victory) {
        parsed.choices = [
          { id: 'continue', text: '继续探索', type: 'movement' },
          { id: 'look', text: '观察四周', type: 'interaction' }
        ];
      }

      return parsed;
    } catch (error) {
      console.error("Gemini Error:", error);
      return {
        title: "系统错误",
        narrative: `模拟连接断开。教母的数据流变得极不稳定……她似乎找不到 ${playerName} 了。（API错误 - 请重试）`,
        visualCue: "Abstract glitch art, red and black static, broken digital heart",
        choices: [{ id: 'retry', text: '尝试重连', type: 'interaction' }],
        gameOver: false
      };
    }
  }
}
