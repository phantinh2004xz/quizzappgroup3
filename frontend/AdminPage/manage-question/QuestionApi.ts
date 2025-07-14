import axios from 'axios';

export interface QuestionOption {
  text: string;
  correct: boolean;
}

export interface Question {
  questionBankId: string;
  id?: string;
  bankId: string;
  content: string;
  type: 'truefalse' | 'single' | 'multiple';
  level: 'easy' | 'medium' | 'hard';
  options: QuestionOption[];
  answer?: string;
}

const API_URL = 'http://localhost:8080/api/question-banks';

export const fetchQuestions = async (bankId: string): Promise<Question[]> => {
  const response = await axios.get<Question[]>('http://localhost:8080/api/questions', {
    params: { questionBankId: bankId }
  });
  return response.data;
};

export const createQuestion = async (bankId: string, data: Omit<Question, 'id'|'bankId'>): Promise<Question> => {
  const response = await axios.post<Question>('http://localhost:8080/api/questions', {
    ...data,
    questionBankId: bankId
  });
  return response.data;
};

export const updateQuestion = async (id: string, data: Partial<Question>): Promise<Question> => {
  const response = await axios.put<Question>(`http://localhost:8080/api/questions/${id}`, data);
  return response.data;
};

export const deleteQuestion = async (bankId: string, id: string): Promise<void> => {
  await axios.delete('http://localhost:8080/api/questions', {
    params: { id, questionBankId: bankId }
  });
};

export const getQuestionById = async (bankId: string, id: string): Promise<Question> => {
  const response = await axios.get<Question>(`http://localhost:8080/api/questions/${id}`);
  return response.data;
}; 