/* Optional, offline controls for a cue review. The caller owns storage and export. */
globalThis.OverlayReview = (() => {
  const tweaks = [
    ['earlier', 'Start earlier', 'later'], ['later', 'Start later', 'earlier'],
    ['shorter', 'Shorter hold', 'longer'], ['longer', 'Longer hold', 'shorter'],
    ['enlarge', 'Enlarge detail', 'wider'], ['wider', 'Widen crop', 'enlarge']
  ];

  function make(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function mount(container, {id, alternatives, initial, save, player}) {
    const state = {action: null, alternativeId: null, tweaks: [], note: '', ...initial};
    state.tweaks = [...(state.tweaks || [])];
    const group = make('fieldset', undefined, 'review-decisions');
    group.append(make('legend', 'Your edit'));
    const options = [{
      action: 'keep', text: 'Use A'
    }, ...alternatives.flatMap((variant, i) => {
      const letter = String.fromCharCode(66 + i);
      return [
        {action: 'alternate', alternativeId: variant.id, text: 'Use ' + letter},
        {action: 'mix', alternativeId: variant.id, text: 'Show A then ' + letter}
      ];
    }), {action: 'revise', text: 'Revise A'}, {action: 'new_idea', text: 'Find another idea'},
    {action: 'skip', text: 'Omit overlay'}];
    for (const option of options) {
      const label = make('label', undefined, 'choice-pill');
      const input = make('input');
      input.type = 'radio'; input.name = 'direction-' + id; input.value = option.action;
      input.dataset.alternative = option.alternativeId || '';
      input.checked = state.action === option.action &&
        (option.alternativeId || null) === state.alternativeId;
      input.addEventListener('change', () => {
        state.action = option.action;
        state.alternativeId = option.alternativeId || null;
        save(state);
      });
      label.append(input, make('span', option.text));
      group.append(label);
    }

    const adjustments = make('fieldset', undefined, 'review-tweaks');
    adjustments.append(make('legend', 'Fine-tune'));
    const inputs = new Map();
    for (const [key, text, opposite] of tweaks) {
      const label = make('label', undefined, 'choice-pill');
      const input = make('input');
      input.type = 'checkbox'; input.value = key; input.checked = state.tweaks.includes(key);
      inputs.set(key, input);
      input.addEventListener('change', () => {
        if (input.checked) inputs.get(opposite).checked = false;
        state.tweaks = [...inputs].filter(([, el]) => el.checked).map(([value]) => value);
        save(state);
      });
      label.append(input, make('span', text));
      adjustments.append(label);
    }

    const textLabel = make('label', 'Edit note');
    textLabel.htmlFor = 'note-' + id;
    const notes = make('textarea');
    notes.id = textLabel.htmlFor; notes.rows = 2; notes.value = state.note;
    notes.addEventListener('input', () => { state.note = notes.value; save(state); });
    const noteHeader = make('div', undefined, 'review-note-head');
    noteHeader.append(textLabel);
    if (player) {
      const stamp = make('button', 'Add preview time', 'time-note');
      stamp.type = 'button';
      stamp.addEventListener('click', () => {
        const active = typeof player === 'function' ? player() : player;
        const t = Math.floor(active.currentTime);
        const at = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
        notes.value += (notes.value ? '\n' : '') + '[' + at + ' in ' + (active.dataset.variant || 'A') + '] ';
        state.note = notes.value; save(state); notes.focus();
        notes.setSelectionRange(notes.value.length, notes.value.length);
      });
      noteHeader.append(stamp);
    }
    container.append(group, adjustments, noteHeader, notes);
  }
  function hasFeedback(record) {
    return Boolean(record?.action || record?.tweaks?.length || record?.note?.trim());
  }
  // Preserve raw notes even when their specific wording overrides a button.
  function decision(record) {
    if (record?.action) return record.action;
    if (record?.note?.trim() || record?.tweaks?.length) return 'interpret_feedback';
    return 'keep';
  }
  return { mount, hasFeedback, decision };
})();
