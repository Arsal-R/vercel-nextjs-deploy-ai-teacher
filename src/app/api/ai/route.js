import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

const formalExample = {
  japanese: [
    { word: "日本", reading: "にほん" },
    { word: "に" },
    { word: "住んで", reading: "すんで" },
    { word: "います" },
    { word: "か" },
    { word: "?" },
  ],
  grammarBreakdown: [
    {
      english: "Do you live in Japan?",
      japanese: [
        { word: "日本", reading: "にほん" },
        { word: "に" },
        { word: "住んで", reading: "すんで" },
        { word: "います" },
        { word: "か" },
        { word: "?" },
      ],
      chunks: [
        {
          japanese: [{ word: "日本", reading: "にほん" }],
          meaning: "Japan",
          grammar: "Noun",
        },
        {
          japanese: [{ word: "に" }],
          meaning: "in",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "住んで", reading: "すんで" }, { word: "います" }],
          meaning: "live",
          grammar: "Verb + て form + います",
        },
        {
          japanese: [{ word: "か" }],
          meaning: "question",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "?" }],
          meaning: "question",
          grammar: "Punctuation",
        },
      ],
    },
  ],
};

const casualExample = {
  japanese: [
    { word: "日本", reading: "にほん" },
    { word: "に" },
    { word: "住んで", reading: "すんで" },
    { word: "いる" },
    { word: "の" },
    { word: "?" },
  ],
  grammarBreakdown: [
    {
      english: "Do you live in Japan?",
      japanese: [
        { word: "日本", reading: "にほん" },
        { word: "に" },
        { word: "住んで", reading: "すんで" },
        { word: "いる" },
        { word: "の" },
        { word: "?" },
      ],
      chunks: [
        {
          japanese: [{ word: "日本", reading: "にほん" }],
          meaning: "Japan",
          grammar: "Noun",
        },
        {
          japanese: [{ word: "に" }],
          meaning: "in",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "住んで", reading: "すんで" }, { word: "いる" }],
          meaning: "live",
          grammar: "Verb + て form + いる",
        },
        {
          japanese: [{ word: "の" }],
          meaning: "question",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "?" }],
          meaning: "question",
          grammar: "Punctuation",
        },
      ],
    },
  ],
};

export async function GET(req) {
  const speech = req.nextUrl.searchParams.get("speech") || "formal";
  const speechExample = speech === "formal" ? formalExample : casualExample;

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an AI teacher, you should answer every question of student related to studies, and act like a teacher.`,
      },
      {
        role: "user",
        content: req.nextUrl.searchParams.get("question") || "Hello"
      },
    ],
    // model: "gpt-4-turbo-preview", // https://platform.openai.com/docs/models/gpt-4-and-gpt-4-turbo
    model: "gpt-3.5-turbo"
  });
  console.log(chatCompletion.choices[0].message.content);
  return Response.json({answer: chatCompletion.choices[0].message.content});
}