// Global dictionary to store Monaco Editor instances
const qwebrEditorInstances = {};

// Function that builds and registers a Monaco Editor instance    
globalThis.qwebrCreateMonacoEditorInstance = function (
    initialCode, 
    qwebrCounter) {

  // Retrieve the previously created document elements
  let runButton = document.getElementById(`qwebr-button-run-${qwebrCounter}`);
  let editorDiv = document.getElementById(`qwebr-editor-${qwebrCounter}`);
  
  // Load the Monaco Editor and create an instance
  let editor;
  require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(editorDiv, {
      value: initialCode,
      language: 'r',
      theme: 'vs-dark',                // Use the vs-light theme
      automaticLayout: true,            // Works wonderfully with RevealJS
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      fontSize: '14px',                // Bootstrap is 1 rem
      renderLineHighlight: "none",     // Disable current line highlighting
      hideCursorInOverviewRuler: true  // Remove cursor indicator in right-hand side scroll bar
    });

    // Other editor initialization code remains the same...
    editor.__qwebrCounter = qwebrCounter;
    editor.__qwebrEditorId = `qwebr-editor-${qwebrCounter}`;
    editor.__qwebrinitialCode = initialCode;

    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      editorDiv.style.height = `${contentHeight}px`;
      editor.layout();
    };

    function isEmptyCodeText(selectedCodeText) {
      return (selectedCodeText === null || selectedCodeText === undefined || selectedCodeText === "");
    }

    const addWebRKeyboardShortCutCommands = () => {
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
        qwebrExecuteCode(editor.getValue(), editor.__qwebrCounter);
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        const selectedText = editor.getModel().getValueInRange(editor.getSelection());
        if (isEmptyCodeText(selectedText)) {
          let currentPosition = editor.getPosition();
          let currentLine = editor.getModel().getLineContent(currentPosition.lineNumber);
          let newPosition = new monaco.Position(currentPosition.lineNumber + 1, 1);

          if (newPosition.lineNumber > editor.getModel().getLineCount()) {
            editor.executeEdits("addNewLine", [{
              range: new monaco.Range(newPosition.lineNumber, 1, newPosition.lineNumber, 1),
              text: "\n", 
              forceMoveMarkers: true,
            }]);
          }

          qwebrExecuteCode(currentLine, editor.__qwebrCounter, EvalTypes.Interactive);
          editor.setPosition(newPosition);
        } else {
          qwebrExecuteCode(selectedText, editor.__qwebrCounter, EvalTypes.Interactive);
        }
      });
    }

    editor.onDidFocusEditorText(addWebRKeyboardShortCutCommands);
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();

    qwebrEditorInstances[editor.__qwebrCounter] = editor;
  });

  runButton.onclick = function () {
    qwebrExecuteCode(editor.getValue(), editor.__qwebrCounter, EvalTypes.Interactive);
  };
}
