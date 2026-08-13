import { InterviewRoom, InterviewAnalysis } from '@/types/interview';

export interface AIProvider {
  analyzeInterview(room: InterviewRoom): Promise<InterviewAnalysis>;
}
