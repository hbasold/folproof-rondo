import {
  LanguageSupport,
  StreamLanguage,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";

const simpleOperators = new Set([
  "∧",
  "&",
  "∨",
  "v",
  "+",
  "→",
  "↔",
  "~",
  "¬",
  "=",
  "⊥",
]);

const quantifiers = new Set(["∀", "A", "∃", "E"]);

const operatorKeywords = new Set([
  "and",
  "or",
  "implies",
  "iff",
  "not",
  "bot",
  "with",
]);

const folSyntax = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;

    if (stream.match(/^#.*$/, true)) return "comment";

    if (stream.peek() === ":") {
      stream.next();
      stream.eatWhile((ch) => ch !== "#");
      return "string";
    }

    if (simpleOperators.has(stream.peek())) {
      stream.next();
      return "operator";
    }

    if (quantifiers.has(stream.peek())) {
      // A or E are only valid quantifiers if followed by a variable and dot
      if (stream.match(/^[∀A∃E][a-zA-Z_][a-zA-Z_'"0-9|]*\./, false)) {
        stream.next();
        return "logicOperator";
      }
    }

    const match = stream.match(/[a-z]*/);
    if (match && operatorKeywords.has(match[0])) {
      return "operator";
    }

    if (stream.match(/(->)|(<->)|(_\|_)/)) return "operator";

    // Default case, do nothing
    stream.next();
    return null;
  },
});

// Paul Tol style
const folHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#44BB99", fontStyle: "italic" },
  { tag: tags.string, color: "#DDAA33" },
  { tag: tags.operator, color: "#6699CC", fontWeight: "bold" },
  { tag: tags.logicOperator, color: "#EE3377", fontWeight: "bold" },
]);

export function folLanguage() {
  return new LanguageSupport(folSyntax, syntaxHighlighting(folHighlightStyle));
}
