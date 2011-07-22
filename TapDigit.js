/*
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2010 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*global document:true,window:true */
var TapDigit;
TapDigit = TapDigit || {};

TapDigit.Token = {
    Operator: 'Operator',
    Identifier: 'Identifier',
    Number: 'Number'
};

TapDigit.Lexer = function () {
    var expression = '',
        length = 0,
        index = 0,
        marker = 0,
        T = TapDigit.Token;

    function peekNextChar() {
        var idx = index;
        return ((idx < length) ? expression.charAt(idx) : '\x00');
    }

    function getNextChar() {
        var ch = '\x00',
            idx = index;
        if (idx < length) {
            ch = expression.charAt(idx);
            index += 1;
        }
        return ch;
    }

    function isWhiteSpace(ch) {
        return (ch === '\u0009') || (ch === ' ') || (ch === '\u00A0');
    }

    function isLetter(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
    }

    function isDecimalDigit(ch) {
        return (ch >= '0') && (ch <= '9');
    }

    function createToken(type, value) {
        return {
            type: type,
            value: value,
            start: marker,
            end: index - 1
        };
    }

    function skipSpaces() {
        var ch;

        while (index < length) {
            ch = peekNextChar();
            if (!isWhiteSpace(ch)) {
                break;
            }
            getNextChar();
        }
    }

    function scanOperator() {
        var ch = peekNextChar();
        if ('+-*/()^%=;,'.indexOf(ch) >= 0) {
            return createToken(T.Operator, getNextChar());
        }
        return undefined;
    }

    function isIdentifierStart(ch) {
        return (ch === '_') || isLetter(ch);
    }

    function isIdentifierPart(ch) {
        return isIdentifierStart(ch) || isDecimalDigit(ch);
    }

    function scanIdentifier() {
        var ch, id;

        ch = peekNextChar();
        if (!isIdentifierStart(ch)) {
            return undefined;
        }

        id = getNextChar();
        while (true) {
            ch = peekNextChar();
            if (!isIdentifierPart(ch)) {
                break;
            }
            id += getNextChar();
        }

        return createToken(T.Identifier, id);
    }

    function scanNumber() {
        var ch, number;

        ch = peekNextChar();
        if (!isDecimalDigit(ch) && (ch !== '.')) {
            return undefined;
        }

        number = getNextChar();
        while (true) {
            ch = peekNextChar();
            if (!isDecimalDigit(ch)) {
                break;
            }
            number += getNextChar();
        }

        if (ch === '.') {
            number += getNextChar();
            while (true) {
                ch = peekNextChar();
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += getNextChar();
            }
        }

        if (ch === 'e' || ch === 'E') {
            number += getNextChar();
            ch = peekNextChar();
            if (ch === '+' || ch === '-' || isDecimalDigit(ch)) {
                number += getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += getNextChar();
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throw SyntaxError('Unexpected ' + ch + ' after the exponent sign');
            }
        }

        if (number === '.') {
            throw SyntaxError('Expecting decimal digits after the dot sign');
        }

        return createToken(T.Number, number);
    }

    function reset(str) {
        expression = str;
        length = str.length;
        index = 0;
    }

    function next() {
        var token;

        skipSpaces();
        if (index >= length) {
            return undefined;
        }

        marker = index;

        token = scanNumber();
        if (typeof token !== 'undefined') {
            return token;
        }

        token = scanOperator();
        if (typeof token !== 'undefined') {
            return token;
        }

        token = scanIdentifier();
        if (typeof token !== 'undefined') {
            return token;
        }


        throw SyntaxError('Unknown token from character ' + peekNextChar());
    }

    function peek() {
        var token, idx;

        idx = index;
        try {
            token = next();
            delete token.start;
            delete token.end;
        } catch (e) {
            token = undefined;
        }
        index = idx;

        return token;
    }

    return {
        reset: reset,
        next: next,
        peek: peek
    };
};

