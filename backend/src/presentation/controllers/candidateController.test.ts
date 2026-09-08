import { updateCandidateStageController } from './candidateController';
import { Request, Response } from 'express';
import { updateCandidateStage } from '../../application/services/candidateService';

jest.mock('../../application/services/candidateService');

describe('updateCandidateStageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and updated candidate stage', async () => {
    const req = {
      params: { id: '1' },
      body: { applicationId: 1, currentInterviewStep: 2 },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    (updateCandidateStage as jest.Mock).mockResolvedValue({
      id: 1,
      applicationId: 1,
      candidateId: 1,
      currentInterviewStep: 2,
    });

    await updateCandidateStageController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Candidate stage updated successfully',
      data: {
        id: 1,
        applicationId: 1,
        candidateId: 1,
        currentInterviewStep: 2,
      },
    });
  });

  it('should return 400 and persist nothing when applicationId is missing/malformed', async () => {
    const req = {
      params: { id: '1' },
      body: { currentInterviewStep: 2 },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await updateCandidateStageController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateCandidateStage).not.toHaveBeenCalled();
  });

  it('should return 400 and persist nothing when currentInterviewStep is missing/malformed', async () => {
    const req = {
      params: { id: '1' },
      body: { applicationId: 1 },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await updateCandidateStageController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateCandidateStage).not.toHaveBeenCalled();
  });
});
