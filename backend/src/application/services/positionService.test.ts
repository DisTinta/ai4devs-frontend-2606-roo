import { getCandidatesByPositionService } from './positionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    application: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('getCandidatesByPositionService', () => {
  it('should return candidates with their average scores', async () => {
    const mockApplications = [
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date(),
        currentInterviewStep: 1,
        notes: null,
        candidate: { id: 10, firstName: 'John', lastName: 'Doe' },
        interviewStep: { name: 'Technical Interview' },
        interviews: [{ score: 5 }, { score: 3 }],
      },
    ];

    jest
      .spyOn(prisma.application, 'findMany')
      .mockResolvedValue(mockApplications);

    const result = await getCandidatesByPositionService(1);
    expect(result).toEqual([
      {
        fullName: 'John Doe',
        currentInterviewStep: 'Technical Interview',
        currentInterviewStepId: 1,
        averageScore: 4,
        id: 10,
        applicationId: 1,
      },
    ]);
  });

  it('should expose the numeric stage id from the application FK', async () => {
    const mockApplications = [
      {
        id: 2,
        positionId: 1,
        candidateId: 2,
        applicationDate: new Date(),
        currentInterviewStep: 11,
        notes: null,
        candidate: { id: 20, firstName: 'Ada', lastName: 'Lovelace' },
        interviewStep: { name: 'Technical' },
        interviews: [],
      },
    ];

    jest
      .spyOn(prisma.application, 'findMany')
      .mockResolvedValue(mockApplications);

    const result = await getCandidatesByPositionService(1);
    expect(result[0].currentInterviewStepId).toBe(11);
    expect(result[0].currentInterviewStep).toBe('Technical');
    expect(result[0].averageScore).toBe(0);
  });
});
