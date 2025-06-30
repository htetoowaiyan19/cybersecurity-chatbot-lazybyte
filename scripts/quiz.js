export class QuizApp {
  constructor(supabase, session) {
    if (!session) {
      alert('Please login to access the quiz.');
      window.location.hash = '#login';
      return;
    }

    this.supabase = supabase;
    this.session = session;
    this.userId = session.user.id;

    this.dailyBtn = document.getElementById('dailyQuizBtn');
    this.challengeBtn = document.getElementById('challengeModeBtn');
    this.challengeSelection = document.getElementById('challengeSelection');
    this.quizSection = document.getElementById('quizSection');
    this.submitBtn = document.getElementById('submitBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.timerEl = document.getElementById('timer');

    this.mode = null;
    this.difficulty = null;
    this.quizData = [];
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.timer = null;
    this.questionDurations = {};
    this.timeLeft = 0;

    this.dailyCooldownTimer = null;

    this.checkAndApplyPointDecay();
    this.attachEventListeners();
    this.attachModalButtonHandlers();
    this.checkDailyQuizCooldown();
    this.attachHelpButtonHandler();
    this.show48DayResetInfo();
  }

  showModal(modalId) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) {
      console.error(`Modal with ID "${modalId}" not found. Make sure it's loaded.`);
      return;
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  renderCircleProgress(canvasId, percentage) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const radius = size / 2 - 10;
    const center = size / 2;
    const start = -Math.PI / 2;
    const end = start + (2 * Math.PI * (percentage / 100));

    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(center, center, radius, start, end);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${percentage}%`, center, center);
  }

  async getStartOfWeekServerTimeAdjusted() {
    const { data: serverTimeData, error } = await this.supabase.rpc('get_current_utc_timestamp');
    if (error || !serverTimeData) {
      console.warn('Failed to get server time, fallback to client time.');
      return this.getFallbackLocalMonday();
    }

    const serverTime = new Date(serverTimeData);

    // TimeZone UTC + 6:30
    const offsetMs = 6.5 * 60 * 60 * 1000;
    const localTime = new Date(serverTime.getTime() + offsetMs);

    const day = localTime.getUTCDay();
    const diff = localTime.getUTCDate() - day + (day === 0 ? -6 : 1)

    const mondayLocal = new Date(localTime);
    mondayLocal.setUTCDate(diff);
    mondayLocal.setUTCHours(0, 0, 0, 0);

    const mondayUTC = new Date(mondayLocal.getTime() - offsetMs);
    return mondayUTC.toISOString();
  }

  getFallbackLocalMonday() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  async hasCompletedDifficultyThisWeek(difficulty) {
    const startOfWeek = await this.getStartOfWeekServerTimeAdjusted();

    const { data, error } = await this.supabase
      .from('quiz_submissions')
      .select('id')
      .eq('user_id', this.userId)
      .eq('quiz_type', 'challenge')
      .eq('difficulty', difficulty)
      .gte('submitted_at', startOfWeek)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error checking "${difficulty}" completion:`, error);
      return false;
    }

    return !!data;
  }

  attachEventListeners() {
    this.dailyBtn.addEventListener('click', () => this.startDailyQuiz());
    this.challengeBtn.addEventListener('click', () => this.showChallengeSelection());

    ['normalBtn', 'hardBtn', 'extremeBtn', 'legendBtn'].forEach(id => {
      const btn = document.getElementById(id);
      btn.addEventListener('click', () => {
        const difficulty = btn.dataset.difficulty;
        this.startChallengeQuiz(difficulty);
      });
    });

    this.nextBtn.addEventListener('click', () => this.goNextQuestion());
    this.submitBtn.addEventListener('click', async () => await this.submitResults());
  }

  async checkDailyQuizCooldown() {
    if (this.dailyCooldownTimer) {
      clearInterval(this.dailyCooldownTimer);
      this.dailyCooldownTimer = null;
    }

    const { data: serverTimeData, error: serverTimeError } = await this.supabase.rpc('get_current_utc_timestamp');
    let now = serverTimeData ? new Date(serverTimeData) : new Date();

    const offsetMs = 6.5 * 60 * 60 * 1000;

    // Get server time adjusted to local timezone (UTC+6:30)
    const localTime = new Date(now.getTime() + offsetMs);

    // Get midnight of the local day
    localTime.setUTCHours(0, 0, 0, 0);

    // Convert back to UTC
    const resetTimeUTC = new Date(localTime.getTime() - offsetMs);

    // Determine the next reset time (next UTC+6:30 midnight)
    const nextResetUTC = now >= resetTimeUTC
      ? new Date(resetTimeUTC.getTime() + 24 * 60 * 60 * 1000)
      : resetTimeUTC;

    const cooldownMs = nextResetUTC - now;

    const submittedToday = await this.hasSubmittedDailyToday();

    if (cooldownMs <= 0 && !submittedToday) {
      this.dailyBtn.disabled = false;
      this.dailyBtn.classList.remove('disabled');
      this.dailyBtn.textContent = 'Start Daily Quiz';
      console.log('Daily quiz button enabled (not submitted and time passed)');
    } else {
      this.dailyBtn.disabled = true;
      this.dailyBtn.classList.add('disabled');
      this.updateCooldownText(cooldownMs);

      this.dailyCooldownTimer = setInterval(async () => {
        const { data: serverTimeUpdate } = await this.supabase.rpc('get_current_utc_timestamp');
        const currentTime = serverTimeUpdate ? new Date(serverTimeUpdate) : new Date();

        const diff = nextResetUTC - currentTime;

        const submitted = await this.hasSubmittedDailyToday();
        if (diff <= 0 && !submitted) {
          clearInterval(this.dailyCooldownTimer);
          this.dailyCooldownTimer = null;
          this.dailyBtn.disabled = false;
          this.dailyBtn.classList.remove('disabled');
          this.dailyBtn.textContent = 'Start Daily Quiz';
          console.log('Cooldown expired and daily not submitted, enabled.');
        } else {
          this.updateCooldownText(diff);
        }
      }, 1000);
    }
  }

  updateCooldownText(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.dailyBtn.textContent = `Daily Quiz Locked - Retry in ${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  }

  async fetchQuizzes(mode, difficulty = null) {
    let query = this.supabase.from('quiz_questions').select('*');
    if (mode === 'daily') {
      query = query.in('mode', ['daily', 'both']).neq('difficulty', 'Dire');
    } else if (mode === 'challenge' && difficulty) {
      query = query.in('mode', ['challenge', 'both']).eq('difficulty', difficulty);
    } else {
      return [];
    }

    const { data, error } = await query;
    if (error) {
      alert('Failed to load quiz questions: ' + error.message);
      return [];
    }
    return data.sort(() => Math.random() - 0.5).slice(0, 10);
  }

  getChallengePointsPerQuestion(idx) {
    const q = this.quizData[idx];
    const correct = this.answers[idx] === q.correct_option;
    const duration = this.questionDurations[idx] || this.getTimeLimit();

    if (!correct) return 0;

    const scoringRules = {
      Normal: [
        { maxTime: 600, points: 20 },
        { maxTime: 900, points: 10 },
        { maxTime: 1200, points: 5 },
      ],
      Hard: [
        { maxTime: 180, points: 40 },
        { maxTime: 300, points: 20 },
        { maxTime: 420, points: 5 },
      ],
      Extreme: [
        { maxTime: 60, points: 80 },
        { maxTime: 120, points: 40 },
        { maxTime: 180, points: 5 },
      ],
      Dire: [
        { maxTime: 5, points: 120 },
        { maxTime: 10, points: 60 },
        { maxTime: 30, points: 5 },
      ],
    };

    const rules = scoringRules[this.difficulty];
    if (!rules) return 0;

    for (const rule of rules) {
      if (duration <= rule.maxTime) {
        return rule.points;
      }
    }

    return 0;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  renderQuestion(idx) {
    if (!this.quizData[idx]) return;

    this.currentQuestionIndex = idx;
    const q = this.quizData[idx];

    document.getElementById('questionNumber').textContent = idx + 1;
    document.getElementById('questionText').textContent = q.question;

    const optionKeys = ['a', 'b', 'c', 'd'];
    this.shuffledOptionKeys = this.shuffleArray(optionKeys.slice());

    this.shuffledOptionKeys.forEach((opt, i) => {
      const label = document.getElementById('label' + (String.fromCharCode(65 + i))); // A, B, C, D
      const input = document.getElementById('option' + (String.fromCharCode(65 + i)));
      label.textContent = q.options[opt];
      input.checked = this.answers[idx] === opt;

      input.value = opt;
      input.onchange = () => this.updateButtonStates();
    });

    this.nextBtn.style.display = idx === this.quizData.length - 1 ? 'none' : 'inline-block';
    this.submitBtn.classList.toggle('d-none', idx !== this.quizData.length - 1);

    if (this.mode === 'challenge') {
      this.questionStartTime = Date.now();
      this.startTimer(this.getTimeLimit());
    }

    this.updateButtonStates();
  }


  startTimer(seconds) {
    this.timeLeft = seconds;
    this.timerEl.textContent = `Time left: ${this.timeLeft}s`;

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.timerEl.textContent = `Time left: ${this.timeLeft}s`;

      const elapsed = seconds - this.timeLeft;
      const challengePoints = document.querySelectorAll('#challengePointsList .challenge-point');

      challengePoints.forEach(p => {
        const threshold = Number(p.dataset.time);
        if (elapsed > threshold) {
          p.classList.add('gray');
        } else {
          p.classList.remove('gray');
        }
      });

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.failChallengeQuiz();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timer);
    this.timerEl.textContent = '';
  }

  saveAnswer() {
    const selected = document.querySelector('input[name="answer"]:checked');
    if (selected) {
      this.answers[this.currentQuestionIndex] = selected.value;
    }
  }

  goNextQuestion() {
    this.saveAnswer();
    const now = Date.now();
    const duration = Math.floor((now - this.questionStartTime) / 1000);
    this.questionDurations[this.currentQuestionIndex] = duration;

    if (this.currentQuestionIndex < this.quizData.length - 1) {
      this.renderQuestion(this.currentQuestionIndex + 1);
      if (this.mode === 'challenge') {
        this.startTimer(this.getTimeLimit());
      }
    }

    this.updateButtonStates();
  }

  calculateScore() {
    let score = 0;
    this.quizData.forEach((q, idx) => {
      if (this.answers[idx] === q.correct_option) score++;
    });
    return score;
  }

  getPoints() {
    if (this.mode === 'daily') {
      const score = this.calculateScore();
      return Math.min(score * 20, 200);
    }

    if (this.mode === 'challenge') {
      let total = 0;
      for (let i = 0; i < this.quizData.length; i++) {
        total += this.getChallengePointsPerQuestion(i);
      }
      return total;
    }
    return 0;
  }

  getTimeLimit() {
    const timeLimits = {
      Normal: 30 * 60,
      Hard: 10 * 60,
      Extreme: 5 * 60,
      Dire: 60,
    };
    return timeLimits[this.difficulty] || 0;
  }

  async hasCompletedThisWeek() {
    const startOfWeek = await this.getStartOfWeekServerTimeAdjusted();
    const { data, error } = await this.supabase
      .from('quiz_submissions')
      .select('id')
      .eq('user_id', this.userId)
      .eq('quiz_type', this.mode)
      .eq('difficulty', this.difficulty)
      .gte('submitted_at', startOfWeek)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking submissions:', error);
      return false;
    }
    return !!data;
  }

  async submitResults() {
    if (this.submitted) return;
    this.submitted = true;
    this.submitBtn.disabled = true;

    this.saveAnswer();
    this.stopTimer();
    const now = Date.now();
    const duration = Math.floor((now - this.questionStartTime) / 1000);
    this.questionDurations[this.currentQuestionIndex] = duration;

    const alreadySubmitted = await this.hasCompletedThisWeek();
    const score = this.calculateScore();
    console.log('Calculating points with:', {
      mode: this.mode,
      difficulty: this.difficulty,
      durations: this.questionDurations,
      answers: this.answers
    });

    const points = alreadySubmitted ? 0 : this.getPoints();
    const timeTaken = Object.values(this.questionDurations).reduce((a, b) => a + b, 0);
    const percentage = Math.round((score / this.quizData.length) * 100);

    let missed;
    if (this.mode === 'daily') {
      missed = 200 - points;
    } else if (this.mode === 'challenge') {
      const maxPointsByDifficulty = {
        Normal: 200,
        Hard: 400,
        Extreme: 800,
        Dire: 1200,
      };
      const maxPoints = maxPointsByDifficulty[this.difficulty] || 0;
      missed = maxPoints - points;
    } else {
      missed = undefined;
    }

    const { error: insertError } = await this.supabase.from('quiz_submissions').insert([{
      user_id: this.userId,
      quiz_type: this.mode,
      difficulty: this.difficulty,
      score: points,
    }]);

    if (insertError) {
      alert('Failed to submit quiz results: ' + insertError.message);
      return;
    }

    if (!alreadySubmitted) {
      const { error: rpcError } = await this.supabase.rpc('increment_user_points', {
        uid: this.userId,
        pts: points,
      });

      if (rpcError) {
        alert('Failed to update user total points: ' + rpcError.message);
        return;
      }
    }

    document.dispatchEvent(new CustomEvent('points-updated'));

    if (!alreadySubmitted) {
      document.getElementById('quizPointsEarned').textContent = points;
      document.getElementById('quizTimeTaken').textContent = `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`;
      document.getElementById('quizCorrectCount').textContent = score;
      document.getElementById('quizPointsMissed').textContent = missed !== undefined ? missed : '-';
      this.renderCircleProgress('quizSuccessChart', percentage);
      this.showModal('quizCompletedModal');
    } else {
      document.getElementById('quizBlockedTime').textContent = `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`;
      document.getElementById('quizBlockedCorrect').textContent = `${score}/${this.quizData.length}`;
      this.renderCircleProgress('quizBlockedChart', percentage);
      this.showModal('quizBlockedModal');
    }

    if (this.mode === 'daily') {
      this.checkDailyQuizCooldown();
    }
  }

  failChallengeQuiz() {
    document.dispatchEvent(new CustomEvent('points-updated'));
    this.showModal('quizFailedModal');
  }

  async startDailyQuiz() {
    if (this.dailyBtn.disabled) {
      alert("Daily quiz is on cooldown. Please wait.");
      return;
    }

    this.mode = 'daily';
    this.difficulty = null;
    this.submitted = false;

    this.challengeSelection.classList.add('d-none');
    this.quizSection.classList.remove('d-none');
    this.submitBtn.classList.remove('d-none');
    this.nextBtn.style.display = 'inline-block';

    this.quizData = await this.fetchQuizzes(this.mode);
    this.answers = {};
    this.renderQuestion(0);
    this.stopTimer();
  }

  async showChallengeSelection() {
    this.mode = 'challenge';

    this.challengeSelection.classList.remove('d-none');
    this.quizSection.classList.add('d-none');
    this.submitBtn.classList.add('d-none');
    this.nextBtn.style.display = 'none';

    const btns = {
      Normal: document.getElementById('normalBtn'),
      Hard: document.getElementById('hardBtn'),
      Extreme: document.getElementById('extremeBtn'),
      Dire: document.getElementById('legendBtn'),
    };

    const unlockMsgs = {
      Hard: document.getElementById('hardUnlockMsg'),
      Extreme: document.getElementById('extremeUnlockMsg'),
      Dire: document.getElementById('direUnlockMsg'),
    };

    // Reset all buttons to disabled and show all unlock messages
    Object.keys(btns).forEach(diff => {
      btns[diff].disabled = true;
      btns[diff].classList.add('disabled');
      if (unlockMsgs[diff]) unlockMsgs[diff].style.display = 'block';
    });

    // Always enable Normal
    btns.Normal.disabled = false;
    btns.Normal.classList.remove('disabled');

    // Unlock progressively
    const normalDone = await this.hasCompletedDifficultyThisWeek('Normal');
    if (normalDone) {
      btns.Hard.disabled = false;
      btns.Hard.classList.remove('disabled');
      if (unlockMsgs.Hard) unlockMsgs.Hard.style.display = 'none';

      const hardDone = await this.hasCompletedDifficultyThisWeek('Hard');
      if (hardDone) {
        btns.Extreme.disabled = false;
        btns.Extreme.classList.remove('disabled');
        if (unlockMsgs.Extreme) unlockMsgs.Extreme.style.display = 'none';

        const extremeDone = await this.hasCompletedDifficultyThisWeek('Extreme');
        if (extremeDone) {
          btns.Dire.disabled = false;
          btns.Dire.classList.remove('disabled');
          if (unlockMsgs.Dire) unlockMsgs.Dire.style.display = 'none';
        }
      }
    }

    this.updateButtonStates();
  }

  async startChallengeQuiz(difficulty) {
    document.getElementById('challengePointsBox').classList.add('d-none');

    this.mode = 'challenge';
    this.difficulty = difficulty;
    this.submitted = false;

    this.challengeSelection.classList.add('d-none');
    this.quizSection.classList.remove('d-none');
    this.submitBtn.classList.remove('d-none');
    this.nextBtn.style.display = 'inline-block';

    this.renderChallengePointsBox();

    this.quizData = await this.fetchQuizzes(this.mode, this.difficulty);
    this.answers = {};
    this.renderQuestion(0);

    if (this.difficulty) {
      this.startTimer(this.getTimeLimit());
    }

    this.updateButtonStates();
  }

  renderChallengePointsBox() {
    const container = document.getElementById('challengePointsBox');
    const list = document.getElementById('challengePointsList');
    list.innerHTML = '';

    if (this.mode !== 'challenge' || !this.difficulty) {
      container.classList.add('d-none');
      return;
    }

    container.classList.remove('d-none');
    document.getElementById('challengeTitle').textContent = `Challenge Mode - ${this.difficulty}`;

    const pointsText = {
      Normal: [
        { time: 600, text: 'Complete each quiz within 600s (20 pts)' },
        { time: 900, text: 'Complete each quiz within 900s (10 pts)' },
        { time: 1200, text: 'Complete each quiz within 1200s (5 pts)' }
      ],
      Hard: [
        { time: 180, text: 'Complete each quiz within 180s (40 pts)' },
        { time: 300, text: 'Complete each quiz within 300s (20 pts)' },
        { time: 420, text: 'Complete each quiz within 420s (5 pts)' }
      ],
      Extreme: [
        { time: 60, text: 'Complete each quiz within 60s (80 pts)' },
        { time: 120, text: 'Complete each quiz within 120s (40 pts)' },
        { time: 180, text: 'Complete each quiz within 180s (5 pts)' }
      ],
      Dire: [
        { time: 5, text: 'Complete each quiz within 5s (120 pts)' },
        { time: 10, text: 'Complete each quiz within 10s (60 pts)' },
        { time: 30, text: 'Complete each quiz within 30s (5 pts)' }
      ]
    };

    const entries = pointsText[this.difficulty] || [];

    entries.forEach(({ time, text }) => {
      const p = document.createElement('p');
      p.classList.add('challenge-point', 'd-flex', 'align-items-center', 'gap-2');
      p.dataset.time = time;

      const icon = document.createElement('span');
      icon.classList.add('point-icon');
      icon.textContent = '⏳';

      const textNode = document.createElement('span');
      textNode.textContent = text;

      p.appendChild(icon);
      p.appendChild(textNode);
      list.appendChild(p);
    });
  }

  attachModalButtonHandlers() {
    const retryBtn = document.getElementById('retryQuizBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.resetQuiz();
      });
    }

    const finalizeBtn = document.getElementById('finalizeQuizBtn');
    if (finalizeBtn) {
      finalizeBtn.addEventListener('click', async () => {
        await this.submitResults();
      });
    }

    const exitButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
    exitButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.resetQuiz();
      });
    });
  }

  attachHelpButtonHandler() {
    document.getElementById('quizHelpBtn')?.addEventListener('click', () => {
    const existingModal = document.getElementById('quizHelpModal');

    if (existingModal) {
      // If already loaded, just show it
      const modal = new bootstrap.Modal(existingModal);
      modal.show();
    } else {
      // Load the HTML and insert into the body
      fetch('../../HTMLComponents/quiz_help.html')
        .then(res => res.text())
        .then(html => {
          document.body.insertAdjacentHTML('beforeend', html);
          const newModal = document.getElementById('quizHelpModal');
          if (newModal) {
            const modal = new bootstrap.Modal(newModal);
            modal.show();
          }
        })
        .catch(err => {
          console.error('Failed to load help modal:', err);
          alert('Failed to load help. Please try again later.');
        });
      }
    });
  }

  resetQuiz() {
    this.stopTimer();
    this.answers = {};
    this.currentQuestionIndex = 0;
    this.submitted = false;

    const modals = ['quizCompletedModal', 'quizBlockedModal', 'quizFailedModal'];
    modals.forEach(id => {
      const modalEl = document.getElementById(id);
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }
    });

    if (this.mode === 'challenge') {
      this.showChallengeSelection();
    }

    this.quizSection.classList.add('d-none');
    this.challengeSelection.classList.remove('d-none');
    this.submitBtn.disabled = false;

    document.getElementById('challengePointsBox').classList.add('d-none');
  }

  updateButtonStates() {
    const hasAnswer = !!document.querySelector('input[name="answer"]:checked');

    const isLastQuestion = this.currentQuestionIndex === this.quizData.length - 1;
    this.nextBtn.disabled = !hasAnswer;
    this.submitBtn.disabled = !hasAnswer || !isLastQuestion;
  }

  async checkAndApplyPointDecay() {
    const startDate = new Date('2025-06-01T00:00:00Z'); // UTC start
    const now = new Date();

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor((now - startDate) / msPerDay);

    if (daysPassed < 0 || daysPassed % 48 !== 0) {
      return; // Not a decay day
    }

    // Use Supabase to check if decay already applied for this user today
    const { data: decayLog, error } = await this.supabase
      .from('point_decay_log')
      .select('id')
      .eq('user_id', this.userId)
      .gte('applied_at', now.toISOString().slice(0, 10)) // today only
      .maybeSingle();

    if (error) {
      console.error('Decay check failed:', error);
      return;
    }

    if (decayLog) {
      console.log('Decay already applied today.');
      return;
    }

    // Call RPC to decay points
    const { error: decayError } = await this.supabase.rpc('decay_user_points', {
      uid: this.userId
    });

    if (decayError) {
      console.error('Decay failed:', decayError);
      return;
    }

    // Log decay to prevent double-decay on same day
    const { error: logError } = await this.supabase.from('point_decay_log').insert([
      { user_id: this.userId, applied_at: new Date().toISOString() }
    ]);

    if (logError) {
      console.error('Decay log insert failed:', logError);
    } else {
      console.log('Decay applied and logged.');
    }
  }

  async hasSubmittedDailyToday() {
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    const { data, error } = await this.supabase
      .from('quiz_submissions')
      .select('id')
      .eq('user_id', this.userId)
      .eq('quiz_type', 'daily')
      .gte('submitted_at', todayUTC.toISOString())
      .limit(1)
      .maybeSingle();

    return !!data;
  }

  async show48DayResetInfo() {
    const { data: serverTimeData } = await this.supabase.rpc('get_current_utc_timestamp');
    const now = new Date(serverTimeData ?? new Date());

    const origin = new Date('2025-06-01T00:00:00Z');
    const cycleMs = 48 * 24 * 60 * 60 * 1000;

    const msSinceOrigin = now - origin;
    const timeToNextCycle = cycleMs - (msSinceOrigin % cycleMs);

    const daysRemaining = Math.floor(timeToNextCycle / (24 * 60 * 60 * 1000));

    const resetText = daysRemaining > 0
      ? `<strong>Season ends in:</strong> ${daysRemaining}d`
      : `<strong>Season reset is today!</strong>`;

    document.getElementById('reset48Notice').innerHTML = resetText;
  }
}