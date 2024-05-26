# FOLProof Language Reference

## Proof steps
Every proof consists of a list of proof steps, where each step has the basic form:

```
[lineNum] [|*] phi [: reason] <NEWLINE>
   ^       ^     ^        ^       ^
   1       2     3        4       5
```

1. Integer line numbers are optional, but recommended. The verifier ignores user line numbers, instead keeping count itself.
2. Assumption boxes begin with a pipe, like:

```
| phi : assumption
```

Nested boxes can be created by adding more pipes:
```
|| phi2 : assumption
```

They can be ended explicitly, with any number of dashes on a new line, or implicitly, by simply omitting the pipe.
See [Example 1](#example-1---assumption-boxes) under [Examples].
3. phi is a formula in first-order logic. Greater detail can be found under [Formulas](#formulas).
4. Colons separate the formula, phi, from the reason it follows logically. See [Justifications](#justifications).
5. Every line is terminated by a newline.


Describing how each proof step should be formed, logically, is beyond the scope of this document.

## Formulas

FOLProof accepts the following logical operators, in order of precedence.
The first column gives the ASCII notation, and the second provides alternative textual and Unicode notation.

| ASCII Operator | Alternatives | Precedence | Assoc |
|----------------|--------------|------------|-------|
| t = s          |              | Atomic     | N/A   |
| `_|_`          | ⊥            | Atomic     | N/A   |
| ~              | not, ¬       | 1          | N/A   |
| &              | and, ∧       | 2          | Right |
| v              | or, ∨, +     | 2          | Right |
| ->             | implies, →   | 3          | Right |
| <->            | iff          | 3          | Right |
| A x.           | ∀x.          | 4          | N/A   |
| E x.           | ∃x.          | 4          | N/A   |

Quantifiers extend as far possible to the right, which means that, for example, `A x. Q(x) and P(x)` is interpreted as `A x. (Q(x) & P(x))` and *not* `(A.x Q(x)) & P(x)`, while `A x. Q(x) -> P(x)` is interpreted as `A x. (Q(X) -> P(x))`.
The alternative notation allow textual and unicode representations.
For instance, the following three inputs are interpreted all as the same formula.
```
∀x. P(x) ∧ Q(x) → ¬R(x) ∨ T(x, c)
A x. P(x) & Q(x) -> ~R(x) + T(x, c)
A x. P(x) and Q(x) implies not R(x) or T(x, c)
```
Arguably, the notation with words is somewhat more difficult to read and merits some parentheses

## Justifications

Justifications are the reasons why your current proof step follows logically from what is already there. They take the form:

```
: ruleName[.v1/v2] [elim/intro[1/2]] [[(num/range), ]*]
^     ^       ^         ^       ^       ^
1     2       3         4       5       6
```

1. Justifications are indicated by a leading colon. If omitted, either "premise" or "assumption" will be assumed, depending on the context.
2. Rule names are single words, like "premise" or "and". See [Appendix A](#appendix-a), for a complete list.
3. Rules that indicate a substitution specify it like `A.x/x0`. Complex terms, as in `A.x/f(x0)` are allowed.
   The backchaining rule also allows parallel substitutions, where the variable assignments are
   separated by semicolons: `B.x/f(c); y/g(k)`.
4. Non-derived rules often have elimination or introduction versions, like `phi : or elim a,b-c,d-e`. Single letters, like "e" and "i", are valid shorthand.
5. In some cases, rules need to refer to a side, 1 or 2 (left or right), like `phi1 or phi2 : or i1 n`.
6. Rules that need to reference prior proof steps can do so with a comma-separated list of step numbers and ranges, like `a,b-c,d-e`.

## Examples

### Example 1 - Assumption Boxes
```
1 a or b  : premise
2 ~a      : premise
3 ~b      : premise
4| a      : assumption
5| _|_    : not elim 4,2
 -----------------------
6| b      : assumption
7| _|_    : not elim 6,3
8 _|_     : or elim 1,4-5,6-7
```
Notice how the first assumption is terminated, explicitly, out of necessity, since it would otherwise be difficult to tell there are two assumption boxes. The second box is terminated, implicitly, simply by omitting the leading pipe on line 8.

## Appendix

### Appendix A
#### A list of justifications accepted by FOLProof

| Rule Name  | Connective | Type   | Forms | References    | Substitutions |
|------------|------------|--------|-------|---------------|---------------|
| premise    | N/A        | intro  | N/A   | N/A           | N/A           |
| assumption | N/A        | intro  | N/A   | N/A           | N/A           |
| sorry      | N/A        | intro  | N/A   | N/A           | N/A           |
| copy       | N/A        | intro  | N/A   | a             | N/A           |
| and        | &          | basic  | elim  | a             | N/A           |
|            |            |        | intro | a,b           | N/A           |
| or         | v          | basic  | elim  | a,b-c,d-e     | N/A           |
|            |            |        | intro | a             | N/A           |
| not        | ~          | basic  | elim  | a,b           | N/A           |
|            |            |        | intro | a-b           | N/A           |
| ->         | ->         | basic  | elim  | a,b           | N/A           |
|            |            |        | intro | a-b           | N/A           |
| A          | Ax.        | basic  | elim  | a             |               |
|            |            |        | intro | a-b           |               |
| E          | Ex.        | basic  | elim  | a-b           |               |
|            |            |        | intro | a             |               |
| bot        | ⊥          | basic  | elim  | a             | N/A           |
| =          | =          |        | intro | N/A           | N/A           |
|            |            |        | elim  | a,b           | N/A           |
| contra     | N/A        | basic  | N/A   | a-b           | N/A           |
| MT         | N/A        | deriv. | N/A   | a,b           | N/A           |
| NOTNOT     | N/A        | deriv. | intro | a             | N/A           |
| LEM        | N/A        | deriv. | N/A   | N/A           | N/A           |
| B          | N/A        | deriv. | N/A   | a,b1, ..., bn |               |
