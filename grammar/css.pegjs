// Simple CSS Grammar
// ==========================
//
// Accepts CSS expressions like
//   pre img{font-size: 12px;color: red;}"
//   code.hljs,img.class{padding:3px 5px}
//   @media .hljs-comment{color:#697070}
// returns an AST.

CSS_DOCUMENT
  = head:CSS_RULESET  tail:(_ CSS_RULESET)* {
      var a = tail.flat().filter((_,index) => {
          return (index+1) % 2 == 0
      });
      a.unshift(head);
      return a;
    }

CSS_RULESET
  = CSS_MULTILINE_COMMENT
    / CSS_COMMENT
    / head:CSS_STATEMENT? tail:(_ CSS_SELECTORS? _ CSS_BLOCK) {
      return {
          statement: head, ruleset:{
          selectors: tail[1],
          block: tail[3]
      }};
    }

CSS_MULTILINE_COMMENT
  = _ '/*' _ .* _ '*/'

CSS_COMMENT
  = _ '//' _ [^\r\n]*

CSS_STATEMENT
  = '@'_[a-z]+ {
      return {'statement': text()};
    }

CSS_BLOCK
  = "{" _ expr:CSS_DECLARATION* _ "}"_";"? { return Object.fromEntries(expr); }

CSS_DECLARATION
  = expr1:CSS_VALUE _ ":"_ expr2:CSS_VALUES _ ";"? {
      return [expr1,expr2]
    }

CSS_SELECTOR
  = [a-zA-Z0-9.-_-]+ {
      return text();
    }

CSS_SELECTORS
  = head:CSS_SELECTOR  tail:((','/' ') _ CSS_SELECTOR)* {
      var a = tail.flat().filter((_,index) => {
          return (index+1) % 3 == 0
      });
      a.unshift(head);
      return a;
    }

CSS_VALUES
  = head:CSS_VALUE  tail:(' ' _ CSS_VALUE)* {
      var a = tail.flat().filter((_,index) => {
          return (index+1) % 3 == 0
      });
      a.unshift(head);
      return a;
    }

CSS_VALUE "value"
  = _ [a-zA-Z0-9-#]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*
