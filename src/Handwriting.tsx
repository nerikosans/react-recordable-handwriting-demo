import {
  FC,
  useCallback,
  useRef,
  useState,
  MouseEvent,
  MouseEventHandler,
  TouchEvent,
  TouchEventHandler,
  useEffect,
} from 'react';
import styled from 'styled-components';

type Position = [number, number];
type Segment = {
  anchors: Position[];
  interval: number;
  continuous: boolean;
};
export type DrawingData = Segment[];

const ANCHOR_INTERVAL = 10;
const SEGMENT_THRES = 100;

const getNow = () => new Date().getTime();

const Handwriting: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseDown, setMouseDown] = useState(false);

  const [history, setHistory] = useState<Segment[]>([]);
  const [, setCurrentSegment] = useState<Segment | null>(null);
  const [lastAnchorTime, setLastAnchorTime] = useState(0);

  const [textareaValue, setTextareaValue] = useState('');

  const drawingColor = 'rgb(0,0,0)';
  const currentLineWidth = 5;

  const pushPosition = useCallback((pos: Position) => {
    setCurrentSegment((prev) => {
      if (prev === null) return null;
      setLastAnchorTime(getNow());

      return {
        ...prev,
        anchors: [...prev.anchors, pos],
      };
    });
  }, []);

  const startSegment = useCallback(
    (initPos: Position, interval: number, continuous: boolean) => {
      setCurrentSegment((prev) => {
        if (prev !== null) return prev;
        return {
          anchors: [initPos],
          interval,
          continuous,
        };
      });
      setLastAnchorTime(getNow());
    },
    []
  );

  const endSegment = useCallback(() => {
    setCurrentSegment((seg) => {
      if (seg !== null) {
        setHistory((prevHistory) => [...prevHistory, seg]);
      }
      return null;
    });
  }, []);

  const getSerialized = useCallback(() => {
    return JSON.stringify(history);
  }, [history]);

  const getCanvasMousePosition = useCallback(
    (e: MouseEvent<HTMLCanvasElement>): Position | null => {
      if (canvasRef.current === null) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);
      return [x, y];
    },
    []
  );

  const getCanvasTouchPosition = useCallback(
    (e: TouchEvent<HTMLCanvasElement>): Position | null => {
      if (canvasRef.current === null) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.floor(e.touches[0].clientX - rect.left);
      const y = Math.floor(e.touches[0].clientY - rect.top);
      return [x, y];
    },
    []
  );

  const beginPath = useCallback((startPos: Position) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = currentLineWidth;
    ctx.beginPath();
    ctx.moveTo(startPos[0], startPos[1]);
  }, []);

  const lineTo = useCallback((pos: Position) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(pos[0], pos[1]);
    ctx.stroke();
  }, []);

  const clearCanvas = useCallback(() => {
    setLastAnchorTime(0);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const onDrawStart = useCallback(
    (pos: Position) => {
      setMouseDown(true);
      const interval = lastAnchorTime === 0 ? 0 : getNow() - lastAnchorTime;

      if (canvasRef.current === null) return;
      startSegment(pos, interval, false);

      beginPath(pos);
    },
    [beginPath, lastAnchorTime, startSegment]
  );

  const onDrawMove = useCallback(
    (pos: Position) => {
      if (canvasRef.current === null) return;
      if (!mouseDown) return;

      const now = getNow();
      if (now < lastAnchorTime + ANCHOR_INTERVAL) return;
      lineTo(pos);
      if (now < lastAnchorTime + SEGMENT_THRES) {
        pushPosition(pos);
        return;
      }
      endSegment();
      startSegment(pos, now - lastAnchorTime, true);
    },
    [endSegment, lastAnchorTime, lineTo, mouseDown, pushPosition, startSegment]
  );

  const onDrawEnd = useCallback(() => {
    if (canvasRef.current === null) return;
    setMouseDown(false);
    endSegment();
  }, [endSegment]);

  const onMouseDown: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const pos = getCanvasMousePosition(e);
      pos && onDrawStart(pos);
    },
    [getCanvasMousePosition, onDrawStart]
  );

  const onMouseMove: MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const pos = getCanvasMousePosition(e);
      pos && onDrawMove(pos);
    },
    [getCanvasMousePosition, onDrawMove]
  );

  const onMouseUp: MouseEventHandler<HTMLCanvasElement> = useCallback(() => {
    onDrawEnd();
  }, [onDrawEnd]);

  const onTouchStart: TouchEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const pos = getCanvasTouchPosition(e);
      pos && onDrawStart(pos);
    },
    [getCanvasTouchPosition, onDrawStart]
  );

  const onTouchMove: TouchEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const pos = getCanvasTouchPosition(e);
      pos && onDrawMove(pos);
    },
    [getCanvasTouchPosition, onDrawMove]
  );

  const onTouchEnd: TouchEventHandler<HTMLCanvasElement> = useCallback(() => {
    onDrawEnd();
  }, [onDrawEnd]);

  const onClear = useCallback(() => {
    clearCanvas();
    setHistory([]);
    setCurrentSegment(null);
  }, [clearCanvas]);

  const playSegment = useCallback(
    (seg: Segment) => {
      if (seg.continuous) {
        seg.anchors.forEach((pos, i) => {
          setTimeout(() => {
            lineTo(pos);
          }, i * ANCHOR_INTERVAL);
        });
      } else {
        beginPath(seg.anchors[0]);

        seg.anchors.slice(1).forEach((pos, i) => {
          setTimeout(() => {
            lineTo(pos);
          }, (i + 1) * ANCHOR_INTERVAL);
        });
      }
    },
    [beginPath, lineTo]
  );

  const playData = useCallback(() => {
    const data = JSON.parse(textareaValue) as DrawingData;
    clearCanvas();

    let totalDelay = 0;
    for (const seg of data) {
      totalDelay += seg.interval;
      setTimeout(() => {
        playSegment(seg);
      }, totalDelay);
      totalDelay += seg.anchors.length * ANCHOR_INTERVAL;
    }
  }, [clearCanvas, playSegment, textareaValue]);

  return (
    <Wrapper>
      <CanvasWrapper>
        <Canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          width={400}
          height={592}
        />
      </CanvasWrapper>

      <Buttons>
        <Button onClick={() => setTextareaValue(getSerialized())}>
          ↓ Serialize
        </Button>
        <Button onClick={playData}>↑ Play data</Button>
        <Button onClick={onClear}>Clear canvas</Button>
      </Buttons>

      <DataTitle>Serialized data</DataTitle>

      <DataArea
        value={textareaValue}
        onChange={(e) => setTextareaValue(e.target.value)}
        rows={5}
        cols={50}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  text-align: center;
`;

const CanvasWrapper = styled.div`
  background-color: white;
  display: inline-block;
  margin: 0 auto;
`;

const Canvas = styled.canvas`
  width: 400px;
  height: 592px;
  border: 1px solid #000;
  margin: 0 auto;
  display: block;
`;

const Buttons = styled.div`
  margin: 1rem auto;
`;

const DataTitle = styled.div`
  font-size: 1.2rem;
  text-align: center;
`;

const DataArea = styled.textarea``;

const Button = styled.button`
  margin: 0 1rem;
`;

export default Handwriting;
