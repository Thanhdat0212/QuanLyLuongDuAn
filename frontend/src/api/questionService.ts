/**
 * Question Bank API service
 * Gọi các endpoint /api/teacher/questions của backend.
 */
import { apiClient, unwrap } from './client';
import type { ApiResponse, PageResponse } from '../types/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false';
export type QuestionStatus = 'active' | 'inactive';

export interface ChoiceResponse {
  id: string;
  content: string;
  isCorrect: boolean | null;  // null khi trả cho student đang làm bài
  position: number;
}

export interface QuestionResponse {
  id: string;
  content: string;
  explanation: string | null;
  difficulty: Difficulty;
  type: QuestionType;
  status: QuestionStatus;
  usageCount: number;
  categoryId: string | null;
  categoryName: string | null;
  chapterId: string | null;
  chapterTitle: string | null;
  createdAt: string;
  choices: ChoiceResponse[];
}

export interface QuestionStatsResponse {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  totalActive: number;
}

export interface CreateQuestionRequest {
  categoryId: string;
  chapterId?: string;
  content: string;
  explanation?: string;
  difficulty: Difficulty;
  type: QuestionType;
  choices: Array<{ content: string; isCorrect: boolean }>;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createQuestion(req: CreateQuestionRequest): Promise<QuestionResponse> {
  const res = await apiClient.post<ApiResponse<QuestionResponse>>(
    '/api/teacher/questions', req);
  return unwrap(res.data);
}

export interface ListQuestionsParams {
  chapterId?: string;
  difficulty?: Difficulty;
  status?: QuestionStatus;
  page?: number;
  size?: number;
}

export async function listQuestions(params: ListQuestionsParams = {}):
    Promise<PageResponse<QuestionResponse>> {
  const res = await apiClient.get<ApiResponse<PageResponse<QuestionResponse>>>(
    '/api/teacher/questions', {
      params: { ...params, page: params.page ?? 0, size: params.size ?? 20 },
    });
  return unwrap(res.data);
}

export async function getQuestion(questionId: string): Promise<QuestionResponse> {
  const res = await apiClient.get<ApiResponse<QuestionResponse>>(
    `/api/teacher/questions/${questionId}`);
  return unwrap(res.data);
}

export async function updateQuestion(questionId: string,
                                      req: CreateQuestionRequest): Promise<QuestionResponse> {
  const res = await apiClient.put<ApiResponse<QuestionResponse>>(
    `/api/teacher/questions/${questionId}`, req);
  return unwrap(res.data);
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await apiClient.delete(`/api/teacher/questions/${questionId}`);
}

export async function getQuestionStats(chapterId: string): Promise<QuestionStatsResponse> {
  const res = await apiClient.get<ApiResponse<QuestionStatsResponse>>(
    `/api/teacher/questions/stats/${chapterId}`);
  return unwrap(res.data);
}

export interface BulkImportResult {
  created: number;
  failed: number;
}

export async function bulkCreateQuestions(
  requests: CreateQuestionRequest[],
): Promise<BulkImportResult> {
  const res = await apiClient.post<ApiResponse<BulkImportResult>>(
    '/api/teacher/questions/bulk', requests);
  return unwrap(res.data);
}
