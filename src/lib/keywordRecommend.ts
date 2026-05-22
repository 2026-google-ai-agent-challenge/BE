import { departments } from "./departments";

export interface RecommendationResult {
  rank: number;
  department: string;
  confidence: number;
  matchedKeywords: string[];
  reason: string;
}

export function recommendByKeyword(title: string, content: string): RecommendationResult[] {
  const targetText = `${title} ${content}`;
  
  // 1. Calculate scores and matched keywords for each department
  const scoredDepts = departments.map((dept) => {
    const matchedKeywords: string[] = [];
    let matchCount = 0;
    
    dept.keywords.forEach((keyword) => {
      // Create a global, case-insensitive regex for the keyword
      // We escape the keyword just in case it contains regex special characters
      const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedKeyword, "gi");
      const matches = targetText.match(regex);
      if (matches) {
        matchCount += matches.length;
        matchedKeywords.push(keyword);
      }
    });
    
    return {
      department: dept.name,
      score: matchCount,
      matchedKeywords
    };
  });
  
  // 2. Sort by score descending
  const sortedDepts = [...scoredDepts].sort((a, b) => b.score - a.score);
  
  // 3. Extract top 3 departments
  const top3 = sortedDepts.slice(0, 3);
  
  // Calculate total score of top 3 to compute confidence
  const totalTopScore = top3.reduce((sum, item) => sum + item.score, 0);
  
  return top3.map((item, index) => {
    const rank = index + 1;
    
    // Calculate a confidence score between 0.1 and 0.9
    let confidence = 0.1; // Default minimum confidence
    if (totalTopScore > 0 && item.score > 0) {
      // Proportionate confidence scaled to max out at 0.9
      confidence = Math.round((0.1 + (item.score / totalTopScore) * 0.8) * 100) / 100;
    } else if (index === 0) {
      confidence = 0.3; // First fallback choice gets slightly higher confidence if all are 0
    } else if (index === 1) {
      confidence = 0.2;
    }
    
    // Generate simulated reason
    let reason = "";
    if (item.score > 0) {
      const displayKeywords = item.matchedKeywords.slice(0, 3).join(", ");
      reason = `민원 내용에 '${displayKeywords}' 등 ${item.department} 관련 키워드가 ${item.score}회 매칭되어 추천되었습니다. (키워드 매칭)`;
    } else {
      reason = `민원 분석 결과 직접적인 키워드가 발견되지 않아, 기본 부서인 ${item.department}가 추천되었습니다. (키워드 매칭)`;
    }
    
    return {
      rank,
      department: item.department,
      confidence,
      matchedKeywords: item.matchedKeywords,
      reason
    };
  });
}
