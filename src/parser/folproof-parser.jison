/* FOL.js grammar by Chris Dibbern */
%options flex
%options token-stack
%ebnf

%%

proof
    : clause_list EOL? ENDOFFILE
    { $$ = $clause_list; return $$; }
    ;

clause_list
    : box
    { $$ = [$box]; }
    | clause_list EOL box
    { $$ = $clause_list; $$.push($box); }
    |
    { $$ = []; }
    ;

box
    : BOX with EOL clause_list EOL? DEBOX
    { $$ = ['folbox', [$with, ...$clause_list], @$];
        if ($clause_list && $clause_list[0] && $clause_list[0][0] == 'rule' && $clause_list[0][2].auto)
            $clause_list[0][2] = ['hypothesis', null];
    }
    | BOX clause_list EOL? DEBOX
    { $$ = ['box', $clause_list, @$];
        if ($clause_list && $clause_list[0] && $clause_list[0][0] == 'rule' && $clause_list[0][2].auto)
            $clause_list[0][2] = ['hypothesis', null];
    }
    | sentence JUSTIFICATION?
    { $$ = $sentence[0] != 'error'
            ? ['rule', $sentence, $2, @$]
            : $sentence;
        if ($$[0] === 'rule' && !$$[2]) {
            $$[2] = ['premise', null];
            $$[2].auto = true;
        }
    }
    ;

with
    : WITH ID
    { $$ = ['rule', ['id', $ID], [$WITH, null]]; }
    ;

sentence
    : e_top
    | error
    { $$ = ['error', yytext]; }
    ;

e_top
    : EXISTS ID DOT e_top
    { $$ = ['exists', $ID, $e_top]; }
    | FORALL ID DOT e_top
    { $$ = ['forall', $ID, $e_top]; }
    | e_or IFF e_top
    { $$ = ['<->', $e_or, $e_top]; }
    | e_or IMPLIES e_top
    { $$ = ['->', $e_or, $e_top]; }
    | e_or
    { $$ = $1; }
    ;

e_or
    : e_and OR e_or
    { $$ = ['or', $e_and, $e_or]; }
    | e_and
    { $$ = $1; }
    ;

e_and
    : e_not AND e_and
    { $$ = ['and', $e_not, $e_and]; }
    | e_not
    { $$ = $1; }
    ;

e_not
    : NOT e_not
    { $$ = ['not', $e_not]; }
    | atom
    { $$ = $1; }
    ;

atom
    : term EQUALS term
    { $$ = ['=', $1, $3]; }
    | BOTTOM
    { $$ = ['bot']; }
    | term
    { $$ = $term; }
    | LPAREN sentence RPAREN
    { $$ = $sentence; $$.userParens = true; }
    ;

term_list
    : term
    { $$ = [$term]; }
    | term COMMA term_list
    { $$ = $term_list; $$.unshift($term); }
    | /* empty */
    { $$ = []; }
    ;

term
    : ID LPAREN term_list RPAREN
    { $$ = ['id', $ID, $term_list]; }
    | ID
    { $$ = ['id', $ID]; }
    ;
