import fetch from "node-fetch";

const apiKey = process.env.GROQ_API_KEY;
const model   = "llama-3.3-70b-versatile";   // <-- di sini error

export async function generateAnswer(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  // ...
}