import { useEffect, useState } from "react";
import {
  Editor as DraftJsEditor,
  EditorState,
  RichUtils,
  SelectionState,
  convertToRaw,
  convertFromRaw,
  Modifier,
} from "draft-js";
import "draft-js/dist/Draft.css";
import { EditorStylesEnum } from "../enums";

const stylesArr = [
  EditorStylesEnum.BOLD,
  EditorStylesEnum.HIGHLIGHT,
  EditorStylesEnum.RED,
  EditorStylesEnum.UNDERLINE,
];

export const Editor = () => {
  const [editorState, setEditorState] = useState<EditorState>(() =>
    EditorState.createEmpty()
  );

  useEffect(() => {
    const state = localStorage.getItem("editorContent");
    if (state) {
      setEditorState(
        EditorState.createWithContent(convertFromRaw(JSON.parse(state)))
      );
    }
  }, []);

  const handleChange = (state: EditorState) => {
    let styleToImplement: EditorStylesEnum | null = null;
    let strToReplace: string = "";
    const content = state.getCurrentContent();
    const selection = state.getSelection();
    const block = content.getLastBlock();
    const end = selection.getEndOffset();

    if (state.getCurrentContent().getPlainText().slice(-2) === "# ") {
      styleToImplement = EditorStylesEnum.HEADER1;
      strToReplace = "# ";
    } else if (state.getCurrentContent().getPlainText().slice(-4) === "*** ") {
      styleToImplement = EditorStylesEnum.UNDERLINE;
      strToReplace = "*** ";
    } else if (state.getCurrentContent().getPlainText().slice(-4) === "``` ") {
      styleToImplement = EditorStylesEnum.HIGHLIGHT;
      strToReplace = "``` ";
    } else if (state.getCurrentContent().getPlainText().slice(-3) === "** ") {
      styleToImplement = EditorStylesEnum.RED;
      strToReplace = "** ";
    } else if (state.getCurrentContent().getPlainText().slice(-2) === "* ") {
      styleToImplement = EditorStylesEnum.BOLD;
      strToReplace = "* ";
    }

    if (strToReplace) {
      const blockSelection = SelectionState.createEmpty(block.getKey()).merge({
        anchorOffset: end - strToReplace.length,
        focusOffset: end,
      });
      const updatedContent = Modifier.replaceText(
        state.getCurrentContent(),
        blockSelection,
        ""
      );

      state = EditorState.push(state, updatedContent, "remove-range");

      state = EditorState.moveFocusToEnd(state);
    }

    if (styleToImplement) {
      const selection = state.getSelection();
      const nextContentState = stylesArr.reduce((contentState, style) => {
        return Modifier.removeInlineStyle(contentState, selection, style);
      }, state.getCurrentContent());

      state = EditorState.push(state, nextContentState, "change-inline-style");

      const currentStyle = state.getCurrentInlineStyle();

      if (selection.isCollapsed()) {
        state = currentStyle.reduce((reducedState, style) => {
          return RichUtils.toggleInlineStyle(
            reducedState || state,
            style || ""
          );
        }, state);
      }

      if (!currentStyle.has(styleToImplement)) {
        state = RichUtils.toggleInlineStyle(state, styleToImplement);
      }
    }

    setEditorState(state);
  };

  const handleSave = () => {
    localStorage.setItem(
      "editorContent",
      JSON.stringify(convertToRaw(editorState.getCurrentContent()))
    );
  };

  return (
    <>
      <div className="editor-header">
        <h3>Demo editor by Siddharth Rana</h3>
        <button onClick={handleSave}>Save</button>
      </div>
      <DraftJsEditor
        editorState={editorState}
        onChange={handleChange}
        customStyleMap={{
          RED: {
            color: "red",
          },
          HIGHLIGHT: {
            backgroundColor: "yellow",
            color: "black",
          },
          HEADER1: {
            fontSize: "36px",
            lineHeight: "38px",
            fontWeight: "bold",
          },
        }}
      />
    </>
  );
};
