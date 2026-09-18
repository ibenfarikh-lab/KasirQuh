let autoHitungTimer = null;

function autoHitungSubjudul() {
  const inputEl = document.getElementById("catatan-desc-input");
  const subjudulInput = document.getElementById("catatan-subtitle-input");
  if (!inputEl || !subjudulInput) return;

  const isi = inputEl.value;
  const lines = isi.split('\n');
  let total = 0;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed === '') return;
    
    const parts = trimmed.split(/\s+/);
    let nominalBaris = 0;
    
    for (let i = parts.length - 1; i >= 0; i--) {
      const angkaBersih = parts[i].replace(/[^0-9]/g, '');
      const nominal = parseInt(angkaBersih) || 0;
      
      if (nominal >= 100) {
        nominalBaris = nominal;
        break;
      }
    }
    
    total += nominalBaris;
  });

  const newSubjudul = total > 0 ? "Pembayaran " + total.toLocaleString('id-ID') : "";

  if (subjudulInput.value !== newSubjudul) {
    const cursorPosStart = inputEl.selectionStart;
    const cursorPosEnd = inputEl.selectionEnd;
    const isFocused = document.activeElement === inputEl;

    subjudulInput.value = newSubjudul;

    if (isFocused) {
      inputEl.setSelectionRange(cursorPosStart, cursorPosEnd);
    }
  }
}

document.addEventListener('input', function(e) {
  if (e.target && e.target.id === 'catatan-desc-input') {
    if (e.isComposing) return;
    clearTimeout(autoHitungTimer);
    autoHitungTimer = setTimeout(() => {
      autoHitungSubjudul();
    }, 300);
  }
});

// --- FUNGSI KALKULATOR & AUTO-KALKULASI ---
function formatKalkulator(rawStr) {
  return rawStr.replace(/\d+(\.\d*)?/g, function(match) {
    let parts = match.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (parts.length > 1) {
      return parts[0] + ',' + parts[1];
    } else {
      return parts[0];
    }
  });
}

function initCalcPreview() {
  const display = document.getElementById("calc-display");
  if (display && !document.getElementById("calc-preview")) {
    const previewDiv = document.createElement("div");
    previewDiv.id = "calc-preview";
    previewDiv.style.cssText = "text-align: right; font-size: 1.3rem; color: #2563eb; font-weight: bold; padding: 4px 12px; min-height: 30px;";
    display.parentNode.insertBefore(previewDiv, display.nextSibling);
  }
}

function autoCalculate() {
  const display = document.getElementById("calc-display");
  const preview = document.getElementById("calc-preview");
  if (!display) return;

  let rawVal = display.value.replace(/\./g, '').replace(/,/g, '.');
  rawVal = rawVal.replace(/\b0+(\d+)/g, '$1');

  if (!rawVal) {
    if (preview) preview.innerText = "";
    return;
  }

  if (/[\d\)]$/.test(rawVal)) {
    try {
      let result = eval(rawVal);
      if (result !== undefined && !isNaN(result)) {
        if (result % 1 !== 0) {
          result = parseFloat(result.toFixed(4));
        }
        let formattedResult = formatKalkulator(result.toString());
        if (preview) {
          preview.innerText = "=" + formattedResult;
        }
      } else {
        if (preview) preview.innerText = "";
      }
    } catch (e) {
      if (preview) preview.innerText = "";
    }
  } else {
    if (preview) preview.innerText = "";
  }
}

function appendCalc(value) {
  const display = document.getElementById("calc-display");
  if(display) {
    let rawVal = display.value.replace(/\./g, '').replace(/,/g, '.');
    
    if (value === '.' && (rawVal === '' || /[\+\-\*\/]$/.test(rawVal))) {
      value = '0.';
    }
    
    rawVal += value;
    display.value = formatKalkulator(rawVal);
    autoCalculate();
  }
}

function clearCalc() {
  const display = document.getElementById("calc-display");
  const preview = document.getElementById("calc-preview");
  if(display) display.value = "";
  if(preview) preview.innerText = "";
}

