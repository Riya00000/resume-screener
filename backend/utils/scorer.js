const Groq = require('groq-sdk');



const scoreResume = async (resumeText, jobDescription) => {
  const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
  
  const prompt = `
You are an expert HR recruiter and resume screener.

You will be given a Job Description and a Resume. 
Your job is to analyze how well the resume matches the job description.

Return your response in this EXACT JSON format and nothing else:
{
  "score": <number between 0 and 100>,
  "matchedSkills": [<list of skills from resume that match the job>],
  "missingSkills": [<list of important skills from job that are missing in resume>],
  "experienceMatch": "<Poor | Fair | Good | Excellent>",
  "summary": "<2-3 sentence summary of the candidate and how well they fit>"
}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Respond with JSON only. No extra text.
`;

  const response = await groq.chat.completions.create({
    model:  'llama-3.3-70b-versatile', // free and fast
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });

  const rawText = response.choices[0].message.content;
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const result = JSON.parse(cleaned);

  return result;
};

module.exports = { scoreResume };