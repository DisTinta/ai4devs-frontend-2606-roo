import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { mockPositions } from "./Positions";
import {
  getInterviewFlow,
  getCandidates,
  updateCandidateStage,
  InterviewFlow,
  Candidate,
} from "../services/positionService";
import CandidateCard from "./CandidateCard";

const knownPositionIds = mockPositions.map((position) => position.id);

// Groups candidates by their numeric stage id, dropping any whose id is absent
// from the loaded flow's step ids (the documented fallback: omit + console.warn,
// per ADR 20260908). Keying on the id — not the stage name — is what makes the
// placement robust to duplicate stage names.
const groupByStageId = (
  candidates: Candidate[],
  stepIds: number[],
): Map<number, Candidate[]> => {
  const known = new Set(stepIds);
  const groups = new Map<number, Candidate[]>();

  candidates.forEach((candidate) => {
    if (!known.has(candidate.currentInterviewStepId)) {
      console.warn(
        `Candidate ${candidate.id} has an unknown stage id ${candidate.currentInterviewStepId}; omitting from the board.`,
      );
      return;
    }
    const bucket = groups.get(candidate.currentInterviewStepId) ?? [];
    bucket.push(candidate);
    groups.set(candidate.currentInterviewStepId, bucket);
  });

  return groups;
};

// A candidate card that can be picked up and dragged. It carries its source
// column (`stepId`) and `applicationId` as drag data so the drop handler can
// address the stage change by numeric id. Disabled while its move is in flight.
const DraggableCard: React.FC<{
  candidate: Candidate;
  stepId: number;
  disabled: boolean;
}> = ({ candidate, stepId, disabled }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: candidate.id,
    data: { applicationId: candidate.applicationId, stepId },
    disabled,
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <CandidateCard candidate={candidate} />
    </div>
  );
};

// A stage column that accepts dropped cards. Its droppable id is the numeric
// step id, so the drop handler reads the destination stage straight off `over`.
const DroppableColumn: React.FC<{
  stepId: number;
  title: string;
  children: React.ReactNode;
}> = ({ stepId, title, children }) => {
  const { setNodeRef } = useDroppable({ id: stepId });

  return (
    <Col ref={setNodeRef} className="mb-4">
      <h3 className="h5">{title}</h3>
      {children}
    </Col>
  );
};

const PositionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isKnown =
    Number.isInteger(numericId) && knownPositionIds.includes(numericId);

  const [flow, setFlow] = useState<InterviewFlow | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  // Candidate ids whose stage-change request is in flight; those cards are
  // locked against further moves until the request settles (HU-4 scenario E).
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // On failure/404 the shell stays mounted and no columns render (HU-5 owns
    // the rich loading/error/empty states; HU-2 only guarantees "no crash").
    getInterviewFlow(numericId)
      .then((result) => {
        if (active) {
          setFlow(result);
        }
      })
      .catch(() => {
        if (active) {
          setFlow(null);
        }
      });

    // Candidates are fetched independently: a candidates failure leaves the
    // HU-2 columns mounted with no cards (HU-3 only guarantees "no crash").
    getCandidates(numericId)
      .then((result) => {
        if (active) {
          setCandidates(result);
        }
      })
      .catch(() => {
        if (active) {
          setCandidates([]);
        }
      });

    return () => {
      active = false;
    };
  }, [numericId]);

  // Drop handler: move the card optimistically, persist, and roll back on
  // failure. Same-column drops and in-flight cards are no-ops (scenarios D/E).
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const candidateId = Number(active.id);
    const destStepId = Number(over.id);
    const data = (active.data?.current ?? {}) as {
      applicationId?: number;
      stepId?: number;
    };
    const sourceStepId = Number(data.stepId);
    const applicationId = Number(data.applicationId);

    if (destStepId === sourceStepId) {
      return; // Same-column drop: no request, nothing changes (scenario D).
    }
    if (locked.has(candidateId)) {
      return; // Already moving: ignore until it settles (scenario E).
    }

    // Optimistic move: the card appears in the destination column immediately,
    // before the response arrives (scenario B).
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, currentInterviewStepId: destStepId }
          : candidate,
      ),
    );
    setLocked((prev) => new Set(prev).add(candidateId));
    setError(null);

    const unlock = () =>
      setLocked((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });

    updateCandidateStage(candidateId, applicationId, destStepId)
      .then(unlock)
      .catch(() => {
        // Roll back to the original column and surface the error (scenario C).
        setCandidates((prev) =>
          prev.map((candidate) =>
            candidate.id === candidateId
              ? { ...candidate, currentInterviewStepId: sourceStepId }
              : candidate,
          ),
        );
        unlock();
        setError("No se pudo mover al candidato. Inténtalo de nuevo.");
      });
  };

  const groups = flow
    ? groupByStageId(
        candidates,
        flow.steps.map((step) => step.id),
      )
    : new Map<number, Candidate[]>();

  return (
    <Container className="mt-5">
      <div className="d-flex align-items-center mb-4">
        <Link
          to="/positions"
          className="btn btn-link me-3"
          aria-label="Volver a posiciones"
        >
          ←
        </Link>
        <h2 className="mb-0">{flow ? flow.positionName : `Posición ${id}`}</h2>
      </div>
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      {flow ? (
        <DndContext onDragEnd={handleDragEnd}>
          <Row>
            {flow.steps.map((step) => (
              <DroppableColumn key={step.id} stepId={step.id} title={step.name}>
                {(groups.get(step.id) ?? []).map((candidate) => (
                  <DraggableCard
                    key={candidate.applicationId}
                    candidate={candidate}
                    stepId={step.id}
                    disabled={locked.has(candidate.id)}
                  />
                ))}
              </DroppableColumn>
            ))}
          </Row>
        </DndContext>
      ) : isKnown ? (
        <p className="text-muted">Detalle de la posición en construcción.</p>
      ) : (
        <p className="text-muted">Posición no encontrada.</p>
      )}
    </Container>
  );
};

export default PositionDetail;
