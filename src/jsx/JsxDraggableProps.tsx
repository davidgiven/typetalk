class JsxDraggableProps {
    style?: any;
    className?: string;
    onBegin?: (x: number, y: number) => void;
    onMove?: (x: number, y: number) => void;
    onEnd?: (x: number, y: number) => void;
}