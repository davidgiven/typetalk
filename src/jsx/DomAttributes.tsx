interface DomAttributes {
	// Clipboard Events
	oncopy?: UiEventHandler<ClipboardEvent>;
	oncut?: UiEventHandler<ClipboardEvent>;
	onpaste?: UiEventHandler<ClipboardEvent>;

	// Composition Events
	oncompositionend?: UiEventHandler<CompositionEvent>;
	oncompositionstart?: UiEventHandler<CompositionEvent>;
	oncompositionupdate?: UiEventHandler<CompositionEvent>;

	// Focus Events
	onfocus?: UiEventHandler<FocusEvent>;
	onblur?: UiEventHandler<FocusEvent>;

	// Form Events
	onchange?: UiEventHandler<Event>;
	oninput?: UiEventHandler<Event>;
	onsubmit?: UiEventHandler<Event>;

	// Keyboard Events
	onkeydown?: UiEventHandler<KeyboardEvent>;
	onkeypress?: UiEventHandler<KeyboardEvent>;
	onkeyup?: UiEventHandler<KeyboardEvent>;

	// Media Events
	onabort?: UiEventHandler<Event>;
	oncanplay?: UiEventHandler<Event>;
	oncanplaythrough?: UiEventHandler<Event>;
	ondurationchange?: UiEventHandler<Event>;
	onemptied?: UiEventHandler<Event>;
	onencrypted?: UiEventHandler<Event>;
	onended?: UiEventHandler<Event>;
	onloadeddata?: UiEventHandler<Event>;
	onloadedmetadata?: UiEventHandler<Event>;
	onloadstart?: UiEventHandler<Event>;
	onpause?: UiEventHandler<Event>;
	onplay?: UiEventHandler<Event>;
	onplaying?: UiEventHandler<Event>;
	onprogress?: UiEventHandler<Event>;
	onratechange?: UiEventHandler<Event>;
	onseeked?: UiEventHandler<Event>;
	onseeking?: UiEventHandler<Event>;
	onstalled?: UiEventHandler<Event>;
	onsuspend?: UiEventHandler<Event>;
	ontimeupdate?: UiEventHandler<Event>;
	onvolumechange?: UiEventHandler<Event>;
	onwaiting?: UiEventHandler<Event>;

	// MouseEvents
	onclick?: UiEventHandler<MouseEvent>;
	oncontextmenu?: UiEventHandler<MouseEvent>;
	ondoubleclick?: UiEventHandler<MouseEvent>;
	ondrag?: UiEventHandler<DragEvent>;
	ondragend?: UiEventHandler<DragEvent>;
	ondragenter?: UiEventHandler<DragEvent>;
	ondragexit?: UiEventHandler<DragEvent>;
	ondragleave?: UiEventHandler<DragEvent>;
	ondragover?: UiEventHandler<DragEvent>;
	ondragstart?: UiEventHandler<DragEvent>;
	ondrop?: UiEventHandler<DragEvent>;
	onmousedown?: UiEventHandler<MouseEvent>;
	onmouseenter?: UiEventHandler<MouseEvent>;
	onmouseleave?: UiEventHandler<MouseEvent>;
	onmousemove?: UiEventHandler<MouseEvent>;
	onmouseout?: UiEventHandler<MouseEvent>;
	onmouseover?: UiEventHandler<MouseEvent>;
	onmouseup?: UiEventHandler<MouseEvent>;

	// Selection Events
	onselect?: UiEventHandler<Event>;

	// Touch Events
	ontouchcancel?: UiEventHandler<TouchEvent>;
	ontouchend?: UiEventHandler<TouchEvent>;
	ontouchmove?: UiEventHandler<TouchEvent>;
	ontouchstart?: UiEventHandler<TouchEvent>;

	// UI Events
	onscroll?: UiEventHandler<UIEvent>;

	// Wheel Events
	onwheel?: UiEventHandler<WheelEvent>;

	// Animation Events
	onanimationstart?: UiEventHandler<AnimationEvent>;
	onanimationend?: UiEventHandler<AnimationEvent>;
	onanimationiteration?: UiEventHandler<AnimationEvent>;

	// Transition Events
	ontransitionend?: UiEventHandler<TransitionEvent>;
}
