# TapDigit

TapDigit is a simple JavaScript implementation of a math expression lexer, parser, and evaluator.

`TapDigit.Lexer` is a simple lexical scanner which splits a math expression into a sequence of tokens. This is useful for e.g. an expression editor with color syntax highlighting.

`TapDigit.Parser` takes an expression and produces the JSON-formatted syntax tree representation thereof.

`TapDigit.Evaluator` computes the result of an expression. Variables, constants, and functions supported in the expression syntax can be extended via `TapDigit.Context` object.

There is also a simple web page (open `eval.htm`) which demonstrates how it works:

![Evaluator screenshot](screenshot.png)

TapDigit is created by [@AriyaHidayat](https://twitter.com/AriyaHidayat). It is distributed under the BSD license.