function hapusSatuCalc() {
  const display = document.getElementById("calc-display");
  if(display) {
    let rawVal = display.value.replace(/\./g, '').replace(/,/g, '.');
    rawVal = rawVal.slice(0, -1);
    display.value = formatKalkulator(rawVal);
    autoCalculate();
  }
}

function calculateResult() {
  const display = document.getElementById("calc-display");
  const preview = document.getElementById("calc-preview");
  if(display && display.value) {
    let rawVal = display.value.replace(/\./g, '').replace(/,/g, '.');
    rawVal = rawVal.replace(/\b0+(\d+)/g, '$1');
    
    try {
      let result = eval(rawVal);
      if (result % 1 !== 0) {
        result = parseFloat(result.toFixed(4));
      }
      display.value = formatKalkulator(result.toString());
      if (preview) preview.innerText = "";
    } catch (e) {
      alert("Format hitungan salah");
      display.value = "";
      if (preview) preview.innerText = "";
    }
  }
}

// --- FITUR VOICE CALCULATOR (MODE CONTINUOUS / MANUAL TOGGLE) ---
let voiceCalc = null;
let isVoiceCalcActive = false;

function toggleVoiceCalculator() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return alert("Maaf, browser HP Anda belum mendukung fitur Voice. Gunakan Google Chrome.");
  }

  const indicator = document.getElementById("voice-calc-indicator");
  const textDisplay = document.getElementById("voice-calc-text");
  const btnMic = document.getElementById("btn-voice-calc");

  if (isVoiceCalcActive) {
    stopVoiceCalculator();
    return;
  }

  if(indicator) indicator.style.display = "flex";
  if(textDisplay) textDisplay.innerText = "Mendengarkan hitungan...";
  if(btnMic) {
    btnMic.style.transform = "scale(1.15)";
    btnMic.style.boxShadow = "0 0 12px rgba(239, 68, 68, 0.7)";
  }

  if (!voiceCalc) {
    voiceCalc = new SpeechRecognition();
    voiceCalc.lang = 'id-ID';
    voiceCalc.interimResults = true;
    voiceCalc.continuous = true;

    voiceCalc.onstart = function() {
      isVoiceCalcActive = true;
    };

    voiceCalc.onresult = function(event) {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      
      if(textDisplay) textDisplay.innerText = transcript;
      prosesVoiceKalkulator(transcript.toLowerCase().trim());
    };

    voiceCalc.onerror = function(event) {
      console.log("Voice Calc Error:", event.error);
    };

    voiceCalc.onend = function() {
      if (isVoiceCalcActive) {
        try { voiceCalc.start(); } catch(e) {}
      }
    };
  }

  try { voiceCalc.start(); } catch(e) {}
}

function stopVoiceCalculator() {
  isVoiceCalcActive = false;
  if (voiceCalc) {
    try { voiceCalc.stop(); } catch(e) {}
  }
  const ind = document.getElementById("voice-calc-indicator");
  if(ind) ind.style.display = "none";
  const btnMic = document.getElementById("btn-voice-calc");
  if(btnMic) {
    btnMic.style.transform = "scale(1)";
    btnMic.style.boxShadow = "none";
  }
}

function prosesVoiceKalkulator(text) {
  let parsed = text
    .replace(/tambah|ditambah/g, '+')
    .replace(/kurang|dikurang|dikurangi/g, '-')
    .replace(/kali|dikali/g, '*')
    .replace(/bagi|dibagi/g, '/')
    .replace(/koma/g, '.')
    .replace(/sama dengan|hasilnya|totalnya/g, '=');

  let mathString = parsed.replace(/[^0-9\+\-\*\/\.\=]/g, '');

  if(!mathString) return;

  const display = document.getElementById("calc-display");
  if (display) {
    display.value = formatKalkulator(mathString.replace(/=/g, ''));
    autoCalculate();

    if (mathString.includes('=') || text.includes('sama dengan') || text.includes('hasilnya')) {
      calculateResult();
    }
  }
}
// --- END FITUR VOICE CALCULATOR ---


