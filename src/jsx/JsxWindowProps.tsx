class JsxWindowProps {
    id?: string;
    title: string = "";
    style?: any;
    resizeable?: boolean;
    x?: string;
    y?: string;
    width?: string;
    height?: string;
    minWidth?: number;
    minHeight?: number;

    onClose?: () => void;
};
