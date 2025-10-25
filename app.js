// --- グローバル変数 (アプリケーション全体で使う情報) ---

// 画面の要素
const setSelectionScreen = document.getElementById('set-selection-screen');
const quizScreen = document.getElementById('quiz-screen');
const setList = document.getElementById('set-list');
const questionNumberEl = document.getElementById('question-number');
const problemTextEl = document.getElementById('problem-text');
const answerInputEl = document.getElementById('answer-input');
const messageAreaEl = document.getElementById('message-area');

// クイズの状態
let allProblemSets = []; // problems.jsonから読み込んだすべてのセット情報
let currentQuestions = []; // 現在挑戦中の問題リスト
let currentQuestionIndex = 0; // 現在の問題番号
let currentAnswer = ""; // ユーザーがテンキーで入力中の答え

// --- 初期化処理 ---

// ページが読み込まれたら、まず問題セットを読み込む
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * アプリケーションを初期化する
 * problems.jsonを読み込み、セット選択画面を表示する
 */
async function initializeApp() {
    try {
        const response = await fetch('problems.json');
        const data = await response.json();
        allProblemSets = data.sets;
        showSetSelectionScreen();
    } catch (error) {
        console.error('問題ファイルの読み込みに失敗しました:', error);
        setList.innerHTML = '<p>エラー：もんだいを よみこめませんでした。</p>';
    }
}

// --- 画面切り替えロジック ---

/**
 * 画面を表示/非表示にする
 * @param {HTMLElement} screenToShow - 表示する画面の要素
 */
function switchScreen(screenToShow) {
    // すべての画面を一旦隠す
    setSelectionScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    
    // 指定された画面だけを表示する
    screenToShow.classList.add('active');
}

/**
 * 問題セット選択画面を表示する
 */
function showSetSelectionScreen() {
    switchScreen(setSelectionScreen);
    
    // 選択肢のボタンをクリア
    setList.innerHTML = ''; 

    // 読み込んだ問題セット情報からボタンを作成
    allProblemSets.forEach(set => {
        const button = document.createElement('button');
        button.innerText = set.title;
        button.onclick = () => startQuiz(set); // ボタンが押されたらクイズを開始
        setList.appendChild(button);
    });
}

// --- クイズロジック ---

/**
 * クイズを開始する
 * @param {object} set - ユーザーが選択した問題セットの定義
 */
function startQuiz(set) {
    // 【変更点】
    // JSONの "questions" リストから、シャッフルして "count" 個の問題を抽出する
    
    // 1. 元の配列を壊さないようコピー(...)してシャッフル
    const shuffledQuestions = shuffleArray([...set.questions]); 
    
    // 2. config.countで指定された数だけ先頭から取り出す
    currentQuestions = shuffledQuestions.slice(0, set.config.count); 

    currentQuestionIndex = 0;
    
    // クイズ画面に切り替える
    switchScreen(quizScreen);
    
    // 最初の問題を表示する
    displayCurrentQuestion();
}

/**
 * 現在の問題を表示する
 */
function displayCurrentQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    
    // 問題番号を表示 (例: 1 / 15 もんめ)
    questionNumberEl.innerText = `${currentQuestionIndex + 1} / ${currentQuestions.length} もんめ`;
    
    // 問題文を表示 (例: 5 + 3 =)
    problemTextEl.innerText = question.q + " =";
    
    // 入力とメッセージをリセット
    clearInput();
    messageAreaEl.innerText = '';
}

/**
 * ユーザーの入力をクリアする
 */
function clearInput() {
    currentAnswer = "";
    answerInputEl.innerText = "";
}

// --- 問題生成ロジック (削除) ---
// (問題をJSONから読み込むため、動的な生成関数は不要になりました)


// --- テンキー入力処理 ---

/**
 * テンキーのボタンが押されたときの処理
 * @param {string} value - 押されたボタンの値 ('0'～'9', 'clear', 'submit')
 */
function handleKeypadInput(value) {
    if (value === 'submit') {
        // 「こたえる」ボタン
        checkAnswer();
    } else if (value === 'clear') {
        // 「けす」ボタン
        clearInput();
    } else {
        // 数字ボタン
        // 答えが長くなりすぎないように制御 (例: 3桁まで)
        if (currentAnswer.length < 3) {
            currentAnswer += value;
            answerInputEl.innerText = currentAnswer;
        }
    }
}

/**
 * 答えをチェックする
 */
function checkAnswer() {
    if (currentAnswer === "") return; // 何も入力されていなければ何もしない

    const correctAnswer = currentQuestions[currentQuestionIndex].a;
    const userAnswer = parseInt(currentAnswer, 10); // 文字列を数値に変換

    if (userAnswer === correctAnswer) {
        // --- 正解の場合 ---
        messageAreaEl.innerText = ''; // エラーメッセージを消す
        currentQuestionIndex++; // 次の問題へ

        if (currentQuestionIndex < currentQuestions.length) {
            // まだ問題が残っている場合
            displayCurrentQuestion();
        } else {
            // すべての問題に正解した場合
            showCompletion();
        }
    } else {
        // --- 不正解の場合 ---
        messageAreaEl.innerText = 'ちがうよ！もういちど かんがえてみよう';
    }
}

/**
 * 全問正解時の処理
 */
function showCompletion() {
    // 完了メッセージを表示
    alert('ぜんぶ できたね！すごい！');
    
    // 初期画面（セット選択）に戻る
    showSetSelectionScreen();
}

// --- ユーティリティ関数 (新規追加) ---

/**
 * 配列の要素をランダムにシャッフルする (フィッシャー・イェーツのシャッフル)
 * @param {Array} array - シャッフルする配列
 * @returns {Array} シャッフルされた配列
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        // 0からiまでのランダムなインデックスを生成
        const j = Math.floor(Math.random() * (i + 1));
        
        // 要素を交換
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
