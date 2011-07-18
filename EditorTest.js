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
var lexer, cursor, highlightId;

function highlight() {
    if (highlightId) {
        window.clearTimeout(highlightId);
    }

    highlightId = window.setTimeout(function () {
        var input, expr, str,
            lexer, tokens, token, i, j,
            text, html,
            selection, range, el;

        input = document.getElementById('input');
        if (input.onkeypress === null) {
            input.onkeypress = highlight;
        }

        expr = input.textContent;

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
                    html += '<span class="blank">&nbsp;</span>';
                }
                str = expr.substring(token.start, token.end + 1);
                text += str;
                for (j = 0; j < str.length; j += 1) {
                    html += '<span class="' + token.type + '">';
                    html += str.charAt(j);
                    html += '</span>';
                }
            }
            while (text.length < expr.length) {
                text += ' ';
                html += '<span class="blank">&nbsp;</span>';
            }

            // First-time initialization
            if (typeof cursor === 'undefined') {

                input.innerHTML = html;
                cursor = expr.length;

                // Place the cursor at the end of input
                range = document.createRange();
                range.selectNodeContents(input);
                range.collapse(false);
                selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                // Ensure we have the focus
                input.focus();

            } else {


                // Get cursor position relative to the main input element
                cursor = -1;
                selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    range = selection.getRangeAt(0);
                    el = range.startContainer.parentNode;
                    if (el && el.parentNode === input) {
                        cursor = range.startOffset - el.textContent.length;
                        while (el) {
                            cursor += el.textContent.length;
                            el = el.previousElementSibling;
                        }
                    }
                }

                // Replace the markup only if there is a change
                str = input.innerHTML;
                if (str !== html) {

                    input.innerHTML = html;

                    // Restore cursor position
                    if (cursor > 0) {
                        range = document.createRange();
                        if (input.childElementCount === cursor) {
                            range.setStartAfter(input.childNodes[cursor - 1]);
                        } else {
                            range.setStartBefore(input.childNodes[cursor]);
                        }
                        selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }

        } catch (e) {
            document.getElementById('tokens').textContent = JSON.stringify(e);
            document.getElementById('tokens').textContent = e.toString();
        }
        highlightId = undefined;
    }, 345);
}

// Check for contentEditable support
document.getElementById('input').contentEditable = true;
if (document.getElementById('input').contentEditable !== 'true') {
    document.body.innerHTML = 'Syntax highlighting is not available. ' +
        'This browser does not support contentEditable.';
    highlight = function () {};
}

// Check for W3C Selection/Range
if (typeof window.getSelection !== 'function') {
    document.body.innerHTML = 'Syntax highlighting is not available. ' +
        'This browser does not W3C Selection/Range.';
    highlight = function () {};
}

window.addEventListener('keypress', highlight, true);

// Run once at the beginning
highlight();

