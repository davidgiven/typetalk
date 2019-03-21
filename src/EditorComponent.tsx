class EditorComponent extends RunnableComponent {
    private codeMirrorComponent: preact.Component<string, void>;

    constructor() {
        super();

        this.codeMirrorComponent = new class extends preact.Component<string, void> {
            codemirror: CodeMirror.EditorFromTextArea|null = null;
            textarea: HTMLTextAreaElement|null = null;

            componentDidMount() {
                if (this.textarea) {
                    this.codemirror = CodeMirror.fromTextArea(this.textarea);
                    this.codemirror.setValue(this.props);
                }
            }

            componentWillUnmount() {
                if (this.codemirror) {
                    this.codemirror.toTextArea();
                }
            }

            render() {
                return (
                    <div>
                        <textarea
                            ref={ref => this.textarea = ref as HTMLTextAreaElement}
                            value={this.props}
                        />
                    </div>
                );
            }
        };
    }

    render() {
        return <div>
            <div>
                <div>Class list goes here</div>
                <div>Class controls go here</div>
            </div>
            <div>
                {this.codeMirrorComponent}
                <div>Editor controls go here</div>
            </div>
        </div>;
    }

    name() {
        return "Editor";
    }

    run() {
        this.attachTo(document.body);
    }
}
