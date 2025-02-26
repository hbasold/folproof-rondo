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

    if (stream.match(/^#.*$/)) return "comment";

    if (stream.match(/^:[^#]*/)) return "string";

    if (simpleOperators.has(stream.peek())) {
      stream.next();
      return "operator";
    }

    // A or E are only valid quantifiers if followed by a variable and dot
    if (
      quantifiers.has(stream.peek()) &&
      stream.match(/^[∀A∃E]\s*[a-zA-Z_][a-zA-Z_'"0-9|]*\s*\./, false)
    ) {
      stream.next();
      return "logicOperator";
    }

    const match = stream.match(/^[a-z]*/, false);
    if (match && operatorKeywords.has(match[0])) {
      stream.eatWhile(/[a-z]/);
      return "operator";
    }

    if (stream.match(/^((->)|(<->)|(_\|_))/)) return "operator";

    // Ensures that | is not matched below when it is in a variable (see lexer)
    if (stream.match(/^[a-zA-Z_][a-zA-Z_'"0-9|]*/)) return "variable";

    // Ensures that - is not matched below when it is in numrange (see lexer)
    if (stream.match(/^\d+(-\d+)?/)) return "number";

    if (stream.peek() === "-" || stream.peek() === "|") {
      stream.eatWhile(/[-|]/);
      return "namespace";
    }

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
  { tag: tags.namespace, color: "#44BB99", fontWeight: "bold" },
]);

export function folLanguage() {
  return new LanguageSupport(folSyntax, syntaxHighlighting(folHighlightStyle));
}
