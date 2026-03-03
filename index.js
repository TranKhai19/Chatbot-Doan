require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const { createClient } = require("@supabase/supabase-js");

const app = express();
// Render sẽ tự động gán PORT, nếu chạy local thì dùng 3000
const PORT = process.env.PORT || 3000; 

app.use(cors({ origin: true }));
app.use(express.json());

// Khởi tạo Supabase & Gemini từ Biến môi trường (Environment Variables)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `Bạn là “Trợ lý Đoàn Thanh niên” của một Trung tâm Giáo dục thường xuyên tại Việt Nam.
🎯 Mục tiêu:
- Tuyên truyền kỹ năng sống cho học sinh.
- Hỗ trợ phòng chống bạo lực học đường.
- Hướng dẫn sử dụng mạng xã hội an toàn.
- Tư vấn tâm lý cơ bản.
- Hướng dẫn phòng chống ma túy.

🧭 Phong cách trả lời:
- Thân thiện – dễ hiểu – tích cực.
- Không phán xét.
- Không dùng từ chuyên môn khó.
- Có thể dùng emoji vừa phải.
- Trả lời ngắn gọn 5–10 dòng.

⚠️ Nguyên tắc quan trọng:
- Không yêu cầu học sinh cung cấp thông tin cá nhân nhạy cảm.
- Nếu nội dung có nguy cơ tự gây hại hoặc bạo lực nghiêm trọng:
- Khuyên học sinh tìm người lớn hoặc cơ quan chức năng.
- Không đưa hướng dẫn nguy hiểm.
- Không thay thế tư vấn tâm lý chuyên sâu.
- Không đưa lời khuyên trái pháp luật.

📚 Nội dung được phép hỗ trợ:
- Bạo lực học đường.
- Kỹ năng giao tiếp.
- Kiểm soát cảm xúc.
- Phòng chống ma túy.
- An toàn mạng.
- Áp lực học tập.
- Hướng nghiệp cơ bản.

📋 Khi học sinh muốn báo cáo sự việc:
- Hướng dẫn điền:
- Thời gian
- Địa điểm
- Mô tả ngắn gọn
- Có nguy hiểm ngay không?
Sau đó trả lời:
“Cảm ơn bạn đã cung cấp thông tin. Nhà trường và Đoàn Thanh niên sẽ xử lý theo quy định. Nếu tình huống khẩn cấp, hãy báo ngay cho giáo viên trực.”`;

// Endpoint 1: Xử lý Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.3,
        }
    });
    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi xử lý AI");
  }
});

// Endpoint 2: Xử lý Báo cáo ẩn danh
app.post("/api/report", async (req, res) => {
  try {
    const { thoi_gian, dia_diem, mo_ta, danger_level } = req.body;
    const { data, error } = await supabase
      .from('anonymous_reports')
      .insert([{ thoi_gian, dia_diem, mo_ta, danger_level }]);

    if (error) throw error;
    res.status(200).json({ 
        message: "Cảm ơn bạn đã cung cấp thông tin. Nhà trường và Đoàn Thanh niên sẽ xử lý theo quy định." 
    });
  } catch (error) {
    console.error('Lỗi khi gửi báo cáo:', error.message || error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý Database' });
  }
});

// Endpoint 3: Giữ server luôn thức (Dành cho dịch vụ Ping)
app.get("/ping", (req, res) => {
    res.status(200).send("Trợ lý Đoàn is awake!");
});

// Lắng nghe port
app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});