import { recommendByKeyword, RecommendationResult } from "./keywordRecommend";
import { departments } from "./departments";

export async function recommendByAI(title: string, content: string): Promise<RecommendationResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Falling back to keyword recommendation.");
    return recommendByKeyword(title, content);
  }

  const allowedDepartments = departments.map((d) => d.name);

  // We explicitly provide the 10 valid departments to the AI.
  const systemInstruction = `
귀하는 시민 민원의 내용을 분석하여 담당 부서를 추천하는 AI 어시스턴트입니다.
반드시 아래에 제공된 10개의 부서 목록 중에서만 추천 부서 1순위, 2순위, 3순위를 선정하여 JSON 형식으로 반환해야 합니다.

[추천 가능한 10개 부서 목록]
${allowedDepartments.map((name, i) => `${i + 1}. ${name}`).join("\n")}

[주의 사항]
1. 위 10개 목록에 없는 부서는 절대 생성하거나 추천하면 안 됩니다.
2. 각 추천 항목은 다음 필드를 가져야 합니다:
   - rank: 순위 (1, 2, 3)
   - department: 부서 이름 (위 10개 중 하나와 정확히 일치해야 함)
   - confidence: 추천 신뢰도 (0.00 ~ 1.00 사이의 소수)
   - matchedKeywords: 민원 내용에서 부서와 연관되어 추출된 핵심 키워드 목록 (string 배열)
   - reason: 해당 부서를 추천하는 구체적이고 자연스러운 이유 (한국어 작성)
`;

  const prompt = `
민원 제목: ${title}
민원 내용: ${content}

위 민원을 분석하여 가장 적절한 담당 부서 1~3순위를 JSON 배열 형태로 작성해 주세요.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: systemInstruction
            }
          ]
        },
        generationConfig: {
          responseMimeType: "application/json",
          // Force output to match our exact required array of objects, with an enum constraint for departments
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                rank: { type: "INTEGER" },
                department: { 
                  type: "STRING", 
                  enum: allowedDepartments 
                },
                confidence: { type: "NUMBER" },
                matchedKeywords: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                reason: { type: "STRING" }
              },
              required: ["rank", "department", "confidence", "matchedKeywords", "reason"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Invalid response format from Gemini API");
    }

    const parsed: RecommendationResult[] = JSON.parse(textResult);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("AI response is not an array or is empty");
    }

    // Filter and sanitize AI results to guarantee they only contain the authorized 10 departments
    const sanitized = parsed
      .filter((item) => allowedDepartments.includes(item.department))
      .map((item, index) => ({
        rank: item.rank || index + 1,
        department: item.department,
        confidence: typeof item.confidence === "number" ? item.confidence : 0.5,
        matchedKeywords: Array.isArray(item.matchedKeywords) ? item.matchedKeywords : [],
        reason: item.reason || `${item.department} 관련 민원으로 판단됩니다.`
      }));

    if (sanitized.length === 0) {
      throw new Error("No valid departments found in AI recommendation");
    }

    // If AI recommended less than 3 valid departments, fill the rest with keyword-based recommendations
    if (sanitized.length < 3) {
      const keywordBackup = recommendByKeyword(title, content);
      for (const backup of keywordBackup) {
        if (sanitized.length >= 3) break;
        if (!sanitized.some((item) => item.department === backup.department)) {
          sanitized.push({
            ...backup,
            rank: sanitized.length + 1
          });
        }
      }
    }

    // Ensure ranks are sequentially 1, 2, 3
    return sanitized.slice(0, 3).map((item, idx) => ({ ...item, rank: idx + 1 }));
  } catch (error) {
    console.error("AI Recommendation failed, falling back to keyword recommendation:", error);
    return recommendByKeyword(title, content);
  }
}
