%x inQuantifier

/*
objid     [a-z_][a-zA-Z_'"0-9\|]*
predid    [a-zA-Z][a-zA-Z_'"0-9\|]*
*/

id          [a-zA-Z_][a-zA-Z_'"0-9\|]*
spc		    [\t \u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]
numrange	[0-9]+(\-[0-9]+)?
justify     ":".*

%%

[\n\r]?"#".*                /* comments are ignored */
("and"/{spc}+)|"∧"|"&"		return 'AND';
("or"/{spc}+)|"∨"|"v"|"+"   return 'OR';
("implies"/{spc}+)|"->"|"→" return 'IMPLIES';
("iff"/{spc}+)|"<->"|"↔"	return 'IFF';
("not"/{spc}+)|"~"|"¬"		return 'NOT';
"="				            return 'EQUALS';
/* "every"			        return 'EVERY'; */
"with"/{spc}+				return 'WITH';
/* "of"				        return "OF"; */
\d+				            /* ignore digits, for now */

{justify} %{
    // Syntax: "[...] : ruleName [[elim/intro] [NumOrRange[, NumOrRange]*]]
    // strip the leading colon and spaces
    yytext = yytext.slice(yytext.slice(1).search(/\S/));
    yytext = yytext.match(/^[^\#]*/)[0];
    yytext = yytext.trim();

    // find the beginning of the first line number
    const pos = yytext.search(/\s+\d+/);
    let lineranges = null;
    if (pos !== -1) {
        lineranges = yytext.slice(pos + 1).split(/\s*,\s*/);
        yytext = yytext.slice(0, pos);
    }

    let name = null;
    let sub = null;
    // If there is a substitution, then a dot separates it and the rule name
    const ruleApp = yytext.split('.', 2);
    if (ruleApp.length === 2) {
        name = ruleApp[0].trim();
        let substParts = ruleApp[1].split(';').map((s) => s.trim());

        let lastIndex = substParts.length - 1;
        let lastPart = substParts.at(-1);
        let splitPos = lastPart.lastIndexOf(' ');
        if (splitPos !== -1) {
            substParts[lastIndex] = lastPart.slice(0, splitPos);
            yytext = lastPart.slice(splitPos + 1);
        } else {
            yytext = "";
        }

        sub = substParts.map(s => s.split('/'));
    } else {
        [name, yytext = ""] = yytext.split(' ', 2);
    }

    let [, rtype = null, side = null] = yytext.match(/([a-zA-Z]+)(\d+)?/) || [];

    yytext = [name, rtype, side, lineranges, sub];
    return 'JUSTIFICATION';
%};

"∃" return 'EXISTS';
"∀" return 'FORALL';
("A"|"E")/({spc}*{id}{spc}*".") %{
    this.pushState('inQuantifier');
    return yytext[0] === 'A' ? 'FORALL' : 'EXISTS';
%}

/* "in"			            return 'IN';*/
/*"empty"		            return 'EMPTYSET';*/
/* "()"			            return 'DOUBLEPAREN'; */
"("				            return 'LPAREN';
")"				            return 'RPAREN';
("bot"/{spc}+)|"_|_"|"⊥"    return 'BOTTOM';
/* {objid}	                return 'OBJID';
{predid}		            return 'PREDID'; */
<*>{id}			            return 'ID';
","				            return 'COMMA';
<*>"." %{
    this.popState();
    return 'DOT';
%}

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

\n          return 'EOL';
<*>{spc}+   /* ignore whitespace */
.*          return 'error';

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
