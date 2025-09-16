// Constants and helpers used across the app

export const PLACEHOLDERS = {
  DISABLED: "กรอกข้อมูลด้านซ้ายแล้วกดบันทึก",
  ENABLED: "พิมพ์คำถามที่นี่...",
  LOADING: "อาจารย์คมกำลังเพ่งดวง...",
};

export const TYPING_MESSAGES = [
  "อาจารย์คมกำลังเพ่งดวง",
  "กำลังอ่านดวงชะตา",
  "กำลังดูดาวเคราะห์",
  "กำลังวิเคราะห์ดวง",
];

export function getTopicDisplayName(topicValue) {
  const topicMap = {
    overall: "ภาพรวม",
    career: "การงาน",
    finance: "การเงิน",
    love: "ความรัก",
    health: "สุขภาพ",
  };
  return topicMap[topicValue] || topicValue;
}