TapDigit.Parser = function () {

    var lexer = new TapDigit.Lexer(),
        T = TapDigit.Token;

    function matchOp(token, op) {
        return (typeof token !== 'undefined') &&
            token.type === T.Operator &&
            token.value === op;
    }

    // ArgumentList := Expression |
    //                 Expression ',' ArgumentList
    function parseArgumentList() {
        var token, expr, args = [];

        while (true) {
            expr = parseExpression();
            if (typeof expr === 'undefined') {
                // TODO maybe throw exception?
                break;
            }
            args.push(expr);
            token = lexer.peek();
            if (!matchOp(token, ',')) {
                break;
            }
            lexer.next();
        }

        return args;
    }

    // FunctionCall ::= Identifier '(' ')' ||
    //                  Identifier '(' ArgumentList ')'
    function parseFunctionCall(name) {
        var token, args = [];

        token = lexer.next();
        if (!matchOp(token, '(')) {
            throw SyntaxError('Expecting ( in a function call "' + name + '"');
        }

        token = lexer.peek();
        if (!matchOp(token, ')')) {
            args = parseArgumentList();
        }

        token = lexer.next();
        if (!matchOp(token, ')')) {
            throw SyntaxError('Expecting ) in a function call "' + name + '"');
        }

        return {
            'Function' : {
                'name': name,
                'args': args
            }
        };
    }

    // Primary ::= Identifier |
    //             Number |
    //             '(' Assignment ')' |
    //             FunctionCall
    function parsePrimary() {
        var token, expr;

        token = lexer.peek();

        if (typeof token === 'undefined') {
            throw SyntaxError('Unexpected termination of expression');
        }

        if (token.type === T.Identifier) {
            token = lexer.next();
            if (matchOp(lexer.peek(), '(')) {
                return parseFunctionCall(token.value);
            } else {
                return {
                    'Identifier': token.value
                };
            }
        }

        if (token.type === T.Number) {
            token = lexer.next();
            return {
                'Number': token.value
            };
        }

        if (matchOp(token, '(')) {
            lexer.next();
            expr = parseAssignment();
            token = lexer.next();
            if (!matchOp(token, ')')) {
                throw SyntaxError('Expecting )');
            }
            return {
                'Expression': expr
            };
        }

        throw SyntaxError('Parse error, can not process token ' + token.value);
    }

    // Unary ::= Primary |
    //           '-' Unary
    function parseUnary() {
        var token, expr;

        token = lexer.peek();
        if (matchOp(token, '-') || matchOp(token, '+')) {
            token = lexer.next();
            expr = parseUnary();
            return {
                'Unary': {
                    operator: token.value,
                    expression: expr
                }
            };
        }

        return parsePrimary();
    }

    // Multiplicative ::= Unary |
    //                    Multiplicative '*' Unary |
    //                    Multiplicative '/' Unary
    function parseMultiplicative() {
        var token, left, right;

        left = parseUnary();
        token = lexer.peek();
        if (matchOp(token, '*') || matchOp(token, '/')) {
            token = lexer.next();
            right = parseMultiplicative();
            return {
                'Binary': {
                    operator: token.value,
                    left: left,
                    right: right
                }
            };
        }
        return left;
    }

    // Additive ::= Multiplicative |
    //              Additive '+' Multiplicative |
    //              Additive '-' Multiplicative
    function parseAdditive() {
        var token, left, right;

        left = parseMultiplicative();
        token = lexer.peek();
        if (matchOp(token, '+') || matchOp(token, '-')) {
            token = lexer.next();
            right = parseAdditive();
            return {
                'Binary': {
                    operator: token.value,
                    left: left,
                    right: right
                }
            };
        }
        return left;
    }

    // Assignment ::= Identifier '=' Assignment |
    //                Additive
    function parseAssignment() {
        var token, expr;

        expr = parseAdditive();

        if (typeof expr !== 'undefined' && expr.Identifier) {
            token = lexer.peek();
            if (matchOp(token, '=')) {
                lexer.next();
                return {
                    'Assignment': {
                        name: expr,
                        value: parseAssignment()
                    }
                };
            }
            return {
                'Assignment': {
                    name: expr,
                    value: undefined
                }
            };
        }

        return expr;
    }

    // Expression ::= Assignment
    function parseExpression() {
        return parseAssignment();
    }

    function parse(expression) {
        var expr, token;

        lexer.reset(expression);
        expr = parseExpression();

        token = lexer.next();
        if (typeof token !== 'undefined') {
            throw SyntaxError('Unexpected token ' + token.value);
        }

        return {
            'Expression': expr
        };
    }

    return {
        parse: parse
    };
};

