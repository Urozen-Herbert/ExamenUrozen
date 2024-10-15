let timerInterval;
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = []; // To store user answers
let timerDisplay;

document.getElementById('startQuiz').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Por favor, suba un archivo Excel.');
        return;
    }
    readExcel(fileInput.files[0]);
    startTimer();
});

document.getElementById('submitQuiz').addEventListener('click', function () {
    if (currentQuestionIndex >= questions.length - 1) {
        calculateAndDisplayResult();
    } else {
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
    }
});

function readExcel(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const allQuestions = json.slice(1); // Skip header row
        questions = getRandomQuestions(allQuestions, 10);
        userAnswers = Array(questions.length).fill(null); // Initialize user answers
        currentQuestionIndex = 0; // Reset question index
        renderQuestion(currentQuestionIndex);
    };
    reader.readAsArrayBuffer(file);
}

function getRandomQuestions(questions, num) {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

function renderQuestion(index) {
    const container = document.getElementById('quizContainer');
    container.innerHTML = '';

    if (index >= questions.length) {
        disableOptions();
        calculateAndDisplayResult();
        return;
    }

    const q = questions[index];
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');
    questionDiv.dataset.correctAnswer = q[6];
    questionDiv.innerHTML = `
        <p>${index + 1}. ${q[0]}</p>
        ${q.slice(1, 6).map((opt, i) => `
            <label>
                <input type="radio" name="q${index}" value="${opt}" ${userAnswers[index] === opt ? 'checked' : ''} />
                ${opt}
            </label>
        `).join('<br/>')}
    `;
    container.appendChild(questionDiv);

    const navigationDiv = document.createElement('div');
    navigationDiv.id = 'navigation';
    navigationDiv.innerHTML = `
        <button id="nextQuestion">${index === questions.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
    `;
    container.appendChild(navigationDiv);

    document.getElementById('nextQuestion').addEventListener('click', () => {
        saveAnswer(currentQuestionIndex);
        
        // Verificar si se seleccionó una respuesta
        if (!userAnswers[currentQuestionIndex]) {
            alert('Por favor, selecciona una respuesta antes de continuar.');
            return;
        }
        
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion(currentQuestionIndex);
        } else {
            calculateAndDisplayResult();
        }
    });
}

function saveAnswer(index) {
    const selectedOption = document.querySelector(`input[name="q${index}"]:checked`);
    userAnswers[index] = selectedOption ? selectedOption.value : null;
}

function startTimer() {
    let timeLeft = 1 * 600; // 10 minutes in seconds
    timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer';
    document.body.insertBefore(timerDisplay, document.getElementById('quizContainer'));

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            disableOptions();
            calculateAndDisplayResult();
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `Tiempo restante: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            timeLeft--;
        }
    }, 1000);
}

function disableOptions() {
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = true;
    });
    document.getElementById('navigation').style.display = 'none'; // Hide the navigation buttons after time runs out
}

function calculateAndDisplayResult() {
    clearInterval(timerInterval); // Detener el temporizador
    disableOptions(); // Deshabilitar las opciones al mostrar los resultados
    const correctAnswers = [];
    const wrongAnswers = [];

    questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = q[6];
        if (userAnswer === correctAnswer) {
            correctAnswers.push({
                question: q[0],
                answer: userAnswer
            });
        } else {
            wrongAnswers.push({
                question: q[0],
                correct: correctAnswer,
                answer: userAnswer
            });
        }
    });

    const score = correctAnswers.length * 2; // Asignar 2 puntos por respuesta correcta
    document.getElementById('result').innerHTML = `
        <p>Tu puntuación es: ${score}</p>
        <div id="details"></div>
    `;
    document.getElementById('result').style.display = 'block';

    // Agregar botones para ver detalles y reiniciar
    const buttonContainer = document.createElement('div');
    buttonContainer.innerHTML = `
        <button id="showDetails">Mostrar Detalles</button>
        <button id="restartQuiz">Reiniciar Examen</button>
    `;
    document.getElementById('result').appendChild(buttonContainer);

    // Evento para mostrar detalles
    document.getElementById('showDetails').addEventListener('click', showAnswerDetails);
    
    // Evento para reiniciar el examen
    document.getElementById('restartQuiz').addEventListener('click', restartQuiz);
}

function showAnswerDetails() {
    const detailsDiv = document.getElementById('details');
    detailsDiv.innerHTML = '<h3>Detalles de tus respuestas:</h3>';

    questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = q[6];
        detailsDiv.innerHTML += `<p><strong>${q[0]}:</strong></p>`;
        
        q.slice(1, 6).forEach(opt => {
            let status = '';
            if (userAnswer === opt) {
                status = (userAnswer === correctAnswer) ? '✔️' : '❌';
            }
            detailsDiv.innerHTML += `
                <p style="color: black; font-size: small; text-align: justify;">
                    • ${opt} ${status}
                </p>
            `;
        });
    });
}

function restartQuiz() {
    // Reiniciar variables
    currentQuestionIndex = 0;
    userAnswers = [];
    timerDisplay.textContent = ''; // Limpiar el temporizador
    clearInterval(timerInterval); // Detener el temporizador
    document.getElementById('result').style.display = 'none'; // Ocultar resultados
    document.getElementById('quizContainer').innerHTML = ''; // Limpiar el contenedor de preguntas

    // Reiniciar el quiz
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        readExcel(fileInput.files[0]);
        startTimer(); // Reiniciar el temporizador
    }
}
