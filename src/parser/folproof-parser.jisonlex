/*
objid     [a-z_][a-zA-Z_'"0-9\|]*
predid    [a-zA-Z][a-zA-Z_'"0-9\|]*
*/

id          [a-zA-Z_][a-zA-Z_'"0-9\|]*
spc		    [\t \u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]
numrange	[0-9]+(\-[0-9]+)?
justify     ":".*

%%
[\n\r]?"#".*        /* comments are ignored */
"and"|"∧"|"&"		return 'AND';
"or"|"∨"|"v"|"+"	return 'OR';
"implies"|"->"|"→"  return 'IMPLIES';
"iff"|"<->"|"↔"		return 'IFF';
"not"|"~"|"¬"		return 'NOT';
"="				    return 'EQUALS';
/* "every"			return 'EVERY'; */
"with"				return 'WITH';
/* "of"				return "OF"; */
\d+				    /* ignore digits, for now */

{justify} %{
    // Syntax: "[...] : ruleName [[elim/intro] [NumOrRange[, NumOrRange]*]]
    // strip the leading colon and spaces
    yytext = yytext.substr(yytext.substr(1).search(/\S/));
    yytext = yytext.match(/^[^\#]*/)[0];
    yytext = yytext.trim();

    // find the beginning of the first line number
    var pos = yytext.search(/\s+\d+/);
    var lineranges = null;
    if (pos != -1) {
        lineranges = yytext.substr(pos+1).split(/\s*,\s*/);
        yytext = yytext.substr(0, pos);
    }

    // If there is a substitution, then it comes after a dot that separates the rule name from
    // the substitution.
    var ruleApp = yytext.split('.', 2);
    var name = null;
    var substParts = null;
    if (ruleApp.length == 2){
       name = ruleApp[0].trim();
       var substParts = ruleApp[1].split(';').map((s) => s.trim());
       var rem = substParts[substParts.length - 1].split(' ', 2);
       substParts[substParts.length - 1] = rem[0];
       if(rem.length >= 2){
         yytext = rem[1];
       } else {
         yytext = "";
       }
    } else {
       var parts = yytext.split(' ', 2);
       name = parts[0];
       if(parts.length >= 2){
         yytext = parts[1];
       } else {
         yytext = "";
       }
    }

    var parts = yytext.match(/([a-zA-Z]+)(\d+)?/);
    var rtype = null, side = null;
    if (parts) {
        rtype = parts[1];
        if (parts.length >= 3){
            side = parts[2];
        }
    }

    var sub = null;
    if (substParts) {
        sub = Array(0);
        for (const s of substParts){
            sub.push(s.split('/'));
        }
    }

    yytext = [name, rtype, side, lineranges, sub];
    return 'JUSTIFICATION';
%};

"E"|"∃"			return 'EXISTS';
/* "in"			return 'IN';*/
/*"empty"		return 'EMPTYSET';*/
"A"|"∀"			return 'FORALL';
/* "()"			return 'DOUBLEPAREN'; */
"("				return 'LPAREN';
")"				return 'RPAREN';
"_|_"|"⊥"|"bot" return 'BOTTOM';
/* {objid}	    return 'OBJID';
{predid}		return 'PREDID'; */
{id}			return 'ID';
","				return 'COMMA';
"."				return 'DOT';

[\n\r]*<<EOF>> %{
    // remaining DEBOXes implied by EOF
    var tokens = [];

    while (this._iemitstack[0]) {
        tokens.unshift("DEBOX");
        this._iemitstack.shift();
    }
    tokens.unshift("ENDOFFILE");
    if (tokens.length) return tokens;
%}

\n({spc}*"|"*)*"-"+ %{
    /* manually close an assumption box */
    this._log("MANUAL DEBOX");
    this._iemitstack.shift();
    return ['DEBOX', 'EOL'];
%}

[\n\r]+{spc}*/![^\n\r] /* eat blank lines */

[\n|^]{spc}*\d*({spc}*"|"*)* %{
    /* Similar to the idea of semantic whitespace, we keep track of virtual
     * BOX/DEBOX characters based on a stack of | occurrences
     */
    var indentation = (yytext.match(/\|/g)||[]).length;
    if (indentation > this._iemitstack[0]) {
        this._iemitstack.unshift(indentation);
        this._log(this.topState(), "BOX", this.stateStackSize());
        this.myBegin(this.topState(), 'deepening, due to indent'); // deepen our current state
        return ['BOX', 'EOL'];
    }

    var tokens = ["EOL"];
    while (indentation < this._iemitstack[0]) {
        this.myPopState();
        this._log(this.topState(), "DEBOX", this.stateStackSize());
        tokens.push("DEBOX");
        this._iemitstack.shift();
    }
    if (tokens[tokens.length-1] === "DEBOX")
        tokens.push("EOL");
    return tokens;
%}

\n      return 'EOL';
{spc}+  /* ignore whitespace */
.*      return 'error';

%%
const jisonLexerFn = lexer.setInput;
lexer.setInput = function(input) {
    let debug = false;
    this._iemitstack = [0];
    this._log = function() { if (debug) console.log.apply(this, arguments); };
    this.myBegin = function(state, why) { this._log("Begin " + state + " because " + why); this.begin(state); };
    this.myPopState = function() { this._log("Popping " + this.popState() + " to " + this.topState()); };
    return jisonLexerFn.call(this, input);
};
