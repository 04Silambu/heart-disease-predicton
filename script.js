// Heart Disease Prediction - client-only model using Heart_Disease_Prediction.csv
// This is NOT medical advice. It's a simple statistical demo.

(function(){
  const $ = (sel) => document.querySelector(sel);
  let modelStats = null; // Will hold computed stats from CSV

  // Wait for both DOM and PapaParse to be ready
  function init() {
    console.log('Initializing app...');
    console.log('PapaParse available:', typeof Papa !== 'undefined');
    
    const form = $('#predict-form');
    const resultEl = $('#result');

    // Load and analyze the dataset on page load
    loadDataset();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = readForm();
      const score = riskScore(input);
      renderResult(score, input);
    });

    // Optional CSV analyze button
    const analyzeBtn = $('#analyze-btn');
    console.log('Analyze button found:', analyzeBtn);
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', onAnalyzeCSV);
      console.log('Event listener attached to analyze button');
    } else {
      console.error('Analyze button not found!');
    }
  }

  // Ensure PapaParse is loaded before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Give PapaParse a moment to load
      if (typeof Papa === 'undefined') {
        console.log('Waiting for PapaParse...');
        setTimeout(init, 100);
      } else {
        init();
      }
    });
  } else {
    // DOM already loaded
    if (typeof Papa === 'undefined') {
      console.log('Waiting for PapaParse...');
      setTimeout(init, 100);
    } else {
      init();
    }
  }

  // Load Heart_Disease_Prediction.csv and compute statistics
  function loadDataset(){
    fetch('data/Heart_Disease_Prediction.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (res) => {
            const rows = res.data;
            modelStats = computeModelStats(rows);
            console.log('Model loaded with', rows.length, 'samples');
          },
          error: (err) => {
            console.error('Failed to load dataset:', err);
          }
        });
      })
      .catch(err => {
        console.error('Failed to fetch dataset:', err);
      });
  }

  // Compute statistics from the dataset for prediction
  function computeModelStats(rows){
    const presence = rows.filter(r => String(r['Heart Disease']).toLowerCase().includes('presence'));
    const absence = rows.filter(r => String(r['Heart Disease']).toLowerCase().includes('absence'));

    const avg = (arr) => arr.reduce((a,b)=>a+b,0) / arr.length;

    // Compute averages for each group
    const presenceAvg = {
      age: avg(presence.map(r => r.Age)),
      bp: avg(presence.map(r => r.BP)),
      chol: avg(presence.map(r => r.Cholesterol)),
      maxHR: avg(presence.map(r => r['Max HR'])),
      cp: avg(presence.map(r => r['Chest pain type'])),
      sex: avg(presence.map(r => r.Sex)),
      fbs: avg(presence.map(r => r['FBS over 120'])),
      exang: avg(presence.map(r => r['Exercise angina']))
    };

    const absenceAvg = {
      age: avg(absence.map(r => r.Age)),
      bp: avg(absence.map(r => r.BP)),
      chol: avg(absence.map(r => r.Cholesterol)),
      maxHR: avg(absence.map(r => r['Max HR'])),
      cp: avg(absence.map(r => r['Chest pain type'])),
      sex: avg(absence.map(r => r.Sex)),
      fbs: avg(absence.map(r => r['FBS over 120'])),
      exang: avg(absence.map(r => r['Exercise angina']))
    };

    return { presenceAvg, absenceAvg, total: rows.length };
  }

  function readForm(){
    const age = Number($('#age').value);
    const sex = $('#sex').value; // 'male' | 'female'
    const cp = $('#cp').value;   // typical | atypical | non-anginal | asymptomatic
    const trestbps = Number($('#trestbps').value);
    const chol = Number($('#chol').value);
    const fbs = $('#fbs').value; // yes | no
    const thalach = Number($('#thalach').value);
    const exang = $('#exang').value; // yes | no
    return {age, sex, cp, trestbps, chol, fbs, thalach, exang};
  }

  // Data-driven risk score using Naive Bayes-like approach
  // Computes distance to "Presence" vs "Absence" group averages
  function riskScore(x){
    // If model not loaded yet, use fallback heuristic
    if (!modelStats) {
      return fallbackRiskScore(x);
    }

    // Convert form inputs to numeric values matching CSV format
    const age = x.age;
    const sex = x.sex === 'male' ? 1 : 0;
    
    // Map chest pain type: typical=1, atypical=2, non-anginal=3, asymptomatic=4
    let cp = 1;
    switch(x.cp){
      case 'typical': cp = 1; break;
      case 'atypical': cp = 2; break;
      case 'non-anginal': cp = 3; break;
      case 'asymptomatic': cp = 4; break;
    }
    
    const bp = x.trestbps;
    const chol = x.chol;
    const fbs = x.fbs === 'yes' ? 1 : 0;
    const maxHR = x.thalach;
    const exang = x.exang === 'yes' ? 1 : 0;

    // Compute Euclidean distance to each group's average
    const distToPresence = Math.sqrt(
      Math.pow(age - modelStats.presenceAvg.age, 2) +
      Math.pow(sex - modelStats.presenceAvg.sex, 2) * 10 + // weight sex more
      Math.pow(cp - modelStats.presenceAvg.cp, 2) * 15 +
      Math.pow(bp - modelStats.presenceAvg.bp, 2) / 100 +
      Math.pow(chol - modelStats.presenceAvg.chol, 2) / 1000 +
      Math.pow(fbs - modelStats.presenceAvg.fbs, 2) * 8 +
      Math.pow(maxHR - modelStats.presenceAvg.maxHR, 2) / 50 +
      Math.pow(exang - modelStats.presenceAvg.exang, 2) * 12
    );

    const distToAbsence = Math.sqrt(
      Math.pow(age - modelStats.absenceAvg.age, 2) +
      Math.pow(sex - modelStats.absenceAvg.sex, 2) * 10 +
      Math.pow(cp - modelStats.absenceAvg.cp, 2) * 15 +
      Math.pow(bp - modelStats.absenceAvg.bp, 2) / 100 +
      Math.pow(chol - modelStats.absenceAvg.chol, 2) / 1000 +
      Math.pow(fbs - modelStats.absenceAvg.fbs, 2) * 8 +
      Math.pow(maxHR - modelStats.absenceAvg.maxHR, 2) / 50 +
      Math.pow(exang - modelStats.absenceAvg.exang, 2) * 12
    );

    // Convert distances to probability (closer to Presence = higher risk)
    // Using softmax-like normalization
    const totalDist = distToPresence + distToAbsence;
    if (totalDist === 0) return 0.5;
    
    // Risk is inversely proportional to distance to Presence group
    const riskProb = distToAbsence / totalDist;
    return riskProb;
  }

  // Fallback heuristic if CSV not loaded
  function fallbackRiskScore(x){
    const norm = (v, min, max) => Math.min(1, Math.max(0, (v - min) / (max - min)));
    const ageN = norm(x.age, 20, 80);
    const male = x.sex === 'male' ? 1 : 0;
    let cpScore = 0;
    switch(x.cp){
      case 'asymptomatic': cpScore = 1; break;
      case 'non-anginal': cpScore = 0.7; break;
      case 'atypical': cpScore = 0.4; break;
      case 'typical':
      default: cpScore = 0.2; break;
    }
    const bpN = norm(x.trestbps, 90, 200);
    const cholN = norm(x.chol, 120, 400);
    const fbs1 = x.fbs === 'yes' ? 1 : 0;
    const thalachN = 1 - norm(x.thalach, 90, 210);
    const exang1 = x.exang === 'yes' ? 1 : 0;

    const w = {age: 0.12, male: 0.08, cp: 0.20, bp: 0.12, chol: 0.12, fbs: 0.10, thalach: 0.14, exang: 0.12, bias: -0.15};
    const z = w.bias + w.age*ageN + w.male*male + w.cp*cpScore + w.bp*bpN + w.chol*cholN + w.fbs*fbs1 + w.thalach*thalachN + w.exang*exang1;
    const sigmoid = (t) => 1 / (1 + Math.exp(-6*(t-0.5)));
    return Math.min(1, Math.max(0, sigmoid(z)));
  }

  // ------- Enhanced Result Rendering -------
  function renderResult(score, input){
    const el = document.getElementById('result');
    if (!el) return;

    const tier = scoreTier(score); // 'low' | 'mid' | 'high'
    el.className = 'result ' + (tier === 'high' ? 'warn' : 'ok');

    const deg = Math.max(0, Math.min(180, Math.round(score * 180))); // 0..180 deg
    const pct = Math.round(score * 100);
    const badgeClass = tier === 'high' ? 'score-high' : (tier === 'mid' ? 'score-mid' : 'score-low');
    const title = tier === 'high' ? 'High Risk' : (tier === 'mid' ? 'Moderate Risk' : 'Low Risk');

    const recs = recommendations(tier);

    el.innerHTML = `
      <div class="headline">
        <span>🫀 Prediction Result</span>
        <span class="score-badge ${badgeClass}" aria-label="Risk score ${pct} percent">${title} · ${pct}%</span>
      </div>
      <div class="sub">This is a statistical estimate based on your inputs. Not medical advice.</div>

      <div class="risk-wrap">
        <div class="gauge" aria-hidden="true">
          <div class="needle" id="risk-needle"></div>
          <div class="cap"></div>
        </div>
        <div>
          <div class="kv">
            <div class="item"><div class="k">Age</div><div class="v">${Number(input.age) || '-'} yrs</div></div>
            <div class="item"><div class="k">Sex</div><div class="v">${input.sex}</div></div>
            <div class="item"><div class="k">Chest Pain</div><div class="v">${input.cp}</div></div>
            <div class="item"><div class="k">Resting BP</div><div class="v">${Number(input.trestbps) || '-'} mm Hg</div></div>
            <div class="item"><div class="k">Cholesterol</div><div class="v">${Number(input.chol) || '-'} mg/dl</div></div>
            <div class="item"><div class="k">Fasting Sugar</div><div class="v">${input.fbs === 'yes' ? '>120' : '≤120'}</div></div>
            <div class="item"><div class="k">Max HR</div><div class="v">${Number(input.thalach) || '-'} bpm</div></div>
            <div class="item"><div class="k">Exercise Angina</div><div class="v">${input.exang}</div></div>
          </div>
          <div class="divider"></div>
          <div class="recs" aria-label="Recommendations">
            ${recs.map(r => (
              `<div class="rec"><div class="icon">${r.icon}</div><div><div class="title">${r.title}</div><div class="text">${r.text}</div></div></div>`
            )).join('')}
          </div>
        </div>
      </div>
    `;

    // Animate needle after insertion
    requestAnimationFrame(() => {
      const needle = document.getElementById('risk-needle');
      if (needle) needle.style.transform = `translateX(-50%) rotate(${deg}deg)`;
    });
  }

  function scoreTier(score){
    if (score >= 0.66) return 'high';
    if (score >= 0.33) return 'mid';
    return 'low';
  }

  function recommendations(tier){
    if (tier === 'high'){
      return [
        { icon: '⚠️', title: 'Consult a professional', text: 'Please consider scheduling an appointment with a healthcare provider.' },
        { icon: '🥗', title: 'Lifestyle changes', text: 'Adopt a heart-healthy diet, reduce sodium, and avoid trans fats.' },
        { icon: '🚶', title: 'Activity & monitoring', text: 'Regular moderate exercise and routine blood pressure checks.' }
      ];
    } else if (tier === 'mid'){
      return [
        { icon: 'ℹ️', title: 'Keep track', text: 'Monitor blood pressure and cholesterol levels regularly.' },
        { icon: '🍎', title: 'Diet optimization', text: 'Increase fiber intake and maintain balanced meals.' },
        { icon: '🏃', title: 'Stay active', text: 'Aim for 150 minutes of moderate exercise weekly.' }
      ];
    }
    return [
      { icon: '✅', title: 'Maintain habits', text: 'Great job—keep up your healthy routine and regular checkups.' },
      { icon: '💧', title: 'Hydration & sleep', text: 'Stay hydrated and prioritize quality sleep.' },
      { icon: '🧘', title: 'Stress management', text: 'Incorporate relaxation techniques like deep breathing or yoga.' }
    ];
  }

  // Optional CSV analyzer using PapaParse
  function onAnalyzeCSV(e){
    console.log('=== onAnalyzeCSV called ===');
    console.log('Event:', e);
    
    const fileInput = document.getElementById('csvFile');
    const statsEl = document.getElementById('stats');
    
    console.log('Analyze button clicked');
    console.log('File input element:', fileInput);
    console.log('Stats element:', statsEl);
    console.log('Files:', fileInput ? fileInput.files : 'no input');
    console.log('Number of files:', fileInput ? fileInput.files.length : 0);
    
    // Immediate visual feedback
    if (statsEl) {
      statsEl.innerHTML = '<div style="color: #1976d2; padding: 10px; background: #e3f2fd; border-radius: 4px;">🔄 Processing...</div>';
    }
    
    // Check if PapaParse is loaded
    if (typeof Papa === 'undefined') {
      if (statsEl) {
        statsEl.innerHTML = '<div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;"><strong>Error:</strong> CSV parser library (PapaParse) failed to load.<br><br>Please:<br>1. Check your internet connection<br>2. Refresh the page (Ctrl+F5)<br>3. Make sure the CDN is not blocked</div>';
      }
      console.error('PapaParse library not loaded - typeof Papa:', typeof Papa);
      return;
    }
    
    if (!fileInput || !fileInput.files || !fileInput.files[0]){
      if (statsEl) {
        statsEl.innerHTML = '<div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;">⚠️ Please choose a CSV file first.</div>';
      }
      return;
    }

    const file = fileInput.files[0];
    console.log('Selected file:', file.name, 'Size:', file.size, 'bytes');
    if (statsEl) {
      statsEl.innerHTML = '<div style="color: #1976d2; padding: 10px; background: #e3f2fd; border-radius: 4px;">📊 Analyzing CSV: ' + file.name + '...</div>';
    }
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        console.log('CSV parsed, rows:', res.data.length);
        console.log('First row:', res.data[0]);
        console.log('Columns:', Object.keys(res.data[0] || {}));
        const rows = res.data;
        
        // Support both old and new column names
        const getAge = (r) => r.Age || r.age;
        const getBP = (r) => r.BP || r.trestbps;
        const getChol = (r) => r.Cholesterol || r.chol;
        const getMaxHR = (r) => r['Max HR'] || r.thalach;
        const getSex = (r) => r.Sex || r.sex;
        const getExang = (r) => r['Exercise angina'] || r.exang;
        const getCP = (r) => r['Chest pain type'] || r.cp;
        const getDisease = (r) => r['Heart Disease'] || r.target;
        
        // Log first row for debugging
        if (rows.length > 0) {
          const firstRow = rows[0];
          console.log('First row values:', {
            age: getAge(firstRow),
            bp: getBP(firstRow),
            chol: getChol(firstRow),
            maxHR: getMaxHR(firstRow)
          });
        }
        
        const keep = rows.filter(r => {
          const age = getAge(r);
          const bp = getBP(r);
          const chol = getChol(r);
          const maxHR = getMaxHR(r);
          return isFinite(age) && isFinite(bp) && isFinite(chol) && isFinite(maxHR);
        });
        
        console.log('Valid rows:', keep.length, 'out of', rows.length);
        
        if (!keep.length){
          statsEl.innerHTML = `<div style="color: #d32f2f;"><strong>Error:</strong> Could not find valid numeric data in CSV.</div>
            <div style="margin-top:0.5rem; font-size:0.9em;">Expected columns: Age, Sex, BP (or trestbps), Cholesterol (or chol), Max HR (or thalach)</div>
            <div style="margin-top:0.5rem; font-size:0.9em;">Found columns: ${Object.keys(rows[0] || {}).join(', ')}</div>`;
          return;
        }

        const avg = (arr) => arr.reduce((a,b)=>a+b,0)/arr.length;
        const ages = keep.map(r=>Number(getAge(r)));
        const bps = keep.map(r=>Number(getBP(r)));
        const chols = keep.map(r=>Number(getChol(r)));
        const ths = keep.map(r=>Number(getMaxHR(r)));
        const maleShare = avg(keep.map(r=> (Number(getSex(r))===1 || String(getSex(r)).toLowerCase()==='male') ? 1:0));
        const exangShare = avg(keep.map(r=> (Number(getExang(r))===1 || String(getExang(r)).toLowerCase()==='yes') ? 1:0));

        // Count disease presence/absence
        const diseaseVals = keep.map(r => String(getDisease(r)).toLowerCase());
        const presenceCount = diseaseVals.filter(v => v.includes('presence') || v==='1').length;
        const absenceCount = diseaseVals.filter(v => v.includes('absence') || v==='0').length;

        // Chest pain distribution (1=typical, 2=atypical, 3=non-anginal, 4=asymptomatic)
        const cpVals = keep.map(r=> Number(getCP(r)));
        const cpCounts = {1:0, 2:0, 3:0, 4:0};
        cpVals.forEach(v=>{
          if (v >= 1 && v <= 4) cpCounts[v]++;
        });
        const total = keep.length || 1;

        statsEl.innerHTML = `
          <div style="padding: 10px; background: #e8f5e9; border-radius: 4px; margin-bottom: 10px;">
            <strong style="color: #2e7d32;">✅ Analysis Complete!</strong>
          </div>
          <div><strong>Total Rows:</strong> ${keep.length}</div>
          <div><strong>Heart Disease:</strong> ${presenceCount} Presence, ${absenceCount} Absence</div>
          <div style="margin-top:.5rem"><strong>Averages:</strong></div>
          <div style="margin-left:1rem">Age: ${avg(ages).toFixed(1)} years</div>
          <div style="margin-left:1rem">BP: ${avg(bps).toFixed(1)} mm Hg</div>
          <div style="margin-left:1rem">Cholesterol: ${avg(chols).toFixed(1)} mg/dl</div>
          <div style="margin-left:1rem">Max HR: ${avg(ths).toFixed(1)} bpm</div>
          <div style="margin-top:.5rem"><strong>Demographics:</strong></div>
          <div style="margin-left:1rem">Male: ${(maleShare*100).toFixed(1)}%</div>
          <div style="margin-left:1rem">Exercise Angina: ${(exangShare*100).toFixed(1)}%</div>
          <div style="margin-top:.5rem"><strong>Chest Pain Distribution:</strong></div>
          <ul style="margin:.3rem 0 .2rem 1rem">
            <li>Type 1 (Typical): ${Math.round(100*cpCounts[1]/total)}%</li>
            <li>Type 2 (Atypical): ${Math.round(100*cpCounts[2]/total)}%</li>
            <li>Type 3 (Non-anginal): ${Math.round(100*cpCounts[3]/total)}%</li>
            <li>Type 4 (Asymptomatic): ${Math.round(100*cpCounts[4]/total)}%</li>
          </ul>
        `;
        
        console.log('=== Analysis complete and displayed ===');
      },
      error: (err) => {
        console.error('Papa.parse error:', err);
        if (statsEl) {
          statsEl.innerHTML = '<div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;"><strong>Failed to parse CSV:</strong> ' + err + '</div>';
        }
      }
    });
  }
})();
