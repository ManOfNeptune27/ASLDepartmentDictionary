<script lang="ts">
	type QuizMode = {
		id: string;
		title: string;
		description: string;
	};

	let { data } = $props();

	const quizModes: QuizMode[] = [
		{
			id: 'recognize',
			title: 'Recognize signs',
			description: 'See a sign and choose the word or meaning that matches it.',
		},
		{
			id: 'handshape',
			title: 'Handshape',
			description: 'Identify the handshape used to produce a sign.',
		},
		{
			id: 'palm-orientation',
			title: 'Palm orientation',
			description: 'Identify the direction the palm faces during a sign.',
		},
		{
			id: 'location',
			title: 'Location',
			description: 'Identify where the sign is produced on or near the body.',
		},
		{
			id: 'movement',
			title: 'Movement',
			description: 'Identify the path or action of the hands in a sign.',
		},
		{
			id: 'non-manual-signals',
			title: 'Non-manual signals',
			description: 'Identify facial expressions, head movements, or body posture used with a sign.',
		},
	];

	let selectedBook = $state('');
	let selectedUnit = $state('');
	let selectedMode = $state('');
	let selectedLength = $state('');
	let answerRevealed = $state(false);
	let selectedAnswer = $state('');
	let questionIndex = $state(0);
	let score = $state(0);

	$effect(() => {
		selectedBook = data.selectedBook;
		selectedUnit = data.selectedUnit;
		selectedMode = data.selectedMode;
		selectedLength = data.selectedLength;
		answerRevealed = false;
		selectedAnswer = '';
		questionIndex = 0;
		score = 0;
	});

	const books = $derived(Object.keys(data.unitsByBook));
	const availableUnits = $derived(data.unitsByBook[selectedBook] ?? []);
	const canStart = $derived(Boolean(selectedBook && selectedUnit && selectedMode && selectedLength));
	const currentSign = $derived(data.quizSigns[questionIndex] ?? null);
	const currentMode = $derived(quizModes.find((mode) => mode.id === selectedMode));
	const correctAnswer = $derived(
		selectedMode === 'recognize' ? (currentSign?.word ?? '') : parameterValue(selectedMode),
	);
	const practiceLengths = [
		{ id: 'short', title: 'Short practice', description: 'One quarter of the unit' },
		{ id: 'medium', title: 'Medium practice', description: 'One half of the unit' },
		{ id: 'long', title: 'Long practice', description: 'The entire unit' },
	];
	const answerChoices = $derived(
		selectedMode === 'recognize'
			? Array.from(
					new Set(
						data.quizSigns
								.concat(data.choiceSigns)
								.map((sign) => sign.word)
								.filter(
									(word) =>
										word &&
										word !== currentSign?.word &&
										!areSimilarWords(word, currentSign?.word ?? ''),
								),
						),
					)
						.slice(0, 3)
						.concat(currentSign?.word ? [currentSign.word] : [])
						.sort(() => Math.random() - 0.5)
			: Array.from(
					new Set(
						data.choiceSigns
							.map((sign) => parameterValueForSign(sign, selectedMode))
							.filter((value) => value && value !== 'Not provided'),
					),
				)
					.slice(0, 3)
				.concat([parameterValue(selectedMode)])
					.sort(() => Math.random() - 0.5),
	);
	const quizComplete = $derived(questionIndex >= data.quizSigns.length);
	const parameterLabels: Record<string, string> = {
		handshape: 'handshape',
		'palm-orientation': 'palm orientation',
		location: 'location',
		movement: 'movement',
		'non-manual-signals': 'non-manual signals',
	};

	function chooseBook() {
		selectedUnit = '';
	}

	function normalizeWord(word: string) {
		return word.toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	function areSimilarWords(first: string, second: string) {
		const normalizedFirst = normalizeWord(first);
		const normalizedSecond = normalizeWord(second);
		return (
			normalizedFirst === normalizedSecond ||
			normalizedFirst.includes(normalizedSecond) ||
			normalizedSecond.includes(normalizedFirst)
		);
	}

	function parameterValue(mode: string) {
		return parameterValueForSign(currentSign, mode);
	}

	function parameterValueForSign(sign: typeof currentSign, mode: string) {
		const key =
			mode === 'palm-orientation'
				? 'palmOrientation'
				: mode === 'non-manual-signals'
					? 'nonManualSignals'
					: mode;
		return sign?.parameters[key as keyof typeof sign.parameters] || 'Not provided';
	}

	function chooseAnswer(answer: string) {
		selectedAnswer = answer;
		answerRevealed = true;
		const correctAnswer =
			selectedMode === 'recognize' ? currentSign?.word : parameterValue(selectedMode);
		if (answer === correctAnswer) score += 1;
	}

	function nextQuestion() {
		questionIndex += 1;
		answerRevealed = false;
		selectedAnswer = '';
	}
</script>

<svelte:head>
	<title>Test Your Knowledge | ASL Department Dictionary</title>
	<meta
		name="description"
		content="Choose an ASL book, unit, and study mode to test your knowledge of signs and their five parameters."
	/>
</svelte:head>

<main class="container py-5 quiz-page">
	<div class="intro text-center">
		<p class="eyebrow mb-2">Practice mode</p>
		<h1 class="mb-3">Test Your Knowledge</h1>
		<p class="lead text-muted mb-0">
			Choose what you are studying and how you would like to be tested.
		</p>
	</div>

	{#if !data.quizStarted}
		<form class="quiz-form" method="GET" action="/quiz">
		<section class="setup-card" aria-labelledby="content-heading">
			<div class="step-heading">
				<span class="step-number">1</span>
				<div>
					<h2 id="content-heading">Choose your content</h2>
					<p class="text-muted mb-0">Start with the book and unit you want to review.</p>
				</div>
			</div>

			<div class="row g-4 mt-1">
				<div class="col-md-6">
					<label class="form-label" for="book">Book</label>
					<select id="book" class="form-select" name="book" bind:value={selectedBook} onchange={chooseBook}>
						<option value="">Choose a book</option>
						{#each books as book}
							<option value={book}>{book}</option>
						{/each}
					</select>
				</div>
				<div class="col-md-6">
					<label class="form-label" for="unit">Unit</label>
					<select
						id="unit"
						class="form-select"
						name="unit"
						bind:value={selectedUnit}
						disabled={!selectedBook || availableUnits.length === 0}
					>
						<option value="">
							{selectedBook ? (availableUnits.length ? 'Choose a unit' : 'No units available') : 'Choose a book first'}
						</option>
						{#each availableUnits as unit}
							<option value={unit}>{unit}</option>
						{/each}
					</select>
				</div>
			</div>
		</section>

		<section class="setup-card" aria-labelledby="mode-heading">
			<div class="step-heading">
				<span class="step-number">2</span>
				<div>
					<h2 id="mode-heading">Choose a quiz type</h2>
					<p class="text-muted mb-0">Focus on recognizing signs or one of the five parameters.</p>
				</div>
			</div>

			<div class="mode-grid mt-4">
				{#each quizModes as mode}
					<label class:selected={selectedMode === mode.id} class="mode-option">
						<input type="radio" name="mode" value={mode.id} bind:group={selectedMode} />
						<span class="mode-copy">
							<strong>{mode.title}</strong>
							<span>{mode.description}</span>
						</span>
					</label>
				{/each}
			</div>
		</section>

		<section class="setup-card" aria-labelledby="length-heading">
			<div class="step-heading">
				<span class="step-number">3</span>
				<div>
					<h2 id="length-heading">Choose a practice length</h2>
					<p class="text-muted mb-0">Decide how much of this unit you want to practice.</p>
				</div>
			</div>

			<div class="length-grid mt-4">
				{#each practiceLengths as length}
					<label class:selected={selectedLength === length.id} class="length-option">
						<input type="radio" name="length" value={length.id} bind:group={selectedLength} />
						<span class="mode-copy">
							<strong>{length.title}</strong>
							<span>{length.description}</span>
						</span>
					</label>
				{/each}
			</div>
		</section>

		<div class="quiz-actions">
			{#if canStart}
				<p class="text-muted small mb-3">
					Your quiz will use <strong>{selectedBook}</strong>, <strong>{selectedUnit}</strong>, and
					<strong>{quizModes.find((mode) => mode.id === selectedMode)?.title}</strong> for
					<strong>{practiceLengths.find((length) => length.id === selectedLength)?.title}</strong>.
				</p>
			{:else}
				<p class="text-muted small mb-3">Choose a book, unit, and quiz type to continue.</p>
			{/if}
			<button class="btn btn-primary btn-lg px-5" type="submit" disabled={!canStart}>
				Start quiz
			</button>
		</div>
		</form>
	{:else}
		<section class="quiz-card" aria-labelledby="question-heading">
			<div class="quiz-card-header">
				<div>
					<p class="eyebrow mb-2">{selectedBook} · {selectedUnit}</p>
					<h2 id="question-heading">{currentMode?.title} quiz</h2>
				</div>
				<a class="btn btn-outline-primary" href="/quiz">Change setup</a>
			</div>

			{#if quizComplete}
				<div class="quiz-complete text-center">
					<p class="eyebrow mb-2">Practice complete</p>
					<h3>You scored {score} out of {data.quizSigns.length}</h3>
					<p class="text-muted">Nice work reviewing {selectedUnit}.</p>
					<a class="btn btn-primary" href="/quiz">Start another practice</a>
				</div>
			{:else if currentSign}
				<p class="question-prompt">
					{selectedMode === 'recognize'
						? 'What word or meaning matches this sign?'
						: `What ${parameterLabels[selectedMode]} is used in this sign?`}
				</p>
				<div class="recognition-layout question-body">
					<div class="answer-choices" aria-label="Answer choices">
						{#each answerChoices as choice}
							<button
								class:selected-answer={selectedAnswer === choice}
								class:correct-answer={answerRevealed && choice === correctAnswer}
								class:incorrect-answer={answerRevealed && selectedAnswer === choice && choice !== correctAnswer}
								class="answer-choice"
								type="button"
								disabled={answerRevealed}
								onclick={() => chooseAnswer(choice)}
							>
								{choice}
							</button>
						{/each}
						{#if answerRevealed}
							<p class:correct-text={selectedAnswer === correctAnswer} class="result-message">
								{selectedAnswer === correctAnswer
									? 'Correct!'
									: `The correct answer is ${correctAnswer}.`}
							</p>
							<button class="btn btn-primary mt-2" type="button" onclick={nextQuestion}>
								{questionIndex + 1 === data.quizSigns.length ? 'See results' : 'Next question'}
							</button>
						{/if}
					</div>
					<div class="question-media">
						<img src={currentSign.gifUrl} alt="Sign for the quiz question" />
					</div>
				</div>
			{:else}
				<p class="text-muted mb-0">
					There are no signs available for this book and unit yet. Try another selection.
				</p>
			{/if}
		</section>
	{/if}
</main>

<style>
	.quiz-page {
		max-width: 920px;
	}

	.intro {
		max-width: 650px;
		margin: 0 auto 2.5rem;
	}

	.eyebrow {
		color: var(--ocean-primary);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.setup-card {
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		background: var(--ocean-surface);
		border: 1px solid var(--ocean-border);
		border-radius: 0.75rem;
	}

	.step-heading {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}

	.step-heading h2 {
		margin: 0 0 0.25rem;
		font-size: 1.25rem;
	}

	.step-number {
		display: grid;
		flex: none;
		width: 2rem;
		height: 2rem;
		place-items: center;
		color: var(--ocean-bg);
		background: var(--ocean-primary);
		border-radius: 50%;
		font-weight: 700;
	}

	.mode-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.length-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.length-option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--ocean-bg);
		border: 1px solid var(--ocean-border);
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.length-option:hover,
	.length-option.selected {
		background: var(--ocean-surface-2);
		border-color: var(--ocean-primary);
	}

	.length-option input {
		margin-top: 0.2rem;
		accent-color: var(--ocean-primary);
	}

	.mode-option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		height: 100%;
		padding: 1rem;
		background: var(--ocean-bg);
		border: 1px solid var(--ocean-border);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: border-color 0.15s, background-color 0.15s;
	}

	.mode-option:hover,
	.mode-option.selected {
		background: var(--ocean-surface-2);
		border-color: var(--ocean-primary);
	}

	.mode-option input {
		flex: none;
		margin-top: 0.2rem;
		accent-color: var(--ocean-primary);
	}

	.mode-copy {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.mode-copy span {
		color: var(--ocean-text-muted);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.quiz-actions {
		text-align: center;
	}

	.quiz-card {
		padding: 1.5rem;
		background: var(--ocean-surface);
		border: 1px solid var(--ocean-border);
		border-radius: 0.75rem;
	}

	.quiz-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--ocean-border);
	}

	.quiz-card h2 {
		margin: 0;
		font-size: 1.35rem;
	}

	.question-prompt {
		margin: 1.5rem 0 1rem;
		font-size: 1.15rem;
		font-weight: 600;
		text-align: center;
	}

	.question-media {
		display: flex;
		justify-content: center;
		padding: 1rem;
		background: var(--ocean-bg);
		border-radius: 0.5rem;
	}

	.question-body {
		display: grid;
		gap: 1.5rem;
	}

	.recognition-layout {
		grid-template-columns: minmax(0, 1fr) minmax(280px, 1fr);
		align-items: center;
	}

	.question-media img {
		width: min(100%, 320px);
		height: 260px;
		object-fit: contain;
	}

	.answer-choices {
		display: grid;
		gap: 0.75rem;
	}

	.answer-choice {
		padding: 0.9rem 1rem;
		color: var(--ocean-text);
		background: var(--ocean-bg);
		border: 1px solid var(--ocean-border);
		border-radius: 0.5rem;
		font-size: 1rem;
		text-align: left;
		transition: background-color 0.15s, border-color 0.15s;
	}

	.answer-choice:not(:disabled):hover,
	.answer-choice.selected-answer {
		background: var(--ocean-surface-2);
		border-color: var(--ocean-primary);
	}

	.answer-choice.correct-answer {
		background: color-mix(in srgb, #198754 25%, var(--ocean-bg));
		border-color: #75b798;
	}

	.answer-choice.incorrect-answer {
		background: color-mix(in srgb, #dc3545 25%, var(--ocean-bg));
		border-color: #ea868f;
	}

	.result-message {
		margin: 0.25rem 0 0;
		color: #ea868f;
		font-weight: 600;
	}

	.result-message.correct-text {
		color: #75b798;
	}

	.quiz-complete {
		padding: 3rem 1rem 2rem;
	}

	.quiz-complete h3 {
		font-size: 1.75rem;
	}

	@media (max-width: 600px) {
		.mode-grid {
			grid-template-columns: 1fr;
		}

		.length-grid {
			grid-template-columns: 1fr;
		}

		.quiz-card-header {
			flex-direction: column;
		}

		.recognition-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
