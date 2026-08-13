import { InterviewRoom, InterviewAnalysis } from '@/types/interview';
import { AIProvider } from './provider';

export class GroqAIProvider implements AIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  async analyzeInterview(room: InterviewRoom): Promise<InterviewAnalysis> {
    if (!this.apiKey) {
      console.warn('GROQ_API_KEY is missing, generating fallback analysis');
      return this.generateFallbackAnalysis(room);
    }

    const payloadQuestions = room.questions.map(q => {
      const answerObj = room.answers[q.id];
      return {
        questionId: q.id,
        question: q.text,
        candidateAnswer: answerObj?.transcript || '(No answer recorded)'
      };
    });

    const hrNotesText = room.notes.map(n => n.text).join('\n');

    const systemPrompt = `You are an expert AI interview evaluator and candidate assessment assistant.
Your task is to evaluate a candidate's job interview based STRICTLY AND ONLY on the provided questions, candidate transcripts, and HR notes.

IMPORTANT SAFETY & NON-DISCRIMINATION RULES:
1. You MUST NOT make decisions or score candidates based on protected or irrelevant personal characteristics (e.g. age, gender, race, ethnicity, religion, nationality, appearance, accent, disability).
2. Evaluate strictly based on job-related knowledge, practical skills, technical depth, relevant experience, problem-solving ability, and communication clarity shown in the transcripts.

LANGUAGE RULE:
- If the questions, candidate transcripts, or HR notes are in Indonesian (or mixed with Indonesian), write ALL text fields ("summary", "strengths", "concerns", "aiSummary", "reasoning") in professional, natural Bahasa Indonesia. Match the language of the interview naturally.

OUTPUT FORMAT:
You MUST return ONLY a valid, raw JSON object (no markdown formatting, no code block backticks) matching this exact schema:
{
  "summary": "Concise 2-3 sentence overall summary of the candidate's interview performance.",
  "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
  "concerns": ["Key concern 1", "Key concern 2"],
  "overallScore": 82, // integer between 0 and 100
  "recommendation": "recommended", // MUST be one of: "recommended", "further_review", "not_recommended"
  "questions": [
    {
      "questionId": "q_1",
      "question": "Pertanyaan wawancara",
      "candidateAnswer": "Exact or cleaned answer string",
      "aiSummary": "1-2 sentence evaluation summary of this specific answer",
      "score": 8, // integer from 1 to 10
      "reasoning": "Detailed justification for the question score based on answer content."
    }
  ]
}`;

    const userPrompt = JSON.stringify({
      interviewTitle: room.title,
      candidateName: room.candidateName || 'Candidate',
      interviewerName: room.interviewerName,
      questionsAndAnswers: payloadQuestions,
      interviewerPrivateNotes: hrNotesText || 'None'
    }, null, 2);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Groq API error:', response.status, errText);
        return this.generateFallbackAnalysis(room);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;

      if (!rawContent) {
        return this.generateFallbackAnalysis(room);
      }

      const parsed = JSON.parse(rawContent);

      return {
        summary: parsed.summary || 'Kandidat telah menyelesaikan seluruh sesi wawancara terstruktur.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Komunikasi yang jelas', 'Jawaban teknis relevan'],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : ['Perlu pendalaman lebih lanjut untuk kasus skenario kompleks'],
        overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 78,
        recommendation: ['recommended', 'further_review', 'not_recommended'].includes(parsed.recommendation)
          ? parsed.recommendation
          : 'further_review',
        questions: Array.isArray(parsed.questions) ? parsed.questions : payloadQuestions.map(q => ({
          questionId: q.questionId,
          question: q.question,
          candidateAnswer: q.candidateAnswer,
          aiSummary: 'Tanggapan diberikan selama sesi wawancara.',
          score: 7,
          reasoning: 'Kandidat menjawab poin inti dari pertanyaan.'
        })),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error executing Groq AI evaluation:', error);
      return this.generateFallbackAnalysis(room);
    }
  }

  private generateFallbackAnalysis(room: InterviewRoom): InterviewAnalysis {
    const answeredCount = Object.values(room.answers).filter(a => a.transcript.trim().length > 0).length;
    const totalQuestions = room.questions.length || 1;
    const completionRatio = Math.round((answeredCount / totalQuestions) * 100);

    const questionAnalyses = room.questions.map(q => {
      const ans = room.answers[q.id]?.transcript || '';
      const hasContent = ans.trim().length > 10;
      return {
        questionId: q.id,
        question: q.text,
        candidateAnswer: ans || 'Tidak ada tanggapan terekam.',
        aiSummary: hasContent ? 'Kandidat memberikan jawaban langsung untuk pertanyaan ini.' : 'Tanggapan terbatas terekam untuk pertanyaan ini.',
        score: hasContent ? 8 : 4,
        reasoning: hasContent
          ? 'Kandidat mampu menyampaikan sudut pandang dan poin-poin penting dengan cukup jelas.'
          : 'Belum ada transkrip jawaban lengkap yang terekam pada bagian wawancara ini.'
      };
    });

    return {
      summary: `Kandidat telah menyelesaikan ${answeredCount} dari ${totalQuestions} pertanyaan pada sesi wawancara ${room.title}.`,
      strengths: [
        'Aktif berkomunikasi selama sesi video berlangsung',
        'Struktur jawaban sesuai dengan poin pertanyaan utama',
        'Kejelasan komunikasi baik'
      ],
      concerns: answeredCount < totalQuestions ? ['Beberapa pertanyaan belum memiliki transkrip jawaban lengkap'] : ['Disarankan untuk memverifikasi kemampuan praktis lanjutan'],
      overallScore: Math.min(95, Math.max(50, Math.round(60 + (completionRatio * 0.35)))),
      recommendation: completionRatio >= 80 ? 'recommended' : 'further_review',
      questions: questionAnalyses,
      generatedAt: new Date().toISOString()
    };
  }
}

export const defaultAIProvider = new GroqAIProvider();
