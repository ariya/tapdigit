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

/*global TapDigit:true */
var lexer, highlightId;

function highlight() {
    if (highlightId) {
        window.clearTimeout(highlightId);
    }

    highlightId = window.setTimeout(function () {
        var el, code, str,
            lexer, tokens, token, i,
            text, html;

        el = document.getElementById('input');
        if (el.onkeydown === null) {
            el.onkeydown = function (e) {
                highlight();
            };
        }

        code = el.innerText;

        try {
            if (typeof lexer === 'undefined') {
                lexer = new TapDigit.Lexer();
            }

            tokens = [];
            lexer.reset(code);
            while (true) {
                token = lexer.next();
                if (typeof token === 'undefined') {
                    break;
                }
                tokens.push(token);
            }

            str = '<table width=200>\n';
            for (i = 0; i < tokens.length; i += 1) {
                token = tokens[i];
                str += '<tr>';
                str += '<td>';
                str += token.type;
                str += '</td>';
                str += '<td align=center>';
                str += token.value;
                str += '</td>';
                str += '</tr>';
                str += '\n';
            }
            document.getElementById('tokens').innerHTML = str;

            text = '';
            html = '';
            for (i = 0; i < tokens.length; i += 1) {
                token = tokens[i];
                while (text.length < token.start) {
                    text += ' ';
                    html += '&nbsp;';
                }
                text += code.substring(token.start, token.end + 1);
                if (token.type === TapDigit.Token.Identifier) {
                    html += '<span class=identifier>';
                } else if (token.type === TapDigit.Token.Number) {
                    html += '<span class=number>';
                } else {
                    html += '<span>';
                }
                html += code.substring(token.start, token.end + 1);
                html += '</span>';
            }
            input.innerHTML = html;
            input.focus();

        } catch (e) {
            document.getElementById('tokens').innerText = JSON.stringify(e);
            document.getElementById('tokens').innerText = e.toString();
        }
        highlightId = undefined;
    }, 345);
}

// Run once at the beginning
highlight();

// Place the cursor initially at the end of input
(function() {
    var input = document.getElementById('input'),
        range = document.createRange(),
        selection;

    range.selectNodeContents(input);
    range.collapse(false);

    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Ensure we have the focus
    input.focus();
})();