TapDigit.Editor = function (element) {

    var input, editor, cursor, blinkTimer, lexer, hasFocus;

    function hideCursor() {
        if (blinkTimer) {
            window.clearInterval(blinkTimer);
        }
        blinkTimer = undefined;
        cursor.style.visibility = 'hidden';
    }

    function blinkCursor() {
        var visible = true;
        if (blinkTimer) {
            window.clearInterval(blinkTimer);
        }
        blinkTimer = window.setInterval(function () {
            cursor.style.visibility = visible ? '' : 'hidden';
            visible = !visible;
        }, 423);
    }

    // Get cursor position from the proxy input and adjust the editor
    function updateCursor() {
        var start, end, x, y, i, el, cls;

        if (typeof cursor === 'undefined') {
            return;
        }

        if (cursor.getAttribute('id') !== 'cursor') {
            return;
        }

        start = input.selectionStart;
        end = input.selectionEnd;

        if (editor.childNodes.length <= start) {
            return;
        }

        el = editor.childNodes[start];
        if (el) {
            x = el.offsetLeft;
            y = el.offsetTop;
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
            cursor.style.opacity = 1;
        }

        // If there is a selection, add the CSS class 'selected'
        // to all nodes inside the selection range.
        if (start !== end) {
            cursor.style.opacity = 0;
            for (i = 0; i < editor.childNodes.length; i += 1) {
                el = editor.childNodes[i];
                cls = el.getAttribute('class');
                if (cls !== null) {
                    if (i >= start && i < end) {
                        cls += ' selected';
                    } else {
                        cls = cls.replace('selected', '');
                    }
                    el.setAttribute('class', cls);
                }
            }
        }
    }

    // Get a new text from the proxy input and update the syntax highlight
    function updateEditor() {
        var expr, tokens, token, i, j, text, str, html;

        if (typeof lexer === 'undefined') {
            lexer = new TapDigit.Lexer();
        }

        tokens = [];
        try {
            expr = input.value;
            lexer.reset(expr);
            while (true) {
                token = lexer.next();
                if (typeof token === 'undefined') {
                    break;
                }
                tokens.push(token);
            }

            text = '';
            html = '';
            for (i = 0; i < tokens.length; i += 1) {
                token = tokens[i];
                j = 0;
                while (text.length < token.start) {
                    text += ' ';
                    html += '<span class="blank"> </span>';
                    j = 1;
                }
                str = expr.substring(token.start, token.end + 1);
                for (j = 0; j < str.length; j += 1) {
                    html += '<span class="' + token.type + '">';
                    html += str.charAt(j);
                    text += str.charAt(j);
                    html += '</span>';
                }
            }
            while (text.length < expr.length) {
                text += ' ';
                html += '<span class="blank"> </span>';
            }
        } catch (e) {
            // plain spans for the editor
            html = '';
            for (i = 0; i < expr.length; i += 1) {
                html += '<span class="error">' + expr.charAt(i) + '</span>';
            }
        } finally {
            html += '<span class="cursor" id="cursor">\u00A0</span>';
            if (html !== editor.innerHTML) {
                editor.innerHTML = html;
                cursor = document.getElementById('cursor');
                blinkCursor();
                updateCursor();
            }
        }
    }

    function focus() {
        window.setTimeout(function () {
            input.focus();
            blinkCursor();
            updateCursor();
        }, 0);
    }

    function blur() {
        input.blur();
    }

    function deselect() {
        var el, cls;
        input.selectionEnd = input.selectionStart;
        el = editor.firstChild;
        while (el) {
            cls = el.getAttribute('class');
            if (cls && cls.match('selected')) {
                cls = cls.replace('selected', '');
                el.setAttribute('class', cls);
            }
            el = el.nextSibling;
        }
    }

    function setHandler(el, event, handler) {
        if (el.addEventListener) {
            el.addEventListener(event, handler, false);
        } else {
            el.attachEvent('on' + event, handler);
        }
    }

    function resetHandler(el, event, handler) {
        if (el.removeEventListener) {
            el.removeEventListener(event, handler, false);
        } else {
            el.detachEvent('on' + event, handler);
        }
    }

    function onInputKeyDown(event) {
        updateCursor();
    }

    function onInputKeyUp(event) {
        updateEditor();
    }

    function onInputBlur() {
        hasFocus = false;
        hideCursor();
    }

    function onInputFocus() {
        hasFocus = true;
    }

    function onEditorMouseDown(event) {
        var x, y, i, el, x1, y1, x2, y2;

        deselect();

        // Assume first that it is at the end
        input.selectionStart = input.value.length;
        input.selectionEnd = input.selectionStart;

        x = event.clientX;
        y = event.clientY;
        for (i = 0; i < editor.childNodes.length; i += 1) {
            el = editor.childNodes[i];
            x1 = el.offsetLeft;
            x2 = x1 + el.offsetWidth;
            y1 = el.offsetTop;
            y2 = y1 + el.offsetHeight;
            if (x1 <= x && x < x2 && y1 <= y && y < y2) {
                input.selectionStart = i;
                input.selectionEnd = i;
                blinkCursor();
                break;
            }
        }

        function onDocumentMouseMove(event) {
            if (event.target && event.target.parentNode === editor) {
                for (i = 0; i < editor.childNodes.length; i += 1) {
                    el = editor.childNodes[i];
                    if (el === event.target) {
                        input.selectionEnd = i;
                        blinkCursor();
                        updateCursor();
                        break;
                    }
                }
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.returnValue = false;
        }

        function onDocumentMouseUp(event) {
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.returnValue = false;
            window.setTimeout(function() {
                resetHandler(document, 'mousemove', onDocumentMouseMove);
                resetHandler(document, 'mouseup', onDocumentMouseUp);
            }, 100);
        }

        focus();
        setHandler(document, 'mousemove', onDocumentMouseMove);
        setHandler(document, 'mouseup', onDocumentMouseUp);
        event.preventDefault();
    }

    function setupDOM(element) {
        var container, wrapper;

        // Proxy input where we capture user keyboard interaction
        input = document.createElement('input');
        input.style.position = 'absolute';
        input.style.width = '100px';
        input.value = 'x = 40 + (6 / 3.0)';
        input.style.position = 'absolute';

        // Container for the above proxy, it also hides the proxy element
        container = document.createElement('div');
        container.appendChild(input);
        container.style.overflow = 'hidden';
        container.style.width = '1px';
        container.style.height = '0px';
        container.style.position = 'relative';

        // The "fake" editor
        editor = document.createElement('div');
        editor.setAttribute('class', 'editor');
        editor.style.wrap = 'on';
        editor.textContent = ' ';

        // Top-level wrapper for container
        wrapper = document.createElement('div');
        wrapper.appendChild(container);
        wrapper.appendChild(editor);
        element.appendChild(wrapper);

        // Wire all event handlers
        setHandler(input, 'keydown', onInputKeyDown);
        setHandler(input, 'keyup', onInputKeyUp);
        setHandler(input, 'blur', onInputBlur);
        setHandler(input, 'focus', onInputFocus);
        setHandler(editor, 'mousedown', onEditorMouseDown);
    }

    hasFocus = false;
    setupDOM(element);
    updateEditor();

    return {
        focus: focus,
        blur: blur,
        deselect: deselect
    };
};

