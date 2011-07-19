/*
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

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

/*global TapDigit:true,document:true,window:true */
var lexer, cursorStyle;

function syncCursor() {
    var input, display, cursor, caretX, caretY, el;

    input = document.getElementById('expr');
    cursor = input.selectionStart;
    display = document.getElementById('display');

    if (display.childElementCount > cursor) {
        el = display.childNodes[cursor];
        if (el) {
            caretX = el.offsetLeft;
            caretY = el.offsetTop;
            el = document.getElementById('cursor');
            el.style.left = caretX + 'px';
            el.style.top = caretY + 'px';
        }
    }
}

function syncText() {

    var input, display, expr,
        lexer, tokens, token, i, j,
        text, html, str, el;

    input = document.getElementById('expr');
    expr = input.value;
    display = document.getElementById('display');

    try {
        if (typeof lexer === 'undefined') {
            lexer = new TapDigit.Lexer();
        }
        tokens = [];
        lexer.reset(expr);
        while (true) {
            token = lexer.next();
            if (typeof token === 'undefined') {
                break;
            }
            tokens.push(token);
        }
    } catch (e) {
        display.textContent = expr;
        document.getElementById('tokens').textContent = e.toString();
        return;
    }


    html = '<table width=200>\n';
    for (i = 0; i < tokens.length; i += 1) {
        token = tokens[i];
        html += '<tr>';
        html += '<td>';
        html += token.type;
        html += '</td>';
        html += '<td align=center>';
        html += token.value;
        html += '</td>';
        html += '</tr>';
        html += '\n';
    }
    document.getElementById('tokens').innerHTML = html;

    text = '';
    html = '';
    for (i = 0; i < tokens.length; i += 1) {
        token = tokens[i];
        j = 0;
        while (text.length < token.start) {
            text += ' ';
            if (j === 0) {
                html += '<span class="blank"> </span>';
            } else {
                html += '<span class="blank">&nbsp;</span>';
            }
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
        html += '<span class="blank">&nbsp;</span>';
    }

    html += '<span class="cursor" id="cursor">&nbsp;</span>';
    display.innerHTML = html;

    syncCursor();
}


// Initialization
(function() {
    var input = document.getElementById('expr'),
        expr = input.value,
        rules, rule, i, j;

    input.focus();
    input.setSelectionRange(expr.length, expr.length);

    // Always put back the focus on the proxy input
    input.onblur = function () {
        window.setTimeout(function () {
            document.getElementById('expr').focus();
        }, 0);
    };

    for (i = 0; i < document.styleSheets.length; i += 1) {
        rules = document.styleSheets[i].cssRules;
        for (j = 0; j < rules.length; j += 1) {
            rule = rules[j];
            if (rule.selectorText.match(/span\.cursor/)) {
                cursorStyle = rule;
                break;
            }
        }
    }

    window.addEventListener('keydown', syncCursor);
    window.addEventListener('keyup', syncText);

    // Somehow Opera needs this
    input.onkeydown = syncCursor;
    input.onkeyup = syncText;

    syncText();

    window.setInterval(function () {
        var opacity = cursorStyle.style.opacity;
        opacity = 1 - opacity;
        cursorStyle.style.opacity = opacity;
    }, 400);
})();

