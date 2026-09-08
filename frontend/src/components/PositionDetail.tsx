import React, { useCallback, useEffect, useRef, useState } from "react";
import { Container, Spinner, Alert, Button } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { mockPositions } from "./Positions";
import {
  getInterviewFlow,
  getCandidates,
  updateCandidateStage,
  InterviewFlow,
  Candidate,
} from "../services/positionService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import CandidateCard from "./CandidateCard";

const knownPositionIds = mockPositions.map((position) => position.id);

// Per-fetch status so an empty success (`[]`) is never confused with a failure
// (HU-5). `data` carries the last resolved value; `error` marks a rejection.
type FetchStatus = "loading" | "success" | "error";
interface FlowState {
  status: FetchStatus;
  data?: InterviewFlow;
}
interface CandidatesState {
  status: FetchStatus;
  data: Candidate[];
}

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
// An empty column renders its placeholder as a child, so the column stays a
// valid drop target with zero cards (HU-5 keeps it droppable for HU-4).
const DroppableColumn: React.FC<{
  stepId: number;
  title: string;
  children: React.ReactNode;
}> = ({ stepId, title, children }) => {
  const { setNodeRef } = useDroppable({ id: stepId });

  // Below md this stacks full-width (flex-column parent); at md+ it keeps a min
  // width and does not shrink, so the row overflows and scrolls horizontally.
  return (
    <div
      ref={setNodeRef}
      data-testid="board-column"
      className="board-column mb-4 flex-md-shrink-0"
      style={{ minWidth: "16rem" }}
    >
      <h3 className="h5">{title}</h3>
      {children}
    </div>
  );
};

const PositionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const isKnown =
    Number.isInteger(numericId) && knownPositionIds.includes(numericId);

  const [flowState, setFlowState] = useState<FlowState>({ status: "loading" });
  const [candidatesState, setCandidatesState] = useState<CandidatesState>({
    status: "loading",
    data: [],
  });
  // Candidate ids whose stage-change request is in flight; those cards are
  // locked against further moves until the request settles (HU-4 scenario E).
  const [locked, setLocked] = useState<Set<number>>(new Set());
  // Per-card move error (HU-4 rollback message), distinct from fetch errors.
  const [moveError, setMoveError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Mouse drags immediately; touch needs a long-press (delay + tolerance) so a
  // short swipe scrolls the page and only a held press starts a drag (HU-6).
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  // Independent fetch runners so a retry re-issues only the failed request
  // (HU-5 granular retry).
  const loadFlow = useCallback(() => {
    setFlowState({ status: "loading" });
    getInterviewFlow(numericId)
      .then((result) => {
        if (mounted.current) {
          setFlowState({ status: "success", data: result });
        }
      })
      .catch(() => {
        if (mounted.current) {
          setFlowState({ status: "error" });
        }
      });
  }, [numericId]);

  const loadCandidates = useCallback(() => {
    setCandidatesState({ status: "loading", data: [] });
    getCandidates(numericId)
      .then((result) => {
        if (mounted.current) {
          setCandidatesState({ status: "success", data: result });
        }
      })
      .catch(() => {
        if (mounted.current) {
          setCandidatesState({ status: "error", data: [] });
        }
      });
  }, [numericId]);

  useEffect(() => {
    // Unknown ids never hit the network; they render the not-found shell.
    if (!isKnown) {
      return;
    }
    loadFlow();
    loadCandidates();
  }, [isKnown, loadFlow, loadCandidates]);

  // Drop handler: move the card optimistically, persist, and roll back on
  // failure. Same-column drops and in-flight cards are no-ops (HU-4).
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
      return; // Same-column drop: no request, nothing changes (HU-4).
    }
    if (locked.has(candidateId)) {
      return; // Already moving: ignore until it settles (HU-4).
    }

    const moveTo = (stepId: number) =>
      setCandidatesState((prev) => ({
        ...prev,
        data: prev.data.map((candidate) =>
          candidate.id === candidateId
            ? { ...candidate, currentInterviewStepId: stepId }
            : candidate,
        ),
      }));

    // Optimistic move before the response arrives (HU-4).
    moveTo(destStepId);
    setLocked((prev) => new Set(prev).add(candidateId));
    setMoveError(null);

    const unlock = () =>
      setLocked((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });

    updateCandidateStage(candidateId, applicationId, destStepId)
      .then(unlock)
      .catch(() => {
        moveTo(sourceStepId); // Roll back to the original column (HU-4).
        unlock();
        setMoveError("No se pudo mover al candidato. Inténtalo de nuevo.");
      });
  };

  const flowData = flowState.status === "success" ? flowState.data : undefined;
  const groups = flowData
    ? groupByStageId(
        candidatesState.data,
        flowData.steps.map((step) => step.id),
      )
    : new Map<number, Candidate[]>();

  const isLoading =
    isKnown &&
    (flowState.status === "loading" || candidatesState.status === "loading");
  const title = flowData ? flowData.positionName : `Posición ${id}`;

  const renderContent = () => {
    if (!isKnown) {
      return <p className="text-muted">Posición no encontrada.</p>;
    }
    if (isLoading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando…</span>
          </Spinner>
        </div>
      );
    }
    if (flowState.status === "error") {
      return (
        <Alert variant="danger">
          No se pudo cargar el proceso de la posición.{" "}
          <Button
            variant="link"
            className="p-0 align-baseline"
            onClick={loadFlow}
          >
            Reintentar
          </Button>
        </Alert>
      );
    }
    // Flow loaded: render the board. Candidates drive cards / empty / error.
    const flow = flowState.data as InterviewFlow;
    const candidatesEmpty =
      candidatesState.status === "success" && candidatesState.data.length === 0;

    return (
      <>
        {candidatesState.status === "error" && (
          <Alert variant="danger">
            No se pudieron cargar los candidatos.{" "}
            <Button
              variant="link"
              className="p-0 align-baseline"
              onClick={loadCandidates}
            >
              Reintentar
            </Button>
          </Alert>
        )}
        {candidatesEmpty && (
          <p className="text-muted">No hay candidatos en esta posición.</p>
        )}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            data-testid="board-columns"
            className="d-flex flex-column flex-md-row overflow-x-auto gap-3"
          >
            {flow.steps.map((step) => {
              const cards = groups.get(step.id) ?? [];
              return (
                <DroppableColumn
                  key={step.id}
                  stepId={step.id}
                  title={step.name}
                >
                  {cards.length === 0 ? (
                    <p className="text-muted small" data-testid="empty-column">
                      Sin candidatos en esta fase.
                    </p>
                  ) : (
                    cards.map((candidate) => (
                      <DraggableCard
                        key={candidate.applicationId}
                        candidate={candidate}
                        stepId={step.id}
                        disabled={locked.has(candidate.id)}
                      />
                    ))
                  )}
                </DroppableColumn>
              );
            })}
          </div>
        </DndContext>
      </>
    );
  };

  return (
    <Container className="mt-5">
      <div className="d-flex align-items-center mb-4">
        <Link
          to="/positions"
          className="btn btn-link me-3 flex-shrink-0"
          style={{ textDecoration: "none" }}
          aria-label="Volver a posiciones"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
        <h2 className="mb-0 text-break">{title}</h2>
      </div>
      {moveError && (
        <div role="alert" className="alert alert-danger">
          {moveError}
        </div>
      )}
      {renderContent()}
    </Container>
  );
};

export default PositionDetail;
