let MQ;

let interpretParts = [
    {
        all: "For all *, ",
        exist: "For some *, "
    },
    {
        all: "for any *, ",
        exist: "there exists some * where "
    },
    {
        all: "for every *, ",
        exist: "and some *, "
    },
    {
        all: "for all *, ",
        exist: "and some *, "
    }
]

let AND = '\\wedge';
let OR = '\\vee';
let NEG = '\\neg';
let FORALL = '\\forall';
let EXISTS = '\\exists';

let specialCharMap = {
    ['&']: AND,
    ['|']: OR,
    ['!']: NEG,
    ['A']: FORALL,
    ['E']: EXISTS,
}

function toLatex(latex) {
    let span = document.createElement('span');
    let spanMath = MQ.StaticMath(span);
    spanMath.latex(latex);
    return '<span class="mq-math-mode interp">' + span.innerHTML + '</span>';
}

    // Assumes single-char variables
function writeInterpretation(latex) {
    let aIdx;
    let eIdx;
    let level = 0;
    let interpretMsg = "";

    let interEl = document.getElementById('interpretation');
    let parity = true;
    
        // Remove extra whitespace in latex
    latex = latex.replaceAll('\\ ', ' ');

        // Sort out operands by index priority
    do {
        aIdx = latex.indexOf(FORALL);
        eIdx = latex.indexOf(EXISTS);
        let notIdx = latex.indexOf(NEG);
        aIdx = (aIdx == -1)?        Infinity : aIdx;
        eIdx = (eIdx == -1)?        Infinity : eIdx;
        notIdx = (notIdx == -1)?    Infinity : notIdx;

        let messagePart;
        let varName;

            // Negation
        if (notIdx == 0) {
            latex = latex.slice(NEG.length).trim();
            parity = !parity;
        }

            // Breaks when no more \forall or \exists
        if (aIdx == Infinity && eIdx == Infinity) break;

            // Cut out symbol and add message part
        if (aIdx < eIdx) {
            latex = latex.slice(FORALL.length).trim();
                // Negation
            if (parity) {
                messagePart = interpretParts[level].all;
            } else {
                messagePart = interpretParts[level].exist;
            }
        } else if (eIdx < aIdx) {
            latex = latex.slice(EXISTS.length).trim();
                // Negation
            if (parity) {
                messagePart = interpretParts[level].exist;
            } else {
                messagePart = interpretParts[level].all;
            }
        }
        if (level == 2 && interpretMsg.indexOf('where') != -1) messagePart = messagePart.replace('and ', 'for ');   // This specific case sounds weird
        
            // Add var
        varName = toLatex(latex.charAt(0));
        latex = latex.slice(1).trim();
        
        interpretMsg += messagePart.replaceAll('*', varName);
        level = Math.min(level + 1, interpretParts.length - 1);
    } while (true);
    
        // Add condition
    if (latex) {
        let condition = toLatex(latex);
        interpretMsg += condition + ' is ' + parity + '.';
    }

    interEl.innerHTML = interpretMsg;
}

function countStr(regex, source) {
    return (source.match(new RegExp(regex, 'g')) || []).length;
}

function onLoad() {
    let inputSpan = document.getElementById('input');

    MQ = MathQuill.getInterface(2); // backcompat
    let inputField = MQ.MathField(inputSpan, {
        spaceBehavesLikeTab: false,
        handlers: {
                // Special character shortcuts
            edit: function() {
                let input = inputField.latex();
                input = input.replaceAll('\\&', '&');   // Makes things easier
                
                let numReplace = countStr('[&|!AE]', input);
                if (numReplace > 1) {
                    // Copy+Paste: Cursor goes to end
                    for (let char in specialCharMap) {
                        input = input.replaceAll(char, specialCharMap[char] + ' ');
                    }
                    inputField.latex(input);
                } else {
                    // Manually typed: Preserve cursor position
                    for (let char in specialCharMap) {
                        if (input.indexOf(char) != -1) {
                            inputField.keystroke('Backspace');
                            inputField.typedText(specialCharMap[char]);
                            inputField.keystroke('Enter');
                            return;
                        }
                    }
                }

                    // Reinterpret
                writeInterpretation(inputField.latex());
            }
        }
    });
}

window.onload = onLoad;