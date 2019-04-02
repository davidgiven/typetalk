class JsxWindowProps {
    title: string = "";
    id?: string;
    class?: string;
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
