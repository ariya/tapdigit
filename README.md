# TapDigit

TapDigit is a simple JavaScript implementation of a math expression [lexer](https://en.wikipedia.org/wiki/Lexical_analysis), [parser](https://en.wikipedia.org/wiki/Parsing), and [evaluator](https://en.wikipedia.org/wiki/Interpreter_(computing)).

`TapDigit.Lexer` splits a math expression into a sequence of tokens. This is useful for e.g. an expression editor with color syntax highlighting.

`TapDigit.Parser` parses an expression and produces the JSON-formatted syntax tree representation thereof.

`TapDigit.Evaluator` computes the result of an expression. Variables, constants, and functions supported in the expression syntax can be extended via `TapDigit.Context` object.

There is also a simple web page (open `eval.htm`) which demonstrates how it works:

![Evaluator screenshot](screenshot.png)

TapDigit is created by [@AriyaHidayat](https://twitter.com/AriyaHidayat). It is distributed under the BSD license.
