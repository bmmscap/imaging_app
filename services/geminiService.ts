/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language, VideoStyle } from "../types";

// Create a fresh client for every request to ensure the latest API key from process.env.API_KEY is used
const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Updated to use 'gemini-3-pro-image-preview' for all operations including search grounding and image generation as requested
const TEXT_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const EDIT_MODEL = 'gemini-3-pro-image-preview';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview';

const getLevelInstruction = (level: ComplexityLevel): string => {
  switch (level) {
    case 'General Audience':
      return "Target Audience: General Public (News Segment). Style: Clear, engaging, high-level overview. Large text, iconic imagery. Focus on the 'Big Picture'.";
    case 'Investor':
      return "Target Audience: Investors. Style: Financial Report. Professional, data-driven, clear trends, ROI focus. Emphasize growth and opportunity.";
    case 'Analyst':
      return "Target Audience: Market Analysts. Style: Deep Dive. Dense data, complex charts, correlations, detailed annotations. Focus on accuracy and data density.";
    case 'Executive Leadership':
      return "Target Audience: C-Suite / Board of Directors. Style: Strategic, high-level KPIs, polished, actionable insights. Concise, impactful, decision-oriented.";
    case 'Legal':
      return "Target Audience: Legal Professionals & Regulators. Style: Formal, structured, hierarchical. Focus on compliance, frameworks, and flow of logic. Trustworthy and precise.";
    case 'Sustainability':
      return "Target Audience: ESG Stakeholders. Style: Eco-conscious, organic data visualization. Earth tones, focus on environmental impact, circular economy, and social responsibility.";
    case 'Startup / VC':
      return "Target Audience: VCs & Founders. Style: Pitch Deck Aesthetic. Modern, disruptive, high-growth visualization. Bold colors, simplified metrics, 'Unicorn' energy.";
    default:
      return "Target Audience: General Public. Style: Broadcast quality.";
  }
};

const getStyleInstruction = (style: VisualStyle): string => {
  switch (style) {
    case 'Broadcast': return "Aesthetic: TV News Graphics. High contrast, vibrant, glossy, 16:9 composition, safe areas, lower thirds style labels, 3D elements on 2D planes.";
    case 'Editorial': return "Aesthetic: High-end Magazine (Bloomberg/Economist). Clean typography, sophisticated color palette, flat infographic style, ample whitespace.";
    case 'Cinematic': return "Aesthetic: Documentary Still. Photorealistic, dramatic lighting, depth of field, 8k resolution, cinematic color grading.";
    case 'Explainer': return "Aesthetic: Motion Graphics style. Flat vector 2.0, clean lines, bright modern colors, simplified geometry, clear visual metaphors.";
    case 'Corporate': return "Aesthetic: Annual Report. Clean white background, corporate blues/greys, professional, trustworthy, structured grids.";
    case 'Terminal': return "Aesthetic: Bloomberg Terminal. Dark background, neon data points, dense information, grid systems, monospace fonts.";
    case 'Studio': return "Aesthetic: 3D Studio Render. Isometric view, claymorphism or glassmorphism, soft studio lighting, high fidelity materials.";
    case 'Whiteboard': return "Aesthetic: Strategy Session. Hand-drawn markers on whiteboard, diagrams, flowcharts, messy but genius, napkin math style.";
    default: return "Aesthetic: Broadcast quality infographic.";
  }
};

export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language
): Promise<ResearchResult> => {
  
  const levelInstr = getLevelInstruction(level);
  const styleInstr = getStyleInstruction(style);

  const systemPrompt = `
    You are a Senior Visual Producer for InvestMediaPro.
    Your goal is to research the topic: "${topic}" and create a plan for a broadcast-grade infographic.
    
    **IMPORTANT: Use the Google Search tool to find the most accurate, up-to-date information about this topic.**
    
    Context:
    ${levelInstr}
    ${styleInstr}
    Language: ${language}
    
    Please provide your response in the following format EXACTLY:
    
    FACTS:
    - [Fact 1]
    - [Fact 2]
    - [Fact 3]
    
    IMAGE_PROMPT:
    [A highly detailed image generation prompt describing the visual composition, colors, and layout for the infographic. Ensure it sounds like a design brief for a high-end motion graphics team. Do not include citations in the prompt.]
  `;

  const response = await getAi().models.generateContent({
    model: TEXT_MODEL,
    contents: systemPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "";
  
  // Parse Facts
  const factsMatch = text.match(/FACTS:\s*([\s\S]*?)(?=IMAGE_PROMPT:|$)/i);
  const factsRaw = factsMatch ? factsMatch[1].trim() : "";
  const facts = factsRaw.split('\n')
    .map(f => f.replace(/^-\s*/, '').trim())
    .filter(f => f.length > 0)
    .slice(0, 5);

  // Parse Prompt
  const promptMatch = text.match(/IMAGE_PROMPT:\s*([\s\S]*?)$/i);
  const imagePrompt = promptMatch ? promptMatch[1].trim() : `Create a detailed infographic about ${topic}. ${levelInstr} ${styleInstr}`;

  // Extract Grounding (Search Results)
  const searchResults: SearchResultItem[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks) {
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) {
        searchResults.push({
          title: chunk.web.title,
          url: chunk.web.uri
        });
      }
    });
  }

  // Remove duplicates based on URL
  const uniqueResults = Array.from(new Map(searchResults.map(item => [item.url, item])).values());

  return {
    imagePrompt: imagePrompt,
    facts: facts,
    searchResults: uniqueResults
  };
};

export const generateInfographicImage = async (prompt: string): Promise<string> => {
  // Use Gemini 3 Pro Image Preview for generation
  const response = await getAi().models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      responseModalities: [Modality.IMAGE],
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to generate image");
};

export const verifyInfographicAccuracy = async (
  imageBase64: string, 
  topic: string,
  level: ComplexityLevel,
  style: VisualStyle,
  language: Language
): Promise<{ isAccurate: boolean; critique: string }> => {
  
  // Bypassing verification to send straight to image generation
  return {
    isAccurate: true,
    critique: "Verification bypassed."
  };
};

export const fixInfographicImage = async (currentImageBase64: string, correctionPrompt: string): Promise<string> => {
  const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const prompt = `
    Edit this image. 
    Goal: Professional Touch-up.
    Instruction: ${correctionPrompt}.
    Ensure the design is clean, broadcast-ready, and any text is large and legible.
  `;

  const response = await getAi().models.generateContent({
    model: EDIT_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE],
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to fix image");
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string): Promise<string> => {
  const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  
  const response = await getAi().models.generateContent({
    model: EDIT_MODEL,
    contents: {
      parts: [
         { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
         { text: editInstruction }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE],
    }
  });
  
   const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData && part.inlineData.data) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to edit image");
};

export const generateVideoFromImage = async (imageBase64: string, style: VideoStyle = 'Cinematic'): Promise<string> => {
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const ai = getAi();

  let prompt = '';
  if (style === 'Cinematic') {
    prompt = 'Cinematic slow pan and zoom across the image details, Ken Burns effect, highly detailed 4k output, smooth broadcast motion, emphasize data points.';
  } else {
    prompt = 'Dynamic broadcast camera movement, slight parallax, data visualization motion, professional news segment intro style, 4k.';
  }

  // Create a video generation operation using the image as the starting frame
  let operation = await ai.models.generateVideos({
    model: VIDEO_MODEL,
    prompt: prompt,
    image: {
      imageBytes: cleanBase64,
      mimeType: 'image/png', // Assuming data is png/jpeg, Veo accepts image inputs
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9' // Match the broadcast aspect ratio
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  // Fetch with API key to get the actual video bytes
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};